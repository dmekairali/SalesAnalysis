// App.js - Fresh Implementation with Supabase Integration
import React, { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { TrendingUp, ShoppingCart, Users, MapPin, Package, Brain, Star, XOctagon, Search, X, RefreshCw, Database } from 'lucide-react';

// Import data functions
import { 
  initializeData, 
  refreshDashboardData,
  COLORS, 
  calculateKPIs, 
  getUniqueValues, 
  transformProductData, 
  getPackSizeAnalytics 
} from './data.js';

// Import ML models
import { ProductForecastingML, CustomerForecastingML } from './mlModels.js';

// Import components
import { 
  Navigation, 
  KPICard, 
  MLInsightsCompact, 
  SalesDriversCompact,
  SalesTrendChart,
  FulfillmentChart,
  CategoryChart,
  TopProductsChart,
  GeoHeatMap,
  ProductForecastChart,
  CustomerTimelineChart,
  MLInsightCard
} from './components.js';

// Import filters
import { EnhancedOverviewFilters, SearchableDropdown } from './enhancedFilters.js';

// Import analytics
import { MedicineWiseAnalytics, PackWiseAnalytics } from './analytics_components.js';

const AyurvedicDashboard = () => {
  // Core state
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  // Data state
  const [orderData, setOrderData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [customerData, setCustomerData] = useState([]);
  const [mrData, setMrData] = useState([]);

  // Product/Customer selection state
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedPackSize, setSelectedPackSize] = useState('');
  const [viewMode, setViewMode] = useState('medicine');

  // UI state
  const [showMLAnalytics, setShowMLAnalytics] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isFiltersVisible, setIsFiltersVisible] = useState(true);

  // Filter state
  const [filters, setFilters] = useState({
    dateRange: ['', ''],
    searchTerm: '',
    selectedFulfillment: null,
    selectedCategory: null,
    selectedTopProduct: null,
    selectedMR: null,
    selectedFulfillmentCenter: null,
    selectedState: null,
    tableSearchTerm: '',
    tableSearchInput: '',
    customerType: null,
    territory: null,
    deliveryStatus: null
  });
  const [pendingFilters, setPendingFilters] = useState(filters);

  // Initialize ML Models
  const productML = useMemo(() => new ProductForecastingML(), []);
  const customerML = useMemo(() => new CustomerForecastingML(), []);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Setup notifications
  useEffect(() => {
    if (orderData.length === 0) return;
    
    const interval = setInterval(() => {
      const randomOrder = orderData[Math.floor(Math.random() * orderData.length)];
      const notification = {
        id: Date.now(),
        message: `🔔 New order ${randomOrder.orderId} from ${randomOrder.customerName}`,
        amount: randomOrder.netAmount,
        timestamp: new Date().toLocaleTimeString(),
        type: 'new_order',
        ml_prediction: `Predicted next order: ₹${(randomOrder.netAmount * 1.15).toFixed(0)}`
      };
      setNotifications(prev => [notification, ...prev.slice(0, 4)]);
    }, 30000);

    return () => clearInterval(interval);
  }, [orderData]);

  const loadData = async () => {
    setIsLoading(true);
    setDataError(null);
    setConnectionStatus('connecting');
    
    try {
      const data = await initializeData();
      
      setOrderData(data.sampleOrderData || []);
      setProductData(data.productMasterData || []);
      setCustomerData(data.customerData || []);
      setMrData(data.mrData || []);
      
      setLastRefresh(new Date());
      setConnectionStatus('connected');
      
      // Set default selections
      if (data.productMasterData && data.productMasterData.length > 0) {
        setSelectedProduct(data.productMasterData[0].Sku || data.productMasterData[0].productId);
      }
      if (data.customerData && data.customerData.length > 0) {
        setSelectedCustomer(data.customerData[0].customer_code || data.customerData[0].id);
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      setDataError(error.message);
      setConnectionStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    setConnectionStatus('refreshing');
    try {
      const data = await refreshDashboardData();
      setOrderData(data.sampleOrderData || []);
      setProductData(data.productMasterData || []);
      setCustomerData(data.customerData || []);
      setMrData(data.mrData || []);
      setLastRefresh(new Date());
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Error refreshing data:', error);
      setConnectionStatus('error');
    }
  };

  // Apply filters to order data
  const filteredData = useMemo(() => {
    let data = [...orderData];

    // Date range filter
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

    // Search term filter
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      data = data.filter(order =>
        order.orderId?.toLowerCase().includes(searchTerm) ||
        order.customerName?.toLowerCase().includes(searchTerm) ||
        order.productName?.toLowerCase().includes(searchTerm) ||
        order.category?.toLowerCase().includes(searchTerm) ||
        order.city?.toLowerCase().includes(searchTerm)
      );
    }

    // Other filters
    if (filters.selectedMR) {
      data = data.filter(order => 
        order.medicalRepresentative === filters.selectedMR ||
        order.salesRepresentative === filters.selectedMR
      );
    }

    if (filters.selectedFulfillmentCenter) {
      data = data.filter(order => order.deliveredFrom === filters.selectedFulfillmentCenter);
    }

    if (filters.selectedState) {
      data = data.filter(order => order.state === filters.selectedState);
    }

    if (filters.selectedFulfillment) {
      data = data.filter(order => order.deliveredFrom === filters.selectedFulfillment);
    }

    if (filters.selectedCategory) {
      data = data.filter(order => order.category === filters.selectedCategory);
    }

    if (filters.selectedTopProduct) {
      data = data.filter(order => order.productName === filters.selectedTopProduct);
    }

    return data;
  }, [orderData, filters]);

  // Table filtered data
  const tableFilteredData = useMemo(() => {
    if (!filters.tableSearchTerm) return filteredData;
    
    const searchTerm = filters.tableSearchTerm.toLowerCase();
    return filteredData.filter(order => 
      order.orderId?.toLowerCase().includes(searchTerm) ||
      order.customerName?.toLowerCase().includes(searchTerm) ||
      order.medicalRepresentative?.toLowerCase().includes(searchTerm) ||
      order.productName?.toLowerCase().includes(searchTerm)
    );
  }, [filteredData, filters.tableSearchTerm]);

  // Handle table search
  const handleTableSearch = () => {
    setFilters(prev => ({ ...prev, tableSearchTerm: prev.tableSearchInput }));
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleTableSearch();
    }
  };

  // Export function
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
      [`Data Last Updated: ${lastRefresh.toLocaleString()}`],
      [''],
      ['Detailed Orders:'],
      ['Order ID', 'Date', 'Customer', 'Product', 'Amount', 'Status', 'MR'],
      ...filteredData.map(order => [
        order.orderId, order.date, order.customerName, 
        order.productName, order.netAmount, order.deliveryStatus, 
        order.medicalRepresentative
      ])
    ];

    const csvContent = exportData.map(row => Array.isArray(row) ? row.join(',') : row).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ayurvedic_sales_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  // ML Predictions
  const productPredictions = useMemo(() => {
    if (!orderData.length || !selectedProduct) return { forecasts: [], insights: [] };
    return productML.predictProductSales(selectedProduct, orderData, 6);
  }, [selectedProduct, productML, orderData]);

  const customerPredictions = useMemo(() => {
    if (!orderData.length || !selectedCustomer) return { forecasts: [], insights: [], recommendations: [] };
    return customerML.predictCustomerBehavior(selectedCustomer, orderData, 6);
  }, [selectedCustomer, customerML, orderData]);

  // Transform product data
  const { individualProducts, groupedByMedicine } = useMemo(() => 
    transformProductData(productData), [productData]
  );

  // Analytics data
  const { packSizePerformance, medicinePerformance } = useMemo(() => 
    getPackSizeAnalytics(filteredData), [filteredData]
  );

  // Dropdown data
  const uniqueProducts = individualProducts;
  const uniqueMedicines = [...new Set(individualProducts.map(p => p.medicineName))];
  const uniqueCustomers = [...new Set(orderData.map(order => ({ 
    id: order.customerId || order.customer_code, 
    name: order.customerName 
  })))];

  // Current product data
  const currentProduct = individualProducts.find(p => p.sku === selectedProduct);
  const currentMedicine = currentProduct?.medicineName;
  const availablePackSizes = individualProducts.filter(p => p.medicineName === currentMedicine);

  // Calculate KPIs
  const kpis = calculateKPIs(filteredData);

  // Chart data
  const chartDataWithPredictions = useMemo(() => {
    const monthlyData = {};
    filteredData.forEach(order => {
      const month = new Date(order.date).toISOString().slice(0, 7);
      if (!monthlyData[month]) monthlyData[month] = { month, actual: 0, orders: 0 };
      monthlyData[month].actual += order.netAmount;
      monthlyData[month].orders += 1;
    });

    const historicalData = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
    
    // Add predictions
    const currentDate = new Date();
    const predictedData = [];
    for (let i = 1; i <= 3; i++) {
      const futureDate = new Date(currentDate);
      futureDate.setMonth(futureDate.getMonth() + i);
      const avgRevenue = historicalData.length > 0 ? historicalData.reduce((sum, d) => sum + d.actual, 0) / historicalData.length : 0;

      predictedData.push({
        month: futureDate.toISOString().slice(0, 7),
        actual: null,
        predicted: avgRevenue * (1 + 0.1 * i),
        orders: Math.round(avgRevenue / (kpis.avgOrderValue || 1000))
      });
    }

    return [...historicalData, ...predictedData];
  }, [filteredData, kpis.avgOrderValue]);

  // More chart data
  const categoryData = useMemo(() => Object.entries(
    filteredData.reduce((acc, order) => {
      acc[order.category] = (acc[order.category] || 0) + order.netAmount;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value })), [filteredData]);

  const topProductsData = useMemo(() => Object.entries(
    filteredData.reduce((acc, order) => {
      acc[order.productName] = (acc[order.productName] || 0) + order.netAmount;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name: name.substring(0, 15), value })), [filteredData]);

  const fulfillmentData = useMemo(() => [
    { name: 'Factory', value: filteredData.filter(o => o.deliveredFrom === 'Factory').length },
    { name: 'Distributor', value: filteredData.filter(o => o.deliveredFrom === 'Distributor').length }
  ], [filteredData]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Dashboard</h2>
          <p className="text-gray-600">Connecting to Supabase database...</p>
          <div className="mt-4 flex items-center justify-center space-x-2">
            <Database className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-500">Fetching real-time data</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (dataError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <XOctagon className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Database Connection Error</h2>
          <p className="text-gray-600 mb-4">Failed to connect to Supabase: {dataError}</p>
          <div className="space-y-2">
            <button 
              onClick={refreshData}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Retry Connection
            </button>
            <p className="text-xs text-gray-500">
              Make sure your Supabase credentials are correct in data.js
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Overview Tab
  const OverviewTab = () => {
    const { selectedFulfillment, selectedCategory, selectedTopProduct } = filters;
    const areChartFiltersActive = !!(selectedFulfillment || selectedCategory || selectedTopProduct);

    const clearChartFilters = () => {
      setFilters(prev => ({
        ...prev,
        selectedFulfillment: null,
        selectedCategory: null,
        selectedTopProduct: null,
      }));
    };

    return (
      <div className="space-y-6">
        {/* Connection Status */}
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`h-3 w-3 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' : 
                connectionStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'
              }`}></div>
              <div>
                <span className="font-medium text-gray-900">
                  {connectionStatus === 'connected' ? '🟢 Live Data Connected' : 
                   connectionStatus === 'error' ? '🔴 Connection Error' : '🟡 Connecting...'}
                </span>
                <div className="text-sm text-gray-600">
                  Last updated: {lastRefresh.toLocaleTimeString()} | 
                  Showing {filteredData.length} orders from Supabase
                </div>
              </div>
            </div>
            <button 
              onClick={refreshData}
              disabled={connectionStatus === 'refreshing'}
              className="flex items-center space-x-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${connectionStatus === 'refreshing' ? 'animate-spin' : ''}`} />
              <span>{connectionStatus === 'refreshing' ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <EnhancedOverviewFilters
          filters={filters}
          setFilters={setFilters}
          sampleOrderData={orderData}
          customerData={customerData}
          mrData={mrData}
          isFiltersVisible={isFiltersVisible}
          setIsFiltersVisible={setIsFiltersVisible}
          pendingFilters={pendingFilters}
          setPendingFilters={setPendingFilters}
        />

        {/* Clear Chart Filters */}
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
                Showing {filteredData.length} orders from database
              </div>
            </div>
            {filteredData.length < orderData.length && (
              <button
                onClick={() => {
                  const resetFilters = {
                    dateRange: ['', ''],
                    searchTerm: '',
                    selectedFulfillment: null,
                    selectedCategory: null,
                    selectedTopProduct: null,
                    selectedMR: null,
                    selectedFulfillmentCenter: null,
                    selectedState: null,
                    tableSearchTerm: '',
                    tableSearchInput: '',
                    customerType: null,
                    territory: null,
                    deliveryStatus: null
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

        {/* KPI Cards */}
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

        {/* ML Analytics */}
        {showMLAnalytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MLInsightsCompact />
            <SalesDriversCompact />
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SalesTrendChart data={chartDataWithPredictions} />
          </div>
          <FulfillmentChart 
            data={fulfillmentData}
            filters={filters}
            setFilters={setFilters}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CategoryChart
            data={categoryData}
            filters={filters}
            setFilters={setFilters}
          />
          <TopProductsChart
            data={topProductsData}
            filters={filters}
            setFilters={setFilters}
          />
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Recent Orders</h3>
                <span className="text-sm text-gray-600">
                  Showing latest {Math.min(10, tableFilteredData.length)} orders
                </span>
              </div>
              
              <div className="w-full max-w-lg">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Orders
                </label>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={filters.tableSearchInput || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, tableSearchInput: e.target.value }))}
                      onKeyPress={handleSearchKeyPress}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Search by Order ID, Customer, MR, Product..."
                    />
                  </div>
                  <button
                    onClick={handleTableSearch}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Search
                  </button>
                  {filters.tableSearchTerm && (
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, tableSearchTerm: '', tableSearchInput: '' }))}
                      className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Territory</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tableFilteredData.slice(-10).reverse().map((order, index) => (
                  <tr key={order.orderId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.orderId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                      <div className="text-sm text-gray-500">{order.customerType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{order.netAmount?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        order.deliveryStatus === 'Delivered' ? 'bg-green-100 text-green-800' :
                        order.deliveryStatus === 'In Transit' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {order.deliveryStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.territory || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.productName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Products Tab
  const ProductsTab = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold flex items-center mb-4">
          <Brain className="h-5 w-5 mr-2 text-purple-600" />
          Product Analytics ({productData.length} products loaded)
        </h3>
        <MedicineWiseAnalytics 
          medicinePerformance={medicinePerformance}
          selectedMedicine={currentMedicine}
          availablePackSizes={availablePackSizes}
        />
      </div>
    </div>
  );

  // Customers Tab
  const CustomersTab = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Customer Analytics</h3>
        <p className="text-gray-600">
          {customerData.length} customers loaded from Supabase database
        </p>
        {/* Add your customer analytics here */}
      </div>
    </div>
  );

  // Main render
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefresh={refreshData}
        connectionStatus={connectionStatus}
        lastRefresh={lastRefresh}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'products' && <ProductsTab />}
        {activeTab === 'customers' && <CustomersTab />}
      </div>
    </div>
  );
};

export default AyurvedicDashboard;
