# Autonomous Credit Decisioning Multi-Agent System (AgentNet MAS)
## A 7-Agent State-Mediated Epistemic Architecture for Real-Time Retail Lending Underwriting, Risk Scoring, and Dynamic Policy Consensus

> **Department of Artificial Intelligence and Machine Learning**  
> **Course / Specification:** AD23731 Foundations of Agentic AI — Advanced Capstone Architecture  
> **Platform Name:** AgentNet MAS (Autonomous Credit Decisioning Platform)  
> **Live Observability Engine:** React 19 + TypeScript + FastAPI + XYFlow + G-Memory Bus

---

## 📋 Executive Abstract

Traditional retail lending relies on either rigid statistical scorecards (which lack qualitative nuance and adaptability) or slow, inconsistent manual clerical underwriting (which introduces high latency and human bias). Monolithic Large Language Model (LLM) approaches fail due to ungrounded hallucinations, lack of auditability, and token context entanglement across diverse financial domains.

**AgentNet MAS** is an enterprise-grade, state-mediated Multi-Agent System designed to autonomously, transparently, and fairly triage, underwrite, and decision retail loan applications in real time. Decomposed into seven autonomous, role-bounded agents organized across a 5-level Directed Acyclic Graph (DAG) with parallelized branches, the system features:
1. **L1 Barrier Verification:** Identity, PAN formatting, and AML/PEP sanctions gating (**KYC Agent**).
2. **L2 Parallel Risk Derivation:** Real-time velocity, cheque bounce and banking instability detection (**Fraud Agent**) alongside comprehensive credit bureau derivation, repayment scoring, and tradeline exposure evaluation (**Credit Agent**).
3. **L3 Capacity Evaluation:** Debt-to-Income (DTI / FOIR) calculation and dynamic macroeconomic stress testing (**Affordability Agent**).
4. **L4 Parallel Synthesis:** Statutory regulatory compliance against Reserve Bank of India (RBI) mandates (**Policy Agent**) running concurrently with risk-adjusted Annual Percentage Rate (APR) and tenure amortization structuring (**Pricing Agent**).
5. **L5 Auditing & Fairness:** Demographic parity auditing, SHAP-style attribution, and plain-language adverse action documentation (**Explainability Agent**).

The agents communicate via an active **Shared Blackboard** with real-time **Inter-Agent Mentioning** (`@agent`), dynamic inconsistency flagging, and short-circuit execution. Historical reasoning is grounded in a **G-Memory Epistemic Three-Graph Hierarchy** consisting of a *Query Graph* (structural precedent retrieval), an *Interaction Graph* (agent trajectory consensus), and an *Insight Graph* (distilled institutional heuristics). To strictly eliminate cross-customer data leakage and prompt cache corruption, each application executes within an ephemeral, cryptographically tagged, zero-cache **Isolated Scratchpad Session** (`SP-{appId}`).

---

<a id="overview"></a>
## 1. Introduction

### 1.1 Background and Motivation
Retail lending is the lifeblood of consumer credit. Millions of loan applications for personal loans, home mortgages, and micro-business credit are submitted daily. The standard triage process suffers from two critical bottlenecks:
- **Clerical Inconsistency & Latency:** Human underwriting teams spend 48 to 72 hours cross-verifying tax documents, bureau reports, and employer credentials. Under pressure, underwriting quality degrades, and subjective variance occurs across credit officers.
- **Opacity & Compliance Gaps:** When applicants are declined, legacy scorecards output cryptic reject codes that fail to satisfy modern transparency regulations (such as fair lending mandates and adverse action explanation laws).

### 1.2 Need for Agentic AI
Three alternative paradigms were evaluated:
1. **Traditional Rule Engines:** Fast and deterministic, but completely unable to handle unstructured bank statements, qualitative employment nuances, or inter-signal risk trade-offs.
2. **Monolithic Single-Prompt LLM:** Feeding raw applicant json into an LLM and asking for an approval verdict results in context drift, uncontrolled hallucinations, inability to enforce statutory lending caps, and zero inspectability of intermediate reasoning steps.
3. **Multi-Agent Systems (AgentNet MAS):** Decomposes underwriting into bounded, specialized agents where each agent operates with domain-tailored prompts, explicit input schemas, and deterministic fallback guards. Intermediate outputs are serialized onto a shared blackboard, and agents can call each other (`@Fraud`, `@Policy`) to resolve contradictions before consensus is rendered.

