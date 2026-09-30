import React, { useState, useEffect, useRef, useMemo } from 'react';
import { marked } from 'marked';

export interface ReadmeRendererProps {
  initialSection?: string;
  isModal?: boolean;
  onClose?: () => void;
  highlightAgent?: string;
}

const SECTION_LINKS = [
  { id: 'overview', title: 'Executive Overview', icon: '🌟' },
  { id: 'kyc-agent', title: 'KYC & AML Gatekeeper', icon: '🛡️', agent: 'KYC' },
  { id: 'fraud-agent', title: 'Fraud & Anomaly Detection', icon: '🔍', agent: 'Fraud' },
  { id: 'credit-agent', title: 'Credit Bureau Derivation', icon: '💳', agent: 'Credit' },
  { id: 'affordability-agent', title: 'Affordability & Capacity', icon: '📊', agent: 'Affordability' },
  { id: 'pricing-agent', title: 'Risk-Based Pricing', icon: '🏷️', agent: 'Pricing' },
  { id: 'policy-agent', title: 'Regulatory Compliance Policy', icon: '📜', agent: 'Policy' },
  { id: 'explainability-agent', title: 'Explainability & Fair Lending', icon: '⚖️', agent: 'Explainability' },
  { id: 'g-memory-system', title: 'G-Memory Epistemic Hierarchy', icon: '🧠', isGMemory: true },
  { id: 'security-isolation', title: 'Queueing & Scratchpad Security', icon: '🔒' },
  { id: 'api-reference', title: 'Quickstart & API Reference', icon: '🚀' }
];

