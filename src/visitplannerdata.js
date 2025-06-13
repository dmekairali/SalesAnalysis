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
  async generateVisitPlan(mrName, month, year, minVisitsPerDay = 15) {
    try {
      console.log(`Generating visit plan for ${mrName} - ${month}/${year}`);
      
      // 1. Get customer data (from your existing data)
      const customers = await this.fetchCustomerDataForMR(mrName);
      if (!customers || customers.length === 0) {
        throw new Error('No customers found for this MR');
      }

      // 2. Prepare area data
      const areaData = this.prepareAreaData(customers);
      
      // 3. Create clusters (simplified version for React)
      const clusteredAreas = this.createOptimizedClusters(areaData);
      
      // 4. Generate calendar
      const calendar = this.generateWorkingDaysCalendar(month, year);
      
      // 5. Create visit plan with rotation logic
      const visitPlan = this.createVisitPlanWithRotation(
        customers, 
        clusteredAreas, 
        calendar, 
        minVisitsPerDay
      );

      return {
        success: true,
        mrName,
        month,
        year,
        summary: this.calculatePlanSummary(visitPlan),
        dailyPlans: visitPlan,
        insights: this.generatePlanInsights(visitPlan, customers.length)
      };

    } catch (error) {
      console.error('Error generating visit plan:', error);
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
  async fetchCustomerDataForMR(mrName) {
    // This uses your existing data fetching - adjust based on your data structure
    const { sampleOrderData } = await initializeData();
    
    // Extract unique customers for this MR
    const customerMap = new Map();
    
    sampleOrderData
      .filter(order => 
        (order.medicalRepresentative || order.salesRepresentative) === mrName
      )
      .forEach(order => {
        if (!customerMap.has(order.customerId)) {
          customerMap.set(order.customerId, {
            customer_phone: order.customerId,
            customer_name: order.customerName,
            customer_type: order.customerType || 'Unknown',
            area_name: order.city || 'Unknown Area',
            city: order.city || 'Unknown',
            state: order.state || 'Unknown',
            total_priority_score: Math.random() * 100, // You can enhance this based on order history
            predicted_order_value: order.netAmount || 2000,
            last_visit_date: order.date,
            mr_name: mrName
          });
        }
      });

    return Array.from(customerMap.values());
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
  createOptimizedClusters(areaData) {
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
        cluster_name: `Route ${clusterIndex + 1}`,
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
      efficiency_score: workingDays.length > 0 ? (totalVisits / (workingDays.length * 15) * 100).toFixed(1) : 0,
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
    const prospectRatio = summary.total_visits > 0 ? (summary.total_prospects / summary.total_visits * 100) : 0;
    insights.push({
      type: 'prospects',
      title: 'New Business',
      value: `${prospectRatio.toFixed(1)}%`,
      description: `${summary.total_prospects} prospects vs ${summary.total_customers} existing`,
      status: prospectRatio <= 20 ? 'good' : prospectRatio <= 40 ? 'warning' : 'critical'
    });

    return insights;
  }
}

// Initialize the visit planner ML instance
export const reactVisitPlannerML = new ReactVisitPlannerML();
