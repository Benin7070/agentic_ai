---
name: webapp-testing
description: >-
  Strategies and tools for browser/UI testing of the Credit Decisioning MAS
  dashboard and agent pipeline.
---

# Web App Testing — Credit Decisioning Dashboard

## Overview

Testing for the MAS dashboard covers three layers: unit tests for utilities
and hooks, component tests for React components, and E2E tests for critical
user journeys through the loan application pipeline.

---

## Testing Stack

| Layer | Tool | Purpose |
|:------|:-----|:--------|
| Unit | Vitest / Jest | Utility functions, risk calculations, formatting |
| Component | React Testing Library | Component rendering, state transitions |
| E2E | Playwright | Full user journeys through the dashboard |
| API mock | MSW (Mock Service Worker) | Mock FastAPI backend during frontend tests |
| Accessibility | axe-core | WCAG compliance checks |

---

## Critical Test Scenarios

### 1. Application Submission Flow
```
User fills application form
  → Validates required fields (income, credit score, amount)
  → Submits to API
  → Redirects to pipeline view
  → Agent nodes begin processing
```

### 2. Agent Pipeline Visualization
```
Application enters pipeline
  → KYC agent activates (node turns blue)
  → KYC completes (node turns green)
  → Next agent activates based on risk routing
  → All agents complete
  → Decision card appears
```
**Test**: Verify correct node status transitions via mocked WebSocket messages.

### 3. Decision Display
- Approved decision shows limit, rate, and confidence.
- Conditional approval shows conditions and reduced limit.
- Rejected decision shows reasons and risk flags.
- Escalated decision shows "Pending Human Review" state.

### 4. Risk Monitoring Dashboard
- Portfolio risk distribution chart renders correctly.
- Risk migration events appear in the timeline.
- Early warning indicators trigger visual alerts.

### 5. Explainability Panel
- Each agent's reasoning trace is expandable.
- Confidence scores display correctly.
- Risk flags are highlighted in the trace.

---

## Unit Test Examples

```typescript
// Risk color mapping
describe('riskColors', () => {
  it('maps LOW to emerald', () => {
    expect(getRiskColor('LOW')).toBe('#10B981');
  });
  it('maps HIGH to red', () => {
    expect(getRiskColor('HIGH')).toBe('#EF4444');
  });
});

// Currency formatting (Indian numbering)
describe('formatCurrency', () => {
  it('formats lakhs correctly', () => {
    expect(formatINR(100000)).toBe('₹1,00,000');
  });
  it('formats with decimals', () => {
    expect(formatINR(75000.5)).toBe('₹75,000.50');
  });
});

// DTI ratio calculation
describe('computeDTI', () => {
  it('calculates debt-to-income ratio', () => {
    expect(computeDTI(15000, 65000)).toBeCloseTo(0.2308, 4);
  });
});
```

---

## Component Test Examples

```typescript
// AgentNode status rendering
describe('AgentNode', () => {
  it('shows pending state initially', () => {
    render(<AgentNode name="KYC" status="PENDING" />);
    expect(screen.getByText('KYC')).toBeInTheDocument();
    expect(screen.getByTestId('agent-node-kyc')).toHaveClass('pending');
  });

  it('shows active state with animation', () => {
    render(<AgentNode name="Fraud" status="ACTIVE" />);
    expect(screen.getByTestId('agent-node-fraud')).toHaveClass('active');
  });

  it('shows skipped state for low-risk bypass', () => {
    render(<AgentNode name="Fraud" status="SKIPPED" />);
    expect(screen.getByTestId('agent-node-fraud')).toHaveClass('skipped');
  });
});

// DecisionCard rendering
describe('DecisionCard', () => {
  it('renders approved decision with limit', () => {
    render(<DecisionCard decision={mockApprovedDecision} />);
    expect(screen.getByText('APPROVED')).toBeInTheDocument();
    expect(screen.getByText('₹60,000')).toBeInTheDocument();
    expect(screen.getByText('14%')).toBeInTheDocument();
  });

  it('renders rejected decision with reasons', () => {
    render(<DecisionCard decision={mockRejectedDecision} />);
    expect(screen.getByText('REJECTED')).toBeInTheDocument();
    expect(screen.getAllByTestId('risk-flag')).toHaveLength(3);
  });
});
```

---

## E2E Test Scenarios (Playwright)

```typescript
// Full application pipeline journey
test('low-risk application is approved quickly', async ({ page }) => {
  await page.goto('/applications/new');
  
  // Fill application
  await page.fill('#income', '120000');
  await page.fill('#credit-score', '780');
  await page.fill('#requested-amount', '30000');
  await page.click('#submit-application');
  
  // Verify pipeline starts
  await expect(page.locator('[data-agent="kyc"]')).toHaveAttribute('data-status', 'ACTIVE');
  
  // Wait for completion (mocked agents)
  await expect(page.locator('[data-testid="decision-card"]')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('[data-testid="decision-type"]')).toHaveText('APPROVED');
  
  // Verify low-risk skipped fraud agent
  await expect(page.locator('[data-agent="fraud"]')).toHaveAttribute('data-status', 'SKIPPED');
});

test('high-risk application triggers full pipeline', async ({ page }) => {
  await page.goto('/applications/new');
  
  // Fill high-risk application
  await page.fill('#income', '35000');
  await page.fill('#credit-score', '580');
  await page.fill('#requested-amount', '200000');
  await page.click('#submit-application');
  
  // All agents should activate
  for (const agent of ['kyc', 'fraud', 'credit', 'affordability', 'policy', 'pricing']) {
    await expect(page.locator(`[data-agent="${agent}"]`)).not.toHaveAttribute('data-status', 'SKIPPED');
  }
});
```

---

## WebSocket Testing

Mock the WebSocket connection for agent stream tests:
```typescript
// Mock WebSocket for agent pipeline updates
class MockWebSocket {
  sendAgentUpdate(agentName: string, status: AgentStatus) {
    this.onmessage?.({ data: JSON.stringify({ agentName, status }) });
  }
}
```

---

## Accessibility Checklist

- [ ] Risk colors meet WCAG AA contrast ratios on dark background.
- [ ] Agent pipeline graph is navigable via keyboard.
- [ ] Decision card has proper ARIA labels for screen readers.
- [ ] Tables have column headers with `scope="col"`.
- [ ] Risk status communicated via text, not just color (for colorblind users).
- [ ] Focus management when modals/panels open and close.