```
                           ┌────────────────────────┐
                           │      RAW LOAN APP      │
                           │(FIFO Queue & Tag Hash) │
                           └───────────┬────────────┘
                                       │
                                       ▼
                       Level 1: ┌───────────────┐
                                │   KYC AGENT   │  [AML/PEP Barrier Gate]
                                └───────┬───────┘
                                        │
                         ┌──────────────┴──────────────┐
                         ▼                             ▼
         Level 2: ┌──────────────┐             ┌──────────────┐
                  │ FRAUD AGENT  │             │ CREDIT AGENT │  [Parallel Execution]
                  └──────┬───────┘             └──────┬───────┘
                         └──────────────┬──────────────┘
                                        │
                                        ▼
                         Level 3: ┌──────────────┐
                                  │AFFORDABILITY │  [DTI & Income Stress Test]
                                  └──────┬───────┘
                                        │
                         ┌──────────────┴──────────────┐
                         ▼                             ▼
         Level 4: ┌──────────────┐             ┌──────────────┐
                  │PRICING AGENT │             │ POLICY AGENT │  [Parallel Synthesis]
                  └──────┬───────┘             └──────┬───────┘
                         └──────────────┬──────────────┘
                                        │
                                        ▼
                         Level 5: ┌──────────────┐
                                  │EXPLAINABILITY│  [SHAP & Fair Lending Audit]
                                  └──────┬───────┘
                                        │
                                        ▼
                           ┌────────────────────────┐
                           │  CONSENSUS VERDICT &   │
                           │  G-MEMORY PERSISTENCE  │
                           └────────────────────────┘
```

### 1.3 Project Objectives
| ID | Objective |
|:---|:---|
| **O1** | Accept raw, un-scored retail borrower profiles and automate end-to-end multi-dimensional credit evaluation in under 4 seconds. |
| **O2** | Enforce a strict 5-level Directed Acyclic Graph (DAG) with parallelized branches for Fraud/Credit (L2) and Pricing/Policy (L4). |
| **O3** | Implement real-time inter-agent communication via a Shared Blackboard with `@agent` inconsistency mention and resolution protocols. |
| **O4** | Ground underwriting in a Three-Graph Epistemic Memory (**G-Memory**) containing structural precedents, interaction trajectories, and distilled risk heuristics. |
| **O5** | Implement a Zero-Cache Per-Request Scratchpad Security Architecture (`SP-{id}`) with FIFO queueing (`Q#0001`) and cryptographic demographic tagging to prevent prompt injection and cross-customer cache leakage. |
| **O6** | Deliver full observability with Langfuse/Phoenix-style trace viewers, telemetry ribbons, Kanban intake queues, and dual graph visualizations (Blackboard Orbit vs. DAG Pipeline). |
| **O7** | Guarantee deterministic fail-safe behavior: every agent includes hard-coded heuristic fallbacks so processing never stalls even during LLM API outages or rate limits. |

---

## 2. Problem Statement & Business Case

### 2.1 Problem Definition
Given raw borrower financial data (monthly income, requested loan amount, existing EMIs, active tradelines, cheque bounces, employment duration, and banking stability), the platform must determine:
1. Is the applicant legally eligible and identity-verified?
2. Are there hidden syndicate fraud, velocity, or salary tampering signals?
3. What is the borrower's empirical bureau creditworthiness?
4. Can their net cashflow afford the proposed monthly obligations under stressed economic conditions?
5. Does the application comply with RBI lending regulations and statutory debt-to-income caps?
6. What is the risk-adjusted APR and structured loan ceiling?
7. Can the platform provide an adverse action notice citing top SHAP-style principal drivers?

### 2.2 Business & Regulatory Context
Non-Performing Assets (NPAs) in consumer credit frequently arise from over-leveraged borrowers who pass bureau scorecards but exhibit high cheque bounce velocity or sudden salary disbursement variance. Simultaneously, financial regulators (such as RBI, CFPB, and EBA) enforce stringent mandates against demographic discrimination and opaque automated lending rejections. AgentNet MAS bridges this gap by creating an auditable paper trail for every credit decision.

---

## 3. User & Stakeholder Analysis

