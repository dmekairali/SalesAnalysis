// data.js - Enhanced with Pack Size Support (keeping your existing data)

// Your existing order data enhanced with pack sizes and MR mapping
export const sampleOrderData = [
  { 
    orderId: 'ORD001', date: '2024-01-15', mrId: 'MR001', mrName: 'Rajesh Kumar', customerId: 'CUST001', customerName: 'Dr. Ashok Gupta', customerType: 'Doctor', territory: 'Delhi North', city: 'Delhi', state: 'Delhi', netAmount: 1463, deliveredFrom: 'Factory', discountTier: 'Gold', deliveryStatus: 'Delivered', productId: 'PROD001', productName: 'Chyawanprash', category: 'Immunity', quantity: 5,
    // Enhanced fields for pack size support
    medicalRepresentative: 'Rajesh Kumar',
    salesRepresentative: 'Rajesh Kumar',
    orderItems: [
      {
        sku: 'PROD001-500G',
        medicineName: 'Chyawanprash',
        packSize: '500g',
        quantity: 5,
        unitPrice: 295,
        totalPrice: 1475,
        category: 'Immunity'
      }
    ]
  },
  { 
    orderId: 'ORD002', date: '2024-01-18', mrId: 'MR001', mrName: 'Rajesh Kumar', customerId: 'CUST005', customerName: 'Sharma Medical Store', customerType: 'Retailer', territory: 'Delhi North', city: 'Delhi', state: 'Delhi', netAmount: 2742, deliveredFrom: 'Distributor', discountTier: 'Platinum', deliveryStatus: 'Delivered', productId: 'PROD002', productName: 'Triphala Churna', category: 'Digestive', quantity: 12,
    medicalRepresentative: 'Rajesh Kumar',
    salesRepresentative: 'Rajesh Kumar',
    orderItems: [
      {
        sku: 'PROD002-100G',
        medicineName: 'Triphala Churna',
        packSize: '100g',
        quantity: 12,
        unitPrice: 85,
        totalPrice: 1020,
        category: 'Digestive'
      }
    ]
  },
  { 
    orderId: 'ORD003', date: '2024-02-03', mrId: 'MR002', mrName: 'Priya Singh', customerId: 'CUST001', customerName: 'Dr. Ashok Gupta', customerType: 'Doctor', territory: 'Delhi North', city: 'Delhi', state: 'Delhi', netAmount: 1824, deliveredFrom: 'Factory', discountTier: 'Gold', deliveryStatus: 'Delivered', productId: 'PROD003', productName: 'Ashwagandha Capsules', category: 'Stress Relief', quantity: 4,
    medicalRepresentative: 'Priya Singh',
    salesRepresentative: 'Priya Singh',
    orderItems: [
      {
        sku: 'PROD003-60CAP',
        medicineName: 'Ashwagandha Capsules',
        packSize: '60 Capsules',
        quantity: 4,
        unitPrice: 450,
        totalPrice: 1800,
        category: 'Stress Relief'
      }
    ]
  },
  { 
    orderId: 'ORD004', date: '2024-02-10', mrId: 'MR002', mrName: 'Priya Singh', customerId: 'CUST006', customerName: 'Apollo Pharmacy', customerType: 'Retailer', territory: 'Delhi South', city: 'Delhi', state: 'Delhi', netAmount: 3249, deliveredFrom: 'Distributor', discountTier: 'Diamond', deliveryStatus: 'Delivered', productId: 'PROD004', productName: 'Arjuna Tablets', category: 'Heart Care', quantity: 15,
    medicalRepresentative: 'Priya Singh',
    salesRepresentative: 'Priya Singh',
    orderItems: [
      {
        sku: 'PROD004-100TAB',
        medicineName: 'Arjuna Tablets',
        packSize: '100 Tablets',
        quantity: 15,
        unitPrice: 180,
        totalPrice: 2700,
        category: 'Heart Care'
      }
    ]
  },
  { 
    orderId: 'ORD005', date: '2024-02-20', mrId: 'MR005', mrName: 'Vikram Singh', customerId: 'CUST008', customerName: 'Dr. Mohan Lal Jain', customerType: 'Doctor', territory: 'Jaipur City', city: 'Jaipur', state: 'Rajasthan', netAmount: 1202, deliveredFrom: 'Factory', discountTier: 'Gold', deliveryStatus: 'Delivered', productId: 'PROD001', productName: 'Chyawanprash', category: 'Immunity', quantity: 3,
    medicalRepresentative: 'Vikram Singh',
    salesRepresentative: 'Vikram Singh',
    orderItems: [
      {
        sku: 'PROD001-250G',
        medicineName: 'Chyawanprash',
        packSize: '250g',
        quantity: 3,
        unitPrice: 150,
        totalPrice: 450,
        category: 'Immunity'
      }
    ]
  },
  { 
    orderId: 'ORD006', date: '2024-03-05', mrId: 'MR007', mrName: 'Rohit Agarwal', customerId: 'CUST001', customerName: 'Dr. Ashok Gupta', customerType: 'Doctor', territory: 'Delhi North', city: 'Delhi', state: 'Delhi', netAmount: 2193, deliveredFrom: 'Factory', discountTier: 'Gold', deliveryStatus: 'Delivered', productId: 'PROD005', productName: 'Brahmi Syrup', category: 'Brain Tonic', quantity: 6,
    medicalRepresentative: 'Rohit Agarwal',
    salesRepresentative: 'Rohit Agarwal',
    orderItems: [
      {
        sku: 'PROD005-200ML',
        medicineName: 'Brahmi Syrup',
        packSize: '200ml',
        quantity: 6,
        unitPrice: 125,
        totalPrice: 750,
        category: 'Brain Tonic'
      }
    ]
  },
  { 
    orderId: 'ORD007', date: '2024-03-12', mrId: 'MR003', mrName: 'Amit Verma', customerId: 'CUST003', customerName: 'Dr. Rakesh Sharma', customerType: 'Doctor', territory: 'Delhi East', city: 'Delhi', state: 'Delhi', netAmount: 812, deliveredFrom: 'Factory', discountTier: 'Gold', deliveryStatus: 'Delivered', productId: 'PROD006', productName: 'Neem Face Pack', category: 'Skin Care', quantity: 8,
    medicalRepresentative: 'Amit Verma',
    salesRepresentative: 'Amit Verma',
    orderItems: [
      {
        sku: 'PROD006-50G',
        medicineName: 'Neem Face Pack',
        packSize: '50g',
        quantity: 8,
        unitPrice: 65,
        totalPrice: 520,
        category: 'Skin Care'
      }
    ]
  },
  { 
    orderId: 'ORD008', date: '2024-03-25', mrId: 'MR008', mrName: 'Kavita Malhotra', customerId: 'CUST005', customerName: 'Sharma Medical Store', customerType: 'Retailer', territory: 'Delhi North', city: 'Delhi', state: 'Delhi', netAmount: 4255, deliveredFrom: 'Distributor', discountTier: 'Platinum', deliveryStatus: 'Delivered', productId: 'PROD007', productName: 'Tulsi Drops', category: 'Respiratory', quantity: 20,
    medicalRepresentative: 'Kavita Malhotra',
    salesRepresentative: 'Kavita Malhotra',
    orderItems: [
      {
        sku: 'PROD007-30ML',
        medicineName: 'Tulsi Drops',
        packSize: '30ml',
        quantity: 20,
        unitPrice: 95,
        totalPrice: 1900,
        category: 'Respiratory'
      }
    ]
  },
  { 
    orderId: 'ORD009', date: '2024-04-08', mrId: 'MR006', mrName: 'Meera Sharma', customerId: 'CUST009', customerName: 'Dr. Kavita Sharma', customerType: 'Doctor', territory: 'Jaipur Rural', city: 'Jaipur', state: 'Rajasthan', netAmount: 1579, deliveredFrom: 'Factory', discountTier: 'Silver', deliveryStatus: 'Delivered', productId: 'PROD008', productName: 'Giloy Juice', category: 'Immunity', quantity: 5,
    medicalRepresentative: 'Meera Sharma',
    salesRepresentative: 'Meera Sharma',
    orderItems: [
      {
        sku: 'PROD008-500ML',
        medicineName: 'Giloy Juice',
        packSize: '500ml',
        quantity: 5,
        unitPrice: 155,
        totalPrice: 775,
        category: 'Immunity'
      }
    ]
  },
  { 
    orderId: 'ORD010', date: '2024-04-20', mrId: 'MR004', mrName: 'Sunita Joshi', customerId: 'CUST007', customerName: 'Ayush Medical', customerType: 'Retailer', territory: 'Delhi West', city: 'Delhi', state: 'Delhi', netAmount: 3827, deliveredFrom: 'Distributor', discountTier: 'Diamond', deliveryStatus: 'Delivered', productId: 'PROD009', productName: 'Aloe Vera Gel', category: 'Skin Care', quantity: 18,
    medicalRepresentative: 'Sunita Joshi',
    salesRepresentative: 'Sunita Joshi',
    orderItems: [
      {
        sku: 'PROD009-150G',
        medicineName: 'Aloe Vera Gel',
        packSize: '150g',
        quantity: 18,
        unitPrice: 110,
        totalPrice: 1980,
        category: 'Skin Care'
      }
    ]
  },
  { 
    orderId: 'ORD011', date: '2024-05-05', mrId: 'MR001', mrName: 'Rajesh Kumar', customerId: 'CUST001', customerName: 'Dr. Ashok Gupta', customerType: 'Doctor', territory: 'Delhi North', city: 'Delhi', state: 'Delhi', netAmount: 1931, deliveredFrom: 'Factory', discountTier: 'Gold', deliveryStatus: 'Delivered', productId: 'PROD001', productName: 'Chyawanprash', category: 'Immunity', quantity: 4,
    medicalRepresentative: 'Rajesh Kumar',
    salesRepresentative: 'Rajesh Kumar',
    orderItems: [
      {
        sku: 'PROD001-500G',
        medicineName: 'Chyawanprash',
        packSize: '500g',
        quantity: 4,
        unitPrice: 295,
        totalPrice: 1180,
        category: 'Immunity'
      }
    ]
  },
  { 
    orderId: 'ORD012', date: '2024-05-18', mrId: 'MR005', mrName: 'Vikram Singh', customerId: 'CUST012', customerName: 'Jain Medical Hall', customerType: 'Retailer', territory: 'Jaipur City', city: 'Jaipur', state: 'Rajasthan', netAmount: 2428, deliveredFrom: 'Distributor', discountTier: 'Diamond', deliveryStatus: 'Delivered', productId: 'PROD010', productName: 'Amla Candy', category: 'Vitamin C', quantity: 25,
    medicalRepresentative: 'Vikram Singh',
    salesRepresentative: 'Vikram Singh',
    orderItems: [
      {
        sku: 'PROD010-200G',
        medicineName: 'Amla Candy',
        packSize: '200g',
        quantity: 25,
        unitPrice: 75,
        totalPrice: 1875,
        category: 'Vitamin C'
      }
    ]
  },
  { 
    orderId: 'ORD013', date: '2024-05-28', mrId: 'MR001', mrName: 'Rajesh Kumar', customerId: 'CUST005', customerName: 'Sharma Medical Store', customerType: 'Retailer', territory: 'Delhi North', city: 'Delhi', state: 'Delhi', netAmount: 5642, deliveredFrom: 'Distributor', discountTier: 'Platinum', deliveryStatus: 'In Transit', productId: 'PROD002', productName: 'Triphala Churna', category: 'Digestive', quantity: 30,
    medicalRepresentative: 'Rajesh Kumar',
    salesRepresentative: 'Rajesh Kumar',
    orderItems: [
      {
        sku: 'PROD002-100G',
        medicineName: 'Triphala Churna',
        packSize: '100g',
        quantity: 30,
        unitPrice: 85,
        totalPrice: 2550,
        category: 'Digestive'
      }
    ]
  },
  { 
    orderId: 'ORD014', date: '2024-06-02', mrId: 'MR003', mrName: 'Amit Verma', customerId: 'CUST015', customerName: 'New Delhi Clinic', customerType: 'Doctor', territory: 'Delhi East', city: 'Delhi', state: 'Delhi', netAmount: 1245, deliveredFrom: 'Factory', discountTier: 'Silver', deliveryStatus: 'Processing', productId: 'PROD003', productName: 'Ashwagandha Capsules', category: 'Stress Relief', quantity: 3,
    medicalRepresentative: 'Amit Verma',
    salesRepresentative: 'Amit Verma',
    orderItems: [
      {
        sku: 'PROD003-30CAP',
        medicineName: 'Ashwagandha Capsules',
        packSize: '30 Capsules',
        quantity: 3,
        unitPrice: 250,
        totalPrice: 750,
        category: 'Stress Relief'
      }
    ]
  }
];

