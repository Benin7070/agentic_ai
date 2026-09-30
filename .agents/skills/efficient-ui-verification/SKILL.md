---
name: efficient-ui-verification
description: >
  Efficient frontend verification for Antigravity projects. Minimize browser-agent,
  DOM inspection, screenshot, and LLM-token usage by preferring deterministic tests,
  targeted semantic inspection, and automated visual diffs. Use browser visual
  reasoning only when deterministic checks cannot answer the question.
---

# Efficient UI Verification

## Purpose

Verify frontend correctness with the **cheapest reliable mechanism first**.

The default mistake to avoid is:

```text
code change
→ open browser
→ inspect large DOM
→ interact manually
→ screenshot
→ send screenshot to LLM
→ reason visually
→ repeat
```

Prefer:

```text
code change
→ static checks
→ unit/component tests
→ targeted Playwright assertions
→ targeted accessibility/ARIA checks
→ automated screenshot diff
→ browser-agent visual reasoning only on failure or genuine visual ambiguity
```

The goal is not to eliminate browser testing.

The goal is to use the browser agent as an **expensive visual expert**, not as the default test runner.

---

# 1. Verification Priority

Always prefer mechanisms in this order unless the task specifically requires otherwise:

1. Type checking / build validation
2. Linting / formatting
3. Unit tests
4. Component tests
5. API/integration tests
6. Playwright functional assertions
7. Targeted accessibility-tree / ARIA inspection
8. Automated screenshot comparison
9. Browser-agent visual inspection

Move down the list only when the higher-level check cannot establish the required property.

---

# 2. Core Rule

## Never use a screenshot when an assertion can answer the question.

Bad:

```text
"Take a screenshot and determine whether the decision status is Manual Review."
```

Good:

```ts
await expect(
  page.getByTestId("decision-status")
).toHaveText("Manual Review");
```

The browser agent should not visually infer deterministic facts that the DOM, API, or test framework can verify exactly.

---

# 3. Never Inspect the Entire DOM by Default

Do not dump or inspect:

```text
document.body.innerHTML
entire accessibility tree
entire page DOM
all network logs
all component state
```

unless debugging requires it.

Prefer a targeted locator:

```ts
page.getByRole("button", { name: "Approve" })
page.getByRole("heading", { name: "Final Decision" })
page.getByTestId("decision-summary")
page.getByTestId("agent-network")
page.getByTestId("memory-explorer")
```

The inspection unit should be the **smallest region that can answer the question**.

---

# 4. Use Semantic Locators First

Prefer:

```ts
getByRole()
getByLabel()
getByText()
getByPlaceholder()
```

Use `data-testid` for stable application-specific regions that are difficult to express semantically.

Do not create implementation-dependent selectors such as:

```text
div:nth-child(4)
.card > div > span
.blue-box
```

Good test IDs represent product meaning:

```text
case-header
decision-summary
risk-summary
evidence-panel
agent-network
agent-inspector
execution-trace
memory-explorer
memory-impact
human-review
audit-timeline
```

Bad test IDs represent implementation:

```text
div-123
card-7
blue-panel
left-box
```

---

# 5. Accessibility Checks Without Full Browser Reasoning

For complex interfaces, inspect the **accessible structure**, not the raw HTML.

Use Playwright ARIA snapshots where useful:

```ts
const snapshot = await page
  .getByRole("main")
  .ariaSnapshot({
    mode: "ai",
    depth: 4
  });
```

Prefer a limited subtree:

```ts
page.getByTestId("decision-summary")
page.getByTestId("agent-inspector")
page.getByTestId("memory-impact")
```

rather than the entire page.

Use accessibility inspection to verify:

- headings
- labels
- buttons
- statuses
- navigation
- dialogs
- tables
- important relationships
- dynamic status messages

Do not use an accessibility snapshot as a substitute for all functional assertions.

---

# 6. Test Semantics, Not Visual Implementation

For each important feature define a **semantic contract**.

Example:

```text
Decision Workspace

Required:
- applicant identifier is exposed
- decision status is exposed
- risk value is exposed
- current review state is exposed
- evidence action exists
- memory impact section exists
```

Then test it directly.

