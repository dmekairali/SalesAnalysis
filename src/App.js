import React, { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { TrendingUp, ShoppingCart, Users, MapPin, Package, Brain, Star, XOctagon, Search, X , RefreshCw} from 'lucide-react';

// Import modules - Updated paths for Create React App
import { initializeData, COLORS, calculateKPIs, getUniqueValues, transformProductData, getPackSizeAnalytics, fetchDashboardOrders,
  fetchCustomerAnalyticsTableData,
  transformProductDataEnhanced, 
  getPackSizeAnalyticsEnhanced, 
  getFulfillmentCenterComparison,
  generateProductInsightsByFulfillment  
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
// Add this import at the top of App.js
import MRVisitPlannerDashboard from './visitPlanner/MRVisitPlannerDashboard';



const AyurvedicDashboard = () => {
  const [orderData, setOrderData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [customerData, setCustomerData] = useState([]);
  const [mrData, setMrData] = useState([]);
  const [dashboardOrderData, setDashboardOrderData] = useState([]);
  const [customerAnalyticsData, setCustomerAnalyticsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedProduct, setSelectedProduct] = useState('CGMMG0100NP2201');
  const [selectedCustomer, setSelectedCustomer] = useState('CUST001');
  const [selectedPackSize, setSelectedPackSize] = useState('100Pills');
  const [viewMode, setViewMode] = useState('medicine'); // 'medicine' or 'pack'
  const [showMLAnalytics, setShowMLAnalytics] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Updated state declarations (add these to existing state)
const [selectedFulfillmentCenter, setSelectedFulfillmentCenter] = useState('');
const [productAnalysisData, setProductAnalysisData] = useState(null);
const [loadingAnalysis, setLoadingAnalysis] = useState(false);
const [analysisGenerated, setAnalysisGenerated] = useState(false);
  
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
    tableSearchInput: '' // Separate input state for search
  });
  const [isFiltersVisible, setIsFiltersVisible] = useState(true);
  const [pendingFilters, setPendingFilters] = useState(filters); // For Apply button functionality


  // Replace the existing transformProductData usage with this:
const { individualProducts, groupedByMedicine, groupedByVariant } = useMemo(() => 
  transformProductDataEnhanced(productData), [productData]
);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const { sampleOrderData: fetchedOrders, productMasterData: fetchedProducts, customerData: fetchedCustomers, mrData: fetchedMrs } = await initializeData();
        setOrderData(fetchedOrders || []);
        setProductData(fetchedProducts || []);
        setCustomerData(fetchedCustomers || []);
        setMrData(fetchedMrs || []);

        const fetchedDashboardOrders = await fetchDashboardOrders();
        setDashboardOrderData(fetchedDashboardOrders || []);

        const fetchedAnalytics = await fetchCustomerAnalyticsTableData();
        // console.log('Fetched customerAnalyticsData:', fetchedAnalytics); // Removed
        setCustomerAnalyticsData(fetchedAnalytics || []);
      } catch (error) {
        console.error("Error initializing data:", error);
        // Optionally, set an error state here to display to the user
        setOrderData([]); // Ensure data arrays are empty on error
        setProductData([]);
        setCustomerData([]);
        setMrData([]);
        setDashboardOrderData([]);
        setCustomerAnalyticsData([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []); // Empty dependency array to run only on mount

  // Removed useEffect for logging customerAnalyticsData state

  useEffect(() => {
    console.log('[DataLoad_Debug] orderData state updated. Total Length:', orderData.length);
    // Optionally, log a few more details if orderData is very small, to ensure it's not empty due to an error
    if (orderData.length > 0 && orderData.length < 5) {
      try {
        console.log('[DataLoad_Debug] Sample of small orderData:', JSON.parse(JSON.stringify(orderData)));
      } catch(e) {
        console.log('[DataLoad_Debug] Sample of small orderData (raw):', orderData);
      }
    }
  }, [orderData]);

  // Initialize ML Models
  const productML = useMemo(() => new ProductForecastingML(), []);
  const customerML = useMemo(() => new CustomerForecastingML(), []);

  // Real-time notifications
  useEffect(() => {
    const interval = setInterval(() => {
      // Ensure orderData is not empty before trying to access it
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
  // This filteredData and its related logic might be obsolete if all components switch to filteredDashboardData
  // For now, it's kept as it's used by exportWithMLInsights and potentially other non-refactored parts.
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

    // Apply category filter (existing chart filter)
    if (filters.selectedCategory) {
      data = data.filter(order => order.category === filters.selectedCategory);
    }

    // Apply top product filter (existing chart filter)
    if (filters.selectedTopProduct) {
      data = data.filter(order => order.productName === filters.selectedTopProduct);
    }

    return data;
  }, [filters, orderData]);

  // Create filteredDashboardData based on filters (memoized for performance)
  const filteredDashboardData = useMemo(() => {
    // dashboardOrderData is expected to have camelCase keys from fetchDashboardOrders
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
      netAmount: o.netAmount, // Already defaults to 0 from fetchDashboardOrders
      deliveredFrom: o.deliveredFrom,
      discountTier: o.discountTier,
      deliveryStatus: o.deliveryStatus,
      products: o.products || [], // Already defaults to [] from fetchDashboardOrders
      categories: o.categories || [], // Already defaults to [] from fetchDashboardOrders
      totalQuantity: o.totalQuantity || 0, // Add fallback for numeric
      lineItemsCount: o.lineItemsCount || 0 // Add fallback for numeric
    }));

    // Apply date range filter
    if (filters.dateRange?.[0] || filters.dateRange?.[1]) {
      const startDate = filters.dateRange[0] ? new Date(filters.dateRange[0]) : null;
      const endDate = filters.dateRange[1] ? new Date(filters.dateRange[1]) : null;

      data = data.filter(order => {
        if (!order.date) return false; // Skip if date is missing
        const orderDateAttempt = new Date(order.date);
        if (isNaN(orderDateAttempt.getTime())) {
            return false; // Skip order if its date is invalid
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
        (order.products && order.products.some(p => p.toLowerCase().includes(lowerSearchTerm))) || // Search in products array
        (order.categories && order.categories.some(c => c.toLowerCase().includes(lowerSearchTerm))) || // Search in categories array
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

    // Apply category filter (existing chart filter)
    if (filters.selectedCategory) {
      data = data.filter(order => (order.categories && order.categories.includes(filters.selectedCategory)));
    }

    // Apply top product filter (existing chart filter)
    if (filters.selectedTopProduct) {
      data = data.filter(order => (order.products && order.products.includes(filters.selectedTopProduct)));
    }

    return data;
  }, [filters, dashboardOrderData]);

  // Separate table filtered data to prevent page jumping
  const tableFilteredData = useMemo(() => {
    if (!filters.tableSearchTerm) return filteredDashboardData;
    
    const searchTerm = filters.tableSearchTerm.toLowerCase();
    return filteredDashboardData.filter(order =>
      (order.orderId && order.orderId.toLowerCase().includes(searchTerm)) ||
      (order.customerName && order.customerName.toLowerCase().includes(searchTerm)) ||
      ((order.medicalRepresentative || 'N/A').toLowerCase().includes(searchTerm)) ||
      // Search in the products array, as productName is not a direct field
      (order.products && order.products.some(p => p.toLowerCase().includes(searchTerm)))
    );
  }, [filteredDashboardData, filters.tableSearchTerm]);

  // Handle table search
  const handleTableSearch = () => {
    setFilters(prev => ({ ...prev, tableSearchTerm: prev.tableSearchInput }));
  };

  // Handle Enter key in search input
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

  
  // Customer predictions  
  const customerPredictions = useMemo(() => {
    console.log('[App_Debug] customerPredictions hook triggered. Selected Customer ID:', selectedCustomer);
    console.log('[App_Debug] Total orderData length:', orderData ? orderData.length : 'orderData is null/undefined');
    console.log('[App_Debug] Total productData length:', productData ? productData.length : 'productData is null/undefined');

    if (orderData && selectedCustomer) {
      const relevantOrderItems = orderData.filter(o => o.customerId === selectedCustomer);
      console.log('[App_Debug] Found relevantOrderItems for selectedCustomer:', relevantOrderItems.length);
      if (relevantOrderItems.length > 0 && relevantOrderItems.length < 20) { // Log sample if not too many
         try {
            console.log('[App_Debug] Sample of relevantOrderItems:', JSON.parse(JSON.stringify(relevantOrderItems.slice(0, 5))));
         } catch (e) {
            console.error('[App_Debug] Error stringifying relevantOrderItems sample:', e);
            console.log('[App_Debug] Sample of relevantOrderItems (raw first 5):', relevantOrderItems.slice(0, 5));
         }
      }
    } else {
      console.log('[App_Debug] orderData or selectedCustomer is missing, cannot filter relevantOrderItems.');
    }

    if (!productData || productData.length === 0 || !orderData || orderData.length === 0 || !selectedCustomer) return { forecasts: [], insights: [], recommendations: [], patterns: null };
    return customerML.predictCustomerBehavior(selectedCustomer, orderData, productData, 6);
  }, [selectedCustomer, customerML, orderData, productData]);


  // Get analytics for both medicine-wise and pack-wise views
  const { packSizePerformance, medicinePerformance } = useMemo(() => 
    getPackSizeAnalytics(filteredData), [filteredData]
  );

  // Get unique values for dropdowns
  const uniqueProducts = individualProducts; // This seems fine as individualProducts is derived from productData
  const uniqueMedicines = useMemo(() => {
    if (!individualProducts || individualProducts.length === 0) return [];
    return [...new Set(individualProducts.map(p => p.medicineName))];
  }, [individualProducts]);

  
// Updated unique customers computation (replace existing uniqueCustomers)
const uniqueCustomers = useMemo(() => {
  if (!customerAnalyticsData || customerAnalyticsData.length === 0) {
    return [];
  }

  
   const mappedCustomers = customerAnalyticsData
    .filter(analytics => {
      const idField = analytics.customer_code;
      return idField !== null && idField !== undefined && 
             (typeof idField === 'string' ? idField.trim() !== '' : true);
    })
    .map(analytics => {
      const id = String(analytics.customer_code);
      let name = analytics.customer_name;
      if (!name || (typeof name === 'string' && name.trim() === '')) {
        name = `Customer [${id}]`;
      } else if (typeof name !== 'string') {
        name = String(name);
      }

      return { id: id, name: name };
    });

  return mappedCustomers.filter((value, index, self) =>
    self.findIndex(c => c.id === value.id) === index
  );
}, [customerAnalyticsData]);



  // Updated product selection logic for different view modes
const availableOptions = useMemo(() => {
  if (viewMode === 'medicine') {
    // For medicine-wise: return list of medicine names
    return [...new Set(individualProducts.map(p => p.medicineName))].sort();
  } else {
    // For pack-wise: return variant codes with display info
    return groupedByVariant.map(p => ({
      code: p.variantCode,
      name: `${p.medicineName} (${p.packSize})`,
      mrp: p.mrp,
      medicineName: p.medicineName,
      packSize: p.packSize
    })).sort((a, b) => a.name.localeCompare(b.name));
  }
}, [individualProducts, groupedByVariant, viewMode]);


  // Current product/variant selection
const currentSelection = useMemo(() => {
  if (viewMode === 'medicine') {
    return individualProducts.filter(p => p.medicineName === selectedProduct);
  } else {
    return groupedByVariant.find(p => p.variantCode === selectedProduct);
  }
}, [individualProducts, groupedByVariant, selectedProduct, viewMode]);

// Fulfillment center options
const uniqueFulfillmentCenters = useMemo(() => {
  const centers = [...new Set(filteredDashboardData.map(order => order.deliveredFrom))]
    .filter(Boolean)
    .sort();
  return ['All Fulfillment Centers', ...centers];
}, [filteredDashboardData]);

// Generate analysis function
const generateAnalysis = async () => {
  if (!selectedFulfillmentCenter) {
    alert('Please select a fulfillment center first');
    return;
  }

  setLoadingAnalysis(true);
  try {
    // Simulate analysis generation delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Get enhanced analytics based on fulfillment center
    const analytics = getPackSizeAnalyticsEnhanced(
      filteredDashboardData, 
      selectedFulfillmentCenter
    );
    
    // Generate insights
    const insights = generateProductInsightsByFulfillment(
      analytics, 
      selectedFulfillmentCenter
    );
    
    setProductAnalysisData({
      ...analytics,
      insights,
      selectedFulfillmentCenter,
      viewMode,
      selectedProduct
    });
    
    setAnalysisGenerated(true);
    console.log('✅ Product analysis generated successfully');
    
  } catch (error) {
    console.error('Error generating analysis:', error);
    alert('Error generating analysis. Please try again.');
  }
  setLoadingAnalysis(false);
};

// Reset analysis when key parameters change
useEffect(() => {
  if (analysisGenerated) {
    setAnalysisGenerated(false);
    setProductAnalysisData(null);
  }
}, [selectedFulfillmentCenter, viewMode, selectedProduct]);

// Updated product predictions with fulfillment center filtering
const productPredictions = useMemo(() => {
  if (!productData || productData.length === 0 || !analysisGenerated || !productAnalysisData) {
    return { forecasts: [], insights: [], product: null };
  }
  
  // Filter data by fulfillment center for predictions
  const fulfillmentFilteredData = selectedFulfillmentCenter && selectedFulfillmentCenter !== 'All Fulfillment Centers'
    ? filteredDashboardData.filter(order => order.deliveredFrom === selectedFulfillmentCenter)
    : filteredDashboardData;
  
  const targetProduct = viewMode === 'medicine' ? selectedProduct : currentSelection?.medicineName;
  if (!targetProduct) return { forecasts: [], insights: [], product: null };
  
  return productML.predictProductSales(targetProduct, fulfillmentFilteredData, productData, 6);
}, [selectedProduct, currentSelection, productML, filteredDashboardData, selectedFulfillmentCenter, analysisGenerated, productAnalysisData, viewMode]);

// Clear analysis function
const clearAnalysis = () => {
  setAnalysisGenerated(false);
  setProductAnalysisData(null);
  setSelectedProduct('');
  setSelectedFulfillmentCenter('');
};

  // Effect to reset selectedCustomer if it's no longer in uniqueCustomers (e.g., after data refresh)
  useEffect(() => {
    // console.log('useEffect for selectedCustomer: uniqueCustomers:', uniqueCustomers, 'selectedCustomer:', selectedCustomer); // Removed
    if (uniqueCustomers.length > 0 && !uniqueCustomers.find(c => c.id === selectedCustomer)) {
      const newSelectedCustomerId = uniqueCustomers[0].id;
      // console.log('Setting selectedCustomer to:', newSelectedCustomerId); // Removed
      setSelectedCustomer(newSelectedCustomerId);
    } else if (uniqueCustomers.length === 0 && selectedCustomer !== null) {
      // console.log('Setting selectedCustomer to: null'); // Removed
      setSelectedCustomer(null);
    }
  }, [uniqueCustomers, selectedCustomer]);

  const selectedCustomerAnalytics = useMemo(() => {
    if (!selectedCustomer || !customerAnalyticsData || customerAnalyticsData.length === 0) return null;
    // Ensure this uses customer_code if uniqueCustomers' id is customer_code
    return customerAnalyticsData.find(analytics => analytics.customer_code === selectedCustomer);
  }, [customerAnalyticsData, selectedCustomer]);

  // Current product data based on selection
  const currentProduct = useMemo(() => individualProducts.find(p => p.sku === selectedProduct), [individualProducts, selectedProduct]);
  const currentMedicine = currentProduct?.medicineName;
  const availablePackSizes = useMemo(() => individualProducts.filter(p => p.medicineName === currentMedicine), [individualProducts, currentMedicine]);

  // Calculate data for charts using filteredDashboardData
  const kpis = useMemo(() => {
    if (!filteredDashboardData || filteredDashboardData.length === 0) {
      // Return a default KPI structure if filteredDashboardData is empty
      return { totalRevenue: 0, totalOrders: 0, activeCustomers: 0, deliveryRate: 0, avgOrderValue: 0 };
    }
    return calculateKPIs(filteredDashboardData);
  }, [filteredDashboardData]);
  
  // Enhanced chart data with predictions
  // This chartDataWithPredictions is now updated to use filteredDashboardData
  const chartDataWithPredictions = useMemo(() => {
    const monthlyData = {};
    // Use filteredDashboardData as the source
    filteredDashboardData.forEach(order => {
      if (!order.date || isNaN(new Date(order.date).getTime())) {
        return; // Skip if date is invalid or missing
      }
      const month = new Date(order.date).toISOString().slice(0, 7); // order.date is available
      if (!monthlyData[month]) monthlyData[month] = { month, actual: 0, orders: 0 };
      monthlyData[month].actual += (order.netAmount || 0); // order.netAmount is available, ensure it's a number
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
  }, [filteredDashboardData, kpis.avgOrderValue]);

  // Geographic data
  const geoData = useMemo(() => {
    const locationData = {};
    filteredDashboardData.forEach(order => {
      const key = order.city; // city is available
      if (!locationData[key]) {
        locationData[key] = {
          city: order.city,
          state: order.state, // state is available
          value: 0,
          orders: 0
        };
      }
      locationData[key].value += (order.netAmount || 0); // netAmount is available
      locationData[key].orders += 1;
    });
    return Object.values(locationData);
  }, [filteredDashboardData]);

  // Chart data preparations
  const categoryData = useMemo(() => {
    const categoriesMap = filteredDashboardData.reduce((acc, order) => {
      if (order.categories && Array.isArray(order.categories)) {
        order.categories.forEach(category => {
          acc[category] = (acc[category] || 0) + (order.netAmount || 0);
        });
      }
      return acc;
    }, {});
    return Object.entries(categoriesMap).map(([name, value]) => ({ name, value }));
  }, [filteredDashboardData]);

  const topProductsData = useMemo(() => {
    const productsMap = filteredDashboardData.reduce((acc, order) => {
      if (order.products && Array.isArray(order.products)) {
        order.products.forEach(productName => {
          acc[productName] = (acc[productName] || 0) + (order.netAmount || 0);
        });
      }
      return acc;
    }, {});
    return Object.entries(productsMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name: name.substring(0, 15), value }));
  }, [filteredDashboardData]);

  const fulfillmentData = useMemo(() => [
    { name: 'Factory', value: filteredDashboardData.filter(o => o.deliveredFrom === 'Factory').length },
    { name: 'Distributor', value: filteredDashboardData.filter(o => o.deliveredFrom === 'Distributor').length }
  ], [filteredDashboardData]);

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
        {/* Enhanced Filters */}
        <EnhancedOverviewFilters
          filters={filters}
          setFilters={setFilters}
          sampleOrderData={orderData} // Use orderData instead of sampleOrderData
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
                    selectedCategory: null,
                    selectedTopProduct: null,
                    selectedMR: null,
                    selectedFulfillmentCenter: null,
                    selectedState: null,
                    tableSearchTerm: '',
                    tableSearchInput: ''
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
                <h3 className="text-lg font-semibold">Recent Orders with ML Insights</h3>
                <span className="text-sm text-gray-600">
                  Showing latest {Math.min(10, tableFilteredData.length)} orders (of {filteredDashboardData.length} total)
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ML Score</th>
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
                        {/* customerType should be available from filteredDashboardData's mapping if order.customer_type exists */}
                        <div className="text-sm text-gray-500">{order.customerType}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.medicalRepresentative || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {/* netAmount should be available from filteredDashboardData's mapping */}
                      ₹{(order.netAmount || 0).toLocaleString()}
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Brain className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-600">
                          {(85 + Math.random() * 10).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-700 max-w-xs">
                        {/* Simplified product display for dashboardOrderData */}
                        {order.products && order.products.length > 0 ? (
                          order.products.map((productName, idx) => (
                            <div key={idx} className="mb-1 last:mb-0 p-2 bg-gray-50 rounded">
                              <div className="font-medium text-gray-900">{productName}</div>
                            </div>
                          ))
                        ) : (
                          <div className="p-2 bg-gray-50 rounded">
                            <div className="font-medium text-gray-900 italic">No products listed</div>
                          </div>
                        )}
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

  // Products Tab Component with Pack Size Support
  // Complete Updated ProductsTab Component - Replace in App.js

const ProductsTab = () => {
  return (
    <div className="space-y-6">
      {/* Enhanced Control Panel */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Brain className="h-5 w-5 mr-2 text-purple-600" />
            Product Sales Analytics Engine
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">View:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('medicine')}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  viewMode === 'medicine'
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Medicine-wise
              </button>
              <button
                onClick={() => setViewMode('pack')}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  viewMode === 'pack'
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Pack-wise (Variant)
              </button>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Fulfillment Center Filter */}
          <div>
            <SearchableDropdown
              options={uniqueFulfillmentCenters}
              value={selectedFulfillmentCenter}
              onChange={setSelectedFulfillmentCenter}
              placeholder="Select Fulfillment Center..."
              label="Fulfillment Center"
            />
          </div>

          {/* Product/Variant Selector */}
          <div>
            {viewMode === 'medicine' ? (
              <SearchableDropdown
                options={availableOptions}
                value={selectedProduct}
                onChange={setSelectedProduct}
                placeholder="Select Medicine..."
                label="Medicine Name"
              />
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pack Variant (by Variant Code)
                </label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select Pack Variant...</option>
                  {availableOptions.map((variant, index) => (
                    <option key={index} value={variant.code}>
                      {variant.name} - ₹{variant.mrp} ({variant.code})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-end space-x-2">
            <button
              onClick={generateAnalysis}
              disabled={loadingAnalysis || !selectedFulfillmentCenter}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loadingAnalysis ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Generate Analysis
                </>
              )}
            </button>
            {analysisGenerated && (
              <button
                onClick={clearAnalysis}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Enhanced Filter Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-blue-800">Fulfillment Center:</span>
              <div className="text-blue-700 mt-1">
                {selectedFulfillmentCenter || 'Not selected'}
              </div>
            </div>
            <div>
              <span className="font-medium text-blue-800">Analysis Mode:</span>
              <div className="text-blue-700 mt-1 capitalize">{viewMode}-wise Analysis</div>
            </div>
            <div>
              <span className="font-medium text-blue-800">Selected Item:</span>
              <div className="text-blue-700 mt-1">
                {selectedProduct || 'Not selected'}
              </div>
            </div>
            <div>
              <span className="font-medium text-blue-800">Data Source:</span>
              <div className="text-blue-700 mt-1">
                {selectedFulfillmentCenter && selectedFulfillmentCenter !== 'All Fulfillment Centers'
                  ? `${(filteredDashboardData.filter(o => o.deliveredFrom === selectedFulfillmentCenter)).length} orders`
                  : `${filteredDashboardData.length} orders (all centers)`
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loadingAnalysis && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <RefreshCw className="h-12 w-12 text-purple-600 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating Product Analysis</h3>
          <p className="text-gray-600 mb-4">
            Analyzing {selectedFulfillmentCenter && selectedFulfillmentCenter !== 'All Fulfillment Centers'
              ? `orders from ${selectedFulfillmentCenter}`
              : 'orders from all fulfillment centers'
            }...
          </p>
          <div className="space-y-1 text-sm text-gray-500">
            <p>✓ Processing {viewMode}-wise data</p>
            <p>✓ Calculating performance metrics</p>
            <p>✓ Generating ML predictions</p>
          </div>
        </div>
      )}

      {/* No Analysis Generated State */}
      {!analysisGenerated && !loadingAnalysis && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Generate Product Analysis</h3>
          <p className="text-gray-600 mb-6">
            Configure your analysis parameters and generate comprehensive insights
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="text-left">
              <h4 className="font-medium text-gray-900 mb-3">Medicine-wise Analysis</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p>✓ Performance by medicine name</p>
                <p>✓ Category-wise distribution</p>
                <p>✓ Revenue and quantity analysis</p>
                <p>✓ No pack size filtering needed</p>
              </div>
            </div>
            
            <div className="text-left">
              <h4 className="font-medium text-gray-900 mb-3">Pack-wise Analysis</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p>✓ Analysis by variant code</p>
                <p>✓ SKU variant tracking</p>
                <p>✓ MRP change history</p>
                <p>✓ Pack size performance</p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Select a fulfillment center first to enable analysis generation. 
              Choose "All Fulfillment Centers" for comprehensive analysis across all locations.
            </p>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysisGenerated && !loadingAnalysis && productAnalysisData && (
        <>
          {/* Analysis Header */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xl font-semibold text-gray-900">
                Analysis Results - {viewMode === 'medicine' ? 'Medicine-wise' : 'Pack-wise (Variant-based)'}
              </h4>
              <div className="flex items-center space-x-4 text-sm">
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
                  {productAnalysisData.totalOrders} Orders Analyzed
                </span>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                  {formatCurrencyByContext(productAnalysisData.totalRevenue, 'card')} Total Revenue
                </span>
              </div>
            </div>

            {/* Current Selection Info */}
            {viewMode === 'medicine' && selectedProduct && currentSelection && currentSelection.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600">Selected Medicine</p>
                  <p className="font-semibold">{selectedProduct}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600">Available Variants</p>
                  <p className="font-semibold">{currentSelection.length}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-purple-600">Category</p>
                  <p className="font-semibold">{currentSelection[0]?.category || 'N/A'}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-orange-600">Brand</p>
                  <p className="font-semibold">{currentSelection[0]?.brand || 'N/A'}</p>
                </div>
              </div>
            )}

            {viewMode === 'pack' && selectedProduct && currentSelection && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600">Variant Code</p>
                  <p className="font-semibold">{currentSelection.variantCode}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600">Pack Size</p>
                  <p className="font-semibold">{currentSelection.packSize}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-purple-600">Current MRP</p>
                  <p className="font-semibold">₹{currentSelection.mrp}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-orange-600">SKU Variants</p>
                  <p className="font-semibold">{currentSelection.skus?.length || 0}</p>
                </div>
              </div>
            )}
          </div>

          {/* Analytics Components */}
          {viewMode === 'medicine' ? (
            <MedicineWiseAnalytics 
              medicinePerformance={productAnalysisData.medicinePerformance}
              selectedMedicine={selectedProduct}
              fulfillmentCenter={selectedFulfillmentCenter}
            />
          ) : (
            <PackWiseAnalytics 
              packSizePerformance={productAnalysisData.packSizePerformance}
              selectedVariant={currentSelection}
              fulfillmentCenter={selectedFulfillmentCenter}
            />
          )}

          {/* ML Insights */}
          {productAnalysisData.insights && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {productAnalysisData.insights.map((insight, index) => (
                <MLInsightCard key={index} insight={insight} />
              ))}
            </div>
          )}

          {/* Sales Forecast Chart */}
          {productPredictions.forecasts && productPredictions.forecasts.length > 0 && (
            <ProductForecastChart 
              data={productPredictions.forecasts.map((forecast, index) => ({
                month: new Date(forecast.month).toLocaleDateString('en-US', { month: 'short' }),
                revenue: forecast.revenue,
                quantity: forecast.quantity,
                confidence: forecast.confidence * 100
              }))}
            />
          )}

          {/* Fulfillment Center Impact Analysis */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h4 className="font-medium mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Fulfillment Center Impact Analysis
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h6 className="font-medium text-gray-900 mb-2">Analysis Scope</h6>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fulfillment Center:</span>
                    <span className="font-semibold">{productAnalysisData.selectedFulfillmentCenter}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Analysis Type:</span>
                    <span className="font-semibold capitalize">{productAnalysisData.viewMode}-wise</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Orders:</span>
                    <span className="font-semibold">{productAnalysisData.totalOrders}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h6 className="font-medium text-gray-900 mb-2">Performance Metrics</h6>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Revenue:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrencyByContext(productAnalysisData.totalRevenue, 'table')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Order Value:</span>
                    <span className="font-semibold">
                      {formatCurrencyByContext(
                        productAnalysisData.totalOrders > 0 
                          ? productAnalysisData.totalRevenue / productAnalysisData.totalOrders 
                          : 0, 
                        'table'
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {viewMode === 'medicine' ? 'Medicines' : 'Variants'}:
                    </span>
                    <span className="font-semibold">
                      {viewMode === 'medicine' 
                        ? Object.keys(productAnalysisData.medicinePerformance).length
                        : Object.keys(productAnalysisData.variantPerformance).length
                      }
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h6 className="font-medium text-gray-900 mb-2">Data Quality</h6>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Data Points:</span>
                    <span className="font-semibold">{productAnalysisData.totalOrders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quality Score:</span>
                    <span className={`font-semibold ${
                      productAnalysisData.totalOrders > 100 ? 'text-green-600' :
                      productAnalysisData.totalOrders > 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {productAnalysisData.totalOrders > 100 ? 'High' :
                       productAnalysisData.totalOrders > 50 ? 'Medium' : 'Low'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Confidence:</span>
                    <span className="font-semibold text-blue-600">
                      {productAnalysisData.totalOrders > 100 ? '95%' :
                       productAnalysisData.totalOrders > 50 ? '85%' : '70%'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

  // Customers Tab Component  
  const CustomersTab = () => {
    const customerInsights = useMemo(() => {
      return customerPredictions?.insights || [];
    }, [customerPredictions]);

    const nextOrderPredictions = useMemo(() => {
      return customerPredictions?.forecasts || [];
    }, [customerPredictions]);

    const timelineChartData = useMemo(() => {
      let combinedData = [];
      const actualOrdersRaw = customerPredictions?.patterns?.distinctSortedOrders;
      const predictedOrdersRaw = customerPredictions?.forecasts;

      if (actualOrdersRaw && Array.isArray(actualOrdersRaw)) {
        const actuals = actualOrdersRaw.map(order => ({
          date: order.date, // Assuming this is a string like 'YYYY-MM-DD'
          value: order.netAmount,
          type: 'actual'
        }));
        combinedData = combinedData.concat(actuals);
      }

      if (predictedOrdersRaw && Array.isArray(predictedOrdersRaw)) {
        const predictions = predictedOrdersRaw.map(forecast => ({
          date: forecast.expectedDate, // Assuming this is 'YYYY-MM-DD'
          value: forecast.expectedValue,
          type: 'predicted',
          probability: forecast.orderProbability
        }));
        combinedData = combinedData.concat(predictions);
      }

      // Sort by date
      combinedData.sort((a, b) => new Date(a.date) - new Date(b.date));

      // Format for the chart
      return combinedData.map(item => ({
        period: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        actualValue: item.type === 'actual' ? item.value : null,
        predictedValue: item.type === 'predicted' ? item.value : null,
        probability: item.type === 'predicted' ? (item.probability * 100) : null
      }));
    }, [customerPredictions]);

    const productRecommendations = useMemo(() => {
      return customerPredictions?.recommendations || [];
    }, [customerPredictions]);

    const purchasePatterns = useMemo(() => {
      if (!customerPredictions?.patterns) {
        return { monthly_pattern: {}, preferred_products: [] };
      }
      return {
        monthly_pattern: customerPredictions.patterns.monthlyPattern || {},
        preferred_products: customerPredictions.patterns.preferredProducts || []
      };
    }, [customerPredictions]);

    const churnAttentionDetails = useMemo(() => {
      let message = null;
      let level = 'info'; // Default level

      const forecasts = customerPredictions?.forecasts;
      const actualOrders = customerPredictions?.patterns?.distinctSortedOrders;

      if (!forecasts || forecasts.length === 0 || !actualOrders) {
        return { message, level };
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize to start of day for comparison

      for (let i = 0; i < forecasts.length; i++) {
        const forecast = forecasts[i];
        const forecastDate = new Date(forecast.expectedDate);
        forecastDate.setHours(0, 0, 0, 0); // Normalize

        if (forecastDate < today) {
          // This prediction is in the past
          const windowStart = forecastDate;
          // Determine the end of the window for checking actual orders
          // It's either the day before the next forecast, or today if this is the last past forecast
          let windowEnd = today;
          if (i + 1 < forecasts.length) {
            const nextForecastDate = new Date(forecasts[i+1].expectedDate);
            nextForecastDate.setHours(0,0,0,0);
            // If next forecast is also in past or today, use it as boundary, otherwise use today
            windowEnd = nextForecastDate <= today ? new Date(nextForecastDate.getTime() - 86400000) : today;
          }

          const foundActualOrder = actualOrders.some(order => {
            const actualOrderDate = new Date(order.date);
            actualOrderDate.setHours(0, 0, 0, 0); // Normalize
            return actualOrderDate >= windowStart && actualOrderDate <= windowEnd;
          });

          if (!foundActualOrder) {
            message = `Attention: Predicted order around ${windowStart.toLocaleDateString()} for ~₹${forecast.expectedValue?.toLocaleString()} was potentially missed.`;

            // Determine level based on how overdue
            const daysDiff = (today.getTime() - windowStart.getTime()) / (1000 * 3600 * 24);
            if (daysDiff > 30) { // Example: more than 30 days overdue
                level = 'error';
                 message = `Critical: Predicted order around ${windowStart.toLocaleDateString()} for ~₹${forecast.expectedValue?.toLocaleString()} appears missed. Over ${daysDiff.toFixed(0)} days overdue.`;
            } else {
                level = 'warning';
            }
            break; // Flag the first significant missed prediction
          }
        } else {
          // Forecasts are sorted by date, so if we hit a future forecast, we can stop
          break;
        }
      }
      return { message, level };
    }, [customerPredictions?.forecasts, customerPredictions?.patterns?.distinctSortedOrders]);

    if (!selectedCustomerAnalytics) {
      return (
        <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
          <div className="text-xl font-semibold text-gray-500">
            {uniqueCustomers.length > 0 ? "Select a customer to view analytics." : "No customer analytics data available."}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Customer Selector */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Brain className="h-5 w-5 mr-2 text-purple-600" />
              Customer Intelligence Engine
            </h3>
            <div className="w-80">
              {/* console.log('CustomersTab: uniqueCustomers for dropdown:', uniqueCustomers.map(c => c.name)); */}
              {/* console.log('CustomersTab: value for dropdown:', uniqueCustomers.find(c => c.id === selectedCustomer)?.name || ''); */}
              <SearchableDropdown
                options={uniqueCustomers.map(c => c.name)}
                value={uniqueCustomers.find(c => c.id === selectedCustomer)?.name || ''}
                onChange={(value) => {
                  const customer = uniqueCustomers.find(c => c.name === value);
                  if (customer) setSelectedCustomer(customer.id);
                }}
                placeholder="Select Customer..."
                label="Customer"
              />
            </div>
          </div>
        </div>

        {/* Churn/Attention Indicator */}
        {churnAttentionDetails.message && (
          <div className={`p-4 rounded-md text-sm mb-6 shadow ${
            churnAttentionDetails.level === 'warning' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
            churnAttentionDetails.level === 'error' ? 'bg-red-100 text-red-800 border border-red-300' :
            'bg-blue-100 text-blue-700 border border-blue-300' // Default to info
          }`}>
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-3"/> {/* Using Users icon, could be AlertTriangle for warning/error */}
              <span className="font-semibold">Customer Alert:</span>
              <p className="ml-2">{churnAttentionDetails.message}</p>
            </div>
          </div>
        )}

       {/* Conditional Analytics Display */}
       {selectedCustomerAnalytics ? (
        <>
          {/* Customer Info - Now conditional */}
          <div className="bg-white p-6 rounded-lg shadow-md"> {/* Card for Customer Info */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600">Customer Type</p>
                <p className="font-semibold">{selectedCustomerAnalytics?.customer_type || 'N/A'}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600">Territory</p>
                <p className="font-semibold">{selectedCustomerAnalytics?.territory || 'N/A'}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-600">Total Orders</p>
                <p className="font-semibold">{selectedCustomerAnalytics?.total_orders || 0}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-orange-600">Avg Order Value</p>
                <p className="font-semibold">₹{(selectedCustomerAnalytics?.avg_order_value || 0).toFixed(0)}</p>
              </div>
            </div>
          </div>

          {/* Customer Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {customerInsights.map((insight, index) => (
              <div key={index} className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-800">{insight.title}</h4>
                  <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    {insight.confidence}
                  </div>
                </div>
                <p className="text-2xl font-bold text-green-600 mb-1">{insight.value}</p>
                <p className="text-sm text-gray-600">{insight.description}</p>
              </div>
            ))}
          </div>

          {/* Next Order Predictions */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Star className="h-5 w-5 mr-2" />
              Next Order Predictions
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Timeline Chart */}
              <CustomerTimelineChart data={timelineChartData} />

              {/* Prediction Details */}
              <div>
                <h4 className="font-medium mb-3">Next 3 Order Predictions</h4>
                <div className="space-y-3">
                  {nextOrderPredictions.slice(0, 3).map((forecast, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Order #{index + 1}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          forecast.confidence > 0.8 ? 'bg-green-100 text-green-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {(forecast.confidence * 100).toFixed(1)}% confident
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        <strong>Expected Date:</strong> {new Date(forecast.expectedDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Expected Value:</strong> ₹{forecast.expectedValue?.toLocaleString() || 0}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Likely Products:</strong> {forecast.likelyProducts?.map(p => p.productName).join(', ') || 'N/A'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Product Recommendations */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Star className="h-5 w-5 mr-2" />
              AI Product Recommendations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {productRecommendations.slice(0, 6).map((rec, index) => (
                <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{rec.productName}</h4>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      Score: {rec.score?.toFixed(1) || 'N/A'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{rec.category}</p>
                  <p className="text-sm text-gray-500 mb-2">{rec.reason}</p>
                  <p className="text-sm font-medium text-green-600">
                    Expected Value: ₹{(rec.expectedValue || 0).toFixed(0)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Behavior Analysis */}
          { (Object.keys(purchasePatterns.monthly_pattern).length > 0 || purchasePatterns.preferred_products.length > 0) && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Customer Behavior Analysis
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Purchase Pattern */}
                {Object.keys(purchasePatterns.monthly_pattern).length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Purchase Patterns</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={Object.entries(purchasePatterns.monthly_pattern).map(([month, orders]) => ({
                        month: `Month ${month}`, // Assuming month is a number like 1, 2, ...
                        orders
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="orders" fill={COLORS.accent} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Product Preferences */}
                {purchasePatterns.preferred_products.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Product Preferences</h4>
                    <div className="space-y-2">
                      {purchasePatterns.preferred_products.map(([product, count], index) => (
                        <div key={index} className="flex justify-between items-center space-x-2">
                          <span className="text-sm flex-1 min-w-0 break-words pr-2">{product}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${Math.min(100, (count / (selectedCustomerAnalytics?.total_orders || 1)) * 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex justify-center items-center min-h-[calc(100vh-300px)]"> {/* Adjusted height */}
          <div className="text-xl font-semibold text-gray-500">
            {uniqueCustomers.length > 0 ? "Select a customer to view analytics." : "No customer analytics data available."}
          </div>
        </div>
      )}
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
        {activeTab === 'products' && <ProductsTab />}
        {activeTab === 'customers' && <CustomersTab />}
        {activeTab === 'visitplanner' && <MRVisitPlannerDashboard />}
        
      </div>
    </div>
  );
};

export default AyurvedicDashboard;
