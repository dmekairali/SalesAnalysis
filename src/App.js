import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Shield, AlertTriangle, BarChart3, User, ChevronDown, RefreshCw, Search } from 'lucide-react';

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
  
  const [filters, setFilters] = useState({
    searchTerm: ''
  });

  // Enhanced Navigation Component with User Profile and Forecasting
  const EnhancedNavigation = ({ 
    activeTab, 
    setActiveTab, 
    filters, 
    setFilters 
  }) => (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center py-4 md:space-y-0 space-y-4">
          <div className="flex flex-col md:flex-row items-center md:space-x-8 md:space-y-0 space-y-4">
            <h1 className="text-2xl font-bold text-green-700">
              Kairali ML Analytics
            </h1>
            <div className="flex flex-wrap space-x-1">
              {[
                // MR-specific tabs
                ...(dataAccess.hasAccess('mr') ? [
                  { id: 'visitplanner', label: 'Visit Planner', icon: MapPin }
                ] : []),
                
                // Management/Admin tabs - Add forecasting for managers and admins
                ...(dataAccess.hasAccess('manager') || dataAccess.hasAccess('admin') ? [
                  { id: 'forecasting', label: 'Demand Forecasting', icon: BarChart3 }
                ] : [])
                
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center w-full md:w-auto md:space-x-4 md:space-y-0 space-y-4">
            {/* Search */}
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowUserProfile(!showUserProfile)}
                className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium">{user?.full_name}</div>
                  <div className="text-xs text-gray-500">{user?.access_level}</div>
                </div>
                <ChevronDown className="h-4 w-4" />
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

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <div className="text-xl font-semibold">Loading Dashboard...</div>
          <div className="text-sm text-gray-600 mt-2">Applying access controls...</div>
        </div>
      </div>
    );
  }

  // Check if user has access to any tabs
  const hasVisitPlannerAccess = dataAccess.hasAccess('mr');
  const hasForecastingAccess = dataAccess.hasAccess('manager') || dataAccess.hasAccess('admin');

  // If user has no access to any tab, show appropriate message
  if (!hasVisitPlannerAccess && !hasForecastingAccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <EnhancedNavigation 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          filters={filters}
          setFilters={setFilters}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Access Available</h3>
            <p className="text-gray-600 mb-4">
              You don't have access to any dashboard features. Contact your administrator for access.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <div className="flex items-center justify-center">
                <Shield className="h-5 w-5 text-blue-600 mr-2" />
                <div className="text-sm text-blue-800">
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
        filters={filters}
        setFilters={setFilters}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Visit Planner Tab */}
        {activeTab === 'visitplanner' && hasVisitPlannerAccess && (
          <MRVisitPlannerDashboard 
            userAccessLevel={user?.access_level}
            accessibleMRs={accessibleMRs}
            defaultMR={user?.access_level === 'mr' ? user?.mr_name : null}
          />
        )}
        
        {activeTab === 'visitplanner' && !hasVisitPlannerAccess && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-600">
              Visit Planner requires MR or Manager access level. Contact your administrator for access.
            </p>
          </div>
        )}
        
        {/* Forecasting Tab */}
        {activeTab === 'forecasting' && hasForecastingAccess && (
          <DistributorForecastDashboard />
        )}
        
        {activeTab === 'forecasting' && !hasForecastingAccess && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-600">
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
