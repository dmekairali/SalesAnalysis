import React, { useMemo } from 'react';
import { Users, Star, TrendingUp, Lightbulb, BarChart, UserCheck, Building2, UserPlus, Award, MapPin, AlertTriangle, ShoppingBag, CalendarOff, Activity } from 'lucide-react';
import { formatCurrencyIndianStyle } from '../data.js'; // Corrected import path

const CustomerInsightsDisplay = ({ visitPlan }) => {
  if (!visitPlan || !visitPlan.summary || !visitPlan.weeklyBreakdown || !visitPlan.insights || !visitPlan.allMrCustomers) {
    return (
      <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
        <Lightbulb className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p>No customer insights to display or missing customer data.</p>
        <p className="text-sm">Please generate a visit plan to see the insights. Ensure 'allMrCustomers' data is available.</p>
      </div>
    );
  }

  const { summary, weeklyBreakdown, insights, allMrCustomers, advancedAnalyticsInsights } = visitPlan;

  // --- Calculations & Data Preparation ---

  // At-Risk Clients Calculation
  const atRiskClients = useMemo(() => {
    if (!allMrCustomers || allMrCustomers.length === 0) return [];

    const highChurnThreshold = 0.6;
    const minVisitsForLowEngagement = 3;
    const lowOrderValueThreshold = 5000; // Total order value
    const minVisitsForNoRecentConversion = 2;
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const riskReasons = {
        HIGH_CHURN: "High Churn Risk Score",
        LOW_ENGAGEMENT: "Low Engagement (Visits vs Value, Old Order)",
        NO_CONVERSION: "Visits without Conversion"
    };

    const clients = allMrCustomers.map(cust => {
        let riskScore = 0;
        let reasons = new Set();

        // Criteria 1: High Churn Score
        const churnRisk = parseFloat(cust.churn_risk_score);
        if (churnRisk >= highChurnThreshold) {
            riskScore += churnRisk * 100; // Weight churn score heavily
            reasons.add(riskReasons.HIGH_CHURN);
        }

        // Criteria 2: Low Engagement with Low Order Value & Old Last Order
        const totalVisits = parseInt(cust.total_visits_last_6m || cust.total_visits || 0); // Prefer more specific if available
        const totalOrderValue = parseFloat(cust.total_order_value_last_6m || cust.total_order_value || 0);
        const lastOrderDate = cust.last_order_date ? new Date(cust.last_order_date) : null;

        if (totalVisits >= minVisitsForLowEngagement &&
            totalOrderValue <= lowOrderValueThreshold &&
            lastOrderDate && lastOrderDate < ninetyDaysAgo) {
            riskScore += 40; // Add points for this risk
            reasons.add(riskReasons.LOW_ENGAGEMENT);
        }

        // Criteria 3: Visits without any conversion (no orders ever)
        const totalOrders = parseInt(cust.total_orders_last_6m || cust.total_orders || 0);
        if (cust.last_visit_date && // Has been visited
            !lastOrderDate && totalOrders === 0 && // No orders ever
            totalVisits >= minVisitsForNoRecentConversion) {
            riskScore += 50; // Add points for this risk
            reasons.add(riskReasons.NO_CONVERSION);
        }

        return { ...cust, calculatedRiskScore: riskScore, riskReasons: Array.from(reasons) };
    })
    .filter(cust => cust.calculatedRiskScore > 0) // Only include those who met at least one criterion
    .sort((a, b) => {
        // Primary sort by calculatedRiskScore descending
        if (b.calculatedRiskScore !== a.calculatedRiskScore) {
            return b.calculatedRiskScore - a.calculatedRiskScore;
        }
        // Secondary sort by churn_risk_score descending
        if (parseFloat(b.churn_risk_score) !== parseFloat(a.churn_risk_score)) {
            return parseFloat(b.churn_risk_score) - parseFloat(a.churn_risk_score);
        }
        // Tertiary sort by last_order_date ascending (nulls/older dates first)
        const dateA = a.last_order_date ? new Date(a.last_order_date) : null;
        const dateB = b.last_order_date ? new Date(b.last_order_date) : null;
        if (!dateA && dateB) return -1; // a (no date) comes before b (has date)
        if (dateA && !dateB) return 1;  // b (no date) comes before a (has date)
        if (dateA && dateB) return dateA - dateB;
        return 0;
    });

    return clients.slice(0, 7); // Top 7 At-Risk Clients
  }, [allMrCustomers]);

  // Memoized Golden Clients Calculation
  const goldenClients = useMemo(() => {
    if (!allMrCustomers || allMrCustomers.length === 0) {
      return [];
    }

    // Filter for Doctors and Retailers first from historical data
    const filteredMrCustomers = allMrCustomers.filter(
      customer => customer.customer_type === 'Doctor' || customer.customer_type === 'Retailer'
    );

    // Aggregate historical data for these filtered customers
    // No need to iterate weeklyBreakdown here; we use allMrCustomers directly
    const customerAggregatedData = filteredMrCustomers.map(customer => ({
      name: customer.customer_name,
      phone: customer.customer_phone || customer.customer_id, // Use customer_id as fallback for key
      type: customer.customer_type,
      // Use historical fields from customer_predictions_cache
      totalExpectedValue: parseFloat(customer.total_order_value_last_6m || customer.total_order_value || 0), // Prioritize 6m if available
      visitCount: parseInt(customer.total_visits_last_6m || customer.total_visits || 0), // Prioritize 6m
      churnRiskScore: parseFloat(customer.churn_risk_score) || 0,
      // Areas might not be directly relevant here unless it's a primary service area from cache
      // For simplicity, we'll omit 'areas' from this historical golden client view for now.
    }));

    if (customerAggregatedData.length === 0) return [];

    // Define "Golden" Criteria based on historical data
    const minHistoricalVisitCount = 3; // Example: At least 3 historical visits
    const lowChurnRiskThreshold = 0.2; // Example: Churn risk score <= 20%

    // Calculate average total historical value among Doctors/Retailers or use a fixed threshold
    const totalValueFromFiltered = customerAggregatedData.reduce((sum, cust) => sum + cust.totalExpectedValue, 0);
    const avgTotalExpectedValue = customerAggregatedData.length > 0 ? totalValueFromFiltered / customerAggregatedData.length : 0;
    const minHistoricalTotalValue = Math.max(avgTotalExpectedValue * 0.75, 15000); // Example: 75% of avg or 15k

    let potentialGoldenClients = customerAggregatedData.filter(cust =>
      cust.visitCount >= minHistoricalVisitCount &&
      cust.totalExpectedValue >= minHistoricalTotalValue &&
      cust.churnRiskScore <= lowChurnRiskThreshold
    );

    potentialGoldenClients.sort((a, b) => b.totalExpectedValue - a.totalExpectedValue); // Sort by highest historical value

    return potentialGoldenClients.slice(0, 5); // Top 5 Golden Clients based on historical data
  }, [allMrCustomers]);


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

  // Removed local formatCurrency function

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

      {/* Top Planned Single Visits Section */}
      <section>
        <h3 className={headingClasses}>
          <TrendingUp className="h-6 w-6 mr-2 text-green-600" />
          Top 5 Single Visits (by Est. Revenue)
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
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-green-700 font-semibold">{formatCurrencyIndianStyle(visit.expected_order_value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-gray-500 p-4">No visit data available to rank top single visits.</p>
          )}
        </div>
      </section>

      {/* Golden Clients Section */}
      <section>
        <h3 className={headingClasses}>
          <Award className="h-6 w-6 mr-2 text-amber-500" />
          Golden Clients (High Value & Frequency)
        </h3>
        <div className={cardClasses}>
          {goldenClients.length > 0 ? (
            <ul className="space-y-4">
              {goldenClients.map(client => (
                <li key={client.phone} className="p-3 rounded-md border border-gray-200 hover:shadow-lg transition-shadow bg-amber-50">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-md font-semibold text-amber-700">{client.name}</h4>
                    <span className="text-xs font-medium bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">{client.type}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <p><span className="font-medium text-gray-600">Historical Visits:</span> <span className="font-bold text-indigo-600">{client.visitCount}</span></p>
                    <p><span className="font-medium text-gray-600">Historical Value:</span> <span className="font-bold text-green-600">{formatCurrencyIndianStyle(client.totalExpectedValue)}</span></p>
                    <p><span className="font-medium text-gray-600">Avg. Value/Visit:</span> <span className="font-bold text-green-600">{client.visitCount > 0 ? formatCurrencyIndianStyle(client.totalExpectedValue / client.visitCount) : 'N/A'}</span></p>
                    <p><span className="font-medium text-gray-600">Churn Risk:</span> <span className="font-bold text-red-600">{(client.churnRiskScore * 100).toFixed(0)}%</span></p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              No clients currently meet the 'Golden Client' criteria based on this plan (min. 3 visits and high total value).
            </p>
          )}
        </div>
      </section>

      {/* At-Risk Clients Section */}
      <section>
        <h3 className={headingClasses}>
          <AlertTriangle className="h-6 w-6 mr-2 text-red-500" />
          At-Risk Clients (Requiring Attention)
        </h3>
        <div className={cardClasses}>
          {atRiskClients.length > 0 ? (
            <ul className="space-y-4">
              {atRiskClients.map(client => (
                <li key={client.customer_phone || client.customer_id} className="p-3 rounded-md border border-gray-200 hover:shadow-lg transition-shadow bg-red-50">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                        <h4 className="text-md font-semibold text-red-700">{client.customer_name}</h4>
                        <span className="text-xs text-gray-600">{client.customer_type}</span>
                    </div>
                    {client.churn_risk_score && (
                         <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${parseFloat(client.churn_risk_score) >= highChurnThreshold ? 'bg-red-200 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            Churn Risk: {(parseFloat(client.churn_risk_score) * 100).toFixed(0)}%
                         </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-sm mb-2">
                    <p><Activity className="inline h-4 w-4 mr-1 text-gray-500" />Visits (6m): <span className="font-bold">{client.total_visits_last_6m || client.total_visits || 'N/A'}</span></p>
                    <p><ShoppingBag className="inline h-4 w-4 mr-1 text-gray-500" />Value (6m): <span className="font-bold">{formatCurrencyIndianStyle(parseFloat(client.total_order_value_last_6m || client.total_order_value || 0))}</span></p>
                    <p><CalendarOff className="inline h-4 w-4 mr-1 text-gray-500" />Last Order: <span className="font-bold">{client.last_order_date ? new Date(client.last_order_date).toLocaleDateString() : 'N/A'}</span></p>
                  </div>
                  {client.riskReasons && client.riskReasons.length > 0 && (
                    <div className="mt-1 pt-1 border-t border-red-100">
                      <p className="text-xs font-semibold text-red-600">Key Risk Factors:</p>
                      <ul className="list-disc list-inside ml-1">
                        {client.riskReasons.map((reason, idx) => (
                          <li key={idx} className="text-xs text-red-500">{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              No clients currently identified as 'At-Risk' based on the defined criteria and available data.
            </p>
          )}
        </div>
      </section>

      {/* Advanced AI Analytics Section */}
      <section>
        <h3 className={headingClasses}>
          <BarChart className="h-6 w-6 mr-2 text-fuchsia-600" /> {/* Changed icon for variety */}
          Advanced AI Analytics
        </h3>
        <div className="space-y-3">
          {advancedAnalyticsInsights && advancedAnalyticsInsights.length > 0 ? (
            advancedAnalyticsInsights.map((insight, index) => (
              <div key={insight.id || `adv-insight-${index}`} className={`${cardClasses} border-l-4 ${
                insight.type === 'warning' ? 'border-red-500 bg-red-50' :
                insight.type === 'info' ? 'border-blue-500 bg-blue-50' :
                'border-gray-300' // Default border
              }`}>
                <h4 className={`text-md font-semibold mb-1 ${
                  insight.type === 'warning' ? 'text-red-700' :
                  insight.type === 'info' ? 'text-blue-700' :
                  'text-gray-800'
                }`}>{insight.title}</h4>
                <p className="text-sm text-gray-600">{insight.description}</p>
              </div>
            ))
          ) : (
            <div className={`${cardClasses} text-center`}>
              <p className="text-sm text-gray-500">No advanced AI analytics available for this plan.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default CustomerInsightsDisplay;
