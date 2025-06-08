// src/visitPlanningModel.js

/**
 * Generates a visit plan for a given Medical Representative for a specific month and year.
 *
 * @param {object} planningParams - The parameters for generating the plan.
 * @param {string} planningParams.mrName - The name of the MR for whom the plan is generated.
 * @param {number} planningParams.month - The target month (1-12).
 * @param {number} planningParams.year - The target year.
 * @param {Array} planningParams.allMrVisitsDataForMr - Array of past visit records for this MR.
 * @param {Array} planningParams.comprehensiveClientData - Array of all client data with NBD/CRR status, AOV, location.
 * @param {Array} planningParams.orderData - Full orderData (line items) for potential deeper analysis.
 * @param {Array} planningParams.productData - Full productData for reference.
 * @returns {Array} An array of planned visit objects.
 */
export const generateVisitPlan = (planningParams) => {
  const {
    mrName,
    month,
    year,
    allMrVisitsDataForMr,
    comprehensiveClientData,
    orderData, // May not be used in initial version
    productData  // May not be used in initial version
  } = planningParams;

  console.log('[VisitPlanningModel] Generating visit plan with params:', {
    mrName,
    month,
    year,
    allMrVisitsDataForMrCount: allMrVisitsDataForMr?.length,
    comprehensiveClientDataCount: comprehensiveClientData?.length,
    orderDataCount: orderData?.length,
    productDataCount: productData?.length
  });

  const clientVisitPatterns = {}; // To store { clientId: { lastVisitDate: 'YYYY-MM-DD', visitCount: N } }

  if (allMrVisitsDataForMr && allMrVisitsDataForMr.length > 0) {
    allMrVisitsDataForMr.forEach(visit => {
      const clientId = visit.clientId; // Assuming clientId is available and consistent
      if (!clientId) return; // Skip visits without a clientId

      if (!clientVisitPatterns[clientId]) {
        clientVisitPatterns[clientId] = {
          lastVisitDate: visit.date, // 'date' is 'dcrDate' from mr_visits
          visitCount: 0,
          // Store other details if needed, e.g., all visit dates
          // allVisitDates: []
        };
      }

      clientVisitPatterns[clientId].visitCount += 1;
      // clientVisitPatterns[clientId].allVisitDates.push(visit.date);

      // Update lastVisitDate if current visit is more recent
      // Assumes dates are 'YYYY-MM-DD' and can be compared lexicographically,
      // or convert to Date objects for comparison.
      if (new Date(visit.date) > new Date(clientVisitPatterns[clientId].lastVisitDate)) {
        clientVisitPatterns[clientId].lastVisitDate = visit.date;
      }
    });
  }

  console.log('[VisitPlanningModel] Calculated clientVisitPatterns:', JSON.parse(JSON.stringify(clientVisitPatterns)));

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today for date comparisons

  const prioritizedClients = comprehensiveClientData.map(client => {
    let score = 0;
    const patterns = clientVisitPatterns[client.clientCode]; // client.clientCode is customer_code

    // Factor 1: Client Status (NBD vs CRR)
    if (client.clientStatus === 'NBD') {
      score += 1000; // High priority for New Business Development
    } else { // CRR
      score += 100; // Base score for existing customers
      // Factor 2: AOV for CRR
      score += (client.clientAOV || 0) / 100; // Add 1 point per 100 AOV (adjust multiplier as needed)
    }

    // Factor 3: Days Since Last Visit (by this MR)
    let daysSinceLastVisit = 90; // Default for never visited or if pattern undefined
    if (patterns && patterns.lastVisitDate) {
      const lastVisitDate = new Date(patterns.lastVisitDate);
      lastVisitDate.setHours(0,0,0,0); // Normalize
      const diffTime = Math.abs(today.getTime() - lastVisitDate.getTime());
      daysSinceLastVisit = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    score += daysSinceLastVisit / 7; // Add points for every week since last visit (approx)

    // Factor 4: Location (simple version - just to have it, can be refined)
    // This is a placeholder; real route optimization is complex.
    // For now, just add a small bonus if in a certain territory, e.g. MR's own territory
    // This requires MR's territory info, which we don't have in planningParams yet.
    // So, skip complex location scoring for now, or use client.territory if available.
    // Let's assume client.territory exists from comprehensiveClientData.
    // if (client.territory === planningParams.mrTerritory) { // Need mrTerritory in planningParams
    //    score += 50;
    // }

    return {
      ...client, // Spread all client details
      score: score,
      daysSinceLastVisit: (patterns && patterns.lastVisitDate) ? daysSinceLastVisit : null, // Store for reference
      mrVisitCount: (patterns && patterns.visitCount) ? patterns.visitCount : 0, // Store for reference
    };
  }).sort((a, b) => b.score - a.score); // Sort descending by score

  console.log('[VisitPlanningModel] Prioritized Clients (Top 5):', prioritizedClients.slice(0, 5).map(c => ({name: c.customerName, score: c.score, status: c.clientStatus, aov: c.clientAOV, lastVisit: c.daysSinceLastVisit, city: c.city })));

  const TARGET_VISITS_PER_DAY = 10;
  const MAX_NBD_PER_DAY = 3; // Max NBD visits per day to allow more time

  const workingDays = getWorkingDaysInMonth(year, month); // month is 1-12
  const scheduledVisitsInMonth = new Set(); // To track clientCodes already scheduled this month
  const finalPlannedVisits = []; // This will replace the initial empty plannedVisits

  workingDays.forEach(day => {
    let visitsScheduledForDay = 0;
    let nbdScheduledForDay = 0;
    const dailyVisitsByCity = {}; // Helper to group by city for the day

    for (const client of prioritizedClients) {
      if (visitsScheduledForDay >= TARGET_VISITS_PER_DAY) {
        break; // Reached target for the day
      }

      if (scheduledVisitsInMonth.has(client.clientCode)) {
        continue; // Already scheduled this client this month
      }

      if (client.clientStatus === 'NBD' && nbdScheduledForDay >= MAX_NBD_PER_DAY) {
        continue; // Too many NBDs for this day already
      }

      // Basic location grouping: try to pick from same city if starting a city group for the day
      // This is a very simple approach to location.
      // If we have already started scheduling for a city today, prioritize others from the same city.
      let canScheduleByLocation = true; // eslint-disable-line no-unused-vars
      if (Object.keys(dailyVisitsByCity).length > 0 && !dailyVisitsByCity[client.city]) {
        // If we've already picked a city/cities for today, and this client is in a new city,
        // only schedule if we still need many more visits for the day.
        // This encourages sticking to a few cities per day.
        // For simplicity now, let's not be too restrictive, but this is where route logic would go.
        // For now, we will just record the city.
      }

      // If all checks pass, schedule this client
      finalPlannedVisits.push({
        date: day, // YYYY-MM-DD
        clientCode: client.clientCode,
        customerName: client.customerName,
        clientStatus: client.clientStatus,
        visitType: client.customer_type || 'Client', // customer_type from comprehensiveClientData
        reason: client.clientStatus === 'NBD' ? 'NBD Prospecting' : `CRR Visit (AOV: ${client.clientAOV.toFixed(0)}, Last Visit: ${client.daysSinceLastVisit === null ? 'Never' : client.daysSinceLastVisit + ' days ago'})`,
        plannedLocation: client.city || client.territory || 'Unknown Location',
        mrName: mrName, // Add MR Name to the planned visit object
      });

      scheduledVisitsInMonth.add(client.clientCode);
      visitsScheduledForDay += 1;
      if (!dailyVisitsByCity[client.city]) {
          dailyVisitsByCity[client.city] = 0;
      }
      dailyVisitsByCity[client.city] +=1;

      if (client.clientStatus === 'NBD') {
        nbdScheduledForDay += 1;
      }
    }
    console.log(`[VisitPlanningModel] Day ${day}: Scheduled ${visitsScheduledForDay} visits. Cities: ${JSON.stringify(dailyVisitsByCity)}`);
  });

  // TODO: Implement visit pattern analysis (partially done above)
  // TODO: Implement client prioritization (done above)
  // TODO: Implement daily visit scheduling (basic version done above)

  // Example of what a planned visit object might look like:
  // finalPlannedVisits.push({
  //   date: 'YYYY-MM-DD',
  //   clientCode: 'CLIENT_CODE_XYZ',
  //   customerName: 'Client Name ABC',
  //   clientStatus: 'NBD', // or 'CRR'
  //   visitType: comprehensiveClientData.find(c => c.clientCode === 'CLIENT_CODE_XYZ')?.customer_type || 'Unknown',
  //   reason: 'NBD Prospecting',
  //   plannedLocation: comprehensiveClientData.find(c => c.clientCode === 'CLIENT_CODE_XYZ')?.city || 'Unknown City',
  // });

  console.log('[VisitPlanningModel] Generated final visit plan. Total visits:', finalPlannedVisits.length);
  return finalPlannedVisits;
};

// Helper function to get all working days in a month (excluding Sundays)
// This can be moved to a utility file later if needed
const getWorkingDaysInMonth = (year, month_one_indexed) => {
  const daysInMonth = new Date(year, month_one_indexed, 0).getDate();
  const workingDays = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, month_one_indexed - 1, day);
    if (currentDate.getDay() !== 0) { // 0 is Sunday
      // Format as YYYY-MM-DD
      const yyyy = currentDate.getFullYear();
      const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
      const dd = String(currentDate.getDate()).padStart(2, '0');
      workingDays.push(`${yyyy}-${mm}-${dd}`);
    }
  }
  return workingDays;
};

// Example usage of helper (can be removed or kept for testing within the file)
// console.log(getWorkingDaysInMonth(2024, 7)); // July 2024
