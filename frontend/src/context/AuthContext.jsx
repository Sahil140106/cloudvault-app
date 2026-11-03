import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('cloudvault_token') || null);
  const [loading, setLoading] = useState(true);
  const [awsStatus, setAwsStatus] = useState(null);

  // Safe JSON parser helper
  const parseResponse = async (res) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      if (!res.ok) {
        throw new Error(
          res.status === 504 || res.status === 502
            ? 'Backend server connect nahi ho pa raha (Port 5000 band hai). Kripya Terminal me "node src/server.js" chalayein.'
            : text || 'Server ne valid JSON response nahi diya.'
        );
      }
      return {};
    }
  };

  // Fetch current user and AWS status if token exists
  const fetchUser = async (authToken) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (res.ok) {
        const data = await parseResponse(res);
        setUser(data.user);
        setAwsStatus(data.awsStatus);
      } else {
        logout();
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await parseResponse(res);
    if (!res.ok) throw new Error(data.error || 'Login failed');

    localStorage.setItem('cloudvault_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    
    const data = await parseResponse(res);
    if (!res.ok) throw new Error(data.error || 'Registration failed');

    localStorage.setItem('cloudvault_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('cloudvault_token');
    setToken(null);
    setUser(null);
    setAwsStatus(null);
  };

  const refreshProfile = async () => {
    if (token) await fetchUser(token);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, awsStatus, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
