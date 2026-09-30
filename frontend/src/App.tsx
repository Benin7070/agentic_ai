
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SimulationProvider } from './contexts/SimulationContext';
import { Layout } from './pages/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { SettingsView } from './components/SettingsView';
import { AgentsView } from './components/AgentsView';
import { AgentDetailView } from './components/AgentDetailView';
import { DocsPage } from './pages/DocsPage';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <SimulationProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="settings" element={<SettingsView />} />
            <Route path="docs" element={<DocsPage />} />
            <Route path="agents" element={<AgentsView />}>
              <Route path=":agentId" element={<AgentDetailView />} />
            </Route>
          </Route>
        </Routes>
      </SimulationProvider>
    </BrowserRouter>
  );
}
