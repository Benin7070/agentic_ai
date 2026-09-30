import React, { useMemo, useState } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useSimulation } from '../contexts/SimulationContext';
import { ReactFlow, Background, Controls, Handle, Position, MarkerType } from '@xyflow/react';
import type { Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { GMemoryDetailView } from './GMemoryDetailView';

// ── Handle Style (Invisible anchor point so arrows attach seamlessly to borders) ──
const hiddenHandle: React.CSSProperties = {
  width: 1,
  height: 1,
  minWidth: 1,
  minHeight: 1,
  opacity: 0,
  border: 'none',
  background: 'transparent',
  pointerEvents: 'none'
};

// ── Agent Metadata Dictionary ──
const AGENT_META: Record<string, { role: string; icon: string; level: string }> = {
  KYC: { role: 'Identity & AML Gatekeeper', icon: '🛡️', level: 'L1 Barrier' },
  Fraud: { role: 'Velocity & Anomaly Detection', icon: '🔍', level: 'L2 Parallel' },
  Credit: { role: 'Bureau Score & Repayment History', icon: '💳', level: 'L2 Parallel' },
  Affordability: { role: 'Debt-to-Income & Capacity', icon: '📊', level: 'L3 Evaluation' },
  Policy: { role: 'Credit Policy & Regulatory Rules', icon: '📜', level: 'L4 Synthesis' },
  Pricing: { role: 'Risk-Based APR & Terms', icon: '🏷️', level: 'L4 Synthesis' },
  Explainability: { role: 'Fairness, SHAP & Audit', icon: '⚖️', level: 'L5 Audit' }
};

// ── Custom Agent Node Component ──
const AgentNode = ({ data }: any) => {
  const meta = AGENT_META[data.name] || { role: 'Independent MAS Agent', icon: '🤖', level: 'Agent' };
  
  return (
    <div
      style={{
        cursor: 'pointer',
        opacity: data.isMapped ? 1 : 0.65,
        background: '#18181b', // zinc-900
        padding: '0.85rem 1rem',
        borderRadius: '10px',
        borderWidth: data.isActive ? '2px' : '1px',
        borderStyle: 'solid',
        borderColor: data.isActive ? '#10B981' : (data.hasOutput ? '#6366F1' : '#27272a'),
        width: '195px',
        boxShadow: data.isActive 
          ? '0 0 20px rgba(16, 185, 129, 0.45)' 
          : (data.hasOutput ? '0 4px 15px rgba(99, 102, 241, 0.15)' : '0 4px 12px rgba(0,0,0,0.4)'),
        animation: data.isActive ? 'pulseActiveBorder 1.5s infinite' : 'none',
        transition: 'all 0.25s ease',
        position: 'relative'
      }}
      onClick={data.onClick}
    >
      {/* 4 Cardinal Handles for Clean Radial & DAG Routing */}
      <Handle type="target" position={Position.Top} id="target-top" style={hiddenHandle} />
      <Handle type="target" position={Position.Bottom} id="target-bottom" style={hiddenHandle} />
      <Handle type="target" position={Position.Left} id="target-left" style={hiddenHandle} />
      <Handle type="target" position={Position.Right} id="target-right" style={hiddenHandle} />
      
      <Handle type="source" position={Position.Top} id="source-top" style={hiddenHandle} />
      <Handle type="source" position={Position.Bottom} id="source-bottom" style={hiddenHandle} />
      <Handle type="source" position={Position.Left} id="source-left" style={hiddenHandle} />
      <Handle type="source" position={Position.Right} id="source-right" style={hiddenHandle} />

      {/* Header with Icon, Name & Level */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '1.1rem' }}>{meta.icon}</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f4f4f5' }}>{data.label}</span>
        </div>
        <span style={{ 
          fontSize: '0.6rem', 
          padding: '0.15rem 0.35rem', 
          borderRadius: '4px', 
          background: 'rgba(255,255,255,0.06)', 
          color: '#a1a1aa',
          fontWeight: 500 
        }}>
          {meta.level}
        </span>
      </div>

      {/* Role Subtitle */}
      <div style={{ 
        fontSize: '0.68rem', 
        color: '#a1a1aa', 
        marginBottom: '0.6rem', 
        lineHeight: 1.25,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis' 
      }}>
        {meta.role}
      </div>

      {/* Status Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.3rem',
          fontSize: '0.65rem',
          padding: '0.2rem 0.45rem',
          borderRadius: '4px',
          background: data.isActive 
            ? 'rgba(16, 185, 129, 0.2)' 
            : (data.hasOutput ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.05)'),
          color: data.isActive ? '#34D399' : (data.hasOutput ? '#A5B4FC' : '#71717a'),
          fontWeight: 600
        }}>
          <span style={{ 
            width: 6, 
            height: 6, 
            borderRadius: '50%', 
            background: data.isActive ? '#10B981' : (data.hasOutput ? '#818CF8' : '#52525b') 
          }} />
          {data.isActive ? 'RUNNING' : (data.hasOutput ? 'SYNCED' : 'READY')}
        </div>

        {data.mentionsCount > 0 && (
          <span style={{
            fontSize: '0.62rem',
            padding: '0.15rem 0.4rem',
            borderRadius: '4px',
            background: 'rgba(245, 158, 11, 0.2)',
            color: '#FBBF24',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.2rem'
          }}>
            💬 {data.mentionsCount}
          </span>
        )}
      </div>

      {/* Mini Telemetry Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.25rem',
        paddingTop: '0.4rem',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        fontSize: '0.68rem',
        color: '#71717a'
      }}>
        <div>Calls: <span style={{ color: '#d4d4d8', fontWeight: 500 }}>{data.stats?.totalCalls || 0}</span></div>
        <div>Tokens: <span style={{ color: '#d4d4d8', fontWeight: 500 }}>{data.stats?.tokensUsed?.toLocaleString() || 0}</span></div>
      </div>
    </div>
  );
};

// ── Custom G-Memory System Node Component ──
const SystemNode = ({ data }: any) => {
  return (
    <div
      style={{
        cursor: 'pointer',
        background: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.25) 0%, rgba(30, 27, 75, 0.8) 65%, #09090b 100%)',
        padding: '1.25rem',
        borderRadius: '50%',
        border: '2px solid rgba(167, 139, 250, 0.85)',
        width: '170px',
        height: '170px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        boxShadow: '0 0 30px rgba(139, 92, 246, 0.45)',
        animation: 'pulseGMemory 3s infinite ease-in-out',
        position: 'relative',
        zIndex: 10
      }}
      onClick={data.onClick}
      title="Click to inspect live Blackboard state & mentions"
    >
      {/* Exact Radial Connection Handles matching each agent's perimeter angle */}
      {/* Center is (85, 85), Radius is 85 */}
      <Handle type="target" position={Position.Top} id="hub-top" style={{ left: '85px', top: '0px', ...hiddenHandle }} />
      <Handle type="target" position={Position.Right} id="hub-fraud" style={{ left: '151px', top: '32px', ...hiddenHandle }} />
      <Handle type="target" position={Position.Right} id="hub-credit" style={{ left: '170px', top: '95px', ...hiddenHandle }} />
      <Handle type="target" position={Position.Bottom} id="hub-afford" style={{ left: '122px', top: '162px', ...hiddenHandle }} />
      <Handle type="target" position={Position.Bottom} id="hub-policy" style={{ left: '48px', top: '162px', ...hiddenHandle }} />
      <Handle type="target" position={Position.Left} id="hub-pricing" style={{ left: '0px', top: '95px', ...hiddenHandle }} />
      <Handle type="target" position={Position.Left} id="hub-explain" style={{ left: '19px', top: '32px', ...hiddenHandle }} />

      <Handle type="source" position={Position.Top} id="hub-src-top" style={{ left: '85px', top: '0px', ...hiddenHandle }} />
      <Handle type="source" position={Position.Right} id="hub-src-fraud" style={{ left: '151px', top: '32px', ...hiddenHandle }} />
      <Handle type="source" position={Position.Right} id="hub-src-credit" style={{ left: '170px', top: '95px', ...hiddenHandle }} />
      <Handle type="source" position={Position.Bottom} id="hub-src-afford" style={{ left: '122px', top: '162px', ...hiddenHandle }} />
      <Handle type="source" position={Position.Bottom} id="hub-src-policy" style={{ left: '48px', top: '162px', ...hiddenHandle }} />
      <Handle type="source" position={Position.Left} id="hub-src-pricing" style={{ left: '0px', top: '95px', ...hiddenHandle }} />
      <Handle type="source" position={Position.Left} id="hub-src-explain" style={{ left: '19px', top: '32px', ...hiddenHandle }} />

      {/* Generic cardinal handles for DAG mode */}
      <Handle type="target" position={Position.Left} id="hub-dag-left" style={hiddenHandle} />
      <Handle type="source" position={Position.Right} id="hub-dag-right" style={hiddenHandle} />

      {/* Memory Reactor Graphic */}
      <div style={{ fontSize: '1.4rem', marginBottom: '0.2rem' }}>⚡</div>
      <h4 style={{ margin: '0 0 0.15rem 0', fontSize: '0.9rem', color: '#DDD6FE', letterSpacing: '0.05em', fontWeight: 800 }}>
        G-MEMORY
      </h4>
      <span style={{ fontSize: '0.62rem', color: '#A78BFA', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
        Shared Blackboard
      </span>

      <div style={{
        fontSize: '0.62rem',
        padding: '0.2rem 0.5rem',
        borderRadius: '12px',
        background: 'rgba(167, 139, 250, 0.25)',
        color: '#E9D5FF',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '0.3rem',
        border: '1px solid rgba(167, 139, 250, 0.4)'
      }}>
        <span>●</span> {data.keysCount > 0 ? `${data.keysCount} Active States` : 'Bus Ready'}
      </div>

      <span style={{ fontSize: '0.6rem', color: '#94A3B8', marginTop: '0.35rem' }}>
        Click to Inspect ↗
      </span>
    </div>
  );
};

const nodeTypes = {
  agent: AgentNode,
  system: SystemNode
};

export const AgentsView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings, agentMetrics, stats, requests } = useSimulation();
  
  const [selectedMemory, setSelectedMemory] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'star' | 'dag'>('star');

  const totalTokens = Object.values(agentMetrics).reduce((acc, metric) => acc + metric.tokensUsed, 0);
  const isMapped = settings.provider !== 'none' && settings.apiKey.length > 0;
  const isDetailOpen = location.pathname.split('/').length > 2;
  
  const latestReq = requests.length > 0 ? requests[0] : null;

  const isAgentActive = (name: string) => {
    return requests.some(r => r.status === 'PROCESSING' && r.agents?.some(a => a.name === name && a.status === 'ACTIVE'));
  };

  const hasAgentOutput = (name: string) => {
    return Boolean(latestReq?.sharedState?.[`${name}_output`]);
  };

  // Extract active mentions across the shared blackboard
  const activeMentions = useMemo(() => {
    if (!latestReq?.sharedState) return [];
    const mentionsList: { source: string; target: string; message: string }[] = [];
    
    for (const [key, val] of Object.entries(latestReq.sharedState)) {
      if (key.endsWith('_output') && val && typeof val === 'object') {
        const source = key.replace('_output', '');
        const mentions = (val as any).mentions;
        if (Array.isArray(mentions)) {
          for (const m of mentions) {
            if (m.target) {
              mentionsList.push({ source, target: m.target, message: m.message || '' });
            }
          }
        }
      }
    }
    return mentionsList;
  }, [latestReq]);

  const countAgentMentions = (name: string) => {
    return activeMentions.filter(m => m.source === name || m.target === name).length;
  };

  const sharedKeysCount = latestReq?.sharedState ? Object.keys(latestReq.sharedState).length : 0;

  // ── Nodes Layout Computation ──
  const nodes: Node[] = useMemo(() => {
    if (viewMode === 'star') {
      // Symmetrical Radial Orbit around Center (550, 380), Rx=380, Ry=260
      return [
        {
          id: 'G-Memory',
          type: 'system',
          position: { x: 465, y: 295 }, // Exact center at (550, 380) with 170x170 dimensions
          data: { 
            keysCount: sharedKeysCount,
            mentionsCount: activeMentions.length,
            onClick: () => navigate('/agents/G-Memory')
          }
        },
        {
          id: 'KYC',
          type: 'agent',
          position: { x: 452, y: 60 }, // Top
          data: { 
            name: 'KYC', label: 'KYC Agent', isMapped, 
            isActive: isAgentActive('KYC'), hasOutput: hasAgentOutput('KYC'),
            mentionsCount: countAgentMentions('KYC'),
            stats: agentMetrics['KYC'], onClick: () => navigate('/agents/KYC') 
          }
        },
        {
          id: 'Fraud',
          type: 'agent',
          position: { x: 740, y: 155 }, // Top-Right
          data: { 
            name: 'Fraud', label: 'Fraud Agent', isMapped, 
            isActive: isAgentActive('Fraud'), hasOutput: hasAgentOutput('Fraud'),
            mentionsCount: countAgentMentions('Fraud'),
            stats: agentMetrics['Fraud'], onClick: () => navigate('/agents/Fraud') 
          }
        },
        {
          id: 'Credit',
          type: 'agent',
          position: { x: 820, y: 380 }, // Mid-Right
          data: { 
            name: 'Credit', label: 'Credit Agent', isMapped, 
            isActive: isAgentActive('Credit'), hasOutput: hasAgentOutput('Credit'),
            mentionsCount: countAgentMentions('Credit'),
            stats: agentMetrics['Credit'], onClick: () => navigate('/agents/Credit') 
          }
        },
        {
          id: 'Affordability',
          type: 'agent',
          position: { x: 620, y: 565 }, // Bottom-Right
          data: { 
            name: 'Affordability', label: 'Affordability Agent', isMapped, 
            isActive: isAgentActive('Affordability'), hasOutput: hasAgentOutput('Affordability'),
            mentionsCount: countAgentMentions('Affordability'),
            stats: agentMetrics['Affordability'], onClick: () => navigate('/agents/Affordability') 
          }
        },
        {
          id: 'Policy',
          type: 'agent',
          position: { x: 285, y: 565 }, // Bottom-Left
          data: { 
            name: 'Policy', label: 'Policy Agent', isMapped, 
            isActive: isAgentActive('Policy'), hasOutput: hasAgentOutput('Policy'),
            mentionsCount: countAgentMentions('Policy'),
            stats: agentMetrics['Policy'], onClick: () => navigate('/agents/Policy') 
          }
        },
        {
          id: 'Pricing',
          type: 'agent',
          position: { x: 85, y: 380 }, // Mid-Left
          data: { 
            name: 'Pricing', label: 'Pricing Agent', isMapped, 
            isActive: isAgentActive('Pricing'), hasOutput: hasAgentOutput('Pricing'),
            mentionsCount: countAgentMentions('Pricing'),
            stats: agentMetrics['Pricing'], onClick: () => navigate('/agents/Pricing') 
          }
        },
        {
          id: 'Explainability',
          type: 'agent',
          position: { x: 165, y: 155 }, // Top-Left
          data: { 
            name: 'Explainability', label: 'Explainability Agent', isMapped, 
            isActive: isAgentActive('Explainability'), hasOutput: hasAgentOutput('Explainability'),
            mentionsCount: countAgentMentions('Explainability'),
            stats: agentMetrics['Explainability'], onClick: () => navigate('/agents/Explainability') 
          }
        }
      ];
    } else {
      // 5-Level Hierarchical DAG Pipeline Layout
      return [
        {
          id: 'KYC',
          type: 'agent',
          position: { x: 450, y: 30 },
          data: { 
            name: 'KYC', label: 'KYC Agent', isMapped, 
            isActive: isAgentActive('KYC'), hasOutput: hasAgentOutput('KYC'),
            mentionsCount: countAgentMentions('KYC'),
            stats: agentMetrics['KYC'], onClick: () => navigate('/agents/KYC') 
          }
        },
        {
          id: 'Fraud',
          type: 'agent',
          position: { x: 280, y: 180 },
          data: { 
            name: 'Fraud', label: 'Fraud Agent', isMapped, 
            isActive: isAgentActive('Fraud'), hasOutput: hasAgentOutput('Fraud'),
            mentionsCount: countAgentMentions('Fraud'),
            stats: agentMetrics['Fraud'], onClick: () => navigate('/agents/Fraud') 
          }
        },
        {
          id: 'Credit',
          type: 'agent',
          position: { x: 620, y: 180 },
          data: { 
            name: 'Credit', label: 'Credit Agent', isMapped, 
            isActive: isAgentActive('Credit'), hasOutput: hasAgentOutput('Credit'),
            mentionsCount: countAgentMentions('Credit'),
            stats: agentMetrics['Credit'], onClick: () => navigate('/agents/Credit') 
          }
        },
        {
          id: 'Affordability',
          type: 'agent',
          position: { x: 450, y: 330 },
          data: { 
            name: 'Affordability', label: 'Affordability Agent', isMapped, 
            isActive: isAgentActive('Affordability'), hasOutput: hasAgentOutput('Affordability'),
            mentionsCount: countAgentMentions('Affordability'),
            stats: agentMetrics['Affordability'], onClick: () => navigate('/agents/Affordability') 
          }
        },
        {
          id: 'Pricing',
          type: 'agent',
          position: { x: 280, y: 480 },
          data: { 
            name: 'Pricing', label: 'Pricing Agent', isMapped, 
            isActive: isAgentActive('Pricing'), hasOutput: hasAgentOutput('Pricing'),
            mentionsCount: countAgentMentions('Pricing'),
            stats: agentMetrics['Pricing'], onClick: () => navigate('/agents/Pricing') 
          }
        },
        {
          id: 'Policy',
          type: 'agent',
          position: { x: 620, y: 480 },
          data: { 
            name: 'Policy', label: 'Policy Agent', isMapped, 
            isActive: isAgentActive('Policy'), hasOutput: hasAgentOutput('Policy'),
            mentionsCount: countAgentMentions('Policy'),
            stats: agentMetrics['Policy'], onClick: () => navigate('/agents/Policy') 
          }
        },
        {
          id: 'Explainability',
          type: 'agent',
          position: { x: 450, y: 630 },
          data: { 
            name: 'Explainability', label: 'Explainability Agent', isMapped, 
            isActive: isAgentActive('Explainability'), hasOutput: hasAgentOutput('Explainability'),
            mentionsCount: countAgentMentions('Explainability'),
            stats: agentMetrics['Explainability'], onClick: () => navigate('/agents/Explainability') 
          }
        },
        {
          id: 'G-Memory',
          type: 'system',
          position: { x: 880, y: 300 },
          data: { 
            keysCount: sharedKeysCount,
            mentionsCount: activeMentions.length,
            onClick: () => navigate('/agents/G-Memory')
          }
        }
      ];
    }
  }, [viewMode, stats, agentMetrics, isMapped, navigate, requests, latestReq, activeMentions, sharedKeysCount]);

  // ── Edges Computation with Dedicated Handles & Razor Sharp Vector Arrows ──
  const edges: Edge[] = useMemo(() => {
    if (viewMode === 'star') {
      const getSpokeStyle = (agentName: string) => {
        const active = isAgentActive(agentName);
        const hasOutput = hasAgentOutput(agentName);
        
        const strokeColor = active ? '#10B981' : (hasOutput ? '#818CF8' : '#334155');
        const strokeWidth = active ? 2.5 : 1.75;
        
        return {
          stroke: strokeColor,
          strokeWidth,
          strokeDasharray: active ? '6 4' : undefined,
          transition: 'all 0.3s ease'
        };
      };

      const getMarkerEnd = (agentName: string) => {
        const active = isAgentActive(agentName);
        const hasOutput = hasAgentOutput(agentName);
        const color = active ? '#10B981' : (hasOutput ? '#818CF8' : '#475569');
        return {
          type: MarkerType.ArrowClosed,
          width: 14,
          height: 14,
          color
        };
      };

      // Direct Radial Spoke connections from Agent perimeter directly to G-Memory perimeter
      const spokeEdges: Edge[] = [
        {
          id: 'spoke-kyc',
          source: 'KYC',
          sourceHandle: 'source-bottom',
          target: 'G-Memory',
          targetHandle: 'hub-top',
          type: 'straight',
          animated: isAgentActive('KYC'),
          className: isAgentActive('KYC') ? 'edge-glow-active' : undefined,
          style: getSpokeStyle('KYC'),
          markerEnd: getMarkerEnd('KYC')
        },
        {
          id: 'spoke-fraud',
          source: 'Fraud',
          sourceHandle: 'source-left',
          target: 'G-Memory',
          targetHandle: 'hub-fraud',
          type: 'straight',
          animated: isAgentActive('Fraud'),
          className: isAgentActive('Fraud') ? 'edge-glow-active' : undefined,
          style: getSpokeStyle('Fraud'),
          markerEnd: getMarkerEnd('Fraud')
        },
        {
          id: 'spoke-credit',
          source: 'Credit',
          sourceHandle: 'source-left',
          target: 'G-Memory',
          targetHandle: 'hub-credit',
          type: 'straight',
          animated: isAgentActive('Credit'),
          className: isAgentActive('Credit') ? 'edge-glow-active' : undefined,
          style: getSpokeStyle('Credit'),
          markerEnd: getMarkerEnd('Credit')
        },
        {
          id: 'spoke-afford',
          source: 'Affordability',
          sourceHandle: 'source-top',
          target: 'G-Memory',
          targetHandle: 'hub-afford',
          type: 'straight',
          animated: isAgentActive('Affordability'),
          className: isAgentActive('Affordability') ? 'edge-glow-active' : undefined,
          style: getSpokeStyle('Affordability'),
          markerEnd: getMarkerEnd('Affordability')
        },
        {
          id: 'spoke-policy',
          source: 'Policy',
          sourceHandle: 'source-top',
          target: 'G-Memory',
          targetHandle: 'hub-policy',
          type: 'straight',
          animated: isAgentActive('Policy'),
          className: isAgentActive('Policy') ? 'edge-glow-active' : undefined,
          style: getSpokeStyle('Policy'),
          markerEnd: getMarkerEnd('Policy')
        },
        {
          id: 'spoke-pricing',
          source: 'Pricing',
          sourceHandle: 'source-right',
          target: 'G-Memory',
          targetHandle: 'hub-pricing',
          type: 'straight',
          animated: isAgentActive('Pricing'),
          className: isAgentActive('Pricing') ? 'edge-glow-active' : undefined,
          style: getSpokeStyle('Pricing'),
          markerEnd: getMarkerEnd('Pricing')
        },
        {
          id: 'spoke-explain',
          source: 'Explainability',
          sourceHandle: 'source-right',
          target: 'G-Memory',
          targetHandle: 'hub-explain',
          type: 'straight',
          animated: isAgentActive('Explainability'),
          className: isAgentActive('Explainability') ? 'edge-glow-active' : undefined,
          style: getSpokeStyle('Explainability'),
          markerEnd: getMarkerEnd('Explainability')
        }
      ];

      // Dynamic Inter-Agent Mentions (Glowing Amber Arcs)
      const mentionEdges: Edge[] = activeMentions.map((m, idx) => ({
        id: `mention-${m.source}-${m.target}-${idx}`,
        source: m.source,
        target: m.target,
        type: 'smoothstep',
        animated: true,
        className: 'edge-glow-mention',
        style: {
          stroke: '#F59E0B',
          strokeWidth: 2.25,
          strokeDasharray: '5 4'
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 16,
          height: 16,
          color: '#F59E0B'
        },
        label: `💬 @${m.target}`,
        labelStyle: { fill: '#FEF3C7', fontSize: 11, fontWeight: 700 },
        labelBgStyle: { fill: '#78350F', fillOpacity: 0.95, rx: 6, ry: 6 },
        labelBgPadding: [8, 4]
      }));

      return [...spokeEdges, ...mentionEdges];
    } else {
      // Hierarchical DAG Execution Edges
      const dagMarker = { type: MarkerType.ArrowClosed, width: 14, height: 14, color: '#3B82F6' };
      const baseDagStyle = { stroke: '#3B82F6', strokeWidth: 1.75 };

      return [
        { id: 'dag-1a', source: 'KYC', sourceHandle: 'source-bottom', target: 'Fraud', targetHandle: 'target-top', type: 'smoothstep', style: baseDagStyle, markerEnd: dagMarker },
        { id: 'dag-1b', source: 'KYC', sourceHandle: 'source-bottom', target: 'Credit', targetHandle: 'target-top', type: 'smoothstep', style: baseDagStyle, markerEnd: dagMarker },
        
        { id: 'dag-2a', source: 'Fraud', sourceHandle: 'source-bottom', target: 'Affordability', targetHandle: 'target-top', type: 'smoothstep', style: baseDagStyle, markerEnd: dagMarker },
        { id: 'dag-2b', source: 'Credit', sourceHandle: 'source-bottom', target: 'Affordability', targetHandle: 'target-top', type: 'smoothstep', style: baseDagStyle, markerEnd: dagMarker },
        
        { id: 'dag-3a', source: 'Affordability', sourceHandle: 'source-bottom', target: 'Pricing', targetHandle: 'target-top', type: 'smoothstep', style: baseDagStyle, markerEnd: dagMarker },
        { id: 'dag-3b', source: 'Affordability', sourceHandle: 'source-bottom', target: 'Policy', targetHandle: 'target-top', type: 'smoothstep', style: baseDagStyle, markerEnd: dagMarker },
        
        { id: 'dag-4a', source: 'Pricing', sourceHandle: 'source-bottom', target: 'Explainability', targetHandle: 'target-top', type: 'smoothstep', style: baseDagStyle, markerEnd: dagMarker },
        { id: 'dag-4b', source: 'Policy', sourceHandle: 'source-bottom', target: 'Explainability', targetHandle: 'target-top', type: 'smoothstep', style: baseDagStyle, markerEnd: dagMarker },
      ];
    }
  }, [viewMode, requests, latestReq, activeMentions]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <div className="glass-panel settings-view" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        
        {/* Top Header & Telemetry Bar */}
        <div className="header-panel" style={{ marginBottom: '0.85rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>MAS AgentNet Topology</h2>
              <p className="settings-desc" style={{ marginTop: '0.25rem', marginBottom: 0, fontSize: '0.8rem' }}>
                Multi-Agent System architecture. Interactive graph showing live blackboard bus & inter-agent mentions.
              </p>
            </div>

            {/* View Mode Switcher & Docs Link */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                display: 'flex',
                background: '#18181b',
                padding: '0.25rem',
                borderRadius: '8px',
                border: '1px solid #27272a'
              }}>
                <button
                  onClick={() => setViewMode('star')}
                  style={{
                    background: viewMode === 'star' ? '#27272a' : 'transparent',
                    color: viewMode === 'star' ? '#f4f4f5' : '#71717a',
                    border: 'none',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>🌟</span> Blackboard Orbit
                </button>
                <button
                  onClick={() => setViewMode('dag')}
                  style={{
                    background: viewMode === 'dag' ? '#27272a' : 'transparent',
                    color: viewMode === 'dag' ? '#f4f4f5' : '#71717a',
                    border: 'none',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>⚡</span> DAG Pipeline
                </button>
              </div>

              <button
                onClick={() => navigate('/docs')}
                style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  color: '#93c5fd',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'; e.currentTarget.style.color = '#93c5fd'; }}
                title="Explore MAS Architecture & Specifications in README Docs"
              >
                <span>📖</span> System README
              </button>
            </div>

            {/* Metrics Bar */}
            <div className="metrics-bar" style={{ margin: 0 }}>
              <div className="metric-box" style={{ padding: '0.4rem 0.75rem' }}>
                <span className="metric-label" style={{ fontSize: '0.7rem' }}>Overall Tokens</span>
                <span className="metric-value" style={{ fontSize: '1rem' }}>{totalTokens.toLocaleString()}</span>
              </div>
              <div className="metric-box" style={{ padding: '0.4rem 0.75rem' }}>
                <span className="metric-label" style={{ fontSize: '0.7rem' }}>Blackboard Status</span>
                <span className="metric-value" style={{ fontSize: '1rem', color: sharedKeysCount > 0 ? '#10B981' : '#71717a' }}>
                  {sharedKeysCount > 0 ? `${sharedKeysCount} Entries` : 'Ready'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Graph Canvas Container */}
        <div style={{ 
          flexGrow: 1, 
          position: 'relative', 
          borderRadius: '12px', 
          overflow: 'hidden', 
          border: '1px solid #27272a', 
          background: '#09090b' 
        }}>
          {/* Subtle View Mode Indicator Tag */}
          <div style={{
            position: 'absolute',
            top: '1rem',
            left: '1rem',
            zIndex: 5,
            background: 'rgba(24, 24, 27, 0.85)',
            backdropFilter: 'blur(8px)',
            border: '1px solid #27272a',
            padding: '0.4rem 0.75rem',
            borderRadius: '6px',
            fontSize: '0.75rem',
            color: '#a1a1aa',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            pointerEvents: 'none'
          }}>
            <span style={{ 
              width: 8, height: 8, borderRadius: '50%', 
              background: viewMode === 'star' ? '#A78BFA' : '#3B82F6' 
            }} />
            <span>
              {viewMode === 'star' 
                ? 'Radial Star Bus (G-Memory Central Hub)' 
                : 'Directed Acyclic Graph (DAG Sequential/Parallel Flow)'}
            </span>
          </div>

          <ReactFlow 
            nodes={nodes} 
            edges={edges} 
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.15 }}
            attributionPosition="bottom-right"
            colorMode="dark"
            style={{ background: 'transparent' }}
          >
            <Background color="#1e293b" gap={20} size={1} />
            <Controls style={{ background: '#18181b', borderColor: '#27272a', fill: '#f4f4f5' }} />
          </ReactFlow>
        </div>
      </div>
      
      {/* Agent Detail Drawer */}
      <div className={`agent-slide-over ${isDetailOpen ? 'open' : ''}`}>
        <Outlet />
      </div>

      {/* G-Memory Blackboard & Mentions Inspection Modal */}
      {selectedMemory && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex',
          alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)',
          padding: '1.5rem'
        }} onClick={() => setSelectedMemory(null)}>
          <div style={{
            background: '#09090b', borderRadius: '12px',
            width: '100%', maxWidth: '1000px', height: '90%', overflow: 'hidden',
            border: '1px solid rgba(167, 139, 250, 0.4)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.85)'
          }} onClick={e => e.stopPropagation()}>
            <GMemoryDetailView isModal onClose={() => setSelectedMemory(null)} />
          </div>
        </div>
      )}
    </div>
  );
};
