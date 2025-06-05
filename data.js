
// data.js - All sample data and constants

export const sampleOrderData = [
  { orderId: 'ORD001', date: '2024-01-15', mrId: 'MR001', mrName: 'Rajesh Kumar', customerId: 'CUST001', customerName: 'Dr. Ashok Gupta', customerType: 'Doctor', territory: 'Delhi North', city: 'Delhi', state: 'Delhi', netAmount: 1463, deliveredFrom: 'Factory', discountTier: 'Gold', deliveryStatus: 'Delivered', productId: 'PROD001', productName: 'Chyawanprash', category: 'Immunity', quantity: 5 },
  { orderId: 'ORD002', date: '2024-01-18', mrId: 'MR001', mrName: 'Rajesh Kumar', customerId: 'CUST005', customerName: 'Sharma Medical Store', customerType: 'Retailer', territory: 'Delhi North', city: 'Delhi', state: 'Delhi', netAmount: 2742, deliveredFrom: 'Distributor', discountTier: 'Platinum', deliveryStatus: 'Delivered', productId: 'PROD002', productName: 'Triphala Churna', category: 'Digestive', quantity: 12 },
  { orderId: 'ORD003', date: '2024-02-03', mrId: 'MR002', mrName: 'Priya Singh', customerId: 'CUST001', customerName: 'Dr. Ashok Gupta', customerType: 'Doctor', territory: 'Delhi North', city: 'Delhi', state: 'Delhi', netAmount: 1824, deliveredFrom: 'Factory', discountTier: 'Gold', deliveryStatus: 'Delivered', productId: 'PROD003', productName: 'Ashwagandha Capsules', category: 'Stress Relief', quantity: 4 },
  { orderId: 'ORD004', date: '2024-02-10', mrId: 'MR002', mrName: 'Priya Singh', customerId: 'CUST006', customerName: 'Apollo Pharmacy', customerType: 'Retailer', territory: 'Delhi South', city: 'Delhi', state: 'Delhi', netAmount: 3249, deliveredFrom: 'Distributor', discountTier: 'Diamond', deliveryStatus: 'Delivered', productId: 'PROD004', productName: 'Arjuna Tablets', category: 'Heart Care', quantity: 15 },
  { orderId: 'ORD005', date: '2024-02-20', mrId: 'MR005', mrName: 'Vikram Singh', customerId: 'CUST008', customerName: 'Dr. Mohan Lal Jain', customerType: 'Doctor', territory: 'Jaipur City', city: 'Jaipur', state: 'Rajasthan', netAmount: 1202, deliveredFrom: 'Factory', discountTier: 'Gold', deliveryStatus: 'Delivered', productId: 'PROD001', productName: 'Chyawanprash', category: 'Immunity', quantity: 3 },
  { orderId: 'ORD006', date: '2024-03-05', mrId: 'MR007', mrName: 'Rohit Agarwal', customerId: 'CUST001', customerName: 'Dr. Ashok Gupta', customerType: 'Doctor', territory: 'Delhi North', city: 'Delhi', state: 'Delhi', netAmount: 2193, deliveredFrom: 'Factory', discountTier: 'Gold', deliveryStatus: 'Delivered', productId: 'PROD005', productName: 'Brahmi Syrup', category: 'Brain Tonic', quantity: 6 },
  { orderId: 'ORD007', date: '2024-03-12', mrId: 'MR003', mrName: 'Amit Verma', customerId: 'CUST003', customerName: 'Dr. Rakesh Sharma', customerType: 'Doctor', territory: 'Delhi East', city: 'Delhi', state: 'Delhi', netAmount: 812, deliveredFrom: 'Factory', discountTier: 'Gold', deliveryStatus: 'Delivered', productId: 'PROD006', productName: 'Neem Face Pack', category: 'Skin Care', quantity: 8 },
  { orderId: 'ORD008', date: '2024-03-25', mrId: 'MR008', mrName: 'Kavita Malhotra', customerId: 'CUST005', customerName: 'Sharma Medical Store', customerType: 'Retailer', territory: 'Delhi North', city: 'Delhi', state: 'Delhi', netAmount: 4255, deliveredFrom: 'Distributor', discountTier: 'Platinum', deliveryStatus: 'Delivered', productId: 'PROD007', productName: 'Tulsi Drops', category: 'Respiratory', quantity: 20 },
  { orderId: 'ORD009', date: '2024-04-08', mrId: 'MR006', mrName: 'Meera Sharma', customerId: 'CUST009', customerName: 'Dr. Kavita Sharma', customerType: 'Doctor', territory: 'Jaipur Rural', city: 'Jaipur', state: 'Rajasthan', netAmount: 1579, deliveredFrom: 'Factory', discountTier: 'Silver', deliveryStatus: 'Delivered', productId: 'PROD008', productName: 'Giloy Juice', category: 'Immunity', quantity: 5 },
  { orderId: 'ORD010', date: '2024-04-20', mrId: 'MR004', mrName: 'Sunita Joshi', customerId: 'CUST007', customerName: 'Ayush Medical', customerType: 'Retailer', territory: 'Delhi West', city: 'Delhi', state: 'Delhi', netAmount: 3827, deliveredFrom: 'Distributor', discountTier: 'Diamond', deliveryStatus: 'Delivered', productId: 'PROD009', productName: 'Aloe Vera Gel', category: 'Skin Care', quantity: 18 },
  { orderId: 'ORD011', date: '2024-05-05', mrId: 'MR001', mrName: 'Rajesh Kumar', customerId: 'CUST001', customerName: 'Dr. Ashok Gupta', customerType: 'Doctor', territory: 'Delhi North', city: 'Delhi', state: 'Delhi', netAmount: 1931, deliveredFrom: 'Factory', discountTier: 'Gold', deliveryStatus: 'Delivered', productId: 'PROD001', productName: 'Chyawanprash', category: 'Immunity', quantity: 4 },
  { orderId: 'ORD012', date: '2024-05-18', mrId: 'MR005', mrName: 'Vikram Singh', customerId: 'CUST012', customerName: 'Jain Medical Hall', customerType: 'Retailer', territory: 'Jaipur City', city: 'Jaipur', state: 'Rajasthan', netAmount: 2428, deliveredFrom: 'Distributor', discountTier: 'Diamond', deliveryStatus: 'Delivered', productId: 'PROD010', productName: 'Amla Candy', category: 'Vitamin C', quantity: 25 },
  { orderId: 'ORD013', date: '2024-05-28', mrId: 'MR001', mrName: 'Rajesh Kumar', customerId: 'CUST005', customerName: 'Sharma Medical Store', customerType: 'Retailer', territory: 'Delhi North', city: 'Delhi', state: 'Delhi', netAmount: 5642, deliveredFrom: 'Distributor', discountTier: 'Platinum', deliveryStatus: 'In Transit', productId: 'PROD002', productName: 'Triphala Churna', category: 'Digestive', quantity: 30 },
  { orderId: 'ORD014', date: '2024-06-02', mrId: 'MR003', mrName: 'Amit Verma', customerId: 'CUST015', customerName: 'New Delhi Clinic', customerType: 'Doctor', territory: 'Delhi East', city: 'Delhi', state: 'Delhi', netAmount: 1245, deliveredFrom: 'Factory', discountTier: 'Silver', deliveryStatus: 'Processing', productId: 'PROD003', productName: 'Ashwagandha Capsules', category: 'Stress Relief', quantity: 3 }
];

