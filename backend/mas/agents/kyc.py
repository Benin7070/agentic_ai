import asyncio
import random
from typing import Dict, Any
from .base import BaseAgent, AgentResult

class KYCAgent(BaseAgent):
    def __init__(self):
        super().__init__("KYC", "Identity verification, PAN/Aadhaar validation, and AML screening.")
        
    async def _process_mock(self, context: Dict[str, Any], shared_state: Dict[str, Any], callback=None) -> AgentResult:
        app = context['app']
        pan = app.get('panNumber', '')
        aadhaar = app.get('aadhaarLast4', '')
        name = app.get('fullName', 'Unknown')
        dob = app.get('dateOfBirth', '')
        phone = app.get('phone', '')
        
        reasoning = f"KYC Agent — Identity Verification\n"
        reasoning += f"Applicant: {name}, DOB: {dob}\n"
        
        if callback: await callback(self.name, f"Verifying PAN {pan[:5]}XXXX{pan[-1]} against NSDL database...")
        await asyncio.sleep(0.3)
        pan_valid = len(pan) == 10 and pan[3] in "ABCFGHLJPT"
        reasoning += f"Tool call: verify_pan({pan})\nTool result: {'VALID' if pan_valid else 'INVALID'} — format check passed\n"
        
        if callback: await callback(self.name, f"Cross-referencing Aadhaar (XXXX-{aadhaar}) with UIDAI...")
        await asyncio.sleep(0.2)
        aadhaar_valid = len(aadhaar) == 4 and aadhaar.isdigit()
        reasoning += f"Tool call: verify_aadhaar(XXXX-{aadhaar})\nTool result: {'LINKED' if aadhaar_valid else 'NOT FOUND'}\n"
        
        if callback: await callback(self.name, f"Running AML/PEP screening for {name}...")
        await asyncio.sleep(0.2)
        aml_clear = random.random() > 0.05
        reasoning += f"Tool call: aml_screening({name})\nTool result: {'CLEAR' if aml_clear else 'FLAGGED — potential PEP match'}\n"
        
        if callback: await callback(self.name, f"Verifying phone {phone[:7]}XXXX ownership...")
        await asyncio.sleep(0.15)
        
        kyc_score = 100
        flags = []
        mentions = []
        if not pan_valid:
            kyc_score -= 40
            flags.append("PAN format invalid")
        if not aadhaar_valid:
            kyc_score -= 30
            flags.append("Aadhaar verification failed")
        if not aml_clear:
            kyc_score -= 50
            flags.append("AML/PEP screening flagged")
            mentions.append({"target": "Fraud", "message": "High priority: AML screening flagged for PEP. Please run deep velocity checks."})
            reasoning += "MENTION: @Fraud - High priority: AML screening flagged for PEP. Please run deep velocity checks.\n"
        
        reasoning += f"LLM Output: KYC score = {kyc_score}/100. Flags: {flags if flags else 'None'}"
        
        status = "COMPLETED"
        if callback: await callback(self.name, f"KYC verification {'passed' if kyc_score >= 60 else 'FLAGGED'} — score {kyc_score}/100")
        
        data_out = {"kyc_score": kyc_score, "kyc_passed": kyc_score >= 60, "pan_valid": pan_valid, "aadhaar_linked": aadhaar_valid, "aml_clear": aml_clear, "flags": flags}
        if mentions:
            data_out["mentions"] = mentions

        return AgentResult(
            self.name, status, [f"KYC score: {kyc_score}/100" + (" (Passed)" if kyc_score >= 60 else f" (Flagged: {', '.join(flags)})")],
            data_out,
            reasoning, 0
        )
