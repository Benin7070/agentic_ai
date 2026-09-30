import asyncio
from typing import Dict, Any
from .base import BaseAgent, AgentResult

class FraudAgent(BaseAgent):
    def __init__(self):
        super().__init__("Fraud", "Transaction anomaly detection, behavioral analysis, and velocity checks.")
        
    async def _process_mock(self, context: Dict[str, Any], shared_state: Dict[str, Any], callback=None) -> AgentResult:
        app = context['app']
        bounces = app.get('numberOfBounces', 0)
        num_loans = app.get('numberOfExistingLoans', 0)
        cc_outstanding = app.get('creditCardOutstanding', 0)
        income = app.get('monthlyIncome', 50000)
        salary_var = app.get('salaryDayVariance', 2)
        emp_type = app.get('employmentType', 'Salaried')
        
        reasoning = f"Fraud Agent — Behavioral & Transaction Analysis\n"
        
        if callback: await callback(self.name, f"Analyzing cheque bounce patterns ({bounces} bounces in 12 months)...")
        await asyncio.sleep(0.2)
        bounce_score = min(bounces * 0.12, 0.5)
        reasoning += f"Tool call: analyze_bounce_pattern(bounces={bounces})\nTool result: bounce_risk_score = {bounce_score:.2f}\n"
        
        if callback: await callback(self.name, f"Checking credit appetite velocity ({num_loans} active loans)...")
        await asyncio.sleep(0.2)
        velocity_score = min(num_loans * 0.08, 0.3)
        reasoning += f"Tool call: credit_velocity_check(loans={num_loans}, cc_outstanding={cc_outstanding})\nTool result: velocity_risk = {velocity_score:.2f}\n"
        
        if callback: await callback(self.name, f"Analyzing salary credit consistency (variance: {salary_var} days)...")
        await asyncio.sleep(0.15)
        consistency_score = min(salary_var * 0.02, 0.2)
        reasoning += f"Tool call: income_consistency_check(salary_variance={salary_var}, emp_type={emp_type})\nTool result: inconsistency_risk = {consistency_score:.2f}\n"
        
        cc_ratio = cc_outstanding / max(income, 1)
        cc_anomaly = 0.1 if cc_ratio > 2 else (0.05 if cc_ratio > 1 else 0)
        reasoning += f"Tool call: calculator({cc_outstanding} / {income})\nTool result: CC-to-income ratio = {cc_ratio:.2f}\n"
        
        fraud_risk = round(min(bounce_score + velocity_score + consistency_score + cc_anomaly, 1.0), 3)
        
        flags = []
        if bounces >= 3: flags.append(f"High bounce count ({bounces})")
        if num_loans >= 4: flags.append(f"Excessive active loans ({num_loans})")
        if cc_ratio > 2: flags.append(f"CC outstanding {cc_ratio:.1f}x income")
        if salary_var >= 8: flags.append(f"Irregular salary credits (±{salary_var} days)")
        
        risk_label = "HIGH" if fraud_risk > 0.4 else ("MEDIUM" if fraud_risk > 0.2 else "LOW")
        reasoning += f"LLM Output: Composite fraud risk = {fraud_risk} ({risk_label}). Flags: {flags if flags else 'None'}"
        
        if callback: await callback(self.name, f"Fraud risk computed: {fraud_risk*100:.1f}% ({risk_label})")
        
        return AgentResult(
            self.name, "COMPLETED", [f"Fraud risk: {fraud_risk*100:.1f}%"],
            {"fraud_risk": fraud_risk, "risk_label": risk_label, "flags": flags,
             "bounce_score": bounce_score, "velocity_score": velocity_score},
            reasoning, 0
        )
