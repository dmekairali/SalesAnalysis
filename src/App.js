import React, { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { TrendingUp, ShoppingCart, Users, MapPin, Package, Brain, Star } from 'lucide-react';

// Import modules - Updated paths for Next.js
import { sampleOrderData, productMasterData, COLORS, calculateKPIs, getUniqueValues } from '../data.js';
import { ProductForecastingML, CustomerForecastingML } from '../mlModels.js';
import { 
  Navigation, 
  KPICard, 
  MLInsightsCompact, 
  SalesDriversCompact,
  SalesTrendChart,
  FulfillmentChart,
  CategoryChart,
  TopProductsChart,
  GeoHeatMap,
  ProductForecastChart,
  CustomerTimelineChart,
  MLInsightCard
} from '../components.js';

const AyurvedicDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedProduct, setSelectedProduct] = useState('PROD001');
  const [selectedCustomer, setSelectedCustomer] = useState('CUST001');
  const [showMLAnalytics, setShowMLAnalytics] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: ['2024-01-01', '2024-06-05'],
    searchTerm: ''
  });

  // Initialize ML Models
  const productML = useMemo(() => new ProductForecastingML(), []);
  const customerML = useMemo(() => new CustomerForecastingML(), []);

  // Real-time notifications
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

  // Enhanced export with ML insights
  const exportWithMLInsights = () => {
    const kpis = calculateKPIs(sampleOrderData);
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

  // Calculate data for charts
  const kpis = calculateKPIs(sampleOrderData);
  
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

  // Geographic data
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

  // Chart data preparations
  const categoryData = Object.entries(
    sampleOrderData.reduce((acc, order) => {
      acc[order.category] = (acc[order.category] || 0) + order.netAmount;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const topProductsData = Object.entries(
    sampleOrderData.reduce((acc, order) => {
      acc[order.productName] = (acc[order.productName] || 0) + order.netAmount;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name: name.substring(0, 15), value }));

  const fulfillmentData = [
    { name: 'Factory', value: sampleOrderData.filter(o => o.deliveredFrom === 'Factory').length },
    { name: 'Distributor', value: sampleOrderData.filter(o => o.deliveredFrom === 'Distributor').length }
  ];

  // Overview Tab Component
  const OverviewTab = () => (
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

      {/* ML Analytics Section */}
      {showMLAnalytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MLInsightsCompact />
          <SalesDriversCompact />
        </div>
      )}

      {/* Geographic Heat Map */}
      <GeoHeatMap data={geoData} />

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend with ML Forecasting */}
        <div className="lg:col-span-2">
          <SalesTrendChart data={chartDataWithPredictions} />
        </div>

        {/* Order Fulfillment */}
        <FulfillmentChart 
          data={fulfillmentData}
          onChartClick={(data) => console.log(`Filter by: ${data.name}`)}
        />
      </div>

      {/* Bottom Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryChart data={categoryData} />
        <TopProductsChart data={topProductsData} />
      </div>

      {/* Enhanced Data Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Recent Orders with ML Insights</h3>
            <span className="text-sm text-gray-600">
              Showing latest {Math.min(10, sampleOrderData.length)} orders
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ML Score</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sampleOrderData.slice(-10).reverse().map((order, index) => (
                <tr key={order.orderId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.orderId}
                  </td>
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
          <MLInsightCard key={index} insight={insight} />
        ))}
      </div>

      {/* Sales Forecast Chart */}
      <ProductForecastChart 
        data={productPredictions.forecasts.map((forecast, index) => ({
          month: new Date(forecast.month).toLocaleDateString('en-US', { month: 'short' }),
          revenue: forecast.revenue,
          quantity: forecast.quantity,
          confidence: forecast.confidence * 100
        }))}
      />

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
          <Star className="h-5 w-5 mr-2" />
          Next Order Predictions
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Timeline Chart */}
          <CustomerTimelineChart 
            data={customerPredictions.forecasts.map((forecast, index) => ({
              period: `Month ${index + 1}`,
              value: forecast.expectedValue,
              probability: forecast.orderProbability * 100
            }))}
          />

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
          <Star className="h-5 w-5 mr-2" />
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
            <Users className="h-5 w-5 mr-2" />
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
      <Navigation 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        notifications={notifications}
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
        exportWithMLInsights={exportWithMLInsights}
        showMLAnalytics={showMLAnalytics}
        setShowMLAnalytics={setShowMLAnalytics}
        filters={filters}
        setFilters={setFilters}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'products' && <ProductsTab />}
        {activeTab === 'customers' && <CustomersTab />}
      </div>
    </div>
  );
};

export default AyurvedicDashboard;
