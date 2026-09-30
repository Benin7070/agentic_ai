import React, { useState } from 'react';
import { useSimulation } from '../contexts/SimulationContext';
import { RiskBadge } from './RiskBadge';

export const QueuePanel: React.FC = () => {
  const { requests, isRunning, toggleSimulation, selectRequest, selectedId } = useSimulation();
  const [searchTerm, setSearchTerm] = useState<string>('');

  const queued    = requests.filter(r => r.status === 'QUEUED');
  const active    = requests.filter(r => r.status === 'PROCESSING');
  const review    = requests.filter(r => r.status === 'MANUAL_REVIEW');
  const completed = requests.filter(r => r.status === 'COMPLETED').slice(-30).reverse();

  const approvedCount   = completed.filter(r => r.decision?.type === 'APPROVED').length;
  const rejectedCount   = completed.filter(r => r.decision?.type === 'REJECTED').length;
  const supervisedCount = completed.filter(r => r.decision?.humanOverride).length;

  const filterList = (list: typeof requests) => {
    if (!searchTerm.trim()) return list;
    const q = searchTerm.toLowerCase();
    return list.filter(r => 
      r.id.toLowerCase().includes(q) || 
      r.app.fullName.toLowerCase().includes(q) ||
      r.app.loanPurpose.toLowerCase().includes(q)
    );
  };

  const filteredQueued = filterList(queued);
  const filteredActive = filterList(active);
  const filteredReview = filterList(review);
  const filteredCompleted = filterList(completed);

  const formatAmount = (amt: number) => {
    if (!amt) return '₹0';
    if (amt >= 100000) return `₹${(amt / 100000).toFixed(1)}L`;
    return `₹${(amt / 1000).toFixed(0)}k`;
  };

  const getPhaseProgress = (req: any) => {
    if (req.status === 'COMPLETED') return 100;
    if (req.currentAgentIndex >= 0) {
      return Math.round(((req.currentAgentIndex + 1) / (req.agents?.length || 7)) * 100);
    }
    return 15;
  };

  return (
    <section className="glass-panel queue-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '0.85rem' }}>
      
      {/* ── Kanban Board Header ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '0.65rem',
        borderBottom: '1px solid #27272a',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: '#18181b',
            border: '1px solid #27272a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.85rem'
          }}>
            📊
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#f4f4f5', letterSpacing: '-0.01em' }}>
                Loan Intake Kanban
              </h2>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '0.15rem 0.45rem',
                borderRadius: '9999px',
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#60A5FA'
              }}>
                {requests.length} Total
              </span>
            </div>
          </div>
        </div>

        {/* Search & Simulation Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="text"
            placeholder="Search Kanban..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              background: '#121214',
              border: '1px solid #27272a',
              borderRadius: '6px',
              padding: '0.25rem 0.55rem',
              fontSize: '0.72rem',
              color: '#f4f4f5',
              width: '120px',
              outline: 'none'
            }}
          />

          <button
            className={`sim-btn ${isRunning ? 'sim-btn--pause' : 'sim-btn--start'}`}
            onClick={toggleSimulation}
            style={{ padding: '0.3rem 0.75rem', fontSize: '0.72rem', borderRadius: '6px', fontWeight: 700 }}
          >
            {isRunning ? '⏸ Pause' : '▶ Start'}
          </button>
        </div>
      </div>

      {/* ── Kanban Columns Grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '0.65rem',
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
        paddingTop: '0.65rem'
      }}>
        
        {/* ════════════════════════════════════════════════════
            COLUMN 1: QUEUED (Staging & Ingestion)
           ════════════════════════════════════════════════════ */}
        <div style={{
          background: '#0d0d0f',
          border: '1px solid #27272a',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Column Header */}
          <div style={{
            padding: '0.45rem 0.65rem',
            background: '#121214',
            borderBottom: '1px solid #27272a',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.8rem' }}>📥</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f4f4f5' }}>Queued</span>
              <span style={{
                fontSize: '0.62rem',
                fontWeight: 700,
                padding: '0.1rem 0.35rem',
                borderRadius: '4px',
                background: '#27272a',
                color: '#a1a1aa'
              }}>
                {queued.length}
              </span>
            </div>
            <span style={{ fontSize: '0.62rem', color: '#71717a' }}>Awaiting Worker</span>
          </div>

          {/* Cards Container */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.45rem'
          }}>
            {filteredQueued.length > 0 ? (
              filteredQueued.map(r => {
                const isSelected = selectedId === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => selectRequest(r.id)}
                    style={{
                      background: isSelected ? '#1e293b' : '#18181b',
                      border: isSelected ? '1.5px solid #3b82f6' : '1px solid #27272a',
                      borderRadius: '6px',
                      padding: '0.55rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 0 10px rgba(59, 130, 246, 0.25)' : 'none'
                    }}
                  >
                    {/* Top Row: Queue #, ID & Record Tag */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.3rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {r.queueNumber && (
                          <span style={{ fontSize: '0.6rem', fontWeight: 800, padding: '0.1rem 0.35rem', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                            {r.queueNumber}
                          </span>
                        )}
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f4f4f5' }}>
                          {r.id}
                        </span>
                      </div>
                      {r.recordTag ? (
                        <span style={{ fontSize: '0.58rem', fontFamily: 'monospace', color: '#94a3b8', background: '#27272a', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>
                          {r.recordTag}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.65rem', color: '#71717a' }}>
                          ⏳ Staged
                        </span>
                      )}
                    </div>

                    {/* Applicant & Amount */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#f4f4f5' }}>
                        {r.app.fullName}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#e4e4e7' }}>
                        {formatAmount(r.app.requestedAmount)}
                      </span>
                    </div>

                    {/* Tags row */}
                    {r.tags && r.tags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                        {r.tags.slice(1, 4).map((t, idx) => (
                          <span key={idx} style={{ fontSize: '0.55rem', padding: '0.05rem 0.3rem', borderRadius: '3px', background: '#222226', color: '#a1a1aa', border: '1px solid #2e2e33' }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer / Isolation & Risk */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.25rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ fontSize: '0.62rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <span>🔒</span> Isolated
                      </span>
                      {r.routing && <RiskBadge risk={r.routing.riskLevel} size="sm" />}
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#71717a', fontSize: '0.72rem' }}>
                No queued loans
              </div>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════
            COLUMN 2: PROCESSING (MAS DAG Evaluation)
           ════════════════════════════════════════════════════ */}
        <div style={{
          background: '#0d0d0f',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Column Header */}
          <div style={{
            padding: '0.45rem 0.65rem',
            background: 'rgba(16, 185, 129, 0.08)',
            borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.8rem' }}>⚡</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34D399' }}>Processing</span>
              <span style={{
                fontSize: '0.62rem',
                fontWeight: 700,
                padding: '0.1rem 0.35rem',
                borderRadius: '4px',
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#34D399'
              }}>
                {active.length}
              </span>
            </div>
            <span style={{
              fontSize: '0.62rem',
              color: '#34D399',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontWeight: 600
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981', animation: 'pulseActiveBorder 1s infinite' }} />
              Live Workers
            </span>
          </div>

          {/* Cards Container */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.45rem'
          }}>
            {filteredActive.length > 0 ? (
              filteredActive.map(r => {
                const isSelected = selectedId === r.id;
                const activeAgent = r.currentAgentIndex >= 0 ? r.agents[r.currentAgentIndex]?.name : 'Pipeline';
                const progressPct = getPhaseProgress(r);

                return (
                  <div
                    key={r.id}
                    onClick={() => selectRequest(r.id)}
                    style={{
                      background: isSelected ? '#1e293b' : '#18181b',
                      border: isSelected ? '1.5px solid #3b82f6' : '1px solid #10b981',
                      borderRadius: '6px',
                      padding: '0.55rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 0 12px rgba(16, 185, 129, 0.2)'
                    }}
                  >
                    {/* Top Row: Queue #, ID & Record Tag */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.3rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {r.queueNumber && (
                          <span style={{ fontSize: '0.6rem', fontWeight: 800, padding: '0.1rem 0.35rem', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.2)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
                            {r.queueNumber}
                          </span>
                        )}
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#34D399' }}>
                          {r.id}
                        </span>
                      </div>
                      {r.recordTag ? (
                        <span style={{ fontSize: '0.58rem', fontFamily: 'monospace', color: '#6ee7b7', background: 'rgba(16, 185, 129, 0.1)', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>
                          {r.recordTag}
                        </span>
                      ) : (
                        <span style={{
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          padding: '0.1rem 0.35rem',
                          borderRadius: '4px',
                          background: 'rgba(16, 185, 129, 0.2)',
                          color: '#34D399'
                        }}>
                          RUNNING
                        </span>
                      )}
                    </div>

                    {/* Applicant & Amount */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#f4f4f5' }}>
                        {r.app.fullName}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#e4e4e7' }}>
                        {formatAmount(r.app.requestedAmount)}
                      </span>
                    </div>

                    {/* Scratchpad Isolation Callout */}
                    {r.scratchpad && (
                      <div style={{ fontSize: '0.6rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span>🔒</span>
                        <span>Scratchpad: {r.scratchpad.id} (Zero-Cache)</span>
                      </div>
                    )}

                    {/* Active Agent Step Callout */}
                    <div style={{
                      background: '#121214',
                      border: '1px solid #27272a',
                      borderRadius: '4px',
                      padding: '0.25rem 0.45rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      fontSize: '0.7rem',
                      color: '#60A5FA',
                      fontWeight: 600
                    }}>
                      <span>➜</span>
                      <span>{activeAgent} Agent</span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ height: '3px', background: '#27272a', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${progressPct}%`, height: '100%', background: '#10B981', transition: 'width 0.3s ease' }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#71717a', fontSize: '0.72rem' }}>
                Workers idle · Start simulation to ingest
              </div>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════
            COLUMN 3: HUMAN REVIEW (HITL Referrals)
           ════════════════════════════════════════════════════ */}
        <div style={{
          background: '#0d0d0f',
          border: review.length > 0 ? '1px solid rgba(245, 158, 11, 0.45)' : '1px solid #27272a',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Column Header */}
          <div style={{
            padding: '0.45rem 0.65rem',
            background: review.length > 0 ? 'rgba(245, 158, 11, 0.12)' : '#121214',
            borderBottom: review.length > 0 ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #27272a',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.8rem' }}>⚖️</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: review.length > 0 ? '#FBBF24' : '#f4f4f5' }}>
                Human Review
              </span>
              <span style={{
                fontSize: '0.62rem',
                fontWeight: 800,
                padding: '0.1rem 0.35rem',
                borderRadius: '4px',
                background: review.length > 0 ? '#f59e0b' : '#27272a',
                color: review.length > 0 ? '#09090b' : '#a1a1aa'
              }}>
                {review.length}
              </span>
            </div>
            <span style={{ fontSize: '0.62rem', color: review.length > 0 ? '#FBBF24' : '#71717a', fontWeight: 600 }}>
              {review.length > 0 ? '⚠️ Action Required' : 'Desk Clear'}
            </span>
          </div>

          {/* Cards Container */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.45rem'
          }}>
            {filteredReview.length > 0 ? (
              filteredReview.map(r => {
                const isSelected = selectedId === r.id;
                const topReason = r.decision?.reasons?.[0] || 'Referred for senior underwriter assessment';

                return (
                  <div
                    key={r.id}
                    onClick={() => selectRequest(r.id)}
                    style={{
                      background: isSelected ? '#292110' : '#18150f',
                      border: isSelected ? '1.5px solid #f59e0b' : '1px solid rgba(245, 158, 11, 0.35)',
                      borderLeft: '3px solid #f59e0b',
                      borderRadius: '6px',
                      padding: '0.55rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 0 12px rgba(245, 158, 11, 0.3)' : 'none'
                    }}
                  >
                    {/* Top Row: Queue #, ID & Referral Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.3rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {r.queueNumber && (
                          <span style={{ fontSize: '0.6rem', fontWeight: 800, padding: '0.1rem 0.35rem', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#FBBF24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                            {r.queueNumber}
                          </span>
                        )}
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#FBBF24' }}>
                          {r.id}
                        </span>
                      </div>
                      <span style={{
                        fontSize: '0.58rem',
                        fontWeight: 800,
                        padding: '0.1rem 0.35rem',
                        borderRadius: '3px',
                        background: 'rgba(245, 158, 11, 0.2)',
                        color: '#FBBF24',
                        border: '1px solid rgba(245, 158, 11, 0.4)'
                      }}>
                        HITL REFERRAL
                      </span>
                    </div>

                    {/* Applicant & Amount */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#f4f4f5' }}>
                        {r.app.fullName}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FBBF24' }}>
                        {formatAmount(r.app.requestedAmount)}
                      </span>
                    </div>

                    {/* Trigger reason summary */}
                    <div style={{
                      fontSize: '0.62rem',
                      color: '#d4d4d8',
                      background: 'rgba(0,0,0,0.3)',
                      padding: '0.2rem 0.4rem',
                      borderRadius: '4px',
                      border: '1px solid rgba(255,255,255,0.06)',
                      lineHeight: 1.3
                    }}>
                      ⚡ {topReason}
                    </div>

                    {/* Action Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.2rem', borderTop: '1px solid rgba(245, 158, 11, 0.15)', fontSize: '0.62rem' }}>
                      <span style={{ color: '#a1a1aa' }}>
                        👤 Needs Sign-off
                      </span>
                      <button
                        style={{
                          background: '#f59e0b',
                          color: '#09090b',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '0.18rem 0.5rem',
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          selectRequest(r.id);
                        }}
                      >
                        Review ➜
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#71717a', fontSize: '0.72rem' }}>
                All high-risk cases resolved · No pending referrals
              </div>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════
            COLUMN 4: DECIDED / COMPLETED
           ════════════════════════════════════════════════════ */}
        <div style={{
          background: '#0d0d0f',
          border: '1px solid #27272a',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Column Header */}
          <div style={{
            padding: '0.45rem 0.65rem',
            background: '#121214',
            borderBottom: '1px solid #27272a',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.8rem' }}>🏁</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f4f4f5' }}>Decided</span>
              <span style={{
                fontSize: '0.62rem',
                fontWeight: 700,
                padding: '0.1rem 0.35rem',
                borderRadius: '4px',
                background: '#27272a',
                color: '#a1a1aa'
              }}>
                {completed.length}
              </span>
            </div>
            <span style={{ fontSize: '0.62rem', color: '#a1a1aa' }}>
              <span style={{ color: '#4ade80' }}>{approvedCount} Appr</span> · <span style={{ color: '#f87171' }}>{rejectedCount} Rej</span>
              {supervisedCount > 0 && <span style={{ color: '#38bdf8' }}> · {supervisedCount} 👤</span>}
            </span>
          </div>

          {/* Cards Container */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.45rem'
          }}>
            {filteredCompleted.length > 0 ? (
              filteredCompleted.map(r => {
                const isSelected = selectedId === r.id;
                const dec = r.decision;
                const isAppr = dec?.type === 'APPROVED';
                const isRej = dec?.type === 'REJECTED';
                const isSupervised = dec?.humanOverride || !!dec?.humanReview;
                const duration = ((r.completedAt || 0) - (r.startedAt || 0)) / 1000;

                const borderAccent = isAppr ? '#22c55e' : (isRej ? '#ef4444' : '#eab308');

                return (
                  <div
                    key={r.id}
                    onClick={() => selectRequest(r.id)}
                    style={{
                      background: isSelected ? '#1e293b' : '#18181b',
                      border: isSelected ? '1.5px solid #3b82f6' : '1px solid #27272a',
                      borderLeft: `3px solid ${borderAccent}`,
                      borderRadius: '6px',
                      padding: '0.55rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 0 10px rgba(59, 130, 246, 0.25)' : 'none'
                    }}
                  >
                    {/* Top Row: Queue #, ID & Verdict */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.3rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {r.queueNumber && (
                          <span style={{ fontSize: '0.58rem', fontWeight: 700, padding: '0.08rem 0.3rem', borderRadius: '4px', background: '#27272a', color: '#a1a1aa' }}>
                            {r.queueNumber}
                          </span>
                        )}
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f4f4f5' }}>
                          {r.id}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {isSupervised && (
                          <span style={{
                            fontSize: '0.55rem',
                            fontWeight: 800,
                            padding: '0.08rem 0.3rem',
                            borderRadius: '3px',
                            background: 'rgba(56, 189, 248, 0.15)',
                            color: '#38bdf8',
                            border: '1px solid rgba(56, 189, 248, 0.3)'
                          }}>
                            👤 SUPERVISED
                          </span>
                        )}
                        <span style={{
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                          background: isAppr ? 'rgba(34, 197, 94, 0.15)' : (isRej ? 'rgba(239, 68, 68, 0.15)' : 'rgba(234, 179, 8, 0.15)'),
                          color: isAppr ? '#4ade80' : (isRej ? '#f87171' : '#facc15')
                        }}>
                          {isAppr ? 'APPROVED' : (isRej ? 'REJECTED' : 'REVIEW')}
                        </span>
                      </div>
                    </div>

                    {/* Applicant & Amount */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#e4e4e7' }}>
                        {r.app.fullName}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isAppr ? '#4ade80' : '#d4d4d8' }}>
                        {formatAmount(r.app.requestedAmount)}
                      </span>
                    </div>

                    {/* Bottom Row / Stats */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.2rem', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: '0.65rem', color: '#71717a' }}>
                      <span>⏱ {duration > 0 ? `${duration.toFixed(1)}s` : '1.2s'}</span>
                      {dec?.interestRate && <span style={{ color: '#38bdf8' }}>{dec.interestRate}% APR</span>}
                      {r.routing && <RiskBadge risk={r.routing.riskLevel} size="sm" />}
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#71717a', fontSize: '0.72rem' }}>
                No completed decisions yet
              </div>
            )}
          </div>
        </div>

      </div>

    </section>
  );
};