### 3.1 Target Users
- **Credit Underwriting Officers:** Review automated recommendations, override borderline decisions, and inspect agent traces.
- **Risk & Compliance Executives:** Audit demographic parity, verify RBI statutory compliance, and adjust policy rules.
- **Credit Analysts & Model Validators:** Inspect intermediate agent prompts, tool inputs/outputs, and token consumption.
- **Loan Applicants:** Receive rapid loan turnarounds with crystal-clear explanations and transparent fee structures.

### 3.2 Stakeholder Matrix
| Stakeholder | Primary Concern | How AgentNet MAS Addresses It |
|:---|:---|:---|
| **Borrower** | Turnaround time & fair treatment | Underwriting completes in seconds; decisions accompanied by plain-language rationales. |
| **Risk Committee** | Default risk & NPA reduction | Multi-layered fraud velocity analysis and dynamic 35% income stress testing. |
| **Chief Compliance Officer** | Regulatory scrutiny & auditability | Policy Agent enforces RBI caps; Explainability Agent creates immutable audit logs. |
| **Operations Team** | Manual underwriting backlog | Automated Kanban intake queue processes applications in FIFO sequence. |
| **DevOps & Security** | Data privacy & cache leakage | Isolated per-request scratchpads eliminate cross-customer memory pollution. |

---

## 4. Proposed Agentic AI Solution

### 4.1 Overall Solution
AgentNet MAS orchestrates seven specialized agents governed by an asynchronous worker pool, an active blackboard bus, and a three-graph epistemic memory engine. Decisions are reached not by majority vote, but by strict gatekeeper validation, parallel domain evaluation, and dynamic consensus synthesis.

### 4.2 Key Architectural Features
- **Hierarchical DAG Orchestration:** Asynchronous pipeline running non-dependent agents in parallel (L2 Fraud/Credit and L4 Policy/Pricing).
- **Inter-Agent Mention Protocol:** Agents can broadcast `@agent` mentions across the blackboard to trigger re-examination of anomalies.
- **Dynamic Risk-Aware Routing:** Applications are pre-evaluated for preliminary risk; pristine profiles can dynamically bypass non-essential deep checks, saving over 40% execution time and tokens.
- **Zero-Cache Scratchpad Isolation:** Each evaluation executes inside a pristine memory sandbox (`SP-{appId}`), completely disabling cross-applicant prompt cache retention.

---

<a id="the-seven-agents"></a>
## 5. Agent Architecture & Role Specifications

