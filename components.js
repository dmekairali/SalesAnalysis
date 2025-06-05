

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer, Area, AreaChart, ComposedChart, ReferenceLine } from 'recharts';
import { TrendingUp, ShoppingCart, Users, MapPin, Package, Brain, Bell, Download, Search, Home, Box, Star, Target, Settings, Activity, Clock, Eye } from 'lucide-react';
import { COLORS, ML_INSIGHTS, SALES_DRIVERS } from './data.js';

// KPI Card Component
export const KPICard = ({ title, value, icon: Icon, format = 'number', color = COLORS.primary, trend = null, mlPrediction = null }) => (
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

// Navigation Component
export const Navigation = ({ activeTab, setActiveTab, notifications, showNotifications, setShowNotifications, exportWithMLInsights, showMLAnalytics, setShowMLAnalytics, filters, setFilters }) => (
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
            onClick={() => setShowMLAnalytics(!showMLAnalytics)}
            className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
              showMLAnalytics 
                ? 'bg-purple-100 text-purple-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Brain className="h-4 w-4 mr-1" />
            ML
          </button>

          {/* Export */}
          <button 
            onClick={exportWithMLInsights}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>
    </div>
  </nav>
);

// ML Insights Compact Component
export const MLInsightsCompact = () => (
  <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-6">
    <h3 className="text-sm font-semibold mb-3 flex items-center">
      <Brain className="h-4 w-4 mr-2 text-purple-600" />
      AI Insights
    </h3>
    <div className="grid grid-cols-3 gap-4">
      {ML_INSIGHTS.map((insight, index) => (
        <div key={index} className="text-center">
          <p className="text-lg font-bold text-blue-600">{insight.value}</p>
          <p className="text-xs text-gray-600">{insight.title}</p>
          <p className="text-xs text-green-600">{insight.confidence}</p>
        </div>
      ))}
    </div>
  </div>
);

// Sales Drivers Compact Component
export const SalesDriversCompact = () => (
  <div className="bg-white p-4 rounded-lg shadow-md">
    <h3 className="text-sm font-semibold mb-3 flex items-center">
      <Settings className="h-4 w-4 mr-2 text-orange-600" />
      Key Sales Drivers
    </h3>
    <div className="space-y-2">
      {SALES_DRIVERS.map((factor, index) => (
        <div key={index} className="flex items-center justify-between">
          <span className="text-xs text-gray-700">{factor.factor}</span>
          <div className="flex items-center space-x-2">
            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full transition-all duration-500"
                style={{ 
                  width: `${factor.importance}%`, 
                  backgroundColor: factor.color 
                }}
              ></div>
            </div>
            <span className="text-xs font-semibold text-gray-600">{factor.importance}%</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Enhanced Chart Components
export const SalesTrendChart = ({ data }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h3 className="text-lg font-semibold mb-4 flex items-center">
      <Activity className="h-5 w-5 mr-2" />
      Sales Trend & ML Forecast
    </h3>
    <ResponsiveContainer width="100%" height={350}>
      <ComposedChart data={data}>
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
          x={data.find(d => d.predicted)?.month} 
          stroke={COLORS.warning} 
          strokeDasharray="2 2"
          label="Forecast Start"
        />
      </ComposedChart>
    </ResponsiveContainer>
  </div>
);

export const FulfillmentChart = ({ data, onChartClick }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h3 className="text-lg font-semibold mb-4">Order Fulfillment</h3>
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={80}
          dataKey="value"
          onClick={onChartClick}
          className="cursor-pointer"
        >
          {data.map((entry, index) => (
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
  </div>
);

export const CategoryChart = ({ data }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h3 className="text-lg font-semibold mb-4">Sales by Category</h3>
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={80}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={[COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.purple, COLORS.teal, COLORS.warning, COLORS.success, COLORS.error][index % 8]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  </div>
);

export const TopProductsChart = ({ data }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h3 className="text-lg font-semibold mb-4">Top Products</h3>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
        <YAxis />
        <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
        <Bar dataKey="value" fill={COLORS.primary} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

// Geographic Heat Map Component
export const GeoHeatMap = ({ data }) => (
  <div className="bg-white p-6 rounded-lg shadow-md mb-6">
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

// Product Forecast Chart
export const ProductForecastChart = ({ data }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h3 className="text-lg font-semibold mb-4 flex items-center">
      <Activity className="h-5 w-5 mr-2" />
      6-Month Sales Forecast
    </h3>
    <ResponsiveContainer width="100%" height={350}>
      <ComposedChart data={data}>
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
);

// Customer Timeline Chart
export const CustomerTimelineChart = ({ data }) => (
  <div>
    <h4 className="font-medium mb-3">Expected Order Timeline</h4>
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="period" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke={COLORS.primary} name="Expected Value (₹)" />
        <Line type="monotone" dataKey="probability" stroke={COLORS.accent} name="Order Probability %" />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

// ML Insight Card Component
export const MLInsightCard = ({ insight }) => (
  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
    <div className="flex items-center justify-between mb-2">
      <h4 className="font-semibold text-gray-800">{insight.title}</h4>
      <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
        {insight.confidence}
      </div>
    </div>
    <p className="text-2xl font-bold text-blue-600 mb-1">{insight.value}</p>
    <p className="text-sm text-gray-600">{insight.description}</p>
  </div>
);
