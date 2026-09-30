import React from 'react';
import { useSimulation } from '../contexts/SimulationContext';

export const SimulationControls: React.FC = () => {
  const { stats, rate, setRate, riskDist, setRiskDist, clearCompleted, generateOne } = useSimulation();

  return (
    <section className="glass-panel sim-controls">
      {/* Rate control */}
      <div className="sim-control-group">
        <label className="sim-label">Rate: {rate} apps/min</label>
        <input
          type="range" min={1} max={60} value={rate}
          onChange={e => setRate(Number(e.target.value))}
          className="sim-slider"
        />
      </div>

      {/* Distribution presets */}
      <div className="sim-control-group">
        <label className="sim-label">
          Risk: {riskDist.low}% L · {riskDist.medium}% M · {riskDist.high}% H
        </label>
        <div className="sim-presets">
          <button
            className={`sim-preset ${riskDist.low === 80 && riskDist.high === 5 ? 'sim-preset--active' : ''}`}
            onClick={() => setRiskDist({ low: 80, medium: 15, high: 5 })}
            title="Safe mode: High approval rate, low debt burdens, zero bounces"
          >
            Safe
          </button>
          <button
            className={`sim-preset ${riskDist.low === 60 && riskDist.high === 10 ? 'sim-preset--active' : ''}`}
            onClick={() => setRiskDist({ low: 60, medium: 30, high: 10 })}
            title="Normal mode: Balanced distribution of loan applications"
          >
            Normal
          </button>
          <button
            className={`sim-preset ${riskDist.high >= 25 ? 'sim-preset--active sim-preset--risky' : ''}`}
            onClick={() => setRiskDist({ low: 20, medium: 40, high: 40 })}
            title="Risky mode: Generates borderline DTI, high exposure loans, and controlled returns to trigger Human-in-the-Loop (HITL) manual reviews"
          >
            🔥 Risky (HITL)
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="sim-stats">
        <div className="sim-stat">
          <span className="sim-stat-value">{stats.totalProcessed}</span>
          <span className="sim-stat-label">Processed</span>
        </div>
        <div className="sim-stat">
          <span className="sim-stat-value sim-stat--approved">{stats.approved}</span>
          <span className="sim-stat-label">Approved</span>
        </div>
        <div className="sim-stat">
          <span className="sim-stat-value sim-stat--rejected">{stats.rejected}</span>
          <span className="sim-stat-label">Rejected</span>
        </div>
        <div className="sim-stat">
          <span className="sim-stat-value sim-stat--manual" style={{ position: 'relative' }}>
            {stats.manualReview}
            {stats.hitlPending > 0 && (
              <span style={{
                position: 'absolute',
                top: '-6px',
                right: '-12px',
                background: '#f59e0b',
                color: '#09090b',
                fontSize: '0.55rem',
                fontWeight: 800,
                borderRadius: '9999px',
                padding: '0.05rem 0.35rem',
                boxShadow: '0 0 8px rgba(245, 158, 11, 0.6)',
                animation: 'pulseActiveBorder 1.5s infinite'
              }}>
                {stats.hitlPending} HITL
              </span>
            )}
          </span>
          <span className="sim-stat-label">Review</span>
        </div>
        <div className="sim-stat">
          <span className="sim-stat-value">{stats.avgProcessingTime}s</span>
          <span className="sim-stat-label">Avg Time</span>
        </div>
        <div className="sim-stat">
          <span className="sim-stat-value" style={{ color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}>
            <span>🔒</span> 100%
          </span>
          <span className="sim-stat-label">Zero-Cache Iso</span>
        </div>
        <div className="sim-stat">
          <span className="sim-stat-value">{(stats.routeEfficiency * 100).toFixed(0)}%</span>
          <span className="sim-stat-label">Route Eff.</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
        <button className="sim-clear" onClick={generateOne} style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent)', borderColor: 'rgba(99, 102, 241, 0.3)' }}>
          + Simulate 1 Data
        </button>
        <button className="sim-clear" onClick={clearCompleted}>Clear Done</button>
      </div>
    </section>
  );
};
