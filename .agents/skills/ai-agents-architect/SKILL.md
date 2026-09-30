---
name: ai-agents-architect
description: >-
  Guides the overall architecture, tool usage, memory integration, routing, and
  evaluation of autonomous AI agents for the Credit Decisioning MAS platform.
---

# AI Agents Architect — Credit Decisioning MAS

## Project Context

This is a **Multi-Agent Credit Decisioning System** for neobanks and BNPL fintech.
It replaces siloed, single-purpose models (separate credit scoring, fraud detection,
KYC/AML, pricing, collections) with a coordinated network of LLM-powered agents
that dynamically collaborate per application.

### Core Research Foundations
- **AgentNet** — dynamic multi-agent coordination with adaptive topology, task routing,
  and retrieval-based memory for agent expertise.
- **G-Memory** — hierarchical memory with Interaction Graph, Query Graph, and Insight
  Graph for collaborative experience retrieval and updating.

### Two Key Innovations
1. **Risk-Aware Dynamic Agent Routing** — routing decisions consider agent expertise,
   customer risk, decision uncertainty, loan amount, and policy constraints
   (`R_ij = f(Agent Expertise, Customer Risk, Decision Uncertainty, Loan Amount, Policy Constraints)`).
2. **Outcome-Linked Memory** — observed financial outcomes (good/delinquent/default) are
   linked back to previous decisions and collaboration experiences in G-Memory, creating
   a continuous learning loop.

---

## Agent Inventory

The system has the following specialized agents:

| Agent | Responsibility | Inputs |
|:------|:---------------|:-------|
| **KYC Compliance Agent** | Identity verification, AML checks | Customer PII, ID documents |
| **Fraud Detection Agent** | Transaction anomaly detection, suspicious pattern flagging | Transaction history, behavioral signals |
| **Credit Score Agent** | Creditworthiness assessment | Credit bureau records, credit history, utilization |
| **Affordability Agent** | Repayment capacity analysis | Income, existing debt, DTI ratio |
| **Pricing Agent** | Interest rate and credit limit determination | Risk level, market rates, policy |
| **Policy Guard Agent** | Regulatory compliance enforcement, hard constraint layer | All agent outputs, regulatory rules |
| **Explainability Agent** | Human-readable decision explanations | All agent reasoning traces |

---

## Three-Stage Lifecycle

### Stage 1 — Origination
```
Application → KYC → Fraud → Credit → Affordability → Pricing → Policy → Decision
```

### Stage 2 — Loan Monitoring
After approval, monitoring agents periodically reassess risk based on:
- Missed payments, credit utilization changes, income signals, transaction behavior.
- Risk can escalate (e.g., LOW → MEDIUM → HIGH), triggering actions like
  reducing credit limits, increasing monitoring, or freezing additional credit.

### Stage 3 — Outcome Feedback
```
Loan → Repayment Behaviour → Good / Delinquent / Default → G-Memory
```
Outcomes feed back into G-Memory so the system learns which agent sequences
and collaboration patterns work best for specific customer profiles.

---

## Architecture

```
Frontend (React)
      │
      ▼
Backend API (FastAPI / Python)
      │
      ├─── SSE / WebSocket (live status stream to frontend)
      │
      ▼
┌──────────────────────────────────────────┐
│  Request Queue                           │
│  (asyncio.Queue / Redis)                 │
│                                          │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│  │ App1 │ │ App2 │ │ App3 │ │ ...  │   │
│  │ ⏳   │ │ 🔄   │ │ ⏳   │ │      │   │
│  └──────┘ └──────┘ └──────┘ └──────┘   │
│                                          │
│  Workers: 3 concurrent  │  Queue: 12    │
└──────────────────────────────────────────┘
      │
      ▼
Agent Orchestrator (AgentNet-style routing)
      │
 ┌────┼──────────┐
 ▼    ▼          ▼
Agent Agent     Agent
      Network
      │
      ├─── Result Cache (per-agent outputs, TTL-based)
      │
      ▼
LLM Layer (Ollama / Qwen-2.5 / GPT-4o-mini)
      │
      ▼
RAG / Embeddings
      │
      ├─── Memory Cache (hot embeddings, recent retrievals)
      │
      ▼
G-Memory
      ├── Query Graph
      ├── Insight Graph
      └── Interaction Graph
      │
      ▼
Database (PostgreSQL + FAISS/Chroma + optionally Neo4j)
      │
      ▼
Outcome / Monitoring
```

