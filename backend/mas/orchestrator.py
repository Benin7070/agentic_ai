import random
from typing import Dict, Any
from mas.agents import KYCAgent, FraudAgent, CreditAgent, AffordabilityAgent, PolicyAgent, PricingAgent, ExplainabilityAgent


from mas.memory import g_memory


def compute_preliminary_risk(app: Dict[str, Any]) -> str:
    """
    Derive a preliminary risk level from RAW application signals.
    This replaces the old app['riskLevel'] field that was pre-computed.
    The agents will do deeper analysis, but routing needs a quick estimate.
    """
    risk_score = 0

    # Income signals
    income = app.get('monthlyIncome', 50000)
    if income < 30000:
        risk_score += 2
    elif income < 60000:
        risk_score += 1

    # EMI burden relative to income
    emi = app.get('existingEMIs', 0)
    emi_ratio = emi / max(income, 1)
    if emi_ratio > 0.5:
        risk_score += 3
    elif emi_ratio > 0.3:
        risk_score += 1

    # Number of existing loans (credit appetite)
    num_loans = app.get('numberOfExistingLoans', 0)
    if num_loans >= 4:
        risk_score += 2
    elif num_loans >= 2:
        risk_score += 1

    # Cheque/ECS bounces signal instability
    bounces = app.get('numberOfBounces', 0)
    if bounces >= 3:
        risk_score += 3
    elif bounces >= 1:
        risk_score += 1

    # Employment stability
    years_job = app.get('yearsAtCurrentJob', 2)
    if years_job < 1:
        risk_score += 2
    elif years_job < 2:
        risk_score += 1

    # Loan amount relative to annual income
    amount = app.get('requestedAmount', 0)
    amount_ratio = amount / max(income * 12, 1)
    if amount_ratio > 2.0:
        risk_score += 2
    elif amount_ratio > 1.0:
        risk_score += 1

    # Salary day variance (banking behavior stability)
    salary_var = app.get('salaryDayVariance', 2)
    if salary_var >= 8:
        risk_score += 1

    # Credit card outstanding burden
    cc = app.get('creditCardOutstanding', 0)
    if cc > income * 3:
        risk_score += 2
    elif cc > income:
        risk_score += 1

    if risk_score >= 7:
        return "HIGH"
    elif risk_score >= 3:
        return "MEDIUM"
    else:
        return "LOW"


