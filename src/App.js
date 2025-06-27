import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Shield, AlertTriangle, BarChart3, User, ChevronDown, RefreshCw } from 'lucide-react';

// Import data access control
import { useDataAccess } from './utils/dataAccessControl.js';

// Import Authentication
import { AuthProvider, useAuth, ProtectedRoute, UserProfile } from './auth/AuthContext.js';

// Import Visit Planner
import MRVisitPlannerDashboard from './visitPlanner/MRVisitPlannerDashboard';

// Import Forecasting Dashboard
import DistributorForecastDashboard from './forecasting/DistributorForecastDashboard';

const AyurvedicDashboard = () => {
  const [loading, setLoading] = useState(false); // Simplified loading since no data fetching needed
  const [activeTab, setActiveTab] = useState('visitplanner');
  const [showUserProfile, setShowUserProfile] = useState(false);
  
  // Auth hooks with data access control
  const { user, isAuthenticated, accessibleMRs } = useAuth();
  const dataAccess = useDataAccess(user, accessibleMRs);

  // Enhanced Navigation Component with User Profile - Mobile Responsive
  const EnhancedNavigation = ({ 
    activeTab, 
    setActiveTab
  }) => (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center py-3 md:py-4 space-y-3 md:space-y-0">
          
          {/* Logo and Navigation - Mobile Responsive */}
          <div className="flex flex-col md:flex-row items-center space-y-3 md:space-y-0 md:space-x-8 w-full md:w-auto">
            <h1 className="text-lg md:text-2xl font-bold text-green-700 text-center md:text-left">
              Kairali ML Analytics
            </h1>
            
            {/* Tab Navigation - Mobile Responsive */}
            <div className="flex flex-wrap justify-center md:justify-start gap-1 md:gap-2">
              {[
                // MR-specific tabs
                ...(dataAccess.hasAccess('mr') ? [
                  { id: 'visitplanner', label: 'Visit Planner', icon: MapPin, shortLabel: 'Planner' }
                ] : []),
                
                // Management/Admin tabs - Add forecasting for managers and admins
                ...(dataAccess.hasAccess('manager') || dataAccess.hasAccess('admin') ? [
                  { id: 'forecasting', label: 'Demand Forecasting', icon: BarChart3, shortLabel: 'Forecasting' }
                ] : [])
                
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  {/* Show short label on mobile, full label on desktop */}
                  <span className="md:hidden">{tab.shortLabel}</span>
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* User Profile Section - Mobile Responsive */}
          <div className="flex items-center justify-center md:justify-end w-full md:w-auto">
            {/* User Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowUserProfile(!showUserProfile)}
                className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-6 h-6 md:w-8 md:h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <User className="h-3 w-3 md:h-5 md:w-5 text-white" />
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs md:text-sm font-medium truncate max-w-32 md:max-w-none">{user?.full_name}</div>
                  <div className="text-xs text-gray-500">{user?.access_level}</div>
                </div>
                <ChevronDown className="h-3 w-3 md:h-4 md:w-4" />
              </button>
              
              {showUserProfile && (
                <div className="absolute right-0 mt-2 z-50">
                  <UserProfile />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );

  // Close user profile when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserProfile && !event.target.closest('.relative')) {
        setShowUserProfile(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserProfile]);

  // Loading state - Mobile Responsive
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-b-2 border-green-600 mx-auto mb-3 md:mb-4"></div>
          <div className="text-lg md:text-xl font-semibold">Loading Dashboard...</div>
          <div className="text-xs md:text-sm text-gray-600 mt-2">Applying access controls...</div>
        </div>
      </div>
    );
  }

  // Check if user has access to any tabs
  const hasVisitPlannerAccess = dataAccess.hasAccess('mr');
  const hasForecastingAccess = dataAccess.hasAccess('manager') || dataAccess.hasAccess('admin');

  // If user has no access to any tab, show appropriate message - Mobile Responsive
  if (!hasVisitPlannerAccess && !hasForecastingAccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <EnhancedNavigation 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-8">
          <div className="bg-white rounded-lg shadow-md p-6 md:p-12 text-center">
            <AlertTriangle className="h-12 w-12 md:h-16 md:w-16 text-yellow-500 mx-auto mb-3 md:mb-4" />
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">No Access Available</h3>
            <p className="text-sm md:text-base text-gray-600 mb-4">
              You don't have access to any dashboard features. Contact your administrator for access.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4 mt-4 md:mt-6">
              <div className="flex items-center justify-center">
                <Shield className="h-4 w-4 md:h-5 md:w-5 text-blue-600 mr-2" />
                <div className="text-xs md:text-sm text-blue-800">
                  <strong>Your Access Level:</strong> {user?.access_level?.toUpperCase() || 'Unknown'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Auto-select first available tab if current tab is not accessible
  React.useEffect(() => {
    if (activeTab === 'visitplanner' && !hasVisitPlannerAccess) {
      if (hasForecastingAccess) {
        setActiveTab('forecasting');
      }
    } else if (activeTab === 'forecasting' && !hasForecastingAccess) {
      if (hasVisitPlannerAccess) {
        setActiveTab('visitplanner');
      }
    }
  }, [activeTab, hasVisitPlannerAccess, hasForecastingAccess]);

  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedNavigation 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-8">
        {/* Visit Planner Tab */}
        {activeTab === 'visitplanner' && hasVisitPlannerAccess && (
          <MRVisitPlannerDashboard 
            userAccessLevel={user?.access_level}
            accessibleMRs={accessibleMRs}
            defaultMR={user?.access_level === 'mr' ? user?.mr_name : null}
          />
        )}
        
        {activeTab === 'visitplanner' && !hasVisitPlannerAccess && (
          <div className="bg-white rounded-lg shadow-md p-6 md:p-12 text-center">
            <AlertTriangle className="h-12 w-12 md:h-16 md:w-16 text-yellow-500 mx-auto mb-3 md:mb-4" />
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-sm md:text-base text-gray-600">
              Visit Planner requires MR or Manager access level. Contact your administrator for access.
            </p>
          </div>
        )}
        
        {/* Forecasting Tab */}
        {activeTab === 'forecasting' && hasForecastingAccess && (
          <DistributorForecastDashboard />
        )}
        
        {activeTab === 'forecasting' && !hasForecastingAccess && (
          <div className="bg-white rounded-lg shadow-md p-6 md:p-12 text-center">
            <AlertTriangle className="h-12 w-12 md:h-16 md:w-16 text-yellow-500 mx-auto mb-3 md:mb-4" />
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-sm md:text-base text-gray-600">
              Demand Forecasting requires Manager or Admin access level. Contact your administrator for access.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Main App Component with Authentication Provider
const App = () => {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AyurvedicDashboard />
      </ProtectedRoute>
    </AuthProvider>
  );
};

export default App;
