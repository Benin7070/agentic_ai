import asyncio
import json
from typing import Dict, Any, List

class AgentResult:
    def __init__(self, agent_name: str, status: str, output: List[str], data: Dict[str, Any], reasoning: str, tokens: int):
        self.agent_name = agent_name
        self.status = status
        self.output = output
        self.data = data or {}
        self.reasoning = reasoning
        self.tokens = tokens

def calc(expression: str) -> str:
    """Evaluate a simple math expression. Input should be like '5000 / 12'."""
    try:
        allowed_chars = "0123456789+-*/(). "
        clean_expr = "".join(c for c in expression if c in allowed_chars)
        return str(eval(clean_expr))
    except Exception as e:
        return f"Error: {e}"

class BaseAgent:
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
        
    async def process(self, context: Dict[str, Any], shared_state: Dict[str, Any], settings: Dict[str, str], callback=None) -> AgentResult:
        if settings.get("provider") and settings.get("provider") != "none" and settings.get("apiKey"):
            return await self._process_llm(context, shared_state, settings, callback)
        else:
            return await self._process_mock(context, shared_state, callback)

    async def _process_mock(self, context: Dict[str, Any], shared_state: Dict[str, Any], callback=None) -> AgentResult:
        raise NotImplementedError()

    async def _process_llm(self, context: Dict[str, Any], shared_state: Dict[str, Any], settings: Dict[str, str], callback=None) -> AgentResult:
        if callback: await callback(self.name, f"Connecting to {settings['provider']}...")
        
        provider = settings['provider']
        api_key = settings['apiKey']
        
        try:
            from langchain_core.tools import tool as lc_tool
            from langchain_core.messages import SystemMessage, HumanMessage
            from langgraph.prebuilt import create_react_agent
            
            @lc_tool
            def calculator(expression: str) -> str:
                """Evaluate a mathematical expression to avoid hallucinations. Input: a math string like '5000 / 12'."""
                return calc(expression)
            
            tools = [calculator]
            
            # System prompt contains static rules and the Distilled G-Memory for caching
            system_prompt = (
                f"You are the {self.name} Agent in a multi-agent credit decisioning system.\n"
                f"Role: {self.description}\n"
                f"Rules:\n"
                f"1. Analyze the application data to DERIVE risk signals. Do NOT expect pre-computed scores.\n"
                f"2. Use the Calculator tool for any math to avoid hallucinations.\n"
                f"3. Output your assessment, reasoning, and extract a strict structured summary.\n"
                f"4. MENTIONS: If you find an inconsistency that requires another agent's attention, you MUST mention them (e.g., 'MENTION: @Fraud - Please verify this PAN mismatch'). This will be saved to G-Memory.\n\n"
                f"--- G-Memory Distilled Insights ---\n"
                f"{shared_state.get('memory_summary', 'No historical precedents available.')}\n"
                f"-----------------------------------\n"
            )
            
            if provider == 'openai':
                from langchain_openai import ChatOpenAI
                llm = ChatOpenAI(model="gpt-4o-mini", api_key=api_key, temperature=0.1)
                sys_msg = SystemMessage(content=system_prompt)
            elif provider == 'anthropic':
                from langchain_anthropic import ChatAnthropic
                llm = ChatAnthropic(model="claude-3-haiku-20240307", api_key=api_key, temperature=0.1)
                sys_msg = SystemMessage(content=system_prompt)
            else:
                raise ValueError(f"Unsupported provider: {provider}")
            
            # Create agent with the system message (LangGraph uses prompt parameter)
            agent = create_react_agent(llm, tools, prompt=sys_msg)
            
            app_data = json.dumps(context['app'], indent=2)
            upstream_state = json.dumps({k: v for k, v in shared_state.items() if k != 'memory_summary'}, indent=2)
            record_tag = context.get('recordTag', f"TAG-{context['app'].get('id', 'UNKNOWN')}")
            queue_num = context.get('queueNumber', 'Q#0000')
            scratchpad_id = context.get('scratchpad', {}).get('id', f"SP-{context['app'].get('id')}")

            user_message = (
                f"=== ISOLATED CUSTOMER SCRATCHPAD ===\n"
                f"Queue Position: {queue_num} | Record Tag: {record_tag} | Scratchpad ID: {scratchpad_id}\n"
                f"ISOLATION POLICY: Strictly evaluate ONLY this customer's application. Zero prompt-caching cross-contamination from other customer records.\n\n"
                f"Raw Application Data:\n```json\n{app_data}\n```\n\n"
                f"Shared Blackboard (From Upstream Agents for this Record):\n```json\n{upstream_state}\n```\n\n"
                f"Perform your {self.name} analysis now based strictly on this isolated record."
            )
            
            if callback: await callback(self.name, f"🔒 [Scratchpad {scratchpad_id}] Processing raw record {record_tag}...")
            
            reasoning_trace = f"Provider: {provider}\n"
            total_tokens = 0
            final_text = ""
            
            result = await agent.ainvoke({"messages": [HumanMessage(content=user_message)]})
            
            for msg in result["messages"]:
                msg_type = msg.__class__.__name__
                if msg_type == "AIMessage":
                    if msg.tool_calls:
                        for tc in msg.tool_calls:
                            reasoning_trace += f"Tool call: {tc['name']}({tc['args']})\n"
                            if callback: await callback(self.name, f"⚙ Calling {tc['name']}: {tc['args']}")
                    if msg.content:
                        final_text = msg.content if isinstance(msg.content, str) else str(msg.content)
                    if hasattr(msg, 'usage_metadata') and msg.usage_metadata:
                        total_tokens += msg.usage_metadata.get('total_tokens', 0)
                elif msg_type == "ToolMessage":
                    reasoning_trace += f"Tool result: {msg.content}\n"
                    if callback: await callback(self.name, f"📊 Result: {msg.content}")
            
            reasoning_trace += f"LLM Output: {final_text}"
            
            # Extract Mentions
            import re
            mentions = []
            mention_matches = re.finditer(r'MENTION:\s*@(\w+)[^a-zA-Z0-9](.*)', final_text)
            for m in mention_matches:
                mentions.append({"target": m.group(1), "message": m.group(2).strip()})
                
            data_out = {"processed_by": provider, "response": final_text}
            if mentions:
                data_out["mentions"] = mentions
            
            if callback: await callback(self.name, f"✅ {self.name} processing complete via {provider}.")
            
            if total_tokens == 0:
                total_tokens = len(reasoning_trace.split()) * 2
            
            return AgentResult(
                self.name, "COMPLETED", [f"{self.name} processing complete via {provider}."], 
                data_out, reasoning_trace, total_tokens
            )
            
        except Exception as e:
            err_msg = str(e)
            if callback: await callback(self.name, f"⚠️ LLM Error: {err_msg[:60]}. Falling back to rules engine...")
            try:
                mock_res = await self._process_mock(context, shared_state, callback)
                mock_res.output.insert(0, f"⚠️ Fallback to rules engine ({provider}: {err_msg[:50]}...)")
                mock_res.reasoning = f"[⚠️ LLM Fallback: {err_msg}]\n\n" + mock_res.reasoning
                return mock_res
            except Exception as mock_err:
                return AgentResult(self.name, "ERROR", [f"LLM Error: {err_msg}", f"Mock Error: {str(mock_err)}"], {}, f"Exception: {err_msg}", 0)
