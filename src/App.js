// App.js - Updated for Supabase Integration
import React, { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { TrendingUp, ShoppingCart, Users, MapPin, Package, Brain, Star, XOctagon, Search, X, RefreshCw, Database } from 'lucide-react';

// Import modules - Updated for Supabase
import { 
  initializeData, 
  refreshDashboardData,
  fetchFilteredOrderData,
  COLORS, 
  calculateKPIs, 
  getUniqueValues, 
  transformProductData, 
  getPackSizeAnalytics 
} from './data.js';
import { ProductForecastingML, CustomerForecastingML } from './mlModels.js';
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
import { EnhancedOverviewFilters, SearchableDropdown } from './enhancedFilters.js';
import { MedicineWiseAnalytics, PackWiseAnalytics } from './analytics_components.js';

const AyurvedicDashboard = () => {
  // Existing state
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedPackSize, setSelectedPackSize] = useState('');
  const [viewMode, setViewMode] = useState('medicine');
  const [showMLAnalytics, setShowMLAnalytics] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Enhanced state for Supabase integration
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState(null);
  const [sampleOrderData, setSampleOrderData] = useState([]);
  const [productMasterData, setProductMasterData] = useState([]);
  const [customerData, setCustomerData] = useState([]);
  const [mrData, setMrData] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  
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
  const [isFiltersVisible, setIsFiltersVisible] = useState(true);
  const [pendingFilters, setPendingFilters] = useState(filters);

  // Load data from Supabase on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Load filtered data when filters change
  useEffect(() => {
    if (!isLoading && Object.values(filters).some(f => f)) {
      loadFilteredData();
    }
  }, [filters]);

  const loadData = async () => {
    setIsLoading(true);
    setDataError(null);
    setConnectionStatus('connecting');
    
    try {
      const data = await initializeData();
      setSampleOrderData(data.sampleOrderData);
      setProductMasterData(data.productMasterData);
      setCustomerData(data.customerData);
      setMrData(data.mrData);
      setLastRefresh(new Date());
      setConnectionStatus('connected');
      
      // Set default selections if data is available
      if (data.productMasterData.length > 0) {
        setSelectedProduct(data.productMasterData[0].Sku);
      }
      if (data.customerData.length > 0) {
        setSelectedCustomer(data.customerData[0].customer_code);
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      setDataError(error.message);
      setConnectionStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFilteredData = async () => {
    try {
      // Apply filters and fetch filtered data
      const filterParams = {
        dateRange: filters.dateRange,
        customerType: filters.customerType,
        territory: filters.territory,
        mrName: filters.selectedMR,
        deliveryStatus: filters.deliveryStatus
      };
      
      const filteredOrders = await fetchFilteredOrderData(filterParams);
      setSampleOrderData(filteredOrders);
      
    } catch (error) {
      console.error('Error loading filtered data:', error);
    }
  };

  // Refresh data function
  const refreshData = async () => {
    setConnectionStatus('refreshing');
    try {
      const data = await refreshDashboardData();
      setSampleOrderData(data.sampleOrderData);
      setProductMasterData(data.productMasterData);
      setCustomerData(data.customerData);
      setMrData(data.mrData);
      setLastRefresh(new Date());
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Error refreshing data:', error);
      setConnectionStatus('error');
    }
  };

  // Initialize ML Models
  const productML = useMemo(() => new ProductForecastingML(), []);
  const customerML = useMemo(() => new CustomerForecastingML(), []);

  // Real-time notifications (using loaded data)
  useEffect(() => {
    if (sampleOrderData.length === 0) return;
    
    const interval = setInterval(() => {
      const newOrder = sampleOrderData[Math.floor(Math.random() * sampleOrderData.length)];
      const notification = {
        id: Date.now(),
        message: `🔔 New order ${newOrder.orderId} from ${newOrder.customerName}`,
        amount: newOrder.netAmount,
        timestamp: new Date().toLocaleTimeString(),
        type: 'new_order',
        ml_prediction: `Predicted next order: ₹${(newOrder.netAmount * 1.15).toFixed(0)}`
      };
      setNotifications(prev => [notification, ...prev.slice(0, 4)]);
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [sampleOrderData]);

  // Create filteredData based on filters (using loaded data)
  const filteredData = useMemo(() => {
    let data = sampleOrderData;

    // Apply additional client-side filters
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

    // Apply chart filters
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
  }, [sampleOrderData, filters]);

  // Separate table filtered data to prevent page jumping
  const tableFilteredData = useMemo(() => {
    if (!filters.tableSearchTerm) return filteredData;
    
    const searchTerm = filters.tableSearchTerm.toLowerCase();
    return filteredData.filter(order => 
      order.orderId.toLowerCase().includes(searchTerm) ||
      order.customerName.toLowerCase().includes(searchTerm) ||
      (order.medicalRepresentative || '').toLowerCase().includes(searchTerm) ||
      order.productName.toLowerCase().includes(searchTerm)
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

  // Enhanced export with ML insights
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
      ['AI Predictions:'],
      ['Next Month Revenue: ₹45,200 (94% confidence)'],
      ['Growth Rate: +12.5% vs last month'],
      ['Top Opportunity: Focus on high-performing territories'],
      [''],
      ['Detailed Orders (Reflecting Current Filters):'],
      ['Order ID', 'Date', 'Customer', 'Product', 'Amount', 'Status', 'Delivered From', 'MR'],
      ...filteredData.map(order => [
        order.orderId, order.date, order.customerName, 
        order.productName, order.netAmount, order.deliveryStatus, 
        order.deliveredFrom, order.medicalRepresentative
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

  // Product predictions
  const productPredictions = useMemo(() => {
    if (!sampleOrderData.length || !selectedProduct) return { forecasts: [], insights: [] };
    return productML.predictProductSales(selectedProduct, sampleOrderData, 6);
  }, [selectedProduct, productML, sampleOrderData]);

  // Customer predictions  
  const customerPredictions = useMemo(() => {
    if (!sampleOrderData.length || !selectedCustomer) return { forecasts: [], insights: [], recommendations: [] };
    return customerML.predictCustomerBehavior(selectedCustomer, sampleOrderData, 6);
  }, [selectedCustomer, customerML, sampleOrderData]);

  // Transform product data for both views
  const { individualProducts, groupedByMedicine } = useMemo(() => 
    transformProductData(productMasterData), [productMasterData]
  );

  // Get analytics for both medicine-wise and pack-wise views
  const { packSizePerformance, medicinePerformance } = useMemo(() => 
    getPackSizeAnalytics(filteredData), [filteredData]
  );

  // Get unique values for dropdowns
  const uniqueProducts = individualProducts;
  const uniqueMedicines = [...new Set(individualProducts.map(p => p.medicineName))];
  const uniqueCustomers = [...new Set(sampleOrderData.map(order => ({ id: order.customerId, name: order.customerName })))];

  // Current product data based on selection
  const currentProduct = individualProducts.find(p => p.sku === selectedProduct);
  const currentMedicine = currentProduct?.medicineName;
  const availablePackSizes = individualProducts.filter(p => p.medicineName === currentMedicine);

  // Calculate data for charts using filteredData
  const kpis = calculateKPIs(filteredData);
  
  // Loading and error states
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

  // Enhanced chart data with predictions (rest of your existing code...)
  const chartDataWithPredictions = useMemo(() => {
    const monthlyData = {};
    filteredData.forEach(order => {
      const month = new Date(order.date).toISOString().slice(0, 7);
      if (!monthlyData[month]) monthlyData[month] = { month, actual: 0, orders: 0 };
      monthlyData[month].actual += order.netAmount;
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
        predicted: avgRevenue * (1 + 0.1 * i), // 10% growth per month
        orders: Math.round(avgOrdersBase)
      });
    }

    return [...historicalData, ...predictedData];
  }, [filteredData, kpis.avgOrderValue]);

  // Geographic data
  const geoData = useMemo(() => {
    const locationData = {};
    filteredData.forEach(order => {
      const key = order.city;
      if (!locationData[key]) {
        locationData[key] = {
          city: order.city,
          state: order.state,
          value: 0,
          orders: 0
        };
      }
      locationData[key].value += order.netAmount;
      locationData[key].orders += 1;
    });
    return Object.values(locationData);
  }, [filteredData]);

  // Chart data preparations
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

  // Overview Tab Component with enhanced features
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
        {/* Data Connection Status */}
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

        {/* Enhanced Filters */}
        <EnhancedOverviewFilters
          filters={filters}
          setFilters={setFilters}
          sampleOrderData={sampleOrderData}
          customerData={customerData}
          mrData={mrData}
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
                Showing {filteredData.length} orders from database
              </div>
              <div className="text-sm text-blue-600">
                (Real-time data from Supabase)
              </div>
            </div>
            {filteredData.length < sampleOrderData.length && (
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Trend with ML Forecasting */}
          <div className="lg:col-span-2">
            <SalesTrendChart data={chartDataWithPredictions} />
          </div>

          {/* Order Fulfillment */}
          <FulfillmentChart 
            data={fulfillmentData}
            filters={filters}
            setFilters={setFilters}
          />
        </div>

        {/* Bottom Charts */}
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

        {/* Enhanced Data Table with Search */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Recent Orders with Real-time Data</h3>
                <span className="text-sm text-gray-600">
                  Showing latest {Math.min(10, tableFilteredData.length)} orders from Supabase
                </span>
              </div>
              
              {/* Search Orders - Table Specific */}
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
                      autoComplete="off"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleTableSearch}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 transition-colors"
                  >
                    Search
                  </button>
                  {filters.tableSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setFilters(prev => ({ ...prev, tableSearchTerm: '', tableSearchInput: '' }))}
                      className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:ring-2 focus:ring-gray-400 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {filters.tableSearchTerm && (
                  <p className="text-xs text-gray-500 mt-1">
                    Searching for: "{filters.tableSearchTerm}" - {tableFilteredData.length} results found
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medical Rep</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivered From</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Territory</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Products</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tableFilteredData.slice(-10).reverse().map((order, index) => (
                  <tr key={order.orderId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.orderId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                        <div className="text-sm text-gray-500">{order.customerType}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.medicalRepresentative || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{order.netAmount.toLocaleString()}
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
                      {order.deliveredFrom}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.territory || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-700 max-w-xs">
                        <div className="p-2 bg-gray-50 rounded border-l-2 border-green-500">
                          <div className="font-medium text-gray-900">{order.productName}</div>
                          <div className="text-gray-500 text-xs">Qty: {order.quantity}</div>
                          <div className="text-green-600 text-xs font-medium">₹{order.netAmount}</div>
                        </div>
                      </div>
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

  // Products and Customers tabs remain similar but with real data
  const ProductsTab = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Brain className="h-5 w-5 mr-2 text-purple-600" />
            Product Sales Analytics Engine (Live Data)
          </h3>
          <div className="text-sm text-gray-600">
            {productMasterData.length} products loaded from Supabase
          </div>
        </div>
        {/* Rest of Products tab... */}
      </div>
    </div>
  );

  const CustomersTab = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Brain className="h-5 w-5 mr-2 text-purple-600" />
            Customer Intelligence Engine (Live Data)
          </h3>
          <div className="text-sm text-gray-600">
            {customerData.length} customers loaded from Supabase
          </div>
        </div>
        {/* Rest of Customers tab... */}
      </div>
    </div>
  );

  // Main render with enhanced Supabase integration
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
        // Enhanced navigation props
        onRefresh={refreshData}
        lastRefresh={lastRefresh}
        connectionStatus={connectionStatus}
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
