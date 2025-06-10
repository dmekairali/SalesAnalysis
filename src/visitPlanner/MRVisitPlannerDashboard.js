// Update MRVisitPlannerDashboard.js to use real data

import React, { useState, useEffect, useMemo } from 'react';
//import { Calendar, MapPin, Users, TrendingUp, Download, RefreshCw, Clock, Target, AlertTriangle, CheckCircle, User, Phone, Navigation, Star, Brain, Route, Calendar as CalendarIcon, UserCheck, Building2, UserPlus } from 'lucide-react';
import { Calendar, MapPin, Users, TrendingUp, Download, RefreshCw, Clock, Target, AlertTriangle, CheckCircle, User, Phone, Navigation, Star, Brain, Map, Calendar as CalendarIcon } from 'lucide-react';

// Import your existing components and utilities
import { COLORS, getVisitPlanAPI } from '../data.js';
import { SearchableDropdown } from '../enhancedFilters.js';

const MRVisitPlannerDashboard = () => {
  const [selectedMR, setSelectedMR] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [visitPlan, setVisitPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState('overview');
  const [selectedDay, setSelectedDay] = useState(null);
  const [mrList, setMrList] = useState([]);
  const [loadingMRs, setLoadingMRs] = useState(true);

  // Import Supabase client
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.REACT_APP_SUPABASE_ANON_KEY
  );

 // Calculate customer breakdown for the entire plan
  const customerBreakdown = useMemo(() => {
    if (!visitPlan?.weeklyBreakdown) return null;

    const breakdown = {
      doctors: 0,
      retailers: 0,
      stockists: 0,
      distributors: 0,
      prospects: 0,
      total: 0
    };

    visitPlan.weeklyBreakdown.forEach(week => {
      week.days.forEach(day => {
        if (day.visits && Array.isArray(day.visits)) {
          day.visits.forEach(visit => {
            breakdown.total++;
            if (visit.visit_purpose === 'NEW_BUSINESS_DEVELOPMENT') {
              breakdown.prospects++;
            } else {
              switch (visit.customer_type?.toLowerCase()) {
                case 'doctor':
                  breakdown.doctors++;
                  break;
                case 'retailer':
                  breakdown.retailers++;
                  break;
                case 'stockist':
                  breakdown.stockists++;
                  break;
                case 'distributor':
                  breakdown.distributors++;
                  break;
                default:
                  break;
              }
            }
          });
        }
      });
    });

    return breakdown;
  }, [visitPlan]);

  
  
  // Fetch MR list from medical_representatives table
  useEffect(() => {
    const fetchMRs = async () => {
      setLoadingMRs(true);
      try {
        const { data, error } = await supabase
          .from('medical_representatives')
          .select('employee_id, name, territory, is_active')
          .eq('is_active', true)
          .order('name');

        if (error) {
          console.error('Error fetching MRs:', error);
          // Fallback to mr_visits table if medical_representatives doesn't have data
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('mr_visits')
            .select('mr_name')
            .not('mr_name', 'is', null);

          if (!fallbackError && fallbackData) {
            const uniqueMRs = [...new Set(fallbackData.map(item => item.mr_name))];
            setMrList(uniqueMRs.sort());
            if (uniqueMRs.length > 0 && !selectedMR) {
              setSelectedMR(uniqueMRs[0]);
            }
          }
        } else {
          const mrNames = data.map(mr => mr.name);
          setMrList(mrNames);
          if (mrNames.length > 0 && !selectedMR) {
            setSelectedMR(mrNames[0]);
          }
        }
      } catch (error) {
        console.error('Error in fetchMRs:', error);
      }
      setLoadingMRs(false);
    };

    fetchMRs();
  }, []);


 
  // Real function to generate visit plan using your API
  const generateVisitPlan = async () => {
  if (!selectedMR) {
    alert('Please select an MR first');
    return;
  }

  setLoading(true);
  try {
    console.log('Creating plan for:', { selectedMR, selectedMonth, selectedYear });
    
    // Step 1: Create the plan
    const { error: createError } = await supabase.rpc('create_route_optimized_visit_plan', {
      p_mr_name: selectedMR,
      p_month: selectedMonth,
      p_year: selectedYear,
      p_max_visits_per_day: 10,
      p_min_nbd_per_area: 3
    });

    if (createError) {
      console.error('Error creating plan:', createError);
      alert('Error creating visit plan: ' + createError.message);
      return;
    }

    // Step 2: Get the plan details
    const { data, error: fetchError } = await supabase.rpc('get_visit_plan_api', {
      p_mr_name: selectedMR,
      p_month: selectedMonth,
      p_year: selectedYear
    });

    if (fetchError) {
      console.error('Error fetching plan:', fetchError);
      alert('Error fetching visit plan: ' + fetchError.message);
      return;
    }

    console.log('API Result:', data);
    
    if (data && data.success) {
       // Calculate variables FIRST
  const dailyPlans = data.daily_plans || [];
  const totalVisits = data.summary?.total_planned_visits || 0;
  const totalAreas = new Set(dailyPlans.flatMap(day => 
    day.visits ? day.visits.map(v => v.area_name).filter(Boolean) : []
  )).size;
  const highPriorityCount = dailyPlans.reduce((sum, day) => {
    if (day.visits && Array.isArray(day.visits)) {
      return sum + day.visits.filter(visit => visit.priority === 'HIGH').length;
    }
    return sum + (day.high_priority_visits || 0);
  }, 0);
      
      const transformedPlan = {
        mrName: selectedMR,
        month: selectedMonth,
        year: selectedYear,
        summary: {
          totalWorkingDays: data.summary?.total_working_days || 0,  // This should fix the 0 working days
          totalPlannedVisits: data.summary?.total_planned_visits || 0,
          estimatedRevenue: data.summary?.estimated_revenue || 0,
          efficiencyScore: data.summary?.efficiency_score || 0,
          coverageScore: Math.min(100, (totalAreas * 4) + (highPriorityCount * 2) + (totalVisits > 180 ? 20 : 10))
        },
        weeklyBreakdown: transformDailyPlansToWeekly(data.daily_plans || []),
        insights: generateInsightsFromData(data)
      };
      
      setVisitPlan(transformedPlan);
      console.log('Plan created successfully:', transformedPlan);
    } else {
      console.error('Plan generation failed:', data);
      alert('Plan generation failed. Please try again.');
    }
  } catch (error) {
    console.error('Error generating visit plan:', error);
    alert('Error generating visit plan: ' + error.message);
  }
  setLoading(false);
};

  // Transform daily plans from API to weekly breakdown for display
  const transformDailyPlansToWeekly = (dailyPlans) => {
    if (!dailyPlans || !Array.isArray(dailyPlans)) return [];

    const weeks = [];
    let currentWeek = { week: 1, days: [], summary: { totalVisits: 0, estimatedRevenue: 0 } };
    let weekNumber = 1;

    dailyPlans.forEach((dayPlan, index) => {
      const dayData = {
        date: dayPlan.date,
        dayName: new Date(dayPlan.date).toLocaleDateString('en-US', { weekday: 'short' }),
        visits: dayPlan.visits || [],
        summary: {
          totalVisits: dayPlan.total_visits || 0,
          estimatedRevenue: dayPlan.estimated_revenue || 0,
          areasVisited: dayPlan.areas_count || 0,
          highPriorityVisits: dayPlan.high_priority_visits || 0
        }
      };

      currentWeek.days.push(dayData);
      currentWeek.summary.totalVisits += dayData.summary.totalVisits;
      currentWeek.summary.estimatedRevenue += dayData.summary.estimatedRevenue;

      // If we have 6 days (Mon-Sat) or it's the last day, close the week
      if (currentWeek.days.length === 6 || index === dailyPlans.length - 1) {
        weeks.push(currentWeek);
        weekNumber++;
        currentWeek = { 
          week: weekNumber, 
          days: [], 
          summary: { totalVisits: 0, estimatedRevenue: 0 } 
        };
      }
    });

    return weeks;
  };

  // Generate insights from API data
  const generateInsightsFromData = (apiResult) => {
    const summary = apiResult.summary || {};
    const dailyPlans = apiResult.daily_plans || [];
    
    const totalRevenue = summary.estimated_revenue || 0;
    const totalVisits = summary.total_planned_visits || 0;
    const workingDays = summary.total_working_days || 0;
    
    const insights = [];

    // Revenue insight
    insights.push({
      type: 'revenue',
      title: 'Revenue Potential',
      value: `₹${(totalRevenue / 100000).toFixed(1)}L`,
      description: `Expected monthly revenue from ${totalVisits} visits`,
      recommendation: totalRevenue > 500000 ? 'Excellent revenue potential' : 'Focus on high-value customers'
    });

    // Efficiency insight
    const avgVisitsPerDay = workingDays > 0 ? (totalVisits / workingDays).toFixed(1) : 0;
    insights.push({
      type: 'optimization',
      title: 'Visit Efficiency',
      value: `${avgVisitsPerDay}/day`,
      description: 'Average visits per working day',
      recommendation: avgVisitsPerDay >= 8 ? 'Optimal visit distribution' : 'Consider increasing daily visits'
    });

    // Coverage insight
    // Priority customers insight - count HIGH priority visits
const highPriorityCount = dailyPlans.reduce((sum, day) => {
  if (day.visits && Array.isArray(day.visits)) {
    return sum + day.visits.filter(visit => visit.priority === 'HIGH').length;
  }
  return sum + (day.high_priority_visits || 0);
}, 0);
    
    // Priority Customers insight
insights.push({
  type: 'risk',
  title: 'Priority Customers',
  value: `${highPriorityCount} visits`,
  description: 'High-priority customer visits planned',
  recommendation: highPriorityCount > 20 ? 'Excellent priority coverage' : 'Consider adding more high-priority visits'
});

// Dynamic Coverage Score based on areas and visit distribution
const totalAreas = new Set(dailyPlans.flatMap(day => 
  day.visits ? day.visits.map(v => v.area_name).filter(Boolean) : []
)).size;

const coverageScore = Math.min(100, (totalAreas * 4) + (highPriorityCount * 2) + (totalVisits > 180 ? 20 : 10));

insights.push({
  type: 'coverage',
  title: 'Territory Coverage',
  value: `${coverageScore}%`,
  description: `Covering ${totalAreas} areas with ${totalVisits} total visits`,
  recommendation: coverageScore > 85 ? 'Excellent territory coverage' : 'Consider expanding area coverage'
});

    return insights;
  };



  // Generate plan on component mount and when parameters change
  useEffect(() => {
    if (selectedMR && !loadingMRs) {
      generateVisitPlan();
    }
  }, [selectedMR, selectedMonth, selectedYear]);

  // Get month name
  const getMonthName = (month) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

    // Enhanced Customer Breakdown Cards Component
  const CustomerBreakdownCards = () => {
    if (!customerBreakdown) return null;

    const cards = [
      {
        title: 'Doctors',
        count: customerBreakdown.doctors,
        icon: UserCheck,
        color: 'bg-blue-50 border-blue-200 text-blue-700',
        iconColor: 'text-blue-600'
      },
      {
        title: 'Retailers',
        count: customerBreakdown.retailers,
        icon: Building2,
        color: 'bg-green-50 border-green-200 text-green-700',
        iconColor: 'text-green-600'
      },
      {
        title: 'Stockists',
        count: customerBreakdown.stockists,
        icon: Users,
        color: 'bg-purple-50 border-purple-200 text-purple-700',
        iconColor: 'text-purple-600'
      },
      {
        title: 'Distributors',
        count: customerBreakdown.distributors,
        icon: Building2,
        color: 'bg-orange-50 border-orange-200 text-orange-700',
        iconColor: 'text-orange-600'
      },
      {
        title: 'NBD Prospects',
        count: customerBreakdown.prospects,
        icon: UserPlus,
        color: 'bg-teal-50 border-teal-200 text-teal-700',
        iconColor: 'text-teal-600'
      }
    ];

    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Users className="h-5 w-5 mr-2 text-gray-600" />
          Customer Distribution ({customerBreakdown.total} Total Visits)
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {cards.map((card, index) => {
            const Icon = card.icon;
            const percentage = customerBreakdown.total > 0 ? ((card.count / customerBreakdown.total) * 100).toFixed(1) : 0;
            
            return (
              <div key={index} className={`p-4 rounded-lg border ${card.color}`}>
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`h-5 w-5 ${card.iconColor}`} />
                  <span className="text-xs font-medium">{percentage}%</span>
                </div>
                <div className="text-2xl font-bold mb-1">{card.count}</div>
                <div className="text-sm font-medium">{card.title}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };


  // Overview component
  const OverviewComponent = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Working Days</p>
              <p className="text-2xl font-bold text-gray-900">{visitPlan?.summary?.totalWorkingDays || 0}</p>
            </div>
            <Calendar className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Visits</p>
              <p className="text-2xl font-bold text-gray-900">{visitPlan?.summary?.totalPlannedVisits || 0}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Expected Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₹{((visitPlan?.summary?.estimatedRevenue || 0) / 100000).toFixed(1)}L</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Efficiency Score</p>
              <p className="text-2xl font-bold text-gray-900">{visitPlan?.summary?.efficiencyScore || 0}%</p>
            </div>
            <Target className="h-8 w-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-teal-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Coverage Score</p>
              <p className="text-2xl font-bold text-gray-900">{visitPlan?.summary?.coverageScore || 0}%</p>
            </div>
            <CheckCircle className="h-8 w-8 text-teal-500" />
          </div>
        </div>
      </div>

      {/* AI Insights and Customer Breakdown */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* AI Insights */}
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h3 className="text-lg font-semibold mb-4 flex items-center">
      <Brain className="h-5 w-5 mr-2 text-purple-600" />
      AI-Powered Insights & Recommendations
    </h3>
    <div className="space-y-4">
      {visitPlan?.insights?.map((insight, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">{insight.title}</h4>
            <span className={`px-2 py-1 text-xs rounded-full ${
              insight.type === 'risk' ? 'bg-red-100 text-red-800' :
              insight.type === 'revenue' ? 'bg-green-100 text-green-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {insight.type.toUpperCase()}
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-2">{insight.value}</p>
          <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
          <p className="text-xs text-blue-600 font-medium">💡 {insight.recommendation}</p>
        </div>
      )) || []}
    </div>
  </div>

  {/* NEW: Customer Breakdown Cards */}
  <CustomerBreakdownCards />
</div>

      {/* Weekly Calendar Overview */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <CalendarIcon className="h-5 w-5 mr-2" />
          Monthly Visit Calendar
        </h3>
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>
        
        {visitPlan?.weeklyBreakdown?.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-2 mb-2">
            {week.days.map((day, dayIndex) => (
              <div
                key={dayIndex}
                className="min-h-20 p-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setSelectedDay(day)}
              >
                <div className="text-sm font-medium text-gray-900">{day.date.split('-')[2]}</div>
                <div className="text-xs text-gray-600">{day.summary.totalVisits} visits</div>
                <div className="text-xs text-green-600">₹{(day.summary.estimatedRevenue / 1000).toFixed(0)}K</div>
                {day.summary.highPriorityVisits > 0 && (
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-1"></div>
                )}
              </div>
            ))}
            <div className="min-h-20 p-2 bg-gray-100 rounded">
              <div className="text-xs text-gray-500">Sunday</div>
              <div className="text-xs text-gray-400">Rest Day</div>
            </div>
          </div>
        )) || []}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
               <Map className="h-6 w-6 mr-2 text-green-600" />
              MR Visit Planner - AI-Powered Route Optimization
            </h1>
            <p className="text-gray-600">
              Generate intelligent visit plans based on customer behavior, route optimization, and revenue potential
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={generateVisitPlan}
              disabled={loading || !selectedMR}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Generating...' : 'Regenerate Plan'}
            </button>
            
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Download className="h-4 w-4 mr-2" />
              Export Plan
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Medical Representative
            </label>
            {loadingMRs ? (
              <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                Loading MRs...
              </div>
            ) : (
              <select
                value={selectedMR}
                onChange={(e) => setSelectedMR(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select an MR...</option>
                {mrList.map(mr => (
                  <option key={mr} value={mr}>{mr}</option>
                ))}
              </select>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {getMonthName(i + 1)}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {[2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <RefreshCw className="h-12 w-12 text-green-600 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating Optimal Visit Plan</h3>
          <p className="text-gray-600">
            Analyzing customer patterns, route optimization, and ML predictions...
          </p>
        </div>
      )}

      {/* No MR Selected State */}
      {!selectedMR && !loading && !loadingMRs && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Select an MR to Generate Plan</h3>
          <p className="text-gray-600">
            Choose a medical representative from the dropdown above to start generating visit plans.
          </p>
        </div>
      )}

      {/* Main Content */}
      {visitPlan && !loading && selectedMR && (
        <>
          {/* View Toggle */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex space-x-1">
              {[
                { id: 'overview', label: 'Monthly Overview', icon: Calendar },
                { id: 'analytics', label: 'Analytics & Insights', icon: TrendingUp }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveView(id)}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeView === id
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Content based on active view */}
          {activeView === 'overview' && <OverviewComponent />}
          {activeView === 'analytics' && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">Advanced Analytics Coming Soon</h3>
              <p className="text-gray-600">Performance metrics, route analysis, and customer insights will be available here.</p>
            </div>
          )}
        </>
      )}

      {/* Selected Day Detail Modal */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Visits for {selectedDay.date} ({selectedDay.dayName})
              </h3>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-3">
              {selectedDay.visits && selectedDay.visits.length > 0 ? (
                selectedDay.visits.map((visit, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{visit.customer_name}</h4>
                        <p className="text-sm text-gray-600">{visit.customer_type} • {visit.area_name}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(visit.priority)}`}>
                        {visit.priority}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Time: {visit.scheduled_time} | Expected: ₹{visit.expected_order_value?.toLocaleString() || 0}</p>
                      <p>Order Probability: {((visit.order_probability || 0) * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center">No visits planned for this day</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MRVisitPlannerDashboard;