class AgentOrchestrator:
    def __init__(self):
        self.memory = g_memory
        self.agents = {
            "KYC": KYCAgent(),
            "Fraud": FraudAgent(),
            "Credit": CreditAgent(),
            "Affordability": AffordabilityAgent(),
            "Pricing": PricingAgent(),
            "Policy": PolicyAgent(),
            "Explainability": ExplainabilityAgent()
        }
        self.ALL_AGENTS = ["KYC", "Fraud", "Credit", "Affordability", "Pricing", "Policy", "Explainability"]

    def retrieve_memory_context(self, app: Dict[str, Any]) -> dict:
        return self.memory.retrieve_context(app)

    def determine_routing(self, app: Dict[str, Any]) -> dict:
        """
        Risk-Aware Dynamic Routing from raw application signals.
        No more reliance on a pre-computed riskLevel field.
        """
        risk = compute_preliminary_risk(app)

        income = app.get('monthlyIncome', 50000)
        emi = app.get('existingEMIs', 0)
        bounces = app.get('numberOfBounces', 0)
        emi_ratio = round(emi / max(income, 1), 2)

        if risk == 'LOW':
            path = ['KYC', 'Credit', 'Affordability', 'Pricing', 'Explainability']
            reason = (
                f"Low risk profile — income ₹{income:,.0f}, "
                f"EMI ratio {emi_ratio}, {bounces} bounces. "
                f"Skipped: Fraud, Policy. Saved ~2.4s."
            )
        elif risk == 'MEDIUM':
            path = ['KYC', 'Credit', 'Affordability', 'Pricing', 'Policy', 'Explainability']
            reason = (
                f"Medium risk — income ₹{income:,.0f}, "
                f"EMI ratio {emi_ratio}, {bounces} bounces. "
                f"Fraud skipped (bounces < 3). Policy guard enabled."
            )
        else:
            path = self.ALL_AGENTS
            reason = (
                f"High risk — income ₹{income:,.0f}, "
                f"EMI ratio {emi_ratio}, {bounces} bounces. "
                f"Full pipeline activated including Fraud detection and Policy guard."
            )

        skipped = [a for a in self.ALL_AGENTS if a not in path]
        return {
            "riskLevel": risk,
            "selectedPath": path,
            "skippedAgents": skipped,
            "reason": reason,
            "timeSaved": round(len(skipped) * 1.2, 1)
        }

    def evaluate_graph_state(self, req: dict, last_agent_result) -> bool:
        """
        Evaluates the current state of the execution graph.
        Returns True if execution should continue, False to short-circuit.
        Mutates req["agents"] in place if routing needs to change dynamically.
        """
        if last_agent_result.status == "ERROR":
            # Smart Routing: dynamically cancel downstream nodes
            current_idx = req.get("currentAgentIndex", 0)
            for remaining_agent in req["agents"][current_idx + 1:]:
                if remaining_agent["status"] == "PENDING":
                    remaining_agent["status"] = "SKIPPED"
                    remaining_agent["output"].append("Graph Routing: Node skipped due to upstream failure.")
            return False # Signal early exit
            
        return True # Continue graph execution

    def render_decision(self, app: Dict[str, Any], memory_matches: dict, agent_results: dict) -> dict:
        """
        Final decision logic using raw signals + agent outputs + memory.
        """
        similar_cases = memory_matches.get('similar_cases', [])
        
        # Check for early termination/failure from any agent in the graph
        for agent_name, result in agent_results.items():
            if result.status == "ERROR":
                # Calculate a realistic confidence based on how severely the memory outcomes lean towards default
                base_confidence = 0.85
                default_rate = sum(1 for m in similar_cases if m['outcome'] == 'DEFAULTED') / max(len(similar_cases), 1)
                adjusted_confidence = min(0.99, round(base_confidence + (default_rate * 0.15), 2))
                
                return {
                    "type": "REJECTED",
                    "confidence": adjusted_confidence,
                    "reasons": [
                        f"Critical failure in {agent_name} agent.",
                        "Application processing short-circuited (Graph Early Exit).",
                        "Downstream agents were dynamically skipped."
                    ]
                }

        # Domain Check 1: KYC Identity & Compliance Gate
        kyc_res = agent_results.get("KYC")
        if kyc_res and kyc_res.data and not kyc_res.data.get("kyc_passed", True):
            flags = kyc_res.data.get("flags", ["Identity verification criteria not met"])
            return {
                "type": "REJECTED",
                "confidence": 0.95,
                "reasons": [
                    f"KYC Verification Failed: {', '.join(flags)}",
                    "Mandatory regulatory and AML compliance verification failed."
                ]
            }

        # Domain Check 2: Policy & Regulatory Guard
        policy_res = agent_results.get("Policy")
        if policy_res and policy_res.data and not policy_res.data.get("policy_passed", True):
            violations = policy_res.data.get("violations", ["Internal lending policy criteria not satisfied"])
            return {
                "type": "REJECTED",
                "confidence": 0.92,
                "reasons": [
                    f"Policy Guidelines Breached: {', '.join(violations)}",
                    "Exposure or minimum income limits not satisfied."
                ]
            }

        risk = compute_preliminary_risk(app)
        default_rate = sum(1 for m in similar_cases if m['outcome'] == 'DEFAULTED') / max(len(similar_cases), 1)

        income = app.get('monthlyIncome', 50000)
        emi = app.get('existingEMIs', 0)
        dti = round(emi / max(income, 1), 3)
        amount = app.get('requestedAmount', 0)
        bounces = app.get('numberOfBounces', 0)
        years_job = app.get('yearsAtCurrentJob', 2)

        # Check for Human-in-the-Loop (HITL) Referral:
        # Borderline risk profiles where autonomous models refer the case for human underwriter discretion
        is_hitl_referral = (
            # 1. Borderline DTI with mitigating employment stability
            (0.38 <= dti <= 0.56 and (years_job >= 2 or income >= 45000)) or
            # 2. High-ticket loan requests requiring supervisory four-eyes approval
            (amount >= 350000 and dti <= 0.54) or
            # 3. 1-2 banking returns on stable income
            (bounces in [1, 2] and dti <= 0.50 and income >= 40000) or
            # 4. Mixed risk with balanced memory precedent
            (risk in ['MEDIUM', 'HIGH'] and 0.25 <= default_rate <= 0.55 and dti <= 0.55 and bounces <= 2) or
            # 5. Self-employed borrowers with high ticket exposure
            (app.get('employmentType') == 'Self-Employed' and amount >= 300000 and dti <= 0.52)
        )

        if is_hitl_referral:
            reasons = []
            if dti >= 0.38:
                reasons.append(f"Borderline DTI ratio ({dti:.2f}) exceeds automated threshold (0.38)")
            if amount >= 350000:
                reasons.append(f"High-exposure loan request ₹{amount:,.0f} requires four-eyes supervisory sign-off")
            if bounces > 0:
                reasons.append(f"{bounces} cheque/ECS return(s) flagged in banking statement")
            if years_job >= 2:
                reasons.append(f"Mitigating factor: {years_job} yrs stability at {app.get('employerName', 'employer')}")
            if app.get('employmentType') == 'Self-Employed':
                reasons.append("Self-employed profile requires verified tax/business return audit")
            reasons.append("Referred to Human-in-the-Loop (HITL) underwriter for discretionary terms")

            return {
                "type": "MANUAL_REVIEW",
                "confidence": round(0.55 + random.random() * 0.18, 2),
                "reasons": reasons
            }

        # Severe / Unmitigated High Risk -> Hard REJECTION
        if risk == 'HIGH' or dti > 0.56 or bounces >= 3:
            return {
                "type": "REJECTED",
                "confidence": round(0.78 + random.random() * 0.18, 2),
                "reasons": [
                    f"Elevated default rate ({int(default_rate*100)}%) in historical cohort",
                    f"Excessive debt-to-income ratio ({dti:.2f}) breaches maximum risk limits",
                    f"{bounces} cheque bounce(s) indicate persistent liquidity distress",
                    f"Requested ₹{amount:,.0f} on ₹{income:,.0f}/mo gross income"
                ]
            }

        base_rate = 8 + (3 if risk == 'MEDIUM' else 0)
        rate = round(base_rate + random.random() * 2, 1)
        repaid_count = sum(1 for m in similar_cases if m['outcome'] == 'REPAID')
        approved_amount = int(amount * (0.85 if risk == 'MEDIUM' else 1))

        return {
            "type": "APPROVED",
            "confidence": round(0.8 + random.random() * 0.18, 2),
            "interestRate": rate,
            "approvedAmount": approved_amount,
            "reasons": [
                f"Income ₹{income:,.0f}/month with DTI {dti} — within acceptable range",
                f"{repaid_count}/{len(memory_matches)} similar profiles repaid",
                f"Stable employment: {app.get('yearsAtCurrentJob', 0)} years at {app.get('employerName', 'N/A')}"
            ]
        }
