// data.js - Updated with Pack Size Support

// Enhanced Product Master Data (add this to your existing productMasterData)
export const enhancedProductMasterData = [
  {
    Category: "Classical Gulikas",
    "Medicine Name": "Manasamitram Gulika",
    MasterSku: "CGMMG",
    Pack: "100Pills",
    Sku: "CGMMG0100NP2201",
    Mrp: 240
  },
  {
    Category: "Classical Gulikas", 
    "Medicine Name": "Manasamitram Gulika",
    MasterSku: "CGMMG",
    Pack: "30Pills", 
    Sku: "CGMMG0030NP2201",
    Mrp: 120
  },
  {
    Category: "Churnas",
    "Medicine Name": "Ashwagandha Churna",
    MasterSku: "CHASH",
    Pack: "500g",
    Sku: "CHASH0500GP2201", 
    Mrp: 350
  },
  {
    Category: "Churnas",
    "Medicine Name": "Ashwagandha Churna", 
    MasterSku: "CHASH",
    Pack: "250g",
    Sku: "CHASH0250GP2201",
    Mrp: 200
  },
  // Add more products with pack sizes...
];

// Enhanced Sample Order Data (update your existing sampleOrderData)
export const enhancedSampleOrderData = [
  {
    orderId: "ORD001",
    date: "2024-03-15",
    customerName: "Dr. Rajesh Kumar",
    customerId: "CUST001",
    customerType: "Doctor",
    medicalRepresentative: "Amit Sharma",
    city: "Mumbai",
    state: "Maharashtra", 
    deliveredFrom: "Factory",
    deliveryStatus: "Delivered",
    netAmount: 480,
    // Enhanced: Multiple products with pack sizes
    orderItems: [
      {
        sku: "CGMMG0100NP2201",
        medicineName: "Manasamitram Gulika",
        packSize: "100Pills",
        quantity: 2,
        unitPrice: 240,
        totalPrice: 480,
        category: "Classical Gulikas"
      }
    ],
    // Legacy fields for backward compatibility
    productId: "CGMMG0100NP2201",
    productName: "Manasamitram Gulika (100Pills)",
    category: "Classical Gulikas"
  },
  {
    orderId: "ORD002", 
    date: "2024-03-14",
    customerName: "Wellness Pharmacy",
    customerId: "CUST002",
    customerType: "Pharmacy",
    medicalRepresentative: "Priya Singh",
    city: "Delhi",
    state: "Delhi",
    deliveredFrom: "Distributor", 
    deliveryStatus: "In Transit",
    netAmount: 670,
    // Multiple products in single order
    orderItems: [
      {
        sku: "CGMMG0030NP2201",
        medicineName: "Manasamitram Gulika", 
        packSize: "30Pills",
        quantity: 1,
        unitPrice: 120,
        totalPrice: 120,
        category: "Classical Gulikas"
      },
      {
        sku: "CHASH0500GP2201",
        medicineName: "Ashwagandha Churna",
        packSize: "500g", 
        quantity: 1,
        unitPrice: 350,
        totalPrice: 350,
        category: "Churnas"
      },
      {
        sku: "CHASH0250GP2201",
        medicineName: "Ashwagandha Churna",
        packSize: "250g",
        quantity: 1, 
        unitPrice: 200,
        totalPrice: 200,
        category: "Churnas"
      }
    ],
    // Legacy fields
    productId: "CGMMG0030NP2201",
    productName: "Manasamitram Gulika (30Pills)",
    category: "Classical Gulikas"
  }
  // Add more sample orders...
];

// Product transformation utilities
export const transformProductData = (productMasterData) => {
  // Individual products (each pack size separate)
  const individualProducts = productMasterData.map(item => ({
    productId: item.Sku,
    productName: `${item['Medicine Name']} (${item.Pack})`,
    medicineName: item['Medicine Name'],
    masterSku: item.MasterSku,
    packSize: item.Pack,
    sku: item.Sku,
    mrp: item.Mrp,
    category: item.Category
  }));

  // Grouped by medicine (for medicine-wise view)
  const groupedByMedicine = productMasterData.reduce((acc, item) => {
    const medicineName = item['Medicine Name'];
    const existingMedicine = acc.find(p => p.medicineName === medicineName);
    
    const packVariant = {
      pack: item.Pack,
      sku: item.Sku, 
      mrp: item.Mrp
    };

    if (existingMedicine) {
      existingMedicine.packSizes.push(packVariant);
    } else {
      acc.push({
        productId: item.MasterSku,
        medicineName: medicineName,
        masterSku: item.MasterSku,
        category: item.Category,
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
    if (order.orderItems) {
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
    }
  });

  // Convert Sets to Arrays
  Object.values(medicinePerformance).forEach(medicine => {
    medicine.packSizes = Array.from(medicine.packSizes);
  });

  return { packSizePerformance, medicinePerformance };
};

// Use enhanced data as default export
export { enhancedProductMasterData as productMasterData };
export { enhancedSampleOrderData as sampleOrderData };
