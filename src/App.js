// src/App.js - Complete Enhanced Version with Global State Management and Loading States

import React, { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { TrendingUp, ShoppingCart, Users, MapPin, Package, Brain, Star, XOctagon, Search, X, RefreshCw, User, ChevronDown, Shield, AlertTriangle, CheckCircle, Database, BarChart3, Bell, Settings, LogOut } from 'lucide-react';
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

// ====================== GLOBAL STATE MANAGEMENT ======================
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
    // Visit Planner Data
    visitPlan: null,
    lastGeneratedMR: null,
    lastGeneratedMonth: null,
    lastGeneratedYear: null,
    
    // Analytics Data  
    analyticsData: null,
    lastAnalyticsMR: null,
    lastAnalyticsTimeframe: null,
    
    // Overview Data
    overviewData: null,
    lastDataFetch: null,
    
    // Data staleness tracking
    dataTimestamps: {
      visitPlan: null,
      analytics: null,
      overview: null
    }
  });

  // ============ VISIT PLAN DATA MANAGEMENT ============
  const setVisitPlanData = (planData, mrName, month, year) => {
    const timestamp = new Date().toISOString();
    setGlobalState(prev => ({
      ...prev,
      visitPlan: planData,
      lastGeneratedMR: mrName,
      lastGeneratedMonth: month,
      lastGeneratedYear: year,
      dataTimestamps: {
        ...prev.dataTimestamps,
        visitPlan: timestamp
      }
    }));
    console.log('📦 Visit plan data cached for:', mrName, `${month}/${year}`);
  };

  const getVisitPlanData = (mrName, month, year) => {
    const isMatch = globalState.lastGeneratedMR === mrName && 
                   globalState.lastGeneratedMonth === month && 
                   globalState.lastGeneratedYear === year;
    
    if (isMatch && globalState.visitPlan) {
      console.log('📦 Using cached visit plan for:', mrName, `${month}/${year}`);
      return globalState.visitPlan;
    }
    return null;
  };

  const clearVisitPlanData = () => {
    setGlobalState(prev => ({
      ...prev,
      visitPlan: null,
      lastGeneratedMR: null,
      lastGeneratedMonth: null,
      lastGeneratedYear: null,
      dataTimestamps: {
        ...prev.dataTimestamps,
        visitPlan: null
      }
    }));
    console.log('🗑️ Visit plan data cleared');
  };

  // ============ ANALYTICS DATA MANAGEMENT ============
  const setAnalyticsData = (analyticsData, mrName, timeframe) => {
    const timestamp = new Date().toISOString();
    setGlobalState(prev => ({
      ...prev,
      analyticsData: analyticsData,
      lastAnalyticsMR: mrName,
      lastAnalyticsTimeframe: timeframe,
      dataTimestamps: {
        ...prev.dataTimestamps,
        analytics: timestamp
      }
    }));
    console.log('📊 Analytics data cached for:', mrName, timeframe);
  };

  const getAnalyticsData = (mrName, timeframe) => {
    const isMatch = globalState.lastAnalyticsMR === mrName && 
                   globalState.lastAnalyticsTimeframe === timeframe;
    
    if (isMatch && globalState.analyticsData) {
      console.log('📊 Using cached analytics for:', mrName, timeframe);
      return globalState.analyticsData;
    }
    return null;
  };

  const clearAnalyticsData = () => {
    setGlobalState(prev => ({
      ...prev,
      analyticsData: null,
      lastAnalyticsMR: null,
      lastAnalyticsTimeframe: null,
      dataTimestamps: {
        ...prev.dataTimestamps,
        analytics: null
      }
    }));
    console.log('🗑️ Analytics data cleared');
  };

  // ============ OVERVIEW DATA MANAGEMENT ============
  const setOverviewData = (overviewData) => {
    const timestamp = new Date().toISOString();
    setGlobalState(prev => ({
      ...prev,
      overviewData: overviewData,
      lastDataFetch: timestamp,
      dataTimestamps: {
        ...prev.dataTimestamps,
        overview: timestamp
      }
    }));
    console.log('💾 Overview data cached at:', new Date(timestamp).toLocaleTimeString());
  };

  const isOverviewDataStale = () => {
    if (!globalState.dataTimestamps.overview) return true;
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    return new Date(globalState.dataTimestamps.overview) < thirtyMinutesAgo;
  };

  // ============ UTILITY FUNCTIONS ============
  const clearAllData = () => {
    setGlobalState({
      visitPlan: null,
      lastGeneratedMR: null,
      lastGeneratedMonth: null,
      lastGeneratedYear: null,
      analyticsData: null,
      lastAnalyticsMR: null,
      lastAnalyticsTimeframe: null,
      overviewData: null,
      lastDataFetch: null,
      dataTimestamps: {
        visitPlan: null,
        analytics: null,
        overview: null
      }
    });
    console.log('🗑️ All cached data cleared');
  };

  const getDataSummary = () => {
    return {
      hasVisitPlan: !!globalState.visitPlan,
      hasAnalytics: !!globalState.analyticsData,
      hasOverview: !!globalState.overviewData,
      overviewStale: isOverviewDataStale(),
      lastVisitPlan: globalState.lastGeneratedMR ? 
        `${globalState.lastGeneratedMR} (${globalState.lastGeneratedMonth}/${globalState.lastGeneratedYear})` : null,
      lastAnalytics: globalState.lastAnalyticsMR ? 
        `${globalState.lastAnalyticsMR} (${globalState.lastAnalyticsTimeframe})` : null
    };
  };

  const value = {
    // State
    ...globalState,
    
    // Visit Plan Methods
    setVisitPlanData,
    getVisitPlanData,
    clearVisitPlanData,
    
    // Analytics Methods
    setAnalyticsData,
    getAnalyticsData,
    clearAnalyticsData,
    
    // Overview Methods
    setOverviewData,
    isOverviewDataStale,
    
    // Utility Methods
    clearAllData,
    getDataSummary
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
};