export const ReadmeRenderer: React.FC<ReadmeRendererProps> = ({
  initialSection,
  isModal = false,
  onClose,
  highlightAgent
}) => {
  const [markdown, setMarkdown] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeSection, setActiveSection] = useState<string>(initialSection || 'overview');
  const [copied, setCopied] = useState<boolean>(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Determine section to target
  useEffect(() => {
    if (highlightAgent) {
      const match = SECTION_LINKS.find(s => s.agent === highlightAgent);
      if (match) {
        setActiveSection(match.id);
      }
    } else if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [highlightAgent, initialSection]);

  // Fetch docs from API with fallback
  useEffect(() => {
    const fetchDocs = async () => {
      setLoading(true);
      try {
        const res = await fetch('http://localhost:8000/api/docs');
        if (!res.ok) throw new Error('API fetch failed');
        const data = await res.json();
        setMarkdown(data.markdown || '');
      } catch (e) {
        console.warn('Failed to load README from backend API, using client fallback', e);
        setMarkdown(FALLBACK_MARKDOWN);
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, []);

  // Parse Markdown to HTML
  const parsedHtml = useMemo(() => {
    if (!markdown) return '';
    marked.setOptions({
      gfm: true,
      breaks: true
    });
    return marked.parse(markdown) as string;
  }, [markdown]);

  // Scroll to section anchor
  useEffect(() => {
    if (!loading && activeSection && contentRef.current) {
      const timer = setTimeout(() => {
        const targetEl = contentRef.current?.querySelector(`#${activeSection}`) ||
                         contentRef.current?.querySelector(`[id*="${activeSection}"]`);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [activeSection, loading]);

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSectionClick = (sectionId: string) => {
    setActiveSection(sectionId);
    const targetEl = contentRef.current?.querySelector(`#${sectionId}`);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      width: '100%',
      background: '#09090b',
      color: '#f4f4f5',
      fontFamily: 'Inter, system-ui, sans-serif',
      overflow: 'hidden',
      borderRadius: isModal ? '12px' : '0'
    }}>
      {/* ── Table of Contents Sidebar ── */}
      <div style={{
        width: '280px',
        background: '#121214',
        borderRight: '1px solid #27272a',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem',
          borderBottom: '1px solid #27272a',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem'
        }}>
          <span style={{ fontSize: '1.25rem' }}>📖</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#f4f4f5' }}>
              System README
            </h3>
            <span style={{ fontSize: '0.7rem', color: '#71717a' }}>AgentNet Architecture Docs</span>
          </div>
        </div>

        {/* Filter Input */}
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #27272a' }}>
          <input
            type="text"
            placeholder="Filter sections..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '6px',
              padding: '0.35rem 0.65rem',
              color: '#f4f4f5',
              fontSize: '0.75rem',
              outline: 'none'
            }}
          />
        </div>

        {/* Navigation List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.75rem 0.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.2rem'
        }}>
          {SECTION_LINKS.filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase())).map(s => {
            const isSelected = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => handleSectionClick(s.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.45rem 0.65rem',
                  borderRadius: '6px',
                  background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                  color: isSelected ? '#60A5FA' : '#a1a1aa',
                  border: isSelected ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                  fontSize: '0.76rem',
                  fontWeight: isSelected ? 700 : 500,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{s.icon}</span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.title}
                </span>
                {s.agent && (
                  <span style={{ fontSize: '0.62rem', background: '#27272a', padding: '0.1rem 0.35rem', borderRadius: '3px', color: '#94a3b8' }}>
                    {s.agent}
                  </span>
                )}
                {s.isGMemory && (
                  <span style={{ fontSize: '0.62rem', background: 'rgba(167, 139, 250, 0.2)', padding: '0.1rem 0.35rem', borderRadius: '3px', color: '#C4B5FD' }}>
                    Memory
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer actions */}
        <div style={{
          padding: '0.85rem 1rem',
          borderTop: '1px solid #27272a',
          background: '#0e0e11',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            onClick={handleCopyMarkdown}
            style={{
              background: '#18181b',
              border: '1px solid #27272a',
              color: copied ? '#10B981' : '#a1a1aa',
              padding: '0.35rem 0.65rem',
              borderRadius: '5px',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {copied ? '✓ Copied' : '📋 Copy Raw MD'}
          </button>

          {isModal && onClose && (
            <button
              onClick={onClose}
              style={{
                background: '#27272a',
                border: 'none',
                color: '#f4f4f5',
                padding: '0.35rem 0.75rem',
                borderRadius: '5px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ✕ Close
            </button>
          )}
        </div>
      </div>

      {/* ── Main Documentation Viewer ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Top Header Bar */}
        <div style={{
          padding: '0.85rem 1.5rem',
          borderBottom: '1px solid #27272a',
          background: '#121214',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#71717a' }}>Viewing:</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#60A5FA' }}>
              {SECTION_LINKS.find(s => s.id === activeSection)?.title || 'AgentNet Specification'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.7rem', color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', padding: '0.15rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
              ✓ Live Synced with Repository
            </span>
            {isModal && onClose && (
              <button
                onClick={onClose}
                style={{
                  background: '#18181b',
                  border: '1px solid #27272a',
                  color: '#a1a1aa',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '5px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                ✕ Close
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div
          ref={contentRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '2rem 2.5rem',
            lineHeight: 1.65,
            fontSize: '0.92rem',
            color: '#e4e4e7'
          }}
        >
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#71717a', gap: '0.5rem' }}>
              <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
              <span>Loading README documentation...</span>
            </div>
          ) : (
            <div
              className="readme-markdown-content"
              dangerouslySetInnerHTML={{ __html: parsedHtml }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Fallback embedded documentation in case backend API is unreachable
const FALLBACK_MARKDOWN = `# AgentNet MAS — Multi-Agent Credit Decisioning Platform

> **Autonomous 7-Agent Graph Architecture for Real-Time Retail Lending Underwriting.**

## Executive Overview
AgentNet MAS decomposes credit underwriting into 7 collaborative agents orchestrated across a 5-Level Directed Acyclic Graph (DAG) with an episodic G-Memory hierarchy.

<a id="kyc-agent"></a>
### 1. KYC & AML Gatekeeper Agent (KYC)
Verifies identity, Aadhaar UIDAI linking, PAN formatting, and AML/PEP screening. Emits \`@Fraud\` mentions on high-risk PEP hits.

<a id="fraud-agent"></a>
### 2. Fraud & Anomaly Detection Agent (Fraud)
Analyzes cheque bounce patterns, salary variance, and credit card outstanding ratios.

<a id="credit-agent"></a>
### 3. Credit Bureau Derivation Agent (Credit)
Simulates bureau pull and derives 300-900 CIBIL score and credit grades.

<a id="affordability-agent"></a>
### 4. Affordability & Capacity Agent (Affordability)
Calculates DTI and applies dynamic stress testing based on upstream agent signals.

<a id="pricing-agent"></a>
### 5. Risk-Based Pricing Agent (Pricing)
Calculates risk-adjusted APR and approved loan ceilings.

<a id="policy-agent"></a>
### 6. Regulatory Policy Agent (Policy)
Enforces central bank RBI guidelines, age limits, and LTI caps.

<a id="explainability-agent"></a>
### 7. Explainability Agent (Explainability)
Consolidates all upstream agent traces into an adverse action or approval notice.

<a id="g-memory-system"></a>
## G-Memory Epistemic Hierarchy
Three-Graph Memory Engine comprising Query Graph, Interaction Graph, and Insight Graph.
`;
