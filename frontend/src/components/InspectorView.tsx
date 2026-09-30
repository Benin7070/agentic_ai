import React, { useState, useEffect } from 'react';
import { useSimulation } from '../contexts/SimulationContext';
import { RiskBadge } from './RiskBadge';
import { ProcessDetailModal } from './ProcessDetailModal';

export const InspectorPanel: React.FC = () => {
  const { selectedRequest: req, submitHumanDecision, flagForHumanReview } = useSimulation();
  const [selectedAgentName, setSelectedAgentName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dag' | 'decision' | 'hitl' | 'logs'>('dag');
  const [isDossierOpen, setIsDossierOpen] = useState<boolean>(false);

  const [verdict, setVerdict] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [reviewerName, setReviewerName] = useState<string>('Senior Underwriter #402');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [offerRate, setOfferRate] = useState<number>(10.5);
  const [sanctionAmount, setSanctionAmount] = useState<number>(100000);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (req) {
      setSanctionAmount(req.decision?.approvedAmount || req.app?.requestedAmount || 100000);
      setOfferRate(req.decision?.interestRate || 10.5);
      setReviewNotes('');
      setSubmitSuccess(null);
      if (req.status === 'MANUAL_REVIEW') {
        setActiveTab('hitl');
      }
    }
  }, [req?.id, req?.status]);

  if (!req) {
    return (
      <section className="glass-panel inspector-empty">
        <div className="inspector-empty-inner">
          <span className="inspector-empty-icon" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔍</span>
          <h3 style={{ margin: '0 0 0.35rem 0', color: '#f4f4f5', fontSize: '1rem' }}>No Active Process Selected</h3>
          <p style={{ color: '#71717a', fontSize: '0.8rem', margin: 0 }}>
            Select any application from the queue to inspect its live DAG execution, tool spans, and decision dossier.
          </p>
        </div>
      </section>
    );
  }

  const { app, agents, currentAgentIndex, status, decision } = req;
  const activeAgent = currentAgentIndex >= 0 ? agents[currentAgentIndex] : null;
  const isCompleted = status === 'COMPLETED';
  const isManualReview = status === 'MANUAL_REVIEW';

  const handleSubmitVerdict = async () => {
    if (!reviewNotes.trim()) return;
    setIsSubmitting(true);
    try {
      await submitHumanDecision(
        req.id,
        verdict,
        reviewNotes.trim(),
        reviewerName.trim(),
        verdict === 'APPROVED' ? { interestRate: offerRate, approvedAmount: sanctionAmount } : undefined
      );
      setSubmitSuccess(`Verdict ${verdict} recorded successfully by ${reviewerName}!`);
      setTimeout(() => setSubmitSuccess(null), 4000);
    } catch (err) {
      console.error('Failed to submit underwriter verdict:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const allOutput = agents.flatMap(a =>
    a.output.map(line => ({ agent: a.name, line }))
  );

  const inspectingAgent = selectedAgentName 
    ? agents.find(a => a.name === selectedAgentName) 
    : (activeAgent || agents[0]);

  return (
    <>
      <section className="glass-panel inspector" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        
        {/* ── Inspector Header ── */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid #27272a',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {req.queueNumber && (
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 800,
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#60A5FA',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}>
                {req.queueNumber}
              </span>
            )}
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#f4f4f5' }}>
              ⚡ {req.id}
            </h2>
            {req.recordTag && (
              <span style={{
                fontSize: '0.62rem',
                fontFamily: 'monospace',
                fontWeight: 600,
                padding: '0.12rem 0.45rem',
                borderRadius: '4px',
                background: '#27272a',
                color: '#94a3b8',
                border: '1px solid #3f3f46'
              }}>
                🏷️ {req.recordTag}
              </span>
            )}
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '0.15rem 0.5rem',
              borderRadius: '9999px',
              background: isCompleted ? 'rgba(16, 185, 129, 0.15)' : isManualReview ? 'rgba(245, 158, 11, 0.18)' : 'rgba(59, 130, 246, 0.15)',
              color: isCompleted ? '#34D399' : isManualReview ? '#FBBF24' : '#60A5FA',
              border: isManualReview ? '1px solid rgba(245, 158, 11, 0.4)' : 'none'
            }}>
              {isManualReview ? '⚖️ HUMAN REVIEW REQUIRED' : status}
            </span>
            {req.routing && <RiskBadge risk={req.routing.riskLevel} size="sm" />}
            {req.scratchpad && (
              <span style={{
                fontSize: '0.6rem',
                color: '#10b981',
                background: 'rgba(16, 185, 129, 0.1)',
                padding: '0.1rem 0.4rem',
                borderRadius: '4px',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem'
              }}>
                🔒 {req.scratchpad.id}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Tab switchers */}
            <div style={{ display: 'flex', background: '#121214', padding: '0.2rem', borderRadius: '6px', border: '1px solid #27272a', gap: '0.15rem' }}>
              <button
                onClick={() => setActiveTab('dag')}
                style={{
                  background: activeTab === 'dag' ? '#27272a' : 'transparent',
                  color: activeTab === 'dag' ? '#fff' : '#71717a',
                  border: 'none',
                  padding: '0.25rem 0.55rem',
                  borderRadius: '4px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                DAG
              </button>
              <button
                onClick={() => setActiveTab('decision')}
                style={{
                  background: activeTab === 'decision' ? '#27272a' : 'transparent',
                  color: activeTab === 'decision' ? '#fff' : '#71717a',
                  border: 'none',
                  padding: '0.25rem 0.55rem',
                  borderRadius: '4px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Decision
              </button>
              <button
                onClick={() => setActiveTab('hitl')}
                style={{
                  background: activeTab === 'hitl' ? '#f59e0b' : (isManualReview ? 'rgba(245, 158, 11, 0.2)' : 'transparent'),
                  color: activeTab === 'hitl' ? '#09090b' : (isManualReview ? '#FBBF24' : '#71717a'),
                  border: isManualReview && activeTab !== 'hitl' ? '1px solid #f59e0b' : 'none',
                  padding: '0.25rem 0.55rem',
                  borderRadius: '4px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                <span>⚖️ Human Review</span>
                {isManualReview && (
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: activeTab === 'hitl' ? '#09090b' : '#f59e0b', animation: 'pulseActiveBorder 1.2s infinite' }} />
                )}
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                style={{
                  background: activeTab === 'logs' ? '#27272a' : 'transparent',
                  color: activeTab === 'logs' ? '#fff' : '#71717a',
                  border: 'none',
                  padding: '0.25rem 0.55rem',
                  borderRadius: '4px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Logs
              </button>
            </div>

            {/* Deep Process Dossier Button */}
            <button
              onClick={() => setIsDossierOpen(true)}
              style={{
                background: '#18181b',
                border: '1px solid #3f3f46',
                color: '#f4f4f5',
                padding: '0.35rem 0.7rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                transition: 'all 0.15s ease'
              }}
              title="Open full-screen executive process dossier"
            >
              <span>🔍</span> Dossier ↗
            </button>
          </div>
        </div>

        {/* ── Applicant Overview Ribbon ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
          gap: '0.4rem',
          padding: '0.5rem 0',
          borderBottom: '1px solid #27272a',
          flexShrink: 0
        }}>
          <div className="input-data-chip" style={{ padding: '0.35rem 0.5rem' }}>
            <span className="input-data-label" style={{ fontSize: '0.6rem' }}>Applicant</span>
            <span className="input-data-val" style={{ fontSize: '0.78rem' }}>{app.fullName?.split(' ')[0]}</span>
          </div>
          <div className="input-data-chip" style={{ padding: '0.35rem 0.5rem' }}>
            <span className="input-data-label" style={{ fontSize: '0.6rem' }}>Loan Amount</span>
            <span className="input-data-val" style={{ fontSize: '0.78rem' }}>₹{app.requestedAmount.toLocaleString('en-IN')}</span>
          </div>
          <div className="input-data-chip" style={{ padding: '0.35rem 0.5rem' }}>
            <span className="input-data-label" style={{ fontSize: '0.6rem' }}>Income</span>
            <span className="input-data-val" style={{ fontSize: '0.78rem' }}>₹{app.monthlyIncome.toLocaleString('en-IN')}/mo</span>
          </div>
          <div className="input-data-chip" style={{ padding: '0.35rem 0.5rem' }}>
            <span className="input-data-label" style={{ fontSize: '0.6rem' }}>Tenure</span>
            <span className="input-data-val" style={{ fontSize: '0.78rem' }}>{app.requestedTenureMonths} Mos</span>
          </div>
          <div className="input-data-chip" style={{ padding: '0.35rem 0.5rem' }}>
            <span className="input-data-label" style={{ fontSize: '0.6rem' }}>Employment</span>
            <span className="input-data-val" style={{ fontSize: '0.78rem' }}>{app.employmentType}</span>
          </div>
        </div>

        {/* ── Main Tab Content ── */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem', paddingTop: '0.65rem', overflowY: 'auto' }}>
          
          {/* TAB 1: Visual DAG Process Flow */}
          {activeTab === 'dag' && (
            <>
              {/* Visual 5-Level Hierarchical DAG */}
              <div style={{
                background: '#09090b',
                border: '1px solid #27272a',
                borderRadius: '8px',
                padding: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: '#71717a', textTransform: 'uppercase', fontWeight: 700 }}>
                    DAG Execution Levels (Click any node to inspect step output)
                  </span>
                  <span style={{ fontSize: '0.68rem', color: '#60A5FA' }}>
                    {activeAgent ? `Running: ${activeAgent.name}` : isCompleted ? 'All Levels Finished' : 'Orchestrating'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'center' }}>
                  {[
                    { label: 'L1 Gatekeeper', nodes: ['KYC'] },
                    { label: 'L2 Parallel Risk', nodes: ['Fraud', 'Credit'] },
                    { label: 'L3 Capacity', nodes: ['Affordability'] },
                    { label: 'L4 Synthesis', nodes: ['Pricing', 'Policy'] },
                    { label: 'L5 Fairness', nodes: ['Explainability'] }
                  ].map((level, lvlIdx) => (
                    <div key={lvlIdx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                      <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'center', width: '100%' }}>
                        {level.nodes.map(agentName => {
                          const agent = agents.find(a => a.name === agentName);
                          if (!agent) return null;

                          const isSelected = agent.name === inspectingAgent?.name;
                          const isDone = agent.status === 'COMPLETED';
                          const isRun = agent.status === 'ACTIVE';
                          const isSkip = agent.status === 'SKIPPED';

                          return (
                            <button
                              key={agent.name}
                              onClick={() => setSelectedAgentName(agent.name)}
                              style={{
                                flex: 1,
                                maxWidth: '175px',
                                padding: '0.45rem 0.65rem',
                                borderRadius: '6px',
                                background: isSelected ? '#1e293b' : (isRun ? 'rgba(59, 130, 246, 0.15)' : '#18181b'),
                                border: isSelected 
                                  ? '1.5px solid #60A5FA' 
                                  : (isRun ? '1.5px solid #3b82f6' : (isDone ? '1px solid #22c55e' : '1px solid #27272a')),
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                transition: 'all 0.15s ease',
                                textAlign: 'left',
                                boxShadow: isRun ? '0 0 10px rgba(59, 130, 246, 0.3)' : 'none'
                              }}
                            >
                              <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f4f4f5' }}>
                                  {agent.name}
                                </div>
                                <div style={{ fontSize: '0.65rem', color: '#71717a' }}>
                                  {isDone ? `${(agent.elapsedMs / 1000).toFixed(2)}s` : isSkip ? 'Skip' : (isRun ? '⚡ Running' : 'Pending')}
                                </div>
                              </div>

                              <span style={{ fontSize: '0.8rem' }}>
                                {isDone ? '✅' : isRun ? '🔄' : isSkip ? '━━' : '⏳'}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {lvlIdx < 4 && (
                        <div style={{ color: '#52525b', fontSize: '0.65rem', margin: '0.15rem 0' }}>▼</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Agent Step Details Box */}
              {inspectingAgent && (
                <div style={{
                  background: '#121214',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.85rem' }}>🔍</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#60A5FA' }}>
                        {inspectingAgent.name} Step Inspector
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.7rem', color: '#a1a1aa' }}>
                        Time: {(inspectingAgent.elapsedMs / 1000).toFixed(2)}s
                      </span>
                      <span style={{
                        fontSize: '0.62rem',
                        color: '#10b981',
                        background: 'rgba(16, 185, 129, 0.12)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        padding: '0.12rem 0.4rem',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem'
                      }}>
                        <span>🔒</span> Zero-Cache
                      </span>
                    </div>
                  </div>

                  {/* Output lines */}
                  <div style={{
                    background: '#09090b',
                    border: '1px solid #27272a',
                    borderRadius: '6px',
                    padding: '0.5rem',
                    fontSize: '0.75rem',
                    fontFamily: 'JetBrains Mono, monospace',
                    maxHeight: '120px',
                    overflowY: 'auto'
                  }}>
                    {inspectingAgent.output && inspectingAgent.output.length > 0 ? (
                      inspectingAgent.output.map((line, idx) => (
                        <div key={idx} style={{ color: line.includes('PASSED') || line.includes('VALID') ? '#34D399' : line.includes('FAILED') ? '#ef4444' : '#d4d4d8', marginBottom: '0.2rem' }}>
                          {line}
                        </div>
                      ))
                    ) : (
                      <span style={{ color: '#71717a' }}>No step output logs yet.</span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 2: Decision Breakdown */}
          {activeTab === 'decision' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {decision ? (
                <div style={{
                  background: decision.type === 'APPROVED' ? 'rgba(34, 197, 94, 0.08)' : decision.type === 'REJECTED' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(234, 179, 8, 0.08)',
                  border: `1px solid ${decision.type === 'APPROVED' ? '#22c55e' : decision.type === 'REJECTED' ? '#ef4444' : '#eab308'}`,
                  borderRadius: '8px',
                  padding: '1rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: decision.type === 'APPROVED' ? '#4ade80' : decision.type === 'REJECTED' ? '#f87171' : '#facc15' }}>
                        {decision.type === 'APPROVED' ? '✅ APPROVED' : decision.type === 'REJECTED' ? '❌ REJECTED' : '🟡 MANUAL REVIEW'}
                      </div>
                      {decision.humanOverride && (
                        <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '0.12rem 0.4rem', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.4)' }}>
                          👤 HUMAN SUPERVISED
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>
                      Confidence: <strong>{(decision.confidence * 100).toFixed(0)}%</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', fontSize: '0.8rem', color: '#d4d4d8' }}>
                    {decision.interestRate && <div>Offered Rate: <strong style={{ color: '#38bdf8' }}>{decision.interestRate}% APR</strong></div>}
                    {decision.approvedAmount && <div>Sanctioned Limit: <strong style={{ color: '#4ade80' }}>₹{decision.approvedAmount.toLocaleString('en-IN')}</strong></div>}
                  </div>

                  {decision.type === 'MANUAL_REVIEW' && (
                    <div style={{
                      background: 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      borderRadius: '6px',
                      padding: '0.5rem 0.75rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.75rem'
                    }}>
                      <div style={{ fontSize: '0.75rem', color: '#FBBF24', fontWeight: 600 }}>
                        ⚠️ Awaiting senior underwriter manual sign-off
                      </div>
                      <button
                        onClick={() => setActiveTab('hitl')}
                        style={{
                          background: '#f59e0b',
                          color: '#09090b',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '0.25rem 0.6rem',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        Open Underwriter Desk ➜
                      </button>
                    </div>
                  )}

                  {decision.humanReview && (
                    <div style={{
                      background: 'rgba(56, 189, 248, 0.08)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      borderRadius: '6px',
                      padding: '0.5rem 0.75rem',
                      marginBottom: '0.75rem',
                      fontSize: '0.75rem'
                    }}>
                      <div style={{ color: '#38bdf8', fontWeight: 700, marginBottom: '0.2rem' }}>
                        👤 Underwriter Verdict: {decision.humanReview.verdict} by {decision.humanReview.reviewer}
                      </div>
                      <div style={{ color: '#cbd5e1', fontStyle: 'italic' }}>
                        "{decision.humanReview.notes}"
                      </div>
                    </div>
                  )}

                  <div style={{ fontSize: '0.75rem', color: '#a1a1aa', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    Decision Reasons & Audit Trail:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.78rem', color: '#d4d4d8', lineHeight: 1.5 }}>
                    {decision.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', background: '#121214', borderRadius: '8px', border: '1px dashed #27272a' }}>
                  <p style={{ margin: 0, color: '#71717a', fontSize: '0.8rem' }}>Pipeline is processing. Decision will render upon Level 5 completion.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Human In The Loop (HITL) Desk */}
          {activeTab === 'hitl' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, minHeight: 0, overflowY: 'auto' }}>
              {/* Desk Header Banner */}
              <div style={{
                background: isManualReview ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                border: isManualReview ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: '8px',
                padding: '0.85rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span style={{ fontSize: '1rem' }}>⚖️</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: isManualReview ? '#FBBF24' : '#93C5FD' }}>
                      Human-In-The-Loop Underwriter Console
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#a1a1aa', marginTop: '0.2rem' }}>
                    {isManualReview 
                      ? 'Autonomous multi-agent consensus flagged risk factors requiring senior human sign-off.' 
                      : (decision?.humanOverride ? 'Human underwriter verdict has been recorded and committed to memory.' : 'Autonomous decision active. Human intervention can be enacted below.')}
                  </div>
                </div>

                {isCompleted && !isManualReview && (
                  <button
                    onClick={() => flagForHumanReview(req.id)}
                    style={{
                      background: 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      color: '#FBBF24',
                      padding: '0.3rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    ✋ Intervene / Pull to Review
                  </button>
                )}
              </div>

              {/* Referral reasons / Multi-Agent flags */}
              <div style={{
                background: '#121214',
                border: '1px solid #27272a',
                borderRadius: '8px',
                padding: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.45rem'
              }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f4f4f5', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span>🚩</span> Key Signals & Referral Rationale
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', fontSize: '0.7rem' }}>
                  <div style={{ background: '#18181b', padding: '0.4rem', borderRadius: '4px', border: '1px solid #27272a' }}>
                    <div style={{ color: '#71717a' }}>Monthly Income / EMI</div>
                    <div style={{ color: '#f4f4f5', fontWeight: 700 }}>₹{app.monthlyIncome.toLocaleString('en-IN')} / ₹{app.existingEMIs.toLocaleString('en-IN')}</div>
                    <div style={{ color: '#eab308', fontSize: '0.62rem' }}>DTI: {(app.existingEMIs / Math.max(app.monthlyIncome, 1)).toFixed(2)}</div>
                  </div>
                  <div style={{ background: '#18181b', padding: '0.4rem', borderRadius: '4px', border: '1px solid #27272a' }}>
                    <div style={{ color: '#71717a' }}>Cheque Bounces / Var</div>
                    <div style={{ color: app.numberOfBounces > 0 ? '#f87171' : '#4ade80', fontWeight: 700 }}>
                      {app.numberOfBounces} return(s) · {app.salaryDayVariance}d var
                    </div>
                    <div style={{ color: '#a1a1aa', fontSize: '0.62rem' }}>Job: {app.yearsAtCurrentJob}y @ {app.employerName}</div>
                  </div>
                  <div style={{ background: '#18181b', padding: '0.4rem', borderRadius: '4px', border: '1px solid #27272a' }}>
                    <div style={{ color: '#71717a' }}>Requested Amount</div>
                    <div style={{ color: '#60A5FA', fontWeight: 700 }}>₹{app.requestedAmount.toLocaleString('en-IN')}</div>
                    <div style={{ color: '#a1a1aa', fontSize: '0.62rem' }}>Tenure: {app.requestedTenureMonths} mo</div>
                  </div>
                </div>

                {decision?.reasons && decision.reasons.length > 0 && (
                  <div style={{ marginTop: '0.2rem' }}>
                    <div style={{ fontSize: '0.68rem', color: '#71717a', marginBottom: '0.2rem' }}>Consensus Referral Factors:</div>
                    <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.72rem', color: '#d4d4d8', lineHeight: 1.4 }}>
                      {decision.reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Already Supervised Audit Card (if decision recorded) */}
              {decision?.humanReview && (
                <div style={{
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span>🛡️</span> Verified Underwriter Decision
                    </span>
                    <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                      {new Date(decision.humanReview.reviewedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#f4f4f5' }}>
                    Verdict: <strong style={{ color: decision.humanReview.verdict === 'APPROVED' ? '#4ade80' : '#f87171' }}>{decision.humanReview.verdict}</strong>
                    {' '}by <strong>{decision.humanReview.reviewer}</strong>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#cbd5e1', fontStyle: 'italic', background: 'rgba(0,0,0,0.25)', padding: '0.4rem', borderRadius: '4px' }}>
                    "{decision.humanReview.notes}"
                  </div>
                </div>
              )}

              {/* Underwriter Action Form */}
              <div style={{
                background: '#121214',
                border: '1px solid #27272a',
                borderRadius: '8px',
                padding: '0.85rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f4f4f5' }}>
                    ✍️ Record Human Verdict & Terms
                  </span>
                  {submitSuccess && (
                    <span style={{ fontSize: '0.7rem', color: '#4ade80', fontWeight: 700 }}>
                      ✓ {submitSuccess}
                    </span>
                  )}
                </div>

                {/* Verdict Toggle */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setVerdict('APPROVED')}
                    style={{
                      background: verdict === 'APPROVED' ? 'rgba(34, 197, 94, 0.2)' : '#18181b',
                      border: verdict === 'APPROVED' ? '1.5px solid #22c55e' : '1px solid #27272a',
                      color: verdict === 'APPROVED' ? '#4ade80' : '#a1a1aa',
                      padding: '0.45rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <span>✅</span> APPROVE APPLICATION
                  </button>

                  <button
                    type="button"
                    onClick={() => setVerdict('REJECTED')}
                    style={{
                      background: verdict === 'REJECTED' ? 'rgba(239, 68, 68, 0.2)' : '#18181b',
                      border: verdict === 'REJECTED' ? '1.5px solid #ef4444' : '1px solid #27272a',
                      color: verdict === 'REJECTED' ? '#f87171' : '#a1a1aa',
                      padding: '0.45rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <span>❌</span> REJECT APPLICATION
                  </button>
                </div>

                {/* Offer adjustments if approving */}
                {verdict === 'APPROVED' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                    <div>
                      <label style={{ fontSize: '0.65rem', color: '#a1a1aa', display: 'block', marginBottom: '0.2rem' }}>
                        Sanctioned Limit (₹)
                      </label>
                      <input
                        type="number"
                        value={sanctionAmount}
                        onChange={(e) => setSanctionAmount(Number(e.target.value))}
                        style={{
                          width: '100%',
                          background: '#09090b',
                          border: '1px solid #27272a',
                          borderRadius: '5px',
                          padding: '0.35rem 0.5rem',
                          color: '#f4f4f5',
                          fontSize: '0.75rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.65rem', color: '#a1a1aa', display: 'block', marginBottom: '0.2rem' }}>
                        Offered Interest Rate (% APR)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={offerRate}
                        onChange={(e) => setOfferRate(Number(e.target.value))}
                        style={{
                          width: '100%',
                          background: '#09090b',
                          border: '1px solid #27272a',
                          borderRadius: '5px',
                          padding: '0.35rem 0.5rem',
                          color: '#f4f4f5',
                          fontSize: '0.75rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Reviewer Name */}
                <div>
                  <label style={{ fontSize: '0.65rem', color: '#a1a1aa', display: 'block', marginBottom: '0.2rem' }}>
                    Underwriter Officer / Role
                  </label>
                  <input
                    type="text"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#09090b',
                      border: '1px solid #27272a',
                      borderRadius: '5px',
                      padding: '0.35rem 0.5rem',
                      color: '#f4f4f5',
                      fontSize: '0.75rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Justification & Notes */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <label style={{ fontSize: '0.65rem', color: '#a1a1aa' }}>
                      Decision Rationale & Audit Justification <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <span style={{ fontSize: '0.6rem', color: '#71717a' }}>Committed to G-Memory</span>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Enter explicit underwriter reasoning (e.g. verified alternative tax records, secondary guarantor verified, or excessive leverage)..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#09090b',
                      border: '1px solid #27272a',
                      borderRadius: '5px',
                      padding: '0.45rem',
                      color: '#f4f4f5',
                      fontSize: '0.75rem',
                      outline: 'none',
                      resize: 'none',
                      boxSizing: 'border-box',
                      lineHeight: 1.4
                    }}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="button"
                  disabled={isSubmitting || !reviewNotes.trim()}
                  onClick={handleSubmitVerdict}
                  style={{
                    background: !reviewNotes.trim() ? '#27272a' : (verdict === 'APPROVED' ? '#16a34a' : '#dc2626'),
                    color: !reviewNotes.trim() ? '#71717a' : '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.55rem',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: !reviewNotes.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {isSubmitting ? (
                    <span>⏳ Committing to MAS & Memory...</span>
                  ) : (
                    <span>⚡ Commit Underwriter Decision ({verdict}) ➜</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Execution Logs */}
          {activeTab === 'logs' && (
            <div className="inspector-log" style={{ flex: 1, minHeight: '180px' }}>
              <div className="inspector-log-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Real-time Multi-Agent Console</span>
                <span style={{ fontSize: '0.7rem', color: '#71717a' }}>{allOutput.length} entries</span>
              </div>
              <div className="inspector-log-body">
                {allOutput.length === 0 && <div className="log-line log-line--dim">Awaiting telemetry output...</div>}
                {allOutput.map((o, i) => (
                  <div key={i} className="log-line" style={{ display: 'flex', gap: '0.4rem' }}>
                    <span className="log-agent">[{o.agent}]</span>
                    <span>{o.line}</span>
                  </div>
                ))}
                {isCompleted && (
                  <div className="log-line log-line--success" style={{ marginTop: '0.5rem' }}>
                    ✓ Pipeline completed. Consensus reached.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </section>

      {/* ── Full Executive Process Dossier Modal ── */}
      {isDossierOpen && (
        <ProcessDetailModal request={req} onClose={() => setIsDossierOpen(false)} />
      )}
    </>
  );
};
