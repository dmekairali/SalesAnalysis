// data.js - Updated for Supabase Integration
import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey)


// Enhanced Indian Currency Formatter - Updated formatIndianCurrency function
// Add this to your src/data.js file or create a new utils file

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

// Examples of usage:
/*
formatIndianCurrency(1500)           // ₹1.5 K
formatIndianCurrency(250000)         // ₹2.5 L  
formatIndianCurrency(15000000)       // ₹1.5 Cr
formatIndianCurrency(5000, { showFullNumber: true })  // ₹5,000
formatIndianCurrency(250000, { precision: 0 })        // ₹3 L
formatCurrencyByContext(1500000, 'card')              // ₹15.0 L
formatCurrencyByContext(1500000, 'tooltip')           // ₹15,00,000
*/

// Fetch functions to replace your mock data
export const fetchOrderData = async () => {
  let allItems = [];
  let lastItemCount = 0;
  let offset = 0;
  const pageSize = 1000; // Supabase default limit, can be adjusted

  try {
    do {
      const { data: chunk, error: chunkError } = await supabase
        .from('order_items')
        .select('*')
        .order('order_date', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (chunkError) {
        console.error('Error fetching chunk of order_items:', chunkError);
        throw chunkError; // Propagate error to be caught by the outer try-catch
      }

      if (chunk) {
        allItems = allItems.concat(chunk);
        lastItemCount = chunk.length;
        offset += pageSize;
        // console.log('[DataLoad_Debug] Fetching all order_items. Current total:', allItems.length); // Removed for this subtask
      } else {
        lastItemCount = 0; // Should not happen if no error, but as a safeguard
      }
      // Optional: Add a small delay if hitting rate limits is a concern
      // if (lastItemCount === pageSize) await new Promise(resolve => setTimeout(resolve, 200));
    } while (lastItemCount === pageSize);

    // The existing mapping should be applied to `allItems`
    return allItems.map(item => ({
      orderId: item.order_id,
      date: item.order_date,
      customerId: item.customer_code,
      customerName: item.customer_name,
      customerType: item.customer_type,
      territory: item.territory,
      city: item.city,
      state: item.state,
      netAmount: parseFloat(item.order_net_amount) || 0, // Ensure fallback to 0 if NaN
      deliveredFrom: item.delivered_from,
      discountTier: item.discount_tier,
      deliveryStatus: item.delivery_status,
      productName: item.product_description,
      category: item.category,
      quantity: item.quantity,
      medicalRepresentative: item.mr_name,
      salesRepresentative: item.mr_name,
      trackingNumber: item.tracking_number,
      courierPartner: item.courier_partner,
      paymentMode: item.payment_mode,
      paymentStatus: item.payment_status,
      orderItems: [{ // This structure for orderItems might need re-evaluation if it's for detailed views
        sku: item.sku,
        medicineName: item.product_description,
        packSize: item.size_display,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unit_price) || 0, // Ensure fallback
        totalPrice: parseFloat(item.line_total) || 0, // Ensure fallback
        category: item.category,
        master_code: item.master_code,
        variant_code: item.variant_code
      }],
      products: [item.product_description], // Also seems item-specific
      master_code: item.master_code
    }));
  } catch (error) {
    // Error is already logged by the chunk fetching or will be caught here
    console.error('Error in paginated fetchOrderData (outer catch):', error);
    return []; // Return empty array in case of any error
  }
};

export const fetchProductData = async () => {
  let allItems = [];
  let lastItemCount = 0;
  let offset = 0;
  const pageSize = 1000;

  try {
    do {
      const { data: chunk, error: chunkError } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true) // Keep existing filters
        .range(offset, offset + pageSize - 1);

      if (chunkError) {
        console.error('Error fetching chunk of products:', chunkError);
        throw chunkError;
      }

      if (chunk) {
        allItems = allItems.concat(chunk);
        // console.log('[DataLoad_Debug] Fetching all products. Current total:', allItems.length); // Removed
        lastItemCount = chunk.length;
        offset += pageSize;
      } else {
        lastItemCount = 0;
      }
      // Optional: await new Promise(resolve => setTimeout(resolve, 200));
    } while (lastItemCount === pageSize);
    
    // Transform to match your existing productMasterData structure
    return allItems.map(product => ({
      Category: product.category,
      'Medicine Name': product.description,
      MasterSku: product.master_code,
      Pack: product.size_display,
      Sku: product.sku,
      Mrp: parseFloat(product.mrp) || 0,
      productId: product.sku,
      productName: `${product.description} (${product.size_display})`,
      category: product.category,
      unitPrice: parseFloat(product.mrp) || 0,
      seasonality: 'Year Round', // Add seasonality logic later if needed
      competitor: 'N/A', // Add competitor data later if needed
      marketShare: 15, // Add market share calculation later if needed
      // Enhanced fields
      brand: product.brand,
      variant_code: product.variant_code,
      master_code: product.master_code,
      status: product.status,
      focus_status: product.focus_status
    }));
  } catch (error) {
    console.error('Error in paginated fetchProductData (outer catch):', error);
    return [];
  }
};
/*
export const formatIndianCurrency = (num) => {
  if (num === null || num === undefined || isNaN(Number(num))) {
    return '0'; // Or 'N/A' or handle as an error
  }

  const number = Number(num);

  if (Math.abs(number) >= 10000000) { // 1 Crore = 1,00,00,000
    return (number / 10000000).toFixed(2) + ' Cr';
  }
  if (Math.abs(number) >= 100000) { // 1 Lakh = 1,00,000
    return (number / 100000).toFixed(2) + ' L';
  }
  if (Math.abs(number) >= 1000) { // 1 Thousand
    // For K, often one decimal place is preferred if not round, or none if round.
    // Example: 12345 -> 12.3K, 12000 -> 12K
    const thousandValue = number / 1000;
    if (thousandValue % 1 === 0) { // Check if it's a whole number
        return thousandValue.toFixed(0) + ' K';
    } else {
        return thousandValue.toFixed(1) + ' K';
    }
  }
  return number.toString(); // Or number.toLocaleString('en-IN') for smaller numbers
};
*/
export const fetchCustomerData = async () => {
  let allItems = [];
  let lastItemCount = 0;
  let offset = 0;
  const pageSize = 1000;

  try {
    do {
      const { data: chunk, error: chunkError } = await supabase
        .from('customers')
        .select('*')
        .eq('is_active', true) // Keep existing filters
        .range(offset, offset + pageSize - 1);

      if (chunkError) {
        console.error('Error fetching chunk of customers:', chunkError);
        throw chunkError;
      }

      if (chunk) {
        allItems = allItems.concat(chunk);
        // console.log('[DataLoad_Debug] Fetching all customers. Current total:', allItems.length); // Removed
        lastItemCount = chunk.length;
        offset += pageSize;
      } else {
        lastItemCount = 0;
      }
      // Optional: await new Promise(resolve => setTimeout(resolve, 200));
    } while (lastItemCount === pageSize);
    
    return allItems; // Return all fetched items, no mapping needed here
  } catch (error) {
    console.error('Error in paginated fetchCustomerData (outer catch):', error);
    return [];
  }
};

