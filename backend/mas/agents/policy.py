import asyncio
from typing import Dict, Any
from .base import BaseAgent, AgentResult

class PolicyAgent(BaseAgent):
    def __init__(self):
        super().__init__("Policy", "Regulatory compliance enforcement — RBI guidelines, internal lending policy, exposure limits.")
        
    async def _process_mock(self, context: Dict[str, Any], shared_state: Dict[str, Any], callback=None) -> AgentResult:
        app = context['app']
        income = app.get('monthlyIncome', 50000)
        amount = app.get('requestedAmount', 100000)
        emp_type = app.get('employmentType', 'Salaried')
        years_job = app.get('yearsAtCurrentJob', 2)
        num_loans = app.get('numberOfExistingLoans', 0)
        dob = app.get('dateOfBirth', '1990-01-01')
        
        reasoning = f"Policy Agent — Regulatory & Internal Policy Check\n"
        violations = []
        
        if callback: await callback(self.name, f"Checking age eligibility from DOB {dob}...")
        await asyncio.sleep(0.15)
        try:
            birth_year = int(dob.split('-')[0])
            age = 2024 - birth_year
        except:
            age = 35
        max_age = 65 if emp_type == "Self-Employed" else 60
        if age < 21 or age > max_age:
            violations.append(f"Age {age} outside eligible range (21-{max_age})")
        reasoning += f"Tool call: age_check(dob={dob})\nTool result: age={age}, max={max_age}, {'PASS' if 21 <= age <= max_age else 'FAIL'}\n"
        
        if callback: await callback(self.name, f"Validating minimum income requirement...")
        await asyncio.sleep(0.1)
        min_income = 25000 if emp_type == "Salaried" else 30000
        if income < min_income:
            violations.append(f"Monthly income ₹{income:,.0f} below minimum ₹{min_income:,.0f}")
        reasoning += f"Tool call: income_policy_check(income={income}, min={min_income})\nTool result: {'PASS' if income >= min_income else 'FAIL'}\n"
        
        if callback: await callback(self.name, f"Checking loan-to-income ratio...")
        await asyncio.sleep(0.1)
        lti = round(amount / max(income, 1), 1)
        if lti > 24:
            violations.append(f"Loan-to-income ratio {lti}x exceeds maximum 24x")
        reasoning += f"Tool call: calculator({amount} / {income})\nTool result: LTI = {lti}x, max = 24x, {'PASS' if lti <= 24 else 'FAIL'}\n"
        
        if callback: await callback(self.name, f"Checking exposure limits ({num_loans} existing loans)...")
        await asyncio.sleep(0.1)
        max_loans = 5
        if num_loans >= max_loans:
            violations.append(f"{num_loans} existing loans — exceeds max {max_loans}")
        reasoning += f"Tool call: exposure_check(existing={num_loans}, max={max_loans})\nTool result: {'PASS' if num_loans < max_loans else 'FAIL'}\n"
        
        if emp_type == "Salaried" and years_job < 1:
            violations.append(f"Employment tenure {years_job} years — minimum 1 year required for salaried")
        
        passed = len(violations) == 0
        if callback: await callback(self.name, f"Policy check {'PASSED' if passed else 'FAILED'} — {len(violations)} violations")
        
        reasoning += f"LLM Output: Policy check {'PASSED' if passed else 'FAILED'}. Violations: {violations if violations else 'None'}"
        
        return AgentResult(
            self.name, "COMPLETED", [f"Policy: {'PASS' if passed else 'FAIL'}"],
            {"policy_passed": passed, "violations": violations, "age": age, "lti_ratio": lti},
            reasoning, 0
        )