```ts
await expect(page.getByTestId("applicant-id")).toBeVisible();
await expect(page.getByTestId("decision-status")).toBeVisible();
await expect(page.getByTestId("risk-score")).toBeVisible();
await expect(page.getByTestId("memory-impact")).toBeVisible();
```

This avoids asking an LLM to visually infer whether the screen contains required information.

---

# 7. Separate Correctness from Appearance

Every important screen should have two independent test layers.

## Functional / semantic

Answers:

```text
Does it work?
Is the data correct?
Is the state correct?
Are interactions correct?
Is it accessible?
```

## Visual

Answers:

```text
Does it look correct?
Is layout broken?
Did spacing change?
Did typography regress?
Did graph composition become unreadable?
```

Do not use one to replace the other.

---

# 8. Use Playwright for Deterministic Functional Tests

Example:

```ts
test("decision workflow", async ({ page }) => {
  await page.goto("/cases/CR-0182");

  await expect(
    page.getByRole("heading", { name: "Final Decision" })
  ).toBeVisible();

  await expect(
    page.getByTestId("decision-status")
  ).toHaveText("Manual Review");

  await expect(
    page.getByTestId("risk-score")
  ).toHaveText("71");

  await page.getByRole("button", {
    name: "Inspect Evidence"
  }).click();

  await expect(
    page.getByTestId("evidence-panel")
  ).toBeVisible();
});
```

The LLM should only receive a compact test result unless debugging is required.

---

# 9. Prefer Automated Screenshot Comparison

When a visual check is required, use Playwright visual assertions:

```ts
await expect(page).toHaveScreenshot("decision-workspace.png");
```

or a focused region:

```ts
await expect(
  page.getByTestId("decision-workspace")
).toHaveScreenshot("decision-workspace.png");
```

Do not manually inspect every screenshot.

The process should be:

```text
render
→ capture
→ compare with baseline
→ pass/fail
```

Only failures or ambiguous visual problems should trigger browser-agent reasoning.

---

# 10. Screenshot Scope Rules

Prefer this:

```ts
await expect(
  page.getByTestId("memory-explorer")
).toHaveScreenshot();
```

over:

```ts
await expect(page).toHaveScreenshot();
```

when only the memory explorer is being changed.

Capture the smallest useful visual region.

Recommended levels:

```text
Level 1 — component
Level 2 — feature region
Level 3 — full page
Level 4 — multi-page flow
```

Default to Level 1 or 2.

Use Level 3/4 only for layout or integration regressions.

---

# 11. Limit Visual Checkpoints

For a large workflow, do not screenshot every step.

Example:

```text
Application flow

1. Start
2. Upload
3. Classify
4. Pipeline
5. Score
6. Results
7. Explain
8. Decision
```

Use visual checkpoints only where visual composition matters:

```text
Decision workspace
Agent network
G-Memory explorer
Human review
```

Functional assertions should cover the intermediate steps.

---

# 12. Browser Agent Escalation Policy

Use browser-agent visual reasoning only when at least one of these is true:

- screenshot comparison failed
- responsive layout needs visual judgment
- graph readability needs visual judgment
- typography/spacing composition is uncertain
- a visual overlap is difficult to assert programmatically
- accessibility semantics pass but visual affordance is suspicious
- a human-like perception check is specifically requested

Do NOT use the browser agent for:

- exact text checks
- exact numeric values
- element existence
- button enabled/disabled state
- route selection
- API response correctness
- agent state correctness
- memory retrieval correctness
- database values
- deterministic calculations

---

# 13. AgentNet Testing

AgentNet is a computational system first and a visualization second.

Test the network state directly.

Example semantic state:

```text
RiskAgent       completed
FraudAgent      skipped
PolicyAgent     completed
ReviewAgent     pending
```

Assert it from structured state/API data.

Then separately test the graph rendering.

Do not ask the browser agent:

> "Did the graph choose the correct agents?"

Instead:

```ts
expect(network.route).toEqual([
  "intake",
  "risk",
  "policy",
  "review"
]);
```

Visual verification should only determine whether that correct state is rendered well.

---

# 14. G-Memory Testing

Test memory behavior outside visual inspection.

