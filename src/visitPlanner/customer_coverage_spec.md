# Customer Consideration Mechanisms for Visit Planning V2

This document details the mechanisms within `generate_monthly_visit_plan_v2` designed to ensure that all customers are fairly considered for visits and that minimum coverage targets are met.

## 1. Minimum Coverage Visits per Month

-   **Parameter**: `p_min_coverage_visits_per_month` (Input to the main function, e.g., defaults to 1).
-   **Tracking**:
    -   A field `visits_this_month_count` in the `tmp_customer_tracker` table is incremented each time a visit is scheduled for a customer during the current planning month.
    -   A status field, `min_coverage_status` (e.g., 'Lagging', 'Met', 'Exceeded'), is updated daily for each customer in `tmp_customer_tracker`.
        -   'Lagging': `visits_this_month_count` < `p_min_coverage_visits_per_month`.
        -   'Met': `visits_this_month_count` == `p_min_coverage_visits_per_month`.
        -   'Exceeded': `visits_this_month_count` > `p_min_coverage_visits_per_month`.

## 2. 'Lagging in Minimum Coverage' Status and Priority Boost

-   **Impact**: Customers with `min_coverage_status = 'Lagging'` receive special attention in the `calculate_combined_priority_score` function.
-   **Logic**:
    -   A significant boost is added to their `combined_priority_score`.
    -   This boost can be dynamic:
        -   It might be larger as the month progresses (e.g., a customer still lagging in the last week of the month gets a higher priority boost than one lagging in the first week).
        -   This can be implemented by factoring in `(current_planning_day / total_working_days_in_month)` into the boost calculation.
    -   This ensures that as the month nears its end, fulfilling minimum coverage becomes a very high priority.

## 3. Dedicated Phase in Daily Algorithm for Lagging Customers

-   **Step**: As outlined in the core function logic (`generate_monthly_visit_plan_v2_spec.md`), there's a specific phase in the daily planning loop: "Handle Under-Target Days (Minimum Coverage Focus)."
-   **Trigger**: This phase is typically activated if the `p_target_daily_visits` is not met after the primary iterative mini-cluster building.
-   **Action**:
    -   The system specifically selects customers from `tmp_customer_tracker` who are `min_coverage_status = 'Lagging'`.
    -   These customers are prioritized to fill the remaining daily visit slots.
    -   Clustering rules might be slightly relaxed for these visits if necessary, though geographic proximity is still a secondary consideration. The primary goal here is ensuring coverage.

## 4. Natural Priority Increase from Time-based Urgency Score

-   **Mechanism**: The `calculate_time_urgency_score` helper function naturally increases a customer's priority as more time elapses since their last visit relative to their `target_visit_interval_days`.
-   **Effect**: Even without specific minimum coverage rules, customers who haven't been visited for a while will see their `time_urgency_score`, and consequently their `combined_priority_score`, rise. This makes them more likely to be selected for a visit through the regular `EligibleCustomersToday` and `SeedCustomerSelection` process.
-   **Complementary**: This works in tandem with the minimum coverage logic. A customer might not hit their `target_visit_interval_days` frequently but still needs to meet the `p_min_coverage_visits_per_month`.

## 5. Area/Zone Rotation and Scheduling

-   **Mechanism**: The area/cluster scheduling logic (detailed in `area_cluster_logic_spec.md`), whether through `p_focused_zone_schedule` or the fallback strategy, ensures that different geographic groups of customers are brought into focus on different days.
-   **Effect**: This rotation helps to systematically bring different sets of customers to the forefront for potential seed selection, increasing the chances that customers across all areas are considered and planned over the month. Without such rotation, high-density areas or areas with consistently high-priority customers might dominate, leaving others neglected.

## 6. Conceptual End-of-Month Review (Post-Processing Analysis)

-   **Purpose**: While not directly part of the `generate_monthly_visit_plan_v2` function's execution, a recommended practice is to analyze the generated plan for any remaining coverage gaps.
-   **Process**:
    -   After the plan is generated, query the `PlannedVisits` table and `Customers` table.
    -   Identify any active customers who did not receive `p_min_coverage_visits_per_month`.
    -   Analyze reasons (e.g., consistently low priority, data issues, extreme remoteness).
-   **Feedback Loop**: This analysis can provide insights to:
    -   Adjust `p_min_coverage_visits_per_month` for future plans.
    -   Refine scoring parameters or business rules.
    -   Identify customers needing manual review or exceptional handling.
    -   Improve the `p_focused_zone_schedule` for subsequent months.

## Summary

These mechanisms—minimum visit targets, priority boosts for lagging customers, dedicated algorithm phases, natural urgency escalation, and systematic area rotation—work together to create a robust system that strives for comprehensive customer attention and avoids leaving customers unvisited without reason.
