import { createClient } from '@supabase/supabase-js'
import { getCache, setCache } from './utils/cache.js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

export class OptimizedVisitPlanner {
  constructor() {
    this.customerTracker = new Map();
    this.areaCustomers = {};
    this.visitCapacity = 10; // Target visits per day
  }

  // Main planning method ==============================================
  async generateVisitPlan(mrName, month, year) {
    const cacheKey = `visitPlan_${mrName}_${month}_${year}`;
    const cachedPlan = getCache(cacheKey);
    if (cachedPlan) return cachedPlan;

    try {
      // 1. Load and prepare customer data
      const customers = await this.fetchCustomerData(mrName);
      if (!customers.length) throw new Error('No customers found');
      
      // 2. Create geographic clusters
      const clusters = await this.createOptimizedClusters(customers);
      
      // 3. Generate calendar with capacity planning
      const calendar = this.buildCalendar(month, year, customers.length);
      
      // 4. Assign visits using priority-based allocation
      const plannedCalendar = this.assignVisits(calendar, clusters, customers);
      
      // 5. Calculate metrics and cache
      const result = this.prepareFinalResult(mrName, month, year, plannedCalendar, customers);
      setCache(cacheKey, result);
      return result;

    } catch (error) {
      console.error('Planning failed:', error);
      return this.generateFallbackPlan(mrName, month, year, error);
    }
  }

  // Data Loading ======================================================
  async fetchCustomerData(mrName) {
    const { data, error } = await supabase
      .from('customer_predictions_cache')
      .select('*')
      .eq('mr_name', mrName)
      .limit(500); // Practical limit for field visits
    
    if (error) throw new Error(`Supabase error: ${error.message}`);
    
    return data.map(c => ({
      ...c,
      total_priority_score: parseFloat(c.total_priority_score) || 0,
      predicted_order_value: parseFloat(c.predicted_order_value) || 0
    })).sort((a, b) => b.total_priority_score - a.total_priority_score);
  }

  // Clustering Engine =================================================
  async createOptimizedClusters(customers) {
    // Group by geographic area first
    const areaGroups = customers.reduce((acc, customer) => {
      const area = customer.area_name || 'Unassigned';
      if (!acc[area]) acc[area] = [];
      acc[area].push(customer);
      return acc;
    }, {});

    // Then create route-efficient clusters
    return this.groupAreasIntoRoutes(areaGroups);
  }

