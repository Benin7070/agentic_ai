import asyncio
from typing import Dict, Any
from .base import BaseAgent, AgentResult

class AffordabilityAgent(BaseAgent):
    def __init__(self):
        super().__init__("Affordability", "Repayment capacity analysis — DTI calculation, stress testing, disposable income.")
        
    async def _process_mock(self, context: Dict[str, Any], shared_state: Dict[str, Any], callback=None) -> AgentResult:
        app = context['app']
        income = app.get('monthlyIncome', 50000)
        emis = app.get('existingEMIs', 0)
        amount = app.get('requestedAmount', 100000)
        tenure = app.get('requestedTenureMonths', 36)
        
        reasoning = f"Affordability Agent — Repayment Capacity Analysis\n"
        
        if callback: await callback(self.name, f"Calculating current debt-to-income ratio...")
        await asyncio.sleep(0.2)
        current_dti = round(emis / max(income, 1), 3)
        reasoning += f"Tool call: calculator({emis} / {income})\nTool result: current_dti = {current_dti}\n"
        
        if callback: await callback(self.name, f"Estimating new EMI for ₹{amount:,.0f} over {tenure} months...")
        await asyncio.sleep(0.15)
        estimated_rate = 12.0
        new_emi = round(amount * (1 + estimated_rate/100 * tenure/12) / tenure, 2)
        reasoning += f"Tool call: calculator({amount} * (1 + {estimated_rate}/100 * {tenure}/12) / {tenure})\nTool result: estimated_new_emi = ₹{new_emi:,.0f}\n"
        
        total_emi = emis + new_emi
        proposed_dti = round(total_emi / max(income, 1), 3)
        reasoning += f"Tool call: calculator(({emis} + {new_emi}) / {income})\nTool result: proposed_dti = {proposed_dti}\n"
        
        if callback: await callback(self.name, f"Computing disposable income after all EMIs...")
        await asyncio.sleep(0.15)
        disposable = round(income - total_emi, 2)
        min_disposable = 15000
        reasoning += f"Tool call: calculator({income} - {total_emi})\nTool result: disposable_income = ₹{disposable:,.0f}\n"
        
        if callback: await callback(self.name, f"Stress testing: 20% income reduction scenario...")
        await asyncio.sleep(0.15)
        
        # Read from Shared Blackboard (Pillar 1)
        fraud_risk = shared_state.get('Fraud_output', {}).get('fraud_risk', 'LOW')
        credit_score = shared_state.get('Credit_output', {}).get('credit_score', 650)
        
        # Dynamically adjust stress thresholds based on upstream agent signals
        stress_factor = 0.8
        if fraud_risk == 'HIGH' or credit_score < 600:
            stress_factor = 0.65
            if callback: await callback(self.name, f"⚠ Upstream High Risk detected (Score: {credit_score}, Fraud: {fraud_risk}). Applying harsh 35% income stress...")
            reasoning += "Upstream signals indicated high risk. Stress factor increased to 0.65.\n"
            
        stressed_income = income * stress_factor
        stressed_dti = round(total_emi / max(stressed_income, 1), 3)
        stressed_disposable = round(stressed_income - total_emi, 2)
        reasoning += f"Tool call: calculator({total_emi} / ({income} * {stress_factor}))\nTool result: stressed_dti = {stressed_dti}\n"
        
        can_afford = proposed_dti < 0.55 and disposable > min_disposable
        stress_passed = stressed_dti < 0.7 and stressed_disposable > 10000
        
        verdict = "AFFORDABLE" if can_afford and stress_passed else ("MARGINAL" if can_afford else "UNAFFORDABLE")
        
        if callback: await callback(self.name, f"Verdict: {verdict} — DTI {proposed_dti}, disposable ₹{disposable:,.0f}")
        
        reasoning += f"LLM Output: Verdict: {verdict}. Current DTI: {current_dti}, Proposed DTI: {proposed_dti}. " \
                     f"Disposable income: ₹{disposable:,.0f}. Stress test: {'PASSED' if stress_passed else 'FAILED'}."
        
        return AgentResult(
            self.name, "COMPLETED", [f"Affordability: {verdict}"],
            {"current_dti": current_dti, "proposed_dti": proposed_dti, "new_emi": new_emi,
             "disposable_income": disposable, "stress_test_passed": stress_passed, "verdict": verdict},
            reasoning, 0
        )
