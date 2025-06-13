import React from 'react';
import { TrendingUp, Users, Target, DollarSign, Briefcase, Percent, UserPlus, BarChart3 } from 'lucide-react';

const PerformanceMetricsDisplay = ({ visitPlan }) => {
  if (!visitPlan || !visitPlan.summary || !visitPlan.weeklyBreakdown) {
    return (
      <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
        <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p>No performance metrics to display.</p>
        <p className="text-sm">Please generate a visit plan to see the metrics.</p>
      </div>
    );
  }

  const { summary, weeklyBreakdown } = visitPlan;

  // Ensure all necessary summary fields are present with defaults if not
  const totalWorkingDays = summary.totalWorkingDays || summary.total_working_days || 0;
  const totalPlannedVisits = summary.totalPlannedVisits || summary.total_planned_visits || 0;
  const totalUniqueCustomersVisited = summary.totalUniqueCustomersVisited || summary.total_unique_customers_visited || 0;
  const totalProspectsTargeted = summary.totalProspectsTargeted || summary.total_prospects_targeted || 0;
  const estimatedRevenue = summary.estimatedRevenue || summary.estimated_revenue || 0;
  const avgVisitsPerDay = summary.avgVisitsPerDay || summary.avg_visits_per_day || 0;
  const coverageScore = summary.coverageScore || 0; // Assuming this will be added to summary later or is already there
  const efficiencyScore = summary.efficiencyScore || 0;

  // --- Calculations ---

  // Planned New Customer Acquisition Rate
  const totalTargeted = totalUniqueCustomersVisited + totalProspectsTargeted;
  const plannedNewCustomerAcquisitionRate = totalTargeted > 0
    ? (totalProspectsTargeted / totalTargeted) * 100
    : 0;

  // Average Revenue per Visit
  const averageRevenuePerVisit = totalPlannedVisits > 0
    ? estimatedRevenue / totalPlannedVisits
    : 0;

  // Revenue by Customer Type
  const revenueByCustomerType = {};
  weeklyBreakdown.forEach(week => {
    week.days.forEach(day => {
      if (day.visits && Array.isArray(day.visits)) {
        day.visits.forEach(visit => {
          const type = visit.customer_type || 'Unknown';
          const value = visit.expected_order_value || 0;
          if (!revenueByCustomerType[type]) {
            revenueByCustomerType[type] = 0;
          }
          revenueByCustomerType[type] += value;
        });
      }
    });
  });

  const formatCurrency = (value) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)}L`;
    }
    return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const metricCardClasses = "bg-white p-4 rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow";
  const metricIconClasses = "h-7 w-7 mr-3";
  const metricValueClasses = "text-2xl font-bold text-gray-800";
  const metricLabelClasses = "text-sm text-gray-600";

  return (
    <div className="space-y-8 p-1 bg-gray-50 rounded-lg">
      {/* Overall Plan Summary Section */}
      <section>
        <h3 className="text-xl font-semibold mb-4 text-gray-700 flex items-center">
          <Briefcase className="h-6 w-6 mr-2 text-indigo-600" />
          Overall Plan Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className={metricCardClasses}>
            <p className={metricLabelClasses}>Working Days</p>
            <p className={metricValueClasses}>{totalWorkingDays}</p>
          </div>
          <div className={metricCardClasses}>
            <p className={metricLabelClasses}>Total Visits</p>
            <p className={metricValueClasses}>{totalPlannedVisits}</p>
          </div>
          <div className={metricCardClasses}>
            <p className={metricLabelClasses}>Unique Customers Visited</p>
            <p className={metricValueClasses}>{totalUniqueCustomersVisited}</p>
          </div>
          <div className={metricCardClasses}>
            <p className={metricLabelClasses}>Prospects Targeted</p>
            <p className={metricValueClasses}>{totalProspectsTargeted}</p>
          </div>
           <div className={metricCardClasses}>
            <p className={metricLabelClasses}>Avg. Visits/Day</p>
            <p className={metricValueClasses}>{parseFloat(avgVisitsPerDay).toFixed(1)}</p>
          </div>
          <div className={`${metricCardClasses} col-span-2 md:col-span-1`}>
            <p className={metricLabelClasses}>Overall Est. Revenue</p>
            <p className={`${metricValueClasses} text-green-600`}>{formatCurrency(estimatedRevenue)}</p>
          </div>
        </div>
      </section>

      {/* Key Performance Indicators (KPIs) Section */}
      <section>
        <h3 className="text-xl font-semibold mb-4 text-gray-700 flex items-center">
          <Target className="h-6 w-6 mr-2 text-red-600" />
          Key Performance Indicators
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={metricCardClasses}>
            <p className={metricLabelClasses}>Coverage Score</p>
            <p className={metricValueClasses}>{coverageScore.toFixed(1)}%</p>
          </div>
          <div className={metricCardClasses}>
            <p className={metricLabelClasses}>Efficiency Score</p>
            <p className={metricValueClasses}>{efficiencyScore.toFixed(1)}%</p>
          </div>
          <div className={metricCardClasses}>
            <p className={metricLabelClasses}>New Customer Acquisition Rate</p>
            <p className={metricValueClasses}>{plannedNewCustomerAcquisitionRate.toFixed(1)}%</p>
          </div>
        </div>
      </section>

      {/* Revenue Metrics Section */}
      <section>
        <h3 className="text-xl font-semibold mb-4 text-gray-700 flex items-center">
          <DollarSign className="h-6 w-6 mr-2 text-green-600" />
          Revenue Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className={metricCardClasses}>
                <p className={metricLabelClasses}>Total Expected Revenue</p>
                <p className={`${metricValueClasses} text-green-600`}>{formatCurrency(estimatedRevenue)}</p>
            </div>
            <div className={metricCardClasses}>
                <p className={metricLabelClasses}>Avg. Revenue per Visit (Expected)</p>
                <p className={`${metricValueClasses} text-green-600`}>{formatCurrency(averageRevenuePerVisit)}</p>
            </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <h4 className="text-md font-semibold mb-3 text-gray-700">Revenue by Customer Type:</h4>
            {Object.keys(revenueByCustomerType).length > 0 ? (
            <ul className="space-y-2">
                {Object.entries(revenueByCustomerType)
                .sort(([, revA], [, revB]) => revB - revA) // Sort by revenue desc
                .map(([type, revenue]) => (
                    <li key={type} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50">
                    <span className="text-sm font-medium text-gray-700">{type}</span>
                    <span className="text-sm font-semibold text-green-700">{formatCurrency(revenue)}</span>
                    </li>
                ))}
            </ul>
            ) : (
            <p className="text-sm text-gray-500">No detailed revenue by customer type available.</p>
            )}
        </div>
      </section>
    </div>
  );
};

export default PerformanceMetricsDisplay;
