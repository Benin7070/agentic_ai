import asyncio
import json
from pathlib import Path
from typing import Dict, List, Any

BASE_DIR = Path(__file__).resolve().parent.parent
KEYS_FILE = BASE_DIR / "api_keys.json"

class MASState:
    def __init__(self):
        self.requests: Dict[str, dict] = {}
        self.queue = asyncio.Queue()
        self.is_running = False
        self.rate = 10
        self.risk_dist = {"low": 60, "medium": 30, "high": 10}
        self.listeners: List[asyncio.Queue] = []
        
        self.settings = {"provider": "none", "apiKey": "", "configName": "Default"}
        self.agent_settings = {}
        
        # Load persistent settings if they exist
        self.keys_file = KEYS_FILE
        if self.keys_file.exists():
            try:
                with open(self.keys_file, "r") as f:
                    data = json.load(f)
                    if "active" in data:
                        self.settings = data["active"]
                    if "agent_settings" in data:
                        self.agent_settings = data["agent_settings"]
            except Exception as e:
                print(f"Error loading settings: {e}")
        self.agent_metrics = {
            name: {
                "name": name,
                "totalCalls": 0,
                "tokensUsed": 0,
                "avgTimeMs": 0,
                "history": []
            } for name in ["KYC", "Fraud", "Credit", "Affordability", "Policy", "Pricing", "Explainability"]
        }
        
    async def broadcast(self):
        snapshot = {
            "type": "STATE_UPDATE",
            "requests": list(self.requests.values()),
            "isRunning": self.mas_is_running,
            "rate": self.rate,
            "riskDist": self.risk_dist,
            "settings": self.settings,
            "agentSettings": self.agent_settings,
            "agentMetrics": self.agent_metrics
        }
        data = json.dumps(snapshot)
        for q in self.listeners:
            await q.put(data)

    @property
    def mas_is_running(self):
        return self.is_running

state = MASState()
