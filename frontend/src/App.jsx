import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AwsStatusModal } from './components/AwsStatusBanner';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';

export function App() {
  const { user, loading } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [isAwsModalOpen, setIsAwsModalOpen] = useState(false);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading AWS CloudVault...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar onOpenAwsModal={() => setIsAwsModalOpen(true)} />
      
      <main className="main-content">
        {!user ? (
          authView === 'login' ? (
            <Login onSwitchToRegister={() => setAuthView('register')} />
          ) : (
            <Register onSwitchToLogin={() => setAuthView('login')} />
          )
        ) : (
          <Dashboard />
        )}
      </main>

      <AwsStatusModal 
        isOpen={isAwsModalOpen} 
        onClose={() => setIsAwsModalOpen(false)} 
      />
    </div>
  );
}

export default App;

