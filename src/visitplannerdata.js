import { createClient } from '@supabase/supabase-js'
import { getCache, setCache } from './utils/cache.js';

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey)


/**
 * Visit Planning ML Integration Class for React Dashboard
 */
export class ReactVisitPlannerML {
  constructor() {
    this.customerTracker = new Map();
    this.areaCustomers = {};
  }

  /**
   * Generate visit plan for MR with cluster-based rotation
   */
  async generateVisitPlan(mrName, month, year, minVisitsPerDay = 10) {
    const cacheKey = `visitPlan_${mrName}_${month}_${year}`;
    const cachedPlan = getCache(cacheKey);

    if (cachedPlan) {
      console.log(`[Cache] Returning cached visit plan for key: ${cacheKey}`);
      return cachedPlan; // Return a deep copy if plan objects can be mutated
    }

    console.log(`[Cache] No valid cached visit plan found for key: ${cacheKey}. Generating new plan.`);

    try {
      console.log(`Generating visit plan for ${mrName} - ${month}/${year}`);
      
      // 1. Get customer data (from your existing data)
      const customers = await this.fetchCustomerDataForMR(mrName);
      if (!customers || customers.length === 0) {
        throw new Error('No customers found for this MR');
      }

      // 2. Prepare area data
      const areaData = await this.prepareAreaData(customers);
      // console.log(areaData); // Keep console.log commented or remove for production
      // 3. Create clusters (simplified version for React)
      const clusteredAreas = await this.createOptimizedClusters(areaData);
      // console.log(clusteredAreas); // Keep console.log commented or remove for production
      // 4. Generate calendar
      const calendar = await this.generateWorkingDaysCalendar(month, year);
      // console.log(calendar); // Keep console.log commented or remove for production
      // 5. Create visit plan with rotation logic
      const visitPlan = await this.createVisitPlanWithRotation(
        customers, 
        clusteredAreas, 
        calendar, 
        minVisitsPerDay
      );

      const result = {
        success: true,
        mrName,
        month,
        year,
        summary: this.calculatePlanSummary(visitPlan),
        dailyPlans: visitPlan,
        insights: this.generatePlanInsights(visitPlan, customers.length)
      };

      setCache(cacheKey, result); // Cache the successful result
      return result;

    } catch (error) {
      console.error('Error generating visit plan:', error);
      // Do not cache errors, or cache them differently if needed
      return {
        success: false,
        error: error.message,
        mrName,
        month,
        year
      };
    }
  }

