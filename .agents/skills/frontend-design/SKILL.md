---
name: frontend-design
description: >-
  Design principles and aesthetics for building the Credit Decisioning MAS
  dashboard and application UI.
---

# Frontend Design — Credit Decisioning Dashboard

## Overview

The frontend is a React-based dashboard for the Credit Decisioning MAS. It must
communicate complex multi-agent decisions, risk assessments, and explainability
outputs in a way that feels premium, trustworthy, and instantly understandable
to bank operations staff and compliance officers.

---

## Key UI Screens

### 1. Live Request Queue & Inspector
The main operational view — shows all applications flowing through the system.

```
┌──────────────────────────────────────────────────────────────┐
│ 📋 REQUEST QUEUE                                  [3 workers] │
│ ─────────────────                                             │
│                                                               │
│ Queued (4)  │  Processing (3)           │  Completed          │
│ ─────────── │  ───────────────────────── │  ──────────         │
│ ⏳ #A-4821  │  🔄 #A-4818 ➜ Credit     │  ✅ #A-4815        │
│ ⏳ #A-4822  │  🔄 #A-4819 ➜ KYC        │  ✅ #A-4816        │
│ ⏳ #A-4823  │  🔄 #A-4820 ➜ Fraud      │  ❌ #A-4817        │
│ ⏳ #A-4824  │                           │  ✅ #A-4814        │
│             │                           │                     │
│ Queue depth: 4  │  Avg wait: 2.1s       │  Cache hit: 84%    │
└──────────────────────────────────────────────────────────────┘
```

**Click any request** to open the live inspector detail:

```
┌──────────────────────────────────────────────────────────────┐
│ 🔍 REQUEST #A-4818 — LIVE INSPECTOR                         │
│ ─────────────────────────────                                │
│                                                               │
│ Customer: C-29471  │  Score: 695  │  Amount: ₹85,000         │
│ Income: ₹58,000    │  DTI: 0.41   │  Risk: MEDIUM            │
│                                                               │
│ Pipeline Progress:                                            │
│ ┌──────┐   ┌──────┐   ┌──────┐   ┌──────┐   ┌──────┐       │
│ │ KYC  │──▶│Credit│──▶│Afford│──▶│Policy│──▶│Price │       │
│ │  ✅  │   │ 🔄🔄 │   │  ⏳  │   │  ⏳  │   │  ⏳  │       │
│ │0.3s  │   │1.2s  │   │      │   │      │   │      │       │
│ └──────┘   └──────┘   └──────┘   └──────┘   └──────┘       │
│                                                               │
│            ┌──────┐                                          │
│            │Fraud │  ← SKIPPED (fraud risk 0.08)             │
│            │  ━━  │                                          │
│            └──────┘                                          │
│                                                               │
│ Current Agent: Credit Agent                                  │
│ Status: Analyzing credit history... (1.2s elapsed)           │
│                                                               │
│ 🔄 Live Output Stream:                                      │
│ ┌─────────────────────────────────────────────────────┐      │
│ │ [Credit] Checking bureau records...                 │      │
│ │ [Credit] Score 695 — borderline, requesting full    │      │
│ │          history analysis...                        │      │
│ │ [Credit] ▊▊▊▊▊▊░░░░ 62% complete                  │      │
│ └─────────────────────────────────────────────────────┘      │
│                                                               │
│ Memory Retrieved: 3 similar apps (see Memory Impact panel)   │
│ Cache: Credit agent result MISS (new input combination)      │
└──────────────────────────────────────────────────────────────┘
```

**Key features:**
- **Queue columns**: Queued → Processing → Completed, with live status icons.
- **Click-to-inspect**: Click any request to see its pipeline progress, current agent, live output.
- **Agent node states**: ✅ done, 🔄 active (with elapsed time), ⏳ pending, ━━ skipped.
- **Live output stream**: Real-time text from the active agent (scrolling log).
- **Cache indicator**: Shows if the current agent result was a cache hit or miss.

### 2. Agent Orchestration Visualization
An animated directed graph showing **agent-to-agent communication** in real-time.
This is not just a static pipeline — it shows the dynamic topology that AgentNet creates.

