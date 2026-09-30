import asyncio
from typing import Dict, Any
from .base import BaseAgent, AgentResult

class PricingAgent(BaseAgent):
    def __init__(self):
        super().__init__("Pricing", "Risk-adjusted interest rate computation and approved limit determination.")
        
    async def _process_mock(self, context: Dict[str, Any], shared_state: Dict[str, Any], callback=None) -> AgentResult:
        app = context['app']
        income = app.get('monthlyIncome', 50000)
        amount = app.get('requestedAmount', 100000)
        bounces = app.get('numberOfBounces', 0)
        num_loans = app.get('numberOfExistingLoans', 0)
        emis = app.get('existingEMIs', 0)
        years_job = app.get('yearsAtCurrentJob', 2)
        
        reasoning = f"Pricing Agent — Rate & Limit Determination\n"
        
        if callback: await callback(self.name, f"Computing base rate from repo rate + spread...")
        await asyncio.sleep(0.2)
        base_rate = 9.0
        reasoning += f"Tool call: get_base_rate()\nTool result: base_rate = {base_rate}% (repo 6.5% + spread 2.5%)\n"
        
        if callback: await callback(self.name, f"Calculating risk premium from applicant signals...")
        await asyncio.sleep(0.15)
        
        dti = emis / max(income, 1)
        risk_premium = 0.0
        risk_premium += min(bounces * 0.5, 2.0)
        risk_premium += min(num_loans * 0.3, 1.5)
        risk_premium += 1.0 if dti > 0.4 else (0.5 if dti > 0.3 else 0)
        risk_premium -= min(years_job * 0.15, 1.0)
        risk_premium = round(max(0, risk_premium), 2)
        reasoning += f"Tool call: calculator(bounce_premium={min(bounces*0.5, 2.0)} + loan_premium={min(num_loans*0.3, 1.5)} + dti_premium={'1.0' if dti > 0.4 else '0.5' if dti > 0.3 else '0'} - stability_discount={min(years_job*0.15, 1.0)})\nTool result: risk_premium = {risk_premium}%\n"
        
        final_rate = round(base_rate + risk_premium, 2)
        
        if callback: await callback(self.name, f"Determining approved loan amount...")
        await asyncio.sleep(0.15)
        max_affordable_emi = income * 0.5 - emis
        max_loan = max(0, max_affordable_emi * 36)
        approved_amount = min(amount, max_loan)
        approved_amount = round(approved_amount / 1000) * 1000
        
        reasoning += f"Tool call: calculator(max_emi = {income} * 0.5 - {emis} = {max_affordable_emi:.0f}, max_loan = {max_affordable_emi:.0f} * 36 = {max_loan:.0f})\nTool result: approved_amount = ₹{approved_amount:,.0f}\n"
        reasoning += f"LLM Output: Final rate: {final_rate}% (base {base_rate}% + risk premium {risk_premium}%). Approved: ₹{approved_amount:,.0f} of ₹{amount:,.0f} requested."
        
        if callback: await callback(self.name, f"Final pricing: {final_rate}% | Approved: ₹{approved_amount:,.0f}")
        
        return AgentResult(
            self.name, "COMPLETED", [f"Rate: {final_rate}%, Approved: ₹{approved_amount:,.0f}"],
            {"interest_rate": final_rate, "base_rate": base_rate, "risk_premium": risk_premium,
             "approved_amount": approved_amount, "requested_amount": amount},
            reasoning, 0
        )