  groupAreasIntoRoutes(areaGroups) {
    // Simplified clustering - in production use Maps API or dedicated library
    const areas = Object.keys(areaGroups);
    const clusters = [];
    const MAX_AREAS_PER_CLUSTER = 4;
    
    // Priority areas get dedicated clusters
    const priorityAreas = areas.filter(a => 
      areaGroups[a].some(c => c.total_priority_score > 70)
      .sort((a, b) => 
        areaGroups[b].reduce((sum, c) => sum + c.total_priority_score, 0) - 
        areaGroups[a].reduce((sum, c) => sum + c.total_priority_score, 0)
      );

    // Create priority clusters
    priorityAreas.forEach(area => {
      clusters.push({
        name: `Priority: ${area}`,
        areas: [area],
        priority: 'high',
        avgPriority: areaGroups[area].reduce((sum, c) => sum + c.total_priority_score, 0) / areaGroups[area].length
      });
    });

    // Group remaining areas geographically
    const remainingAreas = areas.filter(a => !priorityAreas.includes(a));
    for (let i = 0; i < remainingAreas.length; i += MAX_AREAS_PER_CLUSTER) {
      const clusterAreas = remainingAreas.slice(i, i + MAX_AREAS_PER_CLUSTER);
      clusters.push({
        name: `Route ${clusters.length + 1}`,
        areas: clusterAreas,
        priority: 'medium',
        avgPriority: clusterAreas.reduce((sum, a) => 
          sum + (areaGroups[a].reduce((s, c) => s + c.total_priority_score, 0) / areaGroups[a].length, 0) / clusterAreas.length
      });
    }

    return clusters;
  }

  // Calendar Construction ==============================================
  buildCalendar(month, year, totalCustomers) {
    const days = [];
    const date = new Date(year, month - 1, 1);
    
    while (date.getMonth() === month - 1) {
      if (date.getDay() !== 0) { // Skip Sundays
        days.push({
          date: date.toISOString().split('T')[0],
          dayName: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][date.getDay()],
          clusters: [],
          remainingCapacity: this.visitCapacity,
          isPriorityDay: ['Tue','Wed','Thu'].includes(['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][date.getDay()])
        });
      }
      date.setDate(date.getDate() + 1);
    }

    // Calculate required working days
    const requiredDays = Math.ceil(totalCustomers / this.visitCapacity);
    if (days.length < requiredDays) {
      console.warn(`Insufficient days: Need ${requiredDays} but only ${days.length} available`);
    }

    return days;
  }

  // Visit Assignment ===================================================
  assignVisits(calendar, clusters, customers) {
    // 1. Assign priority clusters to priority days first
    const priorityClusters = clusters.filter(c => c.priority === 'high');
    const priorityDays = calendar.filter(d => d.isPriorityDay);
    
    priorityClusters.forEach((cluster, i) => {
      const day = priorityDays[i % priorityDays.length] || calendar[i % calendar.length];
      this.assignClusterToDay(day, cluster, customers);
    });

    // 2. Fill remaining capacity with medium clusters
    const mediumClusters = clusters.filter(c => c.priority === 'medium');
    let clusterIndex = 0;
    
    calendar.forEach(day => {
      while (day.remainingCapacity > 0 && clusterIndex < mediumClusters.length) {
        this.assignClusterToDay(day, mediumClusters[clusterIndex], customers);
        clusterIndex++;
      }
    });

    // 3. Distribute remaining customers
    this.distributeRemainingCustomers(calendar, customers);

    return calendar;
  }

  assignClusterToDay(day, cluster, allCustomers) {
    const visits = [];
    let capacityUsed = 0;

    cluster.areas.forEach(area => {
      const areaCustomers = allCustomers
        .filter(c => c.area_name === area && !this.customerTracker.has(c.customer_phone));
      
      const needed = Math.min(
        areaCustomers.length, 
        day.remainingCapacity - capacityUsed,
        Math.ceil(this.visitCapacity * 0.7) // Don't overload day with one area
      );

      if (needed > 0) {
        visits.push({
          area,
          customers: areaCustomers.slice(0, needed),
          type: 'primary'
        });
        capacityUsed += needed;
        
        // Mark customers as scheduled
        areaCustomers.slice(0, needed).forEach(c => {
          this.customerTracker.set(c.customer_phone, {
            scheduledDay: day.date,
            visitCount: 1
          });
        });
      }
    });

    if (visits.length > 0) {
      day.clusters.push({
        name: cluster.name,
        visits,
        priority: cluster.priority
      });
      day.remainingCapacity -= capacityUsed;
    }
  }

  distributeRemainingCustomers(calendar, customers) {
    const unscheduled = customers.filter(c => !this.customerTracker.has(c.customer_phone));
    
    unscheduled.forEach((customer, i) => {
      const dayIndex = i % calendar.length;
      const day = calendar[dayIndex];
      
      if (day.remainingCapacity > 0) {
        const area = customer.area_name || 'Unassigned';
        let cluster = day.clusters.find(c => c.visits.some(v => v.area === area));
        
        if (!cluster) {
          cluster = {
            name: `Ad-hoc: ${area}`,
            visits: [],
            priority: 'low'
          };
          day.clusters.push(cluster);
        }
        
        let visit = cluster.visits.find(v => v.area === area);
        if (!visit) {
          visit = { area, customers: [], type: 'overflow' };
          cluster.visits.push(visit);
        }
        
        visit.customers.push(customer);
        day.remainingCapacity--;
        this.customerTracker.set(customer.customer_phone, {
          scheduledDay: day.date,
          visitCount: 1
        });
      }
    });
  }

  // Result Formatting =================================================
  prepareFinalResult(mrName, month, year, calendar, customers) {
    const workingDays = calendar.filter(d => d.remainingCapacity < this.visitCapacity);
    const totalVisits = customers.length - calendar.reduce((sum, d) => sum + d.remainingCapacity, 0);
    
    return {
      success: true,
      mrName,
      month,
      year,
      summary: {
        totalWorkingDays: workingDays.length,
        totalVisits,
        visitTarget: this.visitCapacity,
        coverage: (totalVisits / customers.length * 100).toFixed(1) + '%',
        estimatedRevenue: customers.reduce((sum, c) => sum + (c.predicted_order_value || 0), 0)
      },
      dailyPlans: calendar.map(day => ({
        date: day.date,
        dayName: day.dayName,
        totalVisits: this.visitCapacity - day.remainingCapacity,
        clusters: day.clusters.map(c => ({
          name: c.name,
          areas: c.visits.map(v => ({
            area: v.area,
            visits: v.customers.length,
            type: v.type
          }))
        }))
      })),
      metrics: this.calculatePerformanceMetrics(calendar, customers)
    };
  }

  calculatePerformanceMetrics(calendar, customers) {
    // Implement your KPIs here
    return {
      efficiency: '95%',
      potential: 'High',
      // ... other metrics
    };
  }

  // Fallback Handling =================================================
  generateFallbackPlan(mrName, month, year, error) {
    // Simple round-robin fallback
    const daysInMonth = new Date(year, month, 0).getDate();
    const workingDays = Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(year, month - 1, i + 1);
      return date.getDay() === 0 ? null : date.toISOString().split('T')[0];
    }).filter(Boolean);
    
    return {
      success: false,
      mrName,
      month,
      year,
      error: error.message,
      fallbackPlan: workingDays.map(date => ({
        date,
        visits: this.visitCapacity,
        note: 'Fallback plan - verify manually'
      })),
      warning: 'Used fallback planning due to error'
    };
  }
}

// Singleton instance
export const visitPlanner = new OptimizedVisitPlanner();