  /**
   * Fetch customer data for specific MR (uses your existing data structure)
   */
  /**
 * Fetch customer data for specific MR from Supabase
 */
async fetchCustomerDataForMR(mrName) {
  try {
    console.log(`Fetching customer data for MR: ${mrName}`);
    
    // Query Supabase using the client
    const { data, error } = await supabase
      .from('customer_predictions_cache')
      .select('*')
      .eq('mr_name', mrName)
      .limit(1000);
    
    if (error) {
      throw new Error(`Supabase query error: ${error.message}`);
    }
    
    if (!data || !Array.isArray(data)) {
      throw new Error('Supabase returned invalid data format');
    }
    
    console.log(`Found ${data.length} customers for MR: ${mrName}`);
    
    // Transform Supabase data to match the expected customer format
    return data.map(record => ({
      customer_phone: record.customer_phone || record.customer_id || `PHONE_${Date.now()}_${Math.random()}`,
      customer_name: record.customer_name || 'Unknown Customer',
      customer_type: record.customer_type || 'Unknown',
      area_name: record.area_name || record.city || 'Unknown Area',
      city: record.city || 'Unknown City',
      state: record.state || 'Unknown State',
      total_priority_score: parseFloat(record.total_priority_score) || Math.random() * 100,
      predicted_order_value: parseFloat(record.predicted_order_value) || 2000,
      last_visit_date: record.last_visit_date || new Date().toISOString().slice(0, 10),
      mr_name: record.mr_name || mrName,
      // Additional fields from Supabase that might be useful
      customer_id: record.customer_id,
      phone: record.phone || record.customer_phone,
      email: record.email,
      address: record.address,
      pincode: record.pincode,
      territory: record.territory,
      route: record.route,
      visit_frequency: record.visit_frequency,
      last_order_date: record.last_order_date,
      last_order_value: parseFloat(record.last_order_value) || 0,
      avg_monthly_orders: parseFloat(record.avg_monthly_orders) || 0,
      total_orders_last_6m: parseInt(record.total_orders_last_6m) || 0,
      growth_trend: record.growth_trend,
      customer_segment: record.customer_segment,
      preferred_products: record.preferred_products,
      payment_terms: record.payment_terms,
      credit_limit: parseFloat(record.credit_limit) || 0,
      outstanding_amount: parseFloat(record.outstanding_amount) || 0,
      created_at: record.created_at,
      updated_at: record.updated_at
    }));
    
  } catch (error) {
    console.error('Error fetching customer data from Supabase:', error);
    throw new Error(`Failed to fetch customer data for MR ${mrName}: ${error.message}`);
  }
}
  /**
   * Prepare area data for clustering
   */
  prepareAreaData(customers) {
    const areaMap = {};
    
    customers.forEach(customer => {
      const area = customer.area_name || 'Unknown Area';
      if (!areaMap[area]) {
        areaMap[area] = {
          area_name: area,
          customer_count: 0,
          total_priority: 0,
          avg_order_value: 0,
          city: customer.city || 'Unknown'
        };
      }
      
      areaMap[area].customer_count++;
      areaMap[area].total_priority += parseFloat(customer.total_priority_score) || 0;
      areaMap[area].avg_order_value += parseFloat(customer.predicted_order_value) || 0;
    });

    // Calculate averages
    Object.values(areaMap).forEach(area => {
      area.avg_priority = area.customer_count > 0 ? area.total_priority / area.customer_count : 0;
      area.avg_order_value = area.customer_count > 0 ? area.avg_order_value / area.customer_count : 0;
    });

    return Object.values(areaMap);
  }

  /**
   * Create optimized clusters (simplified for React)
   */
  /**
 * Create optimized clusters using Gemini AI
 */
async createOptimizedClusters(areaData) {
  try {
    return await this.getGeminiClusters(areaData);
  } catch (error) {
    console.warn('Gemini clustering failed, using fallback:', error.message);
    return this.createComprehensiveFallbackClusters(areaData);
  }
}

/**
 * Get optimized clusters from Gemini AI
 */
async getGeminiClusters(areaData) {
  const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
  
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const totalCustomers = areaData.reduce((sum, area) => sum + area.customer_count, 0);
  const targetClusters = Math.max(8, Math.ceil(areaData.length / 4)); // At least 8 clusters
  
  const prompt = {
    contents: [{
      parts: [{
        text: `Create ${targetClusters} route-optimized clusters that cover ALL ${areaData.length} areas.

CRITICAL: Every area must be assigned to a cluster. No area should be left unassigned.

REQUIREMENTS:
1. Create ${targetClusters} clusters minimum
2. Each cluster should have 3-6 areas
3. Group geographically close areas
4. Distribute across different weekdays
5. Include ALL areas provided - no exceptions

PRIORITY AREAS (must be in clusters):
${areaData.slice(0, 10).map(area => `- ${area.area_name}: ${area.customer_count} customers`).join('\n')}

Return ONLY valid JSON with ALL areas covered:
{
  "clusters": [
    {
      "cluster_name": "North Route 1",
      "cluster_priority": "High",
      "recommended_visit_day": "Monday",
      "areas": [
        {
          "area_name": "Rohtak",
          "visit_sequence": 1,
          "notes": "PRIMARY - High volume area"
        }
      ]
    }
  ]
}

ALL AREAS TO CLUSTER (${areaData.length} total):
${JSON.stringify(areaData, null, 2)}`
      }]
    }]
  };

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(prompt)
  };

  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.error) {
      throw new Error(`Gemini API error: ${result.error.message}`);
    }
    
    const responseTextContent = result.candidates[0].content.parts[0].text;
    const cleanText = responseTextContent.replace(/```json|```/g, '');
    const clusters = JSON.parse(cleanText);
    
    if (!clusters.clusters || !Array.isArray(clusters.clusters)) {
      throw new Error("Invalid cluster format from Gemini");
    }
    
    // Validate all areas are covered
    const assignedAreas = new Set();
    clusters.clusters.forEach(cluster => {
      cluster.areas.forEach(area => {
        assignedAreas.add(area.area_name);
      });
    });
    
    const unassignedCount = areaData.length - assignedAreas.size;
    if (unassignedCount > 0) {
      console.warn(`WARNING: Gemini left ${unassignedCount} areas unassigned. Creating fallback clusters.`);
      return this.createComprehensiveFallbackClusters(areaData);
    }
    console.log(clusters)
    return clusters;
    
  } catch (e) {
    console.error(`Gemini clustering failed: ${e.message}`);
    throw e;
  }
}

