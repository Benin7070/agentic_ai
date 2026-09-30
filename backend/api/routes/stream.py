import asyncio
import json
from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse
from services.state import state

router = APIRouter()

@router.get("/stream")
async def stream_events():
    q = asyncio.Queue()
    state.listeners.append(q)
    
    snapshot = {
        "type": "STATE_UPDATE",
        "requests": list(state.requests.values()),
        "isRunning": state.mas_is_running,
        "rate": state.rate,
        "riskDist": state.risk_dist,
        "settings": state.settings,
        "agentSettings": state.agent_settings,
        "agentMetrics": state.agent_metrics
    }
    await q.put(json.dumps(snapshot))
    
    async def event_generator():
        try:
            while True:
                data = await q.get()
                yield {"data": data}
        except asyncio.CancelledError:
            state.listeners.remove(q)
            
    return EventSourceResponse(event_generator())