// Enhanced Product Master Data with pack sizes
export const productMasterData = [
  // Chyawanprash variants
  { 
    Category: 'Immunity', 
    'Medicine Name': 'Chyawanprash', 
    MasterSku: 'PROD001', 
    Pack: '250g', 
    Sku: 'PROD001-250G', 
    Mrp: 150,
    productId: 'PROD001-250G',
    productName: 'Chyawanprash',
    category: 'Immunity',
    unitPrice: 150,
    seasonality: 'Winter Peak',
    competitor: 'Dabur',
    marketShare: 15
  },
  { 
    Category: 'Immunity', 
    'Medicine Name': 'Chyawanprash', 
    MasterSku: 'PROD001', 
    Pack: '500g', 
    Sku: 'PROD001-500G', 
    Mrp: 295,
    productId: 'PROD001-500G',
    productName: 'Chyawanprash',
    category: 'Immunity',
    unitPrice: 295,
    seasonality: 'Winter Peak',
    competitor: 'Dabur',
    marketShare: 15
  },
  
  // Triphala Churna variants
  { 
    Category: 'Digestive', 
    'Medicine Name': 'Triphala Churna', 
    MasterSku: 'PROD002', 
    Pack: '100g', 
    Sku: 'PROD002-100G', 
    Mrp: 85,
    productId: 'PROD002-100G',
    productName: 'Triphala Churna',
    category: 'Digestive',
    unitPrice: 85,
    seasonality: 'Year Round',
    competitor: 'Patanjali',
    marketShare: 22
  },
  { 
    Category: 'Digestive', 
    'Medicine Name': 'Triphala Churna', 
    MasterSku: 'PROD002', 
    Pack: '250g', 
    Sku: 'PROD002-250G', 
    Mrp: 190,
    productId: 'PROD002-250G',
    productName: 'Triphala Churna',
    category: 'Digestive',
    unitPrice: 190,
    seasonality: 'Year Round',
    competitor: 'Patanjali',
    marketShare: 22
  },

  // Ashwagandha Capsules variants
  { 
    Category: 'Stress Relief', 
    'Medicine Name': 'Ashwagandha Capsules', 
    MasterSku: 'PROD003', 
    Pack: '30 Capsules', 
    Sku: 'PROD003-30CAP', 
    Mrp: 250,
    productId: 'PROD003-30CAP',
    productName: 'Ashwagandha Capsules',
    category: 'Stress Relief',
    unitPrice: 250,
    seasonality: 'Monsoon Peak',
    competitor: 'Himalaya',
    marketShare: 18
  },
  { 
    Category: 'Stress Relief', 
    'Medicine Name': 'Ashwagandha Capsules', 
    MasterSku: 'PROD003', 
    Pack: '60 Capsules', 
    Sku: 'PROD003-60CAP', 
    Mrp: 450,
    productId: 'PROD003-60CAP',
    productName: 'Ashwagandha Capsules',
    category: 'Stress Relief',
    unitPrice: 450,
    seasonality: 'Monsoon Peak',
    competitor: 'Himalaya',
    marketShare: 18
  },

  // Single pack size products (keeping as is)
  { 
    Category: 'Heart Care', 
    'Medicine Name': 'Arjuna Tablets', 
    MasterSku: 'PROD004', 
    Pack: '100 Tablets', 
    Sku: 'PROD004-100TAB', 
    Mrp: 180,
    productId: 'PROD004',
    productName: 'Arjuna Tablets',
    category: 'Heart Care',
    unitPrice: 180,
    seasonality: 'Summer Peak',
    competitor: 'Baidyanath',
    marketShare: 12
  },
  { 
    Category: 'Brain Tonic', 
    'Medicine Name': 'Brahmi Syrup', 
    MasterSku: 'PROD005', 
    Pack: '200ml', 
    Sku: 'PROD005-200ML', 
    Mrp: 125,
    productId: 'PROD005',
    productName: 'Brahmi Syrup',
    category: 'Brain Tonic',
    unitPrice: 125,
    seasonality: 'Exam Season',
    competitor: 'Zandu',
    marketShare: 20
  },
  { 
    Category: 'Skin Care', 
    'Medicine Name': 'Neem Face Pack', 
    MasterSku: 'PROD006', 
    Pack: '50g', 
    Sku: 'PROD006-50G', 
    Mrp: 65,
    productId: 'PROD006',
    productName: 'Neem Face Pack',
    category: 'Skin Care',
    unitPrice: 65,
    seasonality: 'Summer Peak',
    competitor: 'Forest Essentials',
    marketShare: 8
  },
  { 
    Category: 'Respiratory', 
    'Medicine Name': 'Tulsi Drops', 
    MasterSku: 'PROD007', 
    Pack: '30ml', 
    Sku: 'PROD007-30ML', 
    Mrp: 95,
    productId: 'PROD007',
    productName: 'Tulsi Drops',
    category: 'Respiratory',
    unitPrice: 95,
    seasonality: 'Winter Peak',
    competitor: 'Organic India',
    marketShare: 14
  },
  { 
    Category: 'Immunity', 
    'Medicine Name': 'Giloy Juice', 
    MasterSku: 'PROD008', 
    Pack: '500ml', 
    Sku: 'PROD008-500ML', 
    Mrp: 155,
    productId: 'PROD008',
    productName: 'Giloy Juice',
    category: 'Immunity',
    unitPrice: 155,
    seasonality: 'Monsoon Peak',
    competitor: 'Kapiva',
    marketShare: 16
  },
  { 
    Category: 'Skin Care', 
    'Medicine Name': 'Aloe Vera Gel', 
    MasterSku: 'PROD009', 
    Pack: '150g', 
    Sku: 'PROD009-150G', 
    Mrp: 110,
    productId: 'PROD009',
    productName: 'Aloe Vera Gel',
    category: 'Skin Care',
    unitPrice: 110,
    seasonality: 'Summer Peak',
    competitor: 'Patanjali',
    marketShare: 25
  },
  { 
    Category: 'Vitamin C', 
    'Medicine Name': 'Amla Candy', 
    MasterSku: 'PROD010', 
    Pack: '200g', 
    Sku: 'PROD010-200G', 
    Mrp: 75,
    productId: 'PROD010',
    productName: 'Amla Candy',
    category: 'Vitamin C',
    unitPrice: 75,
    seasonality: 'Winter Peak',
    competitor: 'Dabur',
    marketShare: 19
  }
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

// Product transformation utilities
export const transformProductData = (productMasterData) => {
  // Individual products (each pack size separate)
  const individualProducts = productMasterData.map(item => ({
    productId: item.Sku || item.productId,
    productName: item['Medicine Name'] ? `${item['Medicine Name']} (${item.Pack})` : item.productName,
    medicineName: item['Medicine Name'] || item.productName,
    masterSku: item.MasterSku || item.productId,
    packSize: item.Pack || 'Standard',
    sku: item.Sku || item.productId,
    mrp: item.Mrp || item.unitPrice || 0,
    category: item.Category || item.category,
    unitPrice: item.unitPrice || item.Mrp || 0,
    seasonality: item.seasonality || 'Year Round',
    competitor: item.competitor || 'N/A',
    marketShare: item.marketShare || 0
  }));

  // Grouped by medicine
  const groupedByMedicine = individualProducts.reduce((acc, product) => {
    const medicineName = product.medicineName;
    const existingMedicine = acc.find(p => p.medicineName === medicineName);
    
    const packVariant = {
      pack: product.packSize,
      sku: product.sku,
      mrp: product.mrp
    };

    if (existingMedicine) {
      existingMedicine.packSizes.push(packVariant);
    } else {
      acc.push({
        productId: product.masterSku,
        medicineName: medicineName,
        masterSku: product.masterSku,
        category: product.category,
        packSizes: [packVariant]
      });
    }
    
    return acc;
  }, []);

  return { individualProducts, groupedByMedicine };
};

// Analytics functions for pack size analysis
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
            orderCount: 0
          };
        }
        packSizePerformance[packKey].totalQuantity += item.quantity;
        packSizePerformance[packKey].totalRevenue += item.totalPrice;
        packSizePerformance[packKey].orderCount += 1;

        // Medicine-wise analytics
        if (!medicinePerformance[item.medicineName]) {
          medicinePerformance[item.medicineName] = {
            medicineName: item.medicineName,
            totalQuantity: 0,
            totalRevenue: 0,
            orderCount: 0,
            packSizes: new Set()
          };
        }
        medicinePerformance[item.medicineName].totalQuantity += item.quantity;
        medicinePerformance[item.medicineName].totalRevenue += item.totalPrice;
        medicinePerformance[item.medicineName].orderCount += 1;
        medicinePerformance[item.medicineName].packSizes.add(item.packSize);
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
          orderCount: 0
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