```
                    ┌─────────┐
                    │  Queue  │
                    │  (4)    │
                    └────┬────┘
                         │
                    ┌────▼────┐
           ┌───────▶│ Memory  │◀──── G-Memory
           │        │Retrieve │      (3 similar apps)
           │        └────┬────┘
           │             │
           │        ┌────▼────┐
           │        │  Risk   │
           │        │ Assess  │──── R = f(expertise, risk, uncertainty...)
           │        └────┬────┘
           │             │
           │        ┌────▼────┐
           │        │ Router  │──── Innovation #1: Dynamic path selection
           │        └────┬────┘
           │            ╱ ╲
           │    LOW risk   HIGH risk
           │      ╱             ╲
           │ ┌───▼───┐     ┌───▼───┐
           │ │  KYC  │     │  KYC  │
           │ └───┬───┘     └───┬───┘
           │     │             │
           │     │         ┌───▼───┐
           │     │         │ Fraud │◄── 🔴 only for high risk
           │     │         └───┬───┘
           │ ┌───▼───┐     ┌───▼───┐
           │ │Credit │     │Credit │
           │ └───┬───┘     └───┬───┘
           │ ┌───▼───┐     ┌───▼───┐
           │ │Afford │     │Afford │
           │ └───┬───┘     └───┬───┘
           │     │         ┌───▼───┐
           │     │         │Policy │◄── 🔴 only for medium/high
           │     │         └───┬───┘
           │ ┌───▼───┐     ┌───▼───┐
           │ │Price  │     │Price  │
           │ └───┬───┘     └───┬───┘
           │     │             │
           │ ┌───▼─────────────▼───┐
           │ │     Decision        │
           │ └─────────┬───────────┘
           │           │
           │    ┌──────▼──────┐
           └────│  Outcome    │──── Innovation #2: Feeds back to memory
                │  (later)    │
                └─────────────┘
```

**Animated behaviors:**
- **Pulsing nodes**: Active agents pulse with a glow effect.
- **Flowing edges**: Data flow shown as animated dashes moving along edges.
- **Branch highlight**: The LOW vs HIGH risk path lights up based on current routing.
- **Skipped agents**: Grayed out with a dashed border and "SKIPPED" label.
- **Concurrent requests**: Multiple applications visible simultaneously — each as a
  colored dot moving through the graph at different stages.
- **Feedback loop arrow**: The Outcome → Memory arrow animates when outcome feedback is stored.

### 3. Decision Detail Screen

```
┌──────────────────────────────────────────┐
│ FINAL DECISION                           │
│ ─────────────────                        │
│ Decision: APPROVED                       │
│ Approved Limit: ₹60,000                 │
│ Risk Level: MEDIUM                       │
│                                          │
│ Key Reasons:                             │
│ ✓ KYC verified                           │
│ ✓ No major fraud indicators              │
│ ✓ Good credit history                    │
│ ⚠ Moderate affordability risk            │
│                                          │
│ Pricing: 14%                             │
│ Confidence: 0.86                         │
└──────────────────────────────────────────┘
```

### 3. Routing Decision Card ⭐ (Innovation #1)
This is the **primary visual proof** of Risk-Aware Dynamic Agent Routing.
It must be visible on every decision detail screen — never hidden.

```
┌──────────────────────────────────────────────────────┐
│ 🔀 ROUTING DECISION                                 │
│ ─────────────────────                                │
│                                                      │
│ Risk Profile:                                        │
│   Credit Risk  ████████░░  HIGH                      │
│   Fraud Risk   ███░░░░░░░  LOW                       │
│   Affordability████████░░  HIGH                      │
│   Uncertainty  █████░░░░░  MEDIUM                    │
│                                                      │
│ Route Selected:                                      │
│   KYC ──→ Credit ──→ Affordability ──→ Policy ──→    │
│   Pricing ──→ [Decision]                             │
│                                                      │
│ Agents SKIPPED (low risk):                           │
│   ○ Fraud Detection — fraud risk LOW (0.12)          │
│                                                      │
│ Why this route?                                      │
│   ● High affordability risk triggered full           │
│     Credit → Affordability → Policy chain            │
│   ● Low fraud risk allowed skipping Fraud Agent      │
│   ● Saved ~2.3s vs full pipeline                     │
│                                                      │
│ Compared to fixed pipeline:                          │
│   ⚡ 3 agents skipped  │  ⏱ 40% faster              │
└──────────────────────────────────────────────────────┘
```

