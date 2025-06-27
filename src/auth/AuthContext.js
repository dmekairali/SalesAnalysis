// src/auth/AuthContext.js - Enhanced with Loading States, Data Persistence, and Mobile Responsiveness

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Lock, User, AlertCircle, Eye, EyeOff, LogOut, Shield, Users, CheckCircle } from 'lucide-react';

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

// Auth Provider Component with Enhanced Loading States
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialDataLoading, setInitialDataLoading] = useState(true); // NEW: Initial data loading state
  const [sessionToken, setSessionToken] = useState(null);
  const [teamHierarchy, setTeamHierarchy] = useState(null);
  const [accessibleMRs, setAccessibleMRs] = useState([]);
  
  // Loading progress tracking
  const [loadingProgress, setLoadingProgress] = useState({
    step: 0,
    totalSteps: 4,
    steps: [
      { id: 1, name: 'Validating session', status: 'pending' },
      { id: 2, name: 'Loading user permissions', status: 'pending' },
      { id: 3, name: 'Fetching team hierarchy', status: 'pending' },
      { id: 4, name: 'Preparing dashboard', status: 'pending' }
    ]
  });

  // Helper to update loading progress
  const updateLoadingProgress = (stepNumber, status = 'completed') => {
    setLoadingProgress(prev => ({
      ...prev,
      step: stepNumber,
      steps: prev.steps.map((step, index) => {
        if (index + 1 < stepNumber) return { ...step, status: 'completed' };
        if (index + 1 === stepNumber) return { ...step, status };
        return step;
      })
    }));
  };

  // Initialize auth state with enhanced loading
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('ayurml_session_token');
      const storedUser = localStorage.getItem('ayurml_user');

      if (storedToken && storedUser) {
        try {
          // Step 1: Validate session
          updateLoadingProgress(1, 'active');
          await new Promise(resolve => setTimeout(resolve, 500)); // Realistic delay
          
          const userData = JSON.parse(storedUser);
          const isValid = await validateSession(storedToken);
          
          if (isValid) {
            updateLoadingProgress(1, 'completed');
            
            // Step 2: Load user permissions
            updateLoadingProgress(2, 'active');
            await new Promise(resolve => setTimeout(resolve, 300));
            
            setSessionToken(storedToken);
            setUser(userData);
            updateLoadingProgress(2, 'completed');
            
            // Step 3: Load hierarchy
            updateLoadingProgress(3, 'active');
            await loadUserHierarchy(userData.email);
            updateLoadingProgress(3, 'completed');
            
            // Step 4: Prepare dashboard
            updateLoadingProgress(4, 'active');
            await new Promise(resolve => setTimeout(resolve, 400));
            updateLoadingProgress(4, 'completed');
            
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
      // Complete initial data loading after a short delay
      setTimeout(() => setInitialDataLoading(false), 500);
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

  // Enhanced login function with progress tracking
  const login = async (email, password) => {
    try {
      setInitialDataLoading(true);
      setLoadingProgress({
        step: 0,
        totalSteps: 4,
        steps: [
          { id: 1, name: 'Authenticating credentials', status: 'pending' },
          { id: 2, name: 'Loading user profile', status: 'pending' },
          { id: 3, name: 'Fetching permissions', status: 'pending' },
          { id: 4, name: 'Initializing dashboard', status: 'pending' }
        ]
      });

      console.log('🔐 Attempting login for:', email);
      
      // Step 1: Authenticate
      updateLoadingProgress(1, 'active');
      const { data, error } = await supabase.rpc('authenticate_user', {
        p_email: email,
        p_password: password
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const userData = data[0];
        const token = userData.session_token;
        updateLoadingProgress(1, 'completed');

        console.log('✅ Login successful for:', userData.full_name, 'Access Level:', userData.access_level);

        // Step 2: Store user data
        updateLoadingProgress(2, 'active');
        await new Promise(resolve => setTimeout(resolve, 400));
        
        setUser(userData);
        setSessionToken(token);
        localStorage.setItem('ayurml_session_token', token);
        localStorage.setItem('ayurml_user', JSON.stringify(userData));
        updateLoadingProgress(2, 'completed');

        // Step 3: Load hierarchy data
        updateLoadingProgress(3, 'active');
        await loadUserHierarchy(userData.email);
        updateLoadingProgress(3, 'completed');

        // Step 4: Initialize dashboard
        updateLoadingProgress(4, 'active');
        await new Promise(resolve => setTimeout(resolve, 600));
        updateLoadingProgress(4, 'completed');

        setInitialDataLoading(false);

        return { success: true, user: userData };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      setInitialDataLoading(false);
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
    initialDataLoading, // NEW: Expose initial data loading state
    loadingProgress, // NEW: Expose loading progress
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

// Enhanced Login Form Component with Better Loading States - Mobile Responsive
export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, loadingProgress, initialDataLoading } = useAuth();

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

  // Show loading progress during login - Mobile Responsive
  if (loading || initialDataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-3 md:p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
            <div className="text-center mb-4 md:mb-6">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                <Shield className="h-6 w-6 md:h-8 md:w-8 text-white" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                {loading ? 'Signing You In...' : 'Loading Dashboard...'}
              </h3>
              <p className="text-xs md:text-sm text-gray-600 mt-2">Please wait while we prepare your workspace</p>
            </div>

            {/* Progress bar - Mobile Responsive */}
            <div className="mb-4 md:mb-6">
              <div className="flex justify-between text-xs md:text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{Math.round((loadingProgress.step / loadingProgress.totalSteps) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 md:h-3">
                <div 
                  className="bg-green-600 h-2 md:h-3 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${(loadingProgress.step / loadingProgress.totalSteps) * 100}%` 
                  }}
                ></div>
              </div>
            </div>

            {/* Step list - Mobile Responsive */}
            <div className="space-y-2 md:space-y-3">
              {loadingProgress.steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center mr-2 md:mr-3 flex-shrink-0 ${
                    step.status === 'completed' ? 'bg-green-100 text-green-600' :
                    step.status === 'active' ? 'bg-blue-100 text-blue-600' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {step.status === 'completed' ? (
                      <CheckCircle className="w-3 h-3 md:w-4 md:h-4" />
                    ) : step.status === 'active' ? (
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-blue-600 rounded-full animate-pulse"></div>
                    ) : (
                      <span className="text-xs">{index + 1}</span>
                    )}
                  </div>
                  <span className={`text-xs md:text-sm ${
                    step.status === 'completed' ? 'text-green-700' :
                    step.status === 'active' ? 'text-blue-700' :
                    'text-gray-500'
                  }`}>
                    {step.name}
                    {step.status === 'active' && '...'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-3 md:p-4">
      <div className="max-w-md w-full">
        {/* Logo and Title - Mobile Responsive */}
        <div className="text-center mb-6 md:mb-8">
          <div className="flex justify-center mb-3 md:mb-4">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-green-600 rounded-full flex items-center justify-center">
              <Shield className="h-6 w-6 md:h-8 md:w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Kairali ML Analytics</h1>
          <p className="text-sm md:text-base text-gray-600 mt-2">AI-Powered Sales Intelligence Platform</p>
        </div>

        {/* Login Form - Mobile Responsive */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4">Sign In</h2>
          
          <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center">
                <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-red-600 mr-2 flex-shrink-0" />
                <span className="text-sm md:text-base text-red-700">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 md:pl-10 pr-4 py-2.5 md:py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 md:pl-10 pr-11 md:pr-12 py-2.5 md:py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4 md:h-5 md:w-5" /> : <Eye className="h-4 w-4 md:h-5 md:w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-2.5 md:py-2 px-4 text-sm md:text-base rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Optional: Add forgot password link */}
          <div className="mt-3 md:mt-4 text-center">
            <a href="#" className="text-xs md:text-sm text-green-600 hover:text-green-700">
              Forgot your password?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced User Profile Component with Hierarchy - Mobile Responsive
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
    <div className="bg-white border border-gray-200 rounded-lg shadow-md p-3 md:p-4 w-80 md:w-96 max-h-80 md:max-h-96 overflow-y-auto">
      <div className="flex items-center space-x-2 md:space-x-3 mb-3">
        <div className="w-8 h-8 md:w-10 md:h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4 md:h-6 md:w-6 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-sm md:text-base text-gray-900 truncate">{user.full_name}</div>
          <div className="text-xs md:text-sm text-gray-600 truncate">{user.email}</div>
        </div>
      </div>

      <div className="space-y-2 mb-3 md:mb-4">
        <div className="flex justify-between text-xs md:text-sm">
          <span className="text-gray-600">Employee ID:</span>
          <span className="font-medium">{user.employee_id}</span>
        </div>
        
        <div className="flex justify-between text-xs md:text-sm items-center">
          <span className="text-gray-600">Access Level:</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAccessLevelColor(user.access_level)}`}>
            {user.access_level.toUpperCase()}
          </span>
        </div>

        {user.mr_name && (
          <div className="flex justify-between text-xs md:text-sm">
            <span className="text-gray-600">MR Name:</span>
            <span className="font-medium truncate ml-2">{user.mr_name}</span>
          </div>
        )}

        {/* Hierarchy Information - Mobile Responsive */}
        {user.access_level === 'mr' && (
          <div className="text-xs md:text-sm border-t pt-2">
            <span className="text-gray-600 block mb-1">Reporting Structure:</span>
            {user.reporting_manager && (
              <div className="text-xs text-gray-500 truncate">RM: {user.reporting_manager}</div>
            )}
            {user.area_sales_manager && (
              <div className="text-xs text-gray-500 truncate">ASM: {user.area_sales_manager}</div>
            )}
            {user.regional_sales_manager && (
              <div className="text-xs text-gray-500 truncate">RSM: {user.regional_sales_manager}</div>
            )}
          </div>
        )}

        {/* Team Members for Managers - Mobile Responsive */}
        {user.access_level === 'manager' && teamMembers.length > 0 && (
          <div className="text-xs md:text-sm border-t pt-2">
            <div className="flex items-center mb-1">
              <Users className="h-3 w-3 text-gray-600 mr-1 flex-shrink-0" />
              <span className="text-gray-600">Team Members ({teamMembers.length}):</span>
            </div>
            <div className="space-y-1 max-h-16 md:max-h-20 overflow-y-auto">
              {teamMembers.map((member, index) => (
                <div key={index} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs truncate">
                  {member.full_name} ({member.mr_name})
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Territories - Mobile Responsive */}
        {user.assigned_territories && user.assigned_territories.length > 0 && (
          <div className="text-xs md:text-sm">
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

        {/* States - Mobile Responsive */}
        {user.assigned_states && user.assigned_states.length > 0 && (
          <div className="text-xs md:text-sm">
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

        {/* Data Access Summary - Mobile Responsive */}
        {accessibleMRs.length > 0 && (
          <div className="text-xs md:text-sm border-t pt-2">
            <span className="text-gray-600">Data Access ({accessibleMRs.length} MRs):</span>
            <div className="mt-1 max-h-12 md:max-h-16 overflow-y-auto">
              {accessibleMRs.slice(0, 5).map((mrName, index) => (
                <div key={index} className="text-xs text-gray-600 truncate">• {mrName}</div>
              ))}
              {accessibleMRs.length > 5 && (
                <div className="text-xs text-gray-500">...and {accessibleMRs.length - 5} more</div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500 mb-3 md:mb-4">
        {getAccessLevelDescription(user.access_level)}
      </div>

      <button
        onClick={logout}
        className="w-full flex items-center justify-center space-x-2 bg-red-600 text-white py-2 px-4 text-sm rounded-lg hover:bg-red-700 transition-colors"
      >
        <LogOut className="h-3 w-3 md:h-4 md:w-4" />
        <span>Sign Out</span>
      </button>
    </div>
  );
};

// Enhanced Protected Route Component - Mobile Responsive
export const ProtectedRoute = ({ children, requiredLevel = null }) => {
  const { user, loading, initialDataLoading, loadingProgress } = useAuth();

  if (loading || initialDataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-3 md:p-4">
        <div className="text-center bg-white rounded-lg shadow-md p-6 md:p-8 max-w-md w-full">
          <div className="animate-spin rounded-full h-12 w-12 md:h-16 md:w-16 border-b-4 border-green-600 mx-auto mb-4 md:mb-6"></div>
          <div className="space-y-2 md:space-y-3">
            <h3 className="text-lg md:text-xl font-semibold text-gray-900">
              {initialDataLoading ? 'Loading Dashboard Data...' : 'Authenticating...'}
            </h3>
            <div className="text-xs md:text-sm text-gray-600 space-y-1">
              {loadingProgress.steps.map((step, index) => (
                <p key={step.id} className={
                  step.status === 'completed' ? 'text-green-600' :
                  step.status === 'active' ? 'text-blue-600' :
                  'text-gray-400'
                }>
                  {step.status === 'completed' ? '✓' : step.status === 'active' ? '•' : '○'} {step.name}
                  {step.status === 'active' && '...'}
                </p>
              ))}
            </div>
            <div className="mt-3 md:mt-4 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(loadingProgress.step / loadingProgress.totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>
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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-3 md:p-4">
          <div className="text-center bg-white rounded-lg shadow-md p-6 md:p-8 max-w-md w-full">
            <AlertCircle className="h-12 w-12 md:h-16 md:w-16 text-red-500 mx-auto mb-3 md:mb-4" />
            <h2 className="text-lg md:text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-sm md:text-base text-gray-600">You don't have permission to access this page.</p>
            <div className="mt-4 p-3 bg-red-50 rounded-lg">
              <p className="text-xs md:text-sm text-red-700">
                Required: <span className="font-semibold">{requiredLevel.toUpperCase()}</span> level access
              </p>
              <p className="text-xs md:text-sm text-red-700">
                Your level: <span className="font-semibold">{user.access_level.toUpperCase()}</span>
              </p>
            </div>
          </div>
        </div>
      );
    }
  }

  return children;
};
