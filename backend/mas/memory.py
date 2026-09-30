import random
import time
from typing import Dict, Any, List

class GMemory:
    """
    True G-Memory Implementation: A Three-Graph Hierarchy
    (Query Graph, Interaction Graph, Insight Graph)
    """
    def __init__(self):
        # In production, these would be backed by FAISS/PostgreSQL/Neo4j
        self.query_graph = []        # Embeddings / Base Application features
        self.interaction_graph = {}  # agent traces & routing paths keyed by appId
        self.insight_graph = []      # Distilled system rules
        
        # Seed with initial insights
        self.insight_graph = [
            "Rule 1: Applications with DTI > 0.55 and < 3 years job stability have a 78% default rate.",
            "Rule 2: Sudden salary day variance (>8 days) correlates highly with imminent delinquency.",
            "Rule 3: Repeated cheque bounces combined with CC utilization > 90% is a critical fraud signal."
        ]
        
    def retrieve_context(self, app: Dict[str, Any]) -> Dict[str, Any]:
        """
        Step 1: Retrieve memory context for a new application.
        """
        # 1. Query Graph (Mock FAISS retrieval)
        similar_cases = self._query_similar_cases(app)
        
        # 2. Interaction Graph (Get trajectories for those cases)
        trajectories = []
        for case in similar_cases:
            if case["appId"] in self.interaction_graph:
                trajectories.append(self.interaction_graph[case["appId"]])
                
        # 3. Insight Graph (Return all for now, in prod filter by relevance)
        return {
            "similar_cases": similar_cases,
            "trajectories": trajectories,
            "insights": self.insight_graph
        }
        
    def write_interaction(self, app_id: str, app_data: Dict[str, Any], agent_traces: Dict[str, Any], decision: Dict[str, Any]):
        """
        Step 2: Save the interaction graph after decision rendering.
        This writes to the Blackboard so future cases can learn from this execution.
        """
        self.query_graph.append({
            "appId": app_id,
            "features": app_data,
            "timestamp": int(time.time() * 1000)
        })
        
        self.interaction_graph[app_id] = {
            "appId": app_id,
            "decision": decision,
            "agent_paths": {
                name: getattr(result, "status", result.get("status", "COMPLETED") if isinstance(result, dict) else "COMPLETED")
                for name, result in agent_traces.items()
            },
            "outcome": "PENDING_MATURITY"
        }
        
    def update_outcome(self, app_id: str, outcome: str):
        """
        Step 3: Outcome-Linked feedback loop.
        Updates the interaction graph with the real-world outcome (e.g., 'REPAID' or 'DEFAULTED').
        """
        if app_id in self.interaction_graph:
            self.interaction_graph[app_id]["outcome"] = outcome
            
            # Simple distillation simulation: If a new default happens, we could append an insight
            if outcome == "DEFAULTED" and random.random() > 0.8:
                self.insight_graph.append(f"Newly Distilled Insight: Recent default observed for app {app_id}.")

    def _query_similar_cases(self, app: Dict[str, Any]) -> List[Dict[str, Any]]:
        # Simulates FAISS embedding search returning top-K matches with known outcomes
        count = random.randint(1, 4)
        matches = []
        income = app.get('monthlyIncome', 50000)
        amount = app.get('requestedAmount', 100000)
        
        # First return some static mocks that have 'DEFAULTED' or 'REPAID' outcomes
        for _ in range(count):
            matches.append({
                "appId": f"A-MEM-{random.randint(1000, 9999)}",
                "income": income + random.randint(-15000, 15000),
                "amount": amount + random.randint(-30000, 30000),
                "outcome": "REPAID" if random.random() > 0.35 else "DEFAULTED",
                "similarity": round(0.65 + random.random() * 0.3, 2),
                "months": random.randint(3, 12)
            })
            
        # Also return dynamic items from our actual runtime interaction graph if any exist
        for q in reversed(self.query_graph[-2:]):
            if q["appId"] in self.interaction_graph:
                node = self.interaction_graph[q["appId"]]
                if node["outcome"] != "PENDING_MATURITY":
                    matches.append({
                        "appId": node["appId"],
                        "income": q["features"].get("monthlyIncome", 0),
                        "amount": q["features"].get("requestedAmount", 0),
                        "outcome": node["outcome"],
                        "similarity": 0.99,
                        "months": 1
                    })
        return matches

# Global memory instance for the system
g_memory = GMemory()
