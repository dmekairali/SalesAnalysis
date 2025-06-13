// Update MRVisitPlannerDashboard.js to use real data

import React, { useState, useEffect, useMemo } from 'react';
//import { Calendar, MapPin, Users, TrendingUp, Download, RefreshCw, Clock, Target, AlertTriangle, CheckCircle, User, Phone, Navigation, Star, Brain, Route, Calendar as CalendarIcon} from 'lucide-react';
import { Calendar, MapPin, Users, TrendingUp, Download, RefreshCw, Clock, Target, AlertTriangle, CheckCircle, User, Phone, Navigation, Star, Brain, Map, Calendar as CalendarIcon, UserCheck, Building2, UserPlus  } from 'lucide-react';

// Import your existing components and utilities
import { COLORS, 
  generateCompleteVisitPlan,
  getExistingClusters,
  createGeminiClusters,
  getVisitPlanDetails,
  getDailyBreakdown
} from '../data.js';

// Add these imports at the top
import { reactVisitPlannerML } from '../visitplannerdata.js';
import PerformanceMetricsDisplay from './PerformanceMetricsDisplay.js';
import RouteAnalysisDisplay from './RouteAnalysisDisplay.js';
import CustomerInsightsDisplay from './CustomerInsightsDisplay.js';

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
 
  const [clusterStatus, setClusterStatus] = useState(null); // Will be updated from plan generation

  const initialPlanSteps = [
    { id: 'INITIALIZATION', name: 'Initializing', status: 'pending' },
    { id: 'FETCH_CUSTOMERS', name: 'Fetching Customers', status: 'pending' },
    { id: 'PREPARE_AREA_DATA', name: 'Preparing Area Data', status: 'pending' },
    { id: 'CREATE_CLUSTERS', name: 'Creating Clusters', status: 'pending' },
    { id: 'GENERATE_CALENDAR', name: 'Generating Calendar', status: 'pending' },
    { id: 'CREATE_VISIT_PLAN', name: 'Creating Visit Plan', status: 'pending' }
  ];
  const [planGenerationSteps, setPlanGenerationSteps] = useState(initialPlanSteps);
  
  // Import Supabase client
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.REACT_APP_SUPABASE_ANON_KEY
  );

  // Removed useEffect for checkClusterStatus, as clusterStatus will be updated from generateVisitPlan
  
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
                case 'prospect':  
                  breakdown.prospects++;
                  break;
                default:
                  break;
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
/*
const generateVisitPlan = async () => {
  if (!selectedMR) {
    alert('Please select an MR first');
    return;
  }

  setLoading(true);
  try {
    console.log('🎯 Generating complete visit plan...');
    
    const completePlan = await generateCompleteVisitPlan(selectedMR, selectedMonth, selectedYear);
    
    setVisitPlan(completePlan);
    console.log('✅ Visit plan generated successfully');
    
  } catch (error) {
    console.error('💥 Error generating visit plan:', error);
    alert('Error generating visit plan: ' + error.message);
  }
  setLoading(false);
};
 */ 


