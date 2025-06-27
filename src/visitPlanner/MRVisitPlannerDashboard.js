// Updated MRVisitPlannerDashboard.js with Access Control - FIXED VERSION

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, MapPin, Users, TrendingUp, Download, RefreshCw, Clock, Target, AlertTriangle, CheckCircle, User, Phone, Navigation, Star, Brain, Map, Calendar as CalendarIcon, UserCheck, Building2, UserPlus, Shield, Lock  } from 'lucide-react';
import { createClient } from '@supabase/supabase-js'; // MOVED TO TOP LEVEL

// Add imports
import {COLORS, formatIndianCurrency, formatCurrencyByContext } from '../data.js';
import { reactVisitPlannerML } from '../visitplannerdata.js';
import VisitPlannerAnalyticsReal from './VisitPlannerAnalyticsReal.js';
import { SearchableDropdown } from '../enhancedFilters.js';
import { useAuth } from '../auth/AuthContext.js';

// Initialize Supabase client at module level
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

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
 
  const [clusterStatus, setClusterStatus] = useState(null);
  const viewToggleConfig = [
    { id: 'overview', label: 'Monthly Overview', icon: Calendar },
    { id: 'analytics', label: 'Analytics & Insights', icon: TrendingUp }
  ];

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
          // Fallback: fetch based on access level
          if (userAccessLevel === 'admin') {
            // Admin can see all MRs
            const { data, error } = await supabase
              .from('auth_users')
              .select('mr_name')
              .eq('access_level', 'mr')
              .order('mr_name');
            
            if (error) throw error;
            availableMRs = data.map(row => row.mr_name).filter(Boolean);
          } else if (userAccessLevel === 'manager') {
            // Manager can see team MRs (this would need proper team structure)
            const { data, error } = await supabase
              .from('auth_users')
              .select('mr_name')
              .eq('access_level', 'mr')
              .order('mr_name');
            
            if (error) throw error;
            availableMRs = data.map(row => row.mr_name).filter(Boolean);
          } else if (userAccessLevel === 'mr') {
            // MR can only see their own data
            availableMRs = [user?.mr_name].filter(Boolean);
          }
        }
        
        setMrList(availableMRs);
        
        // Auto-select MR if only one available or if defaultMR is provided
        if (availableMRs.length === 1) {
          setSelectedMR(availableMRs[0]);
        } else if (defaultMR && availableMRs.includes(defaultMR)) {
          setSelectedMR(defaultMR);
        }
        
      } catch (error) {
        console.error('❌ Error fetching MRs:', error);
        setAccessError('Failed to load MR list. Please check your permissions.');
      } finally {
        setLoadingMRs(false);
      }
    };
    
    fetchMRs();
  }, [userAccessLevel, accessibleMRs, defaultMR, user]);

  // Generate visit plan using ML
  const generateVisitPlan = async () => {
    if (!selectedMR) {
      alert('Please select an MR first');
      return;
    }

    // Check access permissions
    if (!canAccessMRData(selectedMR)) {
      setAccessError(`Access denied: You don't have permission to view data for ${selectedMR}`);
      return;
    }
    
    setLoading(true);
    setAccessError('');
    
    try {
      console.log(`🔄 Generating visit plan for ${selectedMR} - ${selectedMonth}/${selectedYear}`);
      
      // Generate ML-powered visit plan
      const generatedPlan = await reactVisitPlannerML.generateMonthlyPlan(
        selectedMR, 
        selectedMonth, 
        selectedYear
      );
      
      if (generatedPlan) {
        setVisitPlan(generatedPlan);
        console.log('✅ Visit plan generated successfully');
        
        // Store in database
        await supabase
          .from('visit_plans')
          .upsert({
            mr_name: selectedMR,
            month: selectedMonth,
            year: selectedYear,
            plan_data: generatedPlan,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
      } else {
        throw new Error('Failed to generate visit plan');
      }
      
    } catch (error) {
      console.error('❌ Error generating visit plan:', error);
      setAccessError('Failed to generate visit plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load existing visit plan
  const loadVisitPlan = async () => {
    if (!selectedMR) return;
    
    // Check access permissions
    if (!canAccessMRData(selectedMR)) {
      setAccessError(`Access denied: You don't have permission to view data for ${selectedMR}`);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('visit_plans')
        .select('*')
        .eq('mr_name', selectedMR)
        .eq('month', selectedMonth)
        .eq('year', selectedYear)
        .order('updated_at', { ascending: false })
        .limit(1);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        setVisitPlan(data[0].plan_data);
        console.log('✅ Loaded existing visit plan');
      } else {
        setVisitPlan(null);
        console.log('ℹ️ No existing plan found');
      }
      
    } catch (error) {
      console.error('❌ Error loading visit plan:', error);
    }
  };

  // Load visit plan when MR/month/year changes
  useEffect(() => {
    if (selectedMR && !loadingMRs) {
      loadVisitPlan();
    }
  }, [selectedMR, selectedMonth, selectedYear, loadingMRs]);

  // Export visit plan
  const exportVisitPlan = () => {
    if (!visitPlan) return;
    
    const exportData = [
      [`Visit Plan for ${selectedMR} - ${selectedMonth}/${selectedYear}`],
      [''],
      ['Date', 'Day', 'Customer Name', 'Location', 'Cluster', 'Priority', 'Expected Revenue', 'Notes'],
      ...visitPlan.dailyPlans.flatMap(day => 
        day.visits.map(visit => [
          day.date,
          day.dayName,
          visit.customerName,
          `${visit.customerLocation.city}, ${visit.customerLocation.state}`,
          visit.cluster,
          visit.priority,
          `₹${visit.expectedRevenue.toLocaleString()}`,
          visit.notes || ''
        ])
      )
    ];

    const csvContent = exportData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visit_plan_${selectedMR}_${selectedMonth}_${selectedYear}.csv`;
    a.click();
  };

  // Calculate plan statistics
  const planStats = useMemo(() => {
    if (!visitPlan) return null;
    
    const totalVisits = visitPlan.dailyPlans.reduce((sum, day) => sum + day.visits.length, 0);
    const totalRevenue = visitPlan.dailyPlans.reduce((sum, day) => 
      sum + day.visits.reduce((daySum, visit) => daySum + visit.expectedRevenue, 0), 0
    );
    const uniqueCustomers = new Set(
      visitPlan.dailyPlans.flatMap(day => day.visits.map(visit => visit.customerName))
    ).size;
    const avgRevenuePerVisit = totalRevenue / totalVisits;
    
    return {
      totalVisits,
      totalRevenue,
      uniqueCustomers,
      avgRevenuePerVisit,
      efficiency: visitPlan.mlInsights?.efficiency || 85
    };
  }, [visitPlan]);

  // Access Control Check Component
  const AccessControlCheck = () => {
    if (userAccessLevel === 'mr' && selectedMR && selectedMR !== user?.mr_name) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <Lock className="h-5 w-5 text-red-600 mr-3" />
            <div>
              <h4 className="font-semibold text-red-800">Access Restricted</h4>
              <p className="text-sm text-red-700">
                You can only view your own visit plans. Selected MR: {selectedMR}
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    if (accessError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
            <div>
              <h4 className="font-semibold text-red-800">Access Error</h4>
              <p className="text-sm text-red-700">{accessError}</p>
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };

  // Loading state
  if (loadingMRs) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
          <div className="text-lg font-semibold">Loading MR Access...</div>
          <div className="text-sm text-gray-600 mt-2">Checking permissions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Access Level Indicator */}
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <MapPin className="h-7 w-7 mr-3 text-green-600" />
              MR Visit Planner
              <Shield className="h-5 w-5 ml-3 text-blue-600" />
            </h2>
            <p className="text-gray-600 mt-2">
              AI-powered visit planning and territory optimization
            </p>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              userAccessLevel === 'admin' ? 'bg-red-100 text-red-800' :
              userAccessLevel === 'manager' ? 'bg-blue-100 text-blue-800' :
              'bg-green-100 text-green-800'
            }`}>
              <Shield className="h-4 w-4 mr-1" />
              {userAccessLevel?.toUpperCase()} Access
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {mrList.length} MR{mrList.length !== 1 ? 's' : ''} accessible
            </div>
          </div>
        </div>
      </div>

      {/* Access Control Check */}
      <AccessControlCheck />

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          {/* MR Selection */}
          <SearchableDropdown
            options={mrList}
            value={selectedMR}
            onChange={setSelectedMR}
            placeholder="Select MR"
            label="Medical Representative"
            disabled={mrList.length === 0}
            accessRestricted={userAccessLevel !== 'admin'}
            restrictionMessage={`Showing MRs based on your ${userAccessLevel} access level`}
          />

          {/* Month Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2024, i).toLocaleDateString('en-US', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>

          {/* Year Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {Array.from({ length: 3 }, (_, i) => (
                <option key={2024 + i} value={2024 + i}>
                  {2024 + i}
                </option>
              ))}
            </select>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateVisitPlan}
            disabled={loading || !selectedMR}
            className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Brain className="h-4 w-4 mr-2" />
            )}
            {loading ? 'Generating...' : 'Generate Plan'}
          </button>

          {/* Export Button */}
          <button
            onClick={exportVisitPlan}
            disabled={!visitPlan}
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Plan
          </button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex space-x-2">
          {viewToggleConfig.map(view => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === view.id
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <view.icon className="h-4 w-4 mr-2" />
              {view.label}
            </button>
          ))}
        </div>
      </div>

      {/* Plan Statistics */}
      {planStats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Visits</p>
                <p className="text-2xl font-bold text-gray-900">{planStats.totalVisits}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Expected Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrencyByContext(planStats.totalRevenue, 'card')}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Unique Customers</p>
                <p className="text-2xl font-bold text-gray-900">{planStats.uniqueCustomers}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Revenue/Visit</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrencyByContext(planStats.avgRevenuePerVisit, 'card')}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Efficiency Score</p>
                <p className="text-2xl font-bold text-gray-900">{planStats.efficiency}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Based on Active View */}
      {activeView === 'overview' && (
        <OverviewView 
          visitPlan={visitPlan} 
          selectedDay={selectedDay} 
          setSelectedDay={setSelectedDay}
          selectedMR={selectedMR}
        />
      )}

      {activeView === 'analytics' && (
        <VisitPlannerAnalyticsReal 
          selectedMR={selectedMR}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          userAccessLevel={userAccessLevel}
        />
      )}
    </div>
  );
};

