// Step 3: Create src/visitPlanner/MRVisitPlannerDashboard.js

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, MapPin, Users, TrendingUp, Download, RefreshCw, Clock, Target, AlertTriangle, CheckCircle, User, Phone, Navigation, Star, Brain, Calendar as CalendarIcon } from 'lucide-react';

// Import your existing components and utilities
import { COLORS } from '../data.js';
import { SearchableDropdown } from '../enhancedFilters.js';

const MRVisitPlannerDashboard = () => {
  const [selectedMR, setSelectedMR] = useState('Rajesh Kumar');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [visitPlan, setVisitPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState('overview'); // overview, calendar, analytics
  const [selectedDay, setSelectedDay] = useState(null);

  // Mock MR list - replace with actual data from your backend
  const mrList = [
    'Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sneha Reddy', 
    'Vikram Singh', 'Anjali Gupta', 'Rohit Jain', 'Kavya Nair'
  ];

  // Mock function to simulate ML visit plan generation
  const generateVisitPlan = async () => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock visit plan data
      const mockPlan = {
        mrName: selectedMR,
        month: selectedMonth,
        year: selectedYear,
        summary: {
          totalWorkingDays: 26,
          totalPlannedVisits: 234,
          estimatedRevenue: 650000,
          efficiencyScore: 90,
          coverageScore: 92
        },
        weeklyBreakdown: generateMockWeeklyData(),
        insights: [
          {
            type: 'optimization',
            title: 'Route Efficiency',
            value: '85%',
            description: 'Optimal geographical clustering achieved',
            recommendation: 'Focus on high-probability customers in Area 2'
          },
          {
            type: 'revenue',
            title: 'Revenue Potential',
            value: '₹6.5L',
            description: 'Expected monthly revenue target',
            recommendation: 'Prioritize premium product customers'
          },
          {
            type: 'risk',
            title: 'Churn Prevention',
            value: '12 customers',
            description: 'High-risk customers requiring attention',
            recommendation: 'Schedule retention visits immediately'
          }
        ]
      };
      
      setVisitPlan(mockPlan);
    } catch (error) {
      console.error('Error generating visit plan:', error);
    }
    setLoading(false);
  };

  // Generate mock weekly data
  const generateMockWeeklyData = () => {
    const weeks = [];
    for (let week = 1; week <= 4; week++) {
      const weekData = {
        week,
        days: [],
        summary: {
          totalVisits: 0,
          estimatedRevenue: 0,
          areasVisited: new Set()
        }
      };

      for (let day = 1; day <= 6; day++) { // Monday to Saturday
        const dayData = {
          date: `2024-${selectedMonth.toString().padStart(2, '0')}-${((week-1)*7 + day).toString().padStart(2, '0')}`,
          dayName: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day - 1],
          visits: generateMockDayVisits(),
          summary: {
            totalVisits: Math.floor(Math.random() * 3) + 8, // 8-10 visits per day
            estimatedRevenue: Math.floor(Math.random() * 10000) + 20000, // 20-30k per day
            areasVisited: Math.floor(Math.random() * 2) + 2, // 2-3 areas per day
            highPriorityVisits: Math.floor(Math.random() * 3) + 2 // 2-4 high priority
          }
        };
        
        weekData.days.push(dayData);
        weekData.summary.totalVisits += dayData.summary.totalVisits;
        weekData.summary.estimatedRevenue += dayData.summary.estimatedRevenue;
      }
      
      weeks.push(weekData);
    }
    return weeks;
  };

  // Generate mock visits for a day
  const generateMockDayVisits = () => {
    const visits = [];
    const customerTypes = ['Doctor', 'Retailer', 'Stockist'];
    const areas = ['Bandra West', 'Andheri East', 'Juhu', 'Santacruz'];
    const priorities = ['HIGH', 'MEDIUM', 'LOW'];
    
    const visitCount = Math.floor(Math.random() * 3) + 8;
    
    for (let i = 0; i < visitCount; i++) {
      visits.push({
        id: `visit_${i}`,
        customerName: `Customer ${i + 1}`,
        customerType: customerTypes[Math.floor(Math.random() * customerTypes.length)],
        area: areas[Math.floor(Math.random() * areas.length)],
        scheduledTime: `${9 + Math.floor(i * 0.8)}:${['00', '30'][Math.floor(Math.random() * 2)]}`,
        expectedRevenue: Math.floor(Math.random() * 5000) + 1000,
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        orderProbability: Math.random() * 0.8 + 0.2,
        lastVisitDays: Math.floor(Math.random() * 60) + 1,
        isProspect: Math.random() > 0.8
      });
    }
    
    return visits.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  };

  // Generate plan on component mount and when parameters change
  useEffect(() => {
    generateVisitPlan();
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <Navigation className="h-6 w-6 mr-2 text-green-600" />
              MR Visit Planner - AI-Powered Route Optimization
            </h1>
            <p className="text-gray-600">
              Generate intelligent visit plans based on customer behavior, route optimization, and revenue potential
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={generateVisitPlan}
              disabled={loading}
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
            <select
              value={selectedMR}
              onChange={(e) => setSelectedMR(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {mrList.map(mr => (
                <option key={mr} value={mr}>{mr}</option>
              ))}
            </select>
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
          {activeView === 'analytics' && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">Analytics Coming Soon</h3>
              <p className="text-gray-600">Advanced analytics and performance metrics will be available here.</p>
            </div>
          )}
        </>
      )}

      {/* Selected Day Detail Modal would go here */}
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
              {selectedDay.visits.map((visit, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{visit.customerName}</h4>
                      <p className="text-sm text-gray-600">{visit.customerType} • {visit.area}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(visit.priority)}`}>
                      {visit.priority}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Time: {visit.scheduledTime} | Expected: ₹{visit.expectedRevenue.toLocaleString()}</p>
                    <p>Order Probability: {(visit.orderProbability * 100).toFixed(0)}% | Last visit: {visit.lastVisitDays} days ago</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MRVisitPlannerDashboard;