Verify:

```text
retrieval count
similarity threshold
successful memories
failed memories
insight retrieval
memory influence
memory update
trajectory storage
```

Example:

```ts
expect(result.memories).toHaveLength(3);
expect(result.memories[0].similarity).toBeGreaterThan(0.7);
expect(result.insight).toBeDefined();
```

Then use one focused screenshot test for:

```text
memory explorer
memory influence presentation
memory graph readability
```

Never infer backend memory correctness from graph appearance.

---

# 15. Credit Decision Testing

Deterministic financial logic must be tested as software.

Examples:

```text
DSCR
debt/equity
DTI
policy thresholds
limits
pricing calculations
eligibility
manual-review triggers
```

Test calculations using unit/integration tests.

Then test UI display separately:

```text
DSCR 1.54x
DTI 0.41
Risk 71
```

The browser should not be asked to “look at the number and decide whether the number seems right.”

---

# 16. Real-Time UI Testing

For SSE/WebSocket interfaces, test the underlying event state.

Example:

```text
event 1: intake.started
event 2: risk.started
event 3: memory.retrieved
event 4: risk.completed
event 5: policy.started
```

Assert the UI eventually reflects those states.

Do not make screenshot polling the primary real-time verification mechanism.

Avoid:

```text
sleep(1000)
screenshot
sleep(1000)
screenshot
```

Prefer state-based waits:

```ts
await expect(
  page.getByTestId("agent-status-risk")
).toHaveText("Completed");
```

---

# 17. Avoid Arbitrary Sleeps

Do not use:

```ts
await page.waitForTimeout(1000);
```

unless there is a documented reason.

Prefer:

```ts
await expect(locator).toBeVisible();
await expect(locator).toHaveText(...);
await page.waitForResponse(...);
await page.waitForLoadState(...);
```

Waiting on state is both faster and more reliable.

---

# 18. Visual Stability Rules

Before visual comparison:

- wait for fonts
- wait for important data
- wait for animations that affect layout
- freeze dynamic timestamps/counters where possible
- use deterministic test data
- disable nonessential animation for screenshot tests
- keep viewport stable

Never compare a constantly changing live dashboard without first controlling nondeterministic content.

---

# 19. Deterministic Test Data

Use fixed fixtures for visual tests.

Example:

```text
Case:
CR-0182

Applicant:
ACME Manufacturing

Risk:
71

PD:
8.72%

Memory:
3 retrieved

Agent route:
Intake → Risk → Policy → Review
```

Do not use random data in visual regression tests.

Dynamic values should be mocked or normalized.

---

# 20. Test Graphs Using State + Visual Snapshot

Graphs need two tests.

### State

```text
nodes
edges
statuses
route
selected node
```

### Visual

```text
layout
overlap
label readability
spacing
clipping
focus state
```

Do not attempt to prove graph correctness through screenshots alone.

---

# 21. Test Tables Semantically

For important financial tables, verify:

- headers
- row count
- critical values
- sorting
- filtering
- keyboard behavior
- responsive behavior
- accessible structure

Example:

```ts
const table = page.getByRole("table");

await expect(table).toBeVisible();

await expect(
  table.getByRole("columnheader", { name: "Revenue" })
).toBeVisible();
```

Use visual screenshots only for column sizing, density, alignment and responsive layout.

---

# 22. Test Responsive Layout at Selected Breakpoints

Do not screenshot dozens of resolutions.

Use a small representative set:

```text
Desktop:
1440 × 900

Laptop:
1280 × 800

Tablet:
1024 × 768

Mobile:
390 × 844
```

Only add more breakpoints when a real regression requires them.

---

# 23. Accessibility Regression Workflow

Run automated accessibility checks before browser-agent review.

Recommended flow:

```text
semantic assertions
        ↓
ARIA snapshot / accessibility assertions
        ↓
keyboard interaction tests
        ↓
automated accessibility scanner
        ↓
visual regression
        ↓
browser visual review only if needed
```

The browser agent should not be the accessibility test engine.

---

# 24. Keyboard-First Verification

For important operations verify:

```text
Tab
Shift+Tab
Enter
Space
Escape
Arrow keys where appropriate
```

