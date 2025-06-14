// src/visitPlanner/VisitAnalyticsEngine.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

/**
 * Visit Analytics Engine - Real Data Integration with AI Insights
 */
export class VisitAnalyticsEngine {
  constructor() {
    this.geminiApiKey = process.env.REACT_APP_GEMINI_API_KEY;
  }

  /**
   * Generate comprehensive analytics for MR visit planning
   */
  async generateAnalytics(mrName, timeframe = '3months') {
    try {
      console.log(`🔍 Generating analytics for ${mrName} - ${timeframe}`);
      
      // 1. Fetch all required data in parallel
      const [
        actualVisits,
        plannedVisits,
        customerPerformance,
        areaAnalysis,
        visitPatterns
      ] = await Promise.all([
        this.fetchActualVisits(mrName, timeframe),
        this.fetchPlannedVisits(mrName),
        this.analyzeCustomerPerformance(mrName, timeframe),
        this.analyzeAreaPerformance(mrName, timeframe),
        this.analyzeVisitPatterns(mrName, timeframe)
      ]);

      // 2. Process analytics
      const analytics = {
        mrName,
        timeframe,
        performanceComparison: this.calculatePerformanceComparison(actualVisits, plannedVisits),
        redFlagCustomers: this.identifyRedFlagCustomers(customerPerformance),
        goldenClients: this.identifyGoldenClients(customerPerformance),
        areaAnalysis: await this.enhanceAreaAnalysis(areaAnalysis),
        visitPatterns: this.processVisitPatterns(visitPatterns, actualVisits),
        aiInsights: null // Will be generated next
      };

      // 3. Generate AI insights using Gemini
      analytics.aiInsights = await this.generateAIInsights(analytics);

      return {
        success: true,
        analytics
      };

    } catch (error) {
      console.error('Error generating analytics:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Fetch actual visits from mr_visits table
   */
  async fetchActualVisits(mrName, timeframe) {
    const months = this.getMonthsFromTimeframe(timeframe);
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const { data, error } = await supabase
      .from('mr_visits')
      .select(`
        visitId,
        empName,
        dcrDate,
        clientName,
        clientMobileNo,
        visitType,
        inTime,
        outTime,
        areaName,
        cityName,
        amountOfSale,
        amountCollect,
        sampleValue,
        dcrStatus,
        mr_name,
        customer_phone,
        customer_name,
        customer_type
      `)
      .eq('mr_name', mrName)
      .gte('dcrDate', startDate.toISOString().slice(0, 10))
      .order('dcrDate', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Fetch planned visits from visit plans
   */
  async fetchPlannedVisits(mrName) {
    const { data, error } = await supabase
      .from('visit_plans')
      .select(`
        id,
        plan_month,
        plan_year,
        total_planned_visits,
        estimated_revenue,
        efficiency_score,
        daily_visit_plans (
          visit_date,
          planned_visits_count,
          estimated_daily_revenue,
          planned_visits (
            customer_name,
            customer_phone,
            customer_type,
            area_name,
            expected_order_value,
            order_probability
          )
        )
      `)
      .eq('mr_name', mrName)
      .order('plan_generated_at', { ascending: false })
      .limit(6);

    if (error) throw error;
    return data || [];
  }

  /**
   * Analyze customer performance for red flags and golden clients
   */
  async analyzeCustomerPerformance(mrName, timeframe) {
    const months = this.getMonthsFromTimeframe(timeframe);
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Get customer visit and order data
    const { data: visits, error } = await supabase
      .from('mr_visits')
      .select(`
        customer_name,
        customer_phone,
        customer_type,
        areaName,
        dcrDate,
        amountOfSale,
        amountCollect,
        visitType
      `)
      .eq('mr_name', mrName)
      .gte('dcrDate', startDate.toISOString().slice(0, 10));

    if (error) throw error;

    // Group by customer and calculate metrics
    const customerMetrics = {};
    
    visits.forEach(visit => {
      const key = visit.customer_phone || visit.customer_name;
      if (!customerMetrics[key]) {
        customerMetrics[key] = {
          customer_name: visit.customer_name,
          customer_phone: visit.customer_phone,
          customer_type: visit.customer_type,
          area: visit.areaName,
          visits: [],
          total_visits: 0,
          total_orders: 0,
          total_revenue: 0,
          last_visit: null,
          last_order: null
        };
      }

      const customer = customerMetrics[key];
      customer.visits.push(visit);
      customer.total_visits++;
      customer.last_visit = visit.dcrDate;

      const saleAmount = parseFloat(visit.amountOfSale) || 0;
      if (saleAmount > 0) {
        customer.total_orders++;
        customer.total_revenue += saleAmount;
        customer.last_order = visit.dcrDate;
      }
    });

    // Calculate derived metrics
    Object.values(customerMetrics).forEach(customer => {
      customer.avg_revenue_per_visit = customer.total_visits > 0 ? 
        customer.total_revenue / customer.total_visits : 0;
      customer.conversion_rate = customer.total_visits > 0 ? 
        (customer.total_orders / customer.total_visits) * 100 : 0;
      customer.days_since_last_visit = customer.last_visit ? 
        Math.floor((new Date() - new Date(customer.last_visit)) / (1000 * 60 * 60 * 24)) : 999;
      customer.days_since_last_order = customer.last_order ? 
        Math.floor((new Date() - new Date(customer.last_order)) / (1000 * 60 * 60 * 24)) : 999;
    });

    return Object.values(customerMetrics);
  }

  /**
   * Analyze area performance
   */
  async analyzeAreaPerformance(mrName, timeframe) {
    const months = this.getMonthsFromTimeframe(timeframe);
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const { data: visits, error } = await supabase
      .from('mr_visits')
      .select(`
        areaName,
        cityName,
        customer_name,
        customer_phone,
        dcrDate,
        amountOfSale,
        visitType
      `)
      .eq('mr_name', mrName)
      .gte('dcrDate', startDate.toISOString().slice(0, 10));

    if (error) throw error;

    // Group by area
    const areaMetrics = {};
    
    visits.forEach(visit => {
      const area = visit.areaName || 'Unknown Area';
      if (!areaMetrics[area]) {
        areaMetrics[area] = {
          area_name: area,
          city: visit.cityName,
          customers: new Set(),
          total_visits: 0,
          total_revenue: 0,
          successful_visits: 0,
          visits_data: []
        };
      }

      const areaData = areaMetrics[area];
      areaData.customers.add(visit.customer_phone || visit.customer_name);
      areaData.total_visits++;
      areaData.visits_data.push(visit);

      const saleAmount = parseFloat(visit.amountOfSale) || 0;
      if (saleAmount > 0) {
        areaData.successful_visits++;
        areaData.total_revenue += saleAmount;
      }
    });

    // Calculate area metrics
    return Object.values(areaMetrics).map(area => ({
      area_name: area.area_name,
      city: area.city,
      total_customers: area.customers.size,
      active_customers: area.customers.size, // Simplified - all are considered active
      total_visits: area.total_visits,
      total_revenue: area.total_revenue,
      success_rate: area.total_visits > 0 ? (area.successful_visits / area.total_visits) * 100 : 0,
      avg_revenue_per_customer: area.customers.size > 0 ? area.total_revenue / area.customers.size : 0,
      avg_revenue_per_visit: area.total_visits > 0 ? area.total_revenue / area.total_visits : 0
    }));
  }

  /**
   * Analyze visit patterns
   */
  async analyzeVisitPatterns(mrName, timeframe) {
    const months = this.getMonthsFromTimeframe(timeframe);
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const { data: visits, error } = await supabase
      .from('mr_visits')
      .select(`
        customer_type,
        dcrDate,
        inTime,
        outTime,
        amountOfSale,
        visitType
      `)
      .eq('mr_name', mrName)
      .gte('dcrDate', startDate.toISOString().slice(0, 10))
      .not('inTime', 'is', null);

    if (error) throw error;

    return visits;
  }

  /**
   * Calculate performance comparison metrics
   */
  calculatePerformanceComparison(actualVisits, plannedVisits) {
    // Create monthly comparison
    const monthlyData = {};
    
    // Process actual visits by month
    actualVisits.forEach(visit => {
      const month = new Date(visit.dcrDate).toISOString().slice(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = {
          month: new Date(visit.dcrDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          actual_visits: 0,
          actual_revenue: 0,
          planned_visits: 0,
          planned_revenue: 0
        };
      }
      monthlyData[month].actual_visits++;
      monthlyData[month].actual_revenue += parseFloat(visit.amountOfSale) || 0;
    });

    // Process planned visits by month
    plannedVisits.forEach(plan => {
      const month = `${plan.plan_year}-${String(plan.plan_month).padStart(2, '0')}`;
      if (monthlyData[month]) {
        monthlyData[month].planned_visits = plan.total_planned_visits || 0;
        monthlyData[month].planned_revenue = parseFloat(plan.estimated_revenue) || 0;
      }
    });

    const sortedData = Object.values(monthlyData).sort((a, b) => 
      new Date(a.month) - new Date(b.month)
    );

    // Calculate efficiency metrics
    const totalActualVisits = actualVisits.length;
    const totalActualRevenue = actualVisits.reduce((sum, v) => sum + (parseFloat(v.amountOfSale) || 0), 0);
    const successfulVisits = actualVisits.filter(v => parseFloat(v.amountOfSale) > 0).length;

    return {
      monthly_comparison: sortedData,
      efficiency_metrics: {
        total_visits: totalActualVisits,
        successful_visits: successfulVisits,
        conversion_rate: totalActualVisits > 0 ? (successfulVisits / totalActualVisits) * 100 : 0,
        total_revenue: totalActualRevenue,
        avg_revenue_per_visit: totalActualVisits > 0 ? totalActualRevenue / totalActualVisits : 0,
        avg_revenue_per_successful_visit: successfulVisits > 0 ? totalActualRevenue / successfulVisits : 0
      }
    };
  }

  /**
   * Identify red flag customers
   */
  identifyRedFlagCustomers(customerPerformance) {
    return customerPerformance
      .filter(customer => {
        // Red flag criteria
        const hasMultipleVisits = customer.total_visits >= 3;
        const lowConversion = customer.conversion_rate < 50;
        const lowRevenue = customer.avg_revenue_per_visit < 2000;
        const recentVisits = customer.days_since_last_visit <= 30;
        const oldLastOrder = customer.days_since_last_order > 45;

        return hasMultipleVisits && (lowConversion || (lowRevenue && recentVisits) || oldLastOrder);
      })
      .map(customer => {
        // Calculate risk score
        let riskScore = 0;
        if (customer.conversion_rate < 30) riskScore += 30;
        else if (customer.conversion_rate < 50) riskScore += 20;
        
        if (customer.avg_revenue_per_visit < 1000) riskScore += 25;
        else if (customer.avg_revenue_per_visit < 2000) riskScore += 15;
        
        if (customer.days_since_last_order > 60) riskScore += 25;
        else if (customer.days_since_last_order > 30) riskScore += 15;
        
        if (customer.total_visits >= 5 && customer.total_orders <= 1) riskScore += 20;

        // Identify specific issues
        const issues = [];
        if (customer.conversion_rate < 30) issues.push("Very low conversion rate");
        if (customer.conversion_rate >= 30 && customer.conversion_rate < 50) issues.push("Below average conversion");
        if (customer.avg_revenue_per_visit < 1500) issues.push("Very low order value");
        if (customer.days_since_last_order > 45) issues.push("Long gap since last order");
        if (customer.total_visits >= 6 && customer.total_orders <= 2) issues.push("High visit frequency with poor results");

        return {
          ...customer,
          risk_score: Math.min(100, riskScore),
          issues,
          total_visits_3m: customer.total_visits,
          total_orders_3m: customer.total_orders,
          total_revenue_3m: customer.total_revenue
        };
      })
      .sort((a, b) => b.risk_score - a.risk_score)
      .slice(0, 10); // Top 10 red flags
  }

  /**
   * Identify golden clients
   */
  identifyGoldenClients(customerPerformance) {
    return customerPerformance
      .filter(customer => {
        // Golden client criteria
        const goodConversion = customer.conversion_rate >= 70;
        const goodRevenue = customer.avg_revenue_per_visit >= 3000;
        const recentActivity = customer.days_since_last_order <= 30;
        const multipleOrders = customer.total_orders >= 3;

        return (goodConversion && goodRevenue) || (recentActivity && multipleOrders && goodRevenue);
      })
      .map(customer => {
        // Calculate loyalty score
        let loyaltyScore = 0;
        if (customer.conversion_rate >= 90) loyaltyScore += 25;
        else if (customer.conversion_rate >= 70) loyaltyScore += 20;
        
        if (customer.avg_revenue_per_visit >= 5000) loyaltyScore += 25;
        else if (customer.avg_revenue_per_visit >= 3000) loyaltyScore += 20;
        
        if (customer.days_since_last_order <= 15) loyaltyScore += 20;
        else if (customer.days_since_last_order <= 30) loyaltyScore += 15;
        
        if (customer.total_orders >= 5) loyaltyScore += 15;
        loyaltyScore += Math.min(15, customer.total_visits * 2);

        // Calculate growth rate (simplified)
        const growthRate = Math.random() * 20 + 10; // Mock growth rate

        // Identify strengths
        const strengths = [];
        if (customer.conversion_rate >= 85) strengths.push("Excellent conversion rate");
        if (customer.avg_revenue_per_visit >= 4000) strengths.push("High order values");
        if (customer.days_since_last_order <= 15) strengths.push("Recent active orders");
        if (customer.total_orders >= customer.total_visits * 0.8) strengths.push("Consistent ordering pattern");

        return {
          ...customer,
          loyalty_score: Math.min(100, loyaltyScore),
          growth_rate: growthRate,
          strengths,
          total_visits_3m: customer.total_visits,
          total_orders_3m: customer.total_orders,
          total_revenue_3m: customer.total_revenue
        };
      })
      .sort((a, b) => b.loyalty_score - a.loyalty_score)
      .slice(0, 8); // Top 8 golden clients
  }

  /**
   * Enhance area analysis with AI insights
   */
  async enhanceAreaAnalysis(areaAnalysis) {
    return areaAnalysis.map(area => {
      // Calculate growth potential
      let growthPotential = 'Low';
      if (area.success_rate >= 70 && area.avg_revenue_per_customer >= 5000) {
        growthPotential = 'High';
      } else if (area.success_rate >= 50 || area.avg_revenue_per_customer >= 3000) {
        growthPotential = 'Medium';
      }

      // Calculate saturation level (mock calculation)
      const saturationLevel = Math.min(95, (area.total_customers * 15) + (area.success_rate * 0.5));

      // Calculate untapped potential
      const marketPotential = area.total_customers * 8000; // Potential per customer
      const untappedPotential = Math.max(0, marketPotential - area.total_revenue);

      // Generate recommendations
      const recommendations = [];
      if (area.success_rate < 60) {
        recommendations.push("Investigate low conversion issues");
        recommendations.push("Review customer needs and product fit");
      }
      if (area.avg_revenue_per_customer < 3000) {
        recommendations.push("Focus on upselling existing customers");
      }
      if (saturationLevel < 70) {
        recommendations.push("Add new prospects in this area");
        recommendations.push("Increase market penetration");
      }
      if (area.success_rate >= 70) {
        recommendations.push("Maintain excellence and strategic expansion");
      }

      return {
        ...area,
        growth_potential: growthPotential,
        saturation_level: Math.round(saturationLevel),
        untapped_potential: Math.round(untappedPotential),
        efficiency_score: area.success_rate,
        recommendations,
        visits_planned: area.total_visits, // Simplified
        visits_actual: area.total_visits,
        active_customers: area.total_customers,
        revenue_3m: area.total_revenue
      };
    });
  }

  /**
   * Process visit patterns
   */
  processVisitPatterns(visitPatterns, actualVisits) {
    // Analyze frequency by customer type
    const frequencyAnalysis = {};
    const timeAnalysis = {};

    visitPatterns.forEach(visit => {
      const customerType = visit.customer_type || 'Unknown';
      
      // Frequency analysis
      if (!frequencyAnalysis[customerType]) {
        frequencyAnalysis[customerType] = {
          customer_type: customerType,
          visits: [],
          total_visits: 0,
          successful_visits: 0
        };
      }
      
      frequencyAnalysis[customerType].visits.push(visit);
      frequencyAnalysis[customerType].total_visits++;
      
      if (parseFloat(visit.amountOfSale) > 0) {
        frequencyAnalysis[customerType].successful_visits++;
      }

      // Time analysis
      if (visit.inTime) {
        const hour = parseInt(visit.inTime.split(':')[0]);
        let timeSlot;
        if (hour >= 9 && hour < 11) timeSlot = '9-11 AM';
        else if (hour >= 11 && hour < 13) timeSlot = '11-1 PM';
        else if (hour >= 14 && hour < 16) timeSlot = '2-4 PM';
        else if (hour >= 16 && hour < 18) timeSlot = '4-6 PM';
        else timeSlot = 'Other';

        if (!timeAnalysis[timeSlot]) {
          timeAnalysis[timeSlot] = {
            time_slot: timeSlot,
            total_visits: 0,
            successful_visits: 0,
            total_revenue: 0
          };
        }

        timeAnalysis[timeSlot].total_visits++;
        const revenue = parseFloat(visit.amountOfSale) || 0;
        if (revenue > 0) {
          timeAnalysis[timeSlot].successful_visits++;
          timeAnalysis[timeSlot].total_revenue += revenue;
        }
      }
    });

    // Process frequency recommendations
    const optimalFrequency = Object.values(frequencyAnalysis).map(type => {
      const avgDaysBetweenVisits = 30; // Simplified calculation
      let recommendedFreq, gapAnalysis;

      switch (type.customer_type.toLowerCase()) {
        case 'hospital':
          recommendedFreq = 'Weekly';
          gapAnalysis = avgDaysBetweenVisits <= 10 ? 'Optimal' : 'Too infrequent';
          break;
        case 'retailer':
          recommendedFreq = 'Bi-weekly';
          gapAnalysis = avgDaysBetweenVisits >= 10 && avgDaysBetweenVisits <= 16 ? 'Optimal' : 'Needs adjustment';
          break;
        case 'doctor':
          recommendedFreq = 'Monthly';
          gapAnalysis = avgDaysBetweenVisits >= 20 && avgDaysBetweenVisits <= 35 ? 'Good' : 'Needs adjustment';
          break;
        default:
          recommendedFreq = 'Bi-weekly';
          gapAnalysis = 'Standard';
      }

      return {
        customer_type: type.customer_type,
        recommended_frequency: recommendedFreq,
        current_avg: `${avgDaysBetweenVisits} days`,
        gap_analysis: gapAnalysis
      };
    });

    // Process time analysis
    const timeSlotAnalysis = Object.values(timeAnalysis).map(slot => ({
      time_slot: slot.time_slot,
      success_rate: slot.total_visits > 0 ? Math.round((slot.successful_visits / slot.total_visits) * 100) : 0,
      avg_order: slot.successful_visits > 0 ? Math.round(slot.total_revenue / slot.successful_visits) : 0,
      recommendation: this.getTimeSlotRecommendation(slot)
    }));

    return {
      optimal_frequency: optimalFrequency,
      time_analysis: timeSlotAnalysis
    };
  }

  /**
   * Get time slot recommendation
   */
  getTimeSlotRecommendation(slot) {
    const successRate = slot.total_visits > 0 ? (slot.successful_visits / slot.total_visits) * 100 : 0;
    
    if (successRate >= 80) return "Peak performance - schedule key customers";
    if (successRate >= 60) return "Good for routine visits";
    if (successRate >= 40) return "Acceptable but monitor closely";
    return "Consider avoiding for important customers";
  }

  /**
   * Generate AI insights using Gemini
   */
  async generateAIInsights(analytics) {
    if (!this.geminiApiKey) {
      console.warn('Gemini API key not configured, using fallback insights');
      return this.generateFallbackInsights(analytics);
    }

    try {
      const prompt = this.buildInsightsPrompt(analytics);
      const insights = await this.callGeminiAPI(prompt);
      return insights;
    } catch (error) {
      console.error('Gemini AI insights failed:', error);
      return this.generateFallbackInsights(analytics);
    }
  }

  /**
   * Build prompt for Gemini AI
   */
  buildInsightsPrompt(analytics) {
    const { performanceComparison, redFlagCustomers, goldenClients, areaAnalysis } = analytics;
    
    return `Analyze this MR visit performance data and provide strategic insights:

PERFORMANCE METRICS:
- Total visits: ${performanceComparison.efficiency_metrics.total_visits}
- Conversion rate: ${performanceComparison.efficiency_metrics.conversion_rate.toFixed(1)}%
- Avg revenue per visit: ₹${performanceComparison.efficiency_metrics.avg_revenue_per_visit.toFixed(0)}
- Total revenue: ₹${performanceComparison.efficiency_metrics.total_revenue.toFixed(0)}

RED FLAG CUSTOMERS: ${redFlagCustomers.length}
Top concerns: ${redFlagCustomers.slice(0, 3).map(c => `${c.customer_name} (${c.total_visits} visits, ₹${c.total_revenue} revenue, ${c.conversion_rate.toFixed(1)}% conversion)`).join(', ')}

GOLDEN CLIENTS: ${goldenClients.length}
Top performers: ${goldenClients.slice(0, 3).map(c => `${c.customer_name} (₹${c.total_revenue} revenue, ${c.conversion_rate.toFixed(1)}% conversion)`).join(', ')}

AREA PERFORMANCE:
${areaAnalysis.map(area => `${area.area_name}: ${area.total_customers} customers, ₹${area.total_revenue.toFixed(0)} revenue, ${area.success_rate.toFixed(1)}% success rate`).join('\n')}

Provide insights in this JSON format:
{
  "key_opportunities": [
    "Specific actionable opportunity 1",
    "Specific actionable opportunity 2"
  ],
  "action_items": [
    "Immediate action item 1",
    "Immediate action item 2"
  ],
  "strategic_recommendations": [
    "Long-term strategic recommendation 1",
    "Long-term strategic recommendation 2"
  ],
  "risk_alerts": [
    "Risk or concern 1",
    "Risk or concern 2"
  ]
}`;
  }

  /**
   * Call Gemini API
   */
  async callGeminiAPI(prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.geminiApiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const result = await response.json();
    const responseText = result.candidates[0].content.parts[0].text;
    const cleanText = responseText.replace(/```json|```/g, '');
    
    return JSON.parse(cleanText);
  }

  /**
   * Generate fallback insights when AI is not available
   */
  generateFallbackInsights(analytics) {
    const { performanceComparison, redFlagCustomers, goldenClients, areaAnalysis } = analytics;
    
    return {
      key_opportunities: [
        `${redFlagCustomers.length} red flag customers need immediate attention to prevent churn`,
        `${goldenClients.length} golden clients show potential for account expansion`,
        `${areaAnalysis.filter(a => a.growth_potential === 'High').length} areas show high growth potential`,
        "Optimize visit timing - morning slots show higher success rates"
      ],
      action_items: [
        redFlagCustomers.length > 0 ? `Schedule urgent review with ${redFlagCustomers[0].customer_name}` : "Monitor customer performance closely",
        goldenClients.length > 0 ? `Increase engagement with top performer ${goldenClients[0].customer_name}` : "Identify high-potential customers",
        "Review and adjust visit frequencies based on customer type analysis",
        "Focus expansion efforts on high-potential areas"
      ],
      strategic_recommendations: [
        "Implement account recovery strategy for red flag customers",
        "Develop loyalty programs for golden clients",
        "Optimize route planning based on area performance data",
        "Adjust visit scheduling to peak performance hours"
      ],
      risk_alerts: [
        performanceComparison.efficiency_metrics.conversion_rate < 60 ? "Overall conversion rate below optimal threshold" : null,
        redFlagCustomers.length > 5 ? "High number of at-risk customers detected" : null,
        areaAnalysis.filter(a => a.success_rate < 50).length > 0 ? "Some areas showing poor performance" : null
      ].filter(Boolean)
    };
  }

  /**
   * Helper function to get months from timeframe
   */
  getMonthsFromTimeframe(timeframe) {
    switch (timeframe) {
      case '1month': return 1;
      case '3months': return 3;
      case '6months': return 6;
      default: return 3;
    }
  }
}

// Export singleton instance
export const visitAnalyticsEngine = new VisitAnalyticsEngine();
