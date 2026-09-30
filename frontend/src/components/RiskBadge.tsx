import React from 'react';
import type { RiskLevel } from '../types';

/* ── Triple-encoded risk badge: color + shape + text ────────────── */

const RISK_CONFIG: Record<RiskLevel, { color: string; bg: string; border: string; icon: string }> = {
  LOW:    { color: '#10B981', bg: 'rgba(16,185,129,0.15)',  border: 'rgba(16,185,129,0.3)',  icon: '●' },
  MEDIUM: { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', icon: '▲' },
  HIGH:   { color: '#EF4444', bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.3)',  icon: '◆' },
};

interface Props {
  risk: RiskLevel;
  size?: 'sm' | 'md';
}

export const RiskBadge: React.FC<Props> = ({ risk, size = 'md' }) => {
  const cfg = RISK_CONFIG[risk];
  const fontSize = size === 'sm' ? '0.7rem' : '0.8rem';
  const padding  = size === 'sm' ? '0.15rem 0.5rem' : '0.25rem 0.65rem';

  return (
    <span
      role="status"
      aria-label={`Risk level: ${risk}`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
        padding, borderRadius: '9999px', fontWeight: 600, fontSize,
        background: cfg.bg, color: cfg.color,
        border: `1px solid ${cfg.border}`,
        lineHeight: 1,
      }}
    >
      <span aria-hidden="true">{cfg.icon}</span>
      {risk}
    </span>
  );
};