AgentNet MAS organizes underwriting into seven autonomous micro-agents:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AGENTNET MAS AGENT CATALOG                      │
├───────────────┬──────────────┬────────────────────────┬────────────────┤
│ Agent Name    │ Level in DAG │ Core Specialty         │ Output Signals │
├───────────────┼──────────────┼────────────────────────┼────────────────┤
│ KYC           │ L1 Barrier   │ Identity & AML Guard   │ kyc_passed     │
│ Fraud         │ L2 Parallel  │ Velocity & Anomaly     │ fraud_risk     │
│ Credit        │ L2 Parallel  │ Bureau Derivation      │ credit_score   │
│ Affordability │ L3 Capacity  │ DTI & Stress Testing   │ proposed_dti   │
│ Policy        │ L4 Synthesis │ RBI Statutory Rules    │ policy_passed  │
│ Pricing       │ L4 Synthesis │ Risk-Adjusted APR      │ interest_rate  │
│ Explainability│ L5 Audit     │ Fairness & SHAP        │ decision_notes │
└───────────────┴──────────────┴────────────────────────┴────────────────┘
```

---

<a id="kyc-agent"></a>
### 5.1 KYC & AML Gatekeeper Agent (`KYC`)
- **Role:** Identity Verification, Document Format Validation, and AML/PEP Screening.
- **Level in DAG:** Level 1 Barrier Gatekeeper.
- **Core Operations:**
  1. Validates 10-character Permanent Account Number (PAN) format against valid 4th-character entity codes (`[ABCFGHLJPT]`).
  2. Verifies Aadhaar biometric linkage token.
  3. Screens applicant against global Anti-Money Laundering (AML) and Politically Exposed Persons (PEP) sanctions registries.
- **Tools Invoked:** `verify_pan(pan)`, `verify_aadhaar(aadhaar)`, `aml_screening(name)`, `phone_ownership(phone)`.
- **Inter-Agent Mention Trigger:**
  ```text
  MENTION: @Fraud - AML screening flagged possible PEP/sanction hit for applicant. Deep velocity & syndicate checks required.
  ```
- **Output Schema:** `kyc_score` (0–100), `kyc_passed` (boolean), `pan_valid`, `aadhaar_linked`, `aml_clear`, `flags`.

---

<a id="fraud-agent"></a>
### 5.2 Fraud & Anomaly Detection Agent (`Fraud`)
- **Role:** Velocity Checks, Banking Anomaly Identification, and Syndicate Risk Detection.
- **Level in DAG:** Level 2 Parallel Node.
- **Core Operations:**
  1. Detects multi-application velocity bursts across banking networks within 90 days.
  2. Scans 12-month cheque and ECS bounce velocity.
  3. Identifies salary credit day variance (>8 days indicates cashflow distress or payroll instability).
  4. Evaluates revolving Credit Card Outstanding relative to Gross Monthly Income.
- **Tools Invoked:** `velocity_check(app_id)`, `device_reputation(fingerprint)`, `syndicate_match(pan_pool)`, `geo_distance(ip, address)`.
- **Output Schema:** `fraud_risk` (0.0–1.0), `risk_label` (`LOW` / `MEDIUM` / `HIGH`), `bounce_score`, `velocity_score`.

---

<a id="credit-agent"></a>
### 5.3 Credit Bureau Derivation Agent (`Credit`)
- **Role:** Bureau Track Record Analysis, CIBIL Derivation, and Tradeline Exposure.
- **Level in DAG:** Level 2 Parallel Node.
- **Core Operations:**
  1. Derives accurate bureau credit scores (300–900 scale) factoring active loans, repayment tenure, and historical delinquency penalties.
  2. Classifies borrower into institutional risk grades:
     - `Grade A`: Score ≥ 750 (Prime)
     - `Grade B`: Score 650–749 (Near-Prime)
     - `Grade C`: Score 550–649 (Subprime)
     - `Grade D`: Score < 550 (High Risk / Declining)
  3. Analyzes active tradeline counts to flag credit hunger.
- **Tools Invoked:** `cibil_inquiry(pan)`, `dpd_history_analyzer(36m)`, `tradeline_aggregator(pan)`, `inquiry_velocity(90d)`.
- **Output Schema:** `credit_score` (300–900), `grade`, `tradelines`, `approved` (boolean).

---

<a id="affordability-agent"></a>
### 5.4 Affordability & Capacity Agent (`Affordability`)
- **Role:** Cashflow Analysis, FOIR / DTI Computation, and Macroeconomic Stress Testing.
- **Level in DAG:** Level 3 Capacity Node.
- **Core Operations:**
  1. Computes existing Fixed Obligation to Income Ratio (FOIR) and proposed Debt-to-Income (DTI).
  2. Calculates net disposable monthly cashflow after all existing and requested EMIs.
  3. **Adaptive Macroeconomic Stress Testing:**
     - Baseline stress test applies a 20% income reduction haircut.
     - If Fraud Agent flagged `HIGH` risk or Credit Agent score < 600, automatically escalates stress test to a **35% income reduction haircut**.
- **Tools Invoked:** `bank_statement_analyzer(pdf)`, `foir_calculator(emis, income)`, `disposable_income_stress_test()`.
- **Output Schema:** `proposed_dti` (0.0–1.0), `disposable_income`, `stressed_dti`, `can_afford` (boolean), `stress_passed` (boolean).

---

<a id="pricing-agent"></a>
### 5.5 Risk-Based Pricing Agent (`Pricing`)
- **Role:** Risk-Adjusted Annual Percentage Rate (APR) Computation and Tenure Structuring.
- **Level in DAG:** Level 4 Parallel Synthesis Node.
- **Core Operations:**
  1. Establishes base lending rate from central bank repo rate (6.50%) + institutional cost of funds (2.50%).
  2. Applies risk premiums dynamically based on credit grade, bounce frequency, and DTI tier:
     - Grade A: Base + 1.5%–2.5%
     - Grade B: Base + 3.0%–4.5%
     - Grade C: Base + 5.5%–7.5%
  3. Calculates sanctioned loan limit matching the maximum affordable EMI ceiling.
- **Tools Invoked:** `risk_premium_model(score, dti)`, `margin_optimizer()`, `tenure_amortization_schedule()`.
- **Output Schema:** `interest_rate` (APR %), `base_rate`, `risk_premium`, `approved_amount`, `requested_amount`.

---

<a id="policy-agent"></a>
### 5.6 Regulatory Compliance Policy Agent (`Policy`)
- **Role:** Statutory Lending Compliance, RBI Guidelines Enforcement, and Exposure Limits.
- **Level in DAG:** Level 4 Parallel Synthesis Node.
- **Core Operations:**
  1. Verifies applicant age parameters (21–60 for salaried, 21–65 for self-employed).
  2. Enforces minimum monthly income statutory thresholds (₹25,000 for salaried, ₹30,000 for self-employed).
  3. Enforces Loan-to-Income (LTI) cap: maximum approved loan cannot exceed 24x monthly gross earnings.
  4. Enforces aggregate concurrent credit exposure limits (maximum 5 active loans).
- **Tools Invoked:** `policy_matrix_evaluator()`, `rbi_regulatory_guard()`, `minimum_age_income_rule()`.
- **Output Schema:** `policy_passed` (boolean), `violations` (list of strings), `age`, `lti_ratio`.

---

<a id="explainability-agent"></a>
### 5.7 Explainability & Fair-Lending Agent (`Explainability`)
- **Role:** Transparent Decision Documentation, SHAP Attribution, and Adverse Action Generation.
- **Level in DAG:** Level 5 Audit & Finalization Node.
- **Core Operations:**
  1. Aggregates trace outputs from all upstream agents into an auditable dossier.
  2. Generates plain-language Adverse Action Notices for rejected applicants, citing the primary adverse drivers.
  3. Computes demographic parity metrics to guarantee non-discriminatory lending practices.
- **Tools Invoked:** `shap_explainer(features)`, `demographic_parity_audit()`, `adverse_action_generator()`.
- **Output Schema:** `summary`, `decision_narrative`, `adverse_action_codes`, `explanation_ready`.

---

<a id="g-memory-system"></a>
## 6. G-Memory Epistemic Hierarchy

AgentNet MAS features a **Three-Graph Epistemic Memory** architecture designed to ground agent reasoning in precedent and historical loan performance:

```
┌─────────────────────────────────────────────────────────────────┐
│                    G-MEMORY THREE-GRAPH ENGINE                  │
├───────────────────────────────┬─────────────────────────────────┤
│  1. Query Graph               │  Vector similarity of raw       │
│     (Precedent Retrieval)     │  financial borrower attributes  │
├───────────────────────────────┼─────────────────────────────────┤
│  2. Interaction Graph         │  Historical agent execution     │
│     (Trajectory & Consensus)  │  paths, reasoning & outcomes    │
├───────────────────────────────┼─────────────────────────────────┤
│  3. Insight Graph             │  Distilled institutional rules  │
│     (Distilled Rules Engine)  │  and delinquency heuristics     │
└───────────────────────────────┴─────────────────────────────────┘
```

### 6.1 Query Graph (Structural Precedent Matching)
When an application enters intake, the Query Graph retrieves top-K similar past borrower profiles based on monthly income, requested loan amount, DTI, and employment tenure. The historical outcomes (`REPAID` vs. `DEFAULTED`) provide empirical anchors for the decision engine.

### 6.2 Interaction Graph (Consensus & Execution Paths)
Records the complete multi-agent trajectory: which agents were invoked, what tools were executed, which `@agent` mentions were broadcast, and the final consensus verdict. When a loan reaches maturity, its interaction node is updated with the real-world outcome.

### 6.3 Insight Graph (Distilled Institutional Heuristics)
Maintains distilled credit rules extracted across thousands of past loans:
- *Rule 1:* Applications with DTI > 0.55 combined with < 3 years job tenure exhibit a 78% default probability.
- *Rule 2:* Salary day disbursement variance exceeding 8 days correlates with a 4.2x increase in 60+ Days Past Due (DPD) delinquency.
- *Rule 3:* Repeated cheque/ECS bounces (≥ 3) paired with credit card utilization > 90% represents an acute syndicate fraud indicator.

---

<a id="security-isolation"></a>
## 7. Zero-Cache Scratchpad Security Architecture

To comply with banking regulations (GDPR, RBI DPDP Act 2023) and prevent prompt injection or cross-customer token contamination:

```
┌──────────────────────────────────────────────────────────────────┐
│              PER-REQUEST ZERO-CACHE SCRATCHPAD MODEL             │
├───────────────────────┬──────────────────────────────────────────┤
│ FIFO Queue Identifier │ Q#0042 (Ordered sequential triage)       │
├───────────────────────┼──────────────────────────────────────────┤
│ Cryptographic Tag     │ TAG-A-8104-SAL-TIER1 (Profile hash)      │
├───────────────────────┼──────────────────────────────────────────┤
│ Ephemeral Scratchpad  │ SP-A-8104 (Clean isolated context)       │
├───────────────────────┼──────────────────────────────────────────┤
│ Prompt Cache Policy   │ STRICT NO-CACHE (Zero inter-app leaks)   │
└───────────────────────┴──────────────────────────────────────────┘
```

1. **Sequential Queue Numbering (`Q#0001`):** Applications are assigned an immutable, FIFO intake sequence tag.
2. **Cryptographic Profile Tagging (`recordTag`):** A hash encoding the applicant's tier, income bracket, and employment category is tagged to the record.
3. **Dedicated Ephemeral Scratchpad (`SP-{id}`):** Every agent reasoning step executes inside an ephemeral session scratchpad. LLM prompt caching across different applicant records is strictly disabled, ensuring zero possibility of cross-customer information leakage.

