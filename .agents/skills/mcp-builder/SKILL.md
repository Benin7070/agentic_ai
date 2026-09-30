---
name: mcp-builder
description: >-
  Instructions and best practices for building MCP (Model Context Protocol)
  interfaces to expose the Credit Decisioning MAS platform's capabilities
  as tools.
---

# MCP Builder — Credit Decisioning MAS

## Overview

This skill guides the creation of MCP tool interfaces that expose the MAS
platform's agent capabilities, memory systems, and data pipelines as
structured, callable tools. These MCP endpoints allow LLM agents to interact
with the platform programmatically.

---

## MCP Tools for This Platform

### Agent Invocation Tools

| Tool Name | Description | Key Parameters |
|:----------|:-----------|:---------------|
| `invoke_kyc_agent` | Run KYC/AML verification for an applicant | `application_id`, `customer_data` |
| `invoke_fraud_agent` | Analyze transaction patterns for fraud signals | `application_id`, `transaction_history` |
| `invoke_credit_agent` | Assess creditworthiness from bureau data | `application_id`, `credit_records` |
| `invoke_affordability_agent` | Calculate repayment capacity | `application_id`, `income`, `existing_debt` |
| `invoke_pricing_agent` | Determine interest rate and credit limit | `application_id`, `risk_level`, `policy_params` |
| `invoke_policy_guard` | Validate against regulatory constraints | `application_id`, `all_agent_outputs` |
| `invoke_explainability_agent` | Generate human-readable decision explanation | `application_id`, `agent_traces` |

### Memory Tools

| Tool Name | Description | Key Parameters |
|:----------|:-----------|:---------------|
| `memory_retrieve_similar` | Find similar past applications from Query Graph | `application_features`, `top_k` |
| `memory_get_trajectory` | Get agent collaboration trajectory from Interaction Graph | `application_id` |
| `memory_get_insights` | Retrieve relevant insights from Insight Graph | `feature_query`, `risk_level` |
| `memory_store_outcome` | Store loan outcome and link to decision | `application_id`, `outcome`, `performance_data` |
| `memory_update_insights` | Trigger batch insight distillation | `batch_size`, `date_range` |

### Orchestration Tools

| Tool Name | Description | Key Parameters |
|:----------|:-----------|:---------------|
| `assess_risk` | Compute initial risk profile for routing | `application_features` |
| `route_application` | Determine agent execution sequence based on risk | `application_id`, `risk_profile`, `memory_context` |
| `escalate_to_human` | Flag application for manual review | `application_id`, `reason`, `agent_outputs` |
| `monitor_loan` | Trigger periodic risk re-assessment | `loan_id`, `current_signals` |

### Data Tools

| Tool Name | Description | Key Parameters |
|:----------|:-----------|:---------------|
| `fetch_application` | Retrieve full application record | `application_id` |
| `fetch_credit_bureau` | Get credit bureau data | `customer_id` |
| `fetch_transactions` | Get transaction history | `customer_id`, `date_range` |
| `compute_dti_ratio` | Calculate debt-to-income ratio | `income`, `existing_debt`, `requested_amount` |

---

## MCP Schema Design Principles

### 1. Strong Typing
Every tool parameter must have explicit types and validation:
```json
{
  "name": "invoke_credit_agent",
  "description": "Assess creditworthiness of a loan applicant",
  "inputSchema": {
    "type": "object",
    "properties": {
      "application_id": { "type": "string", "description": "Unique application identifier" },
      "credit_score": { "type": "number", "minimum": 300, "maximum": 900 },
      "credit_history_months": { "type": "integer", "minimum": 0 },
      "existing_debt": { "type": "number", "minimum": 0 },
      "credit_utilization": { "type": "number", "minimum": 0, "maximum": 1 }
    },
    "required": ["application_id", "credit_score"]
  }
}
```

### 2. Structured Outputs
Every agent tool must return structured JSON with:
- `decision` — the agent's assessment
- `confidence` — score between 0 and 1
- `risk_flags` — array of identified risks
- `reasoning` — human-readable explanation trace

### 3. Error Handling
```json
{
  "status": "error",
  "error_code": "CREDIT_BUREAU_UNAVAILABLE",
  "message": "Credit bureau API timed out after 30s",
  "fallback_action": "Use cached data or escalate to manual review"
}
```
Agents must never crash on tool failure — always provide a fallback recommendation.

### 4. Security
- **Input validation**: Sanitize all customer PII before processing.
- **Audit logging**: Every tool invocation is logged with timestamp, caller, and result.
- **Rate limiting**: Prevent abuse of LLM-powered agent endpoints.
- **Data masking**: Mask sensitive fields (Aadhaar, PAN, account numbers) in logs.

---

## Implementation Pattern

```python
# FastAPI MCP endpoint pattern
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class CreditAgentRequest(BaseModel):
    application_id: str
    credit_score: float
    credit_history_months: int
    existing_debt: float
    credit_utilization: float

class AgentResponse(BaseModel):
    decision: str
    confidence: float
    risk_flags: list[str]
    reasoning: str

@app.post("/mcp/invoke_credit_agent", response_model=AgentResponse)
async def invoke_credit_agent(request: CreditAgentRequest):
    # Agent logic here
    ...
```

---

## Design Rules

1. **One tool per agent** — don't combine multiple agent capabilities into a single tool.
2. **Idempotent where possible** — re-invoking a tool with the same inputs should produce
   the same result (except for memory-update tools).
3. **Timeout handling** — every tool must have a configurable timeout with graceful fallback.
4. **Versioned schemas** — include a schema version so agents handle API evolution gracefully.
5. **Tool descriptions are prompts** — write descriptions as if explaining the tool to an LLM,
   because that's exactly who will be reading them.