// Replace your existing generateVisitPlan function with this:
const generateVisitPlan = async () => {
  if (!selectedMR) {
    alert('Please select an MR first');
    return;
  }

  setLoading(true);
  setPlanGenerationSteps(initialPlanSteps.map(step => ({ ...step, status: 'pending' }))); // Reset steps

  const handleProgressUpdate = (progress) => {
    console.log('Progress Update:', progress);
    setPlanGenerationSteps(prevSteps => {
      const existingStepIndex = prevSteps.findIndex(s => s.id === progress.step);
      if (existingStepIndex !== -1) {
        return prevSteps.map((step, index) =>
          index === existingStepIndex
            ? { ...step, status: progress.status, description: progress.description }
            : step
        );
      } else if (progress.step === 'ERROR') {
        // Add error step or mark all subsequent steps as failed
        return prevSteps.map(step => ({ ...step, status: step.status === 'pending' ? 'failed' : step.status, description: step.id === prevSteps[prevSteps.length-1].id ? progress.description : step.description  }));
      }
      return prevSteps; // Should not happen if all steps are predefined
    });
  };

  try {
    console.log('Generating plan for:', { selectedMR, selectedMonth, selectedYear });
    
    // Use the new React visit planner
    const result = await reactVisitPlannerML.generateVisitPlan(
      selectedMR, 
      selectedMonth, 
      selectedYear, 
      15, // minVisitsPerDay
      handleProgressUpdate // Pass the callback
    );
    
    console.log('Visit Plan Result:', result);
    
    if (result.success) {
      // Transform to match your component expectations
      const transformedPlan = {
        mrName: selectedMR,
        month: selectedMonth,
        year: selectedYear,
        summary: {
          totalWorkingDays: result.summary.total_working_days,
          totalPlannedVisits: result.summary.total_planned_visits,
          estimatedRevenue: result.summary.estimated_revenue,
          efficiencyScore: parseFloat(result.summary.efficiencyScore || 0),
          // Ensure all new summary fields are mapped if names differ, or use them directly if names match
          totalWorkingDays: result.summary.total_working_days || 0,
          totalPlannedVisits: result.summary.total_planned_visits || 0,
          totalUniqueCustomersVisited: result.summary.total_unique_customers_visited || 0,
          totalProspectsTargeted: result.summary.total_prospects_targeted || 0,
          estimatedRevenue: result.summary.estimated_revenue || 0,
          avgVisitsPerDay: parseFloat(result.summary.avg_visits_per_day || 0).toFixed(1),
          coverageScore: result.summary.coverageScore || 90 // Default if not present
        },
        weeklyBreakdown: transformDailyPlansToWeekly(result.dailyPlans),
        insights: result.insights.map(insight => ({
          type: insight.type,
          title: insight.title,
          value: insight.value,
          description: insight.description,
          status: insight.status, // Assuming status is directly on insight
          recommendation: insight.recommendation || `Status: ${insight.status}` // Keep original if recommendation not direct
        })),
        detailedClusterStats: result.detailedClusterStats,
        geminiClusteredAreas: result.geminiClusteredAreas,
        allMrCustomers: result.allMrCustomers,
        advancedAnalyticsInsights: result.advancedAnalyticsInsights // <-- Ensure this is mapped
      };
      
      setVisitPlan(transformedPlan);

      // Update clusterStatus from geminiClusteredAreas
      if (result.geminiClusteredAreas && result.geminiClusteredAreas.clusters) {
        const { clusters } = result.geminiClusteredAreas;
        const clusterCount = clusters.length;
        const totalAreas = clusters.reduce((sum, cluster) => sum + (cluster.areas ? cluster.areas.length : 0), 0);
        setClusterStatus({
          hasExistingClusters: clusterCount > 0,
          clusterCount,
          totalAreas
        });
      } else {
        // If no cluster data, reset or set to a default state
        setClusterStatus({ hasExistingClusters: false, clusterCount: 0, totalAreas: 0, message: "No cluster data returned." });
      }

    } else {
      console.error('Plan generation failed:', result.error);
      alert(`Plan generation failed: ${result.error}`);
      setClusterStatus({ hasExistingClusters: false, clusterCount: 0, totalAreas: 0, message: "Plan generation failed." }); // Reset on failure
    }
  } catch (error) {
    console.error('Error generating visit plan:', error);
    setClusterStatus({ hasExistingClusters: false, clusterCount: 0, totalAreas: 0, message: "Error during plan generation." }); // Reset on error
    alert('Error generating visit plan. Please try again.');
  }
  setLoading(false);
};

