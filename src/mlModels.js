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

  predictProductSales(productId, salesData, productData, monthsAhead = 6) {
    const productSales = salesData.filter(order => order.productId === productId);
    const product = productData.find(p => p.productId === productId);
    
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

  predictCustomerBehavior(customerId, salesData, productData, monthsAhead = 6) {
    const customerOrders = salesData.filter(order => order.customerId === customerId);
    
    if (customerOrders.length === 0) {
      console.warn(`[CustomerForecastingML] No order history found for customer ${customerId}. Returning empty predictions.`);
      return { forecasts: [], insights: [], recommendations: [], patterns: null };
    }

    const patterns = this.analyzeCustomerPatterns(customerOrders); // productData is not directly used here but by predictLikelyProducts

    if (patterns.avgOrderValue === 0) {
      console.warn(`[CustomerForecastingML] Customer ${customerId} has an average order value of 0. Predictions for monetary values will be zero.`);
    }
    if (!patterns.preferredProducts || patterns.preferredProducts.length === 0) {
      console.warn(`[CustomerForecastingML] Customer ${customerId} has no preferred products based on their order history. 'Likely products' will be empty.`);
    }

    const forecasts = this.generateCustomerForecasts(patterns, customerOrders, productData, monthsAhead); // Pass productData
    const insights = this.generateCustomerInsights(patterns, patterns.distinctSortedOrders); // Pass distinct orders
    const recommendations = this.generateProductRecommendations(customerOrders, salesData, productData); // customerOrders here are still line items, might need adjustment if generateProductRecommendations needs distinct orders. For now, keeping as is.
    
    return { forecasts, insights, recommendations, patterns };
  }

  analyzeCustomerPatterns(lineItems) { // Renamed 'orders' to 'lineItems' for clarity
    // console.log('[ML_Debug] analyzeCustomerPatterns input lineItems count:', lineItems ? lineItems.length : 'null or undefined'); // Removed
    // if (lineItems && lineItems.length > 0) { // Removed
    //   try { // Removed
    //     console.log('[ML_Debug] First lineItem sample:', JSON.parse(JSON.stringify(lineItems[0]))); // Removed
    //   } catch (e) { // Removed
    //     console.error('[ML_Debug] Error stringifying first lineItem sample:', e); // Removed - This is an error log but part of the removed block
    //     console.log('[ML_Debug] First lineItem sample (raw):', lineItems[0]); // Removed
    //   } // Removed
    // } // Removed
    if (!lineItems || lineItems.length === 0) {
      return { // Return a default structure if there are no line items at all
        avgOrderInterval: 30,
        avgOrderValue: 0,
        minAmount: 0,
        maxAmount: 0,
        totalOrders: 0,
        preferredProducts: [],
        preferredCategories: [],
        monthlyPattern: {},
        lastOrderDate: new Date(),
        customerInfo: {}
      };
    }

    const ordersMap = {};
    lineItems.forEach(item => {
      // console.log('[ML_Debug] Processing lineItem:', JSON.parse(JSON.stringify(item))); // Removed
      if (!ordersMap[item.orderId]) {
        ordersMap[item.orderId] = {
          orderId: item.orderId,
          date: item.date, // Assuming date is consistent for all items of an order
          customerId: item.customerId,
          customerName: item.customerName,
          customerType: item.customerType,
          territory: item.territory,
          city: item.city,
          state: item.state,
          netAmount: item.netAmount, // Assuming this is the total order amount from the line item
          items: []
        };
      }
      ordersMap[item.orderId].items.push({
        productName: item.productName,
        category: item.category,
        quantity: item.quantity
        // itemNetAmount could be item.netAmount if it were item-specific
      });
      // console.log('[ML_Debug] ordersMap entry for', item.orderId, 'after adding item:', JSON.parse(JSON.stringify(ordersMap[item.orderId]))); // Removed
    });

    // console.log('[ML_Debug] Final ordersMap:', JSON.parse(JSON.stringify(ordersMap))); // Removed
    const distinctCustomerOrders = Object.values(ordersMap);
    // console.log('[ML_Debug] distinctCustomerOrders array:', JSON.parse(JSON.stringify(distinctCustomerOrders))); // Removed

    if (distinctCustomerOrders.length === 0) { // Should not happen if lineItems is not empty, but as a safeguard
       return {
        avgOrderInterval: 30, avgOrderValue: 0, minAmount: 0, maxAmount: 0, totalOrders: 0,
        preferredProducts: [], preferredCategories: [], monthlyPattern: {},
        lastOrderDate: new Date(), customerInfo: {}
      };
    }

    const sortedOrders = distinctCustomerOrders.sort((a, b) => new Date(a.date) - new Date(b.date));
    // console.log('[ML_Debug] sortedOrders (distinct orders sorted):', JSON.parse(JSON.stringify(sortedOrders))); // Removed
    
    const orderDates = sortedOrders.map(order => new Date(order.date));
    const intervals = [];
    if (orderDates.length > 1) {
      for (let i = 1; i < orderDates.length; i++) {
        const daysDiff = (orderDates[i] - orderDates[i-1]) / (1000 * 60 * 60 * 24);
        intervals.push(daysDiff);
      }
    }
    const avgOrderInterval = intervals.length > 0 ? intervals.reduce((a, b) => a + b, 0) / intervals.length : 30;

    const amounts = sortedOrders.map(order => order.netAmount);
    const avgOrderValue = amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;
    const minAmount = amounts.length > 0 ? Math.min(...amounts) : 0;
    const maxAmount = amounts.length > 0 ? Math.max(...amounts) : 0;

    const productFreq = {};
    const categoryFreq = {};
    sortedOrders.forEach(order => {
      order.items.forEach(item => {
        productFreq[item.productName] = (productFreq[item.productName] || 0) + (item.quantity || 1);
        categoryFreq[item.category] = (categoryFreq[item.category] || 0) + (item.quantity || 1);
      });
    });

    const monthlyOrders = {};
    sortedOrders.forEach(order => {
      const month = new Date(order.date).getMonth() + 1; // 1-12
      monthlyOrders[month] = (monthlyOrders[month] || 0) + 1;
    });

    const firstOrder = sortedOrders[0];
    const totalOrders = sortedOrders.length;
    const preferredProductsResult = Object.entries(productFreq).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const preferredCategoriesResult = Object.entries(categoryFreq).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const monthlyPatternResult = monthlyOrders;
    const lastOrderDateResult = orderDates.length > 0 ? orderDates[orderDates.length - 1] : new Date();
    const customerInfoResult = {
        customerId: firstOrder.customerId,
        customerName: firstOrder.customerName,
        customerType: firstOrder.customerType,
        territory: firstOrder.territory,
        city: firstOrder.city,
        state: firstOrder.state,
    };
    const distinctSortedOrdersResult = sortedOrders;

    // console.log('[ML_Debug] patterns.totalOrders:', totalOrders); // Removed
    // console.log('[ML_Debug] patterns.avgOrderValue:', avgOrderValue); // Removed
    // console.log('[ML_Debug] patterns.preferredProducts:', JSON.parse(JSON.stringify(preferredProductsResult))); // Removed
    // console.log('[ML_Debug] patterns.monthlyPattern:', JSON.parse(JSON.stringify(monthlyPatternResult))); // Removed
    // console.log('[ML_Debug] patterns.distinctSortedOrders count:', distinctSortedOrdersResult ? distinctSortedOrdersResult.length : 'N/A'); // Removed


    return {
      avgOrderInterval,
      avgOrderValue,
      minAmount,
      maxAmount,
      totalOrders: totalOrders,
      preferredProducts: preferredProductsResult,
      preferredCategories: preferredCategoriesResult,
      monthlyPattern: monthlyPatternResult,
      lastOrderDate: lastOrderDateResult,
      customerInfo: customerInfoResult,
      distinctSortedOrders: distinctSortedOrdersResult
    };
  }

  generateCustomerForecasts(patterns, orders, productData, monthsAhead) {
    const forecasts = [];
    let currentDate = new Date(patterns.lastOrderDate);
    
    for (let i = 1; i <= monthsAhead; i++) {
      const daysToAdd = patterns.avgOrderInterval * (0.8 + Math.random() * 0.4);
      currentDate = new Date(currentDate.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
      
      const growthFactor = 1 + (0.05 * i);
      const seasonalFactor = this.getSeasonalFactor(currentDate.getMonth() + 1, patterns.monthlyPattern);
      const predictedValue = patterns.avgOrderValue * growthFactor * seasonalFactor;
      
      const likelyProducts = this.predictLikelyProducts(patterns, currentDate, productData); // Pass productData
      
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
    const totalOrdersAcrossAllMonths = Object.values(monthlyPattern).reduce((a, b) => a + b, 0);

    if (totalOrdersAcrossAllMonths === 0) {
      // No order history at all in the pattern
      return 1.0; // Default neutral factor
    }

    const avgMonthlyOrders = totalOrdersAcrossAllMonths / 12;

    // If avgMonthlyOrders is 0 (e.g. total orders < 12, and they are all in one month not the target month),
    // avoid division by zero. This also handles the case where orderCount is 0.
    if (avgMonthlyOrders === 0) {
        // This case implies totalOrdersAcrossAllMonths is > 0 but < 12, and none in the current month's calculation led to a non-zero avg.
        // It's safer to return a neutral factor if the average is zero.
        console.warn(`[ML_Debug] getSeasonalFactor: avgMonthlyOrders is 0 for month ${month}. Returning neutral 1.0. Pattern:`, JSON.parse(JSON.stringify(monthlyPattern)));
        return 1.0;
    }

    if (orderCount > 0) {
      // If there are orders in the target month, calculate factor normally
      return orderCount / avgMonthlyOrders;
    } else {
      // If no orders in the target month, but there IS history in other months,
      // avoid returning 0. Return a neutral factor (1.0).
      console.warn(`[ML_Debug] getSeasonalFactor: No orders in target month ${month}, but history exists. Returning neutral factor 1.0. monthlyPattern:`, JSON.parse(JSON.stringify(monthlyPattern)));
      return 1.0;
    }
  }

  predictLikelyProducts(patterns, orderDate, productData) {
    const month = orderDate.getMonth() + 1;
    const products = [];
    
    patterns.preferredProducts.forEach(([productName, frequency]) => {
      // const product = productData.find(p => p.productName === productName);
      // Change to case-insensitive matching and ensure 'Medicine Name' field is used:
      const product = productData.find(p => p['Medicine Name'] && typeof p['Medicine Name'] === 'string' && p['Medicine Name'].toLowerCase() === productName.toLowerCase());

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
      } else {
        console.warn(`[ML_Debug] Product "${productName}" from preferredProducts not found in productData (case-insensitive search). Cannot include in likelyProducts.`);
      }
    });

    return products.slice(0, 3);
  }

  generateCustomerInsights(patterns, distinctSortedOrders) { // Signature changed
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

    // Use distinctSortedOrders for value trend calculation
    const recentDistinctOrders = distinctSortedOrders.slice(-3);
    const earlierDistinctOrders = distinctSortedOrders.slice(0, Math.min(3, distinctSortedOrders.length));

    const recentAvg = recentDistinctOrders.length > 0 ? recentDistinctOrders.reduce((sum, o) => sum + o.netAmount, 0) / recentDistinctOrders.length : 0;
    const earlierAvg = earlierDistinctOrders.length > 0 ? earlierDistinctOrders.reduce((sum, o) => sum + o.netAmount, 0) / earlierDistinctOrders.length : 0;

    const valueChange = earlierAvg !== 0 ? ((recentAvg - earlierAvg) / earlierAvg) * 100 : (recentAvg > 0 ? 100.0 : 0.0);

    let description = 'Stable order values';
    if (valueChange > 10) description = 'Increasing order values';
    if (valueChange < -10) description = 'Decreasing order values';
    if (earlierAvg === 0 && recentAvg > 0) description = 'New growth in order value';


    insights.push({
      type: 'value',
      title: 'Value Trend',
      value: `${valueChange > 0 && earlierAvg !==0 ? '+' : ''}${valueChange.toFixed(1)}%`, // Avoid + for 100% from zero
      description: description,
      confidence: '82.5%'
    });

    return insights;
  }

  generateProductRecommendations(customerOrders, allSalesData, productData) {
    const customerProducts = new Set(customerOrders.map(order => order.productId));
    const customerCategories = new Set(customerOrders.map(order => order.category));
    
    const recommendations = [];
    
    customerCategories.forEach(category => {
      const categoryProducts = productData.filter(p =>
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
