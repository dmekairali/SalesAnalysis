// src/App.js - Enhanced with Loading States and Global State Management

import React, { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { TrendingUp, ShoppingCart, Users, MapPin, Package, Brain, Star, XOctagon, Search, X, RefreshCw, User, ChevronDown, Shield, AlertTriangle, CheckCircle, Database, BarChart3 } from 'lucide-react';
import { formatIndianCurrency, formatCurrencyByContext } from './data.js';

// Import modules
import { initializeData, COLORS, calculateKPIs, getUniqueValues, fetchDashboardOrders } from './data.js';

// Import data access control
import { useDataAccess } from './utils/dataAccessControl.js';

import { 
  Navigation, 
  KPICard, 
  MLInsightsCompact, 
  SalesDriversCompact,
  SalesTrendChart,
  FulfillmentChart
} from './components.js';
import { EnhancedOverviewFilters, SearchableDropdown } from './enhancedFilters.js';

// Import Authentication
import { AuthProvider, useAuth, ProtectedRoute, UserProfile } from './auth/AuthContext.js';

// Import Visit Planner
import MRVisitPlannerDashboard from './visitPlanner/MRVisitPlannerDashboard';

// Global app state for persistent data
const AppStateContext = React.createContext();

export const useAppState = () => {
  const context = React.useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
};

// App State Provider for persistent data across tabs
export const AppStateProvider = ({ children }) => {
  const [globalState, setGlobalState] = useState({
    visitPlan: null,
    analyticsData: null,
    lastGeneratedMR: null,
    lastGeneratedMonth: null,
    lastGeneratedYear: null,
    overviewData: null,
    lastDataFetch: null
  });

  // Persist visit plan data
  const setVisitPlanData = (planData, mrName, month, year) => {
    setGlobalState(prev => ({
      ...prev,
      visitPlan: planData,
      lastGeneratedMR: mrName,
      lastGeneratedMonth: month,
      lastGeneratedYear: year
    }));
    console.log('📦 Visit plan data cached for:', mrName, month, year);
  };

  // Persist analytics data
  const setAnalyticsData = (analyticsData, mrName) => {
    setGlobalState(prev => ({
      ...prev,
      analyticsData: analyticsData,
      lastAnalyticsMR: mrName
    }));
    console.log('📊 Analytics data cached for:', mrName);
  };

  // Persist overview data
  const setOverviewData = (overviewData) => {
    setGlobalState(prev => ({
      ...prev,
      overviewData: overviewData,
      lastDataFetch: new Date().toISOString()
    }));
    console.log('💾 Overview data cached');
  };

  // Clear specific data
  const clearVisitPlanData = () => {
    setGlobalState(prev => ({
      ...prev,
      visitPlan: null,
      lastGeneratedMR: null,
      lastGeneratedMonth: null,
      lastGeneratedYear: null
    }));
  };

  const clearAnalyticsData = () => {
    setGlobalState(prev => ({
      ...prev,
      analyticsData: null,
      lastAnalyticsMR: null
    }));
  };

  const value = {
    ...globalState,
    setVisitPlanData,
    setAnalyticsData,
    setOverviewData,
    clearVisitPlanData,
    clearAnalyticsData
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
};

// Enhanced Loading Component
const DashboardLoadingScreen = ({ loadingStep, isInitialLoad = true }) => {
  const loadingSteps = [
    { id: 1, name: 'Fetching order data', icon: Database, status: 'pending' },
    { id: 2, name: 'Loading dashboard metrics', icon: BarChart3, status: 'pending' },
    { id: 3, name: 'Applying access controls', icon: Shield, status: 'pending' },
    { id: 4, name: 'Preparing visualizations', icon: TrendingUp, status: 'pending' }
  ];

  const currentSteps = loadingSteps.map((step, index) => ({
    ...step,
    status: index < loadingStep ? 'completed' : 
            index === loadingStep ? 'active' : 'pending'
  }));

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="text-center bg-white rounded-lg shadow-md p-8 max-w-md w-full mx-4">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-6"></div>
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900">
            {isInitialLoad ? 'Loading Dashboard Data...' : 'Refreshing Data...'}
          </h3>
          <p className="text-sm text-gray-600">
            {isInitialLoad ? 
              'Setting up your personalized dashboard with latest data' : 
              'Updating with the latest information'
            }
          </p>

          {/* Progress bar */}
          <div className="mt-6 mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{Math.round((loadingStep / 4) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-green-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(loadingStep / 4) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Step list */}
          <div className="space-y-3 text-left">
            {currentSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                    step.status === 'completed' ? 'bg-green-100 text-green-600' :
                    step.status === 'active' ? 'bg-blue-100 text-blue-600' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {step.status === 'completed' ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : step.status === 'active' ? (
                      <Icon className="w-5 h-5 animate-pulse" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className={`text-sm ${
                    step.status === 'completed' ? 'text-green-700 font-medium' :
                    step.status === 'active' ? 'text-blue-700 font-medium' :
                    'text-gray-500'
                  }`}>
                    {step.name}
                    {step.status === 'active' && '...'}
                    {step.status === 'completed' && ' ✓'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Helpful tip */}
          <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              💡 <strong>Pro tip:</strong> Your data will be cached to load faster on subsequent visits!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const AyurvedicDashboard = () => {
  const { user, isAuthenticated, accessibleMRs } = useAuth();
  const { overviewData, setOverviewData } = useAppState();
  
  // State management
  const [orderData, setOrderData] = useState([]);
  const [dashboardOrderData, setDashboardOrderData] = useState([]);
  const [loading, setLoading] = useState(!overviewData); // Use cached data if available
  const [loadingStep, setLoadingStep] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [showMLAnalytics, setShowMLAnalytics] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Filters state
  const [filters, setFilters] = useState({
    selectedCustomerType: null,
    selectedMRName: null,
    selectedState: null,
    selectedTerritory: null,
    selectedDeliveryStatus: null,
    selectedFulfillment: null
  });

  // Data access control
  const dataAccess = useDataAccess(user, accessibleMRs);

  // Check if cached data is stale (older than 30 minutes)
  const isDataStale = () => {
    if (!overviewData?.timestamp) return true;
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    return new Date(overviewData.timestamp) < thirtyMinutesAgo;
  };

  // Enhanced data loading with progress tracking
  useEffect(() => {
    const loadDashboardData = async () => {
      if (overviewData && !isDataStale()) {
        // Use cached data if not stale
        console.log('📦 Using cached overview data');
        setOrderData(overviewData.orderData || []);
        setDashboardOrderData(overviewData.dashboardOrderData || []);
        setLoading(false);
        return;
      }

      console.log('📊 Loading dashboard data for user:', user?.full_name, '| Access Level:', user?.access_level);
      console.log('👥 Accessible MRs:', accessibleMRs);

      try {
        setLoading(true);
        setLoadingStep(0);

        // Step 1: Fetch order data
        setLoadingStep(1);
        await new Promise(resolve => setTimeout(resolve, 800)); // Realistic delay
        const data = await initializeData();
        console.log('✅ Order data loaded');

        // Step 2: Load dashboard metrics
        setLoadingStep(2);
        await new Promise(resolve => setTimeout(resolve, 600));
        const dashboardData = await fetchDashboardOrders();
        console.log('✅ Dashboard metrics loaded');

        // Step 3: Apply access controls
        setLoadingStep(3);
        await new Promise(resolve => setTimeout(resolve, 400));
        const filteredData = dataAccess.filterOrderData(data);
        const filteredDashboardData = dataAccess.filterDashboardData(dashboardData);
        console.log('✅ Access controls applied');

        // Step 4: Prepare visualizations
        setLoadingStep(4);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        setOrderData(filteredData);
        setDashboardOrderData(filteredDashboardData);
        
        // Cache the data
        setOverviewData({
          orderData: filteredData,
          dashboardOrderData: filteredDashboardData,
          timestamp: new Date().toISOString()
        });

        console.log('✅ Data loaded and filtered successfully');
        console.log('📈 Total Orders Available:', data.length);
        console.log('🔒 User Accessible Orders:', filteredData.length);
        console.log('📊 Dashboard Orders:', filteredDashboardData.length);

        // Get data scope for logging
        const dataScope = dataAccess.getDataScope(data, dashboardData);
        console.log('🎯 Data Scope:', dataScope);
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setLoading(false);
      }
    };

    if (isAuthenticated && user) {
      loadDashboardData();
    }
  }, [isAuthenticated, user, accessibleMRs]);

  // Export function
  const exportWithMLInsights = () => {
    console.log('📤 Exporting data with ML insights...');
    // Your existing export logic
  };

  // Get data scope for display
  const dataScope = useMemo(() => {
    if (!orderData.length || !dashboardOrderData.length) return null;
    return dataAccess.getDataScope(orderData, dashboardOrderData);
  }, [orderData, dashboardOrderData, dataAccess]);

  // Enhanced Navigation Component
  const EnhancedNavigation = ({ 
    activeTab, 
    setActiveTab, 
    notifications, 
    showNotifications, 
    setShowNotifications,
    exportWithMLInsights,
    showMLAnalytics,
    setShowMLAnalytics,
    filters,
    setFilters
  }) => (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Kairali ML Analytics</h1>
              <p className="text-sm text-gray-600">AI-Powered Sales Intelligence</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <TrendingUp className="h-4 w-4 mr-2 inline" />
              Overview
            </button>
            
            {dataAccess.hasAccess('mr') && (
              <button
                onClick={() => setActiveTab('visitplanner')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'visitplanner'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <MapPin className="h-4 w-4 mr-2 inline" />
                Visit Planner
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {/* ML Analytics Toggle */}
            <button
              onClick={() => setShowMLAnalytics(!showMLAnalytics)}
              className={`flex items-center justify-center w-full md:w-auto px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showMLAnalytics 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Brain className="h-4 w-4 mr-1" />
              ML
            </button>

            {/* Export */}
            <button 
              onClick={exportWithMLInsights}
              className="flex items-center justify-center w-full md:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Package className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>
    </nav>
  );

  // Overview Tab Component with Access Control
  const OverviewTab = () => {
    const { selectedFulfillment } = filters;
    const areChartFiltersActive = !!(selectedFulfillment);

    const clearChartFilters = () => {
      setFilters(prev => ({
        ...prev,
        selectedFulfillment: null
      }));
    };

    return (
      <div className="space-y-6">
        {/* Enhanced User Access Info Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <Shield className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <h4 className="font-semibold text-blue-800 flex items-center">
                  Welcome, {user?.full_name}!
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    user?.access_level === 'admin' ? 'bg-red-100 text-red-800' :
                    user?.access_level === 'manager' ? 'bg-blue-100 text-blue-800' :
                    user?.access_level === 'mr' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user?.access_level?.toUpperCase()}
                  </span>
                </h4>
                <p className="text-blue-700 text-sm">{dataAccess.getAccessMessage()}</p>
              </div>
            </div>
            {dataScope && (
              <div className="text-right text-sm">
                <div className="text-blue-800 font-medium">Data Coverage</div>
                <div className="flex items-center space-x-4 text-blue-700">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{dataScope.uniqueCustomers}</div>
                    <div className="text-sm text-gray-600">Customers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{dataScope.uniqueStates}</div>
                    <div className="text-sm text-gray-600">States Covered</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{dataScope.accessPercentage}%</div>
                    <div className="text-sm text-gray-600">System Coverage</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cached Data Indicator */}
        {overviewData && !isDataStale() && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-sm text-green-800">
              ✓ Showing cached data from {new Date(overviewData.timestamp).toLocaleTimeString()}
              <button 
                onClick={() => {
                  setOverviewData(null);
                  window.location.reload();
                }}
                className="ml-2 text-green-600 hover:text-green-700 underline"
              >
                Refresh
              </button>
            </span>
          </div>
        )}

        {/* Your existing overview content components */}
        {/* Add your KPI cards, charts, and other overview components here */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Example KPI Cards - replace with your actual components */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-2">Total Revenue</h3>
            <p className="text-3xl font-bold text-green-600">
              ₹{formatIndianCurrency(orderData.reduce((sum, order) => sum + (order.amount || 0), 0))}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-2">Total Orders</h3>
            <p className="text-3xl font-bold text-blue-600">{orderData.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-2">Active Customers</h3>
            <p className="text-3xl font-bold text-purple-600">{dataScope?.uniqueCustomers || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-2">Coverage</h3>
            <p className="text-3xl font-bold text-orange-600">{dataScope?.accessPercentage || 0}%</p>
          </div>
        </div>
      </div>
    );
  };

  // Loading state with progress
  if (loading) {
    return <DashboardLoadingScreen loadingStep={loadingStep} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedNavigation 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        notifications={notifications}
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
        exportWithMLInsights={exportWithMLInsights}
        showMLAnalytics={showMLAnalytics}
        setShowMLAnalytics={setShowMLAnalytics}
        filters={filters}
        setFilters={setFilters}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'visitplanner' && dataAccess.hasAccess('mr') && (
          <MRVisitPlannerDashboard 
            userAccessLevel={user?.access_level}
            accessibleMRs={accessibleMRs}
            defaultMR={user?.access_level === 'mr' ? user?.mr_name : null}
          />
        )}
        {activeTab === 'visitplanner' && !dataAccess.hasAccess('mr') && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-600">
              Visit Planner requires MR or Manager access level. Contact your administrator for access.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Main App Component with All Providers
const App = () => {
  return (
    <AuthProvider>
      <AppStateProvider>
        <ProtectedRoute>
          <AyurvedicDashboard />
        </ProtectedRoute>
      </AppStateProvider>
    </AuthProvider>
  );
};

export default App;
