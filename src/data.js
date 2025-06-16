// data.js - Updated to use orders table for Overview tab only
import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey)

// Enhanced Indian Currency Formatter
export const formatIndianCurrency = (num, options = {}) => {
  const {
    showFullNumber = false,
    precision = 2,
    showSymbol = true,
    compact = true
  } = options;

  if (num === null || num === undefined || isNaN(Number(num))) {
    return showSymbol ? '₹0' : '0';
  }

  const number = Number(num);
  const symbol = showSymbol ? '₹' : '';

  // If showFullNumber is true, return the complete number with commas
  if (showFullNumber) {
    return symbol + number.toLocaleString('en-IN', {
      maximumFractionDigits: 0
    });
  }

  // If compact is false, return full number
  if (!compact) {
    return symbol + number.toLocaleString('en-IN', {
      maximumFractionDigits: precision
    });
  }

  const absNumber = Math.abs(number);

  if (absNumber >= 10000000) { // 1 Crore = 1,00,00,000
    const croreValue = number / 10000000;
    return symbol + croreValue.toFixed(croreValue % 1 === 0 ? 0 : precision) + ' Cr';
  }
  
  if (absNumber >= 100000) { // 1 Lakh = 1,00,000
    const lakhValue = number / 100000;
    return symbol + lakhValue.toFixed(lakhValue % 1 === 0 ? 0 : precision) + ' L';
  }
  
  if (absNumber >= 1000) { // 1 Thousand
    const thousandValue = number / 1000;
    return symbol + thousandValue.toFixed(thousandValue % 1 === 0 ? 0 : precision) + ' K';
  }
  
  return symbol + number.toFixed(number % 1 === 0 ? 0 : precision);
};

// Utility function to format based on context
export const formatCurrencyByContext = (value, context = 'default') => {
  switch (context) {
    case 'card': // For KPI cards - more compact
      return formatIndianCurrency(value, { precision: 1 });
    
    case 'table': // For tables - balance between compact and readable
      return formatIndianCurrency(value, { precision: value >= 100000 ? 1 : 0 });
    
    case 'tooltip': // For tooltips and detailed views
      return formatIndianCurrency(value, { showFullNumber: true });
    
    case 'chart': // For chart labels - very compact
      return formatIndianCurrency(value, { precision: 0, showSymbol: false });
    
    case 'export': // For exports - full numbers
      return formatIndianCurrency(value, { showFullNumber: true, showSymbol: false });
    
    default:
      return formatIndianCurrency(value);
  }
};