---

## Architectural Principles

1. **Risk-Aware Routing over Static Pipelines** — Low-risk applications skip agents
   (e.g., KYC → Credit → Affordability → Pricing). High-risk applications invoke
   all agents, potentially with re-evaluation loops and human review escalation.
2. **ReAct Pattern** — Agents reason about the task, then perform actions. AgentNet
   itself uses ReAct-style reasoning/action.
3. **RAG for Memory Retrieval** — Agents retrieve relevant historical experiences
   from G-Memory using embedding-based similarity.
4. **Graduated Decisions** — The system produces nuanced outcomes (approve with
   reduced limit, conditional approval, reject) rather than binary approve/reject.
5. **Explainability by Design** — Every decision includes human-readable reasoning
   traces from each contributing agent.
6. **Hard Constraint Layer** — Policy Guard Agent enforces non-negotiable regulatory
   and business rules as a final gate.
7. **Queue-Based Processing** — Every incoming application (real or simulated) enters
   a request queue. Workers pull from the queue concurrently. Each application's
   progress is tracked and streamed to the frontend in real-time.
8. **Cache at Two Levels** — Agent result cache (avoid re-running same agent with
   identical inputs) and memory retrieval cache (avoid re-embedding identical queries).

---

## Queue & Cache System

The queue and cache layer sits between the API and the orchestrator. It handles
concurrent application processing, progress tracking, and performance optimization.

### Request Queue

```python
# Queue architecture (asyncio-based, capstone-appropriate)
import asyncio
from enum import Enum

class RequestStatus(Enum):
    QUEUED = "queued"           # Waiting in queue
    MEMORY_RETRIEVAL = "memory" # Fetching similar apps from G-Memory
    RISK_ASSESSMENT = "risk"    # Computing risk profile
    ROUTING = "routing"         # Determining agent sequence
    AGENT_PROCESSING = "agent"  # Agents are working (with agent name)
    POLICY_CHECK = "policy"     # Final policy guard check
    DECISION = "decision"       # Decision rendered
    COMPLETED = "completed"     # Fully done, stored in memory

class ApplicationQueue:
    def __init__(self, max_workers=3):
        self.queue = asyncio.Queue()
        self.active: dict[str, RequestStatus] = {}  # app_id → status
        self.max_workers = max_workers
    
    async def enqueue(self, application):
        """Add application to queue, return position."""
        self.active[application.id] = RequestStatus.QUEUED
        await self.queue.put(application)
        self._broadcast_status(application.id, RequestStatus.QUEUED)
        return self.queue.qsize()
    
    async def worker(self):
        """Process applications from queue."""
        while True:
            app = await self.queue.get()
            try:
                await self._process(app)
            finally:
                self.queue.task_done()
    
    async def _process(self, app):
        """Full processing pipeline with status updates."""
        # Each status change is broadcast to frontend via SSE
        self._update(app.id, RequestStatus.MEMORY_RETRIEVAL)
        memory_ctx = await retrieve_memory(app)
        
        self._update(app.id, RequestStatus.RISK_ASSESSMENT)
        risk = await assess_risk(app, memory_ctx)
        
        self._update(app.id, RequestStatus.ROUTING)
        route = await determine_route(app, risk, memory_ctx)
        
        for agent_name in route:
            self._update(app.id, RequestStatus.AGENT_PROCESSING,
                        detail=agent_name)
            result = await run_agent(agent_name, app, memory_ctx)
        
        self._update(app.id, RequestStatus.POLICY_CHECK)
        await run_policy_guard(app, all_results)
        
        self._update(app.id, RequestStatus.DECISION)
        decision = await render_decision(app, all_results)
        
        self._update(app.id, RequestStatus.COMPLETED)
    
    def _broadcast_status(self, app_id, status, detail=None):
        """Push status update to frontend via SSE."""
        # Frontend receives: {app_id, status, detail, timestamp}
        ...
    
    def get_queue_snapshot(self) -> dict:
        """Return current queue state for dashboard display."""
        return {
            'queue_size': self.queue.qsize(),
            'active_workers': len([s for s in self.active.values()
                                   if s != RequestStatus.QUEUED]),
            'applications': {
                app_id: status.value
                for app_id, status in self.active.items()
            }
        }
```

