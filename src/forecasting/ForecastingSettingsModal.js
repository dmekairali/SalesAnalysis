import React, { useState } from 'react';
import { 
  Settings, 
  X, 
  Save, 
  RotateCcw,
  AlertCircle,
  TrendingUp,
  Calendar,
  Target,
  Shield,
  Database
} from 'lucide-react';

const ForecastingSettingsModal = ({ isOpen, onClose, onSave }) => {
  const [settings, setSettings] = useState({
    // Forecast Parameters
    defaultForecastMonths: 6,
    confidenceLevel: 0.95,
    includeSeasonality: true,
    includeTrends: true,
    safetyStockMultiplier: 1.15,
    
    // Display Preferences
    defaultView: 'forecast', // 'forecast' or 'performance'
    showDetailsDefault: false,
    autoRefresh: false,
    refreshInterval: 30, // minutes
    activeProductsOnly: true, // active products only of products table

    
    // Data Quality
    minDataPointsRequired: 3,
    outlierDetection: true,
    dataQualityThreshold: 0.7,
    
    // Notifications
    enableAlerts: true,
    highRiskThreshold: 0.3,
    lowConfidenceThreshold: 0.6,
    
    // Export Settings
    exportFormat: 'csv',
    includeConfidenceIntervals: true,
    includeBusinessInsights: true
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  const handleReset = () => {
    setSettings({
      defaultForecastMonths: 6,
      confidenceLevel: 0.95,
      includeSeasonality: true,
      includeTrends: true,
      safetyStockMultiplier: 1.15,
      defaultView: 'forecast',
      showDetailsDefault: false,
      autoRefresh: false,
      refreshInterval: 30,
      activeProductsOnly: true,
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
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl w-full max-w-xs sm:max-w-md md:max-w-4xl h-[95vh] md:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header - Mobile Responsive */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 flex-shrink-0">
          <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
            <div className="p-1.5 md:p-2 bg-blue-500 rounded-lg flex-shrink-0">
              <Settings className="h-4 w-4 md:h-5 md:w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg md:text-xl font-bold text-slate-900 truncate">Forecasting Settings</h2>
              <p className="text-xs md:text-sm text-slate-600 hidden sm:block">Configure forecasting parameters and preferences</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 flex-shrink-0"
          >
            <X className="h-4 w-4 md:h-5 md:w-5" />
          </button>
        </div>

        {/* Content - Mobile Responsive Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            
            {/* Forecast Parameters */}
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-center space-x-2 mb-3 md:mb-4">
                <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                <h3 className="text-base md:text-lg font-semibold text-slate-900">Forecast Parameters</h3>
              </div>
              
              <div>
                <label className="block text-xs md:text-sm font-medium text-slate-700 mb-2">
                  Default Forecast Period
                </label>
                <select
                  value={settings.defaultForecastMonths}
                  onChange={(e) => handleSettingChange('defaultForecastMonths', Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm md:text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={1}>1 Month</option>
                  <option value={3}>3 Months</option>
                  <option value={6}>6 Months</option>
                  <option value={12}>12 Months</option>
                </select>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-slate-700 mb-2">
                  Confidence Level: {(settings.confidenceLevel * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0.8"
                  max="0.99"
                  step="0.01"
                  value={settings.confidenceLevel}
                  onChange={(e) => handleSettingChange('confidenceLevel', Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>80%</span>
                  <span>99%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-slate-700 mb-2">
                  Safety Stock Multiplier: {settings.safetyStockMultiplier.toFixed(2)}x
                </label>
                <input
                  type="range"
                  min="1.0"
                  max="2.0"
                  step="0.05"
                  value={settings.safetyStockMultiplier}
                  onChange={(e) => handleSettingChange('safetyStockMultiplier', Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>1.0x</span>
                  <span>2.0x</span>
                </div>
              </div>

              <div className="space-y-2 md:space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="includeSeasonality"
                    checked={settings.includeSeasonality}
                    onChange={(e) => handleSettingChange('includeSeasonality', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                  />
                  <label htmlFor="includeSeasonality" className="ml-2 text-xs md:text-sm text-slate-700">
                    Include Seasonality Analysis
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="includeTrends"
                    checked={settings.includeTrends}
                    onChange={(e) => handleSettingChange('includeTrends', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                  />
                  <label htmlFor="includeTrends" className="ml-2 text-xs md:text-sm text-slate-700">
                    Include Trend Analysis
                  </label>
                </div>
              </div>
            </div>

            {/* Display Preferences */}
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-center space-x-2 mb-3 md:mb-4">
                <Calendar className="h-4 w-4 md:h-5 md:w-5 text-emerald-600" />
                <h3 className="text-base md:text-lg font-semibold text-slate-900">Display Preferences</h3>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-slate-700 mb-2">
                  Default View Mode
                </label>
                <select
                  value={settings.defaultView}
                  onChange={(e) => handleSettingChange('defaultView', e.target.value)}
                  className="w-full px-3 py-2 text-sm md:text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="forecast">Forecast View</option>
                  <option value="performance">Performance Analytics</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showDetailsDefault"
                  checked={settings.showDetailsDefault}
                  onChange={(e) => handleSettingChange('showDetailsDefault', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                />
                <label htmlFor="showDetailsDefault" className="ml-2 text-xs md:text-sm text-slate-700">
                  Show detailed view by default
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoRefresh"
                  checked={settings.autoRefresh}
                  onChange={(e) => handleSettingChange('autoRefresh', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                />
                <label htmlFor="autoRefresh" className="ml-2 text-xs md:text-sm text-slate-700">
                  Enable auto-refresh
                </label>
              </div>

              {settings.autoRefresh && (
                <div>
                  <label className="block text-xs md:text-sm font-medium text-slate-700 mb-2">
                    Refresh Interval: {settings.refreshInterval} minutes
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="60"
                    step="5"
                    value={settings.refreshInterval}
                    onChange={(e) => handleSettingChange('refreshInterval', Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>5 min</span>
                    <span>60 min</span>
                  </div>
                </div>
              )}
            </div>

          
{/* NEW CONTROL - Active products only */}
<div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
  <div className="flex items-center">
    <input
      type="checkbox"
      id="activeProductsOnly"
      checked={settings.activeProductsOnly}
      onChange={(e) => handleSettingChange('activeProductsOnly', e.target.checked)}
      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
    />
    <label htmlFor="activeProductsOnly" className="ml-3 flex flex-col">
      <span className="text-sm font-medium text-slate-700">Active products only</span>
      <span className="text-xs text-slate-500">Filter out discontinued and inactive products</span>
    </label>
  </div>
  <div className="flex items-center">
    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
      settings.activeProductsOnly 
        ? 'bg-green-100 text-green-700' 
        : 'bg-slate-100 text-slate-600'
    }`}>
      {settings.activeProductsOnly ? 'Filtered' : 'All Products'}
    </span>
  </div>
</div>

            {/* Data Quality */}
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-center space-x-2 mb-3 md:mb-4">
                <Database className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
                <h3 className="text-base md:text-lg font-semibold text-slate-900">Data Quality</h3>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-slate-700 mb-2">
                  Minimum Data Points Required: {settings.minDataPointsRequired}
                </label>
                <input
                  type="range"
                  min="1"
                  max="12"
                  step="1"
                  value={settings.minDataPointsRequired}
                  onChange={(e) => handleSettingChange('minDataPointsRequired', Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>1 month</span>
                  <span>12 months</span>
                </div>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-slate-700 mb-2">
                  Data Quality Threshold: {(settings.dataQualityThreshold * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="0.95"
                  step="0.05"
                  value={settings.dataQualityThreshold}
                  onChange={(e) => handleSettingChange('dataQualityThreshold', Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>50%</span>
                  <span>95%</span>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="outlierDetection"
                  checked={settings.outlierDetection}
                  onChange={(e) => handleSettingChange('outlierDetection', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                />
                <label htmlFor="outlierDetection" className="ml-2 text-xs md:text-sm text-slate-700">
                  Enable outlier detection
                </label>
              </div>
            </div>

            {/* Alerts & Notifications */}
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-center space-x-2 mb-3 md:mb-4">
                <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-amber-600" />
                <h3 className="text-base md:text-lg font-semibold text-slate-900">Alerts & Notifications</h3>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableAlerts"
                  checked={settings.enableAlerts}
                  onChange={(e) => handleSettingChange('enableAlerts', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                />
                <label htmlFor="enableAlerts" className="ml-2 text-xs md:text-sm text-slate-700">
                  Enable risk alerts
                </label>
              </div>

              {settings.enableAlerts && (
                <>
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-slate-700 mb-2">
                      High Risk Threshold: {(settings.highRiskThreshold * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="0.5"
                      step="0.05"
                      value={settings.highRiskThreshold}
                      onChange={(e) => handleSettingChange('highRiskThreshold', Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-medium text-slate-700 mb-2">
                      Low Confidence Alert: {(settings.lowConfidenceThreshold * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="0.9"
                      step="0.05"
                      value={settings.lowConfidenceThreshold}
                      onChange={(e) => handleSettingChange('lowConfidenceThreshold', Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer - Mobile Responsive */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 md:p-6 border-t border-slate-200 bg-slate-50 flex-shrink-0 space-y-3 sm:space-y-0">
          <button
            onClick={handleReset}
            className="w-full sm:w-auto flex items-center justify-center px-3 md:px-4 py-2 text-xs md:text-sm text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RotateCcw className="h-3 w-3 md:h-4 md:w-4 mr-2" />
            Reset to Defaults
          </button>
          
          <div className="flex w-full sm:w-auto space-x-3">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-3 md:px-4 py-2 text-xs md:text-sm text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 sm:flex-none flex items-center justify-center px-3 md:px-4 py-2 text-xs md:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="h-3 w-3 md:h-4 md:w-4 mr-2" />
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForecastingSettingsModal;
