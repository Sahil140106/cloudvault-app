import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from '../components/UserProfile';
import { FileUpload } from '../components/FileUpload';
import { FileList } from '../components/FileList';

export const Dashboard = () => {
  const { token, refreshProfile } = useAuth();
  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [stats, setStats] = useState(null);

  const fetchFiles = async () => {
    try {
      const res = await fetch('/api/files', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch (err) {
      console.error('Failed to load files:', err);
    } finally {
      setLoadingFiles(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchFiles();
      fetchStats();
    }
  }, [token]);

  const handleUploadSuccess = () => {
    fetchFiles();
    fetchStats();
    refreshProfile();
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file from AWS Storage?')) {
      return;
    }

    try {
      const res = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        setFiles(files.filter(f => f.id !== fileId));
        fetchStats();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete file');
      }
    } catch (err) {
      alert('Error deleting file: ' + err.message);
    }
  };

  return (
    <div>
      <UserProfile stats={stats} />
      <FileUpload onUploadSuccess={handleUploadSuccess} />
      <FileList 
        files={files} 
        loading={loadingFiles} 
        onDeleteFile={handleDeleteFile} 
      />
    </div>
  );
};