### Result Cache

Avoid re-running agents when inputs are identical (common during simulation):

```python
from functools import lru_cache
from hashlib import sha256

class AgentResultCache:
    def __init__(self, max_size=500, ttl_seconds=300):
        self.cache = {}       # hash → (result, timestamp)
        self.max_size = max_size
        self.ttl = ttl_seconds
        self.hits = 0
        self.misses = 0
    
    def _key(self, agent_name: str, inputs: dict) -> str:
        """Deterministic hash of agent + inputs."""
        raw = f"{agent_name}:{sorted(inputs.items())}"
        return sha256(raw.encode()).hexdigest()
    
    def get(self, agent_name, inputs):
        key = self._key(agent_name, inputs)
        if key in self.cache:
            result, ts = self.cache[key]
            if time.time() - ts < self.ttl:
                self.hits += 1
                return result
        self.misses += 1
        return None
    
    def put(self, agent_name, inputs, result):
        key = self._key(agent_name, inputs)
        self.cache[key] = (result, time.time())
        if len(self.cache) > self.max_size:
            # Evict oldest
            oldest = min(self.cache, key=lambda k: self.cache[k][1])
            del self.cache[oldest]
    
    @property
    def hit_rate(self):
        total = self.hits + self.misses
        return self.hits / total if total > 0 else 0
```

### Memory Retrieval Cache

Cache recent G-Memory lookups so similar incoming applications don't repeat
expensive embedding + vector search operations:

| Cache Layer | What's Cached | TTL | Eviction |
|:-----------|:-------------|:----|:---------|
| Embedding cache | Application feature → embedding vector | 10 min | LRU, 200 entries |
| Similarity cache | Embedding → top-K similar app IDs | 5 min | LRU, 100 entries |
| Insight cache | Feature query → relevant insights | 15 min | LRU, 50 entries |

### Dashboard Cache Stats

Expose cache metrics in the simulation live stats panel:
- Agent cache hit rate: `84%` (shows redundant work avoided)
- Memory cache hit rate: `72%`
- Queue depth: `3` (current backlog)
- Active workers: `2/3`

---

## Technology Stack

| Layer | Technology |
|:------|:-----------|
| Frontend | React / React Native |
| Backend API | Python + FastAPI |
| Agent Framework | Custom AgentNet-style routing (not dependent on external frameworks) |
| LLM | Ollama (local) or API-based (Qwen-2.5, GPT-4o-mini) |
| Embeddings | Embedding model for application similarity, memory retrieval, query matching |
| Database | PostgreSQL + FAISS/Chroma for vector search |
| Graph Memory | Neo4j or PostgreSQL tables for G-Memory graphs |

---

## Data Strategy

Use **public credit-risk datasets** with derived signals:

| Data Type | Source |
|:----------|:-------|
| Customer demographics, income, employment | Public credit dataset |
| Loan amount, credit history, existing debt | Public credit dataset |
| Repayment history, credit utilization, default label | Public credit dataset |
| Transaction behavior (for fraud agent) | **Synthetic** — clearly labeled |
| KYC data | **Synthetic** — clearly labeled |

---

## Capstone Scope

> **This is a final-year capstone proof-of-concept**, not a live banking deployment.
>
> - **Stage 1 (Origination)**: Fully functional with agents processing applications.
> - **Stage 2 (Monitoring)**: Demonstrated using **simulated sequential records**
>   and time-compression, not live customer monitoring.
> - **Stage 3 (Outcome Feedback)**: Outcomes are generated by the simulation engine
>   based on statistical models (e.g., higher DTI → higher default probability).
> - **Data**: Public credit-risk datasets + synthetic transaction/KYC data (clearly labeled).
> - **LLM calls**: Can be replaced with deterministic logic for testing/demo speed.

---

## Simulation Engine

The system includes a **data simulation engine** (pure math/random, no LLM)
that generates realistic loan applications for demo and evaluation.

