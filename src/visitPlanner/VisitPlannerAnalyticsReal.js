// src/visitPlanner/VisitPlannerAnalyticsReal.js - COMPLETE VERSION WITH CURRENCY FORMATTING AND MOBILE RESPONSIVENESS

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  Star, 
  MapPin, 
  Users, 
  Target, 
  Brain,
  Calendar,
  DollarSign,
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  Zap,
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  RefreshCw,
  Download,
  Phone
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  ComposedChart,
  Area
} from 'recharts';

import { formatIndianCurrency, formatCurrencyByContext } from '../data.js';

// Import the analytics engine
import { visitAnalyticsEngine } from './VisitAnalyticsEngine';

const VisitPlannerAnalyticsReal = ({ mrName = "RAJESH KUMAR" }) => {
  const [activeInsightTab, setActiveInsightTab] = useState('performance');
  const [selectedTimeframe, setSelectedTimeframe] = useState('3months');
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState(null);

  // Colors for charts
  const colors = {
    primary: '#10b981',
    secondary: '#3b82f6', 
    warning: '#f59e0b',
    danger: '#ef4444',
    success: '#22c55e'
  };

  // Load analytics data
  useEffect(() => {
    if (mrName) {
      loadAnalytics();
    }
  }, [mrName, selectedTimeframe]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`🔄 Loading analytics for ${mrName} - ${selectedTimeframe}`);
      
      const result = await visitAnalyticsEngine.generateAnalytics(mrName, selectedTimeframe);
      
      if (result.success) {
        setAnalytics(result.analytics);
        console.log('✅ Analytics loaded successfully');
      } else {
        setError(result.error);
        console.error('❌ Analytics loading failed:', result.error);
      }
    } catch (err) {
      setError(err.message);
      console.error('❌ Analytics loading error:', err);
    }
    
    setLoading(false);
  };

  // Performance Tab Component - Mobile Responsive
  const PerformanceTab = () => {
    if (!analytics?.performanceComparison) return <LoadingState />;
    
    const { efficiency_metrics, monthly_comparison } = analytics.performanceComparison;

    return (
      <div className="space-y-4 md:space-y-6">
        {/* KPI Cards - Mobile Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-600">Total Visits</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{efficiency_metrics.total_visits}</p>
                <p className="text-xs text-green-600">{efficiency_metrics.successful_visits} successful</p>
              </div>
              <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-600">Conversion Rate</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{efficiency_metrics.conversion_rate.toFixed(1)}%</p>
                <p className="text-xs text-blue-600 hidden sm:block">Visit to order conversion</p>
                <p className="text-xs text-blue-600 sm:hidden">Conversion</p>
              </div>
              <Target className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-600">Total Revenue</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{formatCurrencyByContext(efficiency_metrics.total_revenue, 'card')}</p>
                <p className="text-xs text-purple-600">Last {selectedTimeframe}</p>
              </div>
              <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border-l-4 border-orange-500 col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-600">Avg per Visit</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{formatCurrencyByContext(efficiency_metrics.avg_revenue_per_visit, 'card')}</p>
                <p className="text-xs text-orange-600 hidden sm:block">All visits average</p>
                <p className="text-xs text-orange-600 sm:hidden">Average</p>
              </div>
              <MapPin className="h-6 w-6 md:h-8 md:w-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Monthly Comparison Chart - Mobile Responsive */}
        {monthly_comparison.length > 0 && (
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center">
              <BarChart3 className="h-4 w-4 md:h-5 md:w-5 mr-2" />
              Monthly Performance Trends
            </h3>
            <div className="h-64 md:h-80 lg:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthly_comparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      // Format month strings like "2025-01" to "Jan 25"
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
                    yAxisId="left"
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Visits', angle: -90, position: 'insideLeft' }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => formatCurrencyByContext(value, 'chart')}
                    label={{ value: 'Revenue', angle: 90, position: 'insideRight' }}
                  />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name.includes('revenue')) {
                        return [formatCurrencyByContext(value, 'tooltip'), name.replace('_', ' ').toUpperCase()];
                      }
                      return [value, name.replace('_', ' ').toUpperCase()];
                    }}
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
                  <Legend />
                  <Bar yAxisId="left" dataKey="planned_visits" fill={colors.primary} name="Planned Visits" />
                  <Bar yAxisId="left" dataKey="actual_visits" fill={colors.secondary} name="Actual Visits" />
                  <Line yAxisId="right" type="monotone" dataKey="actual_revenue" stroke={colors.warning} strokeWidth={3} name="Revenue" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Red Flags Tab Component - Mobile Responsive
  const RedFlagsTab = () => {
    if (!analytics?.redFlagCustomers) return <LoadingState />;
    
    const redFlagCustomers = analytics.redFlagCustomers;

    return (
      <div className="space-y-4 md:space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-red-600 mr-2" />
            <h3 className="font-semibold text-sm md:text-base text-red-800">High-Risk Customers Identified</h3>
          </div>
          <p className="text-xs md:text-sm text-red-700 mt-1">
            {redFlagCustomers.length} customers showing concerning patterns: multiple visits with low business conversion
          </p>
        </div>

        {redFlagCustomers.length === 0 ? (
          <div className="bg-white p-8 md:p-12 rounded-lg shadow-md text-center">
            <CheckCircle className="h-12 w-12 md:h-16 md:w-16 text-green-500 mx-auto mb-3 md:mb-4" />
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">No Red Flag Customers</h3>
            <p className="text-sm md:text-base text-gray-600">All customers are performing well! Keep up the excellent work.</p>
          </div>
        ) : (
          <div className="grid gap-3 md:gap-4">
            {redFlagCustomers.map((customer, index) => (
              <div key={index} className="bg-white border border-red-200 rounded-lg p-4 md:p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 md:mb-4 space-y-2 sm:space-y-0">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-base md:text-lg text-gray-900 truncate">{customer.customer_name || 'Unknown Customer'}</h4>
                    <p className="text-xs md:text-sm text-gray-600 truncate">{customer.customer_type || 'Unknown Type'} • {customer.area || 'Unknown Area'}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-medium ${
                      customer.risk_score >= 85 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      Risk Score: {customer.risk_score}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-3 md:mb-4">
                  <div className="bg-gray-50 p-2 md:p-3 rounded">
                    <p className="text-xs text-gray-600">Total Visits</p>
                    <p className="text-sm md:text-lg font-bold text-gray-900">{customer.total_visits_3m}</p>
                  </div>
                  <div className="bg-gray-50 p-2 md:p-3 rounded">
                    <p className="text-xs text-gray-600">Total Orders</p>
                    <p className="text-sm md:text-lg font-bold text-red-600">{customer.total_orders_3m}</p>
                  </div>
                  <div className="bg-gray-50 p-2 md:p-3 rounded">
                    <p className="text-xs text-gray-600">Revenue</p>
                    <p className="text-sm md:text-lg font-bold text-gray-900">{formatCurrencyByContext(customer.total_revenue_3m, 'table')}</p>
                  </div>
                  <div className="bg-gray-50 p-2 md:p-3 rounded">
                    <p className="text-xs text-gray-600">Conversion Rate</p>
                    <p className="text-sm md:text-lg font-bold text-red-600">{customer.conversion_rate.toFixed(1)}%</p>
                  </div>
                </div>

                <div className="mb-3 md:mb-4">
                  <h5 className="font-medium text-sm md:text-base text-gray-900 mb-2">Issues Identified:</h5>
                  <div className="flex flex-wrap gap-1 md:gap-2">
                    {customer.issues.map((issue, idx) => (
                      <span key={idx} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                        {issue}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs md:text-sm text-gray-600 mb-3 space-y-1 sm:space-y-0">
                  <span>Last Visit: {customer.last_visit}</span>
                  <span>Last Order: {customer.last_order || 'No recent orders'}</span>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-xs md:text-sm font-medium text-blue-800 mb-1">🤖 AI Recommendation:</p>
                  <p className="text-xs md:text-sm text-blue-700">
                    {customer.risk_score >= 90 
                      ? "High priority: Schedule immediate strategic review meeting. Consider reducing visit frequency and investigating specific customer needs."
                      : customer.risk_score >= 80 
                      ? "Medium priority: Implement account recovery strategy. Focus on understanding customer challenges and improving value proposition."
                      : "Monitor closely: Adjust approach and consider product portfolio review. Track for improvement over next month."
                    }
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Golden Clients Tab Component - Mobile Responsive
  const GoldenClientsTab = () => {
    if (!analytics?.goldenClients) return <LoadingState />;
    
    const goldenClients = analytics.goldenClients;

    return (
      <div className="space-y-4 md:space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 md:p-4">
          <div className="flex items-center">
            <Star className="h-4 w-4 md:h-5 md:w-5 text-yellow-600 mr-2" />
            <h3 className="font-semibold text-sm md:text-base text-yellow-800">Golden Clients - Top Performers</h3>
          </div>
          <p className="text-xs md:text-sm text-yellow-700 mt-1">
            {goldenClients.length} high-value customers driving exceptional business growth
          </p>
        </div>

        {goldenClients.length === 0 ? (
          <div className="bg-white p-8 md:p-12 rounded-lg shadow-md text-center">
            <Star className="h-12 w-12 md:h-16 md:w-16 text-yellow-500 mx-auto mb-3 md:mb-4" />
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">No Golden Clients Yet</h3>
            <p className="text-sm md:text-base text-gray-600">Work on building stronger relationships to identify high-value customers.</p>
          </div>
        ) : (
          <div className="grid gap-3 md:gap-4">
            {goldenClients.map((client, index) => (
              <div key={index} className="bg-white border border-yellow-200 rounded-lg p-4 md:p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 md:mb-4 space-y-2 sm:space-y-0">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-base md:text-lg text-gray-900 flex items-center">
                      <Star className="h-4 w-4 md:h-5 md:w-5 text-yellow-500 mr-2 flex-shrink-0" />
                      <span className="truncate">{client.customer_name || 'Unknown Customer'}</span>
                    </h4>
                    <p className="text-xs md:text-sm text-gray-600 truncate">{client.customer_type || 'Unknown Type'} • {client.area || 'Unknown Area'}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="px-2 md:px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                      Loyalty Score: {client.loyalty_score}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-3 md:mb-4">
                  <div className="bg-green-50 p-2 md:p-3 rounded">
                    <p className="text-xs text-gray-600">Total Visits</p>
                    <p className="text-sm md:text-lg font-bold text-green-600">{client.total_visits_3m}</p>
                  </div>
                  <div className="bg-green-50 p-2 md:p-3 rounded">
                    <p className="text-xs text-gray-600">Total Orders</p>
                    <p className="text-sm md:text-lg font-bold text-green-600">{client.total_orders_3m}</p>
                  </div>
                  <div className="bg-green-50 p-2 md:p-3 rounded">
                    <p className="text-xs text-gray-600">Revenue</p>
                    <p className="text-sm md:text-lg font-bold text-green-600">{formatCurrencyByContext(client.total_revenue_3m, 'table')}</p>
                  </div>
                  <div className="bg-green-50 p-2 md:p-3 rounded">
                    <p className="text-xs text-gray-600">Conversion Rate</p>
                    <p className="text-sm md:text-lg font-bold text-green-600">{client.conversion_rate.toFixed(1)}%</p>
                  </div>
                </div>

                <div className="mb-3 md:mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-sm md:text-base text-gray-900">Growth Rate</h5>
                    <span className="text-base md:text-lg font-bold text-green-600">+{client.growth_rate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(client.growth_rate * 2, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="mb-3 md:mb-4">
                  <h5 className="font-medium text-sm md:text-base text-gray-900 mb-2">Key Strengths:</h5>
                  <div className="flex flex-wrap gap-1 md:gap-2">
                    {client.strengths.map((strength, idx) => (
                      <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        {strength}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs md:text-sm text-gray-600 mb-3 space-y-1 sm:space-y-0">
                  <span>Last Visit: {client.last_visit}</span>
                  <span>Last Order: {client.last_order}</span>
                </div>

                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <p className="text-xs md:text-sm font-medium text-green-800 mb-1">🌟 Engagement Strategy:</p>
                  <p className="text-xs md:text-sm text-green-700">
                    Maintain high-touch relationship. Consider exclusive product previews, priority support, and strategic partnership discussions.
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Area Optimization Tab Component - Mobile Responsive
  const AreaOptimizationTab = () => {
    if (!analytics?.areaAnalysis) return <LoadingState />;
    
    const areaAnalysis = analytics.areaAnalysis;

    return (
      <div className="space-y-4 md:space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4">
          <div className="flex items-center">
            <MapPin className="h-4 w-4 md:h-5 md:w-5 text-blue-600 mr-2" />
            <h3 className="font-semibold text-sm md:text-base text-blue-800">Territory Analysis & Optimization</h3>
          </div>
          <p className="text-xs md:text-sm text-blue-700 mt-1">
            Comprehensive area-wise performance analysis with growth opportunities and strategic recommendations
          </p>
        </div>

        <div className="grid gap-4 md:gap-6">
          {areaAnalysis.map((area, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-4 md:p-6 border">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 md:mb-4 space-y-2 sm:space-y-0">
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-lg md:text-xl text-gray-900 truncate">{area.area_name}</h4>
                  <p className="text-xs md:text-sm text-gray-600">
                    {area.active_customers} active customers • {area.city}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-medium ${
                    area.growth_potential === 'High' ? 'bg-green-100 text-green-800' : 
                    area.growth_potential === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {area.growth_potential} Potential
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
                <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Total Revenue</p>
                  <p className="text-sm md:text-lg font-bold text-gray-900">{formatCurrencyByContext(area.revenue_3m, 'card')}</p>
                  <p className="text-xs text-gray-600 truncate">{formatCurrencyByContext(area.avg_revenue_per_customer, 'table')} avg/customer</p>
                </div>
                <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Success Rate</p>
                  <p className="text-sm md:text-lg font-bold text-gray-900">{area.efficiency_score.toFixed(1)}%</p>
                  <p className="text-xs text-gray-600">{area.total_visits} total visits</p>
                </div>
                <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Market Saturation</p>
                  <p className="text-sm md:text-lg font-bold text-gray-900">{area.saturation_level}%</p>
                  <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                    <div 
                      className="bg-blue-500 h-1 rounded-full transition-all duration-500" 
                      style={{ width: `${area.saturation_level}%` }}
                    ></div>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Untapped Potential</p>
                  <p className="text-sm md:text-lg font-bold text-green-600">{formatCurrencyByContext(area.untapped_potential, 'card')}</p>
                  <p className="text-xs text-gray-600">Estimated opportunity</p>
                </div>
              </div>

              <div className="mb-3 md:mb-4">
                <h5 className="font-medium text-sm md:text-base text-gray-900 mb-2 md:mb-3">🤖 AI Recommendations:</h5>
                <div className="space-y-1 md:space-y-2">
                  {area.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start">
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-blue-500 rounded-full mt-2 mr-2 md:mr-3 flex-shrink-0"></div>
                      <p className="text-xs md:text-sm text-gray-700">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-3 md:mt-4">
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <p className="text-xs md:text-sm font-medium text-green-800">Strengths</p>
                  <p className="text-xs text-green-700 mt-1">
                    {area.efficiency_score >= 70 ? "High success rate & strong relationships" : 
                     area.saturation_level >= 60 ? "Good market presence" : 
                     "Growing market with potential"}
                  </p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded p-3">
                  <p className="text-xs md:text-sm font-medium text-orange-800">Focus Areas</p>
                  <p className="text-xs text-orange-700 mt-1">
                    {area.growth_potential === 'High' ? "Expand customer base & increase frequency" :
                     area.efficiency_score < 50 ? "Improve conversion rates & route planning" :
                     "Maintain excellence & strategic growth"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Visit Patterns Tab Component - Mobile Responsive
  const VisitPatternsTab = () => {
    if (!analytics?.visitPatterns) return <LoadingState />;
    
    const { optimal_frequency, time_analysis } = analytics.visitPatterns;

    return (
      <div className="space-y-4 md:space-y-6">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 md:p-4">
          <div className="flex items-center">
            <Clock className="h-4 w-4 md:h-5 md:w-5 text-purple-600 mr-2" />
            <h3 className="font-semibold text-sm md:text-base text-purple-800">Visit Pattern Intelligence</h3>
          </div>
          <p className="text-xs md:text-sm text-purple-700 mt-1">
            Optimize visit frequency and timing based on customer behavior analysis and success patterns
          </p>
        </div>

        {/* Optimal Frequency Analysis - Mobile Responsive Table */}
        {optimal_frequency.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h4 className="font-semibold text-base md:text-lg mb-3 md:mb-4 flex items-center">
              <Calendar className="h-4 w-4 md:h-5 md:w-5 mr-2" />
              Visit Frequency Optimization
            </h4>
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <div className="min-w-full inline-block align-middle">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer Type</th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Recommended</th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Avg</th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Gap Analysis</th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {optimal_frequency.map((pattern, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 md:px-4 py-3 md:py-4 text-xs md:text-sm font-medium text-gray-900">{pattern.customer_type}</td>
                        <td className="px-3 md:px-4 py-3 md:py-4 text-xs md:text-sm text-gray-600">{pattern.recommended_frequency}</td>
                        <td className="px-3 md:px-4 py-3 md:py-4 text-xs md:text-sm text-gray-600">{pattern.current_avg}</td>
                        <td className="px-3 md:px-4 py-3 md:py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            pattern.gap_analysis === 'Optimal' ? 'bg-green-100 text-green-800' :
                            pattern.gap_analysis === 'Good' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {pattern.gap_analysis}
                          </span>
                        </td>
                        <td className="px-3 md:px-4 py-3 md:py-4 text-xs md:text-sm text-gray-600">
                          {pattern.gap_analysis === 'Too infrequent' ? '↑ Increase frequency' :
                           pattern.gap_analysis === 'Too frequent' ? '↓ Reduce frequency' :
                           '✓ Maintain current'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Time Slot Analysis - Mobile Responsive */}
        {time_analysis.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h4 className="font-semibold text-base md:text-lg mb-3 md:mb-4 flex items-center">
              <Clock className="h-4 w-4 md:h-5 md:w-5 mr-2" />
              Optimal Visit Time Analysis
            </h4>
            <div className="grid gap-3 md:gap-4">
              {time_analysis.map((timeSlot, index) => (
                <div key={index} className="border rounded-lg p-3 md:p-4 hover:shadow-sm transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 md:mb-3 space-y-2 sm:space-y-0">
                    <h5 className="font-medium text-sm md:text-base text-gray-900">{timeSlot.time_slot}</h5>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0">
                      <span className="text-xs md:text-sm text-gray-600">
                        Success: <span className="font-semibold">{timeSlot.success_rate}%</span>
                      </span>
                      <span className="text-xs md:text-sm text-gray-600">
                        Avg Order: <span className="font-semibold">{formatCurrencyByContext(timeSlot.avg_order, 'table')}</span>
                      </span>
                    </div>
                  </div>
                  <div className="mb-2 md:mb-3">
                    <div className="w-full bg-gray-200 rounded-full h-2 md:h-3">
                      <div 
                        className={`h-2 md:h-3 rounded-full transition-all duration-500 ${
                          timeSlot.success_rate >= 70 ? 'bg-green-500' :
                          timeSlot.success_rate >= 50 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${timeSlot.success_rate}%` }}
                      ></div>
                    </div>
                  </div>
                  <p className="text-xs md:text-sm text-gray-700">{timeSlot.recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // OnCallOrdersTab component - Mobile Responsive
  const OnCallOrdersTab = () => {
    if (!analytics?.onCallOrders) return <LoadingState />;
    
    const { summary, customers, insights } = analytics.onCallOrders;

    return (
      <div className="space-y-4 md:space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4">
          <div className="flex items-center">
            <Phone className="h-4 w-4 md:h-5 md:w-5 text-blue-600 mr-2" />
            <h3 className="font-semibold text-sm md:text-base text-blue-800">On-Call Orders Analysis</h3>
          </div>
          <p className="text-xs md:text-sm text-blue-700 mt-1">
            Orders placed without corresponding visits - analyzing phone-based sales patterns
          </p>
        </div>

        {/* Summary Cards - Mobile Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-600">On-Call Customers</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{summary.total_on_call_customers || 0}</p>
                <p className="text-xs text-blue-600">{summary.total_on_call_orders || 0} total orders</p>
              </div>
              <Phone className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-600">On-Call Revenue</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{formatCurrencyByContext(summary.total_on_call_revenue || 0, 'card')}</p>
                <p className="text-xs text-green-600">{summary.total_revenue_percentage || 0}% of total</p>
              </div>
              <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-600">Avg Order Value</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{formatCurrencyByContext(summary.avg_order_value || 0, 'card')}</p>
                <p className="text-xs text-purple-600">Phone orders</p>
              </div>
              <Target className="h-6 w-6 md:h-8 md:w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border-l-4 border-orange-500 col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-600">Phone-Only</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{summary.phone_only_customers || 0}</p>
                <p className="text-xs text-orange-600">Never visited</p>
              </div>
              <Users className="h-6 w-6 md:h-8 md:w-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Customer Categories - Mobile Responsive */}
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
          <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Customer Categories</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <div className="border rounded-lg p-3 md:p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm md:text-base text-gray-900">Phone-Only Customers</h4>
                <span className="text-xl md:text-2xl font-bold text-blue-600">{summary.phone_only_customers || 0}</span>
              </div>
              <p className="text-xs md:text-sm text-gray-600">Customers who never had visits but place orders regularly</p>
              <div className="mt-2 text-xs text-blue-700 bg-blue-50 p-2 rounded">
                💡 Consider virtual relationship strategies
              </div>
            </div>

            <div className="border rounded-lg p-3 md:p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm md:text-base text-gray-900">Lost Touch Customers</h4>
                <span className="text-xl md:text-2xl font-bold text-yellow-600">{summary.lost_touch_customers || 0}</span>
              </div>
              <p className="text-xs md:text-sm text-gray-600">Customers still ordering but no visits in 90+ days</p>
              <div className="mt-2 text-xs text-yellow-700 bg-yellow-50 p-2 rounded">
                ⚠️ Schedule visits to maintain relationships
              </div>
            </div>

            <div className="border rounded-lg p-3 md:p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm md:text-base text-gray-900">Frequent On-Call</h4>
                <span className="text-xl md:text-2xl font-bold text-green-600">{summary.frequent_on_call_customers || 0}</span>
              </div>
              <p className="text-xs md:text-sm text-gray-600">Customers with 5+ phone orders</p>
              <div className="mt-2 text-xs text-green-700 bg-green-50 p-2 rounded">
                ✅ Strong phone relationship established
              </div>
            </div>
          </div>
        </div>

        {/* Customer List - Mobile Responsive Table */}
        {customers.length > 0 && (
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">On-Call Customers Details</h3>
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <div className="min-w-full inline-block align-middle">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Avg Order</th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Last Visit</th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Preference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {customers.slice(0, 20).map((customer, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 md:px-4 py-3 md:py-4">
                          <div>
                            <div className="text-xs md:text-sm font-medium text-gray-900 truncate max-w-32 md:max-w-none">{customer.customer_name}</div>
                            <div className="text-xs text-gray-500 truncate">{customer.city}, {customer.state}</div>
                          </div>
                        </td>
                        <td className="px-3 md:px-4 py-3 md:py-4 text-xs md:text-sm text-gray-600">{customer.customer_type}</td>
                        <td className="px-3 md:px-4 py-3 md:py-4 text-xs md:text-sm font-medium text-gray-900">{customer.total_on_call_orders}</td>
                        <td className="px-3 md:px-4 py-3 md:py-4 text-xs md:text-sm font-semibold text-green-600">{formatCurrencyByContext(customer.total_on_call_revenue, 'table')}</td>
                        <td className="px-3 md:px-4 py-3 md:py-4 text-xs md:text-sm text-gray-600 hidden sm:table-cell">{formatCurrencyByContext(customer.avg_order_value, 'table')}</td>
                        <td className="px-3 md:px-4 py-3 md:py-4 text-xs md:text-sm text-gray-600 hidden lg:table-cell">
                          {customer.last_visit_date ? (
                            <div>
                              <div>{customer.last_visit_date}</div>
                              <div className="text-xs text-gray-400">{customer.days_since_last_visit} days ago</div>
                            </div>
                          ) : (
                            <span className="text-red-500">Never visited</span>
                          )}
                        </td>
                        <td className="px-3 md:px-4 py-3 md:py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            customer.customer_preference === 'Phone-Only Customer' ? 'bg-blue-100 text-blue-800' :
                            customer.customer_preference === 'Lost Touch Customer' ? 'bg-yellow-100 text-yellow-800' :
                            customer.customer_preference === 'Frequent On-Call Customer' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            <span className="hidden md:inline">{customer.customer_preference}</span>
                            <span className="md:hidden">
                              {customer.customer_preference === 'Phone-Only Customer' ? 'Phone-Only' :
                               customer.customer_preference === 'Lost Touch Customer' ? 'Lost Touch' :
                               customer.customer_preference === 'Frequent On-Call Customer' ? 'Frequent' :
                               'Other'}
                            </span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {customers.length > 20 && (
              <div className="mt-3 md:mt-4 text-center text-xs md:text-sm text-gray-500">
                Showing top 20 of {customers.length} on-call customers
              </div>
            )}
          </div>
        )}

        {/* Insights - Mobile Responsive */}
        {insights.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {insights.map((insight, index) => (
              <div key={index} className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3 md:p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm md:text-base text-gray-800 truncate mr-2">{insight.title}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${
                    insight.type === 'risk' ? 'bg-red-100 text-red-800' :
                    insight.type === 'revenue' ? 'bg-green-100 text-green-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {insight.type.toUpperCase()}
                  </span>
                </div>
                <p className="text-xl md:text-2xl font-bold text-blue-600 mb-1">{insight.value}</p>
                <p className="text-xs md:text-sm text-gray-600 mb-2 md:mb-3">{insight.description}</p>
                <p className="text-xs text-blue-600 font-medium">💡 {insight.recommendation}</p>
              </div>
            ))}
          </div>
        )}

        {customers.length === 0 && (
          <div className="bg-white p-8 md:p-12 rounded-lg shadow-md text-center">
            <Phone className="h-12 w-12 md:h-16 md:w-16 text-gray-400 mx-auto mb-3 md:mb-4" />
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">No On-Call Orders Found</h3>
            <p className="text-sm md:text-base text-gray-600">All orders in this period had corresponding visits. Excellent field coverage!</p>
          </div>
        )}
      </div>
    );
  };

  // Loading State Component - Mobile Responsive
  const LoadingState = () => (
    <div className="bg-white p-8 md:p-12 rounded-lg shadow-md text-center">
      <RefreshCw className="h-8 w-8 md:h-12 md:w-12 text-blue-600 animate-spin mx-auto mb-3 md:mb-4" />
      <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">Loading Analytics...</h3>
      <p className="text-sm md:text-base text-gray-600">Analyzing visit data and generating insights...</p>
    </div>
  );

  // Error State Component - Mobile Responsive
  const ErrorState = () => (
    <div className="bg-white p-8 md:p-12 rounded-lg shadow-md text-center">
      <XCircle className="h-8 w-8 md:h-12 md:w-12 text-red-500 mx-auto mb-3 md:mb-4" />
      <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">Error Loading Analytics</h3>
      <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4">{error}</p>
      <button
        onClick={loadAnalytics}
        className="px-4 py-2 text-sm md:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  );

  const tabConfig = [
    { id: 'performance', label: 'Performance Analysis', icon: TrendingUp, component: PerformanceTab, shortLabel: 'Performance' },
    { id: 'redflags', label: 'Red Flags', icon: AlertTriangle, component: RedFlagsTab, shortLabel: 'Red Flags' },
    { id: 'golden', label: 'Golden Clients', icon: Star, component: GoldenClientsTab, shortLabel: 'Golden' },
    { id: 'areas', label: 'Area Optimization', icon: MapPin, component: AreaOptimizationTab, shortLabel: 'Areas' },
    { id: 'patterns', label: 'Visit Patterns', icon: Clock, component: VisitPatternsTab, shortLabel: 'Patterns' },
    { id: 'oncall', label: 'On-Call Orders', icon: Phone, component: OnCallOrdersTab, shortLabel: 'On-Call' }
  ];

  // Main loading state
  if (loading && !analytics) {
    return <LoadingState />;
  }

  // Error state
  if (error && !analytics) {
    return <ErrorState />;
  }

  return (
    <div className="space-y-4 md:space-y-6 p-3 md:p-0">
      {/* Header - Mobile Responsive */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <div className="flex flex-col space-y-3 md:flex-row md:justify-between md:items-center md:space-y-0">
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-gray-900 flex items-center">
              <Brain className="h-5 w-5 md:h-6 md:w-6 mr-2 text-purple-600" />
              Analytics & Insights Dashboard
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              Comprehensive visit planning analysis for {mrName} - Last {selectedTimeframe}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <select 
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              disabled={loading}
              className="px-3 py-2 border border-gray-300 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            >
              <option value="1month">Last 1 Month</option>
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
            </select>
            <button 
              onClick={loadAnalytics}
              disabled={loading}
              className="px-3 md:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs md:text-sm disabled:opacity-50 flex items-center justify-center"
            >
              <RefreshCw className={`h-3 w-3 md:h-4 md:w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Loading...' : 'Refresh'}
            </button>
            <button className="px-3 md:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs md:text-sm flex items-center justify-center">
              <Download className="h-3 w-3 md:h-4 md:w-4 mr-1" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation - Mobile Responsive */}
      <div className="bg-white rounded-lg shadow-md p-1">
        <div className="flex flex-wrap gap-1">
          {tabConfig.map(({ id, label, icon: Icon, shortLabel }) => (
            <button
              key={id}
              onClick={() => setActiveInsightTab(id)}
              className={`flex items-center px-2 md:px-4 py-2 md:py-3 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                activeInsightTab === id
                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              {/* Show short label on mobile, full label on desktop */}
              <span className="md:hidden">{shortLabel}</span>
              <span className="hidden md:inline">{label}</span>
              {id === 'redflags' && analytics?.redFlagCustomers && (
                <span className="ml-1 md:ml-2 px-1.5 md:px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">
                  {analytics.redFlagCustomers.length}
                </span>
              )}
              {id === 'golden' && analytics?.goldenClients && (
                <span className="ml-1 md:ml-2 px-1.5 md:px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                  {analytics.goldenClients.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {loading ? (
          <LoadingState />
        ) : (
          tabConfig.find(tab => tab.id === activeInsightTab)?.component()
        )}
      </div>

      {/* AI-Powered Insights Summary - Mobile Responsive */}
      {analytics?.aiInsights && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center">
            <Brain className="h-4 w-4 md:h-5 md:w-5 mr-2 text-purple-600" />
            🤖 AI-Powered Strategic Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="bg-white border border-purple-100 rounded-lg p-3 md:p-4">
              <h4 className="font-medium text-sm md:text-base text-purple-900 mb-2">Key Opportunities</h4>
              <ul className="text-xs md:text-sm text-purple-800 space-y-1">
                {analytics.aiInsights.key_opportunities.map((opportunity, index) => (
                  <li key={index}>• {opportunity}</li>
                ))}
              </ul>
            </div>
            <div className="bg-white border border-purple-100 rounded-lg p-3 md:p-4">
              <h4 className="font-medium text-sm md:text-base text-purple-900 mb-2">Action Items</h4>
              <ul className="text-xs md:text-sm text-purple-800 space-y-1">
                {analytics.aiInsights.action_items.map((action, index) => (
                  <li key={index}>• {action}</li>
                ))}
              </ul>
            </div>
            {analytics.aiInsights.strategic_recommendations && (
              <div className="bg-white border border-purple-100 rounded-lg p-3 md:p-4">
                <h4 className="font-medium text-sm md:text-base text-purple-900 mb-2">Strategic Recommendations</h4>
                <ul className="text-xs md:text-sm text-purple-800 space-y-1">
                  {analytics.aiInsights.strategic_recommendations.map((rec, index) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
            {analytics.aiInsights.risk_alerts && analytics.aiInsights.risk_alerts.length > 0 && (
              <div className="bg-white border border-red-100 rounded-lg p-3 md:p-4">
                <h4 className="font-medium text-sm md:text-base text-red-900 mb-2">🚨 Risk Alerts</h4>
                <ul className="text-xs md:text-sm text-red-800 space-y-1">
                  {analytics.aiInsights.risk_alerts.map((alert, index) => (
                    <li key={index}>• {alert}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Performance Summary Footer - Mobile Responsive */}
      {analytics && (
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-center">
            <div className="border-r border-gray-200 last:border-r-0 pr-3 md:pr-0">
              <p className="text-lg md:text-2xl font-bold text-green-600">
                {analytics.performanceComparison?.efficiency_metrics?.total_visits || 0}
              </p>
              <p className="text-xs md:text-sm text-gray-600">Total Visits Analyzed</p>
            </div>
            <div className="border-r border-gray-200 last:border-r-0 pr-3 md:pr-0">
              <p className="text-lg md:text-2xl font-bold text-red-600">
                {analytics.redFlagCustomers?.length || 0}
              </p>
              <p className="text-xs md:text-sm text-gray-600">Red Flag Customers</p>
            </div>
            <div className="border-r border-gray-200 last:border-r-0 pr-3 md:pr-0">
              <p className="text-lg md:text-2xl font-bold text-yellow-600">
                {analytics.goldenClients?.length || 0}
              </p>
              <p className="text-xs md:text-sm text-gray-600">Golden Clients</p>
            </div>
            <div>
              <p className="text-lg md:text-2xl font-bold text-purple-600">
                {analytics.areaAnalysis?.length || 0}
              </p>
              <p className="text-xs md:text-sm text-gray-600">Areas Analyzed</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitPlannerAnalyticsReal;
