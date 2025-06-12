// data.js - Updated for Supabase Integration
import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey)

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
     
    const improvedPrompt = `I have a Medical Representative named ${mrName} who needs to visit customers in these areas in India:
${areaList}

Please analyze these areas and create 3-4 optimal geographic clusters for visit planning. 

IMPORTANT REQUIREMENTS:
1. Use EXACT area names as provided (do not modify them)
2. Identify the correct city and state for each area in India
3. Provide complete travel and scheduling information
4. Consider geographic proximity and business efficiency

For each cluster, provide:
- Cluster name (descriptive geographic name)
- Areas with correct city/state identification
- Visit sequence optimization
- Travel time estimates between areas
- Recommended visit days
- Practical travel notes

Return ONLY a valid JSON object in this EXACT format (no markdown, no extra text):

{
  "clusters": [
    {
      "cluster_id": 1,
      "cluster_name": "Central Delhi Business Hub",
      "primary_city": "New Delhi",
      "primary_state": "Delhi",
      "areas": [
        {
          "area_name": "MALVIYA NAGAR",
          "city": "New Delhi", 
          "state": "Delhi",
          "visit_sequence_order": 1,
          "estimated_travel_time_minutes": 30
        },
        {
          "area_name": "CHATTARPUR NEB SARAI",
          "city": "New Delhi",
          "state": "Delhi", 
          "visit_sequence_order": 2,
          "estimated_travel_time_minutes": 45
        }
      ],
      "recommended_days": ["Monday", "Tuesday", "Wednesday"],
      "total_travel_time_minutes": 120,
      "travel_notes": "Start early from central Delhi. Traffic is heavy during peak hours. Plan visits between 10 AM - 5 PM for optimal connectivity.",
      "business_density": "High",
      "cluster_priority": "High"
    }
  ]
}

Guidelines:
- For Delhi areas: Use "New Delhi" as city, "Delhi" as state
- For Mumbai areas: Use "Mumbai" as city, "Maharashtra" as state  
- For Bangalore areas: Use "Bangalore" as city, "Karnataka" as state
- Always provide realistic travel times (15-90 minutes between areas)
- Recommend 2-4 days per week per cluster
- Include practical travel advice in travel_notes
- Ensure all fields are filled with meaningful data`;

    const result = await window.ai.languageModel.create({
      systemPrompt: "You are a geographic clustering expert for medical sales territory planning in India. Provide accurate, practical recommendations based on Indian geography and business travel patterns."
    });

    const response = await result.prompt(improvedPrompt);
    console.log('Gemini raw response:', response);

    // Parse and validate response
    let parsedResponse;
    try {
      // Clean response (remove any markdown formatting)
      const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedResponse = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error('Invalid JSON response from Gemini');
    }

    // Validate and enhance the response
    if (!parsedResponse.clusters || !Array.isArray(parsedResponse.clusters)) {
      throw new Error('Invalid clusters structure in response');
    }

    // Process each cluster to ensure all fields are present
    const processedClusters = parsedResponse.clusters.map((cluster, index) => {
      // Ensure required cluster fields
      const processedCluster = {
        cluster_id: cluster.cluster_id || (index + 1),
        cluster_name: cluster.cluster_name || `Cluster ${index + 1}`,
        primary_city: cluster.primary_city || 'Unknown City',
        primary_state: cluster.primary_state || 'Unknown State',
        recommended_days: cluster.recommended_days || ['Monday', 'Tuesday', 'Wednesday'],
        total_travel_time_minutes: cluster.total_travel_time_minutes || 60,
        travel_notes: cluster.travel_notes || 'Plan visits during business hours. Consider traffic conditions.',
        business_density: cluster.business_density || 'Medium',
        cluster_priority: cluster.cluster_priority || 'Medium',
        areas: []
      };

      // Process areas within cluster
      if (cluster.areas && Array.isArray(cluster.areas)) {
        processedCluster.areas = cluster.areas.map((area, areaIndex) => ({
          area_name: area.area_name || areas[areaIndex] || `Area ${areaIndex + 1}`,
          city: area.city || processedCluster.primary_city,
          state: area.state || processedCluster.primary_state,
          visit_sequence_order: area.visit_sequence_order || (areaIndex + 1),
          estimated_travel_time_minutes: area.estimated_travel_time_minutes || 30
        }));
      }

      return processedCluster;
    });

    console.log('Processed clusters:', processedClusters);
    return { clusters: processedClusters };

  } catch (error) {
    console.error('Error in createGeminiClusters:', error);
    
    // No fallback - only save data from Gemini
    throw new Error(`Failed to create Gemini clusters: ${error.message}`);
  }
};
// =============================================================================
// 3. SAVE CLUSTER ASSIGNMENTS
// =============================================================================

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
          estimated_travel_time_minutes: cluster.estimated_travel_time_minutes || null,
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
    const { data: planId, error } = await supabase.rpc('create_area_optimized_visit_plan', {
      p_mr_name: mrName,
      p_month: month,
      p_year: year,
      p_target_visits_per_day: 10
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