### Why This Exists
- Enables live demos without real customer data.
- Demonstrates Innovation #1 (routing changes based on risk profiles).
- Demonstrates Innovation #2 (memory improves decisions over time with accumulated outcomes).
- Allows reproducible evaluation runs.

### How It Works

```python
# Simulation engine pseudocode
import random
from dataclasses import dataclass

@dataclass
class SimulatedApplication:
    customer_id: str
    income: float           # ₹20,000 – ₹5,00,000
    credit_score: int       # 300 – 900
    existing_debt: float    # ₹0 – ₹10,00,000
    requested_amount: float # ₹10,000 – ₹5,00,000
    employment_type: str    # salaried / self-employed / unemployed
    age: int                # 21 – 65
    credit_history_months: int  # 0 – 240
    credit_utilization: float   # 0.0 – 1.0

class SimulationEngine:
    def __init__(self, seed=42, rate_per_min=12, risk_distribution=None):
        self.rng = random.Random(seed)
        self.rate = rate_per_min
        self.risk_dist = risk_distribution or {'low': 0.6, 'medium': 0.3, 'high': 0.1}
        self.running = False
        self.time_compression = 1  # 1x, 10x, 100x
    
    def generate_application(self) -> SimulatedApplication:
        """Generate one random application using math distributions."""
        risk_tier = self.rng.choices(
            ['low', 'medium', 'high'],
            weights=[self.risk_dist['low'], self.risk_dist['medium'], self.risk_dist['high']]
        )[0]
        
        if risk_tier == 'low':
            income = self.rng.gauss(120000, 30000)
            score = self.rng.randint(720, 850)
            amount = self.rng.gauss(40000, 15000)
        elif risk_tier == 'medium':
            income = self.rng.gauss(65000, 20000)
            score = self.rng.randint(620, 730)
            amount = self.rng.gauss(80000, 25000)
        else:  # high
            income = self.rng.gauss(35000, 10000)
            score = self.rng.randint(350, 640)
            amount = self.rng.gauss(150000, 50000)
        
        return SimulatedApplication(...)
    
    def generate_outcome(self, application, decision) -> str:
        """Simulate loan outcome based on risk factors (no LLM)."""
        dti = application.existing_debt / max(application.income, 1)
        default_prob = (
            0.05 * (application.credit_score < 650) +
            0.10 * (dti > 0.4) +
            0.15 * (application.requested_amount > 2 * application.income) +
            0.05 * (application.credit_history_months < 12)
        )
        return 'DEFAULT' if self.rng.random() < default_prob else 'GOOD'
```

### Configurable Parameters

| Parameter | Range | Purpose |
|:----------|:------|:--------|
| Request rate | 1 – 60 apps/min | Controls demo speed |
| Risk distribution | Low/Medium/High percentages | Skew towards specific risk tiers |
| Time compression | 1x, 10x, 100x | Fast-forward monitoring outcomes |
| Random seed | Any integer | Reproducible runs for evaluation |
| Outcome delay | Simulated weeks/months | Controls when outcomes arrive for memory feedback |

### Demo Scenarios

| Scenario | Settings | What It Demonstrates |
|:---------|:---------|:--------------------|
| **Cold start** | Reset memory, 12 apps/min | Innovation #2: watch accuracy improve from ~70% to ~85% as memory fills |
| **High-risk flood** | 90% high-risk, 10 apps/min | Innovation #1: all apps get full pipeline, no agents skipped |
| **Mixed traffic** | Default distribution, 20 apps/min | Both innovations: routing varies, memory accumulates |
| **Speed comparison** | Run same seed with/without risk-aware routing | Innovation #1: measure latency difference |

---

## Design Decisions to Enforce

- Never hard-code agent execution order; always route dynamically based on risk.
- Every agent must produce a structured output with confidence scores.
- All agent interactions must be logged for the Interaction Graph.
- Memory retrieval must happen BEFORE agent routing (retrieve → assess risk → route).
- Policy Guard is always the final agent in any pipeline — it cannot be skipped.
- Explainability Agent aggregates all agent traces into the final user-facing output.
- Simulation engine must be independent of agent logic — it only generates inputs.
