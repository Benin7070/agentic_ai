import React from 'react';
import { NavLink } from 'react-router-dom';

export const Sidebar: React.FC = () => {
  return (
    <aside className="app-sidebar glass-panel">
      <div className="sidebar-header">
        <h2 className="sidebar-title">MAS Control</h2>
      </div>

      <nav className="sidebar-nav">
        <NavLink 
          to="/" 
          end
          className={({ isActive }) => `sidebar-btn ${isActive ? 'active' : ''}`}
        >
          ⊞ Dashboard
        </NavLink>
        
        <NavLink 
          to="/settings" 
          className={({ isActive }) => `sidebar-btn ${isActive ? 'active' : ''}`}
        >
          ⚙ Configuration
        </NavLink>
        
        <NavLink 
          to="/agents" 
          className={({ isActive }) => `sidebar-btn ${isActive ? 'active' : ''}`}
        >
          🤖 Agents
        </NavLink>

        <NavLink 
          to="/docs" 
          className={({ isActive }) => `sidebar-btn ${isActive ? 'active' : ''}`}
        >
          📖 Documentation
        </NavLink>
      </nav>
    </aside>
  );
};
