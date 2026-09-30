import asyncio
import time
import random
import json
from services.state import state
from mas.orchestrator import AgentOrchestrator

orchestrator = AgentOrchestrator()

async def worker_loop(worker_id: int):
    while True:
        app_id = await state.queue.get()
        try:
            req = state.requests.get(app_id)
            if not req:
                continue

            req["status"] = "PROCESSING"
            req["startedAt"] = int(time.time() * 1000)
            req["phase"] = 0
            await state.broadcast()

            # Phase 0: Memory Retrieval
            await asyncio.sleep(0.5)
            req["memoryMatches"] = orchestrator.retrieve_memory_context(req["app"])
            req["phase"] = 1
            await state.broadcast()

            # Phase 1: Risk Assessment (from raw signals now)
            await asyncio.sleep(0.5)
            req["phase"] = 2
            await state.broadcast()

            # Phase 2: Dynamic Routing (computed from raw data)
            await asyncio.sleep(0.5)
            routing = orchestrator.determine_routing(req["app"])
            req["routing"] = routing

            for a in req["agents"]:
                a["status"] = "PENDING" if a["name"] in routing["selectedPath"] else "SKIPPED"

            req["phase"] = 3
            await state.broadcast()

            # Phase 3+: DAG Agent Execution & Shared Blackboard
            agent_results = {}
            shared_state = {
                "memory_summary": " | ".join(req["memoryMatches"].get("insights", []))
            }
            req["sharedState"] = shared_state

            async def execute_agent(agent_name: str):
                agent_data = next((a for a in req["agents"] if a["name"] == agent_name), None)
                if not agent_data or agent_data["status"] != "PENDING":
                    return None

                agent_data["status"] = "ACTIVE"
                await state.broadcast()

                async def stream_callback(name, msg):
                    agent_data["output"].append(msg)
                    await state.broadcast()

                agent_instance = orchestrator.agents[agent_name]
                agent_data["cacheHit"] = False
                agent_data["isolated"] = True
                scratchpad_id = req.get("scratchpad", {}).get("id", f"SP-{req['id']}")
                record_tag = req.get("recordTag", f"TAG-{req['id']}")
                agent_data["scratchpadId"] = scratchpad_id
                agent_data["recordTag"] = record_tag
                start_t = time.time()

                # Resolve agent specific settings
                agent_settings = state.settings
                specific_key_id = state.agent_settings.get(agent_name)
                if specific_key_id:
                    try:
                        with open(state.keys_file, "r") as f:
                            keys_data = json.load(f)
                            for k in keys_data.get("keys", []):
                                if k["id"] == specific_key_id:
                                    agent_settings = k
                                    break
                    except Exception:
                        pass

                context = {
                    "app": req["app"],
                    "recordTag": record_tag,
                    "queueNumber": req.get("queueNumber", "Q#0000"),
                    "scratchpad": req.get("scratchpad", {}),
                    "tags": req.get("tags", [])
                }
                result = await agent_instance.process(context, shared_state, settings=agent_settings, callback=stream_callback)
                agent_data["elapsedMs"] = int((time.time() - start_t) * 1000)

                if agent_name in state.agent_metrics:
                    metric = state.agent_metrics[agent_name]
                    metric["totalCalls"] += 1
                    metric["tokensUsed"] += result.tokens
                    metric["avgTimeMs"] = (metric["avgTimeMs"] * (metric["totalCalls"] - 1) + agent_data["elapsedMs"]) / metric["totalCalls"]
                    metric["history"].insert(0, {
                        "appId": req["id"],
                        "timestamp": int(time.time() * 1000),
                        "inputs": req["app"],
                        "reasoning": result.reasoning,
                        "outputs": result.data,
                        "tokens": result.tokens,
                        "scratchpadId": scratchpad_id,
                        "recordTag": record_tag
                    })
                    metric["history"] = metric["history"][:20]

                agent_data["status"] = result.status
                agent_results[agent_name] = result
                
                # Write to Shared Blackboard
                shared_state[f"{agent_name}_output"] = result.data

                # Record agent output in the isolated scratchpad notes
                if "scratchpad" in req and "agentNotes" in req["scratchpad"]:
                    req["scratchpad"]["agentNotes"][agent_name] = {
                        "status": result.status,
                        "tokens": result.tokens,
                        "elapsedMs": agent_data["elapsedMs"],
                        "outputSummary": result.output[:2] if result.output else []
                    }
                agent_data["output"].insert(0, f"🔒 [Scratchpad: {scratchpad_id}] Zero-cache isolated session")
                await state.broadcast()
                
                # Delegate graph routing early exit check
                orchestrator.evaluate_graph_state(req, result)
                return result

            # --- DAG Execution Engine ---
            # Level 1
            res_kyc = await execute_agent("KYC")
            if not (res_kyc and res_kyc.status == "ERROR"):
                # Level 2 (Parallel)
                res_l2 = await asyncio.gather(execute_agent("Fraud"), execute_agent("Credit"))
                if not any(r and r.status == "ERROR" for r in res_l2):
                    # Level 3
                    res_afford = await execute_agent("Affordability")
                    if not (res_afford and res_afford.status == "ERROR"):
                        # Level 4 (Parallel)
                        res_l4 = await asyncio.gather(execute_agent("Pricing"), execute_agent("Policy"))
                        if not any(r and r.status == "ERROR" for r in res_l4):
                            # Level 5
                            await execute_agent("Explainability")

            # Decision rendering
            req["currentAgentIndex"] = -1
            decision = orchestrator.render_decision(req["app"], req["memoryMatches"], agent_results)
            req["decision"] = decision
            req["sharedState"] = shared_state
            req["agentResultsSummary"] = {
                k: {
                    "status": getattr(v, "status", "COMPLETED"),
                    "tokens": getattr(v, "tokens", 0),
                    "elapsedMs": getattr(v, "elapsedMs", 0),
                    "data": getattr(v, "data", {})
                } for k, v in agent_results.items() if v
            }

            if decision.get("type") == "MANUAL_REVIEW":
                req["status"] = "MANUAL_REVIEW"
                req["hitlPendingAt"] = int(time.time() * 1000)
                req["decision"]["hitlStatus"] = "PENDING_REVIEW"
                if "tags" in req and not any("HITL:" in t for t in req["tags"]):
                    req["tags"].append("HITL: Review Required")
                if "scratchpad" in req and "agentNotes" in req["scratchpad"]:
                    req["scratchpad"]["agentNotes"]["HITL"] = {
                        "status": "QUEUED_FOR_HUMAN",
                        "reasons": decision.get("reasons", []),
                        "timestamp": int(time.time() * 1000)
                    }
            else:
                req["status"] = "COMPLETED"
                req["completedAt"] = int(time.time() * 1000)
                # Write back to G-Memory
                orchestrator.memory.write_interaction(req["id"], req["app"], agent_results, decision)
            
            await state.broadcast()

        except Exception as e:
            print(f"[Worker {worker_id}] Error executing application {app_id}: {e}")
            import traceback
            traceback.print_exc()
            if app_id in state.requests:
                state.requests[app_id]["status"] = "ERROR"
            await state.broadcast()
        finally:
            state.queue.task_done()

def start_workers(num_workers=3):
    for i in range(num_workers):
        asyncio.create_task(worker_loop(i))
