import React from 'react';
import { Users, Star, TrendingUp, Lightbulb, BarChart, UserCheck, Building2, UserPlus } from 'lucide-react';

const CustomerInsightsDisplay = ({ visitPlan }) => {
  if (!visitPlan || !visitPlan.summary || !visitPlan.weeklyBreakdown || !visitPlan.insights) {
    return (
      <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
        <Lightbulb className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p>No customer insights to display.</p>
        <p className="text-sm">Please generate a visit plan to see the insights.</p>
      </div>
    );
  }

  const { summary, weeklyBreakdown, insights } = visitPlan;

  // --- Calculations & Data Preparation ---

  // 1. Customer Segmentation Recap (Unique Visited Customers by Type)
  const uniqueVisitedCustomersByType = {};
  const visitedCustomerPhones = new Set(); // To track unique customers

  weeklyBreakdown.forEach(week => {
    week.days.forEach(day => {
      if (day.visits && Array.isArray(day.visits)) {
        day.visits.forEach(visit => {
          if (visit.customer_phone && !visit.prospect_generated) { // Only count actual customers, not prospects here
            if (!visitedCustomerPhones.has(visit.customer_phone)) {
              visitedCustomerPhones.add(visit.customer_phone);
              const type = visit.customer_type || 'Unknown';
              uniqueVisitedCustomersByType[type] = (uniqueVisitedCustomersByType[type] || 0) + 1;
            }
          }
        });
      }
    });
  });
  // Add prospects from summary for a complete picture if desired, or keep separate
  // For this section, focusing on *visited* non-prospect customers.
  // totalProspectsTargeted is already in summary for overall count.

  // 2. Visit Priority Breakdown
  const priorityCounts = {};
  weeklyBreakdown.forEach(week => {
    week.days.forEach(day => {
      if (day.visits && Array.isArray(day.visits)) {
        day.visits.forEach(visit => {
          const priority = visit.priority || 'MEDIUM'; // Default if undefined
          priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
        });
      }
    });
  });
  const sortedPriorityCounts = Object.entries(priorityCounts).sort((a, b) => {
    const order = { HIGH: 0, MEDIUM: 1, LOW: 2 }; // Custom sort order
    return order[a[0]] - order[b[0]];
  });


  // 3. Top Planned Visits (by Expected Revenue)
  const allVisits = [];
  weeklyBreakdown.forEach(week => {
    week.days.forEach(day => {
      if (day.visits && Array.isArray(day.visits)) {
        day.visits.forEach(visit => {
          allVisits.push({
            customer_name: visit.customer_name,
            customer_phone: visit.customer_phone,
            expected_order_value: visit.expected_order_value || 0,
            customer_type: visit.customer_type || 'Unknown',
            area_name: visit.area_name || 'N/A',
            priority: visit.priority || 'MEDIUM',
          });
        });
      }
    });
  });
  const topVisits = allVisits.sort((a, b) => b.expected_order_value - a.expected_order_value).slice(0, 5);


  const formatCurrency = (value) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)}L`;
    }
    return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const cardClasses = "bg-white p-4 rounded-lg shadow border border-gray-200";
  const headingClasses = "text-xl font-semibold mb-4 text-gray-700 flex items-center";
  const subHeadingClasses = "text-md font-semibold mb-3 text-gray-700";

  const getCustomerTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'doctor': return <UserCheck className="h-5 w-5 mr-2 text-blue-600" />;
      case 'retailer': return <Building2 className="h-5 w-5 mr-2 text-green-600" />;
      case 'stockist': return <Users className="h-5 w-5 mr-2 text-purple-600" />;
      case 'distributor': return <Building2 className="h-5 w-5 mr-2 text-orange-600" />; // Re-using icon
      case 'prospect': return <UserPlus className="h-5 w-5 mr-2 text-teal-600" />;
      default: return <UserCheck className="h-5 w-5 mr-2 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-700';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700';
      case 'LOW': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };


  return (
    <div className="space-y-8 p-1 bg-gray-50 rounded-lg">

      {/* AI Insights Recap Section */}
      <section>
        <h3 className={headingClasses}>
          <Lightbulb className="h-6 w-6 mr-2 text-yellow-500" />
          AI-Powered Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights && insights.length > 0 ? insights.map((insight, index) => (
            <div key={index} className={`${cardClasses} flex flex-col`}>
              <h4 className="text-md font-semibold text-gray-800 mb-1">{insight.title}</h4>
              <p className="text-2xl font-bold text-indigo-600 mb-2">{insight.value}</p>
              <p className="text-sm text-gray-600 mb-1 flex-grow">{insight.description}</p>
              <p className={`text-xs font-medium p-1 rounded-md text-center mt-2 ${
                insight.status === 'good' ? 'bg-green-100 text-green-700' :
                insight.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                insight.status === 'critical' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {insight.recommendation || `Status: ${insight.status}`}
              </p>
            </div>
          )) : <p className="text-sm text-gray-500 col-span-full">No AI insights available for this plan.</p>}
        </div>
      </section>

      {/* Customer Segmentation Recap Section */}
      <section>
        <h3 className={headingClasses}>
          <Users className="h-6 w-6 mr-2 text-blue-600" />
          Customer Segmentation (Visited)
        </h3>
        <div className={cardClasses}>
          {Object.keys(uniqueVisitedCustomersByType).length > 0 ? (
            <ul className="space-y-2">
              {Object.entries(uniqueVisitedCustomersByType)
                .sort(([, countA], [, countB]) => countB - countA)
                .map(([type, count]) => (
                <li key={type} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                  <span className="flex items-center text-sm font-medium text-gray-700">
                    {getCustomerTypeIcon(type)} {type}
                  </span>
                  <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{count} unique</span>
                </li>
              ))}
               <li className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 border-t mt-2 pt-2">
                  <span className="flex items-center text-sm font-medium text-gray-700">
                    {getCustomerTypeIcon('Prospect')} Prospects Targeted
                  </span>
                  <span className="text-sm font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">{summary.totalProspectsTargeted || summary.total_prospects_targeted || 0} unique</span>
                </li>
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No customer segmentation data available for visited customers.</p>
          )}
        </div>
      </section>

      {/* Visit Priority Breakdown Section */}
      <section>
        <h3 className={headingClasses}>
          <Star className="h-6 w-6 mr-2 text-red-600" />
          Visit Priority Breakdown
        </h3>
        <div className={cardClasses}>
          {sortedPriorityCounts.length > 0 ? (
            <ul className="space-y-2">
              {sortedPriorityCounts.map(([priority, count]) => (
                <li key={priority} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                  <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${getPriorityColor(priority)}`}>{priority}</span>
                  <span className="text-sm font-semibold text-indigo-600">{count} visits</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No visit priority data available.</p>
          )}
        </div>
      </section>

      {/* Top Planned Visits Section */}
      <section>
        <h3 className={headingClasses}>
          <TrendingUp className="h-6 w-6 mr-2 text-green-600" />
          Top 5 Planned Visits (by Est. Revenue)
        </h3>
        <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
          {topVisits.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Est. Revenue</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topVisits.map((visit, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">{visit.customer_name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{visit.customer_type}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{visit.area_name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(visit.priority)}`}>
                            {visit.priority}
                        </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-green-700 font-semibold">{formatCurrency(visit.expected_order_value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-gray-500 p-4">No visit data available to rank top customers.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default CustomerInsightsDisplay;
