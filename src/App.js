import React, { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Home, Box, TrendingUp, ShoppingCart, Users, MapPin, Package, Brain, Star, XOctagon, Search, X, Map, CalendarDays, UserSquare } from 'lucide-react';

// Import modules - Updated paths for Create React App
import { initializeData, COLORS, calculateKPIs, getUniqueValues, transformProductData, getPackSizeAnalytics, fetchDashboardOrders, fetchCustomerAnalyticsTableData, fetchMRVisits } from './data.js';
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
  const [orderData, setOrderData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [customerData, setCustomerData] = useState([]);
  const [mrData, setMrData] = useState([]);
  const [dashboardOrderData, setDashboardOrderData] = useState([]);
  const [customerAnalyticsData, setCustomerAnalyticsData] = useState([]);
  const [mrVisitsData, setMrVisitsData] = useState([]);

  const initialDate = new Date();
  const y = initialDate.getFullYear();
  const m = initialDate.getMonth();
  const firstDayCurrentMonth = new Date(y, m, 1).toISOString().split('T')[0];
  const lastDayCurrentMonth = new Date(y, m + 1, 0).toISOString().split('T')[0];

  const [mrVisitsFilters, setMrVisitsFilters] = useState({
    empName: null,
    startDate: firstDayCurrentMonth,
    endDate: lastDayCurrentMonth,
  });

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedProduct, setSelectedProduct] = useState('CGMMG0100NP2201');
  const [selectedCustomer, setSelectedCustomer] = useState('CUST001');
  const [selectedPackSize, setSelectedPackSize] = useState('100Pills');
  const [viewMode, setViewMode] = useState('medicine'); // 'medicine' or 'pack'
  const [showMLAnalytics, setShowMLAnalytics] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
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

  // Component for MR Visits Tab
  const VisitsTab = () => {
    const mrNamesForDropdown = useMemo(() => {
      const names = [...new Set(mrData.map(mr => mr.mr_name || mr.name).filter(Boolean))];
      return ["All MRs", ...names.sort()];
    }, [mrData]);

    const currentYear = new Date().getFullYear();
    const yearOptions = [currentYear, currentYear - 1, currentYear - 2];
    const monthOptions = Array.from({ length: 12 }, (_, i) => ({
      value: i + 1,
      label: new Date(0, i).toLocaleString('default', { month: 'long' })
    }));

    const handleMRChange = (selectedMrName) => {
      setMrVisitsFilters(prev => ({
        ...prev,
        empName: selectedMrName === "All MRs" ? null : selectedMrName
      }));
    };

    const handleYearChange = (e) => {
      const year = parseInt(e.target.value);
      const currentMonth = new Date(mrVisitsFilters.startDate).getMonth() + 1;
      const newStartDate = new Date(year, currentMonth - 1, 1).toISOString().split('T')[0];
      const newEndDate = new Date(year, currentMonth, 0).toISOString().split('T')[0];
      setMrVisitsFilters(prev => ({
        ...prev,
        startDate: newStartDate,
        endDate: newEndDate
      }));
    };

    const handleMonthChange = (e) => {
      const month = parseInt(e.target.value);
      const currentYear = new Date(mrVisitsFilters.startDate).getFullYear();
      const newStartDate = new Date(currentYear, month - 1, 1).toISOString().split('T')[0];
      const newEndDate = new Date(currentYear, month, 0).toISOString().split('T')[0];
      setMrVisitsFilters(prev => ({
        ...prev,
        startDate: newStartDate,
        endDate: newEndDate
      }));
    };

    return (
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">Filter MR Visits</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <SearchableDropdown
                label="Medical Representative"
                options={mrNamesForDropdown}
                value={mrVisitsFilters.empName || "All MRs"}
                onChange={handleMRChange}
                icon={UserSquare}
              />
            </div>
            <div>
              <label htmlFor="year-filter" className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <div className="relative">
                <CalendarDays className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  id="year-filter"
                  value={new Date(mrVisitsFilters.startDate).getFullYear()}
                  onChange={handleYearChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none"
                >
                  {yearOptions.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="month-filter" className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <div className="relative">
                <CalendarDays className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  id="month-filter"
                  value={new Date(mrVisitsFilters.startDate).getMonth() + 1}
                  onChange={handleMonthChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none"
                >
                  {monthOptions.map(month => <option key={month.value} value={month.value}>{month.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Table to display MR Visits Data */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-4 py-3 border-b">
            <h3 className="text-md font-semibold">MR Visit Records ({mrVisitsData.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MR Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visit Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sale Amount</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DCR Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Type</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mrVisitsData.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      No visits found for the selected criteria.
                    </td>
                  </tr>
                ) : (
                  mrVisitsData.map(visit => (
                    <tr key={visit.visitId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(visit.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{visit.mrName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{visit.clientName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{visit.visitType}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{visit.cityName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{visit.areaName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {visit.amountOfSale.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          visit.dcrStatus === 'Approved' ? 'bg-green-100 text-green-800' :
                          visit.dcrStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800' // For Rejected or other statuses
                        }`}>
                          {visit.dcrStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{visit.workType}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

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
        setCustomerAnalyticsData(fetchedAnalytics || []);

        // Set initial MR Visit Filters - this will trigger the dedicated useEffect for MR visits
        const initialFiltersForMrVisits = {
          empName: null,
          startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
          endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
        };
        console.log('[DataLoad_Debug] Setting Initial MR Visit Filters:', initialFiltersForMrVisits);
        setMrVisitsFilters(initialFiltersForMrVisits);

      } catch (error) {
        console.error("Error initializing data:", error);
        setOrderData([]);
        setProductData([]);
        setCustomerData([]);
        setMrData([]);
        setDashboardOrderData([]);
        setCustomerAnalyticsData([]);
        setMrVisitsData([]); // Also reset MR visits data on initial load error
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []); // Empty dependency array to run only on mount

  // useEffect for fetching MR visits data when filters change
  useEffect(() => {
    const loadMrVisits = async () => {
      // Ensure filters are set before fetching
      if (!mrVisitsFilters.startDate || !mrVisitsFilters.endDate) {
        console.log('[DataLoad_Debug] MR Visit filters not ready yet, skipping fetch.');
        return;
      }
      console.log('[DataLoad_Debug] mrVisitsFilters changed, fetching new visits:', mrVisitsFilters);
      try {
        // setLoadingMrVisits(true); // Optional: if you add a specific loading state for MR visits
        const fetchedVisits = await fetchMRVisits(mrVisitsFilters);
        setMrVisitsData(fetchedVisits || []);
      } catch (error) {
        console.error("Error fetching MR visits based on filter change:", error);
        setMrVisitsData([]);
      } finally {
        // setLoadingMrVisits(false); // Optional
      }
    };
    loadMrVisits();
  }, [mrVisitsFilters]);

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

  // Product predictions
  const productPredictions = useMemo(() => {
    if (!productData || productData.length === 0) return { forecasts: [], insights: [], product: null }; // Ensure productData is loaded
    return productML.predictProductSales(selectedProduct, orderData, productData, 6);
  }, [selectedProduct, productML, orderData, productData]);

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

  // Transform product data for both views
  const { individualProducts, groupedByMedicine } = useMemo(() => 
    transformProductData(productData), [productData]
  );

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

  const uniqueCustomers = useMemo(() => {
    // console.log('customerAnalyticsData in uniqueCustomers:', customerAnalyticsData); // Removed
    if (!customerAnalyticsData || customerAnalyticsData.length === 0) {
      // console.log('Computed uniqueCustomers: [] (due to empty or null customerAnalyticsData)'); // Removed
      return [];
    }

    const mappedCustomers = customerAnalyticsData
      .filter(analytics => {
        const idField = analytics.customer_code;
        let idIsValid = false;
        if (idField !== null && idField !== undefined) {
          if (typeof idField === 'string' && idField.trim() !== '') {
            idIsValid = true;
          } else if (typeof idField === 'number') {
            idIsValid = true;
          }
        }

        if (!idIsValid) {
          // console.warn('Filtered out record due to invalid or missing customer_code:', analytics); // Removed
        }
        return idIsValid;
      })
      .map(analytics => {
        const id = String(analytics.customer_code);
        let name = analytics.customer_name;
        if (!name || (typeof name === 'string' && name.trim() === '')) {
          name = `Customer [${id}]`;
          // console.warn(`Generated default name for customer_code ${id}:`, analytics); // Removed
        } else if (typeof name !== 'string') {
          name = String(name);
        }

        return {
          id: id,
          name: name
        };
      });

    const result = mappedCustomers.filter((value, index, self) =>
      self.findIndex(c => c.id === value.id) === index
    );
    // console.log('Computed uniqueCustomers (refined):', result); // Removed
    return result;
  }, [customerAnalyticsData]);

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
  const ProductsTab = () => (
    <div className="space-y-6">
      {/* View Mode Toggle */}
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
                Pack-wise
              </button>
            </div>
          </div>
        </div>

        {/* Product Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Medicine Selector */}
          <div>
            <SearchableDropdown
              options={uniqueMedicines}
              value={currentMedicine}
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

          {/* Pack Size Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pack Size & Price
            </label>
            <select
              value={selectedPackSize || ''}
              onChange={(e) => {
                const packSize = e.target.value;
                const product = availablePackSizes.find(p => p.packSize === packSize);
                if (product) {
                  setSelectedProduct(product.sku);
                  setSelectedPackSize(packSize);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={!currentMedicine}
            >
              <option value="">Select Pack Size...</option>
              {availablePackSizes.map((product, index) => (
                <option key={index} value={product.packSize}>
                  {product.packSize} - ₹{product.mrp} (SKU: {product.sku})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Product Info Cards */}
        {currentProduct && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600">Medicine</p>
              <p className="font-semibold">{currentProduct.medicineName}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600">Pack Size</p>
              <p className="font-semibold">{currentProduct.packSize}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600">MRP</p>
              <p className="font-semibold">₹{currentProduct.mrp}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-orange-600">Available Variants</p>
              <p className="font-semibold">{availablePackSizes.length} pack sizes</p>
            </div>
          </div>
        )}
      </div>

      {/* Analytics View Based on Mode */}
      {viewMode === 'medicine' ? (
        <MedicineWiseAnalytics 
          medicinePerformance={medicinePerformance}
          selectedMedicine={currentMedicine}
          availablePackSizes={availablePackSizes}
        />
      ) : (
        <PackWiseAnalytics 
          packSizePerformance={packSizePerformance}
          selectedProduct={currentProduct}
        />
      )}

      {/* Pack Size Comparison */}
      {currentMedicine && availablePackSizes.length > 1 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="font-medium mb-4">Pack Size Comparison for {currentMedicine}</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pack Size</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">MRP</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Units</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price per Unit</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Value Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {availablePackSizes.map((product, index) => {
                  const unitCount = parseInt(product.packSize.replace(/\D/g, '')) || 1;
                  const pricePerUnit = (product.mrp / unitCount).toFixed(2);
                  const isSelected = product.sku === selectedProduct;
                  const isValuePack = pricePerUnit === Math.min(...availablePackSizes.map(p => 
                    (p.mrp / (parseInt(p.packSize.replace(/\D/g, '')) || 1))
                  ));
                  
                  return (
                    <tr key={index} className={isSelected ? 'bg-green-50' : 'hover:bg-gray-50'}>
                      <td className="px-4 py-2 text-sm font-medium">{product.packSize}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{product.sku}</td>
                      <td className="px-4 py-2 text-sm font-semibold">₹{product.mrp}</td>
                      <td className="px-4 py-2 text-sm">{unitCount}</td>
                      <td className="px-4 py-2 text-sm">₹{pricePerUnit}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center space-x-2">
                          {isValuePack && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              Best Value
                            </span>
                          )}
                          <button
                            onClick={() => {
                              setSelectedProduct(product.sku);
                              setSelectedPackSize(product.packSize);
                            }}
                            className={`px-3 py-1 text-xs rounded-full transition-colors ${
                              isSelected
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {isSelected ? 'Selected' : 'Analyze'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ML Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {productPredictions.insights && productPredictions.insights.map((insight, index) => (
          <MLInsightCard key={index} insight={insight} />
        ))}
      </div>

      {/* Sales Forecast Chart */}
      <ProductForecastChart 
        data={productPredictions.forecasts && productPredictions.forecasts.map((forecast, index) => ({
          month: new Date(forecast.month).toLocaleDateString('en-US', { month: 'short' }),
          revenue: forecast.revenue,
          quantity: forecast.quantity,
          confidence: forecast.confidence * 100
        }))}
      />
    </div>
  );

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
        filters={filters} // General filters for navigation/header search if needed
        setFilters={setFilters} // General filters
        // Pass MR specific filters if Navigation needs to interact with them, otherwise not needed here
        // For this task, Navigation just needs to know about the "visits" tab
        // mrVisitsFilters={mrVisitsFilters}
        // setMrVisitsFilters={setMrVisitsFilters}
        isFiltersVisible={isFiltersVisible} // This is for general overview filters
        setIsFiltersVisible={setIsFiltersVisible} // This is for general overview filters
        pendingFilters={pendingFilters} // This is for general overview filters
        setPendingFilters={setPendingFilters} // This is for general overview filters
        navTabs={[ // Explicitly passing tabs to Navigation
          { id: 'overview', label: 'Overview', icon: Home },
          { id: 'products', label: 'Product Predictions', icon: Box },
          { id: 'customers', label: 'Customer Intelligence', icon: Users },
          { id: 'visits', label: 'MR Visits', icon: Map }
        ]}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'products' && <ProductsTab />}
        {activeTab === 'customers' && <CustomersTab />}
        {activeTab === 'visits' && <VisitsTab />}
      </div>
    </div>
  );
};

export default AyurvedicDashboard;
