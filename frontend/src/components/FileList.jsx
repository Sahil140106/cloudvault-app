import React, { useState } from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  Download, 
  Trash2, 
  ExternalLink, 
  Search, 
  Filter, 
  Cloud, 
  Calendar,
  HardDrive
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const FileList = ({ files, loading, onDeleteFile }) => {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const filteredFiles = files.filter(f => {
    const matchesFilter = filter === 'all' || f.fileCategory === filter;
    const matchesSearch = f.originalName.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="card" style={{ marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Your Cloud Files ({files.length})</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Documents and media synced with AWS S3 & DynamoDB
            </p>
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', minWidth: '220px' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2.2rem', paddingRight: '0.75rem', paddingTop: '0.5rem', paddingBottom: '0.5rem', fontSize: '0.85rem' }}
            />
          </div>
        </div>

        {/* Filter Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['all', 'image', 'document'].map((category) => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`btn btn-sm ${filter === category ? 'btn-primary' : 'btn-outline'}`}
              style={{ textTransform: 'capitalize' }}
            >
              {category === 'all' ? 'All Files' : category === 'image' ? 'Images' : 'Documents'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading your AWS records...
        </div>
      ) : filteredFiles.length === 0 ? (
        <div style={{ padding: '3.5rem 1rem', textAlign: 'center', background: '#0f172a', borderRadius: '12px' }}>
          <Cloud size={40} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.35rem' }}>No files found</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {files.length === 0 
              ? 'Upload your first image or document above to store in AWS S3!'
              : 'No files match your current search and filter.'}
          </p>
        </div>
      ) : (
        <div className="file-grid">
          {filteredFiles.map((file) => {
            const isImage = file.fileCategory === 'image' || file.fileType.startsWith('image/');
            const fileUrl = file.presignedUrl || file.downloadUrl || file.fileUrl;

            return (
              <div key={file.id} className="file-card">
                <div>
                  <div className="preview-container">
                    {isImage ? (
                      <img 
                        src={fileUrl} 
                        alt={file.originalName} 
                        className="preview-image"
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                        <FileText size={36} />
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                          {file.originalName.split('.').pop() || 'DOC'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <h4 
                      title={file.originalName}
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginBottom: '0.35rem'
                      }}
                    >
                      {file.originalName}
                    </h4>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>{formatSize(file.fileSize)}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={12} />
                        {formatDate(file.createdAt)}
                      </span>
                    </div>

                    <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{
                        fontSize: '0.68rem',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        background: file.storageType === 'aws_s3' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 153, 0, 0.15)',
                        color: file.storageType === 'aws_s3' ? '#4ade80' : '#fbbf24',
                        fontWeight: 600
                      }}>
                        {file.storageType === 'aws_s3' ? 'AWS S3' : 'Local Disk'}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm"
                    style={{ flex: 1, textDecoration: 'none' }}
                  >
                    <Download size={14} />
                    <span>View</span>
                  </a>
                  <button
                    onClick={() => onDeleteFile(file.id)}
                    className="btn btn-danger btn-sm"
                    title="Delete permanently"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

