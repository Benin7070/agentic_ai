import React, { useState, useEffect } from 'react';
import { useSimulation } from '../contexts/SimulationContext';

interface SavedKey {
  id: string;
  name: string;
  provider: string;
  apiKey: string;
  created: string;
}

export const SettingsView: React.FC = () => {
  const { settings, updateSettings } = useSimulation();
  
  const [savedKeys, setSavedKeys] = useState<SavedKey[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newProvider, setNewProvider] = useState('openai');
  const [newKey, setNewKey] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  
  // Load saved keys from backend
  useEffect(() => {
    fetch('http://localhost:8000/api/keys')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setSavedKeys(data);
        } else {
          setSavedKeys([{
            id: 'default-mock',
            name: 'Simulation Mock',
            provider: 'none',
            apiKey: '',
            created: new Date().toISOString()
          }]);
        }
      })
      .catch(err => console.error("Failed to load keys:", err));
  }, []);

  // Sync to backend on change
  const persistKeys = (keys: SavedKey[]) => {
    setSavedKeys(keys);
    fetch('http://localhost:8000/api/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(keys)
    }).catch(err => console.error("Failed to save keys:", err));
  };

  const handleTestKey = async () => {
    if (newProvider !== 'none' && !newKey.trim()) {
      setTestStatus('error');
      setTestMessage('Please enter an API key');
      return;
    }
    
    setTestStatus('testing');
    setTestMessage('');
    try {
      const res = await fetch('http://localhost:8000/api/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: newProvider, apiKey: newKey })
      });
      const data = await res.json();
      if (data.status === 'ok') {
        setTestStatus('success');
      } else {
        setTestStatus('error');
        setTestMessage(data.message || 'Invalid API Key');
      }
    } catch (err) {
      setTestStatus('error');
      setTestMessage('Failed to connect to backend');
    }
  };

  const handleCreateKey = () => {
    if (!newName || testStatus !== 'success') return;
    
    const newEntry: SavedKey = {
      id: Date.now().toString(),
      name: newName,
      provider: newProvider,
      apiKey: newKey,
      created: new Date().toISOString()
    };
    
    persistKeys([newEntry, ...savedKeys]);
    setShowModal(false);
    setNewName('');
    setNewKey('');
    setTestStatus('idle');
  };

  const handleDelete = (id: string) => {
    const newKeys = savedKeys.filter(k => k.id !== id);
    persistKeys(newKeys);
    // If we deleted the active key, fallback to mock
    const deletedKey = savedKeys.find(k => k.id === id);
    if (deletedKey && settings.configName === deletedKey.name) {
      updateSettings({ provider: 'none', apiKey: '', configName: 'Simulation Mock' });
    }
  };

  const handleSetActive = (keyObj: SavedKey) => {
    updateSettings({
      provider: keyObj.provider,
      apiKey: keyObj.apiKey,
      configName: keyObj.name
    });
  };

  return (
    <div className="glass-panel settings-view" style={{ flex: 1, padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.8rem', margin: 0 }}>API keys</h2>
        <button 
          className="primary-btn" 
          style={{ background: '#fff', color: '#000', fontWeight: 'bold' }}
          onClick={() => setShowModal(true)}
        >
          + Create new secret key
        </button>
      </div>

      {showModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.7)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="glass-panel" style={{ width: '400px', padding: '2rem' }}>
            <h3>Create new secret key</h3>
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label>Name</label>
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. My Prod Key" />
            </div>
            <div className="form-group">
              <label>Provider</label>
              <select value={newProvider} onChange={e => setNewProvider(e.target.value)}>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="none">Simulation (Mock)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Secret Key</label>
              <input type="password" value={newKey} onChange={e => {setNewKey(e.target.value); setTestStatus('idle');}} placeholder="sk-..." disabled={newProvider === 'none'} />
            </div>
            
            {testStatus === 'error' && (
              <div style={{ color: '#EF4444', fontSize: '0.85rem', marginTop: '1rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px' }}>
                {testMessage}
              </div>
            )}
            
            {testStatus === 'success' && (
              <div style={{ color: '#34D399', fontSize: '0.85rem', marginTop: '1rem', padding: '0.5rem', background: 'rgba(52, 211, 153, 0.1)', borderRadius: '4px' }}>
                API Key validated successfully!
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end', alignItems: 'center' }}>
              <button className="sidebar-btn" onClick={() => {setShowModal(false); setTestStatus('idle');}}>Cancel</button>
              {testStatus !== 'success' ? (
                <button 
                  className="primary-btn" 
                  onClick={handleTestKey}
                  disabled={testStatus === 'testing' || !newName || (newProvider !== 'none' && !newKey)}
                  style={{ background: '#3b82f6', color: '#fff' }}
                >
                  {testStatus === 'testing' ? 'Testing...' : 'Test API Key'}
                </button>
              ) : (
                <button className="primary-btn" onClick={handleCreateKey}>Create secret key</button>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ 
        background: 'rgba(30, 41, 59, 0.4)', 
        borderRadius: '8px', 
        border: '1px solid rgba(255,255,255,0.05)',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>NAME</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>PROVIDER</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>SECRET KEY</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>CREATED</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>STATUS</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 500, textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {savedKeys.map(k => {
              const isActive = settings.configName === k.name && settings.provider === k.provider;
              const maskedKey = k.apiKey ? `sk-...${k.apiKey.slice(-4)}` : 'N/A';
              
              return (
                <tr key={k.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{k.name}</td>
                  <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>
                    {k.provider === 'none' ? 'Simulation' : k.provider === 'openai' ? 'OpenAI' : 'Anthropic'}
                  </td>
                  <td style={{ padding: '1rem 1.5rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{maskedKey}</td>
                  <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>
                    {new Date(k.created).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    {isActive ? (
                      <span style={{ color: '#34D399', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34D399' }}></span> Active
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Saved</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                      {!isActive && (
                        <button 
                          style={{ background: 'none', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                          onClick={() => handleSetActive(k)}
                        >
                          Use Key
                        </button>
                      )}
                      <button 
                        style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '1.2rem', opacity: 0.8 }}
                        onClick={() => handleDelete(k.id)}
                        title="Delete key"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