Especially:

```text
dialogs
tables
menus
filters
graph controls
review actions
navigation
```

Never assume visual clickability implies keyboard accessibility.

---

# 25. Graph Accessibility Verification

Every complex graph should have an alternate representation.

Verify that users can access:

```text
Graph
Timeline
Table/list or textual sequence
Inspector
```

The exact alternate representation depends on the feature.

For AgentNet:

```text
graph
→ execution sequence
→ agent-state table
```

For G-Memory:

```text
graph
→ memory list
→ selected-node details
```

A graph is an exploration surface, not the only source of truth.

---

# 26. Dynamic Status Accessibility

Important real-time state changes should be exposed semantically.

Example:

```text
Agent status: Running
Agent status: Completed
Memory retrieved: 3
Review required
```

Do not rely solely on:

```text
glowing node
green node
animation
spinner
```

Visual state should have textual/semantic state.

---

# 27. Visual Review Instructions for Browser Agent

When browser-agent inspection is required, inspect the **smallest useful scope**.

Use this order:

```text
1. viewport/layout
2. major hierarchy
3. alignment/spacing
4. typography
5. component state
6. graph readability
7. responsive behavior
```

Do not comment on every element.

Produce:

```text
issue
location
severity
probable cause
recommended fix
```

Example:

```text
HIGH — Decision workspace
The right inspector overlaps the evidence panel at 1280px.

Likely cause:
fixed-width inspector combined with non-collapsing content area.

Fix:
allow inspector width to contract or switch to overlay mode below 1366px.
```

---

# 28. Do Not Ask the Browser Agent to “Judge Beauty”

Avoid vague visual prompts:

```text
"Does this look good?"
"Is this UI beautiful?"
"Is this modern?"
```

Use concrete evaluation criteria:

```text
Does the decision hierarchy remain clear?
Is any critical data clipped?
Are graph labels colliding?
Is the table readable at 1280px?
Does the selected state remain visible?
Is the review action visually dominant enough?
```

Visual evaluation must be tied to observable criteria.

---

# 29. Failure Escalation

When a test fails:

```text
Step 1
Read test failure only.

Step 2
Inspect the smallest relevant locator.

Step 3
Inspect relevant API/state.

Step 4
Run focused screenshot if necessary.

Step 5
Invoke browser-agent visual reasoning only if
the issue remains visual/ambiguous.
```

Do not immediately reopen the full application and inspect everything.

---

# 30. Debugging Output Discipline

When tests pass, return only compact information:

```text
49 passed
2 visual snapshots passed
0 accessibility failures
```

When tests fail, return:

```text
FAIL
test: decision-workspace
assertion: expected "Manual Review", received "Approved"
```

Do not send giant logs to the LLM unless needed.

---

# 31. Antigravity Token-Efficiency Rules

The agent should minimize context ingestion.

Prefer:

```text
test result
specific error
specific locator state
specific API response
focused screenshot
```

Avoid:

```text
entire DOM
entire console history
entire network log
all screenshots
entire browser transcript
```

When debugging, request the **minimum additional evidence** required to identify the problem.

---

# 32. Recommended Project Test Structure

```text
tests/
├── unit/
│   ├── credit/
│   ├── policy/
│   └── agents/
│
├── integration/
│   ├── agentnet/
│   ├── gmemory/
│   └── api/
│
├── e2e/
│   ├── applications/
│   ├── decisions/
│   ├── review/
│   └── search/
│
├── accessibility/
│   ├── navigation/
│   ├── tables/
│   ├── dialogs/
│   └── graphs/
│
└── visual/
    ├── decision/
    ├── agentnet/
    ├── gmemory/
    └── responsive/
```

Keep functional, accessibility and visual tests conceptually separate.

---

# 33. Recommended Visual Baselines

The minimum visual regression set for this project:

```text
01_case_overview
02_decision_workspace
03_agent_network
04_agent_inspector
05_execution_trace
06_gmemory_explorer
07_memory_impact
08_human_review
09_policy_studio
10_evaluation_lab
```

Do not create a snapshot for every route automatically.

Add a baseline when visual composition is important.

---

