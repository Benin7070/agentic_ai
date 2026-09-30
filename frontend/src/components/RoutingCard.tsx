import React from 'react';
import { useSimulation } from '../contexts/SimulationContext';
import { RiskBadge } from './RiskBadge';

export const RoutingCard: React.FC = () => {
  const { selectedRequest: req } = useSimulation();

  if (!req || !req.routing) {
    return (
      <section className="glass-panel innovation-card innovation-card--empty">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '1.2rem' }}>🔀</span>
          <h3 className="innovation-label" style={{ margin: 0 }}>Dynamic Graph Routing</h3>
        </div>
        <p className="innovation-placeholder">Select an application from the queue to view its dynamic routing decision and skipped path analysis.</p>
      </section>
    );
  }

  const { routing, app } = req;
  const emiRatio = (app.existingEMIs / Math.max(app.monthlyIncome, 1)) * 100;
  const isHighEmi = emiRatio > 45;

  return (
    <section className="glass-panel innovation-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.2rem' }}>🔀</span>
          <h3 className="innovation-label" style={{ margin: 0 }}>Dynamic Graph Routing</h3>
          <span className="innovation-tag">MAS DAG Engine</span>
        </div>

        <RiskBadge risk={routing.riskLevel} size="sm" />
      </div>

      {/* Risk Profile Meters */}
      <div style={{
        background: '#121214',
        border: '1px solid #27272a',
        borderRadius: '8px',
        padding: '0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        flexShrink: 0
      }}>
        {/* Overall Risk Meter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
            <span style={{ color: '#a1a1aa' }}>Overall Preliminary Risk</span>
            <span style={{
              fontWeight: 700,
              color: routing.riskLevel === 'LOW' ? '#4ade80' : routing.riskLevel === 'MEDIUM' ? '#facc15' : '#f87171'
            }}>
              {routing.riskLevel} RISK PROFILE
            </span>
          </div>
          <div style={{ height: '6px', background: '#27272a', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              width: routing.riskLevel === 'LOW' ? '28%' : routing.riskLevel === 'MEDIUM' ? '60%' : '90%',
              height: '100%',
              background: routing.riskLevel === 'LOW' ? '#22c55e' : routing.riskLevel === 'MEDIUM' ? '#eab308' : '#ef4444',
              borderRadius: '3px'
            }} />
          </div>
        </div>

        {/* EMI Burden Meter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
            <span style={{ color: '#a1a1aa' }}>Fixed Obligation to Income (FOIR/EMI)</span>
            <span style={{ fontWeight: 700, color: isHighEmi ? '#ef4444' : '#34D399' }}>
              {emiRatio.toFixed(0)}% Burden
            </span>
          </div>
          <div style={{ height: '6px', background: '#27272a', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              width: `${Math.min(emiRatio, 100)}%`,
              height: '100%',
              background: isHighEmi ? '#ef4444' : '#22c55e',
              borderRadius: '3px'
            }} />
          </div>
        </div>
      </div>

      {/* Selected vs Skipped Path Chips */}
      <div>
        <div style={{ fontSize: '0.72rem', color: '#71717a', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.4rem' }}>
          Autonomous Execution Path ({routing.selectedPath.length} Active / {routing.skippedAgents.length} Skipped):
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {routing.selectedPath.map(name => (
            <span
              key={name}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.2rem 0.55rem',
                borderRadius: '4px',
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#60A5FA',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}
            >
              ✓ {name}
            </span>
          ))}

          {routing.skippedAgents.map(name => (
            <span
              key={name}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.72rem',
                padding: '0.2rem 0.55rem',
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.04)',
                color: '#71717a',
                border: '1px dashed #3f3f46'
              }}
            >
              ⚡ {name} (Skipped)
            </span>
          ))}
        </div>
      </div>

      {/* Routing Rationale */}
      <div style={{
        background: '#121214',
        border: '1px solid #27272a',
        borderRadius: '8px',
        padding: '0.75rem'
      }}>
        <div style={{ fontSize: '0.7rem', color: '#a1a1aa', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
          Routing Strategy & Rationale:
        </div>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#d4d4d8', lineHeight: 1.4 }}>
          {routing.reason}
        </p>
      </div>

      {/* Telemetry Savings Footer */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        marginTop: 'auto',
        paddingTop: '0.5rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        fontSize: '0.75rem'
      }}>
        <span style={{ color: '#34D399', fontWeight: 600 }}>
          ⚡ {routing.skippedAgents.length} Agents Skipped
        </span>
        <span style={{ color: '#71717a' }}>·</span>
        <span style={{ color: '#60A5FA', fontWeight: 600 }}>
          ⏱ ~{routing.timeSaved.toFixed(1)}s Latency Saved
        </span>
        <span style={{ color: '#71717a' }}>·</span>
        <span style={{ color: '#C084FC', fontWeight: 600 }}>
          🪙 ~{(routing.skippedAgents.length * 350).toLocaleString()} Tokens Saved
        </span>
      </div>

    </section>
  );
};
