import React from 'react';
import { User, Mail, Calendar, HardDrive, Files, Key, Database, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const UserProfile = ({ stats }) => {
  const { user, awsStatus } = useAuth();

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (iso) => {
    if (!iso) return 'Today';
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div>
      {/* Quick stats row */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
            <Files size={22} />
          </div>
          <div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Total Cloud Files</p>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700 }}>{stats?.totalFiles || 0}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(255, 153, 0, 0.15)', color: 'var(--primary)' }}>
            <HardDrive size={22} />
          </div>
          <div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Storage Used</p>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700 }}>{formatSize(stats?.totalBytes)}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80' }}>
            <Database size={22} />
          </div>
          <div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Database Record</p>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#4ade80' }}>
              {awsStatus?.isAwsConfigured ? 'AWS DynamoDB' : 'Active (Local/AWS ready)'}
            </h3>
          </div>
        </div>
      </div>

      {/* User profile card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <img
              src={user?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.name || 'User'}`}
              alt="Avatar"
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                border: '3px solid var(--primary)',
                background: '#1e293b'
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>{user?.name}</h2>
                <span style={{
                  fontSize: '0.7rem',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '999px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <ShieldCheck size={12} /> Verified User
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
                <Mail size={14} /> {user?.email}
              </p>
            </div>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'flex-end', marginBottom: '0.25rem' }}>
              <Calendar size={13} />
              <span>Joined {formatDate(user?.createdAt)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'flex-end', fontFamily: 'monospace', fontSize: '0.75rem' }}>
              <Key size={12} />
              <span>ID: {user?.id?.substring(0, 16)}...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