export const fetchMRData = async () => {
  let allItems = [];
  let lastItemCount = 0;
  let offset = 0;
  const pageSize = 1000;

  try {
    do {
      const { data: chunk, error: chunkError } = await supabase
        .from('medical_representatives')
        .select('*')
        .eq('is_active', true) // Keep existing filters
        .range(offset, offset + pageSize - 1);

      if (chunkError) {
        console.error('Error fetching chunk of medical_representatives:', chunkError);
        throw chunkError;
      }

      if (chunk) {
        allItems = allItems.concat(chunk);
        // console.log('[DataLoad_Debug] Fetching all MRs. Current total:', allItems.length); // Removed
        lastItemCount = chunk.length;
        offset += pageSize;
      } else {
        lastItemCount = 0;
      }
      // Optional: await new Promise(resolve => setTimeout(resolve, 200));
    } while (lastItemCount === pageSize);
    
    return allItems; // Return all fetched items
  } catch (error) {
    console.error('Error in paginated fetchMRData (outer catch):', error);
    return [];
  }
};

// Enhanced data loading with real-time sync
export const initializeData = async () => {
  const [orders, products, customers, mrs] = await Promise.all([
    fetchOrderData(),
    fetchProductData(),
    fetchCustomerData(),
    fetchMRData()
  ]);
  
  return {
    sampleOrderData: orders,
    productMasterData: products,
    customerData: customers,
    mrData: mrs
  };
};

// Fetch aggregated dashboard data using views
export const fetchDashboardOrders = async () => {
  let allItems = [];
  let lastItemCount = 0;
  let offset = 0;
  const pageSize = 1000;

  try {
    do {
      const { data: chunk, error: chunkError } = await supabase
        .from('orders') // This is a view
        .select('*')
        .order('order_date', { ascending: false }) // Keep existing ordering
        .range(offset, offset + pageSize - 1);

      if (chunkError) {
        console.error('Error fetching chunk of dashboard orders:', chunkError);
        throw chunkError;
      }

      if (chunk) {
        allItems = allItems.concat(chunk);
        // console.log('[DataLoad_Debug] Fetching all dashboard orders. Current total:', allItems.length); // Removed
        lastItemCount = chunk.length;
        offset += pageSize;
      } else {
        lastItemCount = 0;
      }
      // Optional: await new Promise(resolve => setTimeout(resolve, 200));
    } while (lastItemCount === pageSize);
    
    return allItems.map(order => ({
      orderId: order.order_id,
      date: order.order_date,
      customerId: order.customer_code,
      customerName: order.customer_name,
      customerType: order.customer_type,
      city: order.city,
      state: order.state,
      territory: order.territory,
      medicalRepresentative: order.mr_name,
      netAmount: parseFloat(order.net_amount) || 0,
      deliveredFrom: order.delivered_from,
      discountTier: order.discount_tier,
      deliveryStatus: order.delivery_status,
      products: order.products ? order.products.split(', ') : [],
      categories: order.categories ? order.categories.split(', ') : [],
      totalQuantity: order.total_quantity,
      lineItemsCount: order.line_items_count
    }));
  } catch (error) {
    console.error('Error in paginated fetchDashboardOrders (outer catch):', error);
    return [];
  }
};

