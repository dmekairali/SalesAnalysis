// src/auth/AuthContext.js - With Hierarchy Support (Demo Credentials Removed)

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Lock, User, AlertCircle, Eye, EyeOff, LogOut, Shield, Users } from 'lucide-react';

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
  const [teamHierarchy, setTeamHierarchy] = useState(null);
  const [accessibleMRs, setAccessibleMRs] = useState([]);

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
            await loadUserHierarchy(userData.email);
            console.log('✅ Session restored for user:', userData.full_name);
          } else {
            // Clear invalid session
            localStorage.removeItem('ayurml_session_token');
            localStorage.removeItem('ayurml_user');
            console.log('❌ Invalid session, cleared storage');
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

  // Load user hierarchy and accessible MRs
  const loadUserHierarchy = async (email) => {
    try {
      // Get team hierarchy
      const { data: hierarchyData, error: hierarchyError } = await supabase.rpc('get_team_hierarchy', {
        p_user_email: email
      });

      if (!hierarchyError && hierarchyData && hierarchyData.length > 0) {
        setTeamHierarchy(hierarchyData[0]);
        console.log('📊 Team hierarchy loaded:', hierarchyData[0]);
      }

      // Get accessible MRs
      const { data: accessibleData, error: accessibleError } = await supabase.rpc('get_accessible_mrs', {
        p_user_email: email
      });

      if (!accessibleError && accessibleData) {
        setAccessibleMRs(accessibleData);
        console.log('👥 Accessible MRs:', accessibleData);
      }

    } catch (error) {
      console.error('Error loading user hierarchy:', error);
    }
  };

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
      console.log('🔐 Attempting login for:', email);
      
      const { data, error } = await supabase.rpc('authenticate_user', {
        p_email: email,
        p_password: password
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const userData = data[0];
        const token = userData.session_token;

        console.log('✅ Login successful for:', userData.full_name, 'Access Level:', userData.access_level);

        // Store in state
        setUser(userData);
        setSessionToken(token);

        // Store in localStorage
        localStorage.setItem('ayurml_session_token', token);
        localStorage.setItem('ayurml_user', JSON.stringify(userData));

        // Load hierarchy data
        await loadUserHierarchy(userData.email);

        return { success: true, user: userData };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      return { success: false, error: error.message };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      console.log('🚪 Logging out user:', user?.full_name);
      
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
      setTeamHierarchy(null);
      setAccessibleMRs([]);
      localStorage.removeItem('ayurml_session_token');
      localStorage.removeItem('ayurml_user');
      console.log('✅ Logout completed');
    }
  };

  // Check if user can access specific MR data
  const canAccessMRData = (mrName) => {
    if (!user) return false;
    if (user.access_level === 'admin') return true;
    return accessibleMRs.includes(mrName);
  };

  // Get team members for current user
  const getTeamMembers = () => {
    if (!teamHierarchy) return [];
    return teamHierarchy.direct_reports || [];
  };

  const value = {
    user,
    sessionToken,
    loading,
    login,
    logout,
    teamHierarchy,
    accessibleMRs,
    canAccessMRData,
    getTeamMembers,
    isAuthenticated: !!user,
    isAdmin: user?.access_level === 'admin',
    isManager: user?.access_level === 'manager',
    isMR: user?.access_level === 'mr',
    isViewer: user?.access_level === 'viewer'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Login Form Component - Demo Credentials Removed
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
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Sign In</h2>
          
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

          {/* Optional: Add forgot password link */}
          <div className="mt-4 text-center">
            <a href="#" className="text-sm text-green-600 hover:text-green-700">
              Forgot your password?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced User Profile Component with Hierarchy
export const UserProfile = () => {
  const { user, logout, teamHierarchy, accessibleMRs, getTeamMembers } = useAuth();

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
      case 'manager': return `Team access (${accessibleMRs.length} MRs)`;
      case 'mr': return 'Personal data only';
      case 'viewer': return 'Read-only access';
      default: return 'Limited access';
    }
  };

  const teamMembers = getTeamMembers();

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md p-4 w-96 max-h-96 overflow-y-auto">
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

        {/* Hierarchy Information */}
        {user.access_level === 'mr' && (
          <div className="text-sm border-t pt-2">
            <span className="text-gray-600 block mb-1">Reporting Structure:</span>
            {user.reporting_manager && (
              <div className="text-xs text-gray-500">RM: {user.reporting_manager}</div>
            )}
            {user.area_sales_manager && (
              <div className="text-xs text-gray-500">ASM: {user.area_sales_manager}</div>
            )}
            {user.regional_sales_manager && (
              <div className="text-xs text-gray-500">RSM: {user.regional_sales_manager}</div>
            )}
          </div>
        )}

        {/* Team Members for Managers */}
        {user.access_level === 'manager' && teamMembers.length > 0 && (
          <div className="text-sm border-t pt-2">
            <div className="flex items-center mb-1">
              <Users className="h-3 w-3 text-gray-600 mr-1" />
              <span className="text-gray-600">Team Members ({teamMembers.length}):</span>
            </div>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {teamMembers.map((member, index) => (
                <div key={index} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                  {member.full_name} ({member.mr_name})
                </div>
              ))}
            </div>
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

        {/* Data Access Summary */}
        {accessibleMRs.length > 0 && (
          <div className="text-sm border-t pt-2">
            <span className="text-gray-600">Data Access ({accessibleMRs.length} MRs):</span>
            <div className="mt-1 max-h-16 overflow-y-auto">
              {accessibleMRs.slice(0, 5).map((mrName, index) => (
                <div key={index} className="text-xs text-gray-600">• {mrName}</div>
              ))}
              {accessibleMRs.length > 5 && (
                <div className="text-xs text-gray-500">...and {accessibleMRs.length - 5} more</div>
              )}
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
