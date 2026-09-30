import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimulation } from '../contexts/SimulationContext';
import { ReadmeModal } from './ReadmeModal';

interface GMemoryDetailProps {
  onClose?: () => void;
  isModal?: boolean;
}

export const GMemoryDetailView: React.FC<GMemoryDetailProps> = ({ onClose, isModal = false }) => {
  const navigate = useNavigate();
  const { requests, selectedRequest } = useSimulation();
  
  const [activeTab, setActiveTab] = useState<'blackboard' | 'graphs' | 'mentions' | 'raw'>('blackboard');
  const [copied, setCopied] = useState(false);
  const [showReadmeModal, setShowReadmeModal] = useState(false);

  const req = selectedRequest || (requests.length > 0 ? requests[0] : null);
  const sharedState = req?.sharedState || {};

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/agents');
    }
  };

  // Extract all active mentions across the shared blackboard
  const activeMentions = useMemo(() => {
    if (!sharedState) return [];
    const list: { source: string; target: string; message: string; appRef: string }[] = [];
    
    for (const [key, val] of Object.entries(sharedState)) {
      if (key.endsWith('_output') && val && typeof val === 'object') {
        const source = key.replace('_output', '');
        const mentions = (val as any).mentions;
        if (Array.isArray(mentions)) {
          for (const m of mentions) {
            if (m.target) {
              list.push({
                source,
                target: m.target,
                message: m.message || 'Attention required regarding cross-agent inconsistency',
                appRef: req?.id || 'Active'
              });
            }
          }
        }
      }
    }
    return list;
  }, [sharedState, req]);

  // Normalize Three-Graph Hierarchy (Query Graph, Interaction Graph, Insight Graph)
  const normalizedMemory = useMemo(() => {
    const mm = req?.memoryMatches;
    const defaultInsights = [
      "Rule 1: Applications with DTI > 0.55 and < 3 years job stability correlate with a 78% default probability.",
      "Rule 2: Sudden salary day variance (>8 days) correlates highly with imminent 60+ DPD delinquency.",
      "Rule 3: Repeated cheque bounces combined with CC utilization > 90% triggers a high-severity syndicate fraud signal."
    ];

    if (!mm) {
      return {
        similar_cases: [],
        trajectories: [],
        insights: defaultInsights
      };
    }

    if (Array.isArray(mm)) {
      return {
        similar_cases: mm,
        trajectories: [],
        insights: defaultInsights
      };
    }

    return {
      similar_cases: mm.similar_cases || [],
      trajectories: mm.trajectories || [],
      insights: mm.insights && mm.insights.length > 0 ? mm.insights : defaultInsights
    };
  }, [req]);

  const similarCases = normalizedMemory.similar_cases;
  const repaidCases = similarCases.filter((c: any) => c.outcome === 'REPAID').length;
  const defaultedCases = similarCases.filter((c: any) => c.outcome === 'DEFAULTED').length;

  const agentOutputs = useMemo(() => {
    return Object.entries(sharedState).filter(([k, v]) => k.endsWith('_output') && v && typeof v === 'object');
  }, [sharedState]);

  const handleCopyRaw = () => {
    navigator.clipboard.writeText(JSON.stringify({ sharedState, memoryMatches: normalizedMemory }, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      padding: isModal ? '1.5rem' : '2rem',
      background: '#09090b',
      color: '#f4f4f5',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* ── Top Header ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottom: '1px solid #27272a',
        paddingBottom: '1.25rem',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '12px',
            background: 'radial-gradient(circle at center, rgba(167, 139, 250, 0.3) 0%, rgba(30, 27, 75, 0.8) 70%, #09090b 100%)',
            border: '2px solid rgba(167, 139, 250, 0.8)',
            boxShadow: '0 0 20px rgba(167, 139, 250, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.8rem',
            animation: 'pulseGMemory 3s infinite ease-in-out'
          }}>
            ⚡
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#f4f4f5', letterSpacing: '-0.02em' }}>
                G-Memory & Shared Blackboard
              </h2>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                background: 'rgba(167, 139, 250, 0.15)',
                color: '#C4B5FD',
                border: '1px solid rgba(167, 139, 250, 0.3)'
              }}>
                Three-Graph Epistemic Engine
              </span>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 600,
                padding: '0.2rem 0.55rem',
                borderRadius: '9999px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34D399',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
                Bus Active
              </span>
            </div>

            <p style={{ margin: 0, fontSize: '0.82rem', color: '#a1a1aa', lineHeight: 1.4 }}>
              Decoupled Shared State Bus & Three-Graph Epistemic Memory (Query Graph, Interaction Graph, and Distilled Heuristics).
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => setShowReadmeModal(true)}
            style={{
              background: 'rgba(167, 139, 250, 0.12)',
              border: '1px solid rgba(167, 139, 250, 0.35)',
              color: '#c4b5fd',
              padding: '0.5rem 0.9rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(167, 139, 250, 0.22)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(167, 139, 250, 0.12)'; e.currentTarget.style.color = '#c4b5fd'; }}
            title="Read G-Memory Three-Graph specification in README docs"
          >
            <span>📖</span> Architecture Spec (README)
          </button>

          <button
            onClick={handleClose}
            style={{
              background: '#18181b',
              border: '1px solid #27272a',
              color: '#a1a1aa',
              padding: '0.5rem 0.9rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#3f3f46'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#a1a1aa'; e.currentTarget.style.borderColor = '#27272a'; }}
          >
            ✕ Close View
          </button>
        </div>
      </div>

      {/* ── Telemetry Ribbon ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.65rem' }}>
        <div className="agent-stat-card">
          <span className="agent-stat-label">Blackboard Keys</span>
          <span className="agent-stat-val" style={{ color: '#818CF8' }}>
            {agentOutputs.length} <span style={{ fontSize: '0.75rem', color: '#71717a' }}>States</span>
          </span>
        </div>

        <div className="agent-stat-card">
          <span className="agent-stat-label">Vector Cases Retrieved</span>
          <span className="agent-stat-val" style={{ color: '#60A5FA' }}>
            {similarCases.length} <span style={{ fontSize: '0.75rem', color: '#71717a' }}>Matches</span>
          </span>
        </div>

        <div className="agent-stat-card">
          <span className="agent-stat-label">Distilled Insights</span>
          <span className="agent-stat-val" style={{ color: '#C084FC' }}>
            {normalizedMemory.insights.length} <span style={{ fontSize: '0.75rem', color: '#71717a' }}>Rules</span>
          </span>
        </div>

        <div className="agent-stat-card">
          <span className="agent-stat-label">Active Mentions</span>
          <span className="agent-stat-val" style={{ color: activeMentions.length > 0 ? '#FBBF24' : '#71717a' }}>
            {activeMentions.length} <span style={{ fontSize: '0.75rem', color: '#71717a' }}>Pings</span>
          </span>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1px solid #27272a',
        paddingBottom: '0.5rem',
        overflowX: 'auto'
      }}>
        <button
          onClick={() => setActiveTab('blackboard')}
          className={`run-tab ${activeTab === 'blackboard' ? 'active' : ''}`}
          style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}
        >
          <span>📋</span> Shared Blackboard (Live Bus)
        </button>
        <button
          onClick={() => setActiveTab('graphs')}
          className={`run-tab ${activeTab === 'graphs' ? 'active' : ''}`}
          style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}
        >
          <span>🌐</span> 3-Graph Epistemic Memory
        </button>
        <button
          onClick={() => setActiveTab('mentions')}
          className={`run-tab ${activeTab === 'mentions' ? 'active' : ''}`}
          style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}
        >
          <span>💬</span> Inter-Agent Mentions ({activeMentions.length})
        </button>
        <button
          onClick={() => setActiveTab('raw')}
          className={`run-tab ${activeTab === 'raw' ? 'active' : ''}`}
          style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}
        >
          <span>💻</span> Raw Memory JSON
        </button>
      </div>

      {/* ── TAB 1: Shared Blackboard ── */}
      {activeTab === 'blackboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Active Application Context Bar */}
          <div style={{
            background: '#121214',
            border: '1px solid #27272a',
            borderRadius: '8px',
            padding: '0.85rem 1.1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: '#71717a', textTransform: 'uppercase', fontWeight: 700 }}>
                Synchronized Target Application:
              </span>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f4f4f5' }}>
                {req?.app?.fullName || 'N/A'} <span style={{ color: '#818CF8', fontWeight: 600 }}>({req?.id || 'No App Selected'})</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#a1a1aa' }}>
              <div>Loan Amount: <strong style={{ color: '#f4f4f5' }}>₹{req?.app?.requestedAmount?.toLocaleString() || 0}</strong></div>
              <div>Income: <strong style={{ color: '#f4f4f5' }}>₹{req?.app?.monthlyIncome?.toLocaleString() || 0}</strong></div>
              <div>Status: <span style={{ color: '#10B981', fontWeight: 700 }}>{req?.status || 'IDLE'}</span></div>
            </div>
          </div>

          {/* Mentions Banner If Detected */}
          {activeMentions.length > 0 && (
            <div style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              borderRadius: '8px',
              padding: '1rem'
            }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FBBF24', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>💬</span> Active Inconsistency Mentions Broadcasted to Blackboard
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {activeMentions.map((m, i) => (
                  <div key={i} style={{ fontSize: '0.8rem', color: '#FEF3C7', background: 'rgba(0,0,0,0.3)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                    <strong style={{ color: '#F59E0B' }}>{m.source} Agent</strong> mentioned <strong style={{ color: '#FCD34D' }}>@{m.target}</strong>: "{m.message}"
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formatted Agent Contribution Cards */}
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f4f4f5', margin: '0 0 0.75rem 0' }}>
              Live Agent State Entries ({agentOutputs.length})
            </h3>

            {agentOutputs.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '0.85rem' }}>
                {agentOutputs.map(([key, val]: any) => {
                  const agentName = key.replace('_output', '');
                  return (
                    <div key={key} style={{
                      background: '#18181b',
                      border: '1px solid #27272a',
                      borderRadius: '10px',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}>
                      {/* Card Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontSize: '1rem' }}>🤖</span>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#60A5FA' }}>{agentName} Agent</span>
                        </div>
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          background: 'rgba(96, 165, 250, 0.1)',
                          color: '#93C5FD'
                        }}>
                          ✓ Synchronized
                        </span>
                      </div>

                      {/* Content Key-Values */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
                        {Object.entries(val).map(([subK, subV]) => {
                          if (subK === 'mentions') return null;
                          return (
                            <div key={subK} className="input-data-chip" style={{ padding: '0.4rem 0.6rem' }}>
                              <span className="input-data-label" style={{ fontSize: '0.62rem' }}>{subK}</span>
                              <span className="input-data-val" style={{
                                fontSize: '0.78rem',
                                color: typeof subV === 'boolean' ? (subV ? '#34D399' : '#f87171') : '#e4e4e7'
                              }}>
                                {typeof subV === 'object' ? JSON.stringify(subV) : String(subV)}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* If agent emitted mentions */}
                      {Array.isArray(val.mentions) && val.mentions.length > 0 && (
                        <div style={{
                          background: 'rgba(245, 158, 11, 0.1)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          borderRadius: '6px',
                          padding: '0.5rem 0.75rem',
                          fontSize: '0.72rem',
                          color: '#FEF3C7'
                        }}>
                          💬 <strong>Emitted Mention:</strong> @{val.mentions[0].target} — "{val.mentions[0].message}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{
                padding: '2.5rem',
                textAlign: 'center',
                background: '#18181b',
                borderRadius: '8px',
                border: '1px dashed #27272a'
              }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>💤</div>
                <h4 style={{ margin: 0, color: '#f4f4f5' }}>No Active Blackboard States</h4>
                <p style={{ margin: '0.35rem 0 0 0', color: '#71717a', fontSize: '0.8rem' }}>
                  When agents execute on an application, their outputs and inter-agent pings will populate this shared bus in real time.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: Three-Graph Epistemic Memory ── */}
      {activeTab === 'graphs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Graph 1: Query Graph (Embedding Retrieval) */}
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '10px',
            padding: '1.25rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#60A5FA', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>🔍</span> Graph 1: Query Graph (FAISS Vector Retrieval)
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#71717a' }}>
                  Semantic top-K nearest borrower applications matching current applicant risk vector.
                </span>
              </div>

              {similarCases.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.75rem' }}>
                  <span style={{ color: '#34D399', fontWeight: 700 }}>● {repaidCases} Repaid</span>
                  <span style={{ color: '#71717a' }}>·</span>
                  <span style={{ color: '#ef4444', fontWeight: 700 }}>● {defaultedCases} Defaulted</span>
                </div>
              )}
            </div>

            {similarCases.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.65rem' }}>
                {similarCases.map((c: any, idx: number) => {
                  const isRepaid = c.outcome === 'REPAID';
                  return (
                    <div key={idx} style={{
                      background: '#121214',
                      borderLeft: `4px solid ${isRepaid ? '#10B981' : '#ef4444'}`,
                      borderTop: '1px solid #27272a',
                      borderRight: '1px solid #27272a',
                      borderBottom: '1px solid #27272a',
                      borderRadius: '6px',
                      padding: '0.75rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f4f4f5' }}>{c.appId}</span>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          background: isRepaid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: isRepaid ? '#34D399' : '#f87171'
                        }}>
                          {isRepaid ? '✓ REPAID' : '✕ DEFAULTED'} ({c.months}mo)
                        </span>
                      </div>

                      <div style={{ fontSize: '0.75rem', color: '#a1a1aa', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Income: ₹{c.income?.toLocaleString()}</span>
                        <span>Loan: ₹{c.amount?.toLocaleString()}</span>
                      </div>

                      <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flexGrow: 1, height: '4px', background: '#27272a', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${(c.similarity || 0.8) * 100}%`, height: '100%', background: '#60A5FA' }} />
                        </div>
                        <span style={{ fontSize: '0.65rem', color: '#60A5FA', fontWeight: 600 }}>
                          {((c.similarity || 0.8) * 100).toFixed(0)}% Match
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: '#71717a', fontSize: '0.8rem', margin: 0 }}>No similar vectors queried yet.</p>
            )}
          </div>

          {/* Graph 2: Interaction Graph (Execution Trajectories) */}
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '10px',
            padding: '1.25rem'
          }}>
            <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1rem', fontWeight: 800, color: '#818CF8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>🔄</span> Graph 2: Interaction Graph (Trajectory Paths)
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#71717a', margin: '0 0 0.85rem 0' }}>
              Maps historical agent routing decisions to loan maturity outcomes for reinforcement.
            </p>

            <div style={{
              background: '#121214',
              border: '1px solid #27272a',
              borderRadius: '8px',
              padding: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.8rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ padding: '0.2rem 0.5rem', background: '#27272a', borderRadius: '4px', color: '#e4e4e7', fontWeight: 600 }}>
                  Active Trajectory
                </span>
                <span style={{ color: '#a1a1aa' }}>
                  KYC ➔ (Fraud || Credit) ➔ Affordability ➔ (Pricing || Policy) ➔ Explainability
                </span>
              </div>
              <span style={{ color: '#10B981', fontWeight: 700 }}>
                ● Optimized DAG Path
              </span>
            </div>
          </div>

          {/* Graph 3: Insight Graph (Distilled Institutional Rules) */}
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '10px',
            padding: '1.25rem'
          }}>
            <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1rem', fontWeight: 800, color: '#C084FC', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>💡</span> Graph 3: Insight Graph (Distilled System Rules)
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#71717a', margin: '0 0 0.85rem 0' }}>
              Autonomous epistemic heuristics synthesized from historical loan cohorts to guide LLM prompt injection.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {normalizedMemory.insights.map((insight: string, idx: number) => (
                <div key={idx} style={{
                  background: 'rgba(192, 132, 252, 0.06)',
                  border: '1px solid rgba(192, 132, 252, 0.25)',
                  borderRadius: '6px',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.65rem'
                }}>
                  <span style={{ color: '#C084FC', fontSize: '1rem' }}>✦</span>
                  <span style={{ fontSize: '0.82rem', color: '#E9D5FF', lineHeight: 1.4 }}>
                    {insight}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ── TAB 3: Inter-Agent Mentions Bus ── */}
      {activeTab === 'mentions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '10px',
            padding: '1.25rem'
          }}>
            <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1rem', fontWeight: 800, color: '#FBBF24', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>💬</span> Inter-Agent Mention & Collaboration Protocol
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#a1a1aa', margin: '0 0 1rem 0' }}>
              When an upstream agent encounters ambiguity, an inconsistency, or a cross-domain anomaly, it uses the <code>MENTION: @AgentName</code> syntax. 
              The mentioned agent reads this alert from the Shared Blackboard and adjusts its evaluation parameters dynamically.
            </p>

            {activeMentions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {activeMentions.map((m, idx) => (
                  <div key={idx} style={{
                    background: '#121214',
                    border: '1px solid #27272a',
                    borderLeft: '4px solid #F59E0B',
                    borderRadius: '8px',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, color: '#f4f4f5', fontSize: '0.85rem' }}>{m.source} Agent</span>
                        <span style={{ color: '#F59E0B' }}>➔</span>
                        <span style={{
                          background: 'rgba(245, 158, 11, 0.2)',
                          color: '#FCD34D',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          fontWeight: 700,
                          fontSize: '0.78rem'
                        }}>
                          @{m.target}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.68rem', color: '#10B981', fontWeight: 600 }}>
                        ● Addressed via Blackboard
                      </span>
                    </div>

                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: '#FEF3C7', lineHeight: 1.4 }}>
                      "{m.message}"
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                padding: '2rem',
                textAlign: 'center',
                background: '#121214',
                borderRadius: '8px',
                border: '1px dashed #27272a'
              }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>🕊️</div>
                <h4 style={{ margin: 0, color: '#f4f4f5' }}>Zero Inconsistencies Detected</h4>
                <p style={{ margin: '0.25rem 0 0 0', color: '#71717a', fontSize: '0.78rem' }}>
                  No agents have flagged cross-domain anomalies for the current application.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 4: Raw Memory JSON ── */}
      {activeTab === 'raw' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#71717a' }}>
              Full serialized G-Memory and Shared Blackboard state dictionary.
            </span>
            <button
              onClick={handleCopyRaw}
              style={{
                background: '#18181b',
                border: '1px solid #27272a',
                color: copied ? '#10B981' : '#a1a1aa',
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {copied ? '✓ Copied to Clipboard' : '📋 Copy JSON'}
            </button>
          </div>

          <pre style={{
            background: '#09090b',
            border: '1px solid #27272a',
            borderRadius: '8px',
            padding: '1.25rem',
            fontSize: '0.75rem',
            color: '#a1a1aa',
            maxHeight: '500px',
            overflowY: 'auto',
            margin: 0
          }}>
            {JSON.stringify({ sharedState, memoryMatches: normalizedMemory }, null, 2)}
          </pre>
        </div>
      )}

      {/* ── Readme Architectural Documentation Modal ── */}
      <ReadmeModal
        isOpen={showReadmeModal}
        onClose={() => setShowReadmeModal(false)}
        initialSection="g-memory-system"
        title="G-Memory Epistemic Hierarchy — Architecture & Schema"
      />

    </div>
  );
};
