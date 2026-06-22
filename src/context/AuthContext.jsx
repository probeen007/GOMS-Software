import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize Axios and verify token on mount
  useEffect(() => {
    const verifyUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Set Axios default authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Fetch current user details
        const response = await axios.get('/api/auth/me');
        setUser(response.data);
      } catch (error) {
        console.error('Failed to verify token:', error.message);
        // Clear invalid token
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyUser();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token, user: userData } = response.data;

      // Persist token
      localStorage.setItem('token', token);
      
      // Update Axios auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Set user state
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error('Login request failed:', error);
      let message = 'Login failed. Please check your credentials.';
      if (error.code === 'ERR_NETWORK' || !error.response) {
        message = 'Cannot connect to the backend server. Please verify the Express server is running on port 5000.';
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }
      return { 
        success: false, 
        message 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
