---
name: agent-memory-systems
description: >-
  Patterns for G-Memory hierarchical architecture, retrieval, and outcome-linked
  memory for the Credit Decisioning MAS.
---

# Agent Memory Systems — G-Memory for Credit Decisioning

## Overview

This skill covers the memory architecture for the MAS platform, built on the
**G-Memory** research paper's hierarchical graph-based memory. The system's
second key innovation — **Outcome-Linked Memory** — extends G-Memory by linking
observed financial outcomes back to the decision experiences that produced them.

---

## G-Memory: Three-Graph Hierarchy

### 1. Interaction Graph
- **What it stores**: Raw records of agent-to-agent communication during each
  loan application.
- **Nodes**: Individual agent messages/actions.
- **Edges**: Communication flow (which agent sent what to whom, in what order).
- **Purpose**: Captures the full collaboration trajectory for every application.
- **Example**: KYC Agent → verified → Fraud Agent → no flags → Credit Agent → 
  score 710 → Affordability Agent → moderate risk.

### 2. Query Graph
- **What it stores**: Embeddings of incoming loan applications and queries.
- **Purpose**: Enables similarity-based retrieval — when a new application arrives,
  find the most similar past applications by embedding distance.
- **Retrieval flow**:
  1. Embed the new application features (income, credit score, amount, etc.).
  2. Coarse retrieval via embedding similarity (FAISS/Chroma).
  3. Return top-K similar past applications.
- **Example**: New application (income ₹65K, score 710, amount ₹75K) retrieves
  3 similar past applications with known outcomes.

### 3. Insight Graph
- **What it stores**: Distilled patterns and learnings extracted from multiple
  interactions.
- **Nodes**: Generalized insights (e.g., "Applications with DTI > 0.5 and score < 650
  have 3x default rate").
- **Purpose**: Higher-level knowledge that agents can reference without replaying
  full interaction histories.
- **Update trigger**: Periodically or after batch outcome feedback.

---

## Outcome-Linked Memory (Innovation #2)

This is the project's second research contribution.

### The Learning Loop
```
Previous Experience (G-Memory)
        ↓
New Application arrives
        ↓
Memory retrieval (similar apps + insights)
        ↓
Risk-Aware Routing
        ↓
Agent Collaboration
        ↓
Credit Decision (approve/reject/conditional)
        ↓
Loan Performance (monitored over time)
        ↓
Outcome Feedback (Good / Delinquent / Default)
        │
        └──────────► G-Memory (update all three graphs)
```

### What Gets Stored on Outcome

| Outcome Event | Stored In | What's Recorded |
|:-------------|:----------|:----------------|
| Loan approved | Interaction Graph | Full agent collaboration trajectory |
| 3-month check | Interaction Graph | Monitoring agent re-assessment |
| Final outcome (good/default) | Insight Graph | Link between application profile, agent sequence used, and financial result |
| Risk escalation | Query Graph + Insight Graph | Risk change signals for future similarity matching |

### Why This Matters
The system doesn't just make a decision — it:
1. **Observes** what happened after the decision.
2. **Remembers** the experience (which agents participated, what they said, what routing was used).
3. **Uses it** to improve future coordination and routing.

---

## Memory Retrieval Flow (Per Application)

```python
# Pseudocode for memory-augmented processing
def process_application(application):
    # Step 1: Embed the application
    embedding = embed(application.features)
    
    # Step 2: Query Graph — find similar past applications
    similar_apps = query_graph.retrieve_similar(embedding, top_k=5)
    
    # Step 3: Interaction Graph — get collaboration trajectories
    trajectories = [interaction_graph.get(app.id) for app in similar_apps]
    
    # Step 4: Insight Graph — get relevant insights
    insights = insight_graph.retrieve_relevant(application.features)
    
    # Step 5: Provide context to agents
    context = MemoryContext(
        similar_applications=similar_apps,
        past_trajectories=trajectories,
        insights=insights
    )
    
    # Step 6: Risk-aware routing with memory context
    return route_and_execute(application, context)
```

---

## Storage Implementation

| Component | Recommended Tech | Alternative |
|:----------|:----------------|:------------|
| Query Graph (embeddings) | FAISS or Chroma | PostgreSQL + pgvector |
| Interaction Graph | Neo4j | PostgreSQL tables with adjacency |
| Insight Graph | Neo4j | PostgreSQL + JSON columns |
| Outcome records | PostgreSQL | — |

---

## Design Rules

1. **Memory retrieval happens BEFORE routing** — agents need context from past
   similar applications to make better decisions.
2. **Every application creates an Interaction Graph entry** — even rejected ones.
3. **Outcome feedback is asynchronous** — outcomes arrive weeks/months later and
   must be linked back to the original application ID.
4. **Insights are periodically distilled** — don't update the Insight Graph on
   every single application; batch-process after N outcomes.
5. **Embeddings must include financial features** — not just text; encode income,
   credit score, DTI, amount as part of the embedding.
6. **Clearly label synthetic data** — if transaction data for the fraud agent is
   synthetic, the memory system must tag it as such.
