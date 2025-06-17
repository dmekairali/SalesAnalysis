// src/utils/dataAccessControl.js - Complete Data Access Control System

/**
 * Data Access Control Utilities
 * Handles role-based data filtering and access control
 */

export class DataAccessController {
  constructor(user, accessibleMRs = []) {
    this.user = user;
    this.accessibleMRs = accessibleMRs;
  }

  /**
   * Filter order data based on user access level
   */
  filterOrderData(orderData) {
    if (!this.user || !orderData) return [];

    switch (this.user.access_level) {
      case 'admin':
        // Admin sees all data
        return orderData;

      case 'manager':
        // Manager sees data for their team members + their assigned territories/states
        return orderData.filter(order => {
          // Filter by accessible MRs
          const mrMatch = this.accessibleMRs.includes(order.medicalRepresentative || order.salesRepresentative);
          
          // Filter by assigned territories
          const territoryMatch = this.user.assigned_territories 
            ? this.user.assigned_territories.includes(order.territory)
            : false;

          // Filter by assigned states
          const stateMatch = this.user.assigned_states 
            ? this.user.assigned_states.includes(order.state)
            : false;

          return mrMatch || territoryMatch || stateMatch;
        });

      case 'mr':
        // MR sees only their own data
        return orderData.filter(order => 
          (order.medicalRepresentative === this.user.mr_name) ||
          (order.salesRepresentative === this.user.mr_name)
        );

      case 'viewer':
        // Viewer sees limited data based on assignments
        return orderData.filter(order => {
          const stateMatch = this.user.assigned_states 
            ? this.user.assigned_states.includes(order.state)
            : false;
          const territoryMatch = this.user.assigned_territories 
            ? this.user.assigned_territories.includes(order.territory)
            : false;
          
          return stateMatch || territoryMatch;
        });

      default:
        return [];
    }
  }

  /**
   * Filter dashboard order data (aggregated orders)
   */
  filterDashboardData(dashboardData) {
    if (!this.user || !dashboardData) return [];

    switch (this.user.access_level) {
      case 'admin':
        return dashboardData;

      case 'manager':
        return dashboardData.filter(order => {
          const mrMatch = this.accessibleMRs.includes(order.medicalRepresentative);
          const territoryMatch = this.user.assigned_territories 
            ? this.user.assigned_territories.includes(order.territory)
            : false;
          const stateMatch = this.user.assigned_states 
            ? this.user.assigned_states.includes(order.state)
            : false;

          return mrMatch || territoryMatch || stateMatch;
        });

      case 'mr':
        return dashboardData.filter(order => 
          order.medicalRepresentative === this.user.mr_name
        );

      case 'viewer':
        return dashboardData.filter(order => {
          const stateMatch = this.user.assigned_states 
            ? this.user.assigned_states.includes(order.state)
            : false;
          const territoryMatch = this.user.assigned_territories 
            ? this.user.assigned_territories.includes(order.territory)
            : false;
          
          return stateMatch || territoryMatch;
        });

      default:
        return [];
    }
  }

  /**
   * Get available MR options for filters based on user access
   */
  getAvailableMRs(orderData) {
    if (!this.user) return [];

    const allMRs = [...new Set(orderData.map(order => 
      order.medicalRepresentative || order.salesRepresentative || 'N/A'
    ))].filter(Boolean);

    switch (this.user.access_level) {
      case 'admin':
        return allMRs.sort();

      case 'manager':
        return this.accessibleMRs.filter(mr => allMRs.includes(mr)).sort();

      case 'mr':
        return this.user.mr_name ? [this.user.mr_name] : [];

      case 'viewer':
        // Viewers can see MRs from their assigned territories/states
        const filteredData = this.filterOrderData(orderData);
        return [...new Set(filteredData.map(order => 
          order.medicalRepresentative || order.salesRepresentative || 'N/A'
        ))].filter(Boolean).sort();

      default:
        return [];
    }
  }

  /**
   * Get available states for filters based on user access
   */
  getAvailableStates(orderData) {
    if (!this.user) return [];

    switch (this.user.access_level) {
      case 'admin':
        return [...new Set(orderData.map(order => order.state))].filter(Boolean).sort();

      case 'manager':
      case 'viewer':
        // Return assigned states or states from filtered data
        if (this.user.assigned_states && this.user.assigned_states.length > 0) {
          return this.user.assigned_states.sort();
        }
        // Fallback to states from accessible data
        const filteredData = this.filterOrderData(orderData);
        return [...new Set(filteredData.map(order => order.state))].filter(Boolean).sort();

      case 'mr':
        // MR sees states from their own data
        const mrData = this.filterOrderData(orderData);
        return [...new Set(mrData.map(order => order.state))].filter(Boolean).sort();

      default:
        return [];
    }
  }

