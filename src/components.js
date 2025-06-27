import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer, Area, AreaChart, ComposedChart, ReferenceLine } from 'recharts';
import { TrendingUp, ShoppingCart, Users, MapPin, Package, Brain, Bell, Download, Search, Home, Star, Target, Settings, Activity, Clock, Eye, BarChart3 } from 'lucide-react';
import { COLORS, ML_INSIGHTS, SALES_DRIVERS } from './data.js';
import { formatIndianCurrency, formatCurrencyByContext } from './data.js';

// KPI Card Component
export const KPICard = ({ title, value, icon: Icon, format = 'number', color = COLORS.primary, trend = null, mlPrediction = null }) => (
  <div className="bg-white rounded-lg shadow-md p-6 border-l-4 relative overflow-hidden" style={{ borderColor: color }}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">
          {format === 'currency' ? formatCurrencyByContext(value, 'card') : 
           format === 'percentage' ? `${value.toFixed(1)}%` :
           typeof value === 'number' ? value.toLocaleString() : value}
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

// Navigation Component - Updated to remove products and customers tabs

export const Navigation = ({ activeTab, setActiveTab }) => (
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
              { id: 'visitplanner', label: 'Visit Planner', icon: MapPin },
              { id: 'forecasting', label: 'Demand Forecasting', icon: BarChart3 }
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
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
        <XAxis 
          dataKey="month" 
          tickFormatter={(value) => {
            // Format date strings like "2025-01" to "Jan 25"
            if (value && value.includes('-')) {
              const [year, month] = value.split('-');
              const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              return `${monthNames[parseInt(month) - 1]} ${year.slice(-2)}`;
            }
            return value;
          }}
        />
        <YAxis 
          tickFormatter={(value) => formatCurrencyByContext(value, 'chart')}
        />
        <Tooltip 
          formatter={(value, name) => [
            value ? formatCurrencyByContext(value, 'tooltip') : 'N/A',
            name === 'actual' ? 'Actual Revenue' : 'ML Prediction'
          ]}
          labelFormatter={(label) => {
            // Format tooltip label
            if (label && label.includes('-')) {
              const [year, month] = label.split('-');
              const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                                'July', 'August', 'September', 'October', 'November', 'December'];
              return `${monthNames[parseInt(month) - 1]} ${year}`;
            }
            return label;
          }}
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

export const FulfillmentChart = ({ data, filters, setFilters }) => {
  const selectedFulfillment = filters?.selectedFulfillment;

  const handleSegmentClick = (dataPoint) => {
    if (!dataPoint || !dataPoint.name) return; // dataPoint is the payload object from recharts

    const clickedSegmentName = dataPoint.name;

    setFilters(prev => ({
      ...prev,
      selectedFulfillment: selectedFulfillment === clickedSegmentName ? null : clickedSegmentName
    }));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Order Fulfillment {selectedFulfillment ? `(${selectedFulfillment})` : ''}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={100} // Increased outerRadius for better visual
            innerRadius={50}  // Added innerRadius to make it a Donut chart, looks nicer
            dataKey="value"
            onClick={handleSegmentClick} // dataPoint payload is passed here
            className="cursor-pointer"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={index === 0 ? COLORS.primary : COLORS.secondary}
                // Apply visual indication for selection
                fillOpacity={selectedFulfillment && entry.name !== selectedFulfillment ? 0.5 : 1}
                stroke={selectedFulfillment === entry.name ? (index === 0 ? '#357ABD' : '#40BFA0') : '#fff'} // Hardcoded darker shades
                strokeWidth={selectedFulfillment === entry.name ? 3 : 1}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};