export const fetchProductSalesSummary = async () => {
  let allItems = [];
  let lastItemCount = 0;
  let offset = 0;
  const pageSize = 1000;

  try {
    do {
      const { data: chunk, error: chunkError } = await supabase
        .from('product_sales_summary') // This is a view
        .select('*')
        .order('total_revenue', { ascending: false }) // Keep existing ordering
        .range(offset, offset + pageSize - 1);

      if (chunkError) {
        console.error('Error fetching chunk of product_sales_summary:', chunkError);
        throw chunkError;
      }

      if (chunk) {
        allItems = allItems.concat(chunk);
        // console.log('[DataLoad_Debug] Fetching all product sales summary. Current total:', allItems.length); // Removed
        lastItemCount = chunk.length;
        offset += pageSize;
      } else {
        lastItemCount = 0;
      }
      // Optional: await new Promise(resolve => setTimeout(resolve, 200));
    } while (lastItemCount === pageSize);
    
    return allItems; // Return all fetched items, no mapping needed here
  } catch (error) {
    console.error('Error in paginated fetchProductSalesSummary (outer catch):', error);
    return [];
  }
};

export const fetchCustomerAnalytics = async () => {
  try {
    const { data, error } = await supabase
      .rpc('get_customer_analytics'); // You can create this RPC function in Supabase
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching customer analytics:', error);
    return [];
  }
};

export const fetchCustomerAnalyticsTableData = async () => {
  let allItems = [];
  let lastItemCount = 0;
  let offset = 0;
  const pageSize = 1000;

  try {
    do {
      const { data: chunk, error: chunkError } = await supabase
        .from('customer_analytics')
        .select('*')
        .order('customer_name', { ascending: true }) // Keep existing ordering
        .range(offset, offset + pageSize - 1);

      if (chunkError) {
        console.error('Error fetching chunk of customer_analytics:', chunkError);
        throw chunkError;
      }

      if (chunk) {
        allItems = allItems.concat(chunk);
        // console.log('[DataLoad_Debug] Fetching all customer analytics data. Current total:', allItems.length); // Removed
        lastItemCount = chunk.length;
        offset += pageSize;
      } else {
        lastItemCount = 0;
      }
      // Optional: await new Promise(resolve => setTimeout(resolve, 200));
    } while (lastItemCount === pageSize);

    return allItems; // Return all fetched items
  } catch (error) {
    console.error('Error in paginated fetchCustomerAnalyticsTableData (outer catch):', error);
    return [];
  }
};

// Keep your existing utility functions and constants
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

// Enhanced product transformation for new schema
export const transformProductData = (productMasterData) => {
  // Individual products (each SKU separate)
  const individualProducts = productMasterData.map(item => ({
    productId: item.Sku || item.productId,
    productName: item['Medicine Name'] ? `${item['Medicine Name']} (${item.Pack})` : item.productName,
    medicineName: item['Medicine Name'] || item.productName,
    masterSku: item.MasterSku || item.master_code,
    packSize: item.Pack || 'Standard',
    sku: item.Sku || item.productId,
    mrp: item.Mrp || item.unitPrice || 0,
    category: item.Category || item.category,
    unitPrice: item.unitPrice || item.Mrp || 0,
    seasonality: item.seasonality || 'Year Round',
    competitor: item.competitor || 'N/A',
    marketShare: item.marketShare || 0,
    // Enhanced fields
    brand: item.brand,
    variant_code: item.variant_code,
    master_code: item.master_code,
    status: item.status,
    focus_status: item.focus_status
  }));

  // Grouped by medicine (master_code)
  const groupedByMedicine = individualProducts.reduce((acc, product) => {
    const masterCode = product.master_code;
    const existingMedicine = acc.find(p => p.master_code === masterCode);
    
    const packVariant = {
      pack: product.packSize,
      sku: product.sku,
      mrp: product.mrp,
      status: product.status
    };

    if (existingMedicine) {
      existingMedicine.packSizes.push(packVariant);
    } else {
      acc.push({
        productId: product.masterSku,
        medicineName: product.medicineName,
        master_code: masterCode,
        category: product.category,
        brand: product.brand,
        packSizes: [packVariant]
      });
    }
    
    return acc;
  }, []);

  return { individualProducts, groupedByMedicine };
};