  /**
   * Get available territories for filters based on user access
   */
  getAvailableTerritories(orderData) {
    if (!this.user) return [];

    switch (this.user.access_level) {
      case 'admin':
        return [...new Set(orderData.map(order => order.territory))].filter(Boolean).sort();

      case 'manager':
      case 'viewer':
        if (this.user.assigned_territories && this.user.assigned_territories.length > 0) {
          return this.user.assigned_territories.sort();
        }
        const filteredData = this.filterOrderData(orderData);
        return [...new Set(filteredData.map(order => order.territory))].filter(Boolean).sort();

      case 'mr':
        const mrData = this.filterOrderData(orderData);
        return [...new Set(mrData.map(order => order.territory))].filter(Boolean).sort();

      default:
        return [];
    }
  }

  /**
   * Check if user can access specific MR's visit planner data
   */
  canAccessVisitPlanner(mrName) {
    if (!this.user) return false;

    switch (this.user.access_level) {
      case 'admin':
        return true;

      case 'manager':
        return this.accessibleMRs.includes(mrName);

      case 'mr':
        return this.user.mr_name === mrName;

      case 'viewer':
        return false; // Viewers cannot access visit planner

      default:
        return false;
    }
  }

  /**
   * Get contextual access message for UI
   */
  getAccessMessage() {
    if (!this.user) return '';

    switch (this.user.access_level) {
      case 'admin':
        return 'Full system access - viewing all organizational data';

      case 'manager':
        return `Team access - viewing data for ${this.accessibleMRs.length} team members across ${this.user.assigned_states?.length || 0} states`;

      case 'mr':
        return `Personal access - viewing your individual performance data`;

      case 'viewer':
        return `Read-only access - viewing assigned territory data`;

      default:
        return 'Limited access';
    }
  }

  /**
   * Get data scope statistics for current user
   */
  getDataScope(orderData, dashboardData) {
    const filteredOrders = this.filterOrderData(orderData);
    const filteredDashboard = this.filterDashboardData(dashboardData);

    return {
      totalOrdersAccessible: filteredOrders.length,
      totalOrdersInSystem: orderData.length,
      accessPercentage: orderData.length > 0 ? (filteredOrders.length / orderData.length * 100).toFixed(1) : 0,
      uniqueCustomers: new Set(filteredOrders.map(o => o.customerId)).size,
      uniqueStates: new Set(filteredOrders.map(o => o.state)).size,
      uniqueTerritories: new Set(filteredOrders.map(o => o.territory)).size,
      accessibleMRCount: this.accessibleMRs.length,
      dataScope: this.user?.access_level === 'admin' ? 'Global' : 
                 this.user?.access_level === 'manager' ? 'Regional' : 
                 this.user?.access_level === 'mr' ? 'Personal' : 'Limited'
    };
  }
}

/**
 * Helper function to create data access controller instance
 */
export const createDataAccessController = (user, accessibleMRs = []) => {
  return new DataAccessController(user, accessibleMRs);
};

/**
 * Hook for easy integration with React components
 */
export const useDataAccess = (user, accessibleMRs = []) => {
  const controller = new DataAccessController(user, accessibleMRs);

  return {
    filterOrderData: (data) => controller.filterOrderData(data),
    filterDashboardData: (data) => controller.filterDashboardData(data),
    getAvailableMRs: (data) => controller.getAvailableMRs(data),
    getAvailableStates: (data) => controller.getAvailableStates(data),
    getAvailableTerritories: (data) => controller.getAvailableTerritories(data),
    canAccessVisitPlanner: (mrName) => controller.canAccessVisitPlanner(mrName),
    getAccessMessage: () => controller.getAccessMessage(),
    getDataScope: (orderData, dashboardData) => controller.getDataScope(orderData, dashboardData),
    hasAccess: (level) => {
      const levels = { viewer: 1, mr: 2, manager: 3, admin: 4 };
      return (levels[user?.access_level] || 0) >= (levels[level] || 0);
    }
  };
};