// Add this helper function to transform daily plans to weekly breakdown
const transformDailyPlansToWeekly = (dailyPlans) => {
  if (!dailyPlans || !Array.isArray(dailyPlans)) return [];

  const weeks = [];
  let currentWeek = { week: 1, days: [], summary: { totalVisits: 0, estimatedRevenue: 0 } };
  let weekNumber = 1;

  const workingDays = dailyPlans.filter(d => !d.isSunday);

  workingDays.forEach((dayPlan, index) => {
    const dayData = {
      date: dayPlan.date,
      dayName: dayPlan.dayName,
      visits: dayPlan.clusters.flatMap(cluster => 
        cluster.customers.map(customer => ({
          customer_name: customer.customer_name,
          customer_phone: customer.customer_phone,
          customer_type: customer.customer_type,
          area_name: cluster.area_name,
          scheduled_time: `${9 + Math.floor(index % 8)}:00`, // Simple time allocation
          expected_order_value: customer.predicted_order_value || 2000,
          order_probability: customer.prospect_generated ? 0.3 : 0.7,
          priority: cluster.area_priority === 'PRIMARY' ? 'HIGH' : 
                   cluster.area_priority === 'ROUTE_ROTATION' ? 'HIGH' :
                   cluster.area_priority === 'PROSPECT' ? 'LOW' : 'MEDIUM'
        }))
      ),
      summary: {
        totalVisits: dayPlan.totalVisits,
        estimatedRevenue: dayPlan.clusters.reduce((sum, cluster) => 
          sum + cluster.customers.reduce((cSum, customer) => 
            cSum + (customer.predicted_order_value || 2000), 0), 0),
        areasVisited: new Set(dayPlan.clusters.map(c => c.area_name)).size,
        highPriorityVisits: dayPlan.clusters.filter(c => 
          c.area_priority === 'PRIMARY' || c.area_priority === 'ROUTE_ROTATION'
        ).reduce((sum, c) => sum + c.customers.length, 0)
      }
    };

    currentWeek.days.push(dayData);
    currentWeek.summary.totalVisits += dayData.summary.totalVisits;
    currentWeek.summary.estimatedRevenue += dayData.summary.estimatedRevenue;

    // If we have 6 days (Mon-Sat) or it's the last day, close the week
    if (currentWeek.days.length === 6 || index === workingDays.length - 1) {
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

    {/* AI Insights */}
<div className="bg-white p-6 rounded-lg shadow-md">
  <h3 className="text-lg font-semibold mb-4 flex items-center">
    <Brain className="h-5 w-5 mr-2 text-purple-600" />
    AI-Powered Insights & Recommendations
  </h3>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

{/* Customer Breakdown Cards - Now appears after AI insights */}
<CustomerBreakdownCards />

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

            {/* Display Cluster Status */}
            {clusterStatus && (
              <div className={`mt-2 flex items-center text-sm ${
                clusterStatus.hasExistingClusters ? 'text-green-600' : 'text-orange-500' // Orange for no/failed clusters
              }`}>
                <Brain className="h-4 w-4 mr-1.5" />
                {clusterStatus.message ? (
                  <span>{clusterStatus.message}</span>
                ) : clusterStatus.hasExistingClusters ? (
                  <>
                    <span>{`${clusterStatus.clusterCount} clusters, ${clusterStatus.totalAreas} areas defined`}</span>
                    <CheckCircle className="h-4 w-4 ml-1.5 text-green-500" />
                  </>
                ) : (
                  <span>No clusters defined or plan not generated yet.</span>
                )}
              </div>
            )}
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
          <RefreshCw className="h-10 w-10 text-green-600 animate-spin mx-auto mb-3" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Generating Optimal Visit Plan</h3>
          <p className="text-sm text-gray-500 mb-6">
            AI is meticulously crafting your plan. Follow the progress below:
          </p>
          <div className="w-full max-w-md mx-auto bg-gray-50 p-4 rounded-lg shadow-inner">
            <ul className="space-y-3">
              {planGenerationSteps.map(step => (
                <li key={step.id} className="flex items-center p-3 bg-white rounded-md shadow-sm border border-gray-200">
                  <div className="flex-shrink-0 mr-3">
                    {step.status === 'completed' && <CheckCircle className="h-6 w-6 text-green-500" />}
                    {step.status === 'in-progress' && <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />}
                    {step.status === 'failed' && <AlertTriangle className="h-6 w-6 text-red-500" />}
                    {step.status === 'pending' && <Clock className="h-6 w-6 text-gray-400" />}
                  </div>
                  <div className="flex-grow">
                    <span className={`font-medium text-sm ${
                      step.status === 'completed' ? 'text-green-700' :
                      step.status === 'in-progress' ? 'text-blue-700' :
                      step.status === 'failed' ? 'text-red-700' :
                      'text-gray-600'
                    }`}>
                      {step.name}
                    </span>
                    {step.description && step.status !== 'completed' && (
                      <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                    )}
                     {step.status === 'failed' && step.description && (
                      <p className="text-xs text-red-500 mt-1">{step.description}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* No MR Selected State */}
      {(!visitPlan && !loading) && (
  <div className="bg-white rounded-lg shadow-md p-12 text-center">
    <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Generate Visit Plan</h3>
    <p className="text-gray-600 mb-4">
      {selectedMR ? 
        `Click "Generate Plan" to create an AI-optimized visit plan for ${selectedMR}` :
        'Select a medical representative and click "Generate Plan" to start'
      }
    </p>
    {selectedMR && (
      <button
        onClick={generateVisitPlan}
        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
      >
        🤖 Generate AI Visit Plan
      </button>
    )}
  </div>
)}

      {/* Main Content */}
      {visitPlan && !loading && (
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
          {activeView === 'analytics' && visitPlan && (
            <div className="space-y-8 p-4 md:p-6 bg-gray-100 rounded-lg shadow-inner">
              {/* Added padding, bg-gray-100, shadow-inner. Adjusted p-6 to md:p-6 for responsiveness */}
              <PerformanceMetricsDisplay visitPlan={visitPlan} />
              <RouteAnalysisDisplay visitPlan={visitPlan} />
              <CustomerInsightsDisplay visitPlan={visitPlan} />
            </div>
          )}
          {activeView === 'analytics' && !visitPlan && (
            <div className="bg-white p-12 rounded-lg shadow-md text-center border border-gray-200">
              {/* Added border */}
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2 text-gray-700">Analytics & Insights</h3>
              <p className="text-gray-500">Please generate a visit plan first to see detailed analytics.</p>
            </div>
          )}
        </>
      )}

      {/* Selected Day Detail Modal */}
      
{selectedDay && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl" style={{ height: '85vh' }}>
      {/* Modal Header */}
      <div className="flex justify-between items-center p-6 border-b border-gray-200">
        <div>
          <h3 className="text-xl font-semibold">
            Visits for {selectedDay.date} ({selectedDay.dayName})
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {selectedDay.visits?.length || 0} visits planned
          </p>
        </div>
        <button
          onClick={() => setSelectedDay(null)}
          className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
        >
          ×
        </button>
      </div>

      {/* Modal Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6" style={{ height: 'calc(85vh - 140px)' }}>
        <div className="space-y-3">
          {selectedDay.visits && selectedDay.visits.length > 0 ? (
            selectedDay.visits.map((visit, index) => (
              <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-lg">{visit.customer_name}</h4>
                    <p className="text-sm text-gray-600">{visit.customer_type} • {visit.area_name}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(visit.priority)}`}>
                    {visit.priority}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Time:</span> {visit.scheduled_time}
                  </div>
                  <div>
                    <span className="font-medium">Expected:</span> ₹{visit.expected_order_value?.toLocaleString() || 0}
                  </div>
                  <div>
                    <span className="font-medium">Order Probability:</span> {((visit.order_probability || 0) * 100).toFixed(0)}%
                  </div>
                  <div>
                    <span className="font-medium">Purpose:</span> {visit.visit_purpose?.replace('_', ' ') || 'Standard'}
                  </div>
                </div>
                {visit.customer_phone && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <span className="text-sm text-gray-600">📞 {visit.customer_phone}</span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 text-center text-lg">No visits planned for this day</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Footer */}
      <div className="border-t border-gray-200 px-6 py-4">
        <button
          onClick={() => setSelectedDay(null)}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors ml-auto block"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default MRVisitPlannerDashboard;