// Enhanced analytics for pack size analysis
export const getPackSizeAnalytics = (orderData) => {
  const packSizePerformance = {};
  const medicinePerformance = {};

  orderData.forEach(order => {
    if (order.orderItems && order.orderItems.length > 0) {
      order.orderItems.forEach(item => {
        // Pack-wise analytics
        const packKey = `${item.medicineName} (${item.packSize})`;
        if (!packSizePerformance[packKey]) {
          packSizePerformance[packKey] = {
            medicineName: item.medicineName,
            packSize: item.packSize,
            totalQuantity: 0,
            totalRevenue: 0,
            orderCount: 0,
            master_code: item.master_code
          };
        }
        packSizePerformance[packKey].totalQuantity += item.quantity;
        packSizePerformance[packKey].totalRevenue += item.totalPrice;
        packSizePerformance[packKey].orderCount += 1;

        // Medicine-wise analytics (by master_code)
        const masterCode = item.master_code;
        if (!medicinePerformance[masterCode]) {
          medicinePerformance[masterCode] = {
            master_code: masterCode,
            medicineName: item.medicineName,
            totalQuantity: 0,
            totalRevenue: 0,
            orderCount: 0,
            packSizes: new Set()
          };
        }
        medicinePerformance[masterCode].totalQuantity += item.quantity;
        medicinePerformance[masterCode].totalRevenue += item.totalPrice;
        medicinePerformance[masterCode].orderCount += 1;
        medicinePerformance[masterCode].packSizes.add(item.packSize);
      });
    } else {
      // Handle legacy data without orderItems
      const packKey = order.productName || 'Unknown Product';
      if (!packSizePerformance[packKey]) {
        packSizePerformance[packKey] = {
          medicineName: order.productName || 'Unknown',
          packSize: 'Standard',
          totalQuantity: 0,
          totalRevenue: 0,
          orderCount: 0,
          master_code: order.master_code
        };
      }
      packSizePerformance[packKey].totalQuantity += order.quantity || 1;
      packSizePerformance[packKey].totalRevenue += order.netAmount;
      packSizePerformance[packKey].orderCount += 1;
    }
  });

  // Convert Sets to Arrays
  Object.values(medicinePerformance).forEach(medicine => {
    medicine.packSizes = Array.from(medicine.packSizes);
  });

  return { packSizePerformance, medicinePerformance };
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

// Function to get latest order data with filters
export const fetchFilteredOrderData = async (filters = {}) => {
  try {
    let query = supabase
      .from('order_items')
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

//------------visits data


// =============================================================================
// 1. GET CUSTOMER AREAS FOR CLUSTERING
// =============================================================================

export const getCustomerAreasForClustering = async (mrName) => {
  try {
    const { data, error } = await supabase
      .rpc('get_clustered_customers', { p_mr_name: mrName });

    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error getting customer areas:', error);
    return [];
  }
};

// =============================================================================
// 2. GEMINI AI CLUSTERING (CORE FUNCTION)
// =============================================================================
/*
export const createGeminiClusters = async (mrName, apiKey = null) => {
  const geminiApiKey = apiKey || process.env.REACT_APP_GEMINI_API_KEY;
  
  if (!geminiApiKey) {
    throw new Error('Gemini API key not found');
  }

  try {
    console.log('🤖 Starting Gemini clustering for MR:', mrName);
    
    // Step 1: Get customer areas
    const areas = await getCustomerAreasForClustering(mrName);
    
    if (areas.length === 0) {
      throw new Error('No customer areas found for this MR');
    }

    const areaList = areas.map(a => a.area_name).join(', ');
    console.log('📊 Areas to cluster:', areaList);
    
    // Step 2: Create Gemini prompt for intelligent clustering
   // In createGeminiClusters function, modify the prompt:
const prompt = `I have a Medical Representative named ${mrName} who needs to visit customers in these areas in India:
${areaList}

IMPORTANT: Use the EXACT area names provided above. Do not add words like "City" or modify the names.

Please create 3-4 optimal geographic clusters for visit planning based on:
1. Geographic proximity and travel efficiency
2. Area connectivity and road networks  
3. Business density and commercial importance
4. Logical route optimization for daily visits

For each cluster, provide:
- Cluster name (geographic description)
- Areas included in the cluster with EXACT names (do not modify area names)
- Recommended visit sequence within cluster
- Estimated travel time between areas
- Best day(s) of week to focus on this cluster

Return ONLY a valid JSON object in this exact format:
{
  "clusters": [
    {
      "cluster_id": 1,
      "cluster_name": "Central Business Cluster",
      "areas": [
        {
          "area_name": "Bhopal",
          "city": "Bhopal",
          "state": "Madhya Pradesh"
        }
      ],
      "visit_sequence": ["Bhopal", "Vidisha"],
      // ... rest of the fields
    }
  ]
}

Use EXACT area names: Bhopal, Vidisha, Sagar (not "Bhopal City" or "Vidisha City")`;

    // Step 3: Call Gemini API
    console.log('🤖 Calling Gemini API...');
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const textResponse = data.candidates[0].content.parts[0].text;
    
    console.log('🤖 Gemini raw response:', textResponse);

    // Step 4: Extract and parse JSON
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in Gemini response');
    }

    const clusterData = JSON.parse(jsonMatch[0]);
    
    // Step 5: Enhance with customer counts
    const enhancedClusters = clusterData.clusters.map(cluster => {
      const customerCount = areas
        .filter(area => cluster.areas.some(clusterArea => clusterArea.area_name === area.area_name))
        .reduce((sum, area) => sum + (area.customer_count || 0), 0);
      
      return {
        ...cluster,
        total_estimated_customers: customerCount
      };
    });

    console.log('✅ Gemini clustering completed:', enhancedClusters.length, 'clusters');
    
    return {
      success: true,
      clusters: enhancedClusters,
      optimization_notes: clusterData.optimization_notes,
      total_clusters: clusterData.total_clusters || enhancedClusters.length
    };

  } catch (error) {
    console.error('💥 Gemini clustering failed:', error);
    throw error;
  }
};
*/

// =============================================================================
// 3. SAVE CLUSTER ASSIGNMENTS
// =============================================================================
/*
export const saveClusterAssignments = async (mrName, clusters) => {
  try {
    console.log('💾 Saving cluster assignments for:', mrName);
    
    let totalSaved = 0;
    
    for (const cluster of clusters) {
      for (const areaObj of cluster.areas) {
        const visitSequenceOrder = cluster.visit_sequence?.indexOf(areaObj.area_name) + 1 || 1;
        
        const areaData = {
          area_name: areaObj.area_name,
          city: areaObj.city || cluster.primary_city || 'Unknown',
          state: areaObj.state || cluster.primary_state || 'Unknown',
          cluster_id: cluster.cluster_id,
          cluster_name: cluster.cluster_name,
          visit_sequence_order: visitSequenceOrder,
          estimated_travel_time_minutes: typeof cluster.estimated_travel_time_minutes === 'number' 
    ? cluster.estimated_travel_time_minutes.toString() 
    : cluster.estimated_travel_time_minutes || null',
          detailed_travel_route: typeof cluster.estimated_travel_time_minutes === 'string' 
    ? cluster.estimated_travel_time_minutes 
    : null,
          recommended_days: cluster.recommended_days || null,
          travel_notes: cluster.travel_notes || null,
          total_estimated_customers: cluster.total_estimated_customers || 0,
          primary_city: cluster.primary_city || areaObj.city,
          primary_state: cluster.primary_state || areaObj.state
        };

        // Save using your existing RPC
        const { error } = await supabase.rpc('save_gemini_coordinates', {
          p_mr_name: String(mrName),
          p_area_name: String(areaData.area_name),
          p_city: String(areaData.city),
          p_state: String(areaData.state),
          p_latitude: 0.0, // Not needed for clustering
          p_longitude: 0.0, // Not needed for clustering
          p_confidence: 0.85, // Default confidence for Gemini clustering
          p_business_density: cluster.business_density || 'Medium',
          p_nearby_areas_json: null,
          p_cluster_id: Number(areaData.cluster_id),
          p_cluster_name: String(areaData.cluster_name),
          p_visit_sequence_order: Number(areaData.visit_sequence_order),
          p_estimated_travel_time_minutes: areaData.estimated_travel_time_minutes,
          p_recommended_days: areaData.recommended_days,
          p_travel_notes: areaData.travel_notes,
          p_total_estimated_customers: Number(areaData.total_estimated_customers),
          p_avg_order_value: 0,
          p_total_revenue: 0,
          p_primary_city: String(areaData.primary_city),
          p_primary_state: String(areaData.primary_state)
        });

        if (error) {
          console.error(`❌ Failed to save ${areaData.area_name}:`, error);
        } else {
          console.log(`✅ Saved ${areaData.area_name} to cluster ${cluster.cluster_id}`);
          totalSaved++;
        }
      }
    }

    console.log(`💾 Cluster assignments saved: ${totalSaved} areas`);
    return { success: true, totalSaved };

  } catch (error) {
    console.error('💥 Error saving cluster assignments:', error);
    throw error;
  }
};
*/

// =============================================================================
// 4. GET EXISTING CLUSTERS
// =============================================================================

export const getExistingClusters = async (mrName) => {
  try {
    const { data, error } = await supabase
      .from('area_coordinates')
      .select('area_name, city, state, cluster_id, cluster_name, visit_sequence_order, estimated_travel_time_minutes, recommended_days, travel_notes')
      .eq('mr_name', mrName)
      .not('cluster_id', 'is', null)
      .order('cluster_id');

    if (error) throw error;

    // Group by clusters
    const clusteredResults = data.reduce((acc, area) => {
      if (!acc[area.cluster_id]) {
        acc[area.cluster_id] = {
          cluster_id: area.cluster_id,
          cluster_name: area.cluster_name,
          areas: [],
          estimated_travel_time_minutes: area.estimated_travel_time_minutes,
          recommended_days: area.recommended_days,
          travel_notes: area.travel_notes
        };
      }
      
      acc[area.cluster_id].areas.push({
        area_name: area.area_name,
        city: area.city,
        state: area.state
      });
      
      return acc;
    }, {});

    return Object.values(clusteredResults);

  } catch (error) {
    console.error('Error getting existing clusters:', error);
    return [];
  }
};

// =============================================================================
// 5. CREATE VISIT PLAN
// =============================================================================

export const createGeminiVisitPlan = async (mrName, month, year) => {
  try {
    console.log('🎯 Creating visit plan for:', { mrName, month, year });
    
    // Step 1: Ensure clusters exist
    let clusters = await getExistingClusters(mrName);
    
    if (clusters.length === 0) {
      console.log('🤖 No clusters found, creating Gemini clusters...');
      const clusterResult = await createGeminiClusters(mrName);
      
      if (clusterResult.success) {
        await saveClusterAssignments(mrName, clusterResult.clusters);
        clusters = clusterResult.clusters;
      } else {
        throw new Error('Failed to create clusters');
      }
    } else {
      console.log('✅ Using existing clusters:', clusters.length);
    }

    // Step 2: Create visit plan using existing RPC
    //const { data: planId, error } = await supabase.rpc('create_area_optimized_visit_plan', {
    const { data: planId, error } = await supabase.rpc('create_smart_revisit_visit_plan', {
      p_mr_name: mrName,
      p_month: month,
      p_year: year,
      p_target_visits_per_day: 15, //INTEGER DEFAULT 15  -- Minimum gap between visits to same customer
      p_min_revisit_gap_days:7 //INTEGER DEFAULT 7  -- Minimum gap between visits to same customer
    });

    if (error) throw error;

    console.log('✅ Visit plan created with ID:', planId);
    return planId;

  } catch (error) {
    console.error('💥 Error creating visit plan:', error);
    throw error;
  }
};

// =============================================================================
// 6. GET VISIT PLAN DETAILS
// =============================================================================

export const getVisitPlanDetails = async (planId) => {
  try {
    const { data, error } = await supabase
      .from('visit_plans')
      .select('*')
      .eq('id', planId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting visit plan details:', error);
    return null;
  }
};

// =============================================================================
// 7. GET DAILY BREAKDOWN
// =============================================================================

export const getDailyBreakdown = async (planId) => {
  try {
    const { data, error } = await supabase
      .from('daily_visit_plans')
      .select(`
        *,
        planned_visits (*)
      `)
      .eq('visit_plan_id', planId)
      .order('visit_date');
    
    if (error) throw error;
    
    // Transform to weekly format
    const weeks = [];
    let currentWeek = { week: 1, days: [], summary: { totalVisits: 0, estimatedRevenue: 0 } };
    let weekNumber = 1;

    data.forEach((dayPlan, index) => {
      const dayData = {
        date: dayPlan.visit_date,
        dayName: new Date(dayPlan.visit_date).toLocaleDateString('en-US', { weekday: 'short' }),
        visits: dayPlan.planned_visits || [],
        summary: {
          totalVisits: dayPlan.planned_visits_count || 0,
          estimatedRevenue: parseFloat(dayPlan.estimated_daily_revenue) || 0,
          areasVisited: new Set(dayPlan.planned_visits?.map(v => v.area_name) || []).size,
          highPriorityVisits: dayPlan.planned_visits?.filter(v => v.priority_level === 'HIGH').length || 0
        }
      };

      currentWeek.days.push(dayData);
      currentWeek.summary.totalVisits += dayData.summary.totalVisits;
      currentWeek.summary.estimatedRevenue += dayData.summary.estimatedRevenue;

      // Close week after 6 days (Mon-Sat) or at end
      if (currentWeek.days.length === 6 || index === data.length - 1) {
        weeks.push(currentWeek);
        weekNumber++;
        currentWeek = { 
          week: weekNumber, 
          days: [], 
          summary: { totalVisits: 0, estimatedRevenue: 0 } 
        };
      }
    });

    return weeks;
  } catch (error) {
    console.error('Error getting daily breakdown:', error);
    return [];
  }
};

// =============================================================================
// 8. COMPLETE WORKFLOW - ONE FUNCTION TO RULE THEM ALL
// =============================================================================

export const generateCompleteVisitPlan = async (mrName, month, year) => {
  try {
    console.log('🚀 Starting complete visit plan generation...');
    
    // Step 1: Create visit plan (automatically handles clustering)
    const planId = await createGeminiVisitPlan(mrName, month, year);
    
    // Step 2: Get plan details
    const planDetails = await getVisitPlanDetails(planId);
    
    // Step 3: Get daily breakdown
    const weeklyBreakdown = await getDailyBreakdown(planId);
    
    // Step 4: Generate insights
    const insights = generatePlanInsights(planDetails, weeklyBreakdown);
    
    // Step 5: Return complete plan
    const completePlan = {
      planId,
      mrName,
      month,
      year,
      summary: {
        totalWorkingDays: planDetails?.total_working_days || 25,
        totalPlannedVisits: planDetails?.total_planned_visits || 0,
        estimatedRevenue: planDetails?.estimated_revenue || 0,
        efficiencyScore: planDetails?.efficiency_score || 0,
        coverageScore: calculateCoverageScore(weeklyBreakdown)
      },
      weeklyBreakdown,
      insights
    };
    
    console.log('✅ Complete visit plan generated successfully');
    return completePlan;
    
  } catch (error) {
    console.error('💥 Error generating complete visit plan:', error);
    throw error;
  }
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const generatePlanInsights = (planDetails, weeklyBreakdown) => {
  const insights = [];
  
  const totalRevenue = parseFloat(planDetails?.estimated_revenue) || 0;
  const totalVisits = planDetails?.total_planned_visits || 0;
  const workingDays = planDetails?.total_working_days || 25;
  
  // Revenue insight
  insights.push({
    type: 'revenue',
    title: 'Revenue Potential',
    value: `₹${(totalRevenue / 100000).toFixed(1)}L`,
    description: `Expected monthly revenue from ${totalVisits} visits`,
    recommendation: totalRevenue > 500000 ? 'Excellent revenue potential' : 'Focus on high-value customers'
  });

  // Efficiency insight
  const avgVisitsPerDay = workingDays > 0 ? (totalVisits / workingDays).toFixed(1) : 0;
  insights.push({
    type: 'optimization',
    title: 'Visit Efficiency',
    value: `${avgVisitsPerDay}/day`,
    description: 'Average visits per working day',
    recommendation: avgVisitsPerDay >= 8 ? 'Optimal visit distribution' : 'Consider increasing daily visits'
  });

  // Coverage insight
  const totalAreas = new Set(
    weeklyBreakdown.flatMap(week => 
      week.days.flatMap(day => 
        day.visits?.map(v => v.area_name) || []
      )
    )
  ).size;
  
  insights.push({
    type: 'coverage',
    title: 'Territory Coverage',
    value: `${totalAreas} areas`,
    description: 'Geographic areas covered in plan',
    recommendation: 'AI-optimized geographic clustering'
  });

  return insights;
};

const calculateCoverageScore = (weeklyBreakdown) => {
  if (!weeklyBreakdown || weeklyBreakdown.length === 0) return 0;
  
  const totalVisits = weeklyBreakdown.reduce((sum, week) => 
    sum + week.summary.totalVisits, 0
  );
  
  const totalAreas = new Set(
    weeklyBreakdown.flatMap(week => 
      week.days.flatMap(day => 
        day.visits?.map(v => v.area_name) || []
      )
    )
  ).size;
  
  // Score based on visits and area coverage
  return Math.min(100, (totalAreas * 4) + (totalVisits > 150 ? 20 : 10));
};



// Fix 1: Updated createGeminiClusters - minimal changes to your existing function
export const createGeminiClusters = async (mrName, apiKey = null) => {
  const geminiApiKey = apiKey || process.env.REACT_APP_GEMINI_API_KEY;
  
  if (!geminiApiKey) {
    throw new Error('Gemini API key not found');
  }

  try {
    console.log('🤖 Starting Gemini clustering for MR:', mrName);
    
    // Step 1: Get customer areas - using your existing function
    const areas = await getCustomerAreasForClustering(mrName);
    
    if (areas.length === 0) {
      throw new Error('No customer areas found for this MR');
    }

    const areaList = areas.map(a => a.area_name).join(', ');
    console.log('📊 Areas to cluster:', areaList);
    
    // Step 2: Create Gemini prompt - same as yours
    const prompt = `I have a Medical Representative named ${mrName} who needs to visit customers in these areas in India:
${areaList}

IMPORTANT: Use the EXACT area names provided above. Do not add words like "City" or modify the names.

Please create 3-4 optimal geographic clusters for visit planning based on:
1. Geographic proximity and travel efficiency
2. Area connectivity and road networks  
3. Business density and commercial importance
4. Logical route optimization for daily visits

For each cluster, provide:
- cluster_id: Unique number
- cluster_name: Geographic description
- areas: Array of area objects with EXACT names (format: { "area_name": "Name", "city": "City", "state": "State" })
- visit_sequence: Recommended visit order
- estimated_travel_times: Key-value pairs of "From -> To": "time"
- best_days: Recommended days to visit

Return ONLY a valid JSON object in this exact format:
{
  "clusters": [
    {
      "cluster_id": 1,
      "cluster_name": "Central Business Cluster",
      "areas": [
        { "area_name": "Bhopal", "city": "Bhopal", "state": "Madhya Pradesh" }
      ],
      "visit_sequence": ["Bhopal"],
      "estimated_travel_times": {},
      "best_days": ["Monday"]
    }
  ]
}`;

    // Step 3: Call Gemini API - same as yours
    console.log('🤖 Calling Gemini API...');
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const textResponse = data.candidates[0].content.parts[0].text;
    console.log('🤖 Gemini raw response:', textResponse);

    // Step 4: Extract and parse JSON - same as yours
    let jsonString = textResponse.trim();
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.slice(7, -3).trim();
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.slice(3, -3).trim();
    }

    let clusterData;
    try {
      clusterData = JSON.parse(jsonString);
      if (!clusterData.clusters || !Array.isArray(clusterData.clusters)) {
        throw new Error('Invalid cluster data structure - missing clusters array');
      }
    } catch (e) {
      console.error('Failed to parse JSON:', e);
      console.error('Original response:', textResponse);
      throw new Error('Invalid JSON response from Gemini');
    }

    // Step 5: Enhanced data normalization - FIXED DATA TYPES
    const enhancedClusters = clusterData.clusters.map(cluster => {
      // Normalize areas to always be objects
      const normalizedAreas = cluster.areas.map(area => {
        if (typeof area === 'string') {
          return {
            area_name: area,
            city: 'Unknown',
            state: 'Unknown'
          };
        }
        return {
          area_name: String(area.area_name || ''),
          city: String(area.city || 'Unknown'),
          state: String(area.state || 'Unknown')
        };
      });

      // Parse travel times to extract minutes as INTEGER
      const travelTimes = cluster.estimated_travel_times || {};
      let estimatedMinutes = 0;
      let travelTimeString = '';
      
      if (Object.keys(travelTimes).length > 0) {
        // Extract first numeric value for database storage
        const firstTime = Object.values(travelTimes)[0];
        const match = String(firstTime).match(/(\d+)/);
        estimatedMinutes = match ? parseInt(match[1]) : 0;
        
        // Create string representation for detailed_travel_route
        travelTimeString = Object.entries(travelTimes)
          .map(([route, time]) => `${route}: ${time}`)
          .join('; ');
      }

      // Calculate customer count from original areas data
      const customerCount = areas
        .filter(area => normalizedAreas.some(a => a.area_name === area.area_name))
        .reduce((sum, area) => sum + (parseInt(area.customer_count) || 0), 0);

      // Ensure recommended_days is an array of strings
      let recommendedDays = [];
      if (cluster.best_days && Array.isArray(cluster.best_days)) {
        recommendedDays = cluster.best_days.map(day => String(day));
      } else if (cluster.recommended_days && Array.isArray(cluster.recommended_days)) {
        recommendedDays = cluster.recommended_days.map(day => String(day));
      }

      return {
        cluster_id: parseInt(cluster.cluster_id) || 1,
        cluster_name: String(cluster.cluster_name || `Cluster ${cluster.cluster_id}`),
        areas: normalizedAreas,
        visit_sequence: Array.isArray(cluster.visit_sequence) ? cluster.visit_sequence : [],
        estimated_travel_times: travelTimes,
        best_days: recommendedDays,
        // Database-ready fields
        estimated_travel_time_minutes: estimatedMinutes,
        detailed_travel_route: travelTimeString,
        recommended_days: recommendedDays,
        total_estimated_customers: customerCount,
        primary_city: normalizedAreas[0]?.city || 'Unknown',
        primary_state: normalizedAreas[0]?.state || 'Unknown',
        business_density: 'Medium',
        travel_notes: cluster.travel_notes || ''
      };
    });

    console.log('✅ Gemini clustering completed:', enhancedClusters.length, 'clusters');
    
    return {
      success: true,
      clusters: enhancedClusters,
      optimization_notes: clusterData.optimization_notes || 'Generated by Gemini AI',
      total_clusters: enhancedClusters.length
    };

  } catch (error) {
    console.error('💥 Gemini clustering failed:', error);
    throw error;
  }
};

//------------new with customer data updation
export const saveClusterAssignments = async (mrName, clusters) => {
  try {
    console.log('💾 Saving cluster assignments for:', mrName);
    
    if (!clusters || !Array.isArray(clusters)) {
      throw new Error('Invalid clusters data');
    }

    let totalSaved = 0;
    const errors = [];
    
    // Process clusters sequentially
    for (const [clusterIndex, cluster] of clusters.entries()) {
      console.log(`📦 Processing cluster ${cluster.cluster_id}: ${cluster.cluster_name}`);
      
      // Process areas in parallel with error handling
      const savePromises = cluster.areas.map(async (areaObj) => {
        try {
          const visitSequenceOrder = cluster.visit_sequence?.indexOf(areaObj.area_name) + 1 || 1;
          
          // FIXED: Proper data type mapping for your schema
          const areaData = {
            // Required fields - VARCHAR/TEXT
            mr_name: String(mrName),
            area_name: String(areaObj.area_name),
            city: String(areaObj.city || 'Unknown'),
            state: String(areaObj.state || 'Unknown'),
            
            // Coordinates - NUMERIC (using 0 as placeholder)
            latitude: 0.0,
            longitude: 0.0,
            
            // Cluster info - INTEGER and VARCHAR
            cluster_id: parseInt(cluster.cluster_id) || null,
            cluster_name: String(cluster.cluster_name || ''),
            
            // Visit planning - INTEGER
            visit_sequence_order: parseInt(visitSequenceOrder) || 1,
            estimated_travel_time_minutes: parseInt(cluster.estimated_travel_time_minutes) || 0,
            total_estimated_customers: parseInt(cluster.total_estimated_customers) || 0,
            customer_count: 0, // Will be updated by the customer data function
            
            // Arrays and JSON - proper format
            recommended_days: cluster.recommended_days || [], // ARRAY type
            
            // Text fields
            travel_notes: String(cluster.travel_notes || ''),
            detailed_travel_route: String(cluster.detailed_travel_route || ''),
            business_density: String(cluster.business_density || 'Medium'),
            primary_city: String(cluster.primary_city || areaObj.city || 'Unknown'),
            primary_state: String(cluster.primary_state || areaObj.state || 'Unknown'),
            
            // Gemini specific - BOOLEAN and NUMERIC
            gemini_processed: true,
            gemini_confidence: 0.85,
            
            // Status - BOOLEAN
            is_active: true,
            
            // Revenue fields - NUMERIC with proper formatting
            avg_order_value: 0.00, // Will be updated by the customer data function
            total_revenue: 0.00, // Will be updated by the customer data function
            
            // Timestamps
            last_gemini_update: new Date().toISOString()
          };

          // Validate required fields
          if (!areaData.area_name) {
            throw new Error(`Missing area_name for cluster ${cluster.cluster_id}`);
          }

          // Use direct upsert instead of RPC for better error handling
          const { error } = await supabase
            .from('area_coordinates')
            .upsert(areaData, {
              onConflict: 'area_name,city,mr_name',
              ignoreDuplicates: false
            });

          if (error) throw error;
          
          console.log(`✅ Saved ${areaData.area_name} to cluster ${cluster.cluster_id}`);
          return true;
          
        } catch (error) {
          console.error(`❌ Failed to save area in cluster ${cluster.cluster_id}:`, error);
          errors.push({
            cluster: cluster.cluster_id,
            area: areaObj.area_name,
            error: error.message
          });
          return false;
        }
      });

      // Wait for all areas in current cluster to process
      const results = await Promise.all(savePromises);
      totalSaved += results.filter(Boolean).length;
    }

    console.log(`💾 Cluster assignments saved: ${totalSaved} areas`);

    // NEW: Update customer data after saving clusters
    try {
      console.log('📊 Updating customer data for all areas...');
      const { data: updateResult, error: updateError } = await supabase.rpc('update_customer_data_for_mr', {
        p_mr_name: mrName
      });

      if (updateError) {
        console.error('⚠️ Customer data update failed:', updateError);
      } else {
        console.log('✅ Customer data updated:', updateResult);
      }
    } catch (updateError) {
      console.error('⚠️ Customer data update failed:', updateError);
      // Don't fail the whole operation if customer data update fails
    }
    
    if (errors.length > 0) {
      console.warn(`⚠️ Completed with ${errors.length} errors`, errors);
      return {
        success: true,
        totalSaved,
        totalErrors: errors.length,
        errors
      };
    }
    
    return { success: true, totalSaved };

  } catch (error) {
    console.error('💥 Error saving cluster assignments:', error);
    throw error;
  }
};

// Usage remains the same:
/*
const runClustering = async () => {
  try {
    const result = await createGeminiClusters('John Doe', 'your-api-key');
    const saveResult = await saveClusterAssignments('John Doe', result.clusters);
    console.log('Complete:', saveResult);
  } catch (error) {
    console.error('Failed:', error);
  }
};
*/
