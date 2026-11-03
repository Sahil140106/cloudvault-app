import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Cloud, Database, LogOut, User as UserIcon, CheckCircle2, AlertCircle } from 'lucide-react';

export const Navbar = ({ onOpenAwsModal }) => {
  const { user, logout, awsStatus } = useAuth();

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-logo">
          <div style={{
            background: 'linear-gradient(135deg, #ff9900, #ff5500)',
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#000'
          }}>
            <Cloud size={22} strokeWidth={2.5} />
          </div>
          <div>
            <span>Cloud<span style={{ color: 'var(--primary)' }}>Vault</span></span>
            <span style={{ fontSize: '0.65rem', display: 'block', color: 'var(--text-muted)', lineHeight: 1 }}>
              AWS Full-Stack System
            </span>
          </div>
        </div>

        <div className="nav-actions">
          {/* AWS Status indicator badge */}
          <button 
            onClick={onOpenAwsModal}
            className={`status-pill ${awsStatus?.isAwsConfigured ? 'aws-live' : 'aws-local'}`}
            style={{ cursor: 'pointer', border: 'none' }}
            title="Click to view AWS Cloud Infrastructure details"
          >
            {awsStatus?.isAwsConfigured ? (
              <>
                <CheckCircle2 size={13} />
                <span>AWS Connected ({awsStatus.region})</span>
              </>
            ) : (
              <>
                <AlertCircle size={13} />
                <span>Local Sandbox Mode (AWS Ready)</span>
              </>
            )}
          </button>

          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <img 
                  src={user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}`} 
                  alt={user.name} 
                  style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#334155', border: '2px solid var(--border-color)' }}
                />
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user.name}</span>
              </div>
              <button 
                onClick={logout} 
                className="btn btn-outline btn-sm"
                title="Sign out"
              >
                <LogOut size={15} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

