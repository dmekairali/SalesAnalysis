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