# 34. Component-Level Visual Testing

Prefer component/region snapshots for reusable UI:

```text
DecisionSummary
AgentNode
AgentInspector
MemoryNode
RiskBreakdown
EvidencePanel
ReviewPanel
```

Use full-page screenshots only for major composition/integration tests.

---

# 35. Accessibility and Visual Design Relationship

Accessibility is not a separate polish pass.

Every important visual representation must have a usable semantic counterpart.

Examples:

```text
color → text/icon/state
graph → sequence/list
chart → values/table/summary
animation → explicit state
hover detail → focusable/clickable detail
icon-only control → accessible name
```

This simultaneously improves usability, testing reliability and LLM observability.

---

# 36. Browser Agent Budget Rule

Treat browser-agent interactions as expensive.

Default:

```text
0 browser visual inspections
```

for a normal code change if deterministic tests pass.

Typical:

```text
0-1 browser visual inspection
```

for routine frontend changes.

More may be justified for:

```text
major layout redesign
responsive overhaul
graph redesign
accessibility remediation
cross-page visual regression
```

Do not enforce a hard numerical limit when the task genuinely requires more investigation. The principle is to avoid unnecessary calls.

---

# 37. Development Workflow

For every frontend change:

```text
1. Run build/type/lint checks.
2. Run focused unit/component tests.
3. Run focused Playwright semantic tests.
4. Run targeted accessibility checks.
5. Run focused visual regression.
6. If visual regression fails, inspect the diff.
7. Use browser-agent reasoning only if the diff requires interpretation.
8. Fix.
9. Rerun focused tests.
10. Run the broader suite before finalizing.
```

Do not run the entire browser workflow after every tiny change if a focused test provides sufficient coverage.

---

# 38. Final Decision Rule

Before invoking browser-agent visual inspection, ask:

> “Can a deterministic assertion, accessibility snapshot, structured state check, or automated visual diff answer this?”

If yes:

**Do that instead.**

If no:

Use the browser agent.

---

# 39. Definition of Done

A frontend change is complete when:

- build/type checks pass
- relevant tests pass
- semantic states are verified
- accessibility checks pass
- focused visual regressions pass
- no critical layout regression exists
- no unnecessary browser-agent work remains
- the UI still conforms to the project's frontend-design skill

---

# 40. Prime Directive

> **Use the cheapest reliable source of truth.**

The hierarchy is:

```text
Software state
    ↓
Automated assertion
    ↓
Accessible structure
    ↓
Visual diff
    ↓
Human-like browser reasoning
```

Never invert this hierarchy without a concrete reason.

The browser agent is a **specialist for visual ambiguity**, not a replacement for deterministic software testing.

 # #   M a n u a l   V i s u a l   V e r i f i c a t i o n   ( P r e f e r r e d ) 
 W h e n   v i s u a l   v e r i f i c a t i o n   o f   t h e   D O M   i s   a b s o l u t e l y   n e c e s s a r y   a n d   d e t e r m i n i s t i c   c h e c k s   f a i l ,   D O   N O T   u s e   t h e   b r o w s e r   s u b a g e n t   i f   i t   i s   t o o   s l o w   o r   g e t s   s t u c k .   I n s t e a d ,   o u t p u t   t h e   e x a c t   m a n u a l   r e p r o d u c t i o n   s t e p s   t o   t h e   U S E R   a n d   r e q u e s t   t h a t   t h e   U S E R   u p l o a d   a   s c r e e n s h o t   o f   t h e   r e s u l t . 
 
 * * E x a m p l e   P r o c e s s : * * 
 1 .   T e l l   t h e   U S E R :   " P l e a s e   o p e n   h t t p : / / l o c a l h o s t : 5 1 7 3 ,   c l i c k   t h e   S t a r t   b u t t o n ,   w a i t   5   s e c o n d s ,   a n d   u p l o a d   a   s c r e e n s h o t . " 
 2 .   T h e   U S E R   w i l l   p e r f o r m   t h e   a c t i o n   a n d   u p l o a d   t h e   i m a g e . 
 3 .   U s e   t h e   u p l o a d e d   i m a g e   t o   e v a l u a t e   t h e   U I .  
 