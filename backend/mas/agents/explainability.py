import asyncio
from typing import Dict, Any
from .base import BaseAgent, AgentResult

class ExplainabilityAgent(BaseAgent):
    def __init__(self):
        super().__init__("Explainability", "Human-readable decision summary synthesizing all prior agent traces.")
        
    async def _process_mock(self, context: Dict[str, Any], shared_state: Dict[str, Any], callback=None) -> AgentResult:
        app = context['app']
        name = app.get('fullName', 'Applicant')
        amount = app.get('requestedAmount', 0)
        purpose = app.get('loanPurpose', 'General')
        
        if callback: await callback(self.name, f"Synthesizing all agent traces for {name}...")
        await asyncio.sleep(0.3)
        if callback: await callback(self.name, f"Generating human-readable explanation...")
        await asyncio.sleep(0.2)
        
        summary = (
            f"Application by {name} for ₹{amount:,.0f} ({purpose}). "
            f"KYC verified. Credit and affordability assessments completed. "
            f"All upstream agent traces have been reviewed and consolidated into the final decision."
        )
        
        reasoning = f"Explainability Agent — Decision Summary\n"
        reasoning += f"LLM Output: {summary}"
        
        if callback: await callback(self.name, "Explanation generated successfully.")
        
        return AgentResult(
            self.name, "COMPLETED", ["Explanation complete."],
            {"summary": summary, "explanation_ready": True},
            reasoning, 0
        )
