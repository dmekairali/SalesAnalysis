// data.js - Updated for Supabase Integration
import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey)

// Fetch functions to replace your mock data
export const fetchOrderData = async () => {
  try {
    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .order('order_date', { ascending: false });
    
    if (error) throw error;
    
    // Transform to match your existing data structure
    return data.map(item => ({
      orderId: item.order_id,
      date: item.order_date,
      customerId: item.customer_code,
      customerName: item.customer_name,
      customerType: item.customer_type,
      territory: item.territory,
      city: item.city,
      state: item.state,
      netAmount: parseFloat(item.order_net_amount),
      deliveredFrom: item.delivered_from,
      discountTier: item.discount_tier,
      deliveryStatus: item.delivery_status,
      productName: item.product_description,
      category: item.category,
      quantity: item.quantity,
      medicalRepresentative: item.mr_name,
      salesRepresentative: item.mr_name,
      // Enhanced fields from new schema
      trackingNumber: item.tracking_number,
      courierPartner: item.courier_partner,
      paymentMode: item.payment_mode,
      paymentStatus: item.payment_status,
      // Order items with master product data
      orderItems: [{
        sku: item.sku,
        medicineName: item.product_description,
        packSize: item.size_display,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unit_price),
        totalPrice: parseFloat(item.line_total),
        category: item.category,
        master_code: item.master_code,
        variant_code: item.variant_code
      }],
      // For backward compatibility
      products: [item.product_description],
      master_code: item.master_code
    }));
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
};

export const fetchProductData = async () => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true);
    
    if (error) throw error;
    
    // Transform to match your existing productMasterData structure
    return data.map(product => ({
      Category: product.category,
      'Medicine Name': product.description,
      MasterSku: product.master_code,
      Pack: product.size_display,
      Sku: product.sku,
      Mrp: parseFloat(product.mrp),
      productId: product.sku,
      productName: `${product.description} (${product.size_display})`,
      category: product.category,
      unitPrice: parseFloat(product.mrp),
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
    console.error('Error fetching products:', error);
    return [];
  }
};

export const fetchCustomerData = async () => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('is_active', true);
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
};

export const fetchMRData = async () => {
  try {
    const { data, error } = await supabase
      .from('medical_representatives')
      .select('*')
      .eq('is_active', true);
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching MRs:', error);
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
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('order_date', { ascending: false });
    
    if (error) throw error;
    
    return data.map(order => ({
      orderId: order.order_id,
      date: order.order_date,
      customerName: order.customer_name,
      customerType: order.customer_type,
      city: order.city,
      state: order.state,
      territory: order.territory,
      medicalRepresentative: order.mr_name,
      netAmount: parseFloat(order.net_amount),
      deliveredFrom: order.delivered_from,
      discountTier: order.discount_tier,
      deliveryStatus: order.delivery_status,
      products: order.products ? order.products.split(', ') : [],
      categories: order.categories ? order.categories.split(', ') : [],
      totalQuantity: order.total_quantity,
      lineItemsCount: order.line_items_count
    }));
  } catch (error) {
    console.error('Error fetching dashboard orders:', error);
    return [];
  }
};

export const fetchProductSalesSummary = async () => {
  try {
    const { data, error } = await supabase
      .from('product_sales_summary')
      .select('*')
      .order('total_revenue', { ascending: false });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching product sales summary:', error);
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
