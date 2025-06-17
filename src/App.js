import React, { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { TrendingUp, ShoppingCart, Users, MapPin, Package, Brain, Star, XOctagon, Search, X, RefreshCw, User, ChevronDown } from 'lucide-react';
import { formatIndianCurrency, formatCurrencyByContext } from './data.js';

// Import modules
import { initializeData, COLORS, calculateKPIs, getUniqueValues, fetchDashboardOrders } from './data.js';

import { 
  Navigation, 
  KPICard, 
  MLInsightsCompact, 
  SalesDriversCompact,
  SalesTrendChart,
  FulfillmentChart
} from './components.js';
import { EnhancedOverviewFilters, SearchableDropdown } from './enhancedFilters.js';

// Import Authentication (Step 1 - Simple Auth)
import { AuthProvider, useAuth, ProtectedRoute, UserProfile } from './auth/AuthContext.js';

// Import Visit Planner
import MRVisitPlannerDashboard from './visitPlanner/MRVisitPlannerDashboard';

const AyurvedicDashboard = () => {
  const [orderData, setOrderData] = useState([]);
  const [dashboardOrderData, setDashboardOrderData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showMLAnalytics, setShowMLAnalytics] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  
  // Auth hooks (Step 1 - Just get user info, no filtering yet)
  const { user, isAuthenticated } = useAuth();
  
  const [filters, setFilters] = useState({
    dateRange: ['', ''],
    searchTerm: '',
    selectedFulfillment: null,
    selectedMR: null,
    selectedFulfillmentCenter: null,
    selectedState: null
  });
  const [isFiltersVisible, setIsFiltersVisible] = useState(true);
  const [pendingFilters, setPendingFilters] = useState(filters);

  // Load data (no user filtering yet)
  useEffect(() => {
    const loadData = async () => {
      if (!isAuthenticated) return;
      
      try {
        setLoading(true);
        console.log('📊 Loading dashboard data for user:', user?.full_name, '| Access Level:', user?.access_level);
        
        const { sampleOrderData: fetchedOrders } = await initializeData();
        setOrderData(fetchedOrders || []);

        const fetchedDashboardOrders = await fetchDashboardOrders();
        setDashboardOrderData(fetchedDashboardOrders || []);

       
        
        console.log('✅ Data loaded successfully');
        console.log('📈 Orders:', fetchedOrders?.length || 0);
        console.log('📊 Dashboard Orders:', fetchedDashboardOrders?.length || 0);
        
      } catch (error) {
        console.error("❌ Error initializing data:", error);
        setOrderData([]);
        setDashboardOrderData([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [isAuthenticated, user]);

  useEffect(() => {
    console.log('[DataLoad_Debug] orderData state updated. Total Length:', orderData.length);
  }, [orderData]);

  // Real-time notifications
  useEffect(() => {
    if (!isAuthenticated || orderData.length === 0) return;
    
    const interval = setInterval(() => {
      const newOrder = orderData[Math.floor(Math.random() * orderData.length)];
      const notification = {
        id: Date.now(),
        message: `🔔 New order ${newOrder.orderId} from ${newOrder.customerName}`,
        amount: newOrder.netAmount,
        timestamp: new Date().toLocaleTimeString(),
        type: 'new_order',
        ml_prediction: `Predicted next order: ₹${(newOrder.netAmount * 1.15).toFixed(0)}`
      };
      setNotifications(prev => [notification, ...prev.slice(0, 4)]);
    }, 20000);

    return () => clearInterval(interval);
  }, [orderData, isAuthenticated]);

  // Create filteredData based on filters (no user filtering yet)
  const filteredData = useMemo(() => {
    let data = orderData;

    // Apply date range filter
    if (filters.dateRange?.[0] || filters.dateRange?.[1]) {
      const startDate = filters.dateRange[0] ? new Date(filters.dateRange[0]) : null;
      const endDate = filters.dateRange[1] ? new Date(filters.dateRange[1]) : null;
      
      data = data.filter(order => {
        const orderDate = new Date(order.date);
        if (startDate && orderDate < startDate) return false;
        if (endDate && orderDate > endDate) return false;
        return true;
      });
    }

    // Apply search term filter
    if (filters.searchTerm) {
      const lowerSearchTerm = filters.searchTerm.toLowerCase();
      data = data.filter(order =>
        order.orderId.toLowerCase().includes(lowerSearchTerm) ||
        order.customerName.toLowerCase().includes(lowerSearchTerm) ||
        order.productName.toLowerCase().includes(lowerSearchTerm) ||
        order.category.toLowerCase().includes(lowerSearchTerm) ||
        order.city.toLowerCase().includes(lowerSearchTerm)
      );
    }

    // Apply MR filter
    if (filters.selectedMR) {
      data = data.filter(order => 
        (order.medicalRepresentative || order.salesRepresentative || 'N/A') === filters.selectedMR
      );
    }

    // Apply fulfillment center filter
    if (filters.selectedFulfillmentCenter) {
      data = data.filter(order => order.deliveredFrom === filters.selectedFulfillmentCenter);
    }

    // Apply state filter
    if (filters.selectedState) {
      data = data.filter(order => order.state === filters.selectedState);
    }

    // Apply fulfillment filter (existing chart filter)
    if (filters.selectedFulfillment) {
      data = data.filter(order => order.deliveredFrom === filters.selectedFulfillment);
    }

    return data;
  }, [filters, orderData]);

  // Create filteredDashboardData based on filters (no user filtering yet)
  const filteredDashboardData = useMemo(() => {
    let data = dashboardOrderData.map(o => ({
      orderId: o.orderId,
      date: o.date,
      customerName: o.customerName,
      customerId: o.customerId,
      customerType: o.customerType,
      city: o.city,
      state: o.state,
      territory: o.territory,
      medicalRepresentative: o.medicalRepresentative,
      netAmount: o.netAmount,
      deliveredFrom: o.deliveredFrom,
      discountTier: o.discountTier,
      deliveryStatus: o.deliveryStatus,
      products: o.products || [],
      categories: o.categories || [],
      totalQuantity: o.totalQuantity || 0,
      lineItemsCount: o.lineItemsCount || 0
    }));

    // Apply the same filters as above
    // Apply date range filter
    if (filters.dateRange?.[0] || filters.dateRange?.[1]) {
      const startDate = filters.dateRange[0] ? new Date(filters.dateRange[0]) : null;
      const endDate = filters.dateRange[1] ? new Date(filters.dateRange[1]) : null;

      data = data.filter(order => {
        if (!order.date) return false;
        const orderDateAttempt = new Date(order.date);
        if (isNaN(orderDateAttempt.getTime())) {
            return false;
        }
        const orderDate = orderDateAttempt;
        if (startDate && orderDate < startDate) return false;
        if (endDate && orderDate > endDate) return false;
        return true;
      });
    }

    // Apply search term filter
    if (filters.searchTerm) {
      const lowerSearchTerm = filters.searchTerm.toLowerCase();
      data = data.filter(order =>
        (order.orderId && order.orderId.toLowerCase().includes(lowerSearchTerm)) ||
        (order.customerName && order.customerName.toLowerCase().includes(lowerSearchTerm)) ||
        (order.products && order.products.some(p => p.toLowerCase().includes(lowerSearchTerm))) ||
        (order.categories && order.categories.some(c => c.toLowerCase().includes(lowerSearchTerm))) ||
        (order.city && order.city.toLowerCase().includes(lowerSearchTerm))
      );
    }

    // Apply MR filter
    if (filters.selectedMR) {
      data = data.filter(order =>
        (order.medicalRepresentative || 'N/A') === filters.selectedMR
      );
    }

    // Apply fulfillment center filter
    if (filters.selectedFulfillmentCenter) {
      data = data.filter(order => order.deliveredFrom === filters.selectedFulfillmentCenter);
    }

    // Apply state filter
    if (filters.selectedState) {
      data = data.filter(order => order.state === filters.selectedState);
    }

    // Apply fulfillment filter (existing chart filter)
    if (filters.selectedFulfillment) {
      data = data.filter(order => order.deliveredFrom === filters.selectedFulfillment);
    }

    return data;
  }, [filters, dashboardOrderData]);

  // Enhanced export function with user info
  const exportWithMLInsights = () => {
    const kpis = calculateKPIs(filteredData);
    const exportData = [
      ['=== AYURVEDIC SALES REPORT WITH ML INSIGHTS ==='],
      [''],
      ['User Info:'],
      [`User: ${user?.full_name} (${user?.access_level})`],
      [`Access Level: ${user?.access_level}`],
      user?.mr_name ? [`MR Name: ${user.mr_name}`] : [],
      [''],
      ['Executive Summary:'],
      [`Total Revenue: ₹${kpis.totalRevenue.toLocaleString()}`],
      [`Total Orders: ${kpis.totalOrders}`],
      [`Average Order Value: ₹${kpis.avgOrderValue.toFixed(0)}`],
      [`Delivery Rate: ${kpis.deliveryRate.toFixed(1)}%`],
      [''],
      ['AI Predictions:'],
      ['Next Month Revenue: ₹45,200 (94% confidence)'],
      ['Growth Rate: +12.5% vs last month'],
      ['Top Opportunity: Chyawanprash in winter season'],
      [''],
      ['Detailed Orders (Reflecting Current Filters):'],
      ['Order ID', 'Date', 'Customer', 'Product', 'Amount', 'Status', 'Delivered From'],
      ...filteredData.map(order => [
        order.orderId, order.date, order.customerName, 
        order.productName, order.netAmount, order.deliveryStatus, order.deliveredFrom
      ])
    ].flat();

    const csvContent = exportData.map(row => Array.isArray(row) ? row.join(',') : row).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ayurvedic_ml_sales_report_${user?.employee_id}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  // Calculate data for charts using filteredDashboardData
  const kpis = useMemo(() => {
    if (!filteredDashboardData || filteredDashboardData.length === 0) {
      return { totalRevenue: 0, totalOrders: 0, activeCustomers: 0, deliveryRate: 0, avgOrderValue: 0 };
    }
    return calculateKPIs(filteredDashboardData);
  }, [filteredDashboardData]);
  
  // Enhanced chart data with predictions
  const chartDataWithPredictions = useMemo(() => {
    const monthlyData = {};
    filteredDashboardData.forEach(order => {
      if (!order.date || isNaN(new Date(order.date).getTime())) {
        return;
      }
      const month = new Date(order.date).toISOString().slice(0, 7);
      if (!monthlyData[month]) monthlyData[month] = { month, actual: 0, orders: 0 };
      monthlyData[month].actual += (order.netAmount || 0);
      monthlyData[month].orders += 1;
    });

    const historicalData = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
    
    // Add simple predictions
    const currentDate = new Date();
    const predictedData = [];
    for (let i = 1; i <= 3; i++) {
      const futureDate = new Date(currentDate);
      futureDate.setMonth(futureDate.getMonth() + i);
      const avgRevenue = historicalData.length > 0 ? historicalData.reduce((sum, d) => sum + d.actual, 0) / historicalData.length : 0;
      const avgOrdersBase = kpis.avgOrderValue > 0 ? avgRevenue / kpis.avgOrderValue : 0;

      predictedData.push({
        month: futureDate.toISOString().slice(0, 7),
        actual: null,
        predicted: avgRevenue * (1 + 0.1 * i),
        orders: Math.round(avgOrdersBase)
      });
    }

    return [...historicalData, ...predictedData];
  }, [filteredDashboardData, kpis.avgOrderValue]);

  // Updated fulfillment data to use actual distributor names
  const fulfillmentData = useMemo(() => {
    const fulfillmentCounts = {};
    filteredDashboardData.forEach(order => {
      const distributor = order.deliveredFrom || 'Unknown';
      fulfillmentCounts[distributor] = (fulfillmentCounts[distributor] || 0) + 1;
    });
    
    return Object.entries(fulfillmentCounts).map(([name, value]) => ({
      name,
      value
    }));
  }, [filteredDashboardData]);

  // Enhanced Navigation Component with User Profile
  const EnhancedNavigation = ({ activeTab, setActiveTab, notifications, showNotifications, setShowNotifications, exportWithMLInsights, showMLAnalytics, setShowMLAnalytics, filters, setFilters }) => (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center py-4 md:space-y-0 space-y-4">
          <div className="flex flex-col md:flex-row items-center md:space-x-8 md:space-y-0 space-y-4">
            <h1 className="text-2xl font-bold" style={{ color: COLORS.primary }}>
              AyurML Analytics
            </h1>
            <div className="flex flex-wrap space-x-1">
              {[
                { id: 'overview', label: 'Overview', icon: TrendingUp },
                { id: 'visitplanner', label: 'Visit Planner', icon: MapPin }
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

            {/* ML Analytics Toggle */}
            <button 
              onClick={() => setShowMLAnalytics(!showMLAnalytics)}
              className={`flex items-center justify-center w-full md:w-auto px-3 py-2 rounded-lg text-sm transition-colors ${
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

  // Overview Tab Component
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
        {/* User Access Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <User className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <h4 className="font-semibold text-blue-800">
                Welcome, {user?.full_name}! 
                <span className="ml-2 text-xs bg-blue-100 px-2 py-1 rounded-full">
                  {user?.access_level?.toUpperCase()}
                </span>
              </h4>
              <p className="text-sm text-blue-700">
                {user?.access_level === 'admin' && 'You have full access to all dashboard data and features.'}
                {user?.access_level === 'manager' && 'You have regional access to assigned territories and states.'}
                {user?.access_level === 'mr' && `Showing your personal data and performance metrics.`}
                {user?.access_level === 'viewer' && 'You have read-only access to dashboard data.'}
                {user?.mr_name && ` | MR: ${user.mr_name}`}
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Filters */}
        <EnhancedOverviewFilters
          filters={filters}
          setFilters={setFilters}
          sampleOrderData={orderData}
          isFiltersVisible={isFiltersVisible}
          setIsFiltersVisible={setIsFiltersVisible}
          pendingFilters={pendingFilters}
          setPendingFilters={setPendingFilters}
        />

        {/* Clear Chart Filters Button */}
        {areChartFiltersActive && (
          <div className="mb-4 flex justify-end">
            <button
              onClick={clearChartFilters}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm flex items-center shadow-md"
            >
              <XOctagon className="h-4 w-4 mr-2" />
              Clear Chart Filters
            </button>
          </div>
        )}

        {/* Results Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-lg font-semibold text-blue-900">
                Showing {filteredData.length} of {orderData.length} orders
              </div>
              {filteredData.length !== orderData.length && (
                <span className="text-sm text-blue-600">
                  ({orderData.length - filteredData.length} orders filtered out)
                </span>
              )}
            </div>
            {filteredData.length < orderData.length && (
              <button
                onClick={() => {
                  const resetFilters = {
                    dateRange: ['', ''],
                    searchTerm: '',
                    selectedFulfillment: null,
                    selectedMR: null,
                    selectedFulfillmentCenter: null,
                    selectedState: null
                  };
                  setFilters(resetFilters);
                  setPendingFilters(resetFilters);
                }}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Reset all filters
              </button>
            )}
          </div>
        </div>

        {/* Enhanced KPI Cards with ML Predictions */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <KPICard 
            title="Total Revenue" 
            value={kpis.totalRevenue} 
            icon={TrendingUp} 
            format="currency"
            color={COLORS.success}
            trend={12.5}
            mlPrediction="₹45.2K next month"
          />
          <KPICard 
            title="Total Orders" 
            value={kpis.totalOrders} 
            icon={ShoppingCart}
            color={COLORS.primary}
            trend={8.2}
            mlPrediction="18 orders expected"
          />
          <KPICard 
            title="Avg Order Value" 
            value={kpis.avgOrderValue} 
            icon={Package}
            format="currency"
            color={COLORS.secondary}
            trend={3.7}
            mlPrediction="₹2.8K"
          />
          <KPICard 
            title="Active Customers" 
            value={kpis.activeCustomers} 
            icon={Users}
            color={COLORS.accent}
            trend={15.3}
            mlPrediction="+3 new"
          />
          <KPICard 
            title="Delivery Rate" 
            value={kpis.deliveryRate} 
            icon={MapPin}
            format="percentage"
            color={COLORS.success}
            trend={-2.1}
            mlPrediction="94.2%"
          />
        </div>

        {/* ML Analytics Section */}
        {showMLAnalytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MLInsightsCompact />
            <SalesDriversCompact />
          </div>
        )}

        {/* Main Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Trend with ML Forecasting */}
          <SalesTrendChart data={chartDataWithPredictions} />

          {/* Order Fulfillment */}
          <FulfillmentChart 
            data={fulfillmentData}
            filters={filters}
            setFilters={setFilters}
          />
        </div>

       
      </div>
    );
  };

  // Loading state
  if (loading && !isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl font-semibold">Loading Dashboard Data...</div>
      </div>
    );
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
        {activeTab === 'visitplanner' && <MRVisitPlannerDashboard />}
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