/**
 * Create comprehensive fallback clusters when Gemini fails
 */
createComprehensiveFallbackClusters(areaData) {
  const clusters = [];
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Sort areas by priority and customer count
  const sortedAreas = areaData
    .sort((a, b) => (b.avg_priority * b.customer_count) - (a.avg_priority * a.customer_count));

  // Group areas into clusters (3-5 areas per cluster)
  const areasPerCluster = 4;
  for (let i = 0; i < sortedAreas.length; i += areasPerCluster) {
    const clusterAreas = sortedAreas.slice(i, i + areasPerCluster);
    const clusterIndex = Math.floor(i / areasPerCluster);
    
    clusters.push({
      cluster_name: `Fallback Route ${clusterIndex + 1}`,
      cluster_priority: clusterIndex < 3 ? 'High' : 'Medium',
      recommended_visit_day: weekdays[clusterIndex % weekdays.length],
      areas: clusterAreas.map((area, index) => ({
        area_name: area.area_name,
        visit_sequence: index + 1,
        notes: `${area.customer_count} customers, avg priority: ${area.avg_priority.toFixed(1)}`
      }))
    });
  }

  return { clusters };
}

  /**
   * Generate working days calendar
   */
  generateWorkingDaysCalendar(month, year) {
    const calendar = [];
    const daysInMonth = new Date(year, month, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();
      
      // Skip Sundays (0)
      if (dayOfWeek === 0) continue;
      
      calendar.push({
        date: date.toISOString().slice(0, 10),
        dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
        clusters: [],
        totalVisits: 0,
        isSunday: false
      });
    }
    
    return calendar;
  }

  /**
   * Create visit plan with cluster-based rotation logic
   */
  createVisitPlanWithRotation(customers, clusteredAreas, calendar, minVisits) {
    // Initialize customer tracking
    this.initializeCustomerTracking(customers);
    
    const workingDays = calendar.filter(d => !d.isSunday);
    const usedDays = new Set();
    
    // STEP 1: Assign clusters to unique days
    clusteredAreas.clusters.forEach((cluster, clusterIndex) => {
      const targetDay = workingDays.find(day => 
        day.dayName.toLowerCase() === cluster.recommended_visit_day.toLowerCase() &&
        !usedDays.has(day.date)
      ) || workingDays.find(day => !usedDays.has(day.date));
      
      if (targetDay) {
        usedDays.add(targetDay.date);
        this.planClusterDay(targetDay, cluster, minVisits);
      }
    });

    // STEP 2: Fill remaining days with unused customers
    const remainingDays = workingDays.filter(day => !usedDays.has(day.date));
    this.fillRemainingDays(remainingDays, minVisits);

    // STEP 3: Apply cluster-based rotation for days needing more visits
    this.applyClusterRotation(workingDays, minVisits);

    return calendar;
  }

  /**
   * Initialize customer tracking
   */
  initializeCustomerTracking(customers) {
    this.customerTracker.clear();
    this.areaCustomers = {};
    
    customers.forEach(customer => {
      const area = customer.area_name || 'Unknown Area';
      
      // Group by area
      if (!this.areaCustomers[area]) this.areaCustomers[area] = [];
      this.areaCustomers[area].push(customer);
      
      // Track individual customers
      this.customerTracker.set(customer.customer_phone, {
        customer,
        used: false,
        assigned_day: null,
        visit_count: 0,
        can_rotate: false
      });
    });

    // Sort customers within each area by priority
    Object.keys(this.areaCustomers).forEach(area => {
      this.areaCustomers[area].sort((a, b) => 
        (parseFloat(b.total_priority_score) || 0) - (parseFloat(a.total_priority_score) || 0)
      );
    });
  }

  /**
   * Plan a single cluster day
   */
  planClusterDay(day, cluster, minVisits) {
    let visitorsAdded = 0;
    
    cluster.areas.forEach((area, areaIndex) => {
      const areaCustomers = this.areaCustomers[area.area_name] || [];
      const availableCustomers = areaCustomers.filter(c => {
        const tracker = this.customerTracker.get(c.customer_phone);
        return tracker && !tracker.used;
      });

      if (availableCustomers.length === 0 || visitorsAdded >= minVisits) return;

      const isMainArea = areaIndex === 0;
      const remainingNeeded = minVisits - visitorsAdded;
      
      const customersToTake = isMainArea ? 
        Math.min(availableCustomers.length, Math.max(Math.floor(minVisits * 0.6), remainingNeeded)) :
        Math.min(availableCustomers.length, remainingNeeded);

      if (customersToTake > 0) {
        const selectedCustomers = availableCustomers.slice(0, customersToTake);
        
        day.clusters.push({
          cluster_name: cluster.cluster_name,
          area_name: area.area_name,
          visit_sequence: area.visit_sequence,
          customers: selectedCustomers,
          notes: `Route ${areaIndex + 1} - ${selectedCustomers.length} customers`,
          area_priority: isMainArea ? 'PRIMARY' : 'SECONDARY'
        });

        // Mark customers as used
        selectedCustomers.forEach(customer => {
          const tracker = this.customerTracker.get(customer.customer_phone);
          if (tracker) {
            tracker.used = true;
            tracker.assigned_day = day.date;
            tracker.visit_count = 1;
            tracker.can_rotate = true;
          }
        });

        day.totalVisits += customersToTake;
        visitorsAdded += customersToTake;
      }
    });

    // Generate prospects if needed
    if (visitorsAdded < minVisits) {
      const shortfall = minVisits - visitorsAdded;
      const lastArea = cluster.areas[cluster.areas.length - 1]?.area_name || 'New Territory';
      
      const prospects = this.generateProspects(lastArea, shortfall);
      if (prospects.length > 0) {
        day.clusters.push({
          cluster_name: cluster.cluster_name,
          area_name: lastArea,
          visit_sequence: 999,
          customers: prospects,
          notes: `${prospects.length} new prospects`,
          area_priority: 'PROSPECT'
        });
        day.totalVisits += prospects.length;
      }
    }
  }

  /**
   * Fill remaining days with unused customers
   */
  fillRemainingDays(remainingDays, minVisits) {
    const unusedCustomers = Array.from(this.customerTracker.values())
      .filter(tracker => !tracker.used)
      .map(tracker => tracker.customer)
      .sort((a, b) => (parseFloat(b.total_priority_score) || 0) - (parseFloat(a.total_priority_score) || 0));

    remainingDays.forEach((day, dayIndex) => {
      const startIndex = dayIndex * minVisits;
      const endIndex = Math.min(startIndex + minVisits, unusedCustomers.length);
      const customersForDay = unusedCustomers.slice(startIndex, endIndex);

      if (customersForDay.length > 0) {
        // Group by area
        const customersByArea = {};
        customersForDay.forEach(customer => {
          const area = customer.area_name || 'Mixed Areas';
          if (!customersByArea[area]) customersByArea[area] = [];
          customersByArea[area].push(customer);
        });

        Object.entries(customersByArea).forEach(([area, customers]) => {
          day.clusters.push({
            cluster_name: `Remaining - ${area}`,
            area_name: area,
            visit_sequence: day.clusters.length + 1,
            customers: customers,
            notes: `${customers.length} remaining customers`,
            area_priority: 'REMAINING'
          });

          // Mark as used
          customers.forEach(customer => {
            const tracker = this.customerTracker.get(customer.customer_phone);
            if (tracker) {
              tracker.used = true;
              tracker.assigned_day = day.date;
              tracker.visit_count = 1;
              tracker.can_rotate = true;
            }
          });

          day.totalVisits += customers.length;
        });
      }

      // Fill with prospects if still short
      if (day.totalVisits < minVisits) {
        const shortfall = minVisits - day.totalVisits;
        const prospects = this.generateProspects('New Territory', shortfall);
        
        if (prospects.length > 0) {
          day.clusters.push({
            cluster_name: 'New Business Development',
            area_name: 'New Territory',
            visit_sequence: day.clusters.length + 1,
            customers: prospects,
            notes: `${prospects.length} new prospects`,
            area_priority: 'PROSPECT'
          });
          day.totalVisits += prospects.length;
        }
      }
    });
  }

  /**
   * Apply cluster-based rotation for better route efficiency
   */
  applyClusterRotation(workingDays, minVisits) {
    const daysNeedingMore = workingDays.filter(day => day.totalVisits < minVisits);

    daysNeedingMore.forEach(day => {
      const shortfall = minVisits - day.totalVisits;
      const currentDate = new Date(day.date);
      
      // Group rotation candidates by area (route-efficient)
      const areaRotationCandidates = new Map();
      
      Array.from(this.customerTracker.values()).forEach(tracker => {
        if (tracker.can_rotate && tracker.assigned_day) {
          const lastVisitDate = new Date(tracker.assigned_day);
          const daysDiff = Math.floor((currentDate - lastVisitDate) / (1000 * 60 * 60 * 24));
          
          if (daysDiff >= 7 && parseFloat(tracker.customer.total_priority_score || 0) >= 40) {
            const area = tracker.customer.area_name || 'Unknown Area';
            
            if (!areaRotationCandidates.has(area)) {
              areaRotationCandidates.set(area, {
                area_name: area,
                customers: [],
                avg_days_gap: 0,
                avg_priority: 0
              });
            }
            
            areaRotationCandidates.get(area).customers.push({
              ...tracker.customer,
              days_gap: daysDiff,
              visit_count: tracker.visit_count
            });
          }
        }
      });

      // Prioritize areas with 3+ customers for route efficiency
      const prioritizedAreas = Array.from(areaRotationCandidates.values())
        .filter(area => area.customers.length >= 3)
        .map(area => {
          area.avg_days_gap = area.customers.reduce((sum, c) => sum + c.days_gap, 0) / area.customers.length;
          area.avg_priority = area.customers.reduce((sum, c) => sum + parseFloat(c.total_priority_score || 0), 0) / area.customers.length;
          area.customers.sort((a, b) => parseFloat(b.total_priority_score || 0) - parseFloat(a.total_priority_score || 0));
          return area;
        })
        .sort((a, b) => (b.avg_priority * b.customers.length * b.avg_days_gap) - (a.avg_priority * a.customers.length * a.avg_days_gap));

      // Add rotation clusters by area
      let rotationAdded = 0;
      for (const areaData of prioritizedAreas) {
        if (rotationAdded >= shortfall) break;
        
        const customersNeeded = Math.min(shortfall - rotationAdded, areaData.customers.length, 10);
        const selectedCustomers = areaData.customers.slice(0, customersNeeded);
        
        if (selectedCustomers.length > 0) {
          day.clusters.push({
            cluster_name: `🔄 ${areaData.area_name} Route Revisit`,
            area_name: areaData.area_name,
            visit_sequence: day.clusters.length + 1,
            customers: selectedCustomers,
            notes: `🔄 Route revisit - ${selectedCustomers.length} customers (avg ${areaData.avg_days_gap.toFixed(1)}d gap)`,
            area_priority: 'ROUTE_ROTATION'
          });
          
          day.totalVisits += selectedCustomers.length;
          rotationAdded += selectedCustomers.length;

          // Update trackers
          selectedCustomers.forEach(customer => {
            const tracker = this.customerTracker.get(customer.customer_phone);
            if (tracker) {
              tracker.assigned_day = day.date;
              tracker.visit_count += 1;
            }
          });
        }
      }

      // Fill remaining with prospects if needed
      if (day.totalVisits < minVisits) {
        const finalShortfall = minVisits - day.totalVisits;
        const prospects = this.generateProspects('New Territory', finalShortfall);
        
        if (prospects.length > 0) {
          day.clusters.push({
            cluster_name: 'New Business Development',
            area_name: 'New Territory',
            visit_sequence: day.clusters.length + 1,
            customers: prospects,
            notes: `${prospects.length} prospects - after rotation attempt`,
            area_priority: 'PROSPECT'
          });
          day.totalVisits += prospects.length;
        }
      }
    });
  }

  /**
   * Generate prospects
   */
  generateProspects(area, count) {
    const prospects = [];
    const types = ['Doctor', 'Retailer', 'Stockist', 'Hospital'];
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      prospects.push({
        customer_name: `New ${types[i % types.length]} ${i + 1} - ${area}`,
        customer_phone: `PROSPECT_${area}_${Date.now()}_${i}`,
        customer_type: types[i % types.length],
        area_name: area,
        total_priority_score: 45 + (i % 10),
        predicted_order_value: 1500 + (i * 100),
        prospect_generated: true
      });
    }
    
    return prospects;
  }

  /**
   * Calculate plan summary
   */
  calculatePlanSummary(calendar) {
    const workingDays = calendar.filter(d => !d.isSunday);
    const totalVisits = workingDays.reduce((sum, day) => sum + day.totalVisits, 0);
    const totalCustomers = workingDays.reduce((sum, day) => 
      sum + day.clusters.reduce((cSum, cluster) => 
        cSum + cluster.customers.filter(c => !c.prospect_generated).length, 0), 0);
    const totalProspects = workingDays.reduce((sum, day) => 
      sum + day.clusters.reduce((cSum, cluster) => 
        cSum + cluster.customers.filter(c => c.prospect_generated).length, 0), 0);

    return {
      total_working_days: workingDays.length,
      total_planned_visits: totalVisits,
      total_customers: totalCustomers,
      total_prospects: totalProspects,
      estimated_revenue: totalCustomers * 2500 + totalProspects * 1500,
      efficiency_score: workingDays.length > 0 ? (totalVisits / (workingDays.length * 10) * 100).toFixed(1) : 0, // Changed 15 to 10
      avg_visits_per_day: workingDays.length > 0 ? (totalVisits / workingDays.length).toFixed(1) : 0
    };
  }

  /**
   * Generate plan insights
   */
  generatePlanInsights(calendar, totalCustomersAvailable) {
    const summary = this.calculatePlanSummary(calendar);
    const insights = [];

    // Utilization insight
    const utilizationRate = totalCustomersAvailable > 0 ? (summary.total_customers / totalCustomersAvailable * 100) : 0;
    insights.push({
      type: 'utilization',
      title: 'Customer Utilization',
      value: `${utilizationRate.toFixed(1)}%`,
      description: `${summary.total_customers} of ${totalCustomersAvailable} customers planned`,
      status: utilizationRate >= 80 ? 'good' : utilizationRate >= 60 ? 'warning' : 'critical'
    });

    // Efficiency insight
    insights.push({
      type: 'efficiency',
      title: 'Plan Efficiency',
      value: `${summary.efficiency_score}%`,
      description: `${summary.avg_visits_per_day} avg visits per day`,
      status: parseFloat(summary.efficiency_score) >= 85 ? 'good' : parseFloat(summary.efficiency_score) >= 70 ? 'warning' : 'critical'
    });

    // Prospect ratio insight
    // Ensure the ratio is based on the sum of customers and prospects for consistency with its description.
    const effective_total_for_prospect_ratio = summary.total_customers + summary.total_prospects;
    const prospectRatio = effective_total_for_prospect_ratio > 0
      ? (summary.total_prospects / effective_total_for_prospect_ratio * 100)
      : 0;
    insights.push({
      type: 'prospects',
      title: 'New Business',
      value: `${prospectRatio.toFixed(1)}%`,
      description: `${summary.total_prospects} prospects vs ${summary.total_customers} existing`,
      status: prospectRatio <= 20 ? 'good' : prospectRatio <= 40 ? 'warning' : 'critical' // Status might need re-evaluation if ratio definition changes context
    });

    return insights;
  }
}

// Initialize the visit planner ML instance
export const reactVisitPlannerML = new ReactVisitPlannerML();
