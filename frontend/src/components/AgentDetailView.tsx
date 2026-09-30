import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSimulation } from '../contexts/SimulationContext';
import { GMemoryDetailView } from './GMemoryDetailView';
import { ReadmeModal } from './ReadmeModal';

interface AgentFullMeta {
  role: string;
  icon: string;
  level: string;
  description: string;
  tools: string[];
  signals: string[];
}

const AGENT_CATALOG: Record<string, AgentFullMeta> = {
  KYC: {
    role: 'Identity Verification & AML Gatekeeper',
    icon: '🛡️',
    level: 'L1 Barrier',
    description: 'Serves as the foundational compliance barrier. Verifies PAN with NSDL, Aadhaar linkage via UIDAI, and runs PEP (Politically Exposed Persons) & AML screening.',
    tools: ['verify_pan(pan)', 'verify_aadhaar(aadhaar)', 'aml_screening(name)', 'phone_ownership(phone)'],
    signals: ['kyc_score', 'pan_valid', 'aadhaar_linked', 'aml_clear', 'mentions']
  },
  Fraud: {
    role: 'Velocity Checks & Syndicate Anomaly Detection',
    icon: '🔍',
    level: 'L2 Parallel',
    description: 'Scans application frequency, device fingerprints, and geographic anomalies. Detects multi-application velocity bursts and known loan fraud rings.',
    tools: ['velocity_check(app_id)', 'device_reputation(fingerprint)', 'syndicate_match(pan_pool)', 'geo_distance(ip, address)'],
    signals: ['fraud_risk_score', 'velocity_flag', 'device_trust', 'anomaly_detected']
  },
  Credit: {
    role: 'Bureau Analytics & Repayment History',
    icon: '💳',
    level: 'L2 Parallel',
    description: 'Pulls CIBIL/Experian bureau records, checks historical Days Past Due (DPD), credit card utilization ratios, and existing active tradelines.',
    tools: ['cibil_inquiry(pan)', 'dpd_history_analyzer(36m)', 'tradeline_aggregator(pan)', 'inquiry_velocity(90d)'],
    signals: ['bureau_score', 'dpd_30_plus_count', 'active_loans', 'utilization_ratio']
  },
  Affordability: {
    role: 'Cashflow, DTI & Repayment Capacity',
    icon: '📊',
    level: 'L3 Capacity',
    description: 'Analyzes banking cashflows, salary day variance, and calculates Fixed Obligation to Income Ratio (FOIR) to prevent predatory over-leveraging.',
    tools: ['bank_statement_analyzer(pdf)', 'foir_calculator(emis, income)', 'disposable_income_stress_test()'],
    signals: ['foir_percentage', 'dti_ratio', 'disposable_monthly_income', 'max_repayable_emi']
  },
  Policy: {
    role: 'Credit Rules & Regulatory Compliance',
    icon: '📜',
    level: 'L4 Synthesis',
    description: 'Enforces internal credit policy matrices, RBI regulatory mandates, statutory lending caps, and age/employment qualification criteria.',
    tools: ['policy_matrix_evaluator()', 'rbi_regulatory_guard()', 'minimum_age_income_rule()'],
    signals: ['policy_passed', 'policy_rule_breaches', 'mandatory_covenants']
  },
  Pricing: {
    role: 'Risk-Adjusted APR & Term Structuring',
    icon: '🏷️',
    level: 'L4 Synthesis',
    description: 'Calculates expected loss risk premiums, sets risk-adjusted Annual Percentage Rate (APR), and structures optimal loan tenure and fee schedules.',
    tools: ['risk_premium_model(score, dti)', 'margin_optimizer()', 'tenure_amortization_schedule()'],
    signals: ['offered_apr', 'approved_loan_amount', 'sanctioned_tenure_months', 'processing_fee']
  },
  Explainability: {
    role: 'Fairness, SHAP Values & Transparent Auditing',
    icon: '⚖️',
    level: 'L5 Audit',
    description: 'Audits the entire MAS pipeline for demographic fairness and generates clear, human-understandable adverse action notices and SHAP feature importance.',
    tools: ['shap_explainer(features)', 'demographic_parity_audit()', 'adverse_action_generator()'],
    signals: ['top_shap_factors', 'fairness_disparity_index', 'decision_narrative']
  }
};

