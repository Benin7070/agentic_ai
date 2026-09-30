import React from 'react';
import { ReadmeRenderer } from './ReadmeRenderer';

export interface ReadmeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSection?: string;
  highlightAgent?: string;
  title?: string;
}

export const ReadmeModal: React.FC<ReadmeModalProps> = ({
  isOpen,
  onClose,
  initialSection,
  highlightAgent
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0, 0, 0, 0.82)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '1.5rem'
    }}>
      <div style={{
        background: '#0e0e11',
        border: '1px solid #27272a',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '1200px',
        height: '88vh',
        display: 'flex',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
      }}>
        <ReadmeRenderer
          isModal
          onClose={onClose}
          initialSection={initialSection}
          highlightAgent={highlightAgent}
        />
      </div>
    </div>
  );
};
