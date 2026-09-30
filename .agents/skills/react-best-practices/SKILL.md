---
name: react-best-practices
description: >-
  Best practices for React to keep the Credit Decisioning MAS frontend
  maintainable and performance-oriented.
---

# React Best Practices — Credit Decisioning Dashboard

## Overview

The MAS dashboard is built with React (potentially React Native for mobile
monitoring). This skill defines the patterns for building maintainable,
performant React components tailored to the platform's needs: real-time agent
pipelines, risk visualizations, and data-heavy tables.

---

## Project Structure

```
src/
├── components/
│   ├── agents/              # Agent-specific UI components
│   │   ├── AgentFlowGraph.tsx
│   │   ├── AgentNode.tsx
│   │   ├── AgentTracePanel.tsx
│   │   └── AgentStatusBadge.tsx
│   ├── application/         # Loan application components
│   │   ├── ApplicationForm.tsx
│   │   ├── ApplicationTable.tsx
│   │   ├── ApplicationDetail.tsx
│   │   └── DecisionCard.tsx
│   ├── risk/                # Risk visualization components
│   │   ├── RiskBadge.tsx
│   │   ├── RiskMigrationMatrix.tsx
│   │   └── RiskTrendChart.tsx
│   ├── memory/              # G-Memory visualization
│   │   ├── SimilarAppsPanel.tsx
│   │   ├── InsightsList.tsx
│   │   └── TrajectoryViewer.tsx
│   └── common/              # Shared UI primitives
│       ├── Card.tsx
│       ├── Table.tsx
│       ├── Badge.tsx
│       ├── Skeleton.tsx
│       └── Tooltip.tsx
├── hooks/
│   ├── useApplication.ts    # Application CRUD + state
│   ├── useAgentStream.ts    # WebSocket stream for agent updates
│   ├── useRiskAssessment.ts # Risk computation logic
│   ├── useMemoryRetrieval.ts# G-Memory query hooks
│   └── useWebSocket.ts      # Generic WebSocket connection
├── contexts/
│   ├── ApplicationContext.tsx
│   └── AgentPipelineContext.tsx
├── services/
│   ├── api.ts               # FastAPI client
│   ├── websocket.ts         # WebSocket connection manager
│   └── types.ts             # Shared TypeScript types
├── utils/
│   ├── riskColors.ts        # Risk level → color mapping
│   ├── formatCurrency.ts    # ₹ formatting
│   └── confidence.ts        # Confidence score formatting
└── pages/
    ├── Dashboard.tsx
    ├── ApplicationPipeline.tsx
    ├── MonitoringDashboard.tsx
    └── MemoryInsights.tsx
```

---

## Component Patterns

### 1. Single Responsibility
Each component does ONE thing:
- `AgentNode` renders a single agent's status (active/complete/skipped).
- `AgentFlowGraph` composes multiple `AgentNode` components into the pipeline view.
- `DecisionCard` displays the final decision output only.

### 2. Custom Hooks for Agent Streams
```typescript
// useAgentStream.ts — WebSocket hook for real-time agent updates
function useAgentStream(applicationId: string) {
  const [agentStates, setAgentStates] = useState<AgentState[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  useEffect(() => {
    const ws = new WebSocket(`ws://api/agents/stream/${applicationId}`);
    ws.onmessage = (event) => {
      const update: AgentUpdate = JSON.parse(event.data);
      setAgentStates(prev => updateAgentState(prev, update));
    };
    return () => ws.close();
  }, [applicationId]);
  
  return { agentStates, isProcessing };
}
```

### 3. Memoization for Heavy Renders
- `RiskMigrationMatrix` and `AgentFlowGraph` are expensive to render.
- Wrap with `React.memo` and use `useMemo` for derived data.
- Avoid re-rendering the entire pipeline graph when only one agent updates.

### 4. Context for Pipeline State
```typescript
// AgentPipelineContext — shared state for the current application's pipeline
interface PipelineState {
  applicationId: string;
  agents: AgentState[];
  riskProfile: RiskProfile;
  memoryContext: MemoryContext;
  decision: Decision | null;
}
```
Use context for the pipeline view; avoid prop drilling agent states through
5+ levels of components.

---

## State Management Rules

1. **Server state**: Use React Query / TanStack Query for API data (applications,
   decisions, monitoring data). Don't store API responses in useState.
2. **Real-time state**: Use WebSocket hooks + local state for agent pipeline
   updates. These change rapidly and don't need to be cached.
3. **UI state**: Use local component state for modals, accordions, filters.
4. **Avoid Redux** unless the app grows significantly. Context + React Query
   covers this project's needs.

---

## Performance Guidelines

1. **Virtualize large tables** — the application table may have thousands of rows.
   Use `react-window` or `@tanstack/react-virtual`.
2. **Debounce search/filter** — don't fire API calls on every keystroke.
3. **Lazy load routes** — `React.lazy()` for monitoring dashboard and memory
   insights pages (not needed on initial load).
4. **Optimize re-renders** — the agent flow graph should update individual nodes,
   not re-render the entire graph on each WebSocket message.
5. **Code-split agent trace panels** — these contain potentially large JSON/text
   blocks. Load them on-demand when the user expands an agent node.

---

## TypeScript Types

```typescript
// Core domain types
type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type AgentStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'SKIPPED' | 'ERROR';
type LoanOutcome = 'GOOD' | 'DELINQUENT' | 'DEFAULT';
type DecisionType = 'APPROVED' | 'CONDITIONAL' | 'REJECTED' | 'ESCALATED';

interface Application {
  id: string;
  customerId: string;
  requestedAmount: number;
  income: number;
  creditScore: number;
  existingDebt: number;
  riskLevel: RiskLevel;
  status: string;
  createdAt: Date;
}

interface AgentState {
  agentName: string;
  status: AgentStatus;
  confidence: number;
  decision: string;
  reasoning: string;
  riskFlags: string[];
  executionTimeMs: number;
}

interface Decision {
  type: DecisionType;
  approvedLimit: number | null;
  interestRate: number | null;
  riskLevel: RiskLevel;
  confidence: number;
  explanation: string;
  agentTraces: AgentState[];
}
```

---

## Testing Priorities

1. **Decision rendering** — verify that DecisionCard correctly displays all
   decision types (approved, conditional, rejected, escalated).
2. **Risk color mapping** — ensure risk levels always map to correct colors.
3. **Agent flow graph** — test state transitions (pending → active → complete).
4. **Currency formatting** — ₹ formatting with Indian numbering system (lakhs/crores).
5. **Edge cases** — what happens when an agent errors? When memory returns empty?
