// Updated MRVisitPlannerDashboard.js with Access Control and Mobile Responsiveness

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, MapPin, Users, TrendingUp, Download, RefreshCw, Clock, Target, AlertTriangle, CheckCircle, User, Phone, Navigation, Star, Brain, Map, Calendar as CalendarIcon, UserCheck, Building2, UserPlus, Shield, Lock  } from 'lucide-react';

// Add imports
import {COLORS, formatIndianCurrency, formatCurrencyByContext } from '../data.js';
import { reactVisitPlannerML } from '../visitplannerdata.js';
import VisitPlannerAnalyticsReal from './VisitPlannerAnalyticsReal.js';
import { SearchableDropdown } from '../enhancedFilters.js';
import { useAuth } from '../auth/AuthContext.js';

const MRVisitPlannerDashboard = ({ 
  userAccessLevel, 
  accessibleMRs = [], 
  defaultMR = null 
}) => {
  const { user, canAccessMRData } = useAuth();
  
  const [selectedMR, setSelectedMR] = useState(defaultMR || '');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [visitPlan, setVisitPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState('overview');
  const [selectedDay, setSelectedDay] = useState(null);
  const [mrList, setMrList] = useState([]);
  const [loadingMRs, setLoadingMRs] = useState(true);
  const [accessError, setAccessError] = useState('');
 
  // const [clusterStatus, setClusterStatus] = useState(null); // Old state
  const [clusterStatus, setClusterStatus] = useState({
    isLoading: false,
    clusters: [],
    source: null, // 'AI', 'Fallback', 'None', 'Error'
    error: null,
    timestamp: null
  });

  const viewToggleConfig = [
    { id: 'overview', label: 'Monthly Overview', icon: Calendar },
    { id: 'analytics', label: 'Analytics & Insights', icon: TrendingUp }
  ];

  // Import Supabase client
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.REACT_APP_SUPABASE_ANON_KEY
  );

  // Fetch MR list based on user access level
  useEffect(() => {
    const fetchMRs = async () => {
      setLoadingMRs(true);
      setAccessError('');
      
      try {
        let availableMRs = [];
        
        // Use provided accessible MRs or fetch based on access level
        if (accessibleMRs.length > 0) {
          availableMRs = accessibleMRs;
          console.log('📋 Using provided accessible MRs:', availableMRs.length);
        } else {
          // Fallback: fetch from database and filter by access
          const { data, error } = await supabase
            .from('medical_representatives')
            .select('employee_id, name, territory, is_active')
            .eq('is_active', true)
            .order('name');

          if (error) {
            console.warn('Medical representatives table access failed, trying mr_visits fallback');
            // Fallback to mr_visits table
            const { data: fallbackData, error: fallbackError } = await supabase
              .from('mr_visits')
              .select('mr_name')
              .not('mr_name', 'is', null);

            if (!fallbackError && fallbackData) {
              const uniqueMRs = [...new Set(fallbackData.map(item => item.mr_name))];
              
              // Filter based on user access
              if (user?.access_level === 'admin') {
                availableMRs = uniqueMRs;
              } else if (user?.access_level === 'manager') {
                // Use accessible MRs from auth context
                availableMRs = uniqueMRs.filter(mr => canAccessMRData(mr));
              } else if (user?.access_level === 'mr') {
                availableMRs = user?.mr_name ? [user.mr_name] : [];
              } else {
                availableMRs = []; // Viewers cannot access visit planner
              }
            } else {
              throw new Error('Unable to fetch MR list from any source');
            }
          } else {
            const allMRs = data.map(mr => mr.name);
            
            // Filter based on user access
            if (user?.access_level === 'admin') {
              availableMRs = allMRs;
            } else if (user?.access_level === 'manager') {
              availableMRs = allMRs.filter(mr => canAccessMRData(mr));
            } else if (user?.access_level === 'mr') {
              availableMRs = user?.mr_name ? [user.mr_name] : [];
            } else {
              availableMRs = [];
            }
          }
        }

        setMrList(availableMRs.sort());
        
        // Auto-select MR based on access level
        if (availableMRs.length > 0 && !selectedMR) {
          if (user?.access_level === 'mr' && user?.mr_name) {
            setSelectedMR(user.mr_name);
          } else if (defaultMR && availableMRs.includes(defaultMR)) {
            setSelectedMR(defaultMR);
          } else {
            setSelectedMR(availableMRs[0]);
          }
        }

        // Check access for current selection
        if (selectedMR && !availableMRs.includes(selectedMR)) {
          setAccessError(`Access denied: You don't have permission to view data for ${selectedMR}`);
          setSelectedMR(availableMRs.length > 0 ? availableMRs[0] : '');
        }

        console.log('✅ MR list loaded with access control:', {
          userLevel: user?.access_level,
          totalAvailable: availableMRs.length,
          selectedMR: selectedMR || availableMRs[0]
        });

      } catch (error) {
        console.error('Error fetching MRs:', error);
        setAccessError('Error loading MR list. Please contact administrator.');
      }
      
      setLoadingMRs(false);
    };

    fetchMRs();
  }, [user, accessibleMRs, canAccessMRData]);

  // Validate MR access when selection changes
  useEffect(() => {
    if (selectedMR) {
      if (!canAccessMRData(selectedMR)) {
        setAccessError(`Access denied: You don't have permission to view data for ${selectedMR}`);
        return;
      } else {
        setAccessError('');
      }
    }
  }, [selectedMR, canAccessMRData]);
  
useEffect(() => {
  if (selectedMR) {
    if (!canAccessMRData(selectedMR)) {
      setAccessError(`Access denied: You don't have permission to view data for ${selectedMR}`);
      return;
    } else {
      setAccessError('');
      // Reset cluster status - don't generate automatically
      setClusterStatus({ 
        isLoading: false, 
        clusters: [], 
        source: null, 
        error: null, 
        timestamp: null 
      });
    }
  }
}, [selectedMR, canAccessMRData]);
  
 
  // --- End of Cluster Generation Logic ---

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

  // Generate visit plan with access control
 // UPDATE the generateVisitPlan function to capture cluster info:
const generateVisitPlan = async () => {
  if (!selectedMR) {
    alert('Please select an MR first');
    return;
  }

  if (!canAccessMRData(selectedMR)) {
    setAccessError(`Access denied: You don't have permission to generate plans for ${selectedMR}`);
    return;
  }

  setLoading(true);
  setAccessError('');
  
  // Reset cluster status to show loading during plan generation
  setClusterStatus({
    isLoading: true,
    clusters: [],
    source: null,
    error: null,
    timestamp: new Date().toISOString()
  });
  
  try {
    console.log('Generating plan for:', { selectedMR, selectedMonth, selectedYear });
    console.log('🔒 Access check passed for:', selectedMR);
    
    // Generate the visit plan (which includes clustering)
    const result = await reactVisitPlannerML.generateVisitPlan(
      selectedMR, 
      selectedMonth, 
      selectedYear, 
      10
    );
    
    console.log('Visit Plan Result:', result);
    
    if (result.success) {
      // Extract clustering information from the visit plan
      const clusterInfo = extractClusterInfoFromVisitPlan(result);
      
      // Update cluster status with clusters used in the plan
      setClusterStatus({
        isLoading: false,
        clusters: clusterInfo.clusters,
        source: clusterInfo.source,
        error: null,
        timestamp: new Date().toISOString()
      });
      
      // Transform and set the visit plan
      const transformedPlan = {
        mrName: selectedMR,
        month: selectedMonth,
        year: selectedYear,
        summary: {
          totalWorkingDays: result.summary.total_working_days,
          totalPlannedVisits: result.summary.total_planned_visits,
          estimatedRevenue: result.summary.estimated_revenue,
          efficiencyScore: parseFloat(result.summary.efficiency_score),
          coverageScore: 90
        },
        weeklyBreakdown: transformDailyPlansToWeekly(result.dailyPlans),
        insights: result.insights.map(insight => ({
          type: insight.type,
          title: insight.title,
          value: insight.value,
          description: insight.description,
          recommendation: `Status: ${insight.status}`
        }))
      };
      
      setVisitPlan(transformedPlan);
      console.log('✅ Visit plan generated successfully for', selectedMR);
    } else {
      // Plan generation failed
      setClusterStatus({
        isLoading: false,
        clusters: [],
        source: 'Error',
        error: result.error,
        timestamp: new Date().toISOString()
      });
      
      console.error('Plan generation failed:', result.error);
      alert(`Plan generation failed: ${result.error}`);
    }
  } catch (error) {
    // Handle errors
    setClusterStatus({
      isLoading: false,
      clusters: [],
      source: 'Error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    console.error('Error generating visit plan:', error);
    if (error.message.includes('access') || error.message.includes('permission')) {
      setAccessError('Access denied: Insufficient permissions to generate visit plan');
    } else {
      alert('Error generating visit plan. Please try again.');
    }
  }
  setLoading(false);
};



  // Helper function to extract cluster info from visit plan result
const extractClusterInfoFromPlan = (planResult) => {
  if (!planResult.dailyPlans || !Array.isArray(planResult.dailyPlans)) {
    return { clusters: [], source: 'None' };
  }

  const clusterSet = new Set();
  let source = 'Unknown';

  planResult.dailyPlans.forEach(day => {
    if (day.clusters && Array.isArray(day.clusters)) {
      day.clusters.forEach(cluster => {
        if (cluster.area_name) {
          clusterSet.add(cluster.area_name);
        }
      });
    }
  });

  // Try to determine if AI or fallback was used
  // You might need to add metadata to the plan result to track this
  if (planResult.clustering_source) {
    source = planResult.clustering_source;
  } else {
    // Try to infer from cluster names or other indicators
    const clusterNames = Array.from(clusterSet);
    if (clusterNames.some(name => name.includes('Route') || name.includes('Cluster'))) {
      source = 'AI';
    } else {
      source = 'Fallback';
    }
  }

  return {
    clusters: Array.from(clusterSet).map(areaName => ({
      cluster_name: areaName,
      areas: [areaName] // Simplified - you might want more detailed area info
    })),
    source: source
  };
};

  // Try to detect the source based on cluster characteristics
  // You might want to add a clustering_source field to the plan result for accuracy
  const clusterNames = Array.from(clusterMap.keys());
  if (clusterNames.some(name => 
    name.includes('Route') || 
    name.includes('Cluster') || 
    name.includes('North') || 
    name.includes('South') || 
    name.includes('Central')
  )) {
    detectedSource = 'Gemini AI'; // AI-generated cluster names are usually more descriptive
  }

  return {
    clusters: Array.from(clusterMap.values()),
    source: detectedSource
  };
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
          cluster.customers.map(customer => {
            // Determine customer_type for the dashboard's visitPlan
            // If prospect_generated is true, override customer_type to 'Prospect'
            // Otherwise, use the existing customer.customer_type
            const dashboardCustomerType = customer.prospect_generated
              ? 'Prospect'
              : customer.customer_type;

            return {
              customer_name: customer.customer_name,
              customer_phone: customer.customer_phone,
              customer_type: dashboardCustomerType, // Use the determined type
              area_name: cluster.area_name,
              scheduled_time: `${9 + Math.floor(index % 8)}:00`,
              expected_order_value: customer.predicted_order_value || 2000,
              // Carry over prospect_generated flag if needed elsewhere, though type is now primary
              prospect_generated: customer.prospect_generated || false,
              order_probability: customer.prospect_generated ? 0.3 : 0.7, // This can remain or be re-evaluated
              priority: cluster.area_priority === 'PRIMARY' ? 'HIGH' :
                       cluster.area_priority === 'ROUTE_ROTATION' ? 'HIGH' :
                       customer.prospect_generated ? 'LOW' : // Ensure prospects from NBD have appropriate priority
                       cluster.area_priority === 'PROSPECT' ? 'LOW' : 'MEDIUM' // Existing prospect logic
            };
          })
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

  // Enhanced Customer Breakdown Cards Component - Mobile Responsive
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
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
        <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center">
          <Users className="h-4 w-4 md:h-5 md:w-5 mr-2 text-gray-600" />
          Customer Distribution ({customerBreakdown.total} Total Visits)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          {cards.map((card, index) => {
            const Icon = card.icon;
            const percentage = customerBreakdown.total > 0 ? ((card.count / customerBreakdown.total) * 100).toFixed(1) : 0;
            
            return (
              <div key={index} className={`p-3 md:p-4 rounded-lg border ${card.color}`}>
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`h-4 w-4 md:h-5 md:w-5 ${card.iconColor}`} />
                  <span className="text-xs font-medium">{percentage}%</span>
                </div>
                <div className="text-lg md:text-2xl font-bold mb-1">{card.count}</div>
                <div className="text-xs md:text-sm font-medium">{card.title}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Overview component - Mobile Responsive
  const OverviewComponent = () => (
    <div className="space-y-4 md:space-y-6">
      {/* Summary Cards - Mobile Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600">Working Days</p>
              <p className="text-lg md:text-2xl font-bold text-gray-900">{visitPlan?.summary?.totalWorkingDays || 0}</p>
            </div>
            <Calendar className="h-5 w-5 md:h-8 md:w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600">Total Visits</p>
              <p className="text-lg md:text-2xl font-bold text-gray-900">{visitPlan?.summary?.totalPlannedVisits || 0}</p>
            </div>
            <Users className="h-5 w-5 md:h-8 md:w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600">Expected Revenue</p>
              <p className="text-lg md:text-2xl font-bold text-gray-900">{formatCurrencyByContext(visitPlan?.summary?.estimatedRevenue || 0, 'card')}</p>
            </div>
            <TrendingUp className="h-5 w-5 md:h-8 md:w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600">Efficiency Score</p>
              <p className="text-lg md:text-2xl font-bold text-gray-900">{visitPlan?.summary?.efficiencyScore || 0}%</p>
            </div>
            <Target className="h-5 w-5 md:h-8 md:w-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border-l-4 border-teal-500 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600">Coverage Score</p>
              <p className="text-lg md:text-2xl font-bold text-gray-900">{visitPlan?.summary?.coverageScore || 0}%</p>
            </div>
            <CheckCircle className="h-5 w-5 md:h-8 md:w-8 text-teal-500" />
          </div>
        </div>
      </div>

      {/* AI Insights - Mobile Responsive */}
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
        <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center">
          <Brain className="h-4 w-4 md:h-5 md:w-5 mr-2 text-purple-600" />
          AI-Powered Insights & Recommendations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {visitPlan?.insights?.map((insight, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3 md:p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm md:text-base text-gray-900 truncate mr-2">{insight.title}</h4>
                <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${
                  insight.type === 'risk' ? 'bg-red-100 text-red-800' :
                  insight.type === 'revenue' ? 'bg-green-100 text-green-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {insight.type.toUpperCase()}
                </span>
              </div>
              <p className="text-lg md:text-2xl font-bold text-gray-900 mb-2">{insight.value}</p>
              <p className="text-xs md:text-sm text-gray-600 mb-2 md:mb-3">{insight.description}</p>
              <p className="text-xs text-blue-600 font-medium">💡 {insight.recommendation}</p>
            </div>
          )) || []}
        </div>
      </div>

      {/* Customer Breakdown Cards */}
      <CustomerBreakdownCards />

      {/* Weekly Calendar Overview - Mobile Responsive */}
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
        <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center">
          <CalendarIcon className="h-4 w-4 md:h-5 md:w-5 mr-2" />
          Monthly Visit Calendar
        </h3>
        
        {/* Day Headers - Responsive */}
        <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2 md:mb-4">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="text-center text-xs md:text-sm font-medium text-gray-500 py-1 md:py-2">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Weeks - Mobile Optimized */}
        {visitPlan?.weeklyBreakdown?.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1 md:gap-2 mb-1 md:mb-2">
            {week.days.map((day, dayIndex) => (
              <div
                key={dayIndex}
                className="min-h-16 md:min-h-20 p-1 md:p-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-50 transition-colors flex flex-col justify-between text-xs md:text-sm"
                onClick={() => setSelectedDay(day)}
              >
                <div>
                  <div className="font-medium text-gray-900">{day.date.split('-')[2]}</div>
                  <div className="text-gray-600">{day.summary.totalVisits}v</div>
                  <div className="text-green-600 hidden md:block">{formatCurrencyByContext(day.summary.estimatedRevenue, 'card')}</div>
                  <div className="text-green-600 md:hidden">₹{Math.round(day.summary.estimatedRevenue/1000)}K</div>
                </div>
                {day.summary.highPriorityVisits > 0 && (
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-red-500 rounded-full mt-1 self-end"></div>
                )}
              </div>
            ))}
            {/* Fill in empty cells for the last week if it's not full */}
            { week.days.length < 6 && Array.from({ length: 6 - week.days.length }).map((_, i) => (
                 <div key={`empty-${i}`} className="min-h-16 md:min-h-20 p-1 md:p-2 border border-transparent"></div>
            ))}
            <div className="min-h-16 md:min-h-20 p-1 md:p-2 bg-gray-100 rounded flex flex-col justify-center items-center">
              <div className="text-xs text-gray-500">Sun</div>
              <div className="text-xs text-gray-400 hidden md:block">Rest</div>
            </div>
          </div>
        )) || []}
      </div>

      {/* Daily Area Visit Table */}
      <DailyAreaVisitTable visitPlan={visitPlan} />
    </div>
  );

  return (
    <div className="space-y-4 md:space-y-6 p-3 md:p-0">
      {/* Header with Access Control - Mobile Responsive */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-gray-900 mb-2 flex items-center">
               <Map className="h-5 w-5 md:h-6 md:w-6 mr-2 text-green-600" />
              MR Visit Planner - AI-Powered Route Optimization
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              Generate intelligent visit plans based on customer behavior, route optimization, and revenue potential
            </p>

            {/* Access Control Info - Mobile Responsive */}
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs md:text-sm space-y-2 sm:space-y-0">
              <div className="flex items-center">
                <Shield className="h-3 w-3 md:h-4 md:w-4 mr-1 text-blue-600" />
                <span className="text-blue-800 font-medium">
                  Access Level: {user?.access_level?.toUpperCase()}
                </span>
              </div>
              {user?.access_level === 'mr' && (
                <div className="flex items-center">
                  <User className="h-3 w-3 md:h-4 md:w-4 mr-1 text-green-600" />
                  <span className="text-green-800">Personal Visit Planner</span>
                </div>
              )}
              {user?.access_level === 'manager' && (
                <div className="flex items-center">
                  <Users className="h-3 w-3 md:h-4 md:w-4 mr-1 text-purple-600" />
                  <span className="text-purple-800">Team Access: {mrList.length} MRs</span>
                </div>
              )}
            </div>

            {/* Access Error Display */}
            {accessError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-red-600 mr-2 flex-shrink-0" />
                  <span className="text-red-800 text-sm font-medium">{accessError}</span>
                </div>
              </div>
            )}

            {/* Cluster Status */}
{selectedMR && canAccessMRData(selectedMR) && (
  <div className="mt-2 text-xs md:text-sm">
    <div className="flex items-center">
      <Brain className="h-3 w-3 md:h-4 md:w-4 mr-1 flex-shrink-0" />
      <span className="font-semibold mr-1">Clusters:</span>
      {clusterStatus.isLoading && (
        <span className="text-gray-500 flex items-center">
          <RefreshCw className="h-3 w-3 md:h-4 md:w-4 mr-1 animate-spin" />
          Generating clusters...
        </span>
      )}
      {!clusterStatus.isLoading && clusterStatus.error && (
        <span className="text-red-600 flex items-center">
          <AlertTriangle className="h-3 w-3 md:h-4 md:w-4 mr-1" />
          Error: {clusterStatus.error}
        </span>
      )}
      {!clusterStatus.isLoading && !clusterStatus.error && (
        <>
          {clusterStatus.clusters && clusterStatus.clusters.length > 0 ? (
            <span className="text-green-700">
              {clusterStatus.clusters.length} cluster(s) found
              {clusterStatus.source && (
                <span className={`ml-1 px-1.5 py-0.5 rounded text-xs ${
                  clusterStatus.source === 'Gemini AI' ? 'bg-purple-100 text-purple-700' :
                  clusterStatus.source === 'OpenAI' ? 'bg-blue-100 text-blue-700' :
                  clusterStatus.source === 'Fallback' ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {clusterStatus.source}
                </span>
              )}
            </span>
          ) : (
            <span className="text-gray-500">
              Click "Generate Plan" to create clusters
            </span>
          )}
          {clusterStatus.clusters && clusterStatus.clusters.length > 0 && (
            <CheckCircle className="h-3 w-3 md:h-4 md:w-4 ml-1 text-green-500 flex-shrink-0" />
          )}
        </>
      )}
    </div>
  </div>
)}
          </div>
          
          {/* Action Buttons - Mobile Responsive */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 md:space-x-4">
            <button
              onClick={generateVisitPlan}
              disabled={loading || !selectedMR || !canAccessMRData(selectedMR) || !!accessError}
              className="flex items-center justify-center px-3 md:px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`h-3 w-3 md:h-4 md:w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Generating...' : 'Regenerate Plan'}
            </button>
            
            <button 
              className="flex items-center justify-center px-3 md:px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={!visitPlan || !!accessError}
            >
              <Download className="h-3 w-3 md:h-4 md:w-4 mr-2" />
              Export Plan
            </button>
          </div>
        </div>

        {/* Controls with Access Control - Mobile Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mt-4 md:mt-6">
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
              Medical Representative
              {user?.access_level !== 'admin' && (
                <Shield className="inline h-3 w-3 ml-1 text-orange-500" title="Limited by access permissions" />
              )}
            </label>
            {loadingMRs ? (
              <div className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50">
                Loading MRs...
              </div>
            ) : (
              <select
                value={selectedMR}
                onChange={(e) => setSelectedMR(e.target.value)}
                disabled={user?.access_level === 'mr' || mrList.length <= 1}
                className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  user?.access_level === 'mr' ? 'bg-gray-50 cursor-not-allowed' : ''
                } ${!canAccessMRData(selectedMR) ? 'border-red-300 bg-red-50' : ''}`}
              >
                <option value="">Select an MR...</option>
                {mrList.map(mr => (
                  <option key={mr} value={mr}>{mr}</option>
                ))}
              </select>
            )}
            {user?.access_level === 'mr' && (
              <p className="text-xs text-gray-500 mt-1">
                <Lock className="inline h-3 w-3 mr-1" />
                Locked to your personal account
              </p>
            )}
            {user?.access_level === 'manager' && (
              <p className="text-xs text-blue-600 mt-1">
                <Users className="inline h-3 w-3 mr-1" />
                {mrList.length} team members accessible
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
              Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {getMonthName(i + 1)}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {[2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Access Denied State - Mobile Responsive */}
      {accessError && (
        <div className="bg-white rounded-lg shadow-md p-8 md:p-12 text-center">
          <AlertTriangle className="h-12 w-12 md:h-16 md:w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
          <p className="text-sm md:text-base text-gray-600 mb-4">{accessError}</p>
          {user?.access_level === 'viewer' && (
            <p className="text-xs md:text-sm text-blue-600">
              Contact your manager to request MR or Manager access level for visit planning features.
            </p>
          )}
        </div>
      )}

      {/* Loading State - Mobile Responsive */}
      {loading && !accessError && (
        <div className="bg-white rounded-lg shadow-md p-8 md:p-12 text-center">
          <RefreshCw className="h-8 w-8 md:h-12 md:w-12 text-green-600 animate-spin mx-auto mb-4" />
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">Generating Optimal Visit Plan</h3>
          <p className="text-sm md:text-base text-gray-600">
            Analyzing customer patterns, route optimization, and ML predictions for {selectedMR}...
          </p>
        </div>
      )}

      {/* No MR Selected State - Mobile Responsive */}
      {(!visitPlan && !loading && !accessError) && (
        <div className="bg-white rounded-lg shadow-md p-8 md:p-12 text-center">
          <Brain className="h-8 w-8 md:h-12 md:w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">Ready to Generate Visit Plan</h3>
          <p className="text-sm md:text-base text-gray-600 mb-4">
            {selectedMR && canAccessMRData(selectedMR) ? 
              `Click "Generate Plan" to create an AI-optimized visit plan for ${selectedMR}` :
              'Select a medical representative and click "Generate Plan" to start'
            }
          </p>
          {selectedMR && canAccessMRData(selectedMR) && (
            <button
              onClick={generateVisitPlan}
              className="px-4 md:px-6 py-2 md:py-3 text-sm md:text-base bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              🤖 Generate AI Visit Plan
            </button>
          )}
        </div>
      )}

      {/* Main Content */}
      {visitPlan && !loading && !accessError && selectedMR && canAccessMRData(selectedMR) && (
        <>
           {/* View Toggle - Mobile Responsive */}
          <div className="bg-white rounded-lg shadow-md p-3 md:p-4">
            <div className="flex space-x-1">
              {viewToggleConfig.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveView(id)}
                  className={`flex items-center px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                    activeView === id
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">
                    {id === 'overview' ? 'Overview' : 'Analytics'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Content based on active view */}
          {activeView === 'overview' && <OverviewComponent />}
          {activeView === 'analytics' && <VisitPlannerAnalyticsReal mrName={selectedMR} />}
        </>
      )}

      {/* Selected Day Detail Modal - Mobile Responsive */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] md:h-[85vh] flex flex-col">
            {/* Modal Header - Mobile Responsive */}
            <div className="flex justify-between items-center p-3 md:p-6 border-b border-gray-200">
              <div>
                <h3 className="text-base md:text-xl font-semibold">
                  Visits for {selectedDay.date} ({selectedDay.dayName})
                </h3>
                <p className="text-xs md:text-sm text-gray-600 mt-1">
                  {selectedDay.visits?.length || 0} visits planned for {selectedMR}
                </p>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-gray-400 hover:text-gray-600 text-xl md:text-2xl font-bold w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                ×
              </button>
            </div>

            {/* Modal Content - Scrollable Mobile Optimized */}
            <div className="flex-1 overflow-y-auto p-3 md:p-6">
              <div className="space-y-2 md:space-y-3">
                {selectedDay.visits && selectedDay.visits.length > 0 ? (
                  selectedDay.visits.map((visit, index) => (
                    <div key={index} className="border rounded-lg p-3 md:p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div className="min-w-0 flex-1 mr-2">
                          <h4 className="font-semibold text-sm md:text-lg truncate">{visit.customer_name}</h4>
                          <p className="text-xs md:text-sm text-gray-600 truncate">{visit.customer_type} • {visit.area_name}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${getPriorityColor(visit.priority)}`}>
                          {visit.priority}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-4 text-xs md:text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Time:</span> {visit.scheduled_time}
                        </div>
                        <div>
                          <span className="font-medium">Expected:</span> {formatCurrencyByContext(visit.expected_order_value || 0, 'table')}
                        </div>
                        <div>
                          <span className="font-medium">Order Probability:</span> {((visit.order_probability || 0) * 100).toFixed(0)}%
                        </div>
                        <div>
                          <span className="font-medium">Purpose:</span> {visit.visit_purpose?.replace('_', ' ') || 'Standard'}
                        </div>
                      </div>
                      {visit.customer_phone && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <span className="text-xs md:text-sm text-gray-600">📞 {visit.customer_phone}</span>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-full py-8">
                    <p className="text-gray-500 text-center text-base md:text-lg">No visits planned for this day</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer - Mobile Responsive */}
            <div className="border-t border-gray-200 px-3 md:px-6 py-3 md:py-4">
              <button
                onClick={() => setSelectedDay(null)}
                className="px-4 py-2 text-sm md:text-base bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors ml-auto block"
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

// New Component: DailyAreaVisitTable
const DailyAreaVisitTable = ({ visitPlan }) => {
  if (!visitPlan || !visitPlan.weeklyBreakdown || visitPlan.weeklyBreakdown.length === 0) {
    return (
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-md mt-4 md:mt-6">
        <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center">
          <MapPin className="h-4 w-4 md:h-5 md:w-5 mr-2 text-gray-600" />
          Daily Area Visits
        </h3>
        <p className="text-gray-500">No visit plan data available to display daily areas.</p>
      </div>
    );
  }

  // Directly use weeklyBreakdown, filtering weeks that have at least one day with visits.
  const weeksWithVisits = (visitPlan.weeklyBreakdown || [])
    .map(week => {
      const daysWithActualVisits = week.days.filter(day => day.visits && day.visits.length > 0)
                                          .sort((a, b) => new Date(a.date) - new Date(b.date));
      return { ...week, days: daysWithActualVisits };
    })
    .filter(week => week.days.length > 0);

  const hasAnyPlannedVisits = weeksWithVisits.length > 0;

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-md mt-4 md:mt-6">
      <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center">
        <MapPin className="h-4 w-4 md:h-5 md:w-5 mr-2 text-gray-600" />
        Daily Area Visits (Per Week)
      </h3>
      <div className="overflow-x-auto">
        {hasAnyPlannedVisits ? (
          weeksWithVisits.map((week, weekIndex) => (
            <div key={week.week || weekIndex} className="mb-6 last:mb-0">
              <h4 className="text-sm md:text-base font-semibold text-gray-700 bg-gray-100 p-2 md:p-3 rounded-t-lg border-b border-gray-300">
                {`Week ${week.week || weekIndex + 1}`}
              </h4>
              <table className="min-w-full divide-y divide-gray-200">
                {/* Optional: Keep a global header visible if preferred, or rely on per-week context */}
                <thead className="bg-gray-50 sr-only"> {/* Hidden for now, relying on per-week context */}
                  <tr>
                    <th scope="col" className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                    <th scope="col" className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Areas to Visit</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {week.days.map((day, dayIndex) => {
                    // Aggregate area counts for the current day
                    const areaCounts = day.visits.reduce((acc, visit) => {
                      if (visit.area_name) {
                        acc[visit.area_name] = (acc[visit.area_name] || 0) + 1;
                      }
                      return acc;
                    }, {});

                    const areasWithCountsString = Object.entries(areaCounts)
                      .map(([area, count]) => `${area} (${count} ${count === 1 ? 'visit' : 'visits'})`)
                      .join(', ');

                    return (
                      <tr key={`${week.week || weekIndex}-${dayIndex}`} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap text-xs md:text-sm text-gray-700">
                          {day.date}
                        </td>
                        <td className="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap text-xs md:text-sm text-gray-700">
                          {day.dayName}
                        </td>
                        <td className="px-3 py-2 md:px-4 md:py-3 text-xs md:text-sm text-gray-600">
                          {areasWithCountsString || 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                  {/* This specific condition (week.days.length === 0) should not be met here
                      because we filter weeksWithVisits to only include weeks with days that have visits.
                      If a week has no days with visits, it's filtered out before this map.
                  */}
                </tbody>
              </table>
            </div>
          ))
        ) : (
          <p className="text-gray-500 py-4 text-center">No areas planned for visits.</p>
        )}
      </div>
    </div>
  );
};

export default MRVisitPlannerDashboard;
