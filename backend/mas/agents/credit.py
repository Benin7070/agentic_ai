import asyncio
import random
from typing import Dict, Any
from .base import BaseAgent, AgentResult

class CreditAgent(BaseAgent):
    def __init__(self):
        super().__init__("Credit", "Creditworthiness assessment — bureau pull simulation and score derivation.")
        
    async def _process_mock(self, context: Dict[str, Any], shared_state: Dict[str, Any], callback=None) -> AgentResult:
        app = context['app']
        income = app.get('monthlyIncome', 50000)
        num_loans = app.get('numberOfExistingLoans', 0)
        years_job = app.get('yearsAtCurrentJob', 2)
        bounces = app.get('numberOfBounces', 0)
        cc = app.get('creditCardOutstanding', 0)
        res_status = app.get('residentialStatus', 'Rented')
        
        reasoning = f"Credit Agent — Bureau Pull & Score Derivation\n"
        
        if callback: await callback(self.name, f"Pulling CIBIL TransUnion bureau report...")
        await asyncio.sleep(0.3)
        
        base_score = 650
        income_adj = 30 if income > 100000 else (15 if income > 60000 else (0 if income > 35000 else -20))
        reasoning += f"Tool call: calculator(base_score={base_score} + income_adj={income_adj})\n"
        
        job_adj = min(years_job * 5, 40)
        reasoning += f"Tool call: calculator(job_stability_bonus = min({years_job} * 5, 40) = {job_adj})\n"
        
        bounce_penalty = bounces * 25
        reasoning += f"Tool call: calculator(bounce_penalty = {bounces} * 25 = {bounce_penalty})\n"
        
        loan_penalty = max(0, (num_loans - 2) * 15)
        cc_penalty = 20 if cc > income * 2 else (10 if cc > income else 0)
        res_bonus = 15 if res_status == "Owned" else (5 if res_status == "Family" else 0)
        
        credit_score = max(300, min(900, base_score + income_adj + job_adj - bounce_penalty - loan_penalty - cc_penalty + res_bonus))
        credit_score += random.randint(-15, 15)
        credit_score = max(300, min(900, credit_score))
        
        if callback: await callback(self.name, f"Bureau report received. Derived credit score: {credit_score}")
        await asyncio.sleep(0.2)
        
        if credit_score >= 750: grade = "A"
        elif credit_score >= 650: grade = "B"
        elif credit_score >= 550: grade = "C"
        else: grade = "D"
        
        tradelines = num_loans + (1 if cc > 0 else 0)
        
        if callback: await callback(self.name, f"Credit grade: {grade} | {tradelines} tradelines | Score: {credit_score}")
        
        reasoning += f"Tool result: credit_score = {credit_score}\n"
        reasoning += f"LLM Output: Credit Score {credit_score} (Grade {grade}). {tradelines} tradelines found. " \
                     f"{'Credit approved — score meets threshold.' if credit_score >= 600 else 'Credit below threshold — high risk.'}"
        
        return AgentResult(
            self.name, "COMPLETED", [f"Credit score: {credit_score} (Grade {grade})"],
            {"credit_score": credit_score, "grade": grade, "tradelines": tradelines, "approved": credit_score >= 600},
            reasoning, 0
        )
