// data.js - Cleaned for Overview and Visit Planner only
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

// Fetch functions for core data
export const fetchOrderData = async () => {
  let allItems = [];
  let lastItemCount = 0;
  let offset = 0;
  const pageSize = 1000;

  try {
    do {
      const { data: chunk, error: chunkError } = await supabase
        .from('order_items')
        .select('*')
        .order('order_date', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (chunkError) {
        console.error('Error fetching chunk of order_items:', chunkError);
        throw chunkError;
      }

      if (chunk) {
        allItems = allItems.concat(chunk);
        lastItemCount = chunk.length;
        offset += pageSize;
      } else {
        lastItemCount = 0;
      }
    } while (lastItemCount === pageSize);

    return allItems.map(item => ({
      orderId: item.order_id,
      date: item.order_date,
      customerId: item.customer_code,
      customerName: item.customer_name,
      customerType: item.customer_type,
      territory: item.territory,
      city: item.city,
      state: item.state,
      netAmount: parseFloat(item.order_net_amount) || 0,
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
      master_code: item.master_code
    }));
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
        .order('order_date', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (chunkError) {
        console.error('Error fetching chunk of dashboard orders:', chunkError);
        throw chunkError;
      }

      if (chunk) {
        allItems = allItems.concat(chunk);
        lastItemCount = chunk.length;
        offset += pageSize;
      } else {
        lastItemCount = 0;
      }
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

//============================================================================
// VISIT PLANNER RELATED FUNCTIONS - Keep these for visit planner functionality
//============================================================================

// Get customer areas for clustering
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

// Gemini AI clustering
export const createGeminiClusters = async (mrName, apiKey = null) => {
  const geminiApiKey = apiKey || process.env.REACT_APP_GEMINI_API_KEY;
  
  if (!geminiApiKey) {
    throw new Error('Gemini API key not found');
  }

  try {
    console.log('🤖 Starting Gemini clustering for MR:', mrName);
    
    const areas = await getCustomerAreasForClustering(mrName);
    
    if (areas.length === 0) {
      throw new Error('No customer areas found for this MR');
    }

    const areaList = areas.map(a => a.area_name).join(', ');
    console.log('📊 Areas to cluster:', areaList);
    
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

    const enhancedClusters = clusterData.clusters.map(cluster => {
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

      const travelTimes = cluster.estimated_travel_times || {};
      let estimatedMinutes = 0;
      let travelTimeString = '';
      
      if (Object.keys(travelTimes).length > 0) {
        const firstTime = Object.values(travelTimes)[0];
        const match = String(firstTime).match(/(\d+)/);
        estimatedMinutes = match ? parseInt(match[1]) : 0;
        
        travelTimeString = Object.entries(travelTimes)
          .map(([route, time]) => `${route}: ${time}`)
          .join('; ');
      }

      const customerCount = areas
        .filter(area => normalizedAreas.some(a => a.area_name === area.area_name))
        .reduce((sum, area) => sum + (parseInt(area.customer_count) || 0), 0);

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

// Save cluster assignments
export const saveClusterAssignments = async (mrName, clusters) => {
  try {
    console.log('💾 Saving cluster assignments for:', mrName);
    
    if (!clusters || !Array.isArray(clusters)) {
      throw new Error('Invalid clusters data');
    }

    let totalSaved = 0;
    const errors = [];
    
    for (const [clusterIndex, cluster] of clusters.entries()) {
      console.log(`📦 Processing cluster ${cluster.cluster_id}: ${cluster.cluster_name}`);
      
      const savePromises = cluster.areas.map(async (areaObj) => {
        try {
          const visitSequenceOrder = cluster.visit_sequence?.indexOf(areaObj.area_name) + 1 || 1;
          
          const areaData = {
            mr_name: String(mrName),
            area_name: String(areaObj.area_name),
            city: String(areaObj.city || 'Unknown'),
            state: String(areaObj.state || 'Unknown'),
            latitude: 0.0,
            longitude: 0.0,
            cluster_id: parseInt(cluster.cluster_id) || null,
            cluster_name: String(cluster.cluster_name || ''),
            visit_sequence_order: parseInt(visitSequenceOrder) || 1,
            estimated_travel_time_minutes: parseInt(cluster.estimated_travel_time_minutes) || 0,
            total_estimated_customers: parseInt(cluster.total_estimated_customers) || 0,
            customer_count: 0,
            recommended_days: cluster.recommended_days || [],
            travel_notes: String(cluster.travel_notes || ''),
            detailed_travel_route: String(cluster.detailed_travel_route || ''),
            business_density: String(cluster.business_density || 'Medium'),
            primary_city: String(cluster.primary_city || areaObj.city || 'Unknown'),
            primary_state: String(cluster.primary_state || areaObj.state || 'Unknown'),
            gemini_processed: true,
            gemini_confidence: 0.85,
            is_active: true,
            avg_order_value: 0.00,
            total_revenue: 0.00,
            last_gemini_update: new Date().toISOString()
          };

          if (!areaData.area_name) {
            throw new Error(`Missing area_name for cluster ${cluster.cluster_id}`);
          }

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

      const results = await Promise.all(savePromises);
      totalSaved += results.filter(Boolean).length;
    }

    console.log(`💾 Cluster assignments saved: ${totalSaved} areas`);

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
    throw error
