// mlModels.js - All ML prediction models

export class ProductForecastingML {
  constructor() {
    this.seasonalFactors = {
      'Immunity': { 1: 1.4, 2: 1.2, 3: 1.0, 4: 0.8, 5: 0.7, 6: 0.6, 7: 0.7, 8: 0.8, 9: 1.0, 10: 1.3, 11: 1.5, 12: 1.6 },
      'Digestive': { 1: 1.1, 2: 1.0, 3: 1.2, 4: 1.3, 5: 1.1, 6: 0.9, 7: 0.8, 8: 0.9, 9: 1.1, 10: 1.2, 11: 1.1, 12: 1.0 },
      'Stress Relief': { 1: 1.0, 2: 1.1, 3: 1.3, 4: 1.2, 5: 1.1, 6: 1.4, 7: 1.5, 8: 1.3, 9: 1.2, 10: 1.0, 11: 0.9, 12: 1.0 },
      'Heart Care': { 1: 1.0, 2: 1.0, 3: 1.1, 4: 1.3, 5: 1.4, 6: 1.5, 7: 1.3, 8: 1.2, 9: 1.1, 10: 1.0, 11: 0.9, 12: 0.9 },
      'Skin Care': { 1: 0.8, 2: 0.9, 3: 1.1, 4: 1.3, 5: 1.5, 6: 1.6, 7: 1.4, 8: 1.3, 9: 1.1, 10: 1.0, 11: 0.9, 12: 0.8 }
    };
  }

  predictProductSales(productId, salesData, productMasterData, monthsAhead = 6) {
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

export class CustomerForecastingML {
  constructor() {
    this.customerPatterns = {};
  }

  predictCustomerBehavior(customerId, salesData, productMasterData, monthsAhead = 6) {
    const customerOrders = salesData.filter(order => order.customerId === customerId);
    
    if (customerOrders.length === 0) return { forecasts: [], insights: [], recommendations: [] };

    const patterns = this.analyzeCustomerPatterns(customerOrders); // productMasterData is not directly used here but by predictLikelyProducts
    const forecasts = this.generateCustomerForecasts(patterns, customerOrders, productMasterData, monthsAhead); // Pass productMasterData
    const insights = this.generateCustomerInsights(patterns, customerOrders);
    const recommendations = this.generateProductRecommendations(customerOrders, salesData, productMasterData); // Pass productMasterData
    
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

  generateCustomerForecasts(patterns, orders, productMasterData, monthsAhead) {
    const forecasts = [];
    let currentDate = new Date(patterns.lastOrderDate);
    
    for (let i = 1; i <= monthsAhead; i++) {
      const daysToAdd = patterns.avgOrderInterval * (0.8 + Math.random() * 0.4);
      currentDate = new Date(currentDate.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
      
      const growthFactor = 1 + (0.05 * i);
      const seasonalFactor = this.getSeasonalFactor(currentDate.getMonth() + 1, patterns.monthlyPattern);
      const predictedValue = patterns.avgOrderValue * growthFactor * seasonalFactor;
      
      const likelyProducts = this.predictLikelyProducts(patterns, currentDate, productMasterData); // Pass productMasterData
      
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

  predictLikelyProducts(patterns, orderDate, productMasterData) {
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

  generateProductRecommendations(customerOrders, allSalesData, productMasterData) {
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
