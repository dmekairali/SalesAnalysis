// App.js - Updated for Supabase Integration
import React, { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { TrendingUp, ShoppingCart, Users, MapPin, Package, Brain, Star, XOctagon, Search, X, RefreshCw, Database } from 'lucide-react';

// Import modules - Updated for Supabase
import {
  initializeData,
  refreshDashboardData,
  fetchFilteredOrderData,
  fetchProductSalesSummary,
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
  }, [filters, isLoading]); // Added isLoading to prevent initial filtered load before data is ready

  const loadData = async () => {
    setIsLoading(true);
    setDataError(null);
    setConnectionStatus('connecting');

    try {
      const data = await initializeData();
      setSampleOrderData(data.sampleOrderData || []); // Ensure array on undefined
      setProductMasterData(data.productMasterData || []); // Ensure array on undefined
      setCustomerData(data.customerData || []); // Ensure array on undefined
      setMrData(data.mrData || []); // Ensure array on undefined
      setLastRefresh(new Date());
      setConnectionStatus('connected');

      // Set default selections if data is available
      if (data.productMasterData && data.productMasterData.length > 0) {
        setSelectedProduct(data.productMasterData[0].Sku);
      }
      if (data.customerData && data.customerData.length > 0) {
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
    // Do not run if still loading initial data or if essential filters are not set yet
    if (isLoading) return;

    try {
      // Apply filters and fetch filtered data
      const filterParams = {
        dateRange: filters.dateRange,
        customerType: filters.customerType,
        territory: filters.territory,
        mrName: filters.selectedMR,
        deliveryStatus: filters.deliveryStatus
      };

      // Only fetch if there are actual filter values to apply beyond default empty/null
      const hasActiveFilters = Object.values(filterParams).some(val =>
        Array.isArray(val) ? val[0] || val[1] : val
      );

      if (hasActiveFilters) {
        setIsLoading(true); // Show loading for filtered data fetch
        const filteredOrders = await fetchFilteredOrderData(filterParams);
        setSampleOrderData(filteredOrders || []); // Ensure array
        setIsLoading(false);
      } else if (!Object.values(filters).some(f => f)) {
        // If all filters are cleared, reload initial data
        await loadData();
      }


    } catch (error) {
      console.error('Error loading filtered data:', error);
      setIsLoading(false); // Ensure loading is false on error
    }
  };

  // Refresh data function
  const refreshData = async () => {
    setConnectionStatus('refreshing');
    setIsLoading(true); // Set loading true for refresh
    try {
      const data = await refreshDashboardData(); // refreshDashboardData should call initializeData
      setSampleOrderData(data.sampleOrderData || []);
      setProductMasterData(data.productMasterData || []);
      setCustomerData(data.customerData || []);
      setMrData(data.mrData || []);
      setLastRefresh(new Date());
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Error refreshing data:', error);
      setDataError(error.message); // Set error message
      setConnectionStatus('error');
    } finally {
      setIsLoading(false); // Set loading false after refresh attempt
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
      if (!newOrder) return; // Guard against empty sampleOrderData if it clears during interval
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

    // Apply additional client-side filters (search term, chart selections)
    // The main data filtering (date, MR, territory etc.) is now server-side via loadFilteredData

    if (filters.searchTerm) {
      const lowerSearchTerm = filters.searchTerm.toLowerCase();
      data = data.filter(order =>
        (order.orderId || '').toLowerCase().includes(lowerSearchTerm) ||
        (order.customerName || '').toLowerCase().includes(lowerSearchTerm) ||
        (order.productName || '').toLowerCase().includes(lowerSearchTerm) || // Assuming productName exists
        (order.category || '').toLowerCase().includes(lowerSearchTerm) ||
        (order.city || '').toLowerCase().includes(lowerSearchTerm)
      );
    }

    // Apply chart filters (these are client-side post server-side filtering)
    if (filters.selectedFulfillment) {
      data = data.filter(order => order.deliveredFrom === filters.selectedFulfillment);
    }

    if (filters.selectedCategory) {
      data = data.filter(order => order.category === filters.selectedCategory);
    }

    if (filters.selectedTopProduct) {
      // Ensure order.productName exists before filtering
      data = data.filter(order => order.productName && order.productName === filters.selectedTopProduct);
    }

    return data;
  }, [sampleOrderData, filters.searchTerm, filters.selectedFulfillment, filters.selectedCategory, filters.selectedTopProduct]);


  const tableFilteredData = useMemo(() => {
    if (!filters.tableSearchTerm) return filteredData;

    const searchTerm = filters.tableSearchTerm.toLowerCase();
    return filteredData.filter(order => 
      (order.orderId || '').toLowerCase().includes(searchTerm) ||
      (order.customerName || '').toLowerCase().includes(searchTerm) ||
      (order.medicalRepresentative || '').toLowerCase().includes(searchTerm) ||
      (order.productName || '').toLowerCase().includes(searchTerm) // Assuming productName exists
    );
  }, [filteredData, filters.tableSearchTerm]);

  const handleTableSearch = () => {
    setFilters(prev => ({ ...prev, tableSearchTerm: prev.tableSearchInput }));
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleTableSearch();
    }
  };

  const exportWithMLInsights = () => {
    const currentKpis = kpis; // Use memoized kpis
    const exportData = [
      ['=== AYURVEDIC SALES REPORT WITH ML INSIGHTS ==='],
      [''],
      ['Executive Summary:'],
      [`Total Revenue: ₹${currentKpis.totalRevenue.toLocaleString()}`],
      [`Total Orders: ${currentKpis.totalOrders}`],
      [`Average Order Value: ₹${currentKpis.avgOrderValue.toFixed(0)}`],
      [`Delivery Rate: ${currentKpis.deliveryRate.toFixed(1)}%`],
      [`Data Last Updated: ${lastRefresh.toLocaleString()}`],
      [''],
      ['AI Predictions:'],
      ['Next Month Revenue: ₹45,200 (94% confidence)'], // Placeholder
      ['Growth Rate: +12.5% vs last month'], // Placeholder
      ['Top Opportunity: Focus on high-performing territories'], // Placeholder
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
    URL.revokeObjectURL(url); // Clean up
  };

  const productPredictions = useMemo(() => {
    if (!sampleOrderData || sampleOrderData.length === 0 || !selectedProduct || !productMasterData || productMasterData.length === 0) {
      return { forecasts: [], insights: [], product: null };
    }
    // Pass productMasterData to the ML model
    return productML.predictProductSales(selectedProduct, sampleOrderData, productMasterData, 6);
  }, [selectedProduct, productML, sampleOrderData, productMasterData]);

  const customerPredictions = useMemo(() => {
    if (!sampleOrderData || sampleOrderData.length === 0 || !selectedCustomer || !productMasterData || productMasterData.length === 0) {
      return { forecasts: [], insights: [], recommendations: [], patterns: null };
    }
    // Pass productMasterData to the ML model
    return customerML.predictCustomerBehavior(selectedCustomer, sampleOrderData, productMasterData, 6);
  }, [selectedCustomer, customerML, sampleOrderData, productMasterData]);

  const { individualProducts, groupedByMedicine } = useMemo(() => {
    if (!productMasterData || productMasterData.length === 0) return { individualProducts: [], groupedByMedicine: [] };
    return transformProductData(productMasterData);
  }, [productMasterData]);

  const { packSizePerformance, medicinePerformance } = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return { packSizePerformance: {}, medicinePerformance: {} };
    return getPackSizeAnalytics(filteredData);
  }, [filteredData]);

  const uniqueProducts = useMemo(() => individualProducts, [individualProducts]);

  const uniqueMedicines = useMemo(() => {
    if (!individualProducts || individualProducts.length === 0) return [];
    return [...new Set(individualProducts.map(p => p.medicineName))];
  }, [individualProducts]);

  const uniqueCustomers = useMemo(() => {
    if (!sampleOrderData || sampleOrderData.length === 0) return [];
    return [...new Set(sampleOrderData.map(order => ({ id: order.customerId, name: order.customerName })))];
  }, [sampleOrderData]);

  const currentProduct = useMemo(() => {
    if (!individualProducts || individualProducts.length === 0 || !selectedProduct) return null;
    return individualProducts.find(p => p.sku === selectedProduct);
  }, [individualProducts, selectedProduct]);

  const currentMedicine = useMemo(() => currentProduct?.medicineName, [currentProduct]);

  const availablePackSizes = useMemo(() => {
    if (!individualProducts || individualProducts.length === 0 || !currentMedicine) return [];
    return individualProducts.filter(p => p.medicineName === currentMedicine);
  }, [individualProducts, currentMedicine]);

  const kpis = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return { totalRevenue: 0, totalOrders: 0, activeCustomers: 0, deliveryRate: 0, avgOrderValue: 0 };
    }
    return calculateKPIs(filteredData);
  }, [filteredData]);

  const chartDataWithPredictions = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];
    // Logic from previous App.js, ensure it's still valid
    const monthlyData = {};
    filteredData.forEach(order => {
      const month = new Date(order.date).toISOString().slice(0, 7);
      if (!monthlyData[month]) monthlyData[month] = { month, actual: 0, orders: 0 };
      monthlyData[month].actual += order.netAmount;
      monthlyData[month].orders += 1;
    });

    const historicalData = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
    const avgRevenue = historicalData.length > 0 ? historicalData.reduce((sum, d) => sum + d.actual, 0) / historicalData.length : 0;
    const avgOrdersBase = kpis.avgOrderValue > 0 ? avgRevenue / kpis.avgOrderValue : 0;
    
    const predictedData = [];
    const currentDate = new Date();
    for (let i = 1; i <= 3; i++) {
      const futureDate = new Date(currentDate);
      futureDate.setMonth(futureDate.getMonth() + i);
      predictedData.push({
        month: futureDate.toISOString().slice(0, 7),
        actual: null,
        predicted: avgRevenue * (1 + 0.1 * i),
        orders: Math.round(avgOrdersBase * (1 + 0.05 * i))
      });
    }
    return [...historicalData, ...predictedData];
  }, [filteredData, kpis.avgOrderValue]);

  const geoData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];
    const locationData = {};
    filteredData.forEach(order => {
      const key = order.city;
      if (!locationData[key]) {
        locationData[key] = { city: order.city, state: order.state, value: 0, orders: 0 };
      }
      locationData[key].value += order.netAmount;
      locationData[key].orders += 1;
    });
    return Object.values(locationData);
  }, [filteredData]);

  const categoryData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];
    return Object.entries(
      filteredData.reduce((acc, order) => {
        acc[order.category] = (acc[order.category] || 0) + order.netAmount;
        return acc;
      }, {})
    ).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  const topProductsData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];
    return Object.entries(
      filteredData.reduce((acc, order) => {
        // Ensure order.productName exists
        if (order.productName) {
          acc[order.productName] = (acc[order.productName] || 0) + order.netAmount;
        }
        return acc;
      }, {})
    ).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name: name.substring(0, 15), value }));
  }, [filteredData]);

  const fulfillmentData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [{ name: 'Factory', value: 0 }, { name: 'Distributor', value: 0 }];
    return [
      { name: 'Factory', value: filteredData.filter(o => o.deliveredFrom === 'Factory').length },
      { name: 'Distributor', value: filteredData.filter(o => o.deliveredFrom === 'Distributor').length }
    ];
  }, [filteredData]);


  if (isLoading && connectionStatus === 'connecting') { // Show initial full page loader only
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
        <div className="text-center max-w-md p-8 bg-white shadow-xl rounded-lg">
          <XOctagon className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Database Connection Error</h2>
          <p className="text-gray-600 mb-6">Failed to connect or fetch data: {dataError}</p>
          <button
            onClick={loadData} // Changed from refreshData to loadData for a full reload attempt
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center mx-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Overview Tab Component
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
        <EnhancedOverviewFilters
          filters={filters}
          setFilters={setFilters}
          sampleOrderData={sampleOrderData}
          productMasterData={productMasterData} // Pass productMasterData
          customerData={customerData} // Pass customerData
          mrData={mrData} // Pass mrData
          isFiltersVisible={isFiltersVisible}
          setIsFiltersVisible={setIsFiltersVisible}
          pendingFilters={pendingFilters}
          setPendingFilters={setPendingFilters}
          loadFilteredData={loadFilteredData} // Pass function to trigger filter application
        />

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

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-lg font-semibold text-blue-900">
                Showing {filteredData.length} of {sampleOrderData.length} orders
              </div>
              {/* Logic for "filtered out" can be more complex if server-side filtering is primary */}
            </div>
            {/* Reset all filters button can call loadData or a more specific reset function */}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <KPICard 
            title="Total Revenue" 
            value={kpis.totalRevenue} 
            icon={TrendingUp} 
            format="currency"
            color={COLORS.success}
            trend={12.5} // Placeholder
            mlPrediction="₹45.2K next month" // Placeholder
          />
          {/* Other KPICards */}
           <KPICard
            title="Total Orders" 
            value={kpis.totalOrders} 
            icon={ShoppingCart}
            color={COLORS.primary}
            trend={8.2} // Placeholder
            mlPrediction="18 orders expected" // Placeholder
          />
          <KPICard 
            title="Avg Order Value" 
            value={kpis.avgOrderValue} 
            icon={Package}
            format="currency"
            color={COLORS.secondary}
            trend={3.7} // Placeholder
            mlPrediction="₹2.8K" // Placeholder
          />
          <KPICard 
            title="Active Customers" 
            value={kpis.activeCustomers} 
            icon={Users}
            color={COLORS.accent}
            trend={15.3} // Placeholder
            mlPrediction="+3 new" // Placeholder
          />
          <KPICard 
            title="Delivery Rate" 
            value={kpis.deliveryRate} 
            icon={MapPin}
            format="percentage"
            color={COLORS.success} // Or warning if low
            trend={-2.1} // Placeholder
            mlPrediction="94.2%" // Placeholder
          />
        </div>

        {showMLAnalytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MLInsightsCompact />
            <SalesDriversCompact />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SalesTrendChart data={chartDataWithPredictions} />
          </div>
          <FulfillmentChart 
            data={fulfillmentData}
            filters={filters} // Pass full filters for interaction
            setFilters={setFilters} // Allow chart to set filters
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

        {/* GeoHeatMap can be added here if geoData is available and component is ready */}
        {/* <GeoHeatMap data={geoData} /> */}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
             <div className="flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Recent Orders</h3>
                <span className="text-sm text-gray-600">
                  Displaying latest {Math.min(10, tableFilteredData.length)} orders
                </span>
              </div>
              <div className="w-full max-w-lg">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Within Results
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
                      placeholder="Filter by Order ID, Customer, MR, Product..."
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
                  {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ML Score</th> */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Products</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tableFilteredData.slice(-10).reverse().map((order) => (
                  <tr key={order.orderId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.orderId}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                        <div className="text-sm text-gray-500">{order.customerType}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{order.medicalRepresentative || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₹{order.netAmount?.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        order.deliveryStatus === 'Delivered' ? 'bg-green-100 text-green-800' :
                        order.deliveryStatus === 'In Transit' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {order.deliveryStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.deliveredFrom}</td>
                    {/* ML Score cell */}
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-700 max-w-xs">
                        {order.orderItems && order.orderItems.length > 0 ?
                          order.orderItems.map((item, idx) => (
                            <div key={idx} className="mb-1 last:mb-0 p-2 bg-gray-50 rounded border-l-2 border-green-500">
                              <div className="font-medium text-gray-900">{item.medicineName}</div>
                              <div className="text-gray-500 text-xs flex justify-between">
                                <span>{item.packSize}</span>
                                <span>Qty: {item.quantity}</span>
                              </div>
                              <div className="text-green-600 text-xs font-medium">₹{item.unitPrice?.toFixed(2)} each</div>
                            </div>
                          )) :
                          (order.productName &&
                            <div className="p-2 bg-gray-50 rounded">
                              <div className="font-medium text-gray-900">{order.productName}</div>
                              {order.packSize && <div className="text-gray-500 text-xs">Pack: {order.packSize}</div>}
                            </div>
                          )
                        }
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

  const ProductsTab = () => {
    // Ensure all data dependencies (individualProducts, medicinePerformance etc.) handle empty/null states
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Brain className="h-5 w-5 mr-2 text-purple-600" /> Product Sales Analytics
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">View:</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('medicine')}
                  className={`px-4 py-2 text-sm rounded-md transition-colors ${viewMode === 'medicine' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Medicine-wise
                </button>
                <button
                  onClick={() => setViewMode('pack')}
                  className={`px-4 py-2 text-sm rounded-md transition-colors ${viewMode === 'pack' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Pack-wise
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div>
              <SearchableDropdown
                options={uniqueMedicines || []} // Handle empty
                value={currentMedicine || ''}
                onChange={(medicineName) => {
                  const firstProduct = individualProducts.find(p => p.medicineName === medicineName);
                  if (firstProduct) {
                    setSelectedProduct(firstProduct.sku);
                    setSelectedPackSize(firstProduct.packSize);
                  }
                }}
                placeholder="Select Medicine..."
                label="Medicine Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pack Size & Price</label>
              <select
                value={selectedPackSize || ''}
                onChange={(e) => {
                  const packSize = e.target.value;
                  const product = (availablePackSizes || []).find(p => p.packSize === packSize);
                  if (product) {
                    setSelectedProduct(product.sku);
                    setSelectedPackSize(packSize);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={!currentMedicine || (availablePackSizes || []).length === 0}
              >
                <option value="">Select Pack Size...</option>
                {(availablePackSizes || []).map((product, index) => (
                  <option key={index} value={product.packSize}>
                    {product.packSize} - ₹{product.mrp} (SKU: {product.sku})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {currentProduct && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {/* Product Info Cards */}
              <div className="bg-blue-50 p-4 rounded-lg"><p className="text-sm text-blue-600">Medicine</p><p className="font-semibold">{currentProduct.medicineName}</p></div>
              <div className="bg-green-50 p-4 rounded-lg"><p className="text-sm text-green-600">Pack Size</p><p className="font-semibold">{currentProduct.packSize}</p></div>
              <div className="bg-purple-50 p-4 rounded-lg"><p className="text-sm text-purple-600">MRP</p><p className="font-semibold">₹{currentProduct.mrp}</p></div>
              <div className="bg-orange-50 p-4 rounded-lg"><p className="text-sm text-orange-600">Variants</p><p className="font-semibold">{(availablePackSizes || []).length} packs</p></div>
            </div>
          )}
        </div>

        {viewMode === 'medicine' ? (
          <MedicineWiseAnalytics
            medicinePerformance={medicinePerformance || {}}
            selectedMedicine={currentMedicine}
            availablePackSizes={availablePackSizes || []}
          />
        ) : (
          <PackWiseAnalytics
            packSizePerformance={packSizePerformance || {}}
            selectedProduct={currentProduct}
          />
        )}

        {currentMedicine && (availablePackSizes || []).length > 1 && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h4 className="font-medium mb-4">Pack Size Comparison for {currentMedicine}</h4>
            {/* Table for pack size comparison */}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(productPredictions.insights || []).map((insight, index) => (
            <MLInsightCard key={index} insight={insight} />
          ))}
        </div>

        <ProductForecastChart
          data={(productPredictions.forecasts || []).map((forecast, index) => ({
            month: new Date(forecast.month).toLocaleDateString('en-US', { month: 'short' }),
            revenue: forecast.revenue,
            quantity: forecast.quantity,
            confidence: forecast.confidence * 100
          }))}
        />
      </div>
    );
  };

  const CustomersTab = () => {
    // Ensure all data dependencies handle empty/null states
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-lg font-semibold flex items-center">
              <Brain className="h-5 w-5 mr-2 text-purple-600" /> Customer Intelligence
            </h3>
            <div className="w-80">
              <SearchableDropdown
                options={(uniqueCustomers || []).map(c => c.name)}
                value={(uniqueCustomers || []).find(c => c.id === selectedCustomer)?.name || ''}
                onChange={(value) => {
                  const customer = (uniqueCustomers || []).find(c => c.name === value);
                  if (customer) setSelectedCustomer(customer.id);
                }}
                placeholder="Select Customer..."
                label="Customer"
              />
            </div>
          </div>

          {customerPredictions.patterns && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {/* Customer Info Cards */}
              <div className="bg-blue-50 p-4 rounded-lg"><p className="text-sm text-blue-600">Type</p><p className="font-semibold">{customerPredictions.patterns.customerInfo?.customerType}</p></div>
              <div className="bg-green-50 p-4 rounded-lg"><p className="text-sm text-green-600">Territory</p><p className="font-semibold">{customerPredictions.patterns.customerInfo?.territory}</p></div>
              <div className="bg-purple-50 p-4 rounded-lg"><p className="text-sm text-purple-600">Orders</p><p className="font-semibold">{customerPredictions.patterns.totalOrders}</p></div>
              <div className="bg-orange-50 p-4 rounded-lg"><p className="text-sm text-orange-600">Avg Value</p><p className="font-semibold">₹{customerPredictions.patterns.avgOrderValue?.toFixed(0)}</p></div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(customerPredictions.insights || []).map((insight, index) => (
             <div key={index} className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-800">{insight.title}</h4>
                <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">{insight.confidence}</div>
              </div>
              <p className="text-2xl font-bold text-green-600 mb-1">{insight.value}</p>
              <p className="text-sm text-gray-600">{insight.description}</p>
            </div>
          ))}
        </div>

        {/* Next Order Predictions, Recommendations, Behavior Analysis sections */}
        {/* Ensure robust data checks for customerPredictions.forecasts, .recommendations, .patterns */}

      </div>
    );
  };


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
        filters={filters} // Pass full filters state
        setFilters={setFilters} // Pass setFilters for direct updates if needed
        isFiltersVisible={isFiltersVisible}
        setIsFiltersVisible={setIsFiltersVisible}
        pendingFilters={pendingFilters} // For controlled filter panel
        setPendingFilters={setPendingFilters} // For controlled filter panel
        refreshData={refreshData}
        lastRefresh={lastRefresh}
        connectionStatus={connectionStatus}
        isLoading={isLoading && connectionStatus !== 'connecting'} // Pass loading state for non-initial loads
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