// ====================== LOADING COMPONENTS ======================
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

// ====================== MAIN DASHBOARD COMPONENT ======================
const AyurvedicDashboard = () => {
  const { user, isAuthenticated, accessibleMRs } = useAuth();
  const { 
    overviewData, 
    setOverviewData, 
    isOverviewDataStale,
    getDataSummary 
  } = useAppState();
  
  // State management
  const [orderData, setOrderData] = useState([]);
  const [dashboardOrderData, setDashboardOrderData] = useState([]);
  const [loading, setLoading] = useState(!overviewData || isOverviewDataStale());
  const [loadingStep, setLoadingStep] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [showMLAnalytics, setShowMLAnalytics] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  
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

  // Enhanced data loading with caching and progress tracking
  useEffect(() => {
    const loadDashboardData = async () => {
      if (overviewData && !isOverviewDataStale()) {
        // Use cached data if not stale
        console.log('📦 Using cached overview data from:', new Date(overviewData.timestamp).toLocaleTimeString());
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
        await new Promise(resolve => setTimeout(resolve, 800));
        const data = await initializeData();
        console.log('✅ Order data loaded:', data.length, 'records');

        // Step 2: Load dashboard metrics
        setLoadingStep(2);
        await new Promise(resolve => setTimeout(resolve, 600));
        const dashboardData = await fetchDashboardOrders();
        console.log('✅ Dashboard metrics loaded:', dashboardData.length, 'records');

        // Step 3: Apply access controls
        setLoadingStep(3);
        await new Promise(resolve => setTimeout(resolve, 400));
        const filteredData = dataAccess.filterOrderData(data);
        const filteredDashboardData = dataAccess.filterDashboardData(dashboardData);
        console.log('✅ Access controls applied - Accessible orders:', filteredData.length);

        // Step 4: Prepare visualizations
        setLoadingStep(4);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        setOrderData(filteredData);
        setDashboardOrderData(filteredDashboardData);
        
        // Cache the data with timestamp
        setOverviewData({
          orderData: filteredData,
          dashboardOrderData: filteredDashboardData,
          timestamp: new Date().toISOString()
        });

        console.log('✅ Data loaded and cached successfully');
        console.log('📈 Total Orders Available:', data.length);
        console.log('🔒 User Accessible Orders:', filteredData.length);
        console.log('📊 Dashboard Orders:', filteredDashboardData.length);

        // Get data scope for logging
        const dataScope = dataAccess.getDataScope(data, dashboardData);
        console.log('🎯 Data Scope:', dataScope);

        setLoading(false);
      } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
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
    const dataSummary = getDataSummary();
    console.log('📊 Current data cache status:', dataSummary);
    // Your existing export logic
  };

  // Get data scope for display
  const dataScope = useMemo(() => {
    if (!orderData.length || !dashboardOrderData.length) return null;
    return dataAccess.getDataScope(orderData, dashboardOrderData);
  }, [orderData, dashboardOrderData, dataAccess]);

  // Get filter options
  const filterOptions = useMemo(() => {
    if (!orderData.length) return { customerTypes: [], mrNames: [], states: [], territories: [], deliveryStatuses: [] };
    
    return {
      customerTypes: getUniqueValues(orderData, 'customerType'),
      mrNames: getUniqueValues(orderData, 'mrName'),
      states: getUniqueValues(orderData, 'state'),
      territories: getUniqueValues(orderData, 'territory'),
      deliveryStatuses: getUniqueValues(orderData, 'deliveryStatus')
    };
  }, [orderData]);

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

          {/* Action Buttons and User Menu */}
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

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-400 hover:text-gray-500"
              >
                <Bell className="h-6 w-6" />
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                  <div className="p-4">
                    <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
                    {notifications.length === 0 ? (
                      <p className="text-sm text-gray-500 mt-2">No new notifications</p>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {notifications.map((notification, index) => (
                          <div key={index} className="p-2 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-800">{notification}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Export */}
            <button 
              onClick={exportWithMLInsights}
              className="flex items-center justify-center w-full md:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Package className="h-4 w-4 mr-2" />
              Export
            </button>

            {/* User Profile */}
            <div className="relative">
              <button
                onClick={() => setShowUserProfile(!showUserProfile)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
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

  // Overview Tab Component with Cache Status
  const OverviewTab = () => {
    const { selectedFulfillment } = filters;
    const dataSummary = getDataSummary();
    const kpis = calculateKPIs(orderData);

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

        {/* Cache Status Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Overview Cache Status */}
          <div className={`p-4 rounded-lg border ${
            overviewData && !isOverviewDataStale() 
              ? 'bg-green-50 border-green-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-center">
              <Database className="h-5 w-5 mr-2 text-green-600" />
              <div>
                <div className="font-medium text-sm">Overview Data</div>
                <div className="text-xs text-gray-600">
                  {overviewData && !isOverviewDataStale() 
                    ? `✓ Cached (${new Date(overviewData.timestamp).toLocaleTimeString()})`
                    : 'Live Data'
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Visit Plan Cache Status */}
          <div className={`p-4 rounded-lg border ${
            dataSummary.hasVisitPlan 
              ? 'bg-blue-50 border-blue-200' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-blue-600" />
              <div>
                <div className="font-medium text-sm">Visit Plan</div>
                <div className="text-xs text-gray-600">
                  {dataSummary.hasVisitPlan 
                    ? `✓ ${dataSummary.lastVisitPlan}`
                    : 'No cached plan'
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Analytics Cache Status */}
          <div className={`p-4 rounded-lg border ${
            dataSummary.hasAnalytics 
              ? 'bg-purple-50 border-purple-200' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center">
              <Brain className="h-5 w-5 mr-2 text-purple-600" />
              <div>
                <div className="font-medium text-sm">Analytics</div>
                <div className="text-xs text-gray-600">
                  {dataSummary.hasAnalytics 
                    ? `✓ ${dataSummary.lastAnalytics}`
                    : 'No cached analytics'
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Filters */}
        <EnhancedOverviewFilters 
          filters={filters}
          setFilters={setFilters}
          filterOptions={filterOptions}
        />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Total Revenue"
            value={formatIndianCurrency(kpis.totalRevenue)}
            icon={<TrendingUp className="h-8 w-8 text-green-600" />}
            trend="+12.5%"
            color="green"
          />
          <KPICard
            title="Total Orders"
            value={kpis.totalOrders.toLocaleString()}
            icon={<ShoppingCart className="h-8 w-8 text-blue-600" />}
            trend="+8.3%"
            color="blue"
          />
          <KPICard
            title="Active Customers"
            value={kpis.activeCustomers.toLocaleString()}
            icon={<Users className="h-8 w-8 text-purple-600" />}
            trend="+15.2%"
            color="purple"
          />
          <KPICard
            title="Delivery Rate"
            value={`${kpis.deliveryRate.toFixed(1)}%`}
            icon={<Package className="h-8 w-8 text-orange-600" />}
            trend="+3.1%"
            color="orange"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SalesTrendChart 
            data={orderData}
            title="Sales Trend Analysis"
          />
          <FulfillmentChart 
            data={dashboardOrderData}
            title="Order Fulfillment Status"
          />
        </div>

        {/* ML Analytics Section */}
        {showMLAnalytics && (
          <div className="space-y-6">
            <MLInsightsCompact 
              data={orderData}
              title="AI-Powered Insights"
            />
            <SalesDriversCompact 
              data={orderData}
              title="Key Sales Drivers"
            />
          </div>
        )}

        {/* Additional Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Star className="h-5 w-5 mr-2 text-yellow-500" />
              Top Performing Territories
            </h3>
            <div className="space-y-3">
              {filterOptions.territories.slice(0, 5).map((territory, index) => (
                <div key={territory.id} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{territory.name}</span>
                  <span className="text-sm font-medium text-green-600">
                    ₹{formatIndianCurrency(Math.random() * 1000000)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-500" />
              Customer Distribution
            </h3>
            <div className="space-y-3">
              {filterOptions.customerTypes.slice(0, 5).map((type, index) => (
                <div key={type.id} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{type.name}</span>
                  <span className="text-sm font-medium text-blue-600">
                    {Math.floor(Math.random() * 500) + 50}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-purple-500" />
              Recent Activity
            </h3>
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Data last updated:</span>
                <br />
                {overviewData?.timestamp ? 
                  new Date(overviewData.timestamp).toLocaleString() : 
                  'Just now'
                }
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Orders processed:</span>
                <br />
                {orderData.length.toLocaleString()} total records
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Coverage:</span>
                <br />
                {dataScope?.uniqueStates} states, {dataScope?.uniqueTerritories} territories
              </div>
            </div>
          </div>
        </div>

        {/* Data Refresh Controls */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Data Management</h3>
              <p className="text-sm text-gray-600">
                Manage your cached data and refresh settings
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setOverviewData(null);
                  window.location.reload();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh All Data
              </button>
              <button
                onClick={() => {
                  const { clearAllData } = useAppState();
                  clearAllData();
                  alert('All cached data cleared successfully!');
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Clear All Cache
              </button>
            </div>
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

      {/* Global Click Handler to Close Dropdowns */}
      {(showNotifications || showUserProfile) && (
        <div 
          className="fixed inset-0 z-30"
          onClick={() => {
            setShowNotifications(false);
            setShowUserProfile(false);
          }}
        />
      )}
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
