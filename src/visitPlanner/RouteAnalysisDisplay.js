import React from 'react';
import { CalendarDays, MapPin, BarChartHorizontalBig, Brain, DollarSign, Users } from 'lucide-react';

const RouteAnalysisDisplay = ({ visitPlan }) => {
  if (!visitPlan || !visitPlan.weeklyBreakdown || !visitPlan.detailedClusterStats || !visitPlan.summary) {
    return (
      <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
        <BarChartHorizontalBig className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p>No route analysis data to display.</p>
        <p className="text-sm">Please generate a visit plan to see the analysis.</p>
      </div>
    );
  }

  const { weeklyBreakdown, detailedClusterStats, summary } = visitPlan;

  // --- Calculations ---

  // Area Visit Frequency
  const areaCounts = {};
  weeklyBreakdown.forEach(week => {
    week.days.forEach(day => {
      if (day.visits && Array.isArray(day.visits)) {
        day.visits.forEach(visit => {
          const areaName = visit.area_name || 'Unknown Area';
          areaCounts[areaName] = (areaCounts[areaName] || 0) + 1;
        });
      }
    });
  });
  const sortedAreaCounts = Object.entries(areaCounts).sort(([, countA], [, countB]) => countB - countA);

  // Cluster Effectiveness additions
  const totalPlannedVisits = summary.totalPlannedVisits || summary.total_planned_visits || 0;
  const estimatedRevenue = summary.estimatedRevenue || summary.estimated_revenue || 0;

  const avgVisitsPerCluster = detailedClusterStats.totalGeminiClusters > 0
    ? totalPlannedVisits / detailedClusterStats.totalGeminiClusters
    : 0;
  const avgRevenuePerCluster = detailedClusterStats.totalGeminiClusters > 0
    ? estimatedRevenue / detailedClusterStats.totalGeminiClusters
    : 0;

  const formatCurrency = (value) => {
     if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)}L`;
    }
    return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const cardClasses = "bg-white p-4 rounded-lg shadow border border-gray-200";
  const headingClasses = "text-xl font-semibold mb-4 text-gray-700 flex items-center";
  const subHeadingClasses = "text-md font-semibold mb-3 text-gray-700";
  const valueTextClasses = "text-lg font-bold text-indigo-600";
  const labelTextClasses = "text-sm text-gray-600";

  return (
    <div className="space-y-8 p-1 bg-gray-50 rounded-lg">
      {/* Daily Workload Distribution Section */}
      <section>
        <h3 className={headingClasses}>
          <CalendarDays className="h-6 w-6 mr-2 text-blue-600" />
          Daily Workload Distribution
        </h3>
        <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planned Visits</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Est. Revenue</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {weeklyBreakdown.flatMap(week => week.days).map((day, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{day.date}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{day.dayName}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{day.summary?.totalVisits || 0}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-green-700 font-medium">{formatCurrency(day.summary?.estimatedRevenue || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Area Visit Frequency Section */}
      <section>
        <h3 className={headingClasses}>
          <MapPin className="h-6 w-6 mr-2 text-orange-600" />
          Area Visit Frequency
        </h3>
        <div className={`${cardClasses} max-h-96 overflow-y-auto`}>
          {sortedAreaCounts.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {sortedAreaCounts.map(([areaName, count]) => (
                <li key={areaName} className="flex justify-between items-center py-2.5 px-1">
                  <span className="text-sm font-medium text-gray-700">{areaName}</span>
                  <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{count} visits</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No area visit data available.</p>
          )}
        </div>
      </section>

      {/* Cluster Effectiveness Section */}
      <section>
        <h3 className={headingClasses}>
          <Brain className="h-6 w-6 mr-2 text-purple-600" />
          Cluster Effectiveness (Gemini AI)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className={cardClasses}>
            <p className={labelTextClasses}>Total Defined Clusters</p>
            <p className={valueTextClasses}>{detailedClusterStats.totalGeminiClusters}</p>
          </div>
          <div className={cardClasses}>
            <p className={labelTextClasses}>Total Areas in Clusters</p>
            <p className={valueTextClasses}>{detailedClusterStats.totalGeminiAreas}</p>
          </div>
          <div className={cardClasses}>
            <p className={labelTextClasses}>Avg. Areas per Cluster</p>
            <p className={valueTextClasses}>{parseFloat(detailedClusterStats.avgAreasPerGeminiCluster).toFixed(2)}</p>
          </div>
          <div className={cardClasses}>
             <Users className="inline h-5 w-5 mr-1 text-gray-500" />
            <p className={labelTextClasses}>Avg. Visits per Cluster</p>
            <p className={valueTextClasses}>{avgVisitsPerCluster.toFixed(2)}</p>
          </div>
          <div className={cardClasses}>
            <DollarSign className="inline h-5 w-5 mr-1 text-gray-500" />
            <p className={labelTextClasses}>Avg. Revenue per Cluster</p>
            <p className={`${valueTextClasses} text-green-600`}>{formatCurrency(avgRevenuePerCluster)}</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default RouteAnalysisDisplay;