// ── Observability Trace Tree Component (Langfuse / Phoenix Style) ──
const ModernTraceViewer = ({ trace, agentName }: { trace: string; agentName: string }) => {
  const lines = trace.split('\n').filter(l => l.trim());
  const nodes: any[] = [];
  let currentToolCall: any = null;
  
  for (const line of lines) {
    if (line.startsWith('Tool call:')) {
      if (currentToolCall) nodes.push(currentToolCall);
      const funcMatch = line.match(/Tool call: (.*?)\((.*?)\)/);
      currentToolCall = {
        type: 'tool',
        name: funcMatch ? funcMatch[1] : 'Unknown Tool',
        args: funcMatch ? funcMatch[2] : '',
        result: '',
      };
    } else if (line.startsWith('Tool result:')) {
      if (currentToolCall) {
        currentToolCall.result = line.replace('Tool result:', '').trim();
        nodes.push(currentToolCall);
        currentToolCall = null;
      }
    } else if (line.startsWith('LLM Output:')) {
      if (currentToolCall) { nodes.push(currentToolCall); currentToolCall = null; }
      nodes.push({ type: 'llm', content: line.replace('LLM Output:', '').trim() });
    } else if (line.startsWith('MENTION:')) {
      if (currentToolCall) { nodes.push(currentToolCall); currentToolCall = null; }
      nodes.push({ type: 'mention', content: line.replace('MENTION:', '').trim() });
    } else {
      if (!currentToolCall) {
        nodes.push({ type: 'generic', content: line });
      }
    }
  }
  if (currentToolCall) nodes.push(currentToolCall);

  return (
    <div style={{
      background: '#09090b',
      border: '1px solid #27272a',
      borderRadius: '8px',
      padding: '0.85rem 1rem',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* Root Span */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '0.65rem',
        borderBottom: '1px solid #27272a',
        marginBottom: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#10B981' }}>▼</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f4f4f5' }}>
            Root Span: {agentName}_Execution_Task
          </span>
        </div>
        <span style={{
          fontSize: '0.65rem',
          padding: '0.15rem 0.5rem',
          borderRadius: '4px',
          background: 'rgba(16, 185, 129, 0.15)',
          color: '#34D399',
          fontWeight: 700
        }}>
          COMPLETED
        </span>
      </div>

      {/* Child Spans */}
      <div style={{ paddingLeft: '0.75rem', borderLeft: '1px dashed #27272a', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {nodes.length === 0 && <span style={{ color: '#71717a', fontSize: '0.8rem' }}>No trace entries recorded.</span>}
        {nodes.map((node, i) => (
          <div key={i}>
            {/* Tool Call Span */}
            {node.type === 'tool' && (
              <div style={{
                background: '#121214',
                border: '1px solid #27272a',
                borderRadius: '6px',
                padding: '0.65rem 0.85rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.85rem' }}>⚡</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#38bdf8', fontFamily: 'JetBrains Mono, monospace' }}>
                      tool::{node.name}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '0.65rem',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '4px',
                    background: (node.result.includes('INVALID') || node.result.includes('FLAGGED') || node.result.includes('NOT FOUND'))
                      ? 'rgba(239, 68, 68, 0.15)'
                      : 'rgba(16, 185, 129, 0.15)',
                    color: (node.result.includes('INVALID') || node.result.includes('FLAGGED') || node.result.includes('NOT FOUND'))
                      ? '#f87171'
                      : '#34D399',
                    fontWeight: 700
                  }}>
                    {node.result ? 'EVALUATED' : 'SUCCESS'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace' }}>
                  {node.args && (
                    <div style={{ color: '#a1a1aa' }}>
                      <span style={{ color: '#71717a' }}>in: </span>
                      {node.args}
                    </div>
                  )}
                  {node.result && (
                    <div style={{ color: '#e4e4e7' }}>
                      <span style={{ color: '#71717a' }}>out: </span>
                      <span style={{
                        color: (node.result.includes('INVALID') || node.result.includes('FLAGGED')) ? '#ef4444' : '#34D399',
                        fontWeight: 600
                      }}>
                        {node.result}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mention Span */}
            {node.type === 'mention' && (
              <div style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '6px',
                padding: '0.65rem 0.85rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: 700, color: '#FBBF24', marginBottom: '0.2rem' }}>
                  <span>💬</span> Inter-Agent Mention Broadcast
                </div>
                <div style={{ fontSize: '0.78rem', color: '#FEF3C7', lineHeight: 1.4 }}>
                  {node.content}
                </div>
              </div>
            )}

            {/* LLM Output Span */}
            {node.type === 'llm' && (
              <div style={{
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: '6px',
                padding: '0.65rem 0.85rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: 700, color: '#A5B4FC', marginBottom: '0.35rem' }}>
                  <span>🤖</span> LLM Synthesis & Decision Logic
                </div>
                <div style={{ fontSize: '0.8rem', color: '#E0E7FF', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                  {node.content}
                </div>
              </div>
            )}

            {/* Generic Span */}
            {node.type === 'generic' && (
              <div style={{ fontSize: '0.76rem', color: '#a1a1aa', padding: '0.2rem 0.4rem' }}>
                <span style={{ color: '#71717a', marginRight: '0.4rem' }}>›</span>
                {node.content}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const AgentDetailView: React.FC = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const { agentMetrics, agentSettings, updateAgentSettings, requests, settings } = useSimulation();
  
  const [availableKeys, setAvailableKeys] = useState<any[]>([]);
  const [selectedRunIdx, setSelectedRunIdx] = useState<number>(0);
  const [showRawJson, setShowRawJson] = useState<boolean>(false);
  const [showReadmeModal, setShowReadmeModal] = useState<boolean>(false);

  useEffect(() => {
    fetch('http://localhost:8000/api/keys')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setAvailableKeys(data);
        }
      })
      .catch(err => console.error("Failed to load keys:", err));
  }, []);
  
  if (agentId === 'G-Memory') {
    return <GMemoryDetailView />;
  }

  if (!agentId || !agentMetrics[agentId]) {
    return (
      <div style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <button className="sidebar-btn" onClick={() => navigate('/agents')} style={{ marginBottom: '1rem' }}>
          ← Back to AgentNet
        </button>
        <div className="glass-panel" style={{ textAlign: 'center', maxWidth: '400px' }}>
          <h3>Agent Not Found</h3>
          <p style={{ color: '#71717a' }}>No metrics available for agent "{agentId}".</p>
        </div>
      </div>
    );
  }
  
  const metric = agentMetrics[agentId];
  const meta = AGENT_CATALOG[agentId] || {
    role: 'Autonomous Decisioning Agent',
    icon: '🤖',
    level: 'Agent',
    description: 'Autonomous micro-agent in the Credit Decisioning MAS.',
    tools: [],
    signals: []
  };

  const currentKeyId = agentSettings[agentId] || '';

  // Find if this agent is currently running live on a request in queue
  const activeRequest = requests.find(r => 
    r.status === 'PROCESSING' && 
    r.agents?.some(a => a.name === agentId && a.status === 'ACTIVE')
  );
  const activeAgentData = activeRequest?.agents?.find(a => a.name === agentId);

  const handleKeyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    updateAgentSettings({
      ...agentSettings,
      [agentId]: val
    });
  };

  const history = metric.history || [];
  const currentRun = history[selectedRunIdx] || null;

  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      padding: '1.75rem',
      background: '#09090b', // zinc-950
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem'
    }}>
      {/* ── Top Bar with Close Button & Title ── */}
      <div className="agent-detail-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
          <div style={{
            fontSize: '1.8rem',
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '10px',
            width: '52px',
            height: '52px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
          }}>
            {meta.icon}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#f4f4f5' }}>
                {metric.name} Agent
              </h2>
              <span className="agent-badge-pill">
                {meta.level}
              </span>
              <span style={{
                fontSize: '0.65rem',
                padding: '0.2rem 0.5rem',
                borderRadius: '9999px',
                background: activeRequest ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                color: activeRequest ? '#34D399' : '#a1a1aa',
                fontWeight: 600
              }}>
                {activeRequest ? '● LIVE PROCESSING' : '● READY'}
              </span>
            </div>

            <p style={{ margin: 0, fontSize: '0.82rem', color: '#a1a1aa', lineHeight: 1.3 }}>
              {meta.role}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => setShowReadmeModal(true)}
            style={{
              background: 'rgba(59, 130, 246, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#93c5fd',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { (e.currentTarget.style.background = 'rgba(59, 130, 246, 0.22)'); (e.currentTarget.style.color = '#fff'); }}
            onMouseLeave={e => { (e.currentTarget.style.background = 'rgba(59, 130, 246, 0.12)'); (e.currentTarget.style.color = '#93c5fd'); }}
            title={`Read ${metric.name} Agent specifications in README docs`}
          >
            <span>📖</span> Agent Spec (README)
          </button>

          <button 
            onClick={() => navigate('/agents')}
            style={{
              background: '#18181b',
              border: '1px solid #27272a',
              color: '#a1a1aa',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { (e.currentTarget.style.color = '#fff'); (e.currentTarget.style.borderColor = '#3f3f46'); }}
            onMouseLeave={e => { (e.currentTarget.style.color = '#a1a1aa'); (e.currentTarget.style.borderColor = '#27272a'); }}
          >
            ✕ Close Panel
          </button>
        </div>
      </div>

      {/* ── Agent Description & Capabilities ── */}
      <div style={{
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '10px',
        padding: '1.1rem'
      }}>
        <p style={{ color: '#d4d4d8', fontSize: '0.85rem', margin: '0 0 0.85rem 0', lineHeight: 1.5 }}>
          {meta.description}
        </p>

        {/* Tools Badges */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.7rem', color: '#71717a', textTransform: 'uppercase', fontWeight: 700, minWidth: '70px' }}>
              Tools Invoked:
            </span>
            {meta.tools.map((t, idx) => (
              <span key={idx} className="tool-chip">
                <span>🔧</span> {t}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.7rem', color: '#71717a', textTransform: 'uppercase', fontWeight: 700, minWidth: '70px' }}>
              Signals Written:
            </span>
            {meta.signals.map((s, idx) => (
              <span key={idx} style={{
                fontSize: '0.7rem',
                fontFamily: 'JetBrains Mono, monospace',
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
                background: 'rgba(167, 139, 250, 0.1)',
                color: '#C4B5FD',
                border: '1px solid rgba(167, 139, 250, 0.25)'
              }}>
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Key Performance Metrics Bar ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.65rem' }}>
        <div className="agent-stat-card">
          <span className="agent-stat-label">Total Invocations</span>
          <span className="agent-stat-val">{metric.totalCalls.toLocaleString()}</span>
        </div>
        <div className="agent-stat-card">
          <span className="agent-stat-label">Total Tokens</span>
          <span className="agent-stat-val">{metric.tokensUsed.toLocaleString()}</span>
        </div>
        <div className="agent-stat-card">
          <span className="agent-stat-label">Avg Execution Latency</span>
          <span className="agent-stat-val">{metric.avgTimeMs.toFixed(0)}<span style={{ fontSize: '0.75rem', color: '#71717a' }}> ms</span></span>
        </div>
        <div className="agent-stat-card">
          <span className="agent-stat-label">Prompt Cache Status</span>
          <span className="agent-stat-val" style={{ color: '#10B981', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span>⚡</span> Active
          </span>
        </div>
      </div>

      {/* ── Provider & API Key Configuration Override ── */}
      <div style={{
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '10px',
        padding: '1rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f4f4f5', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>🔑</span> Model Provider & API Key Override
          </label>
          <span style={{ fontSize: '0.7rem', color: '#71717a' }}>
            {currentKeyId ? 'Custom agent key mapped' : 'Inheriting global default key'}
          </span>
        </div>

        <select 
          value={currentKeyId} 
          onChange={handleKeyChange}
          style={{
            width: '100%',
            padding: '0.6rem 0.85rem',
            borderRadius: '6px',
            background: '#09090b',
            color: '#f4f4f5',
            border: '1px solid #27272a',
            fontSize: '0.82rem',
            outline: 'none'
          }}
        >
          <option value="">-- Use Global Default ({settings.configName || settings.provider || 'Mock'}) --</option>
          {availableKeys.map(k => (
            <option key={k.id} value={k.id}>{k.name} ({k.provider})</option>
          ))}
        </select>
      </div>

      {/* ── Live In-Flight Request Banner (If Active) ── */}
      {activeRequest && activeAgentData && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.05)',
          border: '1px solid #10B981',
          borderRadius: '10px',
          padding: '1.25rem',
          boxShadow: '0 0 20px rgba(16, 185, 129, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: '#10B981',
                boxShadow: '0 0 8px #10B981',
                animation: 'pulseActiveBorder 1s infinite'
              }} />
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#34D399' }}>
                Live In-Flight Application: {activeRequest.id}
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>
              Phase {activeRequest.phase}
            </span>
          </div>

          <ModernTraceViewer 
            trace={activeAgentData.output?.join('\n') || 'Agent is evaluating current input context...'} 
            agentName={metric.name} 
          />
        </div>
      )}

      {/* ── Observability & Execution History ── */}
      <div style={{
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '10px',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#f4f4f5' }}>
              Execution Trace Inspector
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#71717a' }}>
              Inspect input attributes, reasoning chain, tool spans, and blackboard outputs.
            </span>
          </div>

          <button
            onClick={() => setShowRawJson(!showRawJson)}
            style={{
              background: showRawJson ? '#27272a' : '#121214',
              border: '1px solid #27272a',
              color: '#a1a1aa',
              padding: '0.3rem 0.65rem',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {showRawJson ? 'Formatted View' : 'Raw JSON'}
          </button>
        </div>

        {/* Run Selector Tab Bar */}
        {history.length > 0 ? (
          <div>
            <div style={{
              display: 'flex',
              gap: '0.4rem',
              overflowX: 'auto',
              paddingBottom: '0.4rem',
              borderBottom: '1px solid #27272a'
            }}>
              {history.map((h, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedRunIdx(idx)}
                  className={`run-tab ${selectedRunIdx === idx ? 'active' : ''}`}
                >
                  <span>{idx === 0 ? '⚡ Latest:' : '•'}</span>
                  <span>{h.appId}</span>
                  <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>({h.tokens} tok)</span>
                </button>
              ))}
            </div>

            {/* Run Detail Card */}
            {currentRun && (
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                
                {/* 1. Input Application Data Overview */}
                <div>
                  <h4 style={{ fontSize: '0.8rem', color: '#a1a1aa', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 700 }}>
                    📥 Input Application Context
                  </h4>
                  
                  {showRawJson ? (
                    <pre style={{
                      background: '#09090b', padding: '0.75rem', borderRadius: '6px',
                      fontSize: '0.75rem', color: '#a1a1aa', border: '1px solid #27272a', margin: 0
                    }}>
                      {JSON.stringify(currentRun.inputs, null, 2)}
                    </pre>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.45rem' }}>
                      <div className="input-data-chip">
                        <span className="input-data-label">Applicant</span>
                        <span className="input-data-val">{currentRun.inputs?.fullName || 'N/A'}</span>
                      </div>
                      <div className="input-data-chip">
                        <span className="input-data-label">Monthly Income</span>
                        <span className="input-data-val">₹{currentRun.inputs?.monthlyIncome?.toLocaleString() || 0}</span>
                      </div>
                      <div className="input-data-chip">
                        <span className="input-data-label">Requested Loan</span>
                        <span className="input-data-val">₹{currentRun.inputs?.requestedAmount?.toLocaleString() || 0}</span>
                      </div>
                      <div className="input-data-chip">
                        <span className="input-data-label">Tenure</span>
                        <span className="input-data-val">{currentRun.inputs?.requestedTenureMonths || 0} Months</span>
                      </div>
                      <div className="input-data-chip">
                        <span className="input-data-label">Loan Purpose</span>
                        <span className="input-data-val">{currentRun.inputs?.loanPurpose || 'Personal'}</span>
                      </div>
                      <div className="input-data-chip">
                        <span className="input-data-label">PAN Number</span>
                        <span className="input-data-val" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                          {currentRun.inputs?.panNumber ? `${currentRun.inputs.panNumber.slice(0, 5)}XXXX${currentRun.inputs.panNumber.slice(-1)}` : 'N/A'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Structured Agent Reasoning Trace */}
                <div>
                  <h4 style={{ fontSize: '0.8rem', color: '#a1a1aa', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 700 }}>
                    🧠 Execution Trace & Tool Span Tree
                  </h4>
                  <ModernTraceViewer trace={currentRun.reasoning} agentName={metric.name} />
                </div>

                {/* 3. Output Signals to G-Memory Blackboard */}
                <div>
                  <h4 style={{ fontSize: '0.8rem', color: '#a1a1aa', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 700 }}>
                    📤 Output Signals Synced to G-Memory
                  </h4>
                  <div style={{
                    background: '#09090b',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    padding: '0.85rem'
                  }}>
                    {showRawJson ? (
                      <pre style={{ color: '#FCD34D', fontSize: '0.75rem', margin: 0 }}>
                        {JSON.stringify(currentRun.outputs, null, 2)}
                      </pre>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {Object.entries(currentRun.outputs || {}).map(([k, v]) => {
                            if (k === 'mentions') return null;
                            return (
                              <div key={k} style={{
                                background: '#18181b',
                                border: '1px solid #27272a',
                                borderRadius: '6px',
                                padding: '0.4rem 0.65rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                fontSize: '0.75rem'
                              }}>
                                <span style={{ color: '#71717a', textTransform: 'uppercase', fontSize: '0.65rem' }}>{k}:</span>
                                <span style={{ color: typeof v === 'boolean' ? (v ? '#34D399' : '#f87171') : '#60A5FA', fontWeight: 700 }}>
                                  {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Mentions badge if present */}
                        {Array.isArray(currentRun.outputs?.mentions) && currentRun.outputs.mentions.length > 0 && (
                          <div style={{
                            background: 'rgba(245, 158, 11, 0.1)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            borderRadius: '6px',
                            padding: '0.6rem 0.8rem',
                            marginTop: '0.25rem'
                          }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FBBF24', marginBottom: '0.25rem' }}>
                              💬 Mentions Triggered:
                            </div>
                            {currentRun.outputs.mentions.map((m: any, i: number) => (
                              <div key={i} style={{ fontSize: '0.75rem', color: '#FEF3C7' }}>
                                Called <strong style={{ color: '#FCD34D' }}>@{m.target}</strong>: "{m.message}"
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        ) : (
          <div style={{
            padding: '2.5rem 1rem',
            textAlign: 'center',
            background: '#09090b',
            borderRadius: '8px',
            border: '1px dashed #27272a'
          }}>
            <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>📡</div>
            <h4 style={{ margin: '0 0 0.3rem 0', color: '#f4f4f5', fontSize: '0.9rem' }}>
              No Execution Traces Recorded Yet
            </h4>
            <p style={{ margin: 0, color: '#71717a', fontSize: '0.78rem' }}>
              Start the simulation from the Dashboard or dispatch an application to observe live spans and tool execution metrics.
            </p>
          </div>
        )}
      </div>

      {/* ── Readme Architectural Documentation Modal ── */}
      <ReadmeModal
        isOpen={showReadmeModal}
        onClose={() => setShowReadmeModal(false)}
        highlightAgent={metric.name}
        title={`${metric.name} Agent Specification — Architecture & Tools`}
      />
    </div>
  );
};
