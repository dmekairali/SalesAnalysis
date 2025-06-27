
// ========================================
// 2. src/forecasting/DistributorForecastDashboard.js
// ========================================
import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { forecastingAPI } from './ForecastingAPI';
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  Calendar,
  BarChart3,
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  Eye,
  ShoppingCart,
  Target,
  Activity,
  Zap,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Settings,
  FileText,
  Users,
  Building2
} from 'lucide-react';

import ForecastingSettingsModal from './ForecastingSettingsModal';


// Add state for settings
const [showSettings, setShowSettings] = useState(false);
const [settings, setSettings] = useState({
    defaultForecastMonths: 6,
    confidenceLevel: 0.95,
    includeSeasonality: true,
    includeTrends: true,
    safetyStockMultiplier: 1.15,
    defaultView: 'forecast',
    showDetailsDefault: false,
    autoRefresh: false,
    refreshInterval: 30,
    minDataPointsRequired: 3,
    outlierDetection: true,
    dataQualityThreshold: 0.7,
    enableAlerts: true,
    highRiskThreshold: 0.3,
    lowConfidenceThreshold: 0.6,
    exportFormat: 'csv',
    includeConfidenceIntervals: true,
    includeBusinessInsights: true
  });

const DistributorForecastDashboard = () => {
  const { user } = useAuth();
  const [selectedDistributor, setSelectedDistributor] = useState('');
  const [forecastMonths, setForecastMonths] = useState(3);
  const [loading, setLoading] = useState(false);
  const [forecastData, setForecastData] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('forecast');
  const [activeDistributors, setActiveDistributors] = useState([]);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'predicted_quantity', direction: 'descending' });
  const [filters, setFilters] = useState({});

  // Fetch active distributors on component mount
  useEffect(() => {
    const loadDistributors = async () => {
      try {
        const distributors = await forecastingAPI.fetchActiveDistributors();
        setActiveDistributors(distributors);
      } catch (err) {
        setError('Failed to load distributors');
        console.error('Error loading distributors:', err);
      }
    };

    loadDistributors();
  }, []);

  const fetchForecastData = async () => {
    if (!selectedDistributor) {
      setError('Please select a distributor');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch both forecast and performance data
      const [forecastResult, performanceResult] = await Promise.all([
        forecastingAPI.generateProductForecast(selectedDistributor, null, forecastMonths),
        forecastingAPI.getProductPerformance(selectedDistributor, 12)
      ]);

      if (forecastResult.success) {
        // Sort forecast data by predicted_quantity in descending order
        const sortedData = forecastResult.data.sort((a, b) => b.predicted_quantity - a.predicted_quantity);
        setForecastData(sortedData);
      } else {
        throw new Error(forecastResult.error || 'Failed to generate forecast');
      }

      if (performanceResult.success) {
        setPerformanceData(performanceResult.data);
      } else {
        console.warn('Performance data not available:', performanceResult.error);
        setPerformanceData([]);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching forecast data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!selectedDistributor) return;
    
    try {
      await forecastingAPI.exportForecastData(selectedDistributor, forecastMonths);
    } catch (err) {
      setError('Failed to export data');
      console.error('Export error:', err);
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'HIGH': return 'text-red-700 bg-red-50 border-red-200';
      case 'MEDIUM': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'LOW': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getVelocityColor = (velocity) => {
    switch (velocity) {
      case 'Fast Moving': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'Medium Moving': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'Slow Moving': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'Very Slow Moving': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getGrowthIcon = (rate) => {
    if (rate > 5) return <ArrowUpRight className="h-4 w-4 text-emerald-600" />;
    if (rate < -5) return <ArrowDownRight className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  // Calculate summary metrics
  const totalPredictedValue = forecastData.reduce((sum, item) => sum + (item.predicted_value || 0), 0);
  const totalPredictedQty = forecastData.reduce((sum, item) => sum + (item.predicted_quantity || 0), 0);
  const totalProducts = new Set(forecastData.map(item => item.variant_code)).size;
  const highRiskProducts = forecastData.filter(item => item.risk_level === 'HIGH').length;
  const avgConfidence = forecastData.reduce((sum, item) => sum + (item.confidence_score || 0), 0) / (forecastData.length || 1);
  const avgGrowthRate = forecastData.reduce((sum, item) => sum + (item.growth_rate || 0), 0) / (forecastData.length || 1);

  const selectedDistributorData = activeDistributors.find(d => d.distributor_code === selectedDistributor);

  // Group forecast data by month
  const forecastByMonth = forecastData.reduce((acc, item) => {
    const month = item.forecast_month;
    if (!acc[month]) acc[month] = [];
    acc[month].push(item);
    return acc;
  }, {});

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = (data, config) => {
    if (!config.key) return data;

    return [...data].sort((a, b) => {
      // Handle cases where values might be null or undefined for robust sorting
      const valA = a[config.key];
      const valB = b[config.key];

      if (valA === null || valA === undefined) return config.direction === 'ascending' ? -1 : 1;
      if (valB === null || valB === undefined) return config.direction === 'ascending' ? 1 : -1;

      if (valA < valB) {
        return config.direction === 'ascending' ? -1 : 1;
      }
      if (valA > valB) {
        return config.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  };

  const sortedForecastData = (products) => sortedData(products, sortConfig);
  const sortedPerformanceData = () => sortedData(performanceData, sortConfig);


  const handleFilterChange = (column, value) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [column]: value,
    }));
  };

  const filteredForecastData = (products) => {
    return products.filter(product => {
      return Object.keys(filters).every(key => {
        const filterValue = filters[key];
        if (!filterValue) return true;
        return String(product[key]).toLowerCase().includes(filterValue.toLowerCase());
      });
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        
        {/* Professional Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Demand Forecasting Hub</h1>
                <p className="text-slate-600 mt-1">AI-powered product demand prediction and inventory planning</p>
                {user && (
                  <p className="text-sm text-slate-500 mt-1">Welcome, {user.full_name}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button 
  onClick={() => setShowSettings(true)}
  className="flex items-center px-4 py-2.5 text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all duration-200"
>
  <Settings className="h-4 w-4 mr-2" />
  Settings
</button>
              <button 
                onClick={handleExport}
                disabled={!selectedDistributor || forecastData.length === 0}
                className="flex items-center px-4 py-2.5 text-emerald-600 bg-emerald-100 rounded-xl hover:bg-emerald-200 disabled:opacity-50 transition-all duration-200"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </button>
              <button 
                onClick={fetchForecastData}
                disabled={!selectedDistributor || loading}
                className="flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Generating...' : 'Generate Forecast'}
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Enhanced Filters */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
          <div className="flex items-center mb-6">
            <Filter className="h-5 w-5 text-slate-600 mr-2" />
            <h3 className="text-lg font-semibold text-slate-900">Forecast Configuration</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Distributor Selection */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Select Distributor Partner
              </label>
              <div className="relative">
                <select
                  value={selectedDistributor}
                  onChange={(e) => setSelectedDistributor(e.target.value)}
                  className="w-full pl-4 pr-12 py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 shadow-sm transition-all duration-200"
                >
                  <option value="">Choose distributor partner...</option>
                  {activeDistributors.map((dist) => (
                    <option key={dist.distributor_code} value={dist.distributor_code}>
                      {dist.distributor_name} • {dist.territory}
                    </option>
                  ))}
                </select>
                <Building2 className="absolute right-4 top-4 h-5 w-5 text-slate-400" />
              </div>
              {selectedDistributorData && (
                <div className="mt-2 flex items-center space-x-3 text-sm">
                  <span className="text-slate-600">Region: {selectedDistributorData.region}</span>
                  <span className="text-slate-400">•</span>
                  <span className="px-2 py-1 rounded-lg text-xs font-medium bg-emerald-100 text-emerald-700">
                    {selectedDistributorData.status}
                  </span>
                </div>
              )}
            </div>

            {/* Forecast Period */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Forecast Horizon
              </label>
              <select
                value={forecastMonths}
                onChange={(e) => setForecastMonths(Number(e.target.value))}
                className="w-full px-4 py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
              >
                <option value={1}>1 Month Ahead</option>
                <option value={3}>3 Months Ahead</option>
                <option value={6}>6 Months Ahead</option>
                <option value={12}>12 Months Ahead</option>
              </select>
            </div>

            {/* View Options */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Display Mode
              </label>
              <div className="flex rounded-xl border border-slate-300 bg-slate-50 p-1">
                <button
                  onClick={() => setActiveTab('forecast')}
                  className={`flex-1 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    activeTab === 'forecast' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Forecast
                </button>
                <button
                  onClick={() => setActiveTab('performance')}
                  className={`flex-1 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    activeTab === 'performance' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Analytics
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced KPI Cards */}
        {forecastData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg border border-blue-200 p-6">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-blue-600">Total Products</p>
                  <p className="text-3xl font-bold text-blue-900">{totalProducts}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl shadow-lg border border-emerald-200 p-6">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-emerald-500 rounded-xl shadow-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-emerald-600">Predicted Value</p>
                  <p className="text-3xl font-bold text-emerald-900">₹{(totalPredictedValue/1000).toFixed(0)}K</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl shadow-lg border border-purple-200 p-6">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-purple-500 rounded-xl shadow-lg">
                  <ShoppingCart className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-purple-600">Total Quantity</p>
                  <p className="text-3xl font-bold text-purple-900">{totalPredictedQty}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-lg border border-amber-200 p-6">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-amber-500 rounded-xl shadow-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-amber-600">Avg Confidence</p>
                  <p className="text-3xl font-bold text-amber-900">{(avgConfidence * 100).toFixed(0)}%</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl shadow-lg border border-rose-200 p-6">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-rose-500 rounded-xl shadow-lg">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-rose-600">Avg Growth</p>
                  <p className="text-3xl font-bold text-rose-900">{avgGrowthRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content - Truncated for brevity, but includes full forecast table and performance analytics */}
        {!selectedDistributor ? (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-16 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl mx-auto mb-6 flex items-center justify-center">
              <Building2 className="h-12 w-12 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Select Your Distributor Partner</h3>
            <p className="text-slate-600 text-lg max-w-md mx-auto">
              Choose a distributor from the dropdown to generate AI-powered product demand forecasts and insights
            </p>
          </div>
        ) : forecastData.length === 0 && !loading ? (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-16 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-2xl mx-auto mb-6 flex items-center justify-center">
              <Calendar className="h-12 w-12 text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Ready to Generate Forecast</h3>
            <p className="text-slate-600 text-lg mb-6 max-w-md mx-auto">
              Click "Generate Forecast" to create AI-powered demand predictions for {selectedDistributorData?.distributor_name}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Forecast Table */}
            {activeTab === 'forecast' && Object.entries(forecastByMonth).map(([month, products]) => (
              <div key={month} className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-8 py-6 border-b border-slate-200">
                  <h3 className="text-xl font-bold text-slate-900">
                    {new Date(month).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                  </h3>
                  <p className="text-slate-600 mt-1">
                    {products.length} products • Total Value: ₹{products.reduce((sum, p) => sum + (p.predicted_value || 0), 0).toLocaleString()}
                  </p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-8 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                          <div onClick={() => requestSort('product_description')} className="cursor-pointer">Product Details {sortConfig.key === 'product_description' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}</div>
                          <input type="text" placeholder="Filter..." onChange={(e) => handleFilterChange('product_description', e.target.value)} className="mt-1 p-1 border rounded w-full" />
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('predicted_quantity')}>
Predicted Qty {sortConfig.key === 'predicted_quantity' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('predicted_value')}>
Predicted Value {sortConfig.key === 'predicted_value' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                          <div onClick={() => requestSort('category')} className="cursor-pointer">Category {sortConfig.key === 'category' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}</div>
                          <input type="text" placeholder="Filter..." onChange={(e) => handleFilterChange('category', e.target.value)} className="mt-1 p-1 border rounded w-full" />
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('confidence_score')}>
Confidence {sortConfig.key === 'confidence_score' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                          <div onClick={() => requestSort('risk_level')} className="cursor-pointer">Risk Level {sortConfig.key === 'risk_level' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}</div>
                          <input type="text" placeholder="Filter..." onChange={(e) => handleFilterChange('risk_level', e.target.value)} className="mt-1 p-1 border rounded w-full" />
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sortedForecastData(filteredForecastData(products)).map((product, index) => (
                        <tr key={index} className="hover:bg-slate-50 transition-colors">
                          <td className="px-8 py-6">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-xl flex items-center justify-center">
                                <Package className="h-6 w-6 text-blue-600" />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-slate-900">{product.product_description}</div>
                                <div className="text-xs text-slate-500 mt-1">{product.variant_code} • {product.size_display}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-6 text-right">
                            <div className="text-lg font-bold text-slate-900">{product.predicted_quantity}</div>
                            <div className="text-xs text-slate-500">units</div>
                          </td>
                          <td className="px-6 py-6 text-right">
                            <div className="text-lg font-bold text-slate-900">₹{(product.predicted_value || 0).toLocaleString()}</div>
                            <div className="text-xs text-slate-500">@₹{product.unit_price}</div>
                          </td>
                          <td className="px-6 py-6 text-left">
                            <span className="text-sm text-slate-900">{product.category}</span>
                          </td>
                          <td className="px-6 py-6 text-center">
                            <div className="inline-flex items-center space-x-1">
                              <div className={`w-3 h-3 rounded-full ${
                                (product.confidence_score || 0) >= 0.9 ? 'bg-emerald-400' :
                                (product.confidence_score || 0) >= 0.8 ? 'bg-amber-400' : 'bg-red-400'
                              }`}></div>
                              <span className="text-sm font-semibold text-slate-900">
                                {((product.confidence_score || 0) * 100).toFixed(0)}%
                              </span>
                            </div>
                          </td>
                         


                             <td className="px-6 py-6 text-center">
                            <span className={`inline-flex px-3 py-1.5 text-xs font-bold rounded-xl border ${getRiskColor(product.risk_level)}`}>
                              {product.risk_level}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {/* Performance Analytics Tab */}
            {activeTab === 'performance' && (
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-50 to-purple-50 px-8 py-6 border-b border-slate-200">
                  <h3 className="text-xl font-bold text-slate-900">Historical Performance Analytics</h3>
                  <p className="text-slate-600 mt-1">Product performance trends and velocity analysis</p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-8 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('product_description')}>Product {sortConfig.key === 'product_description' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('avg_monthly_quantity')}>Avg Monthly {sortConfig.key === 'avg_monthly_quantity' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('total_value_sold')}>Total Value {sortConfig.key === 'total_value_sold' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('growth_rate')}>Growth Trend {sortConfig.key === 'growth_rate' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('stock_velocity')}>Velocity {sortConfig.key === 'stock_velocity' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('product_status')}>Status {sortConfig.key === 'product_status' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sortedPerformanceData().map((product, index) => (
                        <tr key={index} className="hover:bg-slate-50 transition-colors">
                          <td className="px-8 py-6">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-200 rounded-xl flex items-center justify-center">
                                <Activity className="h-6 w-6 text-purple-600" />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-slate-900">{product.product_description}</div>
                                <div className="text-xs text-slate-500 mt-1">{product.variant_code}</div>
                                <div className="text-xs text-slate-400">{product.category}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-6 text-right">
                            <div className="text-lg font-bold text-slate-900">{(product.avg_monthly_quantity || 0).toFixed(1)}</div>
                            <div className="text-xs text-slate-500">units/month</div>
                          </td>
                          <td className="px-6 py-6 text-right">
                            <div className="text-lg font-bold text-slate-900">₹{(product.total_value_sold || 0).toLocaleString()}</div>
                            <div className="text-xs text-slate-500">{product.total_months_sold} months</div>
                          </td>
                          <td className="px-6 py-6 text-center">
                            <div className="inline-flex items-center space-x-2">
                              {getGrowthIcon(product.growth_rate || 0)}
                              <span className={`text-sm font-bold ${
                                (product.growth_rate || 0) >= 5 ? 'text-emerald-600' :
                                (product.growth_rate || 0) <= -5 ? 'text-red-600' : 'text-slate-600'
                              }`}>
                                {(product.growth_rate || 0) >= 0 ? '+' : ''}{(product.growth_rate || 0).toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-6 text-center">
                            <span className={`inline-flex px-3 py-1.5 text-xs font-bold rounded-xl border ${getVelocityColor(product.stock_velocity)}`}>
                              {product.stock_velocity}
                            </span>
                          </td>
                          <td className="px-6 py-6 text-center">
                            <span className={`inline-flex px-3 py-1.5 text-xs font-bold rounded-xl ${
                              product.product_status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              product.product_status === 'Regular' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              'bg-amber-50 text-amber-700 border-amber-200'
                            } border`}>
                              {product.product_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}



        {/* Footer */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-600">
                Forecast generated using AI-powered time series analysis • Last updated: {new Date().toLocaleString()}
              </span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-slate-500">
              <span>Powered by Advanced Analytics Engine</span>
              <span>•</span>
              <span>© 2025 AyurML Forecasting</span>
            </div>
          </div>
        </div>
      </div>
    </div>

{/* 5. ADD: Modal at the end */}
      <ForecastingSettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={handleSettingsSave}
      />
    </div>
  );
};

export default DistributorForecastDashboard;
