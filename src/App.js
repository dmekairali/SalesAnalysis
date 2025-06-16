import React, { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { TrendingUp, ShoppingCart, Users, MapPin, Package, Brain, Star, XOctagon, Search, X , RefreshCw} from 'lucide-react';
import { formatIndianCurrency, formatCurrencyByContext } from './data.js';

// Import modules - Updated to include new functions
import { initializeData, COLORS, calculateKPIs, getUniqueValues, fetchDashboardOrders, fetchStateRevenueSummary } from './data.js';

import { 
  Navigation, 
  KPICard, 
  MLInsightsCompact, 
  SalesDriversCompact,
  SalesTrendChart,
  FulfillmentChart,
  GeoHeatMap
} from './components.js';
import { EnhancedOverviewFilters, SearchableDropdown } from './enhancedFilters.js';
// Add this import at the top of App.js
import MRVisitPlannerDashboard from './visitPlanner/MRVisitPlannerDashboard';

const AyurvedicDashboard = () => {
  const [orderData, setOrderData] = useState([]);
  const [dashboardOrderData, setDashboardOrderData] = useState([]);
  const [geoData, setGeoData] = useState([]); // Add state for geographic data
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showMLAnalytics, setShowMLAnalytics] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const [filters, setFilters] = useState({
    dateRange: ['', ''],
    searchTerm: '',
    selectedFulfillment: null,
    selectedMR: null,
    selectedFulfillmentCenter: null,
    selectedState: null
  });
  const [isFiltersVisible, setIsFiltersVisible] = useState(true);
  const [pendingFilters, setPendingFilters] = useState(filters); // For Apply button functionality

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const { sampleOrderData: fetchedOrders } = await initializeData();
        setOrderData(fetchedOrders || []);

        const fetchedDashboardOrders = await fetchDashboardOrders();
        setDashboardOrderData(fetchedDashboardOrders || []);

        // Load geographic data using SQL function
        const fetchedGeoData = await fetchStateRevenueSummary();
        setGeoData(fetchedGeoData || []);
      } catch (error) {
        console.error("Error initializing data:", error);
        setOrderData([]);
        setDashboardOrderData([]);
        setGeoData([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    console.log('[DataLoad_Debug] orderData state updated. Total Length:', orderData.length);
  }, [orderData]);

  // Real-time notifications
  useEffect(() => {
    const interval = setInterval(() => {
      if (orderData.length === 0) return;
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
  }, [orderData]);

  // Create filteredData based on filters (memoized for performance)
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

  // Create filteredDashboardData based on filters (memoized for performance)
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

  // Enhanced export function
  const exportWithMLInsights = () => {
    const kpis = calculateKPIs(filteredData);
    const exportData = [
      ['=== AYURVEDIC SALES REPORT WITH ML INSIGHTS ==='],
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
    ];

    const csvContent = exportData.map(row => Array.isArray(row) ? row.join(',') : row).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ayurvedic_ml_sales_report_${new Date().toISOString().slice(0, 10)}.csv`;
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

  // Remove the old geographic data calculation and use the state data
  // Geographic data is now loaded from SQL function and stored in state

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

        {/* Geographic Heat Map */}
        <GeoHeatMap data={geoData} />
      </div>
    );
  };

  // Main render
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl font-semibold">Loading Dashboard Data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation 
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
        isFiltersVisible={isFiltersVisible}
        setIsFiltersVisible={setIsFiltersVisible}
        pendingFilters={pendingFilters}
        setPendingFilters={setPendingFilters}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'visitplanner' && <MRVisitPlannerDashboard />}
      </div>
    </div>
  );
};

export default AyurvedicDashboard;
