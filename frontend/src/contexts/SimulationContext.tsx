import React, { createContext, useContext, useState, useEffect } from 'react';
import type { PipelineRequest, SimStats, Settings, AgentMetric } from '../types';

export type AppView = 'dashboard' | 'settings' | 'agent-detail';

interface SimulationContextType {
  requests: PipelineRequest[];
  stats: SimStats;
  isRunning: boolean;
  rate: number;
  riskDist: { low: number; medium: number; high: number };
  selectedId: string | null;
  selectedRequest: PipelineRequest | null;
  
  view: AppView;
  selectedAgentKey: string | null;
  settings: Settings;
  agentSettings: Record<string, string>;
  agentMetrics: Record<string, AgentMetric>;
  
  setView: (v: AppView, agentKey?: string) => void;
  updateSettings: (s: Settings) => void;
  updateAgentSettings: (s: Record<string, string>) => void;
  
  toggleSimulation: () => void;
  setRate: (r: number) => void;
  setRiskDist: (d: { low: number; medium: number; high: number }) => void;
  selectRequest: (id: string | null) => void;
  clearCompleted: () => void;
  generateOne: () => void;
  submitHumanDecision: (appId: string, verdict: 'APPROVED' | 'REJECTED', notes: string, reviewer?: string, adjustments?: { interestRate?: number; approvedAmount?: number }) => Promise<void>;
  flagForHumanReview: (appId: string) => Promise<void>;
}

const SimulationContext = createContext<SimulationContextType | null>(null);

export function useSimulation() {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error('useSimulation must be inside SimulationProvider');
  return ctx;
}

const API_BASE = 'http://localhost:8000/api';

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [requests, setRequests] = useState<PipelineRequest[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [rate, setRate] = useState(10);
  const [riskDist, setRiskDist] = useState({ low: 60, medium: 30, high: 10 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const [view, setAppView] = useState<AppView>('dashboard');
  const [selectedAgentKey, setSelectedAgentKey] = useState<string | null>(null);
  
  const [settings, setSettings] = useState<Settings>({ provider: 'none', apiKey: '', configName: '' });
  const [agentSettings, setAgentSettings] = useState<Record<string, string>>({});
  const [agentMetrics, setAgentMetrics] = useState<Record<string, AgentMetric>>({});

  const [stats, setStats] = useState<SimStats>({
    totalProcessed: 0, approved: 0, rejected: 0, manualReview: 0, hitlPending: 0,
    avgProcessingTime: 0, cacheHitRate: 0.32, memoryEntries: 0, routeEfficiency: 0,
  });

  const setView = (v: AppView, agentKey?: string) => {
    setAppView(v);
    if (agentKey !== undefined) setSelectedAgentKey(agentKey);
  };

  const updateSettings = async (s: Settings) => {
    setSettings(s);
    await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(s)
    });
  };

  const updateAgentSettings = async (s: Record<string, string>) => {
    setAgentSettings(s);
    await fetch(`${API_BASE}/agent-settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(s)
    });
  };

  // SSE connection
  useEffect(() => {
    const sse = new EventSource(`${API_BASE}/stream`);
    
    sse.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'STATE_UPDATE') {
          setRequests(data.requests);
          setIsRunning(data.isRunning);
          setRate(data.rate);
          setRiskDist(data.riskDist);
          if (data.settings) setSettings(data.settings);
          if (data.agentSettings) setAgentSettings(data.agentSettings);
          if (data.agentMetrics) setAgentMetrics(data.agentMetrics);
        }
      } catch (err) {
        console.error('SSE Error:', err);
      }
    };

    return () => sse.close();
  }, []);

  // Sync Stats whenever requests update
  useEffect(() => {
    const done = requests.filter(r => r.status === 'COMPLETED');
    const hitlPending = requests.filter(r => r.status === 'MANUAL_REVIEW').length;
    
    const approved = done.filter(r => r.decision?.type === 'APPROVED').length;
    const rejected = done.filter(r => r.decision?.type === 'REJECTED').length;
    const manual   = done.filter(r => r.decision?.type === 'MANUAL_REVIEW').length + hitlPending;
    const times = done.map(r => ((r.completedAt || 0) - (r.startedAt || 0)) / 1000).filter(t => t > 0);
    const avgTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    
    const allAgents = done.flatMap(r => r.agents.filter(a => a.status === 'COMPLETED'));
    const cacheHits = allAgents.filter(a => a.cacheHit).length;
    const cacheRate = allAgents.length > 0 ? cacheHits / allAgents.length : 0;
    
    const skippedTotal = done.reduce((s, r) => s + (r.routing?.skippedAgents.length || 0), 0);
    const routeEff = done.length > 0 ? skippedTotal / (done.length * 6) : 0; // 6 is total possible agents

    setStats({
      totalProcessed: done.length,
      approved, rejected, manualReview: manual,
      hitlPending,
      avgProcessingTime: +avgTime.toFixed(1),
      cacheHitRate: +cacheRate.toFixed(2),
      memoryEntries: done.length,
      routeEfficiency: +routeEff.toFixed(2),
    });
  }, [requests]);

  const sendCommand = async (action: string, payload: any = {}) => {
    await fetch(`${API_BASE}/control`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload })
    });
  };

  const submitHumanDecision = async (
    appId: string,
    verdict: 'APPROVED' | 'REJECTED',
    notes: string,
    reviewer: string = 'Senior Credit Underwriter #402',
    adjustments?: { interestRate?: number; approvedAmount?: number }
  ) => {
    await sendCommand('human_decision', {
      appId,
      verdict,
      notes,
      reviewer,
      interestRate: adjustments?.interestRate,
      approvedAmount: adjustments?.approvedAmount
    });
  };

  const flagForHumanReview = async (appId: string) => {
    await sendCommand('flag_for_review', { appId });
  };

  const selectedRequest = requests.find(r => r.id === selectedId) || null;

  return (
    <SimulationContext.Provider value={{
      requests, stats, isRunning, rate, riskDist,
      selectedId, selectedRequest,
      view, selectedAgentKey, settings, agentSettings, agentMetrics,
      setView, updateSettings, updateAgentSettings,
      toggleSimulation: () => sendCommand('toggle'),
      setRate: (r) => sendCommand('set_rate', { rate: r }),
      setRiskDist: (d) => sendCommand('set_dist', { riskDist: d }),
      selectRequest: setSelectedId,
      clearCompleted: () => sendCommand('clear'),
      generateOne: () => sendCommand('generate_one'),
      submitHumanDecision,
      flagForHumanReview,
    }}>
      {children}
    </SimulationContext.Provider>
  );
};
