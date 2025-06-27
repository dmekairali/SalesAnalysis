// 1. src/forecasting/ForecastingAPI.js
// ========================================
import { createClient } from '@supabase/supabase-js';
import { getCache, setCache } from '../utils/cache.js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

/**
 * Forecasting API Integration Class
 */
export class ForecastingAPI {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Fetch active distributors from distributor_list table
   */
  async fetchActiveDistributors() {
    const cacheKey = 'active_distributors';
    const cached = getCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const { data, error } = await supabase
        .from('distributor_list')
        .select('*')
        .eq('status', 'Active')
        .order('distributor_name');

      if (error) throw error;

      const distributors = data || [];
      setCache(cacheKey, distributors, 300000); // Cache for 5 minutes
      return distributors;
    } catch (error) {
      console.error('Error fetching active distributors:', error);
      return [];
    }
  }

  /**
   * Generate product demand forecast using SQL function
   */
  /**
 * Generate product demand forecast using SQL function
 */
async generateProductForecast(distributorCode, variantCode = null, forecastMonths = 6, activeProductsOnly = true) {
  const cacheKey = `forecast_${distributorCode}_${variantCode || 'all'}_${forecastMonths}_${activeProductsOnly}`;
  const cached = getCache(cacheKey);
  
  if (cached) {
    return cached;
  }

  try {
    console.log(`Generating forecast for distributor: ${distributorCode}, months: ${forecastMonths}`);

    const { data, error } = await supabase.rpc('predict_distributor_product_demand', {
      p_distributor_code: distributorCode,
      p_variant_code: variantCode,
      p_forecast_months: forecastMonths,
      p_confidence_level: 0.95,
      p_include_seasonality: true,
      p_include_trends: true,
      p_active_products_only: activeProductsOnly
    });

    if (error) throw error;

    const result = {
      success: true,
      data: data || [],
      timestamp: new Date().toISOString(),
      distributorCode,
      forecastMonths
    };

    setCache(cacheKey, result, 1800000); // Cache for 30 minutes
    return result;
  } catch (error) {
    console.error('Error generating forecast:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
}

/**
 * Get product performance summary
 */
async getProductPerformance(distributorCode, monthsBack = 12, activeProductsOnly = true) {
  const cacheKey = `performance_${distributorCode}_${monthsBack}_${activeProductsOnly}`;
  const cached = getCache(cacheKey);
  
  if (cached) {
    return cached;
  }

  try {
    const { data, error } = await supabase.rpc('get_distributor_product_performance', {
      p_distributor_code: distributorCode,
      p_months_back: monthsBack,
      p_active_products_only: activeProductsOnly
    });

    if (error) throw error;

    const result = {
      success: true,
      data: data || [],
      timestamp: new Date().toISOString()
    };

    setCache(cacheKey, result, 600000); // Cache for 10 minutes
    return result;
  } catch (error) {
    console.error('Error fetching product performance:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
}

  /**
   * Get forecast accuracy metrics
   */
  async getForecastAccuracy(distributorCode) {
    try {
      const { data, error } = await supabase
        .from('distributor_forecast_tracking')
        .select('*')
        .eq('distributor_code', distributorCode)
        .not('actual_quantity', 'is', null)
        .order('forecast_date', { ascending: false })
        .limit(50);

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('Error fetching forecast accuracy:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Export forecast data to CSV
   */
  async exportForecastData(distributorCode, forecastMonths) {
    try {
      const forecast = await this.generateProductForecast(distributorCode, null, forecastMonths);
      
      if (!forecast.success) {
        throw new Error('Failed to generate forecast for export');
      }

      const csvData = this.convertToCSV(forecast.data);
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `forecast_${distributorCode}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error('Error exporting forecast data:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Convert forecast data to CSV format
   */
  convertToCSV(data) {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => 
          JSON.stringify(row[header] || '')
        ).join(',')
      )
    ].join('\n');

    return csvContent;
  }
}

// Export singleton instance
export const forecastingAPI = new ForecastingAPI();
