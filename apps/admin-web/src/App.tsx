import React, { useState } from 'react';
import { GlobalStyles } from './theme/global';
import { UsersPage } from './pages/UsersPage';
import { AuditPage } from './pages/AuditPage';
import { TreeHistoryPage } from './pages/TreeHistoryPage';

function App() {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <>
      <style>{GlobalStyles}</style>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* Sidebar */}
        <aside
          style={{
            width: '280px',
            backgroundColor: '#fff',
            borderRight: '1px solid var(--hairlineBorder)',
            padding: '24px',
          }}
        >
          <h2 style={{ fontSize: '18px', color: 'var(--forestDepths)', margin: '0 0 32px 0' }}>NOVYX HQ Admin</h2>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {['Users', 'Trees History', 'Audit Logs'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase())}
                style={{
                  textAlign: 'left',
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-control)',
                  border: 'none',
                  backgroundColor: activeTab === tab.toLowerCase() ? 'var(--primarySoft)' : 'transparent',
                  color: activeTab === tab.toLowerCase() ? 'var(--forestDepths)' : 'var(--pewter)',
                  fontWeight: activeTab === tab.toLowerCase() ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
              >
                {tab}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, padding: '40px 60px' }}>
          {activeTab === 'users' && <UsersPage />}
          {activeTab === 'trees history' && <TreeHistoryPage />}
          {activeTab === 'audit logs' && <AuditPage />}
        </main>
      </div>
    </>
  );
}

export default App;
