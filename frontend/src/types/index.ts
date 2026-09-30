export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type AgentStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'SKIPPED' | 'ERROR';
export type RequestStatus = 'QUEUED' | 'PROCESSING' | 'MANUAL_REVIEW' | 'COMPLETED';

export interface Application {
  id: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  panNumber: string;
  aadhaarLast4: string;
  phone: string;
  employmentType: string;
  employerName: string;
  monthlyIncome: number;
  yearsAtCurrentJob: number;
  residentialStatus: string;
  cityTier: string;
  yearsAtCurrentAddress: number;
  existingEMIs: number;
  numberOfExistingLoans: number;
  creditCardOutstanding: number;
  loanPurpose: string;
  requestedAmount: number;
  requestedTenureMonths: number;
  avgMonthlyBalance: number;
  numberOfBounces: number;
  salaryDayVariance: number;
}

export interface AgentNode {
  name: string;
  status: AgentStatus;
  elapsedMs: number;
  output: string[];
  cacheHit?: boolean;
  isolated?: boolean;
  scratchpadId?: string;
  recordTag?: string;
}

export interface RoutingDecision {
  riskLevel: RiskLevel;
  selectedPath: string[];
  skippedAgents: string[];
  reason: string;
  timeSaved: number;
}

export interface MemoryMatch {
  appId: string;
  income: number;
  amount: number;
  outcome: 'REPAID' | 'DEFAULTED';
  similarity: number;
  months: number;
}

export interface HumanReviewData {
  verdict: 'APPROVED' | 'REJECTED';
  reviewer: string;
  notes: string;
  reviewedAt: number;
  originalDecision?: string;
}

export interface FinalDecision {
  type: 'APPROVED' | 'REJECTED' | 'MANUAL_REVIEW';
  confidence: number;
  interestRate?: number;
  approvedAmount?: number;
  reasons: string[];
  hitlStatus?: 'PENDING_REVIEW' | 'REVIEWED';
  humanOverride?: boolean;
  humanReview?: HumanReviewData;
  originalType?: string;
}

export interface RequestScratchpad {
  id: string;
  recordTag: string;
  queueNumber: string;
  isolatedAt: number;
  status: string;
  isolationMode: string;
  agentNotes: Record<string, any>;
}

export interface PipelineRequest {
  id: string;
  app: Application;
  queueNumber?: string;
  recordTag?: string;
  priority?: 'STANDARD' | 'EXPEDITED' | 'VIP';
  tags?: string[];
  scratchpad?: RequestScratchpad;
  status: RequestStatus;
  agents: AgentNode[];
  currentAgentIndex: number;
  routing?: RoutingDecision;
  memoryMatches: MemoryMatch[] | any;
  decision?: FinalDecision;
  sharedState?: Record<string, any>;
  queuedAt: number;
  startedAt?: number;
  completedAt?: number;
  hitlPendingAt?: number;
  phase: number;
  phaseTimer: number;
}

export interface SimStats {
  totalProcessed: number;
  approved: number;
  rejected: number;
  manualReview: number;
  hitlPending: number;
  avgProcessingTime: number;
  cacheHitRate: number;
  memoryEntries: number;
  routeEfficiency: number;
}

export interface Settings {
  provider: string;
  apiKey: string;
  configName: string;
}

export interface AgentMetric {
  name: string;
  totalCalls: number;
  tokensUsed: number;
  avgTimeMs: number;
  history: AgentHistoryEntry[];
}

export interface AgentHistoryEntry {
  appId: string;
  timestamp: number;
  inputs: any;
  reasoning: string;
  outputs: any;
  tokens: number;
}