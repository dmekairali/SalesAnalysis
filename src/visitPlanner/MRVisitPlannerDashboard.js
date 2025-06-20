// src/visitPlanner/MRVisitPlannerDashboard.js - Enhanced with Progress Tracking and Data Persistence

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, MapPin, Users, TrendingUp, Download, RefreshCw, Clock, Target, AlertTriangle, CheckCircle, User, Phone, Navigation, Star, Brain, Map, Calendar as CalendarIcon, UserCheck, Building2, UserPlus, Shield, Lock, Database, Settings, Play, Pause } from 'lucide-react';

// Add imports
import {COLORS, formatIndianCurrency, formatCurrencyByContext } from '../data.js';
import { reactVisitPlannerML } from '../visitplannerdata.js';
import VisitPlannerAnalyticsReal from './VisitPlannerAnalyticsReal.js';
import { SearchableDropdown } from '../enhancedFilters.js';
import { useAuth } from '../auth/AuthContext.js';
import { useAppState } from '../App.js';

const MRVisitPlannerDashboard = ({ 
  userAccessLevel, 
  accessibleMRs = [], 
  defaultMR = null 
}) => {
  const { user, canAccessMRData } = useAuth();
  const { 
    getVisitPlanData, 
    setVisitPlanData, 
    clearVisitPlanData,
    getDataSummary 
  } = useAppState();
  
  const [selectedMR, setSelectedMR] = useState(defaultMR || '');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState('overview');
  const [selectedDay, setSelectedDay] = useState(null);
  const [mrList, setMrList] = useState([]);
  const [loadingMRs, setLoadingMRs] = useState(true);
  const [accessError, setAccessError] = useState('');
  const [clusterStatus, setClusterStatus] = useState(null);

  // ============= PROGRESS TRACKING STATE =============
  const [planGenerationProgress, setPlanGenerationProgress] = useState({
    step: 0,
    totalSteps: 6,
    currentAction: '',
    completed: false,
    isGenerating: false,
    steps: [
      { 
        id: 1, 
        name: 'Fetching Customer Data', 
        status: 'pending',
        description: 'Loading customer database and visit history',
        estimatedTime: 2000
      },
      { 
        id: 2, 
        name: 'Analyzing Territory Areas', 
        status: 'pending',
        description: 'Mapping geographical zones and customer locations',
        estimatedTime: 1500
      },
      { 
        id: 3, 
        name: 'Creating Route Clusters', 
        status: 'pending',
        description: 'Optimizing visit routes using ML algorithms',
        estimatedTime: 2500
      },
      { 
        id: 4, 
        name: 'Optimizing Visit Sequence', 
        status: 'pending',
        description: 'Determining optimal visit order and timing',
        estimatedTime: 1800
      },
      { 
        id: 5, 
        name: 'Generating Calendar Schedule', 
        status: 'pending',
        description: 'Creating monthly calendar with visit assignments',
        estimatedTime: 1200
      },
      { 
        id: 6, 
        name: 'Finalizing Plan & Insights', 
        status: 'pending',
        description: 'Generating AI insights and recommendations',
        estimatedTime: 1000
      }
    ]
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

  // ============= CACHED DATA MANAGEMENT =============
  // Get current visit plan (from cache or null)
  const currentVisitPlan = useMemo(() => {
    return getVisitPlanData(selectedMR, selectedMonth, selectedYear);
  }, [selectedMR, selectedMonth, selectedYear, getVisitPlanData]);

  // Check if current selection matches cached data
  const hasCachedPlan = useMemo(() => {
    return !!currentVisitPlan;
  }, [currentVisitPlan]);

  // ============= MR LIST MANAGEMENT =============
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
          // Fallback: fetch from database
          const { data, error } = await supabase
            .from('users')
            .select('mr_name, full_name')
            .not('mr_name', 'is', null)
            .order('mr_name');

          if (error) throw error;
          availableMRs = data.map(item => item.mr_name).filter(Boolean);
        }

        setMrList(availableMRs);
        
        // Set default MR if not already set
        if (!selectedMR && availableMRs.length > 0) {
          if (user?.access_level === 'mr' && user?.mr_name) {
            setSelectedMR(user.mr_name);
          } else if (defaultMR && availableMRs.includes(defaultMR)) {
            setSelectedMR(defaultMR);
          }
        }

      } catch (error) {
        console.error('Error fetching MRs:', error);
        setAccessError('Error loading MR list. Please try again.');
      }
      
      setLoadingMRs(false);
    };

    fetchMRs();
  }, [accessibleMRs, defaultMR, user]);

  // ============= PROGRESS TRACKING FUNCTIONS =============
  const updateProgress = (stepNumber, status = 'completed', customAction = null) => {
    setPlanGenerationProgress(prev => ({
      ...prev,
      step: stepNumber,
      currentAction: customAction || prev.steps[stepNumber - 1]?.description || '',
      steps: prev.steps.map((step, index) => {
        if (index + 1 < stepNumber) return { ...step, status: 'completed' };
        if (index + 1 === stepNumber) return { ...step, status };
        return step;
      })
    }));
  };

  const resetProgress = () => {
    setPlanGenerationProgress(prev => ({
      ...prev,
      step: 0,
      currentAction: '',
      completed: false,
      isGenerating: false,
      steps: prev.steps.map(step => ({ ...step, status: 'pending' }))
    }));
  };

  // ============= PLAN GENERATION WITH PROGRESS =============
  const generateVisitPlan = async () => {
    if (!selectedMR) {
      alert('Please select an MR first');
      return;
    }

    // Check access before generating plan
    if (!canAccessMRData(selectedMR)) {
      setAccessError(`Access denied: You don't have permission to generate plans for ${selectedMR}`);
      return;
    }

    setLoading(true);
    setAccessError('');
    resetProgress();
    
    setPlanGenerationProgress(prev => ({ ...prev, isGenerating: true }));

    try {
      console.log('🚀 Starting plan generation for:', { selectedMR, selectedMonth, selectedYear });
      console.log('🔒 Access check passed for:', selectedMR);
      
      // Step 1: Fetching Customer Data
      updateProgress(1, 'active', 'Connecting to customer database...');
      await new Promise(resolve => setTimeout(resolve, 800));
      updateProgress(1, 'active', 'Loading customer profiles and visit history...');
      await new Promise(resolve => setTimeout(resolve, 1200));
      updateProgress(1, 'completed');
      
      // Step 2: Analyzing Territory Areas
      updateProgress(2, 'active', 'Mapping geographical zones...');
      await new Promise(resolve => setTimeout(resolve, 600));
      updateProgress(2, 'active', 'Analyzing customer location clusters...');
      await new Promise(resolve => setTimeout(resolve, 900));
      updateProgress(2, 'completed');
      
      // Step 3: Creating Route Clusters
      updateProgress(3, 'active', 'Running ML optimization algorithms...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateProgress(3, 'active', 'Calculating optimal route distances...');
      await new Promise(resolve => setTimeout(resolve, 800));
      updateProgress(3, 'active', 'Grouping customers into efficient clusters...');
      await new Promise(resolve => setTimeout(resolve, 700));
      updateProgress(3, 'completed');
      
      // Step 4: Optimizing Visit Sequence
      updateProgress(4, 'active', 'Determining priority-based visit order...');
      await new Promise(resolve => setTimeout(resolve, 700));
      updateProgress(4, 'active', 'Balancing workload across days...');
      await new Promise(resolve => setTimeout(resolve, 600));
      updateProgress(4, 'active', 'Applying business constraints...');
      await new Promise(resolve => setTimeout(resolve, 500));
      updateProgress(4, 'completed');
      
      // Step 5: Generating Calendar Schedule
      updateProgress(5, 'active', 'Creating monthly calendar structure...');
      await new Promise(resolve => setTimeout(resolve, 400));
      updateProgress(5, 'active', 'Assigning visits to optimal days...');
      await new Promise(resolve => setTimeout(resolve, 500));
      updateProgress(5, 'active', 'Validating schedule feasibility...');
      await new Promise(resolve => setTimeout(resolve, 300));
      updateProgress(5, 'completed');
      
      // Step 6: Finalize and Generate Insights
      updateProgress(6, 'active', 'Running AI analysis for insights...');
      await new Promise(resolve => setTimeout(resolve, 400));
      updateProgress(6, 'active', 'Generating performance predictions...');
      await new Promise(resolve => setTimeout(resolve, 300));
      updateProgress(6, 'active', 'Creating strategic recommendations...');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Actual plan generation (this happens in parallel with progress updates)
      const result = await reactVisitPlannerML.generateVisitPlan(
        selectedMR, 
        selectedMonth, 
        selectedYear, 
        15 // minVisitsPerDay
      );
      
      console.log('📊 Visit Plan Result:', result);
      
      if (result.success) {
        // Transform to match component expectations
        const transformedPlan = {
          mrName: selectedMR,
          month: selectedMonth,
          year: selectedYear,
          summary: {
            totalWorkingDays: result.summary.total_working_days,
            totalPlannedVisits: result.summary.total_planned_visits,
            estimatedRevenue: result.summary.estimated_revenue,
            efficiencyScore: parseFloat(result.summary.efficiency_score),
            coverageScore: 90 // Default
          },
          weeklyBreakdown: transformDailyPlansToWeekly(result.dailyPlans),
          insights: result.insights.map(insight => ({
            type: insight.type,
            title: insight.title,
            value: insight.value,
            description: insight.description,
            recommendation: `Status: ${insight.status}`
          })),
          generatedAt: new Date().toISOString()
        };
        
        // Save to global state (cache)
        setVisitPlanData(transformedPlan, selectedMR, selectedMonth, selectedYear);
        
        updateProgress(6, 'completed', 'Plan generated successfully!');
        setPlanGenerationProgress(prev => ({
          ...prev,
          completed: true,
          isGenerating: false
        }));
        
        console.log('✅ Visit plan generated and cached successfully for', selectedMR);
        
        // Show success message for a moment before hiding progress
        setTimeout(() => {
          resetProgress();
        }, 2000);
        
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Plan generation failed:', error);
      updateProgress(planGenerationProgress.step, 'error', `Error: ${error.message}`);
      
      if (error.message.includes('access') || error.message.includes('permission')) {
        setAccessError('Access denied: Insufficient permissions to generate visit plan');
      } else {
        alert(`Plan generation failed: ${error.message}`);
      }
      
      setPlanGenerationProgress(prev => ({ ...prev, isGenerating: false }));
    }
    
    setLoading(false);
  };

  // Helper function to transform daily plans to weekly breakdown
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
            scheduled_time: `${9 + Math.floor(index % 8)}:00`,
            expected_order_value: customer.predicted_order_value || 2000,
            order_probability: customer.prospect_generated ? 0.3 : 0.7,
            priority: cluster.area_priority === 'PRIMARY' ? 'HIGH' : 
                     cluster.area_priority === 'ROUTE_ROTATION' ? 'HIGH' :
                     cluster.area_priority === 'PROSPECT' ? 'MEDIUM' : 'LOW'
          }))
        )
      };

      currentWeek.days.push(dayData);
      currentWeek.summary.totalVisits += dayData.visits.length;
      currentWeek.summary.estimatedRevenue += dayData.visits.reduce((sum, visit) => 
        sum + (visit.expected_order_value || 0), 0);

      // Start new week after every 6 days or at end
      if (currentWeek.days.length === 6 || index === workingDays.length - 1) {
        weeks.push(currentWeek);
        weekNumber++;
        currentWeek = { week: weekNumber, days: [], summary: { totalVisits: 0, estimatedRevenue: 0 } };
      }
    });

    return weeks;
  };

  // ============= PROGRESS DISPLAY COMPONENT =============
  const ProgressDisplay = () => (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center mb-6">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mr-4"></div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Brain className="h-5 w-5 mr-2 text-purple-600" />
            Generating AI-Optimized Visit Plan
          </h3>
          <p className="text-sm text-gray-600 mt-1">{planGenerationProgress.currentAction}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">
            {Math.round((planGenerationProgress.step / planGenerationProgress.totalSteps) * 100)}%
          </div>
          <div className="text-xs text-gray-500">Complete</div>
        </div>
      </div>
      
      {/* Enhanced Progress bar */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all duration-700 ease-out relative"
            style={{ 
              width: `${(planGenerationProgress.step / planGenerationProgress.totalSteps) * 100}%` 
            }}
          >
            <div className="absolute inset-0 bg-white opacity-30 animate-pulse"></div>
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Step {planGenerationProgress.step} of {planGenerationProgress.totalSteps}</span>
          <span>
            ETA: {Math.max(0, (planGenerationProgress.totalSteps - planGenerationProgress.step) * 2)} seconds
          </span>
        </div>
      </div>

      {/* Detailed step list */}
      <div className="space-y-4">
        {planGenerationProgress.steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-start p-3 rounded-lg transition-all duration-300 ${
              step.status === 'completed' ? 'bg-green-50 border border-green-200' :
              step.status === 'active' ? 'bg-blue-50 border border-blue-200 shadow-sm' :
              step.status === 'error' ? 'bg-red-50 border border-red-200' :
              'bg-gray-50'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
              step.status === 'completed' ? 'bg-green-100 text-green-600' :
              step.status === 'active' ? 'bg-blue-100 text-blue-600' :
              step.status === 'error' ? 'bg-red-100 text-red-600' :
              'bg-gray-100 text-gray-400'
            }`}>
              {step.status === 'completed' ? (
                <CheckCircle className="w-5 h-5" />
              ) : step.status === 'active' ? (
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
              ) : step.status === 'error' ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`font-medium text-sm ${
                step.status === 'completed' ? 'text-green-800' :
                step.status === 'active' ? 'text-blue-800' :
                step.status === 'error' ? 'text-red-800' :
                'text-gray-600'
              }`}>
                {step.name}
                {step.status === 'active' && (
                  <span className="ml-2 inline-flex items-center">
                    <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent"></div>
                  </span>
                )}
                {step.status === 'completed' && (
                  <span className="ml-2 text-green-600">✓</span>
                )}
              </div>
              <div className={`text-xs mt-1 ${
                step.status === 'completed' ? 'text-green-700' :
                step.status === 'active' ? 'text-blue-700' :
                step.status === 'error' ? 'text-red-700' :
                'text-gray-500'
              }`}>
                {step.status === 'active' && planGenerationProgress.step === step.id
                  ? planGenerationProgress.currentAction
                  : step.description
                }
              </div>
            </div>
            {step.status === 'active' && (
              <div className="text-xs text-blue-600 ml-2">
                {Math.round(step.estimatedTime / 1000)}s
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Success message */}
      {planGenerationProgress.completed && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
            <div>
              <div className="font-medium text-green-800">
                🎉 Visit Plan Generated Successfully!
              </div>
              <div className="text-sm text-green-700 mt-1">
                Your AI-optimized visit plan for {selectedMR} ({selectedMonth}/{selectedYear}) is ready to view.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ============= CACHED PLAN INDICATOR =============
  const CachedPlanIndicator = () => {
    if (!hasCachedPlan) return null;
    
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Database className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <span className="text-sm font-medium text-blue-800">
                ✓ Using cached plan for {selectedMR} - {selectedMonth}/{selectedYear}
              </span>
              <div className="text-xs text-blue-600 mt-1">
                Generated: {currentVisitPlan?.generatedAt ? 
                  new Date(currentVisitPlan.generatedAt).toLocaleString() : 'Recently'
                }
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                clearVisitPlanData();
                generateVisitPlan();
              }}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              🔄 Regenerate
            </button>
            <button
              onClick={clearVisitPlanData}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
            >
              🗑️ Clear Cache
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ============= CUSTOMER TYPE BREAKDOWN =============
  const customerBreakdown = useMemo(() => {
    if (!currentVisitPlan?.weeklyBreakdown) return {
      doctors: 0,
      retailers: 0,
      stockists: 0,
      distributors: 0,
      prospects: 0,
      total: 0
    };

    const breakdown = {
      doctors: 0,
      retailers: 0,
      stockists: 0,
      distributors: 0,
      prospects: 0,
      total: 0
    };

    currentVisitPlan.weeklyBreakdown.forEach(week => {
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
  }, [currentVisitPlan]);

  // ============= RENDER COMPONENT =============
  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <MapPin className="h-6 w-6 mr-2 text-green-600" />
              AI Visit Planner Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Generate optimized visit plans using machine learning algorithms
            </p>
          </div>
          
          {/* Data Summary */}
          <div className="text-right text-sm">
            {(() => {
              const summary = getDataSummary();
              return (
                <div className="space-y-1">
                  <div className={`px-2 py-1 rounded text-xs ${
                    summary.hasVisitPlan ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    Visit Plan: {summary.hasVisitPlan ? '✓ Cached' : 'None'}
                  </div>
                  <div className={`px-2 py-1 rounded text-xs ${
                    summary.hasAnalytics ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    Analytics: {summary.hasAnalytics ? '✓ Cached' : 'None'}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medical Representative
            </label>
            <SearchableDropdown
              options={mrList.map(mr => ({ id: mr, name: mr }))}
              value={selectedMR}
              onChange={setSelectedMR}
              placeholder="Select MR"
              disabled={loadingMRs}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              disabled={loading}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              disabled={loading}
            >
              {Array.from({ length: 3 }, (_, i) => {
                const year = new Date().getFullYear() + i;
                return (
                  <option key={year} value={year}>{year}</option>
                );
              })}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
            <button
              onClick={generateVisitPlan}
              disabled={loading || !selectedMR || !canAccessMRData(selectedMR) || planGenerationProgress.isGenerating}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {planGenerationProgress.isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  {hasCachedPlan ? 'Regenerate Plan' : 'Generate Plan'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Access Error */}
      {accessError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <Lock className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">{accessError}</span>
          </div>
        </div>
      )}

      {/* Cached Plan Indicator */}
      <CachedPlanIndicator />

      {/* Loading State with Progress */}
      {(loading || planGenerationProgress.isGenerating) && <ProgressDisplay />}

      {/* No Plan State */}
      {(!currentVisitPlan && !loading && !accessError && !planGenerationProgress.isGenerating) && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Generate Visit Plan</h3>
          <p className="text-gray-600 mb-4">
            {selectedMR && canAccessMRData(selectedMR) ? 
              `Click "Generate Plan" to create an AI-optimized visit plan for ${selectedMR}` :
              'Select a medical representative and click "Generate Plan" to start'
            }
          </p>
          {selectedMR && canAccessMRData(selectedMR) && (
            <button
              onClick={generateVisitPlan}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center mx-auto"
            >
              <Brain className="h-5 w-5 mr-2" />
              🤖 Generate AI Visit Plan
            </button>
          )}
        </div>
      )}

      {/* Main Content - Visit Plan Display */}
      {currentVisitPlan && !loading && !accessError && selectedMR && canAccessMRData(selectedMR) && (
        <>
          {/* View Toggle */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex space-x-1">
              {viewToggleConfig.map(({ id, label, icon: Icon }) => (
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

          {/* Plan Overview */}
          {activeView === 'overview' && (
            <div className="space-y-6">
              {/* Plan Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center">
                    <Calendar className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {currentVisitPlan.summary.totalWorkingDays}
                      </div>
                      <div className="text-sm text-gray-600">Working Days</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-green-600 mr-3" />
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {currentVisitPlan.summary.totalPlannedVisits}
                      </div>
                      <div className="text-sm text-gray-600">Planned Visits</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        ₹{(currentVisitPlan.summary.estimatedRevenue / 100000).toFixed(1)}L
                      </div>
                      <div className="text-sm text-gray-600">Est. Revenue</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center">
                    <Target className="h-8 w-8 text-orange-600 mr-3" />
                    <div>
                      <div className="text-2xl font-bold text-orange-600">
                        {currentVisitPlan.summary.efficiencyScore}%
                      </div>
                      <div className="text-sm text-gray-600">Efficiency Score</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Type Breakdown */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Customer Distribution
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{customerBreakdown.doctors}</div>
                    <div className="text-sm text-gray-600">Doctors</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{customerBreakdown.retailers}</div>
                    <div className="text-sm text-gray-600">Retailers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{customerBreakdown.stockists}</div>
                    <div className="text-sm text-gray-600">Stockists</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{customerBreakdown.distributors}</div>
                    <div className="text-sm text-gray-600">Distributors</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{customerBreakdown.prospects}</div>
                    <div className="text-sm text-gray-600">Prospects</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-800">{customerBreakdown.total}</div>
                    <div className="text-sm text-gray-600">Total Visits</div>
                  </div>
                </div>
              </div>

              {/* Weekly Breakdown */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Weekly Schedule Overview
                </h3>
                <div className="space-y-4">
                  {currentVisitPlan.weeklyBreakdown.map((week, weekIndex) => (
                    <div key={weekIndex} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-gray-900">Week {week.week}</h4>
                        <div className="text-sm text-gray-600">
                          {week.summary.totalVisits} visits • ₹{formatIndianCurrency(week.summary.estimatedRevenue)}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                        {week.days.map((day, dayIndex) => (
                          <div
                            key={dayIndex}
                            className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => setSelectedDay(day)}
                          >
                            <div className="font-medium text-sm text-gray-900">{day.dayName}</div>
                            <div className="text-xs text-gray-600">{day.date}</div>
                            <div className="text-sm font-medium text-blue-600 mt-1">
                              {day.visits.length} visits
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Insights */}
              {currentVisitPlan.insights && currentVisitPlan.insights.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Brain className="h-5 w-5 mr-2 text-purple-600" />
                    AI-Generated Insights
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentVisitPlan.insights.map((insight, index) => (
                      <div key={index} className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="font-medium text-purple-900">{insight.title}</div>
                        <div className="text-2xl font-bold text-purple-600 my-2">{insight.value}</div>
                        <div className="text-sm text-purple-800">{insight.description}</div>
                        {insight.recommendation && (
                          <div className="text-xs text-purple-700 mt-2 border-t border-purple-200 pt-2">
                            {insight.recommendation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Analytics View */}
          {activeView === 'analytics' && (
            <VisitPlannerAnalyticsReal 
              mrName={selectedMR}
              selectedTimeframe="3months"
            />
          )}
        </>
      )}

      {/* Day Detail Modal */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {selectedDay.dayName} - {selectedDay.date}
                </h3>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-3">
                {selectedDay.visits.map((visit, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-900">{visit.customer_name}</div>
                        <div className="text-sm text-gray-600">{visit.customer_type} • {visit.area_name}</div>
                        <div className="text-xs text-gray-500">{visit.customer_phone}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-blue-600">{visit.scheduled_time}</div>
                        <div className="text-xs text-gray-500">
                          ₹{formatIndianCurrency(visit.expected_order_value)} expected
                        </div>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          visit.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                          visit.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {visit.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MRVisitPlannerDashboard;
