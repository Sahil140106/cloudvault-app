import React from 'react';
import { Cloud, Database, HardDrive, Key, Zap, Shield, CheckCircle, Info, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AwsStatusModal = ({ isOpen, onClose }) => {
  const { awsStatus } = useAuth();

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1rem'
    }}>
      <div className="card" style={{ maxWidth: '680px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'var(--primary-light)', padding: '0.5rem', borderRadius: '8px', color: 'var(--primary)' }}>
              <Cloud size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>AWS Serverless Architecture</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>IAM + DynamoDB + S3 + Lambda Integration</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* 4 Core AWS Services Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
          {/* IAM */}
          <div style={{ background: '#162032', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <Shield size={18} color="#f59e0b" />
              <strong style={{ fontSize: '0.9rem' }}>AWS IAM (Security)</strong>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Controls least-privilege access keys and Execution Roles connecting Lambda to S3 & DynamoDB.
            </p>
          </div>

          {/* DynamoDB */}
          <div style={{ background: '#162032', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <Database size={18} color="#38bdf8" />
              <strong style={{ fontSize: '0.9rem' }}>AWS DynamoDB (Database)</strong>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Stores user authentication profiles & uploaded file metadata in NoSQL tables.
            </p>
          </div>

          {/* S3 */}
          <div style={{ background: '#162032', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <HardDrive size={18} color="var(--primary)" />
              <strong style={{ fontSize: '0.9rem' }}>AWS S3 (File Storage)</strong>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Securely holds images and documents (PDF, DOCX) with CORS & presigned download URLs.
            </p>
          </div>

          {/* Lambda */}
          <div style={{ background: '#162032', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <Zap size={18} color="#ec4899" />
              <strong style={{ fontSize: '0.9rem' }}>AWS Lambda (Compute)</strong>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Serverless execution: Handles signup/login logic & S3 ObjectCreated event triggers.
            </p>
          </div>
        </div>

        {/* Current status */}
        <div style={{
          background: awsStatus?.isAwsConfigured ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 153, 0, 0.1)',
          border: `1px solid ${awsStatus?.isAwsConfigured ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255, 153, 0, 0.3)'}`,
          borderRadius: '10px',
          padding: '1rem',
          marginBottom: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
            {awsStatus?.isAwsConfigured ? (
              <>
                <CheckCircle size={18} color="var(--accent-green)" />
                <strong style={{ color: 'var(--accent-green)', fontSize: '0.9rem' }}>Live AWS Connected ({awsStatus.region})</strong>
              </>
            ) : (
              <>
                <Info size={18} color="var(--primary)" />
                <strong style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>Local Sandbox Mode (AWS SDK Ready)</strong>
              </>
            )}
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Code is fully wired with AWS SDK v3. To switch to your live AWS account, paste your IAM keys in <code>backend/.env</code>.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-primary btn-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
