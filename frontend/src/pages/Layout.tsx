import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';

export const Layout: React.FC = () => {
  return (
    <div className="app-layout-with-sidebar">
      <Sidebar />
      <div className="app-main-content">
        <header className="app-header">
          <h1 className="app-title">
            <span className="app-title-icon" aria-hidden="true" />
            AgentNet MAS
          </h1>
          <span className="app-subtitle">Fairness-Aware Credit Decisioning Platform</span>
        </header>
        <Outlet />
      </div>
    </div>
  );
};