**Key elements:**
- **Risk profile bars** — visual breakdown of each risk dimension feeding the routing.
- **Route visualization** — the actual agent sequence chosen, with skipped agents grayed out.
- **"Why this route?"** — plain-language explanation of the routing decision.
- **Comparison badge** — how much faster/different vs. a fixed pipeline (proves Innovation #1 value).

### 4. Memory Impact Panel ⭐ (Innovation #2)
This is the **primary visual proof** of Outcome-Linked Memory.
Shown alongside the decision, it demonstrates that G-Memory influenced the result.

```
┌──────────────────────────────────────────────────────┐
│ 🧠 MEMORY IMPACT                                    │
│ ─────────────────                                    │
│                                                      │
│ Similar Past Applications Retrieved: 3               │
│                                                      │
│ ┌─────────────────────────────────────────────────┐  │
│ │ App #A-2847  │ Score: 720 │ ₹80K │ → APPROVED  │  │
│ │ Outcome: ✅ REPAID (6 months)                   │  │
│ │ Route used: KYC→Credit→Afford→Pricing           │  │
│ └─────────────────────────────────────────────────┘  │
│ ┌─────────────────────────────────────────────────┐  │
│ │ App #A-1923  │ Score: 695 │ ₹90K │ → APPROVED  │  │
│ │ Outcome: ❌ DEFAULTED (month 4)                 │  │
│ │ Route used: KYC→Credit→Afford→Pricing           │  │
│ │ ⚠ Insight: DTI was 0.52, limit should have      │  │
│ │   been reduced                                  │  │
│ └─────────────────────────────────────────────────┘  │
│ ┌─────────────────────────────────────────────────┐  │
│ │ App #A-3401  │ Score: 705 │ ₹70K │ → APPROVED  │  │
│ │ Outcome: ✅ REPAID (12 months)                  │  │
│ │ Route used: KYC→Credit→Afford→Policy→Pricing    │  │
│ └─────────────────────────────────────────────────┘  │
│                                                      │
│ Memory Influence on This Decision:                   │
│   ● Limit reduced from ₹75K → ₹60K because          │
│     similar App #A-1923 defaulted at ₹90K            │
│   ● Policy Guard added because App #A-3401's         │
│     route included it and had best outcome           │
│                                                      │
│ Decision Quality Over Time:                          │
│   Empty memory:  72% accuracy                        │
│   Current (N=47): 86% accuracy  ↑ +14%               │
└──────────────────────────────────────────────────────┘
```

**Key elements:**
- **Retrieved similar apps** — with their outcomes (✅/❌), showing what the system "remembered".
- **"Memory Influence"** — explicit callout of HOW memory changed this specific decision.
- **Accuracy trend** — shows the learning curve (proves Innovation #2 value).

### 5. Simulation Control Panel
The system includes a **data simulation engine** (pure math, no LLM) for live demos.

```
┌──────────────────────────────────────────────────────┐
│ ⚡ SIMULATION CONTROLS                               │
│ ─────────────────────                                │
│                                                      │
│ Status: ● RUNNING                    [Stop] [Pause]  │
│                                                      │
│ Request Rate:                                        │
│   ◀ ████████░░░░ ▶   12 apps/min                    │
│                                                      │
│ Risk Distribution:                                   │
│   Low    ████████░░  60%                             │
│   Medium ████░░░░░░  30%                             │
│   High   █░░░░░░░░░  10%                             │
│                                                      │
│ Time Compression:  ● 1x  ○ 10x  ○ 100x              │
│ (Simulates monitoring over weeks/months)              │
│                                                      │
│ ┌──────────────────────────────────────────────┐     │
│ │ Live Stats                                   │     │
│ │ Total processed:     147                     │     │
│ │ Approved:            112 (76%)               │     │
│ │ Rejected:             23 (16%)               │     │
│ │ Escalated:            12 (8%)                │     │
│ │ Avg pipeline time:    1.2s                   │     │
│ │ Memory entries:       89                     │     │
│ │ Decision accuracy:    84% (↑ from 71%)       │     │
│ └──────────────────────────────────────────────┘     │
│                                                      │
│ [Reset Memory]  [Export Results]  [Seed: 42 🔄]      │
└──────────────────────────────────────────────────────┘
```

**Controls:**
- **Start/Stop/Pause** — toggle the simulation on and off.
- **Request rate slider** — 1 to 60 applications per minute.
- **Risk distribution** — adjust the mix of low/medium/high risk applications.
- **Time compression** — simulate monitoring outcomes over weeks in minutes (for Innovation #2 demo).
- **Seed control** — reproducible random generation for consistent demos.
- **Live stats** — real-time counters showing the system in action.
- **Reset Memory** — clear G-Memory to demonstrate cold-start vs. warm performance.

### 6. Agent Trace / Explainability Panel (Langfuse Style)
The primary UI for inspecting an agent's execution must use a **Deep Hierarchical Tree Trace** (inspired by Langfuse and Opik), completely replacing flat logs or simple Kanban columns.

```
┌──────────────────────────────────────────────────────────────┐
│ 🧠 AGENT TRACE: Credit Agent                                 │
│ ────────────────────────────                                 │
│                                                              │
│ ▼ [13:42:01] Root Task (Credit_Analysis) → COMPLETED         │
│   │  Duration: 4.2s  │  Tokens: 1,245  │  Cost: $0.003       │
│   │                                                          │
│   ├── ▼ [13:42:02] Tool Call: Calculator("50000 / 12")       │
│   │   │  Duration: 0.1s                                      │
│   │   │  Input JSON: { "expression": "50000 / 12" }          │
│   │   │  Output: "4166.66"                                   │
│   │                                                          │
│   ├── ▶ [13:42:03] Sub-agent: WebSearch (Risk check)         │
│   │      (Expandable nested sub-tree)                        │
│   │                                                          │
│   └── ▼ [13:42:05] LLM Generation (Final Decision)           │
│       │  Tokens: 850                                         │
│       │  Output: "Based on the DTI of 0.41, approve."        │
└──────────────────────────────────────────────────────────────┘
```

**Key visual elements:**
- **Collapsible Tree Nodes:** Every tool call or LLM generation is a nested child node.
- **Micro-metrics per node:** Every step must display its specific latency, token usage, and status.
- **Structured Payloads:** Tool inputs/outputs are displayed as syntax-highlighted JSON blocks, not raw strings.
- **Vertical Guide Lines:** Subtle left borders (`border-left: 1px solid rgba(...)`) to visually connect parent-child relationships.

### 7. Risk Monitoring Dashboard (Stretch Goal)
- Portfolio-level view of approved loans.
- Risk migration matrix (how many loans moved from LOW → MEDIUM → HIGH).
- Early warning indicators for deteriorating loans.
- Powered by simulation time-compression for demo.

### 8. G-Memory Insights Panel (Stretch Goal)
- Visualize similar past applications that influenced the decision.
- Show which insights from the Insight Graph were retrieved.
- Display the agent collaboration trajectory used.

---

## Design System

### Color Palette
| Token | Use | Value |
|:------|:----|:------|
| `--risk-low` | Low risk indicators | `#10B981` (emerald) |
| `--risk-medium` | Medium risk indicators | `#F59E0B` (amber) |
| `--risk-high` | High risk indicators | `#EF4444` (red) |
| `--bg-primary` | Main background | `#0F172A` (slate-900, dark mode) |
| `--bg-surface` | Card/panel surfaces | `#1E293B` (slate-800) |
| `--bg-surface-elevated` | Elevated cards, modals | `#334155` (slate-700) |
| `--text-primary` | Primary text | `#F8FAFC` (slate-50) |
| `--text-secondary` | Secondary/muted text | `#94A3B8` (slate-400) |
| `--accent-primary` | Primary actions, links | `#6366F1` (indigo-500) |
| `--accent-secondary` | Secondary highlights | `#8B5CF6` (violet-500) |
| `--agent-active` | Active agent node | `#3B82F6` (blue-500) |
| `--agent-complete` | Completed agent node | `#10B981` (emerald-500) |
| `--agent-skipped` | Skipped agent node | `#64748B` (slate-500) |

### Typography
- **Primary font**: Inter (headings and body).
- **Monospace**: JetBrains Mono (agent traces, confidence scores, code).
- **Scale**: 12px (caption) → 14px (body) → 16px (subtitle) → 20px (title) → 28px (h1).

### Component Patterns
- **Glassmorphism** for elevated surfaces (backdrop-blur, semi-transparent backgrounds).
- **Subtle gradients** on risk indicators (not flat colors).
- **Micro-animations**: Smooth transitions when agents complete (node glow, connection line draw).
- **Skeleton loading**: Show agent nodes as pulsing skeletons while processing.

---

## Dashboard Layout

```
┌────────────────────────────────────────────────────────────────────┐
│ Sidebar (collapsed)  │  Main Content Area                        │
│                      │                                            │
│ 📊 Dashboard         │  ┌─────────────────────────────────────┐  │
│ 📋 Queue & Requests  │  │ Request Queue (Queued│Active│Done)  │  │
│ 🔀 Orchestration     │  │ Click any request to inspect live   │  │
│ 🔍 Search            │  └─────────────────────────────────────┘  │
│ 📈 Monitoring        │                                            │
│ 🧠 Memory Insights   │  ┌──────────────┐  ┌──────────────────┐  │
│ ⚡ Simulation        │  │ Orchestration│  │ Live Inspector   │  │
│ ⚙️ Settings          │  │ Graph (anim.)│  │ (selected req)   │  │
│                      │  └──────────────┘  └──────────────────┘  │
│                      │                                            │
│                      │  ┌──────────────┐  ┌──────────────────┐  │
│                      │  │ Routing Card │  │ Memory Impact    │  │
│                      │  │ (Innovation 1│  │ (Innovation 2)   │  │
│                      │  └──────────────┘  └──────────────────┘  │
│                      │                                            │
│                      │  ┌─────────────────────────────────────┐  │
│                      │  │ Recent Decisions (Table + risk tags)│  │
│                      │  └─────────────────────────────────────┘  │
│                      │                                            │
│                      │  ┌─────────────────────────────────────┐  │
│                      │  │ Simulation Controls (if active)     │  │
│                      │  │ Rate│Distribution│Stats│Cache Hits  │  │
│                      │  └─────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

---

## Screen Priority for Capstone

| Priority | Screen | Why |
|:---------|:-------|:----|
| 🔴 MVP | Application Pipeline + Routing Decision Card | Proves Innovation #1 |
| 🔴 MVP | Decision Detail + Memory Impact Panel | Proves Innovation #2 |
| 🔴 MVP | Simulation Control Panel | Powers the live demo |
| 🟡 Important | Agent Trace / Explainability Panel | Core project feature |
| 🟢 Stretch | Risk Monitoring Dashboard | Nice for Stage 2 demo |
| 🟢 Stretch | G-Memory Insights Panel | Visual but not essential |

## Accessibility vs. Banking Complexity — Design Tradeoffs

Banking dashboards must show **dense, critical data** (risk scores, agent traces,
financial figures, queue states, pipeline graphs). But accessibility standards
demand **clarity, readability, and multi-modal communication**. These often conflict.

### The Tension Map

| UI Element | Banking Need (Complexity) | Accessibility Need | Conflict? |
|:-----------|:--------------------------|:-------------------|:----------|
| **Risk colors** | Instant visual scanning — glance at 50 rows and spot the HIGH risk ones | Color alone fails colorblind users (8% of men). WCAG requires non-color indicators | ⚠️ YES |
| **Agent flow graph** | Animated topology with pulsing nodes, flowing edges, concurrent dots | Animations cause issues for vestibular disorders. Screen readers can't parse visual graphs | ⚠️ YES |
| **Data density** | Bank staff want 15+ columns visible, compact rows, minimal whitespace | Small text and tight spacing hurt low-vision users. WCAG AA minimum contrast 4.5:1 | ⚠️ YES |
| **Queue live updates** | Real-time SSE updates every second — new rows appearing, status changing | Auto-updating content disorients screen reader users. Focus can jump unexpectedly | ⚠️ YES |
| **Financial figures** | ₹ amounts in lakhs/crores, DTI ratios to 4 decimals, confidence scores | Numbers need sufficient size and spacing. Indian numbering is unfamiliar to some screen readers | 🟡 MILD |
| **Dark mode** | Extended use dashboard, reduces eye strain | Dark backgrounds can reduce contrast if not calibrated carefully | 🟡 MILD |
| **Agent traces** | Expandable JSON/text blocks, nested reasoning chains | Accordion patterns need proper ARIA. Long text blocks need logical reading order | ✅ SOLVABLE |
| **Decision card** | Fixed layout with risk badge + amounts + explanation | Structured content is inherently accessible if semantics are correct | ✅ EASY |

### Resolution: Triple-Encoding for Risk

**Never use color alone.** Every risk indicator uses **color + shape + text**:

| Risk Level | Color | Shape/Icon | Badge Text | Screen Reader |
|:-----------|:------|:-----------|:-----------|:-------------|
| LOW | `#10B981` emerald | ● (circle) + ✓ | `LOW` | "Risk level: Low" |
| MEDIUM | `#F59E0B` amber | ▲ (triangle) + ⚠ | `MEDIUM` | "Risk level: Medium" |
| HIGH | `#EF4444` red | ◆ (diamond) + ✕ | `HIGH` | "Risk level: High" |
| CRITICAL | `#DC2626` dark red | ◆◆ (double diamond) + ⛔ | `CRITICAL` | "Risk level: Critical" |

This means a colorblind user can still distinguish risk by shape alone.
A screen reader user hears the label. A sighted user scans by color.

### Resolution: Animation Respect

Use `prefers-reduced-motion` to swap all animations for static alternatives:

| Element | Normal | Reduced Motion |
|:--------|:-------|:---------------|
| Pulsing agent node | Glow pulse animation | Solid 2px border in agent-active color |
| Flowing edge dashes | Animated dash movement | Static dashed line |
| Queue entry appearing | Slide-in from left | Instant appear with subtle opacity fade |
| Progress bar | Smooth width animation | Step-based fill (0%, 25%, 50%, 75%, 100%) |
| Orchestration dot flow | Colored dot moving through graph | Static dot at current position |

```css
@media (prefers-reduced-motion: reduce) {
  .agent-node--active { animation: none; border: 2px solid var(--agent-active); }
  .edge-flow { animation: none; stroke-dasharray: 5 5; }
  .queue-entry { transition: none; }
}
```

### Resolution: Progressive Data Density

Bank staff need density. Accessibility needs readability. Use **progressive disclosure**:

**Default table columns (5 — scannable):**
| ID | Risk ▲ | Status | Amount | Decision |
|:---|:-------|:-------|:-------|:---------|
| #A-4818 | ▲ MEDIUM | 🔄 Credit | ₹85,000 | — |

**Expanded on row click (+ 5 more — detail):**
| Score | Income | DTI | Pipeline Time | Route |
|:------|:-------|:----|:-------------|:------|
| 695 | ₹58,000 | 0.41 | 3.2s | KYC→Credit→Afford→Policy→Price |

**Rules:**
- Minimum body text: `14px` (never smaller for data).
- Captions and labels: `12px` minimum.
- Row height: `44px` minimum (meets WCAG touch target).
- Column headers: `scope="col"` for screen readers.
- Sort state: `aria-sort="ascending"` / `"descending"`.

### Resolution: Live Updates Without Disorientation

The queue updates via SSE every second. Without care, this breaks screen readers.

| Pattern | Implementation |
|:--------|:--------------|
| **ARIA live region** | Queue counter uses `aria-live="polite"` — screen reader announces new count without interrupting |
| **No focus stealing** | New queue entries append at the end. Never move focus to a new entry automatically |
| **Manual refresh option** | Add a "Refresh" button alongside the live feed for users who disable auto-updates |
| **Status announcements** | When a selected request changes status: `aria-live="assertive"` announces "Request A-4818 moved to Credit Agent" |
| **Pause updates** | A "Pause live updates" toggle freezes the display for careful reading |

```html
<!-- Queue counter with polite announcements -->
<div aria-live="polite" aria-atomic="true">
  Queue: <span id="queue-count">4</span> pending,
  <span id="active-count">3</span> processing
</div>

<!-- Individual request status (assertive only for selected request) -->
<div aria-live="assertive" id="selected-request-status">
  Request #A-4818: Credit Agent processing (1.2s)
</div>
```

### Resolution: Agent Flow Graph Accessibility

The animated orchestration graph is purely visual. It needs a text alternative:

| For Sighted Users | For Screen Reader Users |
|:------------------|:-----------------------|
| Animated graph with branching paths | Ordered list: "Step 1: Memory Retrieval. Step 2: Risk Assessment — MEDIUM. Step 3: Router — selected path: KYC, Credit, Affordability, Policy, Pricing. Skipped: Fraud (low fraud risk)." |
| Pulsing active node | `aria-current="step"` on the active step |
| Skipped node (grayed out) | "Fraud Agent: Skipped. Reason: fraud risk score 0.08 below threshold 0.3" |

```html
<!-- Visual graph for sighted users -->
<div class="orchestration-graph" aria-hidden="true">
  <!-- SVG/Canvas animation here -->
</div>

<!-- Text alternative for screen readers -->
<ol class="sr-only" aria-label="Agent pipeline for request A-4818">
  <li>Memory Retrieval — 3 similar apps found</li>
  <li>Risk Assessment — MEDIUM risk</li>
  <li aria-current="step">Credit Agent — processing (1.2s)</li>
  <li>Affordability Agent — pending</li>
  <li>Policy Guard — pending</li>
  <li>Pricing Agent — pending</li>
  <li aria-disabled="true">Fraud Agent — skipped (risk 0.08)</li>
</ol>
```

---

## Design Principles (Final)

1. **Innovations first** — the Routing Decision Card and Memory Impact Panel must
   be the most prominent elements on the decision screen. A reviewer should
   immediately see WHAT your system does differently.
2. **Trust through transparency** — every AI decision must show its reasoning.
   Users should never see a decision without understanding WHY.
3. **Triple-encode risk** — color + shape + text for every risk indicator.
   Never color alone.
4. **Dark mode first** — financial dashboards are used for extended periods.
   Default to dark mode. All colors verified for WCAG AA contrast (4.5:1 body,
   3:1 large text) on `#0F172A` background.
5. **Progressive density** — start with 5 scannable columns, expand on click.
   Minimum `14px` body, `44px` row height.
6. **Respect `prefers-reduced-motion`** — swap animations for static indicators.
   The dashboard must be fully usable without any animation.
7. **Desktop-first** — primary users are on 1920×1080+. No mobile layout needed
   for the capstone, but no hardcoded widths either.

---

## Interaction Patterns

- **Agent flow graph**: Interactive — click an agent node to expand its reasoning trace.
  Screen reader users get an ordered list alternative with `aria-current="step"`.
- **Routing card**: Always visible alongside the decision — never behind a tab or click.
- **Memory impact**: Expandable cards for each similar past application. Collapsed by
  default with outcome badges (✅/❌) visible. Each card has `aria-expanded` state.
- **Simulation controls**: Persistent bottom bar when simulation is active. Shows
  rate, queue depth, cache hit rate. Includes "Pause updates" toggle.
- **Risk indicators**: Hover for tooltip with contributing factors. Tooltips also
  triggered on focus (keyboard accessible).
- **Application table**: Sortable (with `aria-sort`), filterable by risk level, status,
  date range. Row click opens decision detail.
- **Live updates**: SSE-powered. Queue counter uses `aria-live="polite"`. Selected
  request status uses `aria-live="assertive"`.
- **Keyboard navigation**: Tab through queue → table → inspector → decision panels.
  `Escape` closes expanded panels. Arrow keys navigate table rows.

