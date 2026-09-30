import React from 'react';
import { QueuePanel } from '../components/QueueView';
import { InspectorPanel } from '../components/InspectorView';
import { RoutingCard } from '../components/RoutingCard';
import { MemoryImpactPanel } from '../components/MemoryImpactPanel';
import { SimulationControls } from '../components/SimulationControls';

export const DashboardPage: React.FC = () => {
  return (
    <>
      <main className="main-grid">
        <QueuePanel />
        <InspectorPanel />
        <RoutingCard />
        <MemoryImpactPanel />
      </main>
      <SimulationControls />
    </>
  );
};
