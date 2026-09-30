import json
from fastapi import APIRouter, Request
from pydantic import BaseModel
from services.state import state, KEYS_FILE

router = APIRouter()

class TestKeyRequest(BaseModel):
    provider: str
    apiKey: str

@router.post("/test-key")
async def test_key(req: TestKeyRequest):
    if req.provider == "none":
        return {"status": "ok"}
        
    try:
        if req.provider == "openai":
            from langchain_openai import ChatOpenAI
            llm = ChatOpenAI(api_key=req.apiKey, model="gpt-4o-mini", max_tokens=5)
            await llm.ainvoke("Hi")
        elif req.provider == "anthropic":
            from langchain_anthropic import ChatAnthropic
            llm = ChatAnthropic(api_key=req.apiKey, model="claude-3-haiku-20240307", max_tokens=5)
            await llm.ainvoke("Hi")
        return {"status": "ok"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.post("/settings")
async def update_settings(request: Request):
    data = await request.json()
    state.settings["provider"] = data.get("provider", "none")
    state.settings["apiKey"] = data.get("apiKey", "")
    state.settings["configName"] = data.get("configName", "Default")
    
    try:
        saved_data = {}
        if KEYS_FILE.exists():
            with open(KEYS_FILE, "r") as f:
                saved_data = json.load(f)
        saved_data["active"] = state.settings
        with open(KEYS_FILE, "w") as f:
            json.dump(saved_data, f, indent=2)
    except Exception as e:
        print(f"Failed to save settings: {e}")

    await state.broadcast()
    return {"status": "ok"}

@router.post("/agent-settings")
async def update_agent_settings(request: Request):
    data = await request.json()
    state.agent_settings = data
    
    try:
        saved_data = {}
        if KEYS_FILE.exists():
            with open(KEYS_FILE, "r") as f:
                saved_data = json.load(f)
        saved_data["agent_settings"] = state.agent_settings
        with open(KEYS_FILE, "w") as f:
            json.dump(saved_data, f, indent=2)
    except Exception as e:
        print(f"Failed to save agent settings: {e}")

    await state.broadcast()
    return {"status": "ok"}

@router.get("/keys")
async def get_keys():
    if KEYS_FILE.exists():
        with open(KEYS_FILE, "r") as f:
            return json.load(f).get("keys", [])
    return []

@router.post("/keys")
async def save_keys(request: Request):
    keys = await request.json()
    saved_data = {}
    if KEYS_FILE.exists():
        with open(KEYS_FILE, "r") as f:
            saved_data = json.load(f)
    saved_data["keys"] = keys
    with open(KEYS_FILE, "w") as f:
        json.dump(saved_data, f, indent=2)
    return {"status": "ok"}
