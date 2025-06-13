# Testing and Validation Strategy for `generate_monthly_visit_plan_v2`

This document outlines the strategy for testing and validating the `generate_monthly_visit_plan_v2` SQL function and its components. A multi-layered approach will be adopted to ensure correctness, robustness, and performance.

## 1. Unit Testing (Helper SQL Functions)

-   **Scope**: Individual, standalone SQL helper functions (conceptualized in `visit_plan_helpers_spec.md`), such as:
    -   `calculate_target_visit_interval_days`
    -   `calculate_value_score`
    -   `calculate_time_urgency_score`
    -   `calculate_combined_priority_score`
    -   `calculate_haversine_distance` (if not using PostGIS built-ins)
-   **Method**:
    -   Use a SQL testing framework like `pgTAP` if the database environment supports it (e.g., PostgreSQL).
    -   For each function, create test cases with defined inputs and expected outputs.
    -   Cover edge cases, valid inputs, and invalid inputs (to check error handling or default behavior).
-   **Example (Conceptual for `calculate_time_urgency_score`)**:
    -   Test Case 1: Last visit = 10 days ago, target interval = 20 days. Expected score: Low.
    -   Test Case 2: Last visit = 20 days ago, target interval = 20 days. Expected score: Medium.
    -   Test Case 3: Last visit = 30 days ago, target interval = 20 days. Expected score: High.
    -   Test Case 4: Last visit = NULL. Expected score: Very High.

## 2. Modular Testing (CTE Logic)

-   **Scope**: Test the logic of individual Common Table Expressions (CTEs) as defined in `visit_plan_helpers_spec.md` (e.g., `InitialCustomerData`, `DailyCustomerUpdates`, `EligibleCustomersToday`, `SeedCustomerSelection`, `NearbyCustomersForSeed`).
-   **Method**:
    -   Isolate the SQL for each CTE or a small chain of related CTEs.
    -   Prepare sample data in temporary tables that mimic the CTE's input tables (e.g., `tmp_customer_tracker` snapshot, sample customer data).
    -   Execute the CTE's SQL against this sample data.
    -   Verify the output of the CTE against expected results.
-   **Example (Conceptual for `EligibleCustomersToday`)**:
    -   Setup `tmp_customer_tracker` with a mix of due/not-due customers, some in a focused zone, some outside.
    -   Run the `EligibleCustomersToday` CTE logic.
    -   Verify that only due customers are selected.
    -   Verify that zone focusing (if applied) correctly prioritizes customers from the specified zone.
    -   Verify correct sorting by `combined_priority_score`.

## 3. End-to-End Function Testing (`generate_monthly_visit_plan_v2`)

-   **Scope**: Test the entire `generate_monthly_visit_plan_v2` function with diverse scenarios and data sets.
-   **Method**:
    -   Prepare comprehensive test datasets representing various real-world conditions.
    -   Execute the main function with different parameter combinations.
    -   Analyze the generated `PlannedVisits` table and any summary outputs.
-   **Key Scenarios to Test**:
    -   **Basic Plan Generation**: Small set of customers, simple rules, ensure basic functionality.
    -   **High Load**: Large number of customers and/or high `p_target_daily_visits` to check performance and scalability.
    -   **Geographic Variations**:
        -   Customers clustered tightly in one area.
        -   Customers sparsely distributed.
        -   Customers in multiple distinct geographic clusters.
    -   **Revisit Rule Compliance**: Ensure `p_min_revisit_gap_days` is strictly adhered to.
    -   **Minimum Coverage**: Verify that `p_min_coverage_visits_per_month` is achieved for most/all customers, especially towards month-end. Test the priority boost for lagging customers.
    -   **Specific Day/Zone Focus**: Use `p_focused_zone_schedule` to target specific zones on specific days and verify seed customers come from these zones.
    -   **Fallback Zone Logic**: Test scenarios where no zone is scheduled, verifying that fallback logic (urgency, recency) selects zones appropriately.
    -   **No Eligible Customers**: Ensure the function behaves gracefully if no customers are eligible for visits on some days.
    -   **`p_force_regenerate`**: Test both `TRUE` (clears old plan) and `FALSE` (should ideally support resumable/incremental planning if designed for it, or fail gracefully if not).
    -   **Varying `p_num_field_reps`**: Ensure total daily targets scale correctly.

## 4. Validation Metrics and SQL Checks

-   **Scope**: Quantitative and qualitative checks on the output `PlannedVisits` table.
-   **SQL Queries for Validation**:
    -   **Total Visits vs. Target**: `COUNT(visit_id)` per day vs. `p_target_daily_visits * p_num_field_reps`.
    -   **Revisit Gap Compliance**: Check no customer has visits closer than `p_min_revisit_gap_days`.
        ```sql
        -- Conceptual check for revisit gap violations
        SELECT customer_id, planned_visit_date, prev_visit_date, planned_visit_date - prev_visit_date AS gap
        FROM (
            SELECT customer_id, planned_visit_date,
                   LAG(planned_visit_date, 1) OVER (PARTITION BY customer_id ORDER BY planned_visit_date) AS prev_visit_date
            FROM PlannedVisits
        ) AS visit_gaps
        WHERE (planned_visit_date - prev_visit_date) < p_min_revisit_gap_days;
        ```
    -   **Customer Coverage (Minimums)**:
        -   `COUNT(DISTINCT customer_id)` in `PlannedVisits`.
        -   Number of customers meeting `p_min_coverage_visits_per_month`.
        -   List customers not meeting minimum coverage.
    -   **Clustering Quality (Conceptual)**:
        -   Average/max distance of clustered customers from their seed for a given day.
        -   Number of distinct 'mini-clusters' per day. (Requires `cluster_id` in output).
    -   **Zone Coverage**:
        -   Number of visits per `customer.cluster_name`.
        -   Verify if `p_focused_zone_schedule` was adhered to on specified days.
    -   **Priority Adherence (Spot Checks)**: Were high-priority customers generally planned before lower-priority ones, subject to clustering and other constraints?
    -   **Daily Target Adherence**: Are daily targets consistently met? If not, why (e.g., no eligible customers)?

## 5. Comparison with Old Function's Output (If Applicable)

-   **Purpose**: To benchmark improvements and identify regressions if `generate_monthly_visit_plan_v2` is replacing an existing function.
-   **Method**:
    -   Run both old and new functions on the same dataset (if feasible).
    -   Compare key metrics: customer coverage, visit distribution, travel efficiency (if estimable), adherence to business rules.
    -   Identify specific customers or scenarios where the new function performs better or worse.

## 6. User Acceptance Testing (UAT)

-   **Participants**: End-users (e.g., sales managers, field representatives, planners).
-   **Method**:
    -   Provide users with plans generated by the new function for familiar territories or scenarios.
    -   Collect feedback on the plan's practicality, logical flow, and perceived quality.
    -   Does the plan "make sense" from a human perspective?
    -   Are there any glaring omissions or illogical sequences?
-   **Environment**: A staging environment with realistic data.

## 7. General Testing Best Practices

-   **Version Control**: All test scripts and specification documents (like this one) stored in version control.
-   **Dedicated Test Data**: Maintain a curated set of test data that covers a wide range of scenarios. This data should be stable and well-understood.
-   **Automation**: Automate as much of the testing process as possible, especially unit, modular, and common end-to-end tests. This allows for regression testing.
-   **Documentation**: Clearly document test cases, expected outcomes, and actual results.

This strategy aims to build confidence in the `generate_monthly_visit_plan_v2` function before deployment.