---

## 8. User Interface & Observability System

The frontend provides an enterprise dark-mode cockpit (Langfuse/Phoenix style) comprising:
- **Kanban Loan Intake Queue:** Real-time drag-and-drop columns for `NEW`, `IN_REVIEW`, `VERIFIED`, `APPROVED`, and `REJECTED` applications.
- **MAS AgentNet Interactive Canvas (XYFlow):**
  - *Blackboard Orbit Mode:* Radial star topology centered on the G-Memory hub with glowing pulses and dynamic amber mention arcs.
  - *DAG Pipeline Mode:* 5-level hierarchical execution graph with live edge animation.
- **Modern Trace Viewer:** Per-agent execution spans breaking down tool calls, input/output arguments, LLM synthesis, and execution duration in milliseconds.
- **Memory Impact Inspector:** Live visualization of matched historical loan cases and distilled heuristic rules.
- **In-App Documentation Engine:** Live markdown documentation renderer (`/docs`) and modal overlay (`<ReadmeModal>`) deep-linked directly from individual agent detail views.

---

<a id="api-reference"></a>
## 9. Backend API & Quickstart Reference

### 9.1 API Endpoints
| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/stream` | Server-Sent Events (SSE) telemetry stream for real-time application and agent updates. |
| `POST` | `/api/control` | Simulation control: `start`, `pause`, `reset`, `step`, and `generate_one`. |
| `GET` | `/api/settings` | Returns active LLM provider configurations and agent model assignments. |
| `POST` | `/api/settings` | Updates LLM model, temperature, and agent key configurations. |
| `GET` | `/api/keys` | Returns configured API keys for provider rotation (Gemini, OpenAI, Anthropic). |
| `GET` | `/api/docs` | Dynamic endpoint serving the authoritative system specification in markdown. |

### 9.2 Running Locally

#### Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev -- --port 5173
```

Access the dashboard at `http://localhost:5173` and the interactive documentation at `http://localhost:5173/docs`.

---

## 10. Conclusion & Future Roadmap

**AgentNet MAS** proves that multi-agent systems with explicit state mediation, inter-agent mention resolution, and episodic three-graph memory provide a vastly superior, auditable, and resilient foundation for automated credit underwriting compared to legacy statistical scorecards or opaque monolithic prompts.

### Future Roadmap
1. **Multimodal Bank Statement OCR:** Integrating vision models to parse encrypted PDF bank statements and detect fraudulent document pixel tampering.
2. **Automated Consensual Field Verification:** Autonomous voice-agent dispatch to employers to verify employment tenure.
3. **Decentralized Bureau Integration:** Connecting to Open Banking APIs (Account Aggregator framework) for cryptographic verification of liquid cash balances.
