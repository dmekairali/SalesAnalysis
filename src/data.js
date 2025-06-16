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

// Get existing clusters
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

// Create visit plan
export const createGeminiVisitPlan = async (mrName, month, year) => {
  try {
    console.log('🎯 Creating visit plan for:', { mrName, month, year });
    
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

    const { data: planId, error } = await supabase.rpc('create_smart_revisit_visit_plan', {
      p_mr_name: mrName,
      p_month: month,
      p_year: year,
      p_target_visits_per_day: 15,
      p_min_revisit_gap_days: 7
    });

    if (error) throw error;

    console.log('✅ Visit plan created with ID:', planId);
    return planId;

  } catch (error) {
    console.error('💥 Error creating visit plan:', error);
    throw error;
  }
};

// Get visit plan details
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

// Get daily breakdown
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

// Complete workflow for visit planning
export const generateCompleteVisitPlan = async (mrName, month, year) => {
  try {
    console.log('🚀 Starting complete visit plan generation...');
    
    const planId = await createGeminiVisitPlan(mrName, month, year);
    const planDetails = await getVisitPlanDetails(planId);
    const weeklyBreakdown = await getDailyBreakdown(planId);
    const insights = generatePlanInsights(planDetails, weeklyBreakdown);
    
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

// Helper functions for visit planning
const generatePlanInsights = (planDetails, weeklyBreakdown) => {
  const insights = [];
  
  const totalRevenue = parseFloat(planDetails?.estimated_revenue) || 0;
  const totalVisits = planDetails?.total_planned_visits || 0;
  const workingDays = planDetails?.total_working_days || 25;
  
  insights.push({
    type: 'revenue',
    title: 'Revenue Potential',
    value: `₹${(totalRevenue / 100000).toFixed(1)}L`,
    description: `Expected monthly revenue from ${totalVisits} visits`,
    recommendation: totalRevenue > 500000 ? 'Excellent revenue potential' : 'Focus on high-value customers'
  });

  const avgVisitsPerDay = workingDays > 0 ? (totalVisits / workingDays).toFixed(1) : 0;
  insights.push({
    type: 'optimization',
    title: 'Visit Efficiency',
    value: `${avgVisitsPerDay}/day`,
    description: 'Average visits per working day',
    recommendation: avgVisitsPerDay >= 8 ? 'Optimal visit distribution' : 'Consider increasing daily visits'
  });

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
  
  return Math.min(100, (totalAreas * 4) + (totalVisits > 150 ? 20 : 10));
};
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