// Overview View Component (placeholder - you can implement the actual calendar view)
const OverviewView = ({ visitPlan, selectedDay, setSelectedDay, selectedMR }) => {
  if (!visitPlan) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">No Visit Plan Generated</h3>
        <p className="text-gray-500">
          Generate a visit plan for {selectedMR} to see the monthly overview.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Monthly Calendar View */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Monthly Visit Calendar</h3>
        <div className="grid grid-cols-7 gap-2">
          {/* Calendar headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center font-medium text-gray-600 text-sm">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {visitPlan.dailyPlans.map(day => (
            <div
              key={day.date}
              onClick={() => setSelectedDay(day)}
              className={`p-2 border rounded-lg cursor-pointer transition-colors min-h-20 ${
                selectedDay?.date === day.date
                  ? 'bg-green-100 border-green-500'
                  : day.visits.length > 0
                  ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="text-sm font-medium">{new Date(day.date).getDate()}</div>
              <div className="text-xs text-gray-600">{day.visits.length} visits</div>
              {day.visits.length > 0 && (
                <div className="text-xs text-green-600 font-medium">
                  ₹{day.visits.reduce((sum, visit) => sum + visit.expectedRevenue, 0).toLocaleString()}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Selected Day Details */}
      {selectedDay && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">
            Visits for {new Date(selectedDay.date).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
          
          {selectedDay.visits.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No visits planned for this day</p>
          ) : (
            <div className="space-y-4">
              {selectedDay.visits.map((visit, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-lg">{visit.customerName}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      visit.priority === 'high' ? 'bg-red-100 text-red-800' :
                      visit.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {visit.priority} priority
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Location:</span>
                      <div className="font-medium">{visit.customerLocation.city}, {visit.customerLocation.state}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Cluster:</span>
                      <div className="font-medium">{visit.cluster}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Expected Revenue:</span>
                      <div className="font-medium text-green-600">₹{visit.expectedRevenue.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Contact:</span>
                      <div className="font-medium">{visit.phone || 'N/A'}</div>
                    </div>
                  </div>
                  {visit.notes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600 text-sm">Notes:</span>
                      <div className="text-sm">{visit.notes}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MRVisitPlannerDashboard;
