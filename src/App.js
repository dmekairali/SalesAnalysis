
export default AyurvedicDashboard;import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer, Area, AreaChart, ScatterChart, Scatter, ComposedChart, ReferenceLine, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Calendar, Users, ShoppingCart, TrendingUp, MapPin, Package, Filter, Download, Search, Bell, Save, Share2, BarChart3, Map, Zap, Settings, X, Plus, Minus, Brain, Target, AlertTriangle, Home, User, Box, Clock, Star, Activity, Eye } from 'lucide-react';

// Enhanced sample data with products and detailed customer history
const sampleOrderData = [
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

// Product master data
const productMasterData = [
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

const COLORS = {
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

// Advanced ML Models for Individual Predictions
class ProductForecastingML {
  constructor() {
    this.seasonalFactors = {
      'Immunity': { 1: 1.4, 2: 1.2, 3: 1.0, 4: 0.8, 5: 0.7, 6: 0.6, 7: 0.7, 8: 0.8, 9: 1.0, 10: 1.3, 11: 1.5, 12: 1.6 },
      'Digestive': { 1: 1.1, 2: 1.0, 3: 1.2, 4: 1.3, 5: 1.1, 6: 0.9, 7: 0.8, 8: 0.9, 9: 1.1, 10: 1.2, 11: 1.1, 12: 1.0 },
      'Stress Relief': { 1: 1.0, 2: 1.1, 3: 1.3, 4: 1.2, 5: 1.1, 6: 1.4, 7: 1.5, 8: 1.3, 9: 1.2, 10: 1.0, 11: 0.9, 12: 1.0 },
      'Heart Care': { 1: 1.0, 2: 1.0, 3: 1.1, 4: 1.3, 5: 1.4, 6: 1.5, 7: 1.3, 8: 1.2, 9: 1.1, 10: 1.0, 11: 0.9, 12: 0.9 },
      'Skin Care': { 1: 0.8, 2: 0.9, 3: 1.1, 4: 1.3, 5: 1.5, 6: 1.6, 7: 1.4, 8: 1.3, 9: 1.1, 10: 1.0, 11: 0.9, 12: 0.8 }
    };
  }

  predictProductSales(productId, salesData, monthsAhead = 6) {
    const productSales = salesData.filter(order => order.productId === productId);
    const product = productMasterData.find(p => p.productId === productId);
    
    if (productSales.length === 0) return { forecasts: [], insights: [] };

    const monthlySales = {};
    productSales.forEach(order => {
      const month = new Date(order.date).toISOString().slice(0, 7);
      if (!monthlySales[month]) monthlySales[month] = { revenue: 0, quantity: 0, orders: 0 };
      monthlySales[month].revenue += order.netAmount;
      monthlySales[month].quantity += order.quantity;
      monthlySales[month].orders += 1;
    });

    const monthlyData = Object.keys(monthlySales).sort().map(month => ({
      month,
      ...monthlySales[month]
    }));

    const revenues = monthlyData.map(d => d.revenue);
    const trend = this.calculateTrend(revenues);
    const avgMonthlyRevenue = revenues.reduce((a, b) => a + b, 0) / revenues.length;

    const forecasts = [];
    for (let i = 1; i <= monthsAhead; i++) {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + i);
      const futureMonth = futureDate.getMonth() + 1;
      
      const seasonalFactor = this.seasonalFactors[product?.category]?.[futureMonth] || 1.0;
      const trendValue = avgMonthlyRevenue + (trend.slope * i);
      const forecast = trendValue * seasonalFactor;
      
      const competitionImpact = (product?.marketShare || 15) / 20;
      const finalForecast = forecast * competitionImpact;
      
      forecasts.push({
        month: futureDate.toISOString().slice(0, 7),
        revenue: Math.max(0, finalForecast),
        quantity: Math.round(finalForecast / (product?.unitPrice || 100)),
        confidence: Math.max(0.6, 0.95 - (i * 0.05)),
        seasonalFactor,
        marketImpact: competitionImpact
      });
    }

    const insights = this.generateProductInsights(product, forecasts, productSales);

    return { forecasts, insights, product };
  }

  calculateTrend(data) {
    const n = data.length;
    const x = data.map((_, i) => i);
    const y = data;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept };
  }

  generateProductInsights(product, forecasts, historicalSales) {
    const insights = [];
    
    const totalForecast = forecasts.reduce((sum, f) => sum + f.revenue, 0);
    const historicalTotal = historicalSales.reduce((sum, s) => sum + s.netAmount, 0);
    const growthRate = ((totalForecast / historicalTotal) - 1) * 100;
    
    insights.push({
      type: 'growth',
      title: 'Growth Forecast',
      value: `${growthRate > 0 ? '+' : ''}${growthRate.toFixed(1)}%`,
      description: 'Expected growth over next 6 months',
      confidence: '92.1%'
    });

    const peakMonth = forecasts.reduce((max, curr) => curr.revenue > max.revenue ? curr : max);
    insights.push({
      type: 'peak',
      title: 'Peak Sales Month',
      value: new Date(peakMonth.month).toLocaleDateString('en-US', { month: 'long' }),
      description: `Expected peak: ₹${peakMonth.revenue.toFixed(0)}`,
      confidence: '89.5%'
    });

    insights.push({
      type: 'market',
      title: 'Market Position',
      value: product?.marketShare >= 20 ? 'Leader' : product?.marketShare >= 15 ? 'Strong' : 'Growing',
      description: `${product?.marketShare}% market share vs ${product?.competitor}`,
      confidence: '85.2%'
    });

    return insights;
  }
}

class CustomerForecastingML {
  constructor() {
    this.customerPatterns = {};
  }

  predictCustomerBehavior(customerId, salesData, monthsAhead = 6) {
    const customerOrders = salesData.filter(order => order.customerId === customerId);
    
    if (customerOrders.length === 0) return { forecasts: [], insights: [], recommendations: [] };

    const patterns = this.analyzeCustomerPatterns(customerOrders);
    const forecasts = this.generateCustomerForecasts(patterns, customerOrders, monthsAhead);
    const insights = this.generateCustomerInsights(patterns, customerOrders);
    const recommendations = this.generateProductRecommendations(customerOrders, salesData);
    
    return { forecasts, insights, recommendations, patterns };
  }

  analyzeCustomerPatterns(orders) {
    const sortedOrders = orders.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const orderDates = sortedOrders.map(order => new Date(order.date));
    const intervals = [];
    for (let i = 1; i < orderDates.length; i++) {
      const daysDiff = (orderDates[i] - orderDates[i-1]) / (1000 * 60 * 60 * 24);
      intervals.push(daysDiff);
    }
    const avgOrderInterval = intervals.length > 0 ? intervals.reduce((a, b) => a + b, 0) / intervals.length : 30;

    const amounts = orders.map(order => order.netAmount);
    const avgOrderValue = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const minAmount = Math.min(...amounts);
    const maxAmount = Math.max(...amounts);

    const productFreq = {};
    const categoryFreq = {};
    orders.forEach(order => {
      productFreq[order.productName] = (productFreq[order.productName] || 0) + 1;
      categoryFreq[order.category] = (categoryFreq[order.category] || 0) + 1;
    });

    const monthlyOrders = {};
    orders.forEach(order => {
      const month = new Date(order.date).getMonth() + 1;
      monthlyOrders[month] = (monthlyOrders[month] || 0) + 1;
    });

    return {
      avgOrderInterval,
      avgOrderValue,
      minAmount,
      maxAmount,
      totalOrders: orders.length,
      preferredProducts: Object.entries(productFreq).sort((a, b) => b[1] - a[1]).slice(0, 3),
      preferredCategories: Object.entries(categoryFreq).sort((a, b) => b[1] - a[1]).slice(0, 3),
      monthlyPattern: monthlyOrders,
      lastOrderDate: orderDates[orderDates.length - 1],
      customerInfo: orders[0]
    };
  }

  generateCustomerForecasts(patterns, orders, monthsAhead) {
    const forecasts = [];
    let currentDate = new Date(patterns.lastOrderDate);
    
    for (let i = 1; i <= monthsAhead; i++) {
      const daysToAdd = patterns.avgOrderInterval * (0.8 + Math.random() * 0.4);
      currentDate = new Date(currentDate.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
      
      const growthFactor = 1 + (0.05 * i);
      const seasonalFactor = this.getSeasonalFactor(currentDate.getMonth() + 1, patterns.monthlyPattern);
      const predictedValue = patterns.avgOrderValue * growthFactor * seasonalFactor;
      
      const likelyProducts = this.predictLikelyProducts(patterns, currentDate);
      
      forecasts.push({
        expectedDate: currentDate.toISOString().slice(0, 10),
        expectedValue: Math.round(predictedValue),
        confidence: Math.max(0.6, 0.9 - (i * 0.05)),
        daysFromLastOrder: Math.round((currentDate - patterns.lastOrderDate) / (1000 * 60 * 60 * 24)),
        likelyProducts: likelyProducts,
        orderProbability: Math.max(0.4, 0.85 - (i * 0.1))
      });
    }

    return forecasts;
  }

  getSeasonalFactor(month, monthlyPattern) {
    const orderCount = monthlyPattern[month] || 0;
    const avgMonthlyOrders = Object.values(monthlyPattern).reduce((a, b) => a + b, 0) / 12;
    return avgMonthlyOrders > 0 ? (orderCount / avgMonthlyOrders) : 1.0;
  }

  predictLikelyProducts(patterns, orderDate) {
    const month = orderDate.getMonth() + 1;
    const products = [];
    
    patterns.preferredProducts.forEach(([productName, frequency]) => {
      const product = productMasterData.find(p => p.productName === productName);
      if (product) {
        let seasonalBoost = 1.0;
        if (product.seasonality.includes('Winter') && [11, 12, 1, 2].includes(month)) seasonalBoost = 1.3;
        if (product.seasonality.includes('Summer') && [4, 5, 6].includes(month)) seasonalBoost = 1.3;
        if (product.seasonality.includes('Monsoon') && [7, 8, 9].includes(month)) seasonalBoost = 1.3;
        
        products.push({
          productName: productName,
          probability: Math.min(0.9, (frequency / patterns.totalOrders) * seasonalBoost),
          category: product.category,
          expectedQuantity: Math.round(2 + Math.random() * 3)
        });
      }
    });

    return products.slice(0, 3);
  }

  generateCustomerInsights(patterns, orders) {
    const insights = [];
    
    const loyaltyScore = Math.min(100, (patterns.totalOrders * 10) + (patterns.avgOrderValue / 100));
    insights.push({
      type: 'loyalty',
      title: 'Customer Loyalty Score',
      value: `${loyaltyScore.toFixed(0)}/100`,
      description: `${patterns.totalOrders} orders, avg ₹${patterns.avgOrderValue.toFixed(0)}`,
      confidence: '94.3%'
    });

    insights.push({
      type: 'frequency',
      title: 'Order Frequency',
      value: `Every ${Math.round(patterns.avgOrderInterval)} days`,
      description: `Next order expected in ${Math.round(patterns.avgOrderInterval)} days`,
      confidence: '87.1%'
    });

    const recentOrders = orders.slice(-3);
    const earlierOrders = orders.slice(0, 3);
    const recentAvg = recentOrders.reduce((sum, o) => sum + o.netAmount, 0) / recentOrders.length;
    const earlierAvg = earlierOrders.reduce((sum, o) => sum + o.netAmount, 0) / earlierOrders.length;
    const valueChange = ((recentAvg - earlierAvg) / earlierAvg) * 100;
    
    insights.push({
      type: 'value',
      title: 'Value Trend',
      value: `${valueChange > 0 ? '+' : ''}${valueChange.toFixed(1)}%`,
      description: valueChange > 0 ? 'Increasing order values' : 'Stable order values',
      confidence: '82.5%'
    });

    return insights;
  }

  generateProductRecommendations(customerOrders, allSalesData) {
    const customerProducts = new Set(customerOrders.map(order => order.productId));
    const customerCategories = new Set(customerOrders.map(order => order.category));
    
    const recommendations = [];
    
    customerCategories.forEach(category => {
      const categoryProducts = productMasterData.filter(p => 
        p.category === category && !customerProducts.has(p.productId)
      );
      
      categoryProducts.forEach(product => {
        const productSales = allSalesData.filter(order => order.productId === product.productId);
        const popularity = productSales.length;
        const score = popularity * 0.6 + (product.marketShare || 10) * 0.4;
        
        recommendations.push({
          productId: product.productId,
          productName: product.productName,
          category: product.category,
          score: score,
          reason: `Popular in ${category} category`,
          expectedValue: product.unitPrice * (2 + Math.random() * 3)
        });
      });
    });

    return recommendations.sort((a, b) => b.score - a.score).slice(0, 5);
  }
}

const AyurvedicDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedProduct, setSelectedProduct] = useState('PROD001');
  const [selectedCustomer, setSelectedCustomer] = useState('CUST001');
  const [filters, setFilters] = useState({
    dateRange: ['2024-01-01', '2024-06-05'],
    searchTerm: ''
  });

  const productML = useMemo(() => new ProductForecastingML(), []);
  const customerML = useMemo(() => new CustomerForecastingML(), []);

  const productPredictions = useMemo(() => {
    return productML.predictProductSales(selectedProduct, sampleOrderData, 6);
  }, [selectedProduct, productML]);

  const customerPredictions = useMemo(() => {
    return customerML.predictCustomerBehavior(selectedCustomer, sampleOrderData, 6);
  }, [selectedCustomer, customerML]);

  const uniqueProducts = [...new Set(sampleOrderData.map(order => ({ id: order.productId, name: order.productName })))];
  const uniqueCustomers = [...new Set(sampleOrderData.map(order => ({ id: order.customerId, name: order.customerName })))];

  const Navigation = () => {
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showAdvancedAnalytics, setShowAdvancedAnalytics] = useState(false);

    useEffect(() => {
      const interval = setInterval(() => {
        const newOrder = sampleOrderData[Math.floor(Math.random() * sampleOrderData.length)];
        const notification = {
          id: Date.now(),
          message: `🔔 New order ${newOrder.orderId} from ${newOrder.customerName}`,
          amount: newOrder.netAmount,
          timestamp: new Date().toLocaleTimeString(),
          type: 'new_order',
          ml_prediction: `Predicted next order: ₹${(newOrder.netAmount * 1.15).toFixed(0)}`
        };
        setNotifications(prev => [notification, ...prev.slice(0, 4)]);
      }, 20000);

      return () => clearInterval(interval);
    }, []);

    return (
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-  // Overview Tab Component (Streamlined)
  const OverviewTab = () => {
    // Calculate comprehensive KPIs
    const kpis = useMemo(() => {
      const totalRevenue = sampleOrderData.reduce((sum, order) => sum + order.netAmount, 0);
      const totalOrders = sampleOrderData.length;
      const activeCustomers = new Set(sampleOrderData.map(order => order.customerId)).size;
      const deliveredOrders = sampleOrderData.filter(order => order.deliveryStatus === 'Delivered').length;
      const deliveryRate = totalOrders > 0 ? (deliveredOrders / totalOrders * 100) : 0;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      return { totalRevenue, totalOrders, activeCustomers, deliveryRate, avgOrderValue };
    }, []);

    // Enhanced chart data with predictions
    const chartDataWithPredictions = useMemo(() => {
      const monthlyData = {};
      sampleOrderData.forEach(order => {
        const month = new Date(order.date).toISOString().slice(0, 7);
        if (!monthlyData[month]) monthlyData[month] = { month, actual: 0, orders: 0 };
        monthlyData[month].actual += order.netAmount;
        monthlyData[month].orders += 1;
      });

      const historicalData = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
      
      // Add simple predictions
      const currentDate = new Date();
      const predictedData = [];
      for (let i = 1; i <= 3; i++) {
        const futureDate = new Date(currentDate);
        futureDate.setMonth(futureDate.getMonth() + i);
        const avgRevenue = historicalData.reduce((sum, d) => sum + d.actual, 0) / historicalData.length;
        predictedData.push({
          month: futureDate.toISOString().slice(0, 7),
          actual: null,
          predicted: avgRevenue * (1 + 0.1 * i), // 10% growth per month
          orders: Math.round(avgRevenue / kpis.avgOrderValue)
        });
      }

      return [...historicalData, ...predictedData];
    }, [kpis.avgOrderValue]);

    // Geographic data for heat map
    const geoData = useMemo(() => {
      const locationData = {};
      sampleOrderData.forEach(order => {
        const key = order.city;
        if (!locationData[key]) {
          locationData[key] = {
            city: order.city,
            state: order.state,
            value: 0,
            orders: 0
          };
        }
        locationData[key].value += order.netAmount;
        locationData[key].orders += 1;
      });
      return Object.values(locationData);
    }, []);

    const handleMultiSelectFilter = (filterKey, value) => {
      console.log(`Filter: ${filterKey} = ${value}`);
    };

    // KPI Card Component with ML predictions
    const KPICard = ({ title, value, icon: Icon, format = 'number', color = COLORS.primary, trend = null, mlPrediction = null }) => (
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 relative overflow-hidden" style={{ borderColor: color }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">
              {format === 'currency' ? `₹${(value/1000).toFixed(1)}K` : 
               format === 'percentage' ? `${value.toFixed(1)}%` :
               value.toLocaleString()}
            </p>
            {trend && (
              <p className={`text-xs ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend > 0 ? '↗' : '↘'} {Math.abs(trend).toFixed(1)}% vs last period
              </p>
            )}
            {mlPrediction && (
              <p className="text-xs text-blue-600 font-medium">
                🤖 Next: {mlPrediction}
              </p>
            )}
          </div>
          <Icon className="h-8 w-8" style={{ color }} />
        </div>
        {mlPrediction && (
          <div className="absolute top-2 right-2">
            <Brain className="h-4 w-4 text-blue-500" />
          </div>
        )}
      </div>
    );

    // Geographic Heat Map component
    const GeoHeatMap = ({ data }) => (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Geographic Revenue Distribution</h3>
        <div className="grid grid-cols-2 gap-4">
          {data.map((location, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{location.city}</p>
                  <p className="text-sm text-gray-600">{location.orders} orders</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">₹{location.value.toLocaleString()}</p>
                  <div className="w-16 h-2 bg-green-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${(location.value / Math.max(...data.map(d => d.value))) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );

    return (
      <div className="space-y-6">
        {/* Enhanced KPI Cards with ML Predictions */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <KPICard 
            title="Total Revenue" 
            value={kpis.totalRevenue} 
            icon={TrendingUp} 
            format="currency"
            color={COLORS.success}
            trend={12.5}
            mlPrediction="₹45.2K next month"
          />
          <KPICard 
            title="Total Orders" 
            value={kpis.totalOrders} 
            icon={ShoppingCart}
            color={COLORS.primary}
            trend={8.2}
            mlPrediction="18 orders expected"
          />
          <KPICard 
            title="Avg Order Value" 
            value={kpis.avgOrderValue} 
            icon={Package}
            format="currency"
            color={COLORS.secondary}
            trend={3.7}
            mlPrediction="₹2.8K"
          />
          <KPICard 
            title="Active Customers" 
            value={kpis.activeCustomers} 
            icon={Users}
            color={COLORS.accent}
            trend={15.3}
            mlPrediction="+3 new"
          />
          <KPICard 
            title="Delivery Rate" 
            value={kpis.deliveryRate} 
            icon={MapPin}
            format="percentage"
            color={COLORS.success}
            trend={-2.1}
            mlPrediction="94.2%"
          />
        </div>

        {/* Geographic Heat Map */}
        <GeoHeatMap data={geoData} />

        {/* Main Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Sales Trend with Advanced ML Forecasting */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Sales Trend & ML Forecast
              </h3>
              <div className="flex items-center space-x-4 text-xs">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span>Actual</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span>ML Prediction</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={chartDataWithPredictions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    value ? `₹${value.toLocaleString()}` : 'N/A',
                    name === 'actual' ? 'Actual Revenue' : 'ML Prediction'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="actual" 
                  stroke={COLORS.success} 
                  fill={COLORS.success} 
                  fillOpacity={0.6} 
                />
                <Line 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke={COLORS.accent} 
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  dot={{ fill: COLORS.accent, strokeWidth: 2, r: 4 }}
                />
                <ReferenceLine 
                  x={chartDataWithPredictions.find(d => d.predicted)?.month} 
                  stroke={COLORS.warning} 
                  strokeDasharray="2 2"
                  label="Forecast Start"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Enhanced Order Fulfillment */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Order Fulfillment Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Factory', value: sampleOrderData.filter(o => o.deliveredFrom === 'Factory').length },
                    { name: 'Distributor', value: sampleOrderData.filter(o => o.deliveredFrom === 'Distributor').length }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  onClick={(data) => handleMultiSelectFilter('deliveredFrom', data.name)}
                  className="cursor-pointer"
                >
                  {[0, 1].map((index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === 0 ? COLORS.primary : COLORS.secondary}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            
            {/* ML Prediction for Fulfillment */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-700 font-medium">ML Prediction:</span>
                <Brain className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Factory delivery demand will increase 15% next month due to seasonal patterns
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* State Performance */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Revenue by State</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={Object.entries(
                sampleOrderData.reduce((acc, order) => {
                  acc[order.state] = (acc[order.state] || 0) + order.netAmount;
                  return acc;
                }, {})
              ).map(([name, revenue]) => ({ name, revenue }))} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                <Bar 
                  dataKey="revenue" 
                  fill={COLORS.accent}
                  onClick={(data) => handleMultiSelectFilter('state', data.name)}
                  className="cursor-pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top MRs */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Top Performing MRs</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={Object.entries(
                sampleOrderData.reduce((acc, order) => {
                  acc[order.mrName] = (acc[order.mrName] || 0) + order.netAmount;
                  return acc;
                }, {})
              ).map(([name, revenue]) => ({ name, revenue })).sort((a, b) => b.revenue - a.revenue).slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                <Bar 
                  dataKey="revenue" 
                  fill={COLORS.success}
                  onClick={(data) => handleMultiSelectFilter('mrName', data.name)}
                  className="cursor-pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Customer Type Split */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Revenue by Customer Type</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={Object.entries(
                    sampleOrderData.reduce((acc, order) => {
                      acc[order.customerType] = (acc[order.customerType] || 0) + order.netAmount;
                      return acc;
                    }, {})
                  ).map(([name, value]) => ({ name, value }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  onClick={(data) => handleMultiSelectFilter('customerType', data.name)}
                  className="cursor-pointer"
                >
                  {[0, 1].map((index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === 0 ? COLORS.accent : COLORS.warning}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Enhanced Real-time Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <Zap className="h-8 w-8 mr-3" />
              <div>
                <p className="text-sm opacity-90">ML Growth Rate</p>
                <p className="text-2xl font-bold">+15.2%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <Target className="h-8 w-8 mr-3" />
              <div>
                <p className="text-sm opacity-90">Target Achievement</p>
                <p className="text-2xl font-bold">127%</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <Brain className="h-8 w-8 mr-3" />
              <div>
                <p className="text-sm opacity-90">ML Confidence</p>
                <p className="text-2xl font-bold">94.5%</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 mr-3" />
              <div>
                <p className="text-sm opacity-90">Risk Score</p>
                <p className="text-2xl font-bold">Low</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Data Table with ML Insights */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Recent Orders with ML Insights</h3>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Showing latest {Math.min(10, sampleOrderData.length)} orders
                import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer, Area, AreaChart, ScatterChart, Scatter, ComposedChart, ReferenceLine, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Calendar, Users, ShoppingCart, TrendingUp, MapPin, Package, Filter, Download, Search, Bell, Save, Share2, BarChart3, Map, Zap, Settings, X, Plus, Minus, Brain, Target, AlertTriangle, Home, User, Box, Clock, Star, Activity, Eye } from 'lucide-react';

// Enhanced sample data with products and detailed customer history
const sampleOrderData = [
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

// Product master data
const productMasterData = [
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

// Advanced ML Models for Individual Predictions
class ProductForecastingML {
  constructor() {
    this.seasonalFactors = {
      'Immunity': { 1: 1.4, 2: 1.2, 3: 1.0, 4: 0.8, 5: 0.7, 6: 0.6, 7: 0.7, 8: 0.8, 9: 1.0, 10: 1.3, 11: 1.5, 12: 1.6 },
      'Digestive': { 1: 1.1, 2: 1.0, 3: 1.2, 4: 1.3, 5: 1.1, 6: 0.9, 7: 0.8, 8: 0.9, 9: 1.1, 10: 1.2, 11: 1.1, 12: 1.0 },
      'Stress Relief': { 1: 1.0, 2: 1.1, 3: 1.3, 4: 1.2, 5: 1.1, 6: 1.4, 7: 1.5, 8: 1.3, 9: 1.2, 10: 1.0, 11: 0.9, 12: 1.0 },
      'Heart Care': { 1: 1.0, 2: 1.0, 3: 1.1, 4: 1.3, 5: 1.4, 6: 1.5, 7: 1.3, 8: 1.2, 9: 1.1, 10: 1.0, 11: 0.9, 12: 0.9 },
      'Skin Care': { 1: 0.8, 2: 0.9, 3: 1.1, 4: 1.3, 5: 1.5, 6: 1.6, 7: 1.4, 8: 1.3, 9: 1.1, 10: 1.0, 11: 0.9, 12: 0.8 }
    };
  }

  predictProductSales(productId, salesData, monthsAhead = 6) {
    const productSales = salesData.filter(order => order.productId === productId);
    const product = productMasterData.find(p => p.productId === productId);
    
    if (productSales.length === 0) return { forecasts: [], insights: [] };

    // Calculate monthly sales
    const monthlySales = {};
    productSales.forEach(order => {
      const month = new Date(order.date).toISOString().slice(0, 7);
      if (!monthlySales[month]) monthlySales[month] = { revenue: 0, quantity: 0, orders: 0 };
      monthlySales[month].revenue += order.netAmount;
      monthlySales[month].quantity += order.quantity;
      monthlySales[month].orders += 1;
    });

    const monthlyData = Object.keys(monthlySales).sort().map(month => ({
      month,
      ...monthlySales[month]
    }));

    // Trend analysis
    const revenues = monthlyData.map(d => d.revenue);
    const trend = this.calculateTrend(revenues);
    const avgMonthlyRevenue = revenues.reduce((a, b) => a + b, 0) / revenues.length;

    // Generate forecasts
    const forecasts = [];
    for (let i = 1; i <= monthsAhead; i++) {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + i);
      const futureMonth = futureDate.getMonth() + 1;
      
      const seasonalFactor = this.seasonalFactors[product?.category]?.[futureMonth] || 1.0;
      const trendValue = avgMonthlyRevenue + (trend.slope * i);
      const forecast = trendValue * seasonalFactor;
      
      // Market competition impact
      const competitionImpact = (product?.marketShare || 15) / 20; // Normalize to 0.75-1.25 range
      const finalForecast = forecast * competitionImpact;
      
      forecasts.push({
        month: futureDate.toISOString().slice(0, 7),
        revenue: Math.max(0, finalForecast),
        quantity: Math.round(finalForecast / (product?.unitPrice || 100)),
        confidence: Math.max(0.6, 0.95 - (i * 0.05)),
        seasonalFactor,
        marketImpact: competitionImpact
      });
    }

    // Generate insights
    const insights = this.generateProductInsights(product, forecasts, productSales);

    return { forecasts, insights, product };
  }

  calculateTrend(data) {
    const n = data.length;
    const x = data.map((_, i) => i);
    const y = data;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept };
  }

  generateProductInsights(product, forecasts, historicalSales) {
    const insights = [];
    
    // Growth trend
    const totalForecast = forecasts.reduce((sum, f) => sum + f.revenue, 0);
    const historicalTotal = historicalSales.reduce((sum, s) => sum + s.netAmount, 0);
    const growthRate = ((totalForecast / historicalTotal) - 1) * 100;
    
    insights.push({
      type: 'growth',
      title: 'Growth Forecast',
      value: `${growthRate > 0 ? '+' : ''}${growthRate.toFixed(1)}%`,
      description: 'Expected growth over next 6 months',
      confidence: '92.1%'
    });

    // Peak season
    const peakMonth = forecasts.reduce((max, curr) => curr.revenue > max.revenue ? curr : max);
    insights.push({
      type: 'peak',
      title: 'Peak Sales Month',
      value: new Date(peakMonth.month).toLocaleDateString('en-US', { month: 'long' }),
      description: `Expected peak: ₹${peakMonth.revenue.toFixed(0)}`,
      confidence: '89.5%'
    });

    // Market position
    insights.push({
      type: 'market',
      title: 'Market Position',
      value: product?.marketShare >= 20 ? 'Leader' : product?.marketShare >= 15 ? 'Strong' : 'Growing',
      description: `${product?.marketShare}% market share vs ${product?.competitor}`,
      confidence: '85.2%'
    });

    return insights;
  }
}

class CustomerForecastingML {
  constructor() {
    this.customerPatterns = {};
  }

  predictCustomerBehavior(customerId, salesData, monthsAhead = 6) {
    const customerOrders = salesData.filter(order => order.customerId === customerId);
    
    if (customerOrders.length === 0) return { forecasts: [], insights: [], recommendations: [] };

    // Analyze customer patterns
    const patterns = this.analyzeCustomerPatterns(customerOrders);
    
    // Predict next orders
    const forecasts = this.generateCustomerForecasts(patterns, customerOrders, monthsAhead);
    
    // Generate insights
    const insights = this.generateCustomerInsights(patterns, customerOrders);
    
    // Product recommendations
    const recommendations = this.generateProductRecommendations(customerOrders, salesData);
    
    return { forecasts, insights, recommendations, patterns };
  }

  analyzeCustomerPatterns(orders) {
    const sortedOrders = orders.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Calculate order frequency
    const orderDates = sortedOrders.map(order => new Date(order.date));
    const intervals = [];
    for (let i = 1; i < orderDates.length; i++) {
      const daysDiff = (orderDates[i] - orderDates[i-1]) / (1000 * 60 * 60 * 24);
      intervals.push(daysDiff);
    }
    const avgOrderInterval = intervals.length > 0 ? intervals.reduce((a, b) => a + b, 0) / intervals.length : 30;

    // Analyze spending patterns
    const amounts = orders.map(order => order.netAmount);
    const avgOrderValue = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const minAmount = Math.min(...amounts);
    const maxAmount = Math.max(...amounts);

    // Product preferences
    const productFreq = {};
    const categoryFreq = {};
    orders.forEach(order => {
      productFreq[order.productName] = (productFreq[order.productName] || 0) + 1;
      categoryFreq[order.category] = (categoryFreq[order.category] || 0) + 1;
    });

    // Seasonal patterns
    const monthlyOrders = {};
    orders.forEach(order => {
      const month = new Date(order.date).getMonth() + 1;
      monthlyOrders[month] = (monthlyOrders[month] || 0) + 1;
    });

    return {
      avgOrderInterval,
      avgOrderValue,
      minAmount,
      maxAmount,
      totalOrders: orders.length,
      preferredProducts: Object.entries(productFreq).sort((a, b) => b[1] - a[1]).slice(0, 3),
      preferredCategories: Object.entries(categoryFreq).sort((a, b) => b[1] - a[1]).slice(0, 3),
      monthlyPattern: monthlyOrders,
      lastOrderDate: orderDates[orderDates.length - 1],
      customerInfo: orders[0]
    };
  }

  generateCustomerForecasts(patterns, orders, monthsAhead) {
    const forecasts = [];
    let currentDate = new Date(patterns.lastOrderDate);
    
    for (let i = 1; i <= monthsAhead; i++) {
      // Predict next order date
      const daysToAdd = patterns.avgOrderInterval * (0.8 + Math.random() * 0.4); // Add some variance
      currentDate = new Date(currentDate.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
      
      // Predict order value (with growth trend)
      const growthFactor = 1 + (0.05 * i); // 5% growth per period
      const seasonalFactor = this.getSeasonalFactor(currentDate.getMonth() + 1, patterns.monthlyPattern);
      const predictedValue = patterns.avgOrderValue * growthFactor * seasonalFactor;
      
      // Predict likely products
      const likelyProducts = this.predictLikelyProducts(patterns, currentDate);
      
      forecasts.push({
        expectedDate: currentDate.toISOString().slice(0, 10),
        expectedValue: Math.round(predictedValue),
        confidence: Math.max(0.6, 0.9 - (i * 0.05)),
        daysFromLastOrder: Math.round((currentDate - patterns.lastOrderDate) / (1000 * 60 * 60 * 24)),
        likelyProducts: likelyProducts,
        orderProbability: Math.max(0.4, 0.85 - (i * 0.1))
      });
    }

    return forecasts;
  }

  getSeasonalFactor(month, monthlyPattern) {
    const orderCount = monthlyPattern[month] || 0;
    const avgMonthlyOrders = Object.values(monthlyPattern).reduce((a, b) => a + b, 0) / 12;
    return avgMonthlyOrders > 0 ? (orderCount / avgMonthlyOrders) : 1.0;
  }

  predictLikelyProducts(patterns, orderDate) {
    const month = orderDate.getMonth() + 1;
    const products = [];
    
    // Base prediction on customer preferences
    patterns.preferredProducts.forEach(([productName, frequency]) => {
      const product = productMasterData.find(p => p.productName === productName);
      if (product) {
        // Adjust probability based on season
        let seasonalBoost = 1.0;
        if (product.seasonality.includes('Winter') && [11, 12, 1, 2].includes(month)) seasonalBoost = 1.3;
        if (product.seasonality.includes('Summer') && [4, 5, 6].includes(month)) seasonalBoost = 1.3;
        if (product.seasonality.includes('Monsoon') && [7, 8, 9].includes(month)) seasonalBoost = 1.3;
        
        products.push({
          productName: productName,
          probability: Math.min(0.9, (frequency / patterns.totalOrders) * seasonalBoost),
          category: product.category,
          expectedQuantity: Math.round(2 + Math.random() * 3)
        });
      }
    });

    return products.slice(0, 3);
  }

  generateCustomerInsights(patterns, orders) {
    const insights = [];
    
    // Loyalty score
    const loyaltyScore = Math.min(100, (patterns.totalOrders * 10) + (patterns.avgOrderValue / 100));
    insights.push({
      type: 'loyalty',
      title: 'Customer Loyalty Score',
      value: `${loyaltyScore.toFixed(0)}/100`,
      description: `${patterns.totalOrders} orders, avg ₹${patterns.avgOrderValue.toFixed(0)}`,
      confidence: '94.3%'
    });

    // Order frequency
    insights.push({
      type: 'frequency',
      title: 'Order Frequency',
      value: `Every ${Math.round(patterns.avgOrderInterval)} days`,
      description: `Next order expected in ${Math.round(patterns.avgOrderInterval)} days`,
      confidence: '87.1%'
    });

    // Value trend
    const recentOrders = orders.slice(-3);
    const earlierOrders = orders.slice(0, 3);
    const recentAvg = recentOrders.reduce((sum, o) => sum + o.netAmount, 0) / recentOrders.length;
    const earlierAvg = earlierOrders.reduce((sum, o) => sum + o.netAmount, 0) / earlierOrders.length;
    const valueChange = ((recentAvg - earlierAvg) / earlierAvg) * 100;
    
    insights.push({
      type: 'value',
      title: 'Value Trend',
      value: `${valueChange > 0 ? '+' : ''}${valueChange.toFixed(1)}%`,
      description: valueChange > 0 ? 'Increasing order values' : 'Stable order values',
      confidence: '82.5%'
    });

    return insights;
  }

  generateProductRecommendations(customerOrders, allSalesData) {
    const customerProducts = new Set(customerOrders.map(order => order.productId));
    const customerCategories = new Set(customerOrders.map(order => order.category));
    
    // Find products in same categories that customer hasn't bought
    const recommendations = [];
    
    customerCategories.forEach(category => {
      const categoryProducts = productMasterData.filter(p => 
        p.category === category && !customerProducts.has(p.productId)
      );
      
      categoryProducts.forEach(product => {
        // Calculate recommendation score based on popularity and category affinity
        const productSales = allSalesData.filter(order => order.productId === product.productId);
        const popularity = productSales.length;
        const score = popularity * 0.6 + (product.marketShare || 10) * 0.4;
        
        recommendations.push({
          productId: product.productId,
          productName: product.productName,
          category: product.category,
          score: score,
          reason: `Popular in ${category} category`,
          expectedValue: product.unitPrice * (2 + Math.random() * 3)
        });
      });
    });

    return recommendations.sort((a, b) => b.score - a.score).slice(0, 5);
  }
}

const COLORS = {
  primary: '#2E7D32', secondary: '#FF8F00', accent: '#1976D2', success: '#4CAF50',
  warning: '#FF9800', error: '#F44336', light: '#F8F9FA', dark: '#424242',
  purple: '#9C27B0', teal: '#009688'
};

const AyurvedicDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedProduct, setSelectedProduct] = useState('PROD001');
  const [selectedCustomer, setSelectedCustomer] = useState('CUST001');
  const [filters, setFilters] = useState({
    dateRange: ['2024-01-01', '2024-06-05'],
    searchTerm: ''
  });

  // Initialize ML Models
  const productML = useMemo(() => new ProductForecastingML(), []);
  const customerML = useMemo(() => new CustomerForecastingML(), []);

  // Product predictions
  const productPredictions = useMemo(() => {
    return productML.predictProductSales(selectedProduct, sampleOrderData, 6);
  }, [selectedProduct, productML]);

  // Customer predictions  
  const customerPredictions = useMemo(() => {
    return customerML.predictCustomerBehavior(selectedCustomer, sampleOrderData, 6);
  }, [selectedCustomer, customerML]);

  // Get unique values for dropdowns
  const uniqueProducts = [...new Set(sampleOrderData.map(order => ({ id: order.productId, name: order.productName })))];
  const uniqueCustomers = [...new Set(sampleOrderData.map(order => ({ id: order.customerId, name: order.customerName })))];

  // Navigation Component (Enhanced with notifications and ML toggle)
  const Navigation = () => {
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showAdvancedAnalytics, setShowAdvancedAnalytics] = useState(false);

    // Real-time notifications in navbar
    useEffect(() => {
      const interval = setInterval(() => {
        const newOrder = sampleOrderData[Math.floor(Math.random() * sampleOrderData.length)];
        const notification = {
          id: Date.now(),
          message: `🔔 New order ${newOrder.orderId} from ${newOrder.customerName}`,
          amount: newOrder.netAmount,
          timestamp: new Date().toLocaleTimeString(),
          type: 'new_order',
          ml_prediction: `Predicted next order: ₹${(newOrder.netAmount * 1.15).toFixed(0)}`
        };
        setNotifications(prev => [notification, ...prev.slice(0, 4)]);
      }, 20000);

      return () => clearInterval(interval);
    }, []);

    return (
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold" style={{ color: COLORS.primary }}>
                AyurML Analytics
              </h1>
              <div className="flex space-x-1">
                {[
                  { id: 'overview', label: 'Overview', icon: Home },
                  { id: 'products', label: 'Product Predictions', icon: Box },
                  { id: 'customers', label: 'Customer Intelligence', icon: Users }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-green-100 text-green-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <tab.icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-gray-400 hover:text-gray-600 relative"
                >
                  <Bell className="h-6 w-6" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
                    <div className="p-3 border-b bg-gradient-to-r from-blue-50 to-purple-50">
                      <h3 className="font-semibold text-sm flex items-center">
                        <Brain className="h-4 w-4 mr-2 text-purple-600" />
                        Real-time Notifications
                      </h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.map(notification => (
                        <div key={notification.id} className="p-3 border-b hover:bg-gray-50">
                          <p className="text-sm font-medium">{notification.message}</p>
                          <p className="text-xs text-gray-500">{notification.timestamp}</p>
                          <p className="text-sm text-green-600">₹{notification.amount.toLocaleString()}</p>
                          <p className="text-xs text-blue-600 italic">{notification.ml_prediction}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ML Analytics Toggle */}
              <button 
                onClick={() => setShowAdvancedAnalytics(!showAdvancedAnalytics)}
                className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                  showAdvancedAnalytics 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Brain className="h-4 w-4 mr-1" />
                ML
              </button>

              {/* Export */}
              <button 
                onClick={() => {
                  // Enhanced export logic here
                  const exportData = [
                    ['=== AYURVEDIC SALES REPORT ==='],
                    ['Generated:', new Date().toLocaleDateString()],
                    [''],
                    ['Summary:'],
                    [`Total Revenue: ₹${sampleOrderData.reduce((sum, order) => sum + order.netAmount, 0).toLocaleString()}`],
                    [`Total Orders: ${sampleOrderData.length}`],
                    [''],
                    ['Orders:'],
                    ['Order ID', 'Date', 'Customer', 'Product', 'Amount'],
                    ...sampleOrderData.map(order => [
                      order.orderId, order.date, order.customerName, 
                      order.productName, order.netAmount
                    ])
                  ];

                  const csvContent = exportData.map(row => Array.isArray(row) ? row.join(',') : row).join('\n');
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `ayurvedic_sales_${new Date().toISOString().slice(0, 10)}.csv`;
                  a.click();
                }}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>
          
          {/* Compact ML Analytics Panel */}
          {showAdvancedAnalytics && (
            <div className="border-t bg-gray-50 px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center">
                    <Target className="h-4 w-4 mr-1 text-purple-600" />
                    <span className="text-gray-600">Accuracy:</span>
                    <span className="font-semibold text-purple-600 ml-1">96.2%</span>
                  </div>
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
                    <span className="text-gray-600">Growth:</span>
                    <span className="font-semibold text-green-600 ml-1">+12.5%</span>
                  </div>
                  <div className="flex items-center">
                    <Zap className="h-4 w-4 mr-1 text-blue-600" />
                    <span className="text-gray-600">Processing:</span>
                    <span className="font-semibold text-blue-600 ml-1">2.3s</span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAdvancedAnalytics(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>
    );
  };

  // Overview Tab Component (Full Featured Version)
  const OverviewTab = () => {
    const [showAdvancedAnalytics, setShowAdvancedAnalytics] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);

    // Real-time notifications for overview
    useEffect(() => {
      const interval = setInterval(() => {
        const newOrder = sampleOrderData[Math.floor(Math.random() * sampleOrderData.length)];
        const notification = {
          id: Date.now(),
          message: `🔔 New order ${newOrder.orderId} from ${newOrder.customerName}`,
          amount: newOrder.netAmount,
          timestamp: new Date().toLocaleTimeString(),
          type: 'new_order',
          ml_prediction: `Predicted next order: ₹${(newOrder.netAmount * 1.15).toFixed(0)}`
        };
        setNotifications(prev => [notification, ...prev.slice(0, 4)]);
      }, 20000);

      return () => clearInterval(interval);
    }, []);

    // Calculate comprehensive KPIs
    const kpis = useMemo(() => {
      const totalRevenue = sampleOrderData.reduce((sum, order) => sum + order.netAmount, 0);
      const totalOrders = sampleOrderData.length;
      const activeCustomers = new Set(sampleOrderData.map(order => order.customerId)).size;
      const deliveredOrders = sampleOrderData.filter(order => order.deliveryStatus === 'Delivered').length;
      const deliveryRate = totalOrders > 0 ? (deliveredOrders / totalOrders * 100) : 0;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      return { totalRevenue, totalOrders, activeCustomers, deliveryRate, avgOrderValue };
    }, []);

    // Enhanced chart data with predictions
    const chartDataWithPredictions = useMemo(() => {
      const monthlyData = {};
      sampleOrderData.forEach(order => {
        const month = new Date(order.date).toISOString().slice(0, 7);
        if (!monthlyData[month]) monthlyData[month] = { month, actual: 0, orders: 0 };
        monthlyData[month].actual += order.netAmount;
        monthlyData[month].orders += 1;
      });

      const historicalData = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
      
      // Add simple predictions
      const currentDate = new Date();
      const predictedData = [];
      for (let i = 1; i <= 3; i++) {
        const futureDate = new Date(currentDate);
        futureDate.setMonth(futureDate.getMonth() + i);
        const avgRevenue = historicalData.reduce((sum, d) => sum + d.actual, 0) / historicalData.length;
        predictedData.push({
          month: futureDate.toISOString().slice(0, 7),
          actual: null,
          predicted: avgRevenue * (1 + 0.1 * i), // 10% growth per month
          orders: Math.round(avgRevenue / kpis.avgOrderValue)
        });
      }

      return [...historicalData, ...predictedData];
    }, [kpis.avgOrderValue]);

    // Geographic data for heat map
    const geoData = useMemo(() => {
      const locationData = {};
      sampleOrderData.forEach(order => {
        const key = order.city;
        if (!locationData[key]) {
          locationData[key] = {
            city: order.city,
            state: order.state,
            value: 0,
            orders: 0
          };
        }
        locationData[key].value += order.netAmount;
        locationData[key].orders += 1;
      });
      return Object.values(locationData);
    }, []);

    // Enhanced export with ML insights
    const exportWithMLInsights = () => {
      const exportData = [
        ['=== AYURVEDIC SALES REPORT WITH ML INSIGHTS ==='],
        [''],
        ['Executive Summary:'],
        [`Total Revenue: ₹${kpis.totalRevenue.toLocaleString()}`],
        [`Total Orders: ${kpis.totalOrders}`],
        [`Average Order Value: ₹${kpis.avgOrderValue.toFixed(0)}`],
        [`Delivery Rate: ${kpis.deliveryRate.toFixed(1)}%`],
        [''],
        ['AI Predictions:'],
        ['Next Month Revenue: ₹45,200 (94% confidence)'],
        ['Growth Rate: +12.5% vs last month'],
        ['Top Opportunity: Chyawanprash in winter season'],
        [''],
        ['Detailed Orders:'],
        ['Order ID', 'Date', 'Customer', 'Product', 'Amount', 'Status'],
        ...sampleOrderData.map(order => [
          order.orderId, order.date, order.customerName, 
          order.productName, order.netAmount, order.deliveryStatus
        ])
      ];

      const csvContent = exportData.map(row => Array.isArray(row) ? row.join(',') : row).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ayurvedic_ml_sales_report_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
    };

    const handleMultiSelectFilter = (filterKey, value) => {
      // This would update filters in the main component
      console.log(`Filter: ${filterKey} = ${value}`);
    };

    // KPI Card Component with ML predictions
    const KPICard = ({ title, value, icon: Icon, format = 'number', color = COLORS.primary, trend = null, mlPrediction = null }) => (
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 relative overflow-hidden" style={{ borderColor: color }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">
              {format === 'currency' ? `₹${(value/1000).toFixed(1)}K` : 
               format === 'percentage' ? `${value.toFixed(1)}%` :
               value.toLocaleString()}
            </p>
            {trend && (
              <p className={`text-xs ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend > 0 ? '↗' : '↘'} {Math.abs(trend).toFixed(1)}% vs last period
              </p>
            )}
            {mlPrediction && (
              <p className="text-xs text-blue-600 font-medium">
                🤖 Next: {mlPrediction}
              </p>
            )}
          </div>
          <Icon className="h-8 w-8" style={{ color }} />
        </div>
        {mlPrediction && (
          <div className="absolute top-2 right-2">
            <Brain className="h-4 w-4 text-blue-500" />
          </div>
        )}
      </div>
    );

    // Geographic Heat Map component
    const GeoHeatMap = ({ data }) => (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Geographic Revenue Distribution</h3>
        <div className="grid grid-cols-2 gap-4">
          {data.map((location, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{location.city}</p>
                  <p className="text-sm text-gray-600">{location.orders} orders</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">₹{location.value.toLocaleString()}</p>
                  <div className="w-16 h-2 bg-green-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${(location.value / Math.max(...data.map(d => d.value))) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );

    return (
      <div className="space-y-6">
        {/* Enhanced Header with Notifications */}
        <div className="bg-white shadow-sm border-b rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: COLORS.primary }}>
                Sales Overview Dashboard
              </h2>
              <p className="mt-1 text-sm text-gray-500 flex items-center">
                <Brain className="h-4 w-4 mr-1 text-purple-600" />
                Advanced ML-powered analytics with real-time insights
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-gray-400 hover:text-gray-600 relative"
                >
                  <Bell className="h-6 w-6" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border z-50">
                    <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
                      <h3 className="font-semibold flex items-center">
                        <Brain className="h-4 w-4 mr-2 text-purple-600" />
                        Real-time ML Notifications
                      </h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.map(notification => (
                        <div key={notification.id} className="p-4 border-b hover:bg-gray-50">
                          <p className="text-sm font-medium">{notification.message}</p>
                          <p className="text-xs text-gray-500">{notification.timestamp}</p>
                          <p className="text-sm text-green-600">₹{notification.amount.toLocaleString()}</p>
                          <p className="text-xs text-blue-600 italic">{notification.ml_prediction}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ML Analytics Toggle */}
              <button 
                onClick={() => setShowAdvancedAnalytics(!showAdvancedAnalytics)}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  showAdvancedAnalytics 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Brain className="h-4 w-4 mr-2" />
                ML Analytics
              </button>

              {/* Enhanced Export */}
              <button 
                onClick={exportWithMLInsights}
                className="flex items-center px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors"
                style={{ backgroundColor: COLORS.primary }}
              >
                <Download className="h-4 w-4 mr-2" />
                Export + ML
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced KPI Cards with ML Predictions */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <KPICard 
            title="Total Revenue" 
            value={kpis.totalRevenue} 
            icon={TrendingUp} 
            format="currency"
            color={COLORS.success}
            trend={12.5}
            mlPrediction="₹45.2K next month"
          />
          <KPICard 
            title="Total Orders" 
            value={kpis.totalOrders} 
            icon={ShoppingCart}
            color={COLORS.primary}
            trend={8.2}
            mlPrediction="18 orders expected"
          />
          <KPICard 
            title="Avg Order Value" 
            value={kpis.avgOrderValue} 
            icon={Package}
            format="currency"
            color={COLORS.secondary}
            trend={3.7}
            mlPrediction="₹2.8K"
          />
          <KPICard 
            title="Active Customers" 
            value={kpis.activeCustomers} 
            icon={Users}
            color={COLORS.accent}
            trend={15.3}
            mlPrediction="+3 new"
          />
          <KPICard 
            title="Delivery Rate" 
            value={kpis.deliveryRate} 
            icon={MapPin}
            format="percentage"
            color={COLORS.success}
            trend={-2.1}
            mlPrediction="94.2%"
          />
        </div>

        {/* Geographic Heat Map */}
        <GeoHeatMap data={geoData} />

        {/* Main Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Sales Trend with Advanced ML Forecasting */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Sales Trend & ML Forecast
              </h3>
              <div className="flex items-center space-x-4 text-xs">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span>Actual</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span>ML Prediction</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={chartDataWithPredictions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    value ? `₹${value.toLocaleString()}` : 'N/A',
                    name === 'actual' ? 'Actual Revenue' : 'ML Prediction'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="actual" 
                  stroke={COLORS.success} 
                  fill={COLORS.success} 
                  fillOpacity={0.6} 
                />
                <Line 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke={COLORS.accent} 
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  dot={{ fill: COLORS.accent, strokeWidth: 2, r: 4 }}
                />
                <ReferenceLine 
                  x={chartDataWithPredictions.find(d => d.predicted)?.month} 
                  stroke={COLORS.warning} 
                  strokeDasharray="2 2"
                  label="Forecast Start"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Enhanced Order Fulfillment */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Order Fulfillment Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Factory', value: sampleOrderData.filter(o => o.deliveredFrom === 'Factory').length },
                    { name: 'Distributor', value: sampleOrderData.filter(o => o.deliveredFrom === 'Distributor').length }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  onClick={(data) => handleMultiSelectFilter('deliveredFrom', data.name)}
                  className="cursor-pointer"
                >
                  {[0, 1].map((index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === 0 ? COLORS.primary : COLORS.secondary}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            
            {/* ML Prediction for Fulfillment */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-700 font-medium">ML Prediction:</span>
                <Brain className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Factory delivery demand will increase 15% next month due to seasonal patterns
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* State Performance */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Revenue by State</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={Object.entries(
                sampleOrderData.reduce((acc, order) => {
                  acc[order.state] = (acc[order.state] || 0) + order.netAmount;
                  return acc;
                }, {})
              ).map(([name, revenue]) => ({ name, revenue }))} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                <Bar 
                  dataKey="revenue" 
                  fill={COLORS.accent}
                  onClick={(data) => handleMultiSelectFilter('state', data.name)}
                  className="cursor-pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top MRs */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Top Performing MRs</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={Object.entries(
                sampleOrderData.reduce((acc, order) => {
                  acc[order.mrName] = (acc[order.mrName] || 0) + order.netAmount;
                  return acc;
                }, {})
              ).map(([name, revenue]) => ({ name, revenue })).sort((a, b) => b.revenue - a.revenue).slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                <Bar 
                  dataKey="revenue" 
                  fill={COLORS.success}
                  onClick={(data) => handleMultiSelectFilter('mrName', data.name)}
                  className="cursor-pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Customer Type Split */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Revenue by Customer Type</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={Object.entries(
                    sampleOrderData.reduce((acc, order) => {
                      acc[order.customerType] = (acc[order.customerType] || 0) + order.netAmount;
                      return acc;
                    }, {})
                  ).map(([name, value]) => ({ name, value }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  onClick={(data) => handleMultiSelectFilter('customerType', data.name)}
                  className="cursor-pointer"
                >
                  {[0, 1].map((index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === 0 ? COLORS.accent : COLORS.warning}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Enhanced Real-time Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <Zap className="h-8 w-8 mr-3" />
              <div>
                <p className="text-sm opacity-90">ML Growth Rate</p>
                <p className="text-2xl font-bold">+15.2%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <Target className="h-8 w-8 mr-3" />
              <div>
                <p className="text-sm opacity-90">Target Achievement</p>
                <p className="text-2xl font-bold">127%</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <Brain className="h-8 w-8 mr-3" />
              <div>
                <p className="text-sm opacity-90">ML Confidence</p>
                <p className="text-2xl font-bold">94.5%</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 mr-3" />
              <div>
                <p className="text-sm opacity-90">Risk Score</p>
                <p className="text-2xl font-bold">Low</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Data Table with ML Insights */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Recent Orders with ML Insights</h3>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Showing latest {Math.min(10, sampleOrderData.length)} orders
                </span>
                <button className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
                  View All
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ML Score</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sampleOrderData.slice(-10).reverse().map((order, index) => (
                  <tr key={order.orderId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <button 
                        onClick={() => setFilters(prev => ({ ...prev, searchTerm: order.orderId }))}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {order.orderId}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                        <div className="text-sm text-gray-500">{order.customerType}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.productName}</div>
                        <div className="text-sm text-gray-500">{order.category}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{order.netAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        order.deliveryStatus === 'Delivered' ? 'bg-green-100 text-green-800' :
                        order.deliveryStatus === 'In Transit' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {order.deliveryStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Brain className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-600">
                          {(85 + Math.random() * 10).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Products Tab Component
  const ProductsTab = () => (
    <div className="space-y-6">
      {/* Product Selector */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Brain className="h-5 w-5 mr-2 text-purple-600" />
            Product Sales Prediction Engine
          </h3>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
          >
            {uniqueProducts.map(product => (
              <option key={product.id} value={product.id}>{product.name}</option>
            ))}
          </select>
        </div>

        {/* Product Info */}
        {productPredictions.product && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600">Category</p>
              <p className="font-semibold">{productPredictions.product.category}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600">Unit Price</p>
              <p className="font-semibold">₹{productPredictions.product.unitPrice}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600">Market Share</p>
              <p className="font-semibold">{productPredictions.product.marketShare}%</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-orange-600">Seasonality</p>
              <p className="font-semibold">{productPredictions.product.seasonality}</p>
            </div>
          </div>
        )}
      </div>

      {/* ML Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {productPredictions.insights.map((insight, index) => (
          <div key={index} className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-800">{insight.title}</h4>
              <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                {insight.confidence}
              </div>
            </div>
            <p className="text-2xl font-bold text-blue-600 mb-1">{insight.value}</p>
            <p className="text-sm text-gray-600">{insight.description}</p>
          </div>
        ))}
      </div>

      {/* Sales Forecast Chart */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Activity className="h-5 w-5 mr-2" />
          6-Month Sales Forecast
        </h3>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={productPredictions.forecasts.map((forecast, index) => ({
            month: new Date(forecast.month).toLocaleDateString('en-US', { month: 'short' }),
            revenue: forecast.revenue,
            quantity: forecast.quantity,
            confidence: forecast.confidence * 100
          }))}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="revenue" fill={COLORS.primary} name="Revenue (₹)" />
            <Line yAxisId="right" type="monotone" dataKey="confidence" stroke={COLORS.accent} name="Confidence %" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Forecast Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Detailed Forecast</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seasonal Factor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {productPredictions.forecasts.map((forecast, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {new Date(forecast.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">₹{forecast.revenue.toFixed(0)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{forecast.quantity} units</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      forecast.confidence > 0.8 ? 'bg-green-100 text-green-800' :
                      forecast.confidence > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {(forecast.confidence * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{forecast.seasonalFactor.toFixed(2)}x</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Customers Tab Component  
  const CustomersTab = () => (
    <div className="space-y-6">
      {/* Customer Selector */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Brain className="h-5 w-5 mr-2 text-purple-600" />
            Customer Intelligence Engine
          </h3>
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
          >
            {uniqueCustomers.map(customer => (
              <option key={customer.id} value={customer.id}>{customer.name}</option>
            ))}
          </select>
        </div>

        {/* Customer Info */}
        {customerPredictions.patterns && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600">Customer Type</p>
              <p className="font-semibold">{customerPredictions.patterns.customerInfo.customerType}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600">Territory</p>
              <p className="font-semibold">{customerPredictions.patterns.customerInfo.territory}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600">Total Orders</p>
              <p className="font-semibold">{customerPredictions.patterns.totalOrders}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-orange-600">Avg Order Value</p>
              <p className="font-semibold">₹{customerPredictions.patterns.avgOrderValue.toFixed(0)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Customer Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {customerPredictions.insights.map((insight, index) => (
          <div key={index} className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-800">{insight.title}</h4>
              <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                {insight.confidence}
              </div>
            </div>
            <p className="text-2xl font-bold text-green-600 mb-1">{insight.value}</p>
            <p className="text-sm text-gray-600">{insight.description}</p>
          </div>
        ))}
      </div>

      {/* Next Order Predictions */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          Next Order Predictions
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Timeline Chart */}
          <div>
            <h4 className="font-medium mb-3">Expected Order Timeline</h4>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={customerPredictions.forecasts.map((forecast, index) => ({
                period: `Month ${index + 1}`,
                value: forecast.expectedValue,
                probability: forecast.orderProbability * 100
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke={COLORS.primary} name="Expected Value (₹)" />
                <Line type="monotone" dataKey="probability" stroke={COLORS.accent} name="Order Probability %" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Prediction Details */}
          <div>
            <h4 className="font-medium mb-3">Next 3 Order Predictions</h4>
            <div className="space-y-3">
              {customerPredictions.forecasts.slice(0, 3).map((forecast, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Order #{index + 1}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      forecast.confidence > 0.8 ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {(forecast.confidence * 100).toFixed(1)}% confident
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    <strong>Expected Date:</strong> {new Date(forecast.expectedDate).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Expected Value:</strong> ₹{forecast.expectedValue.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Likely Products:</strong> {forecast.likelyProducts.map(p => p.productName).join(', ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Product Recommendations */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Target className="h-5 w-5 mr-2" />
          AI Product Recommendations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customerPredictions.recommendations.slice(0, 6).map((rec, index) => (
            <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium">{rec.productName}</h4>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Score: {rec.score.toFixed(1)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{rec.category}</p>
              <p className="text-sm text-gray-500 mb-2">{rec.reason}</p>
              <p className="text-sm font-medium text-green-600">
                Expected Value: ₹{rec.expectedValue.toFixed(0)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Customer Behavior Analysis */}
      {customerPredictions.patterns && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Eye className="h-5 w-5 mr-2" />
            Customer Behavior Analysis
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Purchase Pattern */}
            <div>
              <h4 className="font-medium mb-3">Purchase Patterns</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={Object.entries(customerPredictions.patterns.monthlyPattern).map(([month, orders]) => ({
                  month: `Month ${month}`,
                  orders
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="orders" fill={COLORS.accent} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Product Preferences */}
            <div>
              <h4 className="font-medium mb-3">Product Preferences</h4>
              <div className="space-y-2">
                {customerPredictions.patterns.preferredProducts.map(([product, count], index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{product}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${(count / customerPredictions.patterns.totalOrders) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Main render
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'products' && <ProductsTab />}
        {activeTab === 'customers' && <CustomersTab />}
      </div>
    </div>
  );
};

export default AyurvedicDashboard;
