import time
from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel
from services.state import state

router = APIRouter()

class ControlCommand(BaseModel):
    action: str
    rate: Optional[int] = None
    riskDist: Optional[dict] = None
    appId: Optional[str] = None
    verdict: Optional[str] = None
    reviewer: Optional[str] = None
    notes: Optional[str] = None
    interestRate: Optional[float] = None
    approvedAmount: Optional[float] = None

@router.post("/control")
async def control_sim(cmd: ControlCommand):
    if cmd.action == "toggle":
        state.is_running = not state.is_running
    elif cmd.action == "set_rate" and cmd.rate is not None:
        state.rate = cmd.rate
    elif cmd.action == "set_dist" and cmd.riskDist is not None:
        state.risk_dist = cmd.riskDist
    elif cmd.action == "clear":
        active_ids = {rid: r for rid, r in state.requests.items() if r["status"] in ["QUEUED", "PROCESSING", "MANUAL_REVIEW"]}
        state.requests = active_ids
    elif cmd.action == "generate_one":
        from services.simulation import queue_new_application
        await queue_new_application()
    elif cmd.action == "human_decision" and cmd.appId:
        req = state.requests.get(cmd.appId)
        if req:
            verdict = cmd.verdict or "APPROVED"
            reviewer = cmd.reviewer or "Senior Credit Underwriter #402"
            notes = cmd.notes or "Supervisory approval granted following human risk assessment."
            
            # Ensure decision exists
            if not req.get("decision"):
                req["decision"] = {
                    "type": verdict,
                    "confidence": 1.0,
                    "reasons": []
                }
            
            original_type = req["decision"].get("type", "MANUAL_REVIEW")
            req["decision"]["originalType"] = original_type
            req["decision"]["type"] = verdict
            req["decision"]["humanOverride"] = True
            req["decision"]["hitlStatus"] = "REVIEWED"
            req["decision"]["humanReview"] = {
                "verdict": verdict,
                "reviewer": reviewer,
                "notes": notes,
                "reviewedAt": int(time.time() * 1000),
                "originalDecision": original_type
            }

            if cmd.interestRate is not None:
                req["decision"]["interestRate"] = cmd.interestRate
            elif verdict == "APPROVED" and "interestRate" not in req["decision"]:
                req["decision"]["interestRate"] = 10.5

            if cmd.approvedAmount is not None:
                req["decision"]["approvedAmount"] = cmd.approvedAmount
            elif verdict == "APPROVED" and "approvedAmount" not in req["decision"]:
                req["decision"]["approvedAmount"] = req["app"].get("requestedAmount", 100000)

            # Prepend human decision reason
            reasons = req["decision"].get("reasons", [])
            reasons.insert(0, f"👤 Human Underwriter Verdict ({reviewer}): {verdict} — {notes}")
            req["decision"]["reasons"] = reasons

            req["status"] = "COMPLETED"
            req["completedAt"] = int(time.time() * 1000)

            # Update tags
            if "tags" in req:
                req["tags"] = [t for t in req["tags"] if not t.startswith("HITL:")]
                req["tags"].append(f"HITL: {verdict}")

            # Update scratchpad note
            if "scratchpad" in req and "agentNotes" in req["scratchpad"]:
                req["scratchpad"]["agentNotes"]["HITL"] = {
                    "status": f"HUMAN_{verdict}",
                    "reviewer": reviewer,
                    "notes": notes,
                    "timestamp": int(time.time() * 1000)
                }

            # Write interaction to G-Memory
            from mas.executor import orchestrator
            agent_traces = req.get("agentResultsSummary", {})
            orchestrator.memory.write_interaction(req["id"], req["app"], agent_traces, req["decision"])

    elif cmd.action == "flag_for_review" and cmd.appId:
        req = state.requests.get(cmd.appId)
        if req:
            req["status"] = "MANUAL_REVIEW"
            req["hitlPendingAt"] = int(time.time() * 1000)
            if not req.get("decision"):
                req["decision"] = {
                    "type": "MANUAL_REVIEW",
                    "confidence": 0.5,
                    "reasons": ["Application manually referred to Human Underwriting by operator."]
                }
            else:
                req["decision"]["originalType"] = req["decision"].get("type")
                req["decision"]["type"] = "MANUAL_REVIEW"
                req["decision"]["reasons"].insert(0, "Application manually referred for Human Underwriter review.")
            
            req["decision"]["hitlStatus"] = "PENDING_REVIEW"
            if "tags" in req and not any("HITL:" in t for t in req["tags"]):
                req["tags"].append("HITL: Review Required")
        
    await state.broadcast()
    return {"status": "ok"}
