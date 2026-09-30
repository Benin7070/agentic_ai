import React from 'react';
import { useSimulation } from '../contexts/SimulationContext';

export const MemoryImpactPanel: React.FC = () => {
  const { selectedRequest: req } = useSimulation();

  if (!req) {
    return (
      <section className="glass-panel innovation-card innovation-card--empty">
        <h3 className="innovation-label">🧠 Memory Impact <span className="innovation-tag">Innovation #2</span></h3>
        <p className="innovation-placeholder">Select a request to see G-Memory influence.</p>
      </section>
    );
  }

  const { memoryMatches, decision } = req;
  
  // Handle Legacy Array format vs New G-Memory Dictionary format
  const isLegacyArray = Array.isArray(memoryMatches);
  const gMemory = !isLegacyArray ? (memoryMatches as any) : null;
  const similarCases = isLegacyArray ? memoryMatches : (gMemory?.similar_cases || []);
  const insights = gMemory?.insights || [];

  const repaidCount = similarCases.filter((m: any) => m.outcome === 'REPAID').length;
  const defaultedCount = similarCases.filter((m: any) => m.outcome === 'DEFAULTED').length;

  return (
    <section className="glass-panel innovation-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h3 className="innovation-label" style={{ margin: 0 }}>🧠 G-Memory Epistemic Impact</h3>
        <span className="innovation-tag">Three-Graph Engine</span>
      </div>

      <div className="memory-summary">
        <span>Retrieved <strong>{similarCases.length}</strong> vector cases</span>
        {similarCases.length > 0 && (
          <span className="memory-ratio">
            <span className="memory-repaid">{repaidCount} repaid</span>
            {' · '}
            <span className="memory-defaulted">{defaultedCount} defaulted</span>
          </span>
        )}
      </div>

      {similarCases.length > 0 && (
        <div className="memory-matches">
          {similarCases.map((m: any, i: number) => (
            <div
              key={i}
              className={`memory-match ${m.outcome === 'REPAID' ? 'memory-match--repaid' : 'memory-match--defaulted'}`}
            >
              <div className="memory-match-header">
                <strong>{m.appId}</strong>
                <span className="memory-outcome">
                  {m.outcome === 'REPAID' ? '✅' : '❌'} {m.outcome} ({m.months}mo)
                </span>
              </div>
              <div className="memory-match-details">
                Income: ₹{m.income?.toLocaleString('en-IN')} · ₹{m.amount?.toLocaleString('en-IN')} · {((m.similarity || 0.85) * 100).toFixed(0)}% match
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Outcome-Linked Heuristic */}
      {similarCases.length > 0 && (
        <div className="memory-influence">
          <div className="memory-influence-label">Precedent Outcome Analysis:</div>
          <p className="memory-influence-text">
            {defaultedCount > repaidCount
              ? `⚠ Elevated default rate observed (${((defaultedCount / similarCases.length) * 100).toFixed(0)}%). Recommending tighter limit and risk surcharge.`
              : `✓ High historical repayment rate (${((repaidCount / similarCases.length) * 100).toFixed(0)}%). Precedent data supports risk approval.`
            }
          </p>
        </div>
      )}

      {/* Distilled Insights from Graph 3 */}
      {insights.length > 0 && (
        <div className="memory-influence" style={{ marginTop: '0.75rem', background: 'rgba(167, 139, 250, 0.06)', border: '1px solid rgba(167, 139, 250, 0.25)', borderRadius: '6px', padding: '0.65rem 0.85rem' }}>
          <div className="memory-influence-label" style={{ color: '#C4B5FD', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>💡</span> Distilled Institutional Rules (Graph 3):
          </div>
          <ul className="memory-influence-text" style={{ paddingLeft: '1.1rem', marginTop: '0.4rem', fontSize: '0.75rem', color: '#E9D5FF' }}>
            {insights.map((insight: string, i: number) => (
              <li key={i} style={{ marginBottom: '0.25rem' }}>{insight}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Decision summary */}
      {decision && (
        <div className={`memory-decision memory-decision--${decision.type.toLowerCase().replace('_', '-')}`}>
          <div className="memory-decision-type">
            {decision.type === 'APPROVED' ? '✅ APPROVED' : decision.type === 'REJECTED' ? '❌ REJECTED' : '🟡 MANUAL REVIEW'}
          </div>
          <div className="memory-decision-confidence">
            Confidence: {(decision.confidence * 100).toFixed(0)}%
          </div>
          {decision.interestRate && (
            <div className="memory-decision-rate">Rate: {decision.interestRate}%</div>
          )}
          <ul className="memory-decision-reasons">
            {decision.reasons.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
      )}
    </section>
  );
};