export const productMasterData = [
  { productId: 'PROD001', productName: 'Chyawanprash', category: 'Immunity', unitPrice: 295, seasonality: 'Winter Peak', competitor: 'Dabur', marketShare: 15 },
  { productId: 'PROD002', productName: 'Triphala Churna', category: 'Digestive', unitPrice: 85, seasonality: 'Year Round', competitor: 'Patanjali', marketShare: 22 },
  { productId: 'PROD003', productName: 'Ashwagandha Capsules', category: 'Stress Relief', unitPrice: 450, seasonality: 'Monsoon Peak', competitor: 'Himalaya', marketShare: 18 },
  { productId: 'PROD004', productName: 'Arjuna Tablets', category: 'Heart Care', unitPrice: 180, seasonality: 'Summer Peak', competitor: 'Baidyanath', marketShare: 12 },
  { productId: 'PROD005', productName: 'Brahmi Syrup', category: 'Brain Tonic', unitPrice: 125, seasonality: 'Exam Season', competitor: 'Zandu', marketShare: 20 },
  { productId: 'PROD006', productName: 'Neem Face Pack', category: 'Skin Care', unitPrice: 65, seasonality: 'Summer Peak', competitor: 'Forest Essentials', marketShare: 8 },
  { productId: 'PROD007', productName: 'Tulsi Drops', category: 'Respiratory', unitPrice: 95, seasonality: 'Winter Peak', competitor: 'Organic India', marketShare: 14 },
  { productId: 'PROD008', productName: 'Giloy Juice', category: 'Immunity', unitPrice: 155, seasonality: 'Monsoon Peak', competitor: 'Kapiva', marketShare: 16 },
  { productId: 'PROD009', productName: 'Aloe Vera Gel', category: 'Skin Care', unitPrice: 110, seasonality: 'Summer Peak', competitor: 'Patanjali', marketShare: 25 },
  { productId: 'PROD010', productName: 'Amla Candy', category: 'Vitamin C', unitPrice: 75, seasonality: 'Winter Peak', competitor: 'Dabur', marketShare: 19 }
];

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

// Utility functions
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