// Updated fetch function to use orders table and transform for compatibility
export const fetchOrderData = async () => {
  let allOrders = [];
  let lastOrderCount = 0;
  let offset = 0;
  const pageSize = 1000;

  try {
    do {
      const { data: chunk, error: chunkError } = await supabase
        .from('orders')
        .select('*')
        .order('order_date', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (chunkError) {
        console.error('Error fetching chunk of orders:', chunkError);
        throw chunkError;
      }

      if (chunk) {
        allOrders = allOrders.concat(chunk);
        lastOrderCount = chunk.length;
        offset += pageSize;
      } else {
        lastOrderCount = 0;
      }
    } while (lastOrderCount === pageSize);

    // Transform orders data to match existing component expectations
    // Since each row in orders table represents one order (not individual items),
    // we need to create item-like records for compatibility with existing components
    const transformedData = [];
    
    allOrders.forEach(order => {
      // Split products and categories to create individual "item" records
      const products = order.products ? order.products.split(', ') : ['Unknown Product'];
      const categories = order.categories ? order.categories.split(', ') : ['Unknown Category'];
      const brands = order.brands ? order.brands.split(', ') : ['Unknown Brand'];
      
      // Create records for each product in the order
      const maxItems = Math.max(products.length, categories.length, brands.length);
      
      for (let i = 0; i < maxItems; i++) {
        transformedData.push({
          orderId: order.order_id,
          date: order.order_date,
          customerId: order.customer_code,
          customerName: order.customer_name,
          customerType: order.customer_type,
          territory: order.territory,
          city: order.city,
          state: order.state,
          netAmount: parseFloat(order.net_amount) || 0,
          distributor_name: order.distributor_name,
          discountTier: order.discount_tier,
          deliveryStatus: order.delivery_status,
          productName: products[i] || products[0] || 'Unknown Product',
          category: categories[i] || categories[0] || 'Unknown Category',
          brand: brands[i] || brands[0] || 'Unknown Brand',
          quantity: Math.floor((order.total_quantity || 0) / maxItems), // Distribute quantity evenly
          medicalRepresentative: order.mr_name,
          salesRepresentative: order.mr_name,
          mrEmployeeId: order.mr_employee_id,
          trackingNumber: order.tracking_number,
          paymentMode: 'N/A', // Not in orders table
          paymentStatus: order.status,
          subtotal: parseFloat(order.subtotal) || 0,
          discountAmount: parseFloat(order.discount_amount) || 0,
          taxAmount: parseFloat(order.tax_amount) || 0,
          shippingCharges: parseFloat(order.shipping_charges) || 0,
          lineItemsCount: order.line_items_count,
          totalQuantity: order.total_quantity,
          distributorName: order.distributor_name,
          expectedDeliveryDate: order.expected_delivery_date,
          actualDeliveryDate: order.actual_delivery_date
        });
      }
    });

    return transformedData;
  } catch (error) {
    console.error('Error in paginated fetchOrderData (outer catch):', error);
    return [];
  }
};

// Enhanced data loading with real-time sync
export const initializeData = async () => {
  const [orders] = await Promise.all([
    fetchOrderData()
  ]);
  
  return {
    sampleOrderData: orders
  };
};

// Fetch aggregated dashboard data using orders table directly
export const fetchDashboardOrders = async () => {
  let allOrders = [];
  let lastOrderCount = 0;
  let offset = 0;
  const pageSize = 1000;

  try {
    do {
      const { data: chunk, error: chunkError } = await supabase
        .from('orders')
        .select('*')
        .order('order_date', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (chunkError) {
        console.error('Error fetching chunk of dashboard orders:', chunkError);
        throw chunkError;
      }

      if (chunk) {
        allOrders = allOrders.concat(chunk);
        lastOrderCount = chunk.length;
        offset += pageSize;
      } else {
        lastOrderCount = 0;
      }
    } while (lastOrderCount === pageSize);
    
    return allOrders.map(order => ({
      orderId: order.order_id,
      date: order.order_date,
      customerId: order.customer_code,
      customerName: order.customer_name,
      customerType: order.customer_type,
      city: order.city,
      state: order.state,
      territory: order.territory,
      medicalRepresentative: order.mr_name,
      mrEmployeeId: order.mr_employee_id,
      netAmount: parseFloat(order.net_amount) || 0,
      distributor_name: order.distributor_name,
      discountTier: order.discount_tier,
      deliveryStatus: order.delivery_status,
      products: order.products ? order.products.split(', ') : [],
      categories: order.categories ? order.categories.split(', ') : [],
      brands: order.brands ? order.brands.split(', ') : [],
      totalQuantity: order.total_quantity,
      lineItemsCount: order.line_items_count,
      subtotal: parseFloat(order.subtotal) || 0,
      discountAmount: parseFloat(order.discount_amount) || 0,
      taxAmount: parseFloat(order.tax_amount) || 0,
      shippingCharges: parseFloat(order.shipping_charges) || 0,
      distributorName: order.distributor_name,
      status: order.status,
      expectedDeliveryDate: order.expected_delivery_date,
      actualDeliveryDate: order.actual_delivery_date,
      trackingNumber: order.tracking_number,
      createdAt: order.created_at,
      updatedAt: order.updated_at
    }));
  } catch (error) {
    console.error('Error in paginated fetchDashboardOrders (outer catch):', error);
    return [];
  }
};

// Core constants and configurations
export const COLORS = {
  primary: '#2E7D32',
  secondary: '#FF8F00', 
  accent: '#1976D2',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  light: '#F8F9FA',
  dark: '#424242',
  purple: '#9C27B0',
  teal: '#009688'
};

export const ML_INSIGHTS = [
  {
    type: 'growth',
    title: 'Growth Prediction',
    value: '+12.5%',
    description: 'Expected growth over next quarter',
    confidence: '92.1%'
  },
  {
    type: 'peak',
    title: 'Peak Sales Month',
    value: 'December',
    description: 'Seasonal peak for immunity products',
    confidence: '89.5%'
  },
  {
    type: 'market',
    title: 'Market Position',
    value: 'Strong',
    description: 'Above average market performance',
    confidence: '85.2%'
  }
];

export const SALES_DRIVERS = [
  { factor: 'Seasonal Patterns', importance: 92, color: '#4CAF50' },
  { factor: 'Customer Type', importance: 87, color: '#1976D2' },
  { factor: 'MR Performance', importance: 81, color: '#FF8F00' },
  { factor: 'Territory Strength', importance: 76, color: '#9C27B0' }
];

// Enhanced utility functions
export const calculateKPIs = (data) => {
  const totalRevenue = data.reduce((sum, order) => sum + order.netAmount, 0);
  const totalOrders = data.length;
  const activeCustomers = new Set(data.map(order => order.customerId)).size;
  const deliveredOrders = data.filter(order => order.deliveryStatus === 'Delivered').length;
  const deliveryRate = totalOrders > 0 ? (deliveredOrders / totalOrders * 100) : 0;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return { totalRevenue, totalOrders, activeCustomers, deliveryRate, avgOrderValue };
};

export const getUniqueValues = (data, key) => {
  return [...new Set(data.map(item => ({ id: item[key + 'Id'] || item[key], name: item[key + 'Name'] || item[key] })))];
};

// Real-time data refresh function
export const refreshDashboardData = async () => {
  try {
    const data = await initializeData();
    return data;
  } catch (error) {
    console.error('Error refreshing dashboard data:', error);
    throw error;
  }
};



// Function to get latest order data with filters - Updated to use orders table
export const fetchFilteredOrderData = async (filters = {}) => {
  try {
    let query = supabase
      .from('orders')
      .select('*');

    // Apply filters
    if (filters.dateRange && filters.dateRange[0]) {
      query = query.gte('order_date', filters.dateRange[0]);
    }
    if (filters.dateRange && filters.dateRange[1]) {
      query = query.lte('order_date', filters.dateRange[1]);
    }
    if (filters.customerType) {
      query = query.eq('customer_type', filters.customerType);
    }
    if (filters.territory) {
      query = query.eq('territory', filters.territory);
    }
    if (filters.mrName) {
      query = query.eq('mr_name', filters.mrName);
    }
    if (filters.deliveryStatus) {
      query = query.eq('delivery_status', filters.deliveryStatus);
    }

    query = query.order('order_date', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error fetching filtered order data:', error);
    return [];
  }
};

// Fetch state revenue summary for geographic heat map - Updated to use orders table
export const fetchStateRevenueSummary = async (startDate = null, endDate = null) => {
  try {
    // Try SQL function first
    const { data, error } = await supabase.rpc('get_state_revenue_summary', {
      p_date_start: startDate,
      p_date_end: endDate
    });

    if (error) {
      console.error('Error calling get_state_revenue_summary:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching state revenue summary:', error);
    
    // Fallback: try to get state data from orders table directly
    try {
      console.log('Attempting fallback query...');
      let query = supabase
        .from('orders')
        .select('state, net_amount')
        .not('state', 'is', null);

      if (startDate) {
        query = query.gte('order_date', startDate);
      }
      if (endDate) {
        query = query.lte('order_date', endDate);
      }

      const { data: fallbackData, error: fallbackError } = await query;
      
      if (fallbackError) throw fallbackError;

      // Aggregate by state
      const stateMap = {};
      fallbackData.forEach(order => {
        const state = order.state;
        if (!stateMap[state]) {
          stateMap[state] = { state, orders: 0, value: 0 };
        }
        stateMap[state].orders += 1;
        stateMap[state].value += parseFloat(order.net_amount) || 0;
      });

      return Object.values(stateMap).sort((a, b) => b.value - a.value);
    } catch (fallbackError) {
      console.error('Fallback query also failed:', fallbackError);
      return [];
    }
  }
};

// Fetch MR state-wise analytics (unchanged - uses SQL function)
export const fetchMRStateSalesAnalytics = async (filters = {}) => {
  try {
    const { data, error } = await supabase.rpc('get_mr_state_sales_analytics', {
      p_date_start: filters.dateStart || null,
      p_date_end: filters.dateEnd || null,
      p_mr_name: filters.mrName || null,
      p_state: filters.state || null
    });

    if (error) {
      console.error('Error calling get_mr_state_sales_analytics:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching MR state analytics:', error);
    return [];
  }
};
