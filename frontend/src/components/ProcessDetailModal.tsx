import React, { useState } from 'react';
import type { PipelineRequest } from '../types';
import { RiskBadge } from './RiskBadge';

interface ProcessDetailModalProps {
  request: PipelineRequest;
  onClose: () => void;
}

export const ProcessDetailModal: React.FC<ProcessDetailModalProps> = ({ request, onClose }) => {
  const [activeTab, setActiveTab] = useState<'decision' | 'trajectory' | 'scratchpad' | 'borrower' | 'routing' | 'raw'>('decision');
  const [copied, setCopied] = useState(false);
  const [selectedAgentName, setSelectedAgentName] = useState<string>('KYC');

  const { app, agents, decision, routing, sharedState, memoryMatches } = request;
  const isCompleted = request.status === 'COMPLETED';

  // Normalize G-Memory
  const isLegacyArray = Array.isArray(memoryMatches);
  const similarCases = isLegacyArray ? memoryMatches : (memoryMatches?.similar_cases || []);
  const insights = isLegacyArray ? [] : (memoryMatches?.insights || []);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(request, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedAgent = agents.find(a => a.name === selectedAgentName) || agents[0];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem'
    }} onClick={onClose}>
      <div style={{
        background: '#09090b', // zinc-950
        border: '1px solid #27272a',
        borderRadius: '14px',
        width: '100%',
        maxWidth: '1100px',
        height: '92%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9)',
        fontFamily: 'Inter, system-ui, sans-serif'
      }} onClick={e => e.stopPropagation()}>
        
        {/* ── Modal Header ── */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid #27272a',
          background: '#121214',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: '#18181b',
              border: '1px solid #27272a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.3rem'
            }}>
              📄
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                {request.queueNumber && (
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    background: 'rgba(59, 130, 246, 0.15)',
                    color: '#60A5FA',
                    border: '1px solid rgba(59, 130, 246, 0.3)'
                  }}>
                    {request.queueNumber}
                  </span>
                )}
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#f4f4f5' }}>
                  {request.id} — Process Dossier
                </h2>
                {request.recordTag && (
                  <span style={{
                    fontSize: '0.68rem',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    background: '#27272a',
                    color: '#94a3b8',
                    border: '1px solid #3f3f46'
                  }}>
                    🏷️ {request.recordTag}
                  </span>
                )}
                {request.priority && (
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    background: request.priority === 'VIP' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                    color: request.priority === 'VIP' ? '#facc15' : '#c084fc',
                    border: `1px solid ${request.priority === 'VIP' ? 'rgba(234, 179, 8, 0.3)' : 'rgba(168, 85, 247, 0.3)'}`
                  }}>
                    {request.priority}
                  </span>
                )}
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.5rem',
                  borderRadius: '9999px',
                  background: isCompleted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                  color: isCompleted ? '#34D399' : '#60A5FA'
                }}>
                  {request.status}
                </span>

                {decision && (
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.5rem',
                    borderRadius: '9999px',
                    background: decision.type === 'APPROVED' ? 'rgba(34, 197, 94, 0.2)' : decision.type === 'REJECTED' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                    color: decision.type === 'APPROVED' ? '#4ade80' : decision.type === 'REJECTED' ? '#f87171' : '#facc15'
                  }}>
                    {decision.type}
                  </span>
                )}
              </div>

              <div style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>
                Applicant: <strong style={{ color: '#f4f4f5' }}>{app.fullName}</strong> · Requested: <strong style={{ color: '#f4f4f5' }}>₹{app.requestedAmount.toLocaleString('en-IN')}</strong> · Purpose: {app.loanPurpose}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={handleCopyJson}
              style={{
                background: '#18181b',
                border: '1px solid #27272a',
                color: copied ? '#10B981' : '#a1a1aa',
                padding: '0.45rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {copied ? '✓ Copied' : '📋 Copy JSON'}
            </button>

            <button
              onClick={onClose}
              style={{
                background: '#18181b',
                border: '1px solid #27272a',
                color: '#a1a1aa',
                padding: '0.45rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* ── Tab Navigation ── */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          padding: '0.65rem 1.75rem',
          background: '#0e0e11',
          borderBottom: '1px solid #27272a',
          overflowX: 'auto'
        }}>
          <button
            onClick={() => setActiveTab('decision')}
            className={`run-tab ${activeTab === 'decision' ? 'active' : ''}`}
          >
            <span>🎯</span> Underwriting Decision
          </button>
          <button
            onClick={() => setActiveTab('trajectory')}
            className={`run-tab ${activeTab === 'trajectory' ? 'active' : ''}`}
          >
            <span>⚡</span> MAS Agent Trajectory ({agents.length})
          </button>
          <button
            onClick={() => setActiveTab('scratchpad')}
            className={`run-tab ${activeTab === 'scratchpad' ? 'active' : ''}`}
          >
            <span>🔒</span> Isolated Scratchpad & Tags
          </button>
          <button
            onClick={() => setActiveTab('borrower')}
            className={`run-tab ${activeTab === 'borrower' ? 'active' : ''}`}
          >
            <span>👤</span> Borrower Financial Profile
          </button>
          <button
            onClick={() => setActiveTab('routing')}
            className={`run-tab ${activeTab === 'routing' ? 'active' : ''}`}
          >
            <span>🔀</span> Dynamic Routing & G-Memory
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`run-tab ${activeTab === 'raw' ? 'active' : ''}`}
          >
            <span>💻</span> Raw Dossier JSON
          </button>
        </div>

        {/* ── Modal Content Body ── */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>

          {/* TAB 1: Underwriting Decision */}
          {activeTab === 'decision' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {decision ? (
                <>
                  {/* Verdict Banner */}
                  <div style={{
                    background: decision.type === 'APPROVED' ? 'rgba(34, 197, 94, 0.08)' : decision.type === 'REJECTED' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(234, 179, 8, 0.08)',
                    border: `1px solid ${decision.type === 'APPROVED' ? '#22c55e' : decision.type === 'REJECTED' ? '#ef4444' : '#eab308'}`,
                    borderRadius: '10px',
                    padding: '1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a1a1aa', fontWeight: 700 }}>
                        Consensus Underwriting Verdict
                      </div>
                      <div style={{
                        fontSize: '1.8rem',
                        fontWeight: 900,
                        color: decision.type === 'APPROVED' ? '#4ade80' : decision.type === 'REJECTED' ? '#f87171' : '#facc15',
                        marginTop: '0.2rem'
                      }}>
                        {decision.type === 'APPROVED' ? '✅ APPLICATION APPROVED' : decision.type === 'REJECTED' ? '❌ APPLICATION REJECTED' : '🟡 MANUAL REVIEW REQUIRED'}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#d4d4d8', marginTop: '0.25rem' }}>
                        Evaluated by 7-Agent Autonomous Credit Decisioning Network
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.7rem', color: '#71717a', textTransform: 'uppercase' }}>Consensus Confidence</span>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f4f4f5' }}>
                          {(decision.confidence * 100).toFixed(0)}%
                        </div>
                      </div>
                      {decision.interestRate && (
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.7rem', color: '#71717a', textTransform: 'uppercase' }}>Sanctioned APR</span>
                          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8' }}>
                            {decision.interestRate}%
                          </div>
                        </div>
                      )}
                      {decision.approvedAmount && (
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.7rem', color: '#71717a', textTransform: 'uppercase' }}>Approved Limit</span>
                          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4ade80' }}>
                            ₹{decision.approvedAmount.toLocaleString('en-IN')}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Human-Supervised Audit Record */}
                  {decision?.humanReview && (
                    <div style={{
                      background: 'rgba(56, 189, 248, 0.08)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      borderRadius: '10px',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span>🛡️</span> Human-in-the-Loop Supervisory Verdict
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {new Date(decision.humanReview.reviewedAt).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#f4f4f5' }}>
                        Supervising Underwriter: <strong>{decision.humanReview.reviewer}</strong> · Verdict: <strong style={{ color: decision.humanReview.verdict === 'APPROVED' ? '#4ade80' : '#f87171' }}>{decision.humanReview.verdict}</strong>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#cbd5e1', fontStyle: 'italic', background: 'rgba(0,0,0,0.3)', padding: '0.6rem 0.85rem', borderRadius: '6px', lineHeight: 1.4 }}>
                        "{decision.humanReview.notes}"
                      </div>
                    </div>
                  )}

                  {/* Reasons & Rationale */}
                  <div style={{
                    background: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: '10px',
                    padding: '1.25rem'
                  }}>
                    <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', fontWeight: 700, color: '#f4f4f5' }}>
                      Decision Reasons & Adverse Action Narrative
                    </h3>
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#d4d4d8', fontSize: '0.85rem', lineHeight: 1.6 }}>
                      {decision.reasons.map((r, i) => (
                        <li key={i} style={{ marginBottom: '0.35rem' }}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <div style={{ padding: '3rem', textAlign: 'center', background: '#18181b', borderRadius: '10px', border: '1px dashed #27272a' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
                  <h3 style={{ margin: 0, color: '#f4f4f5' }}>Decision Pending</h3>
                  <p style={{ color: '#71717a', fontSize: '0.85rem' }}>The application is currently streaming through active agents.</p>
                </div>
              )}

              {/* Shared Blackboard Output Signals */}
              {sharedState && Object.keys(sharedState).length > 0 && (
                <div style={{
                  background: '#18181b',
                  border: '1px solid #27272a',
                  borderRadius: '10px',
                  padding: '1.25rem'
                }}>
                  <h3 style={{ margin: '0 0 0.85rem 0', fontSize: '0.95rem', fontWeight: 700, color: '#A78BFA' }}>
                    ⚡ Synchronized Signals in G-Memory Blackboard
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem' }}>
                    {Object.entries(sharedState).map(([k, v]: any) => {
                      if (!k.endsWith('_output')) return null;
                      const agentName = k.replace('_output', '');
                      return (
                        <div key={k} style={{
                          background: '#121214',
                          border: '1px solid #27272a',
                          borderRadius: '8px',
                          padding: '0.75rem'
                        }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#60A5FA', marginBottom: '0.4rem' }}>
                            {agentName} Agent
                          </div>
                          <pre style={{ fontSize: '0.72rem', color: '#a1a1aa', margin: 0, whiteSpace: 'pre-wrap', maxHeight: '100px', overflowY: 'auto' }}>
                            {JSON.stringify(v, null, 2)}
                          </pre>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MAS Agent Trajectory */}
          {activeTab === 'trajectory' && (
            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1.25rem', height: '100%' }}>
              
              {/* Left Column: Agent Selector List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderRight: '1px solid #27272a', paddingRight: '1rem' }}>
                <span style={{ fontSize: '0.7rem', color: '#71717a', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.25rem' }}>
                  Pipeline Stages ({agents.length})
                </span>
                {agents.map(a => {
                  const isSelected = a.name === selectedAgentName;
                  const isDone = a.status === 'COMPLETED';
                  const isSkip = a.status === 'SKIPPED';
                  const isRun = a.status === 'ACTIVE';

                  return (
                    <button
                      key={a.name}
                      onClick={() => setSelectedAgentName(a.name)}
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: '8px',
                        background: isSelected ? '#27272a' : '#18181b',
                        border: isSelected ? '1px solid #3b82f6' : '1px solid #27272a',
                        color: isSelected ? '#fff' : '#a1a1aa',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>{a.name} Agent</div>
                        <div style={{ fontSize: '0.68rem', color: '#71717a' }}>
                          {isDone ? `${(a.elapsedMs / 1000).toFixed(2)}s` : isSkip ? 'Skipped' : 'Pending'}
                        </div>
                      </div>

                      <span style={{
                        fontSize: '0.7rem',
                        padding: '0.15rem 0.4rem',
                        borderRadius: '4px',
                        background: isDone ? 'rgba(34,197,94,0.15)' : isRun ? 'rgba(59,130,246,0.2)' : isSkip ? 'rgba(255,255,255,0.05)' : 'transparent',
                        color: isDone ? '#4ade80' : isRun ? '#60A5FA' : '#71717a'
                      }}>
                        {isDone ? 'DONE' : isRun ? 'RUNNING' : isSkip ? 'SKIP' : 'QUEUED'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Right Column: Selected Agent Deep Trace */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
                {selectedAgent ? (
                  <>
                    <div style={{
                      background: '#18181b',
                      border: '1px solid #27272a',
                      borderRadius: '8px',
                      padding: '1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1rem', color: '#f4f4f5' }}>{selectedAgent.name} Agent Execution Trace</h4>
                        <span style={{ fontSize: '0.75rem', color: '#71717a' }}>Status: {selectedAgent.status} · Duration: {(selectedAgent.elapsedMs / 1000).toFixed(2)}s</span>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.12)', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.25)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span>🔒</span> Isolated Scratchpad · Zero-Cache
                      </span>
                    </div>

                    {/* Output Log */}
                    <div style={{
                      background: '#09090b',
                      border: '1px solid #27272a',
                      borderRadius: '8px',
                      padding: '1rem'
                    }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#71717a', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                        Step Output Logs
                      </div>
                      {selectedAgent.output && selectedAgent.output.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem' }}>
                          {selectedAgent.output.map((line, i) => (
                            <div key={i} style={{ color: '#d4d4d8', background: '#121214', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>
                              {line}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#71717a', fontSize: '0.8rem' }}>No direct logs generated by this node.</span>
                      )}
                    </div>
                  </>
                ) : (
                  <span style={{ color: '#71717a' }}>Select an agent to inspect its trace.</span>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: Borrower Profile */}
          {activeTab === 'borrower' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.75rem'
              }}>
                <div className="input-data-chip" style={{ padding: '0.75rem' }}>
                  <span className="input-data-label">Full Legal Name</span>
                  <span className="input-data-val">{app.fullName}</span>
                </div>
                <div className="input-data-chip" style={{ padding: '0.75rem' }}>
                  <span className="input-data-label">Date of Birth</span>
                  <span className="input-data-val">{app.dateOfBirth}</span>
                </div>
                <div className="input-data-chip" style={{ padding: '0.75rem' }}>
                  <span className="input-data-label">Monthly Income</span>
                  <span className="input-data-val">₹{app.monthlyIncome.toLocaleString('en-IN')}</span>
                </div>
                <div className="input-data-chip" style={{ padding: '0.75rem' }}>
                  <span className="input-data-label">Requested Loan</span>
                  <span className="input-data-val">₹{app.requestedAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="input-data-chip" style={{ padding: '0.75rem' }}>
                  <span className="input-data-label">Tenure</span>
                  <span className="input-data-val">{app.requestedTenureMonths} Months</span>
                </div>
                <div className="input-data-chip" style={{ padding: '0.75rem' }}>
                  <span className="input-data-label">Employment Type</span>
                  <span className="input-data-val">{app.employmentType} ({app.employerName})</span>
                </div>
                <div className="input-data-chip" style={{ padding: '0.75rem' }}>
                  <span className="input-data-label">Existing EMIs</span>
                  <span className="input-data-val">₹{app.existingEMIs.toLocaleString('en-IN')}/mo</span>
                </div>
                <div className="input-data-chip" style={{ padding: '0.75rem' }}>
                  <span className="input-data-label">Credit Card Outstanding</span>
                  <span className="input-data-val">₹{app.creditCardOutstanding.toLocaleString('en-IN')}</span>
                </div>
                <div className="input-data-chip" style={{ padding: '0.75rem' }}>
                  <span className="input-data-label">Cheque Bounces (12M)</span>
                  <span className="input-data-val" style={{ color: app.numberOfBounces > 0 ? '#ef4444' : '#10B981' }}>
                    {app.numberOfBounces}
                  </span>
                </div>
                <div className="input-data-chip" style={{ padding: '0.75rem' }}>
                  <span className="input-data-label">Residential Status</span>
                  <span className="input-data-val">{app.residentialStatus} ({app.cityTier})</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Dynamic Routing & G-Memory */}
          {activeTab === 'routing' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {routing && (
                <div style={{
                  background: '#18181b',
                  border: '1px solid #27272a',
                  borderRadius: '10px',
                  padding: '1.25rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: '#f4f4f5' }}>🔀 Dynamic Routing Decision</h3>
                    <RiskBadge risk={routing.riskLevel} size="sm" />
                  </div>
                  <p style={{ color: '#d4d4d8', fontSize: '0.85rem', margin: '0 0 0.75rem 0' }}>{routing.reason}</p>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {routing.selectedPath.map(p => (
                      <span key={p} style={{ padding: '0.25rem 0.5rem', background: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                        ✓ {p}
                      </span>
                    ))}
                    {routing.skippedAgents.map(p => (
                      <span key={p} style={{ padding: '0.25rem 0.5rem', background: 'rgba(255, 255, 255, 0.05)', color: '#71717a', borderRadius: '4px', fontSize: '0.75rem' }}>
                        ⚡ {p} (Skipped)
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Similar Cases */}
              <div style={{
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '10px',
                padding: '1.25rem'
              }}>
                <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', color: '#A78BFA' }}>
                  🧠 G-Memory Historical Precedents ({similarCases.length})
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem' }}>
                  {similarCases.map((c: any, i: number) => (
                    <div key={i} style={{ background: '#121214', border: '1px solid #27272a', borderRadius: '6px', padding: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700 }}>
                        <span>{c.appId}</span>
                        <span style={{ color: c.outcome === 'REPAID' ? '#10B981' : '#ef4444' }}>{c.outcome}</span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#a1a1aa', marginTop: '0.35rem' }}>
                        Income: ₹{c.income?.toLocaleString()} · Loan: ₹{c.amount?.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                {insights.length > 0 && (
                  <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#A78BFA', fontWeight: 700 }}>Distilled System Insights:</div>
                    {insights.map((ins: string, idx: number) => (
                      <div key={idx} style={{ fontSize: '0.72rem', color: '#cbd5e1', background: '#121214', padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid #27272a' }}>
                        💡 {ins}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: Isolated Scratchpad & Tags */}
          {activeTab === 'scratchpad' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Security Isolation Banner */}
              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '10px',
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <div style={{ fontSize: '2.2rem' }}>🔒</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: '#34d399', fontWeight: 800 }}>
                    Strict Per-Customer Scratchpad & Zero Prompt-Caching Isolation
                  </h3>
                  <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.82rem', color: '#a1a1aa', lineHeight: 1.4 }}>
                    Every intake record is queued with unique indexing and granted an isolated in-memory scratchpad. Prompt caching across different customer records is disabled to prevent cross-contamination and guarantee zero customer PII leakage.
                  </p>
                </div>
              </div>

              {/* Record Metadata Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', padding: '1rem' }}>
                  <div style={{ fontSize: '0.7rem', color: '#71717a', textTransform: 'uppercase', fontWeight: 700 }}>Queue Sequence Number</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#60A5FA', marginTop: '0.25rem' }}>{request.queueNumber || 'Q#0001'}</div>
                  <div style={{ fontSize: '0.68rem', color: '#a1a1aa', marginTop: '0.2rem' }}>FIFO Intake Queuing</div>
                </div>

                <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', padding: '1rem' }}>
                  <div style={{ fontSize: '0.7rem', color: '#71717a', textTransform: 'uppercase', fontWeight: 700 }}>Customer Record Tag</div>
                  <div style={{ fontSize: '0.95rem', fontFamily: 'monospace', fontWeight: 800, color: '#f4f4f5', marginTop: '0.35rem' }}>{request.recordTag || `TAG-${request.id}`}</div>
                  <div style={{ fontSize: '0.68rem', color: '#a1a1aa', marginTop: '0.2rem' }}>Cryptographic Session ID</div>
                </div>

                <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', padding: '1rem' }}>
                  <div style={{ fontSize: '0.7rem', color: '#71717a', textTransform: 'uppercase', fontWeight: 700 }}>Isolated Scratchpad ID</div>
                  <div style={{ fontSize: '0.95rem', fontFamily: 'monospace', fontWeight: 800, color: '#34d399', marginTop: '0.35rem' }}>{request.scratchpad?.id || `SP-${request.id}`}</div>
                  <div style={{ fontSize: '0.68rem', color: '#a1a1aa', marginTop: '0.2rem' }}>Zero-Cache Sandboxed</div>
                </div>

                <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', padding: '1rem' }}>
                  <div style={{ fontSize: '0.7rem', color: '#71717a', textTransform: 'uppercase', fontWeight: 700 }}>Intake Queue Priority</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: request.priority === 'VIP' ? '#facc15' : '#c084fc', marginTop: '0.25rem' }}>{request.priority || 'STANDARD'}</div>
                  <div style={{ fontSize: '0.68rem', color: '#a1a1aa', marginTop: '0.2rem' }}>Worker Dispatch Tier</div>
                </div>
              </div>

              {/* Tags Section */}
              <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '10px', padding: '1.25rem' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#f4f4f5' }}>🏷️ Record Tags & Classification Labels</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {(request.tags || [request.queueNumber || 'Q#0001', app.employmentType, app.cityTier, 'Zero-Cache Isolated']).map((t: string, i: number) => (
                    <span key={i} style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.65rem', borderRadius: '6px', background: '#27272a', color: '#cbd5e1', border: '1px solid #3f3f46' }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Working Notes in Scratchpad */}
              <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '10px', padding: '1.25rem' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#f4f4f5' }}>📝 Agent Scratchpad Working Logs</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {agents.map(a => (
                    <div key={a.name} style={{ background: '#121214', border: '1px solid #27272a', borderRadius: '6px', padding: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontSize: '0.8rem' }}>🔒</span>
                          <strong style={{ color: '#60A5FA', fontSize: '0.85rem' }}>{a.name} Agent</strong>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: '#10b981' }}>Isolated Scratchpad: {request.scratchpad?.id || `SP-${request.id}`}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#d4d4d8', fontFamily: 'JetBrains Mono, monospace' }}>
                        {a.output && a.output.length > 0 ? a.output.slice(-2).join(' · ') : 'Awaiting execution on isolated scratchpad.'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Raw JSON */}
          {activeTab === 'raw' && (
            <pre style={{
              background: '#09090b',
              border: '1px solid #27272a',
              borderRadius: '8px',
              padding: '1.25rem',
              fontSize: '0.75rem',
              color: '#d4d4d8',
              overflowX: 'auto',
              margin: 0
            }}>
              {JSON.stringify(request, null, 2)}
            </pre>
          )}

        </div>

        {/* ── Modal Footer ── */}
        <div style={{
          padding: '0.85rem 1.75rem',
          borderTop: '1px solid #27272a',
          background: '#121214',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center'
        }}>
          <button
            onClick={onClose}
            style={{
              background: '#27272a',
              color: '#f4f4f5',
              border: 'none',
              padding: '0.5rem 1.25rem',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Close Dossier
          </button>
        </div>

      </div>
    </div>
  );
};
