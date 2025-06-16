// src/auth/AuthContext.js - Authentication Context and Components

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Lock, User, AlertCircle, Eye, EyeOff, LogOut, Shield } from 'lucide-react';

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Create Auth Context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState(null);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('ayurml_session_token');
      const storedUser = localStorage.getItem('ayurml_user');

      if (storedToken && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          const isValid = await validateSession(storedToken);
          
          if (isValid) {
            setSessionToken(storedToken);
            setUser(userData);
          } else {
            // Clear invalid session
            localStorage.removeItem('ayurml_session_token');
            localStorage.removeItem('ayurml_user');
          }
        } catch (error) {
          console.error('Session validation failed:', error);
          localStorage.removeItem('ayurml_session_token');
          localStorage.removeItem('ayurml_user');
        }
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Validate session with backend
  const validateSession = async (token) => {
    try {
      const { data, error } = await supabase.rpc('validate_session', {
        p_session_token: token
      });

      if (error) throw error;
      return data && data.length > 0;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.rpc('authenticate_user', {
        p_email: email,
        p_password: password
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const userData = data[0];
        const token = userData.session_token;

        // Store in state
        setUser(userData);
        setSessionToken(token);

        // Store in localStorage
        localStorage.setItem('ayurml_session_token', token);
        localStorage.setItem('ayurml_user', JSON.stringify(userData));

        return { success: true, user: userData };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      if (sessionToken) {
        await supabase.rpc('logout_user', {
          p_session_token: sessionToken
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear state and localStorage
      setUser(null);
      setSessionToken(null);
      localStorage.removeItem('ayurml_session_token');
      localStorage.removeItem('ayurml_user');
    }
  };

  // Check if user has access to specific data
  const hasDataAccess = (mrName = null, territory = null, state = null) => {
    if (!user) return false;

    // Admin has access to everything
    if (user.access_level === 'admin') return true;

    // MR can only access their own data
    if (user.access_level === 'mr') {
      return mrName ? user.mr_name === mrName : true;
    }

    // Manager can access assigned territories/states
    if (user.access_level === 'manager') {
      if (user.assigned_territories?.includes('All')) return true;
      if (territory && user.assigned_territories?.includes(territory)) return true;
      if (state && user.assigned_states?.includes(state)) return true;
      return false;
    }

    // Viewer has read-only access (implement based on requirements)
    if (user.access_level === 'viewer') return true;

    return false;
  };

  // Get filtered MR name for queries
  const getFilteredMRName = () => {
    if (!user) return null;
    if (user.access_level === 'mr') return user.mr_name;
    return null; // Admin and manager can see all
  };

  const value = {
    user,
    sessionToken,
    loading,
    login,
    logout,
    hasDataAccess,
    getFilteredMRName,
    isAuthenticated: !!user,
    isAdmin: user?.access_level === 'admin',
    isManager: user?.access_level === 'manager',
    isMR: user?.access_level === 'mr',
    isViewer: user?.access_level === 'viewer'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Login Form Component
export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);
    
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
    
    setLoading(false);
  };

  const demoCredentials = [
    { email: 'admin@ayurml.com', role: 'Admin (Full Access)', password: 'admin123' },
    { email: 'manager@ayurml.com', role: 'Manager (Regional Access)', password: 'admin123' },
    { email: 'rajesh.kumar@ayurml.com', role: 'MR (Own Data Only)', password: 'admin123' },
    { email: 'vikram.sain@ayurml.com', role: 'MR (Own Data Only)', password: 'admin123' }
  ];

  const fillCredentials = (email, password) => {
    setEmail(email);
    setPassword(password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">AyurML Analytics</h1>
          <p className="text-gray-600 mt-2">AI-Powered Sales Intelligence Platform</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Demo Credentials */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Demo Credentials</h3>
          <div className="space-y-2">
            {demoCredentials.map((cred, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <div className="font-medium text-sm">{cred.role}</div>
                  <div className="text-xs text-gray-600">{cred.email}</div>
                </div>
                <button
                  onClick={() => fillCredentials(cred.email, cred.password)}
                  className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                >
                  Use
                </button>
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-gray-500">
            Click "Use" to auto-fill credentials. Default password for all accounts: admin123
          </div>
        </div>
      </div>
    </div>
  );
};

// User Profile Component
export const UserProfile = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const getAccessLevelColor = (level) => {
    switch (level) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'mr': return 'bg-green-100 text-green-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAccessLevelDescription = (level) => {
    switch (level) {
      case 'admin': return 'Full system access';
      case 'manager': return 'Regional data access';
      case 'mr': return 'Personal data only';
      case 'viewer': return 'Read-only access';
      default: return 'Limited access';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md p-4 w-80">
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
          <User className="h-6 w-6 text-white" />
        </div>
        <div>
          <div className="font-semibold text-gray-900">{user.full_name}</div>
          <div className="text-sm text-gray-600">{user.email}</div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Employee ID:</span>
          <span className="font-medium">{user.employee_id}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Access Level:</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAccessLevelColor(user.access_level)}`}>
            {user.access_level.toUpperCase()}
          </span>
        </div>

        {user.mr_name && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">MR Name:</span>
            <span className="font-medium">{user.mr_name}</span>
          </div>
        )}

        {user.assigned_territories && user.assigned_territories.length > 0 && (
          <div className="text-sm">
            <span className="text-gray-600">Territories:</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {user.assigned_territories.map((territory, index) => (
                <span key={index} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                  {territory}
                </span>
              ))}
            </div>
          </div>
        )}

        {user.assigned_states && user.assigned_states.length > 0 && (
          <div className="text-sm">
            <span className="text-gray-600">States:</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {user.assigned_states.map((state, index) => (
                <span key={index} className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs">
                  {state}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500 mb-4">
        {getAccessLevelDescription(user.access_level)}
      </div>

      <button
        onClick={logout}
        className="w-full flex items-center justify-center space-x-2 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
      >
        <LogOut className="h-4 w-4" />
        <span>Sign Out</span>
      </button>
    </div>
  );
};

// Protected Route Component
export const ProtectedRoute = ({ children, requiredLevel = null }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  // Check if user has required access level
  if (requiredLevel) {
    const levelHierarchy = { viewer: 1, mr: 2, manager: 3, admin: 4 };
    const userLevel = levelHierarchy[user.access_level] || 0;
    const reqLevel = levelHierarchy[requiredLevel] || 0;

    if (userLevel < reqLevel) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      );
    }
  }

  return children;
};

// Data Access Filter Hook
export const useDataFilter = () => {
  const { user, getFilteredMRName } = useAuth();

  const applyUserFilters = (baseFilters = {}) => {
    if (!user) return baseFilters;

    const userFilters = { ...baseFilters };

    // For MR users, always filter by their MR name
    if (user.access_level === 'mr') {
      userFilters.selectedMR = user.mr_name;
      userFilters.mrFilter = user.mr_name; // Additional filter key
    }

    // For manager users, apply territory/state filters if not already specified
    if (user.access_level === 'manager') {
      if (!userFilters.selectedState && user.assigned_states && !user.assigned_states.includes('All')) {
        // If user has only one state, auto-select it
        if (user.assigned_states.length === 1) {
          userFilters.selectedState = user.assigned_states[0];
        }
      }
    }

    return userFilters;
  };

  const getAvailableOptions = (type, allOptions = []) => {
    if (!user || user.access_level === 'admin') return allOptions;

    switch (type) {
      case 'mr':
        if (user.access_level === 'mr') {
          return [user.mr_name];
        }
        break;
      
      case 'state':
        if (user.access_level === 'manager' && user.assigned_states && !user.assigned_states.includes('All')) {
          return allOptions.filter(state => user.assigned_states.includes(state));
        }
        break;
      
      case 'territory':
        if (user.access_level === 'manager' && user.assigned_territories && !user.assigned_territories.includes('All')) {
          return allOptions.filter(territory => user.assigned_territories.includes(territory));
        }
        break;
    }

    return allOptions;
  };

  return {
    applyUserFilters,
    getAvailableOptions,
    getFilteredMRName,
    userAccessLevel: user?.access_level,
    canAccessAll: user?.access_level === 'admin'
  };
};
