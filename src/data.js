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

// Step 4: Add to src/data.js - Visit Planner data fetching functions

// Add these functions to your existing data.js file:

// Fetch MR visit data
export const fetchMRVisits = async () => {
  let allItems = [];
  let lastItemCount = 0;
  let offset = 0;
  const pageSize = 1000;

  try {
    do {
      const { data: chunk, error: chunkError } = await supabase
        .from('mr_visits')
        .select('*')
        .order('dcrDate', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (chunkError) {
        console.error('Error fetching chunk of mr_visits:', chunkError);
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

    return allItems.map(visit => ({
      visitId: visit.visitId,
      empId: visit.empId,
      empName: visit.empName,
      dcrDate: visit.dcrDate,
      clientId: visit.clientId,
      clientName: visit.clientName,
      clientMobileNo: visit.clientMobileNo,
      visitType: visit.visitType,
      inTime: visit.inTime,
      outTime: visit.outTime,
      areaId: visit.areaId,
      areaName: visit.areaName,
      cityName: visit.cityName,
      pinCode: visit.pinCode,
      amountOfSale: parseFloat(visit.amountOfSale) || 0,
      amountCollect: parseFloat(visit.amountCollect) || 0,
      sampleValue: parseFloat(visit.sampleValue) || 0,
      sampleGiven: visit.sampleGiven,
      productSale: visit.productSale,
      dcrStatus: visit.dcrStatus,
      deviation: visit.deviation,
      tpDeviationReason: visit.tpDeviationReason,
      planedTP: visit.planedTP,
      visitedArea: visit.visitedArea,
      km: visit.km,
      imageURL: visit.imageURL,
      workType: visit.workType,
      startTime: visit.startTime,
      endTime: visit.endTime,
      totalWorkTime: visit.totalWorkTime,
      asmName: visit.asmName,
      timeStamp: visit.timeStamp,
      visitTime: visit.visitTime,
      designationName: visit.designationName,
      noOfPlanDoctors: visit.noOfPlanDoctors,
      noOfPlanRetailers: visit.noOfPlanRetailers,
      noOfPlanStockists: visit.noOfPlanStockists,
      planDoctors: visit.planDoctors,
      planRetailers: visit.planRetailers,
      planStockists: visit.planStockists,
      customerPhone: visit.customer_phone,
      customerName: visit.customer_name,
      mrName: visit.mr_name,
      customerType: visit.customer_type
    }));
  } catch (error) {
    console.error('Error in paginated fetchMRVisits:', error);
    return [];
  }
};

// Fetch customer patterns for visit planning
export const fetchCustomerPatterns = async (mrName = null) => {
  try {
    let query = supabase
      .from('customer_visit_patterns')
      .select('*');
    
    if (mrName) {
      query = query.eq('mr_name', mrName);
    }
    
    const { data, error } = await query
      .order('priority_score', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching customer patterns:', error);
    return [];
  }
};

// Get customer predictions for visit planning (calls the stored procedure)
export const getCustomerPredictions = async (mrName, targetMonth, targetYear) => {
  try {
    const { data, error } = await supabase
      .rpc('get_customer_predictions', {
        p_mr_name: mrName,
        p_target_month: targetMonth,
        p_target_year: targetYear
      });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting customer predictions:', error);
    return [];
  }
};

// Create a visit plan (calls the stored procedure)
export const createVisitPlan = async (mrName, month, year, maxVisitsPerDay = 10) => {
  try {
    const { data, error } = await supabase
      .rpc('create_visit_plan', {
        p_mr_name: mrName,
        p_month: month,
        p_year: year,
        p_max_visits_per_day: maxVisitsPerDay
      });
    
    if (error) throw error;
    return data; // Returns the UUID of the created plan
  } catch (error) {
    console.error('Error creating visit plan:', error);
    return null;
  }
};

// Get visit plan summary (calls the stored procedure)
export const getVisitPlanSummary = async (planId) => {
  try {
    const { data, error } = await supabase
      .rpc('get_visit_plan_summary', {
        p_plan_id: planId
      });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting visit plan summary:', error);
    return [];
  }
};

// Get visit plan API (comprehensive data)
/*export const getVisitPlanAPI = async (mrName, month, year) => {
  try {
    const { data, error } = await supabase
      .rpc('get_visit_plan_api', {
        p_mr_name: mrName,
        p_month: month,
        p_year: year
      });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting visit plan API:', error);
    return null;
  }
};
*/
export const getVisitPlanAPI = async (mrName, month, year) => {
  try {
    console.log('Creating visit plan for:', { mrName, month, year });
    
    // Call your creation function directly
    const { data: planId, error: createError } = await supabase
      .rpc('create_route_optimized_visit_plan', {
        p_mr_name: mrName,
        p_month: month,  
        p_year: year,
        p_max_visits_per_day: 10,
        p_min_nbd_per_area: 3
      });

    if (createError) {
      console.error('Error creating plan:', createError);
      return { success: false, error: createError.message };
    }

    // Now get the plan details
    const { data: planData, error: fetchError } = await supabase
      .from('visit_plans')
      .select(`
        *,
        daily_visit_plans (
          *,
          planned_visits (*)
        )
      `)
      .eq('id', planId)
      .single();

    if (fetchError) {
      console.error('Error fetching plan:', fetchError);
      return { success: false, error: fetchError.message };
    }

    // Transform to expected format
    return {
      success: true,
      summary: {
  totalWorkingDays: planData.total_working_days,        // Add camelCase
  total_working_days: planData.total_working_days,      // Keep original
  totalPlannedVisits: planData.total_planned_visits,    // Add camelCase  
  total_planned_visits: planData.total_planned_visits,  // Keep original
  estimatedRevenue: planData.estimated_revenue,         // Add camelCase
  estimated_revenue: planData.estimated_revenue,        // Keep original
  efficiencyScore: planData.efficiency_score,           // Add camelCase
  efficiency_score: planData.efficiency_score           // Keep original
},
      daily_plans: planData.daily_visit_plans.map(day => ({
        date: day.visit_date,
        total_visits: day.planned_visits_count,
        estimated_revenue: day.estimated_daily_revenue,
        visits: day.planned_visits
      }))
    };
  } catch (error) {
    console.error('Error in getVisitPlanAPI:', error);
    return { success: false, error: error.message };
  }
};

// Get ML recommendations for visit planning
export const getMLVisitRecommendations = async (mrName, targetDate, maxVisits = 10) => {
  try {
    const { data, error } = await supabase
      .rpc('generate_ml_visit_recommendations', {
        p_mr_name: mrName,
        p_target_date: targetDate,
        p_max_visits: maxVisits
      });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting ML visit recommendations:', error);
    return [];
  }
};

// Calculate customer patterns (calls the stored procedure)
export const calculateCustomerPatterns = async (mrName = null) => {
  try {
    const { data, error } = await supabase
      .rpc('calculate_customer_patterns', {
        p_mr_name: mrName
      });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error calculating customer patterns:', error);
    return [];
  }
};

// Track visit plan performance
export const trackVisitPlanPerformance = async (planId, actualVisits) => {
  try {
    const { data, error } = await supabase
      .rpc('track_visit_plan_performance', {
        p_plan_id: planId,
        p_actual_visits: actualVisits
      });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error tracking visit plan performance:', error);
    return [];
  }
};

// Fetch visit plans for a specific MR
export const fetchVisitPlans = async (mrName = null, status = null) => {
  try {
    let query = supabase
      .from('visit_plans')
      .select('*');
    
    if (mrName) {
      query = query.eq('mr_name', mrName);
    }
    
    if (status) {
      query = query.eq('plan_status', status);
    }
    
    const { data, error } = await query
      .order('plan_generated_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching visit plans:', error);
    return [];
  }
};

// Fetch daily visit plans for a specific plan
export const fetchDailyVisitPlans = async (visitPlanId) => {
  try {
    const { data, error } = await supabase
      .from('daily_visit_plans')
      .select(`
        *,
        planned_visits (*)
      `)
      .eq('visit_plan_id', visitPlanId)
      .order('visit_date', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching daily visit plans:', error);
    return [];
  }
};

// Update visit status
export const updateVisitStatus = async (visitId, actualVisitTime, actualDuration, actualOrderValue, visitCompleted, feedback = null) => {
  try {
    const { data, error } = await supabase
      .from('planned_visits')
      .update({
        actual_visit_time: actualVisitTime,
        actual_duration_minutes: actualDuration,
        actual_order_value: actualOrderValue,
        visit_completed: visitCompleted,
        visit_feedback: feedback
      })
      .eq('id', visitId);
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating visit status:', error);
    return null;
  }
};

// Fetch area master data for route optimization
export const fetchAreaMaster = async () => {
  try {
    const { data, error } = await supabase
      .from('area_master')
      .select('*')
      .eq('is_active', true)
      .order('area_name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching area master:', error);
    return [];
  }
};

// Fetch MR territories
export const fetchMRTerritories = async (mrName = null) => {
  try {
    let query = supabase
      .from('mr_territories')
      .select('*')
      .eq('is_active', true);
    
    if (mrName) {
      query = query.eq('mr_name', mrName);
    }
    
    const { data, error } = await query
      .order('priority_level', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching MR territories:', error);
    return [];
  }
};

// Cleanup route cache
export const cleanupRouteCache = async () => {
  try {
    const { data, error } = await supabase
      .rpc('cleanup_route_cache');
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error cleaning up route cache:', error);
    return 0;
  }
};

// Auto update customer patterns
export const autoUpdateCustomerPatterns = async () => {
  try {
    const { data, error } = await supabase
      .rpc('auto_update_customer_patterns');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error auto updating customer patterns:', error);
    return [];
  }
};


//--- new uopdate for visits

// Add these functions to src/data.js

// Visit Planner ML Integration Class
export class VisitPlannerML {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
  }

  // Generate visit plan using ML
  async generateVisitPlan(mrName, month, year) {
    try {
      // First calculate customer patterns
      await this.calculateCustomerPatterns(mrName);
      
      // Get visit plan from API
      const { data, error } = await this.supabase
        .rpc('get_visit_plan_api', {
          p_mr_name: mrName,
          p_month: month,
          p_year: year
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating visit plan:', error);
      return null;
    }
  }

  // Calculate customer patterns
  async calculateCustomerPatterns(mrName) {
    try {
      const { data, error } = await this.supabase
        .rpc('calculate_customer_patterns', {
          p_mr_name: mrName
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error calculating customer patterns:', error);
      return [];
    }
  }

  // Get customer predictions
  async getCustomerPredictions(mrName, month, year) {
    try {
      const { data, error } = await this.supabase
        .rpc('get_customer_predictions', {
          p_mr_name: mrName,
          p_target_month: month,
          p_target_year: year
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting customer predictions:', error);
      return [];
    }
  }
}

// Initialize visit planner ML
export const visitPlannerML = new VisitPlannerML(supabase);

// Fetch MR list from visits data
export const fetchMRList = async () => {
  try {
    const { data, error } = await supabase
      .from('mr_visits')
      .select('mr_name')
      .not('mr_name', 'is', null)
      .order('mr_name');

    if (error) throw error;
    
    // Get unique MR names
    const uniqueMRs = [...new Set(data.map(item => item.mr_name))].sort();
    return uniqueMRs;
  } catch (error) {
    console.error('Error fetching MR list:', error);
    return [];
  }
};

// Fetch visit plan by ID
export const fetchVisitPlanById = async (planId) => {
  try {
    const { data, error } = await supabase
      .from('visit_plans')
      .select(`
        *,
        daily_visit_plans (
          *,
          planned_visits (*)
        )
      `)
      .eq('id', planId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching visit plan:', error);
    return null;
  }
};

// Update visit plan status
export const updateVisitPlanStatus = async (planId, status) => {
  try {
    const { data, error } = await supabase
      .from('visit_plans')
      .update({ plan_status: status })
      .eq('id', planId);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating visit plan status:', error);
    return null;
  }
};

// Get MR performance analytics
export const getMRPerformanceAnalytics = async (mrName, startDate, endDate) => {
  try {
    const { data, error } = await supabase
      .from('mr_visits')
      .select('*')
      .eq('mr_name', mrName)
      .gte('dcrDate', startDate)
      .lte('dcrDate', endDate)
      .order('dcrDate', { ascending: false });

    if (error) throw error;

    // Calculate analytics
    const analytics = {
      totalVisits: data.length,
      totalSales: data.reduce((sum, visit) => sum + (parseFloat(visit.amountOfSale) || 0), 0),
      avgSalesPerVisit: 0,
      uniqueCustomers: new Set(data.map(v => v.customer_phone)).size,
      conversionRate: 0,
      topAreas: {},
      monthlyTrend: {}
    };

    if (analytics.totalVisits > 0) {
      analytics.avgSalesPerVisit = analytics.totalSales / analytics.totalVisits;
      const salesVisits = data.filter(v => parseFloat(v.amountOfSale) > 0);
      analytics.conversionRate = (salesVisits.length / analytics.totalVisits) * 100;
    }

    // Top areas
    data.forEach(visit => {
      const area = visit.areaName || 'Unknown';
      analytics.topAreas[area] = (analytics.topAreas[area] || 0) + 1;
    });

    // Monthly trend
    data.forEach(visit => {
      const month = new Date(visit.dcrDate).toISOString().slice(0, 7);
      if (!analytics.monthlyTrend[month]) {
        analytics.monthlyTrend[month] = { visits: 0, sales: 0 };
      }
      analytics.monthlyTrend[month].visits += 1;
      analytics.monthlyTrend[month].sales += parseFloat(visit.amountOfSale) || 0;
    });

    return analytics;
  } catch (error) {
    console.error('Error getting MR performance analytics:', error);
    return null;
  }
};

// Export visit plan to different formats
export const exportVisitPlan = async (planId, format = 'csv') => {
  try {
    const planData = await fetchVisitPlanById(planId);
    if (!planData) return null;

    switch (format.toLowerCase()) {
      case 'csv':
        return exportVisitPlanToCSV(planData);
      case 'json':
        return JSON.stringify(planData, null, 2);
      default:
        return planData;
    }
  } catch (error) {
    console.error('Error exporting visit plan:', error);
    return null;
  }
};

// Helper function to export to CSV
const exportVisitPlanToCSV = (planData) => {
  const headers = [
    'Date', 'Day', 'Customer Name', 'Customer Type', 'Area', 
    'Scheduled Time', 'Expected Order Value', 'Priority', 'Phone'
  ];

  let csvContent = headers.join(',') + '\n';

  planData.daily_visit_plans.forEach(day => {
    day.planned_visits.forEach(visit => {
      const row = [
        day.visit_date,
        day.day_of_week,
        `"${visit.customer_name}"`,
        visit.customer_type || '',
        visit.area_name || '',
        visit.scheduled_time || '',
        visit.expected_order_value || 0,
        visit.priority_level || '',
        visit.customer_phone || ''
      ];
      csvContent += row.join(',') + '\n';
    });
  });

  return csvContent;
};

// Create area master data from existing visits
export const createAreaMasterFromVisits = async () => {
  try {
    // Get unique areas from visits
    const { data: areas, error } = await supabase
      .from('mr_visits')
      .select('areaName, cityName, pinCode')
      .not('areaName', 'is', null)
      .not('cityName', 'is', null);

    if (error) throw error;

    // Group and insert unique areas
    const uniqueAreas = new Map();
    areas.forEach(area => {
      const key = `${area.areaName}-${area.cityName}`;
      if (!uniqueAreas.has(key)) {
        uniqueAreas.set(key, {
          area_name: area.areaName,
          city: area.cityName,
          pin_code: area.pinCode
        });
      }
    });

    // Insert areas
    const { data: insertedAreas, error: insertError } = await supabase
      .from('area_master')
      .upsert(Array.from(uniqueAreas.values()), { 
        onConflict: 'area_name,city,state' 
      });

    if (insertError) throw insertError;
    return insertedAreas;
  } catch (error) {
    console.error('Error creating area master data:', error);
    return [];
  }
};

// Get visit plan statistics
export const getVisitPlanStatistics = async (mrName, year) => {
  try {
    const { data, error } = await supabase
      .from('visit_plans')
      .select('*')
      .eq('mr_name', mrName)
      .eq('plan_year', year);

    if (error) throw error;

    const stats = {
      totalPlans: data.length,
      totalVisits: data.reduce((sum, plan) => sum + (plan.total_planned_visits || 0), 0),
      totalRevenue: data.reduce((sum, plan) => sum + (parseFloat(plan.estimated_revenue) || 0), 0),
      avgEfficiency: 0,
      plansByStatus: {}
    };

    if (data.length > 0) {
      stats.avgEfficiency = data.reduce((sum, plan) => sum + (plan.efficiency_score || 0), 0) / data.length;
    }

    // Group by status
    data.forEach(plan => {
      const status = plan.plan_status || 'UNKNOWN';
      stats.plansByStatus[status] = (stats.plansByStatus[status] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error('Error getting visit plan statistics:', error);
    return null;
  }
};

// Customer location utilities
export const updateCustomerLocation = async (customerPhone, locationData) => {
  try {
    const { data, error } = await supabase
      .from('customer_locations')
      .upsert({
        customer_phone: customerPhone,
        ...locationData,
        updated_at: new Date().toISOString()
      }, { onConflict: 'customer_phone' });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating customer location:', error);
    return null;
  }
};

// Get territory coverage for MR
export const getMRTerritoryCoverage = async (mrName) => {
  try {
    const { data, error } = await supabase
      .from('mr_territories')
      .select(`
        *,
        area_master (*)
      `)
      .eq('mr_name', mrName)
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting MR territory coverage:', error);
    return [];
  }
};

// Analytics for route optimization
export const getRouteOptimizationAnalytics = async (mrName, month, year) => {
  try {
    const { data, error } = await supabase
      .from('planned_visits')
      .select(`
        *,
        daily_visit_plans!inner (
          visit_date,
          visit_plan_id,
          visit_plans!inner (
            mr_name,
            plan_month,
            plan_year
          )
        )
      `)
      .eq('daily_visit_plans.visit_plans.mr_name', mrName)
      .eq('daily_visit_plans.visit_plans.plan_month', month)
      .eq('daily_visit_plans.visit_plans.plan_year', year);

    if (error) throw error;

    // Calculate route analytics
    const analytics = {
      totalVisits: data.length,
      uniqueAreas: new Set(data.map(v => v.area_name)).size,
      avgVisitsPerArea: 0,
      timeDistribution: {},
      areaEfficiency: {}
    };

    if (analytics.uniqueAreas > 0) {
      analytics.avgVisitsPerArea = analytics.totalVisits / analytics.uniqueAreas;
    }

    // Time distribution
    data.forEach(visit => {
      if (visit.scheduled_time) {
        const hour = visit.scheduled_time.split(':')[0];
        analytics.timeDistribution[hour] = (analytics.timeDistribution[hour] || 0) + 1;
      }
    });

    // Area efficiency
    data.forEach(visit => {
      const area = visit.area_name || 'Unknown';
      if (!analytics.areaEfficiency[area]) {
        analytics.areaEfficiency[area] = { visits: 0, expectedRevenue: 0 };
      }
      analytics.areaEfficiency[area].visits += 1;
      analytics.areaEfficiency[area].expectedRevenue += parseFloat(visit.expected_order_value) || 0;
    });

    return analytics;
  } catch (error) {
    console.error('Error getting route optimization analytics:', error);
    return null;
  }
};
