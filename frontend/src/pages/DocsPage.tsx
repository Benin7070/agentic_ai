import React from 'react';
import { ReadmeRenderer } from '../components/ReadmeRenderer';

export const DocsPage: React.FC = () => {
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#09090b',
      overflow: 'hidden',
      padding: '1.25rem 1.5rem 1.5rem 1.5rem'
    }}>
      {/* ── Page Header ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '1rem',
        borderBottom: '1px solid #27272a',
        marginBottom: '1rem',
        flexShrink: 0
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
            <span style={{ fontSize: '1.4rem' }}>📖</span>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: '#f4f4f5' }}>
              Architecture & System Specification
            </h1>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#93c5fd',
              border: '1px solid rgba(59, 130, 246, 0.3)'
            }}>
              Live README.md
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#71717a' }}>
            Authoritative documentation covering agent specifications, tool catalogs, G-Memory three-graph hierarchy, and scratchpad isolation.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <a
            href="http://localhost:8000/api/docs"
            target="_blank"
            rel="noreferrer"
            style={{
              padding: '0.45rem 0.85rem',
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '6px',
              color: '#a1a1aa',
              fontSize: '0.78rem',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => { (e.currentTarget.style.color = '#fff'); (e.currentTarget.style.borderColor = '#3f3f46'); }}
            onMouseLeave={e => { (e.currentTarget.style.color = '#a1a1aa'); (e.currentTarget.style.borderColor = '#27272a'); }}
          >
            <span>🔗</span> Raw API Endpoint
          </a>
        </div>
      </div>

      {/* ── Full Interactive Documentation View ── */}
      <div style={{
        flex: 1,
        minHeight: 0,
        background: '#121214',
        border: '1px solid #27272a',
        borderRadius: '10px',
        overflow: 'hidden'
      }}>
        <ReadmeRenderer />
      </div>
    </div>
  );
};
