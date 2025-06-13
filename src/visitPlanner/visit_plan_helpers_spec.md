# SQL CTEs and Helper Function Specifications for Visit Planning V2

This document outlines the Common Table Expressions (CTEs) and conceptual SQL helper functions supporting `generate_monthly_visit_plan_v2`.

## 1. Common Table Expressions (CTEs)

These CTEs are primarily used within the main daily planning loop of `generate_monthly_visit_plan_v2`. They operate on or contribute to the `tmp_customer_tracker` table.

### 1.1. `InitialCustomerData`
    -   **Purpose**: Populates the `tmp_customer_tracker` table at the beginning of the planning process.
    -   **Source Tables**:
        -   `Customers` (for basic data like ID, location, `cluster_name`)
        -   `CustomerValueMetrics` (for components of `value_score`)
        -   `HistoricalVisits` (to get `last_visit_date_actual`)
        -   `CustomerOrderPredictions` (for `predicted_order_interval`)
    -   **Output Schema (columns added to/updated in `tmp_customer_tracker`)**:
        -   `customer_id`
        -   `latitude`, `longitude`
        -   `cluster_name` (broader geographic grouping)
        -   `predicted_order_interval`
        -   `target_visit_interval_days` (calculated, see Helper Functions)
        -   `value_score` (calculated, see Helper Functions)
        -   `last_visit_date_actual`
        -   `last_visit_date_planned_current` (initially NULL or same as `last_visit_date_actual`)
        -   `visits_this_month_count` (initially 0)
        -   `min_coverage_status` (initially 'Lagging' or equivalent)
        -   Other static customer attributes relevant for planning.
    -   **Notes**: This CTE effectively joins and pre-processes data from various source tables to create the initial state of `tmp_customer_tracker`.

### 1.2. `MonthWorkingDays`
    -   **Purpose**: Determines all valid working days within the `p_planning_month`.
    -   **Source Tables/Logic**:
        -   Uses `p_planning_month` and `p_country_code`.
        -   A calendar/holiday table specific to `p_country_code`.
        -   Logic to exclude weekends (e.g., Saturday, Sunday).
    -   **Output Schema**:
        -   `working_date` (DATE): A list of dates that are working days.
    -   **Notes**: This CTE's result is used to drive the main daily planning loop.

### 1.3. `DailyCustomerUpdates`
    -   **Purpose**: Recalculates dynamic customer scores and statuses for the current planning day. Executed at the start of each day in the daily loop.
    -   **Input**: Current state of `tmp_customer_tracker`, current planning day.
    -   **Logic (for each customer in `tmp_customer_tracker`)**:
        -   Calculate `time_urgency_score` (see Helper Functions).
        -   Calculate `combined_priority_score` (see Helper Functions).
        -   Determine `is_due_today`:
            -   Compares `current_planning_day` with (`last_visit_date_planned_current` OR `last_visit_date_actual`) + `target_visit_interval_days`.
            -   Ensures `current_planning_day` is >= (`last_visit_date_planned_current` OR `last_visit_date_actual`) + `p_min_revisit_gap_days`.
        -   Update `min_coverage_status` based on `visits_this_month_count` vs. `p_min_coverage_visits_per_month` and how far into the month it is.
    -   **Output**: Updates these dynamic fields in `tmp_customer_tracker` for all customers.

### 1.4. `EligibleCustomersToday`
    -   **Purpose**: Selects customer candidates for visits on the current planning day.
    -   **Input**: `tmp_customer_tracker` (after `DailyCustomerUpdates`), `p_focused_zone_schedule`, current planning day.
    -   **Logic**:
        -   Filters `tmp_customer_tracker` for `is_due_today = TRUE`.
        -   If a `p_focused_zone_schedule` is active for the day and specifies a zone:
            -   May initially prioritize customers where `tmp_customer_tracker.cluster_name` matches the focused zone.
            -   If insufficient candidates or if targets can't be met, this zone focus might be relaxed or used as a preference for seed selection.
        -   Orders candidates by `combined_priority_score` descending.
    -   **Output Schema (subset of `tmp_customer_tracker` columns for eligible customers)**:
        -   `customer_id`
        -   `latitude`, `longitude`
        -   `combined_priority_score`
        -   `cluster_name`
        -   Other columns needed for seed selection and clustering.

### 1.5. `SeedCustomerSelection`
    -   **Purpose**: Chooses the initial 'seed' customer for a new mini-cluster from the pool of eligible customers.
    -   **Input**: Output of `EligibleCustomersToday` (customers not yet planned for today).
    -   **Logic**:
        -   Selects one customer.
        -   Primary sort: `combined_priority_score` descending.
        -   Secondary consideration: If a zone is focused for the day via `p_focused_zone_schedule`, preference is given to customers in that `cluster_name`.
        -   Further tie-breaking rules if needed (e.g., longest time since last visit).
    -   **Output**: A single row corresponding to the selected seed customer.

### 1.6. `NearbyCustomersForSeed`
    -   **Purpose**: Finds other due customers geographically close to the selected seed customer to form a mini-cluster.
    -   **Input**:
        -   The chosen `SeedCustomer` (ID, latitude, longitude).
        -   Output of `EligibleCustomersToday` (excluding already planned customers for the day and the seed itself).
        -   A distance threshold (e.g., configurable, or dynamically adjusted).
    -   **Logic**:
        -   Filters eligible customers:
            -   Within the distance threshold of the seed customer's lat/long (using Haversine or PostGIS `ST_DWithin`).
            -   Who are also `is_due_today = TRUE`.
            -   Respects `p_min_revisit_gap_days` from any visit planned *earlier in the current planning session*.
        -   Orders them by proximity and/or `combined_priority_score`.
        -   Limits the number of customers to a configurable "mini-cluster size" (e.g., 2-4 additional customers).
    -   **Output**: A list of customer_ids (and relevant data) to be added to the current mini-cluster.

## 2. Conceptual SQL Helper Functions

These functions encapsulate specific calculations. They would ideally be implemented as standalone SQL functions (if performance allows and complexity warrants) or as complex expressions within CTEs.

### 2.1. `calculate_target_visit_interval_days(p_predicted_order_interval INT) RETURNS INT`
    -   **Purpose**: Determines the ideal number of days between visits for a customer.
    -   **Logic**:
        -   Could be `p_predicted_order_interval - buffer_days` (e.g., buffer of 3-7 days to visit before expected order).
        -   May have defined tiers, e.g., if `p_predicted_order_interval` < 15 days, then interval is 7 days; if 15-30, then 14 days, etc.
        -   This logic needs to be clearly defined based on business rules.
    -   **Input**: `predicted_order_interval` (from `tmp_customer_tracker`).
    -   **Output**: Integer representing target days between visits.

### 2.2. `calculate_value_score(various_metrics) RETURNS NUMERIC`
    -   **Purpose**: Calculates a score representing a customer's overall value or importance.
    -   **Logic**:
        -   Weighted sum of several factors, e.g.:
            -   `historical_purchase_volume * w1`
            -   `average_order_value * w2`
            -   `customer_segment_ranking * w3`
            -   `contract_level * w4`
        -   Weights (w1, w2, etc.) and factors to be defined by business.
        -   The score should be normalized (e.g., 0-100 or 0-1).
    -   **Input**: Various customer-specific metrics (e.g., sales data, segmentation).
    -   **Output**: Numeric value score.

### 2.3. `calculate_time_urgency_score(p_last_visit_date DATE, p_target_interval INT, p_current_date DATE) RETURNS NUMERIC`
    -   **Purpose**: Calculates a score indicating how urgent a visit is based on elapsed time vs. target interval.
    -   **Logic**:
        -   `days_since_last_visit = p_current_date - p_last_visit_date`
        -   `urgency_ratio = days_since_last_visit / p_target_interval`
        -   Score increases as `urgency_ratio` > 1. Could be linear, exponential, or tiered.
        -   Example: If ratio is 1.0, score is 50. If 1.2, score is 70. If < 1.0, score is lower.
        -   Needs to handle cases where `p_last_visit_date` is NULL (e.g., new customer, assign high urgency).
    -   **Input**: `last_visit_date_planned_current` (or `last_visit_date_actual`), `target_visit_interval_days`, current planning day.
    -   **Output**: Numeric time-based urgency score.

### 2.4. `calculate_combined_priority_score(p_value_score NUMERIC, p_time_urgency_score NUMERIC, p_min_coverage_status VARCHAR, ...) RETURNS NUMERIC`
    -   **Purpose**: Calculates the overall priority score for a customer.
    -   **Logic**:
        -   Combines `value_score` and `time_urgency_score` (e.g., weighted average or product).
        -   `combined_score = (p_value_score * weight_v) + (p_time_urgency_score * weight_t)`
        -   Boosts score significantly if `p_min_coverage_status` is 'Lagging', especially later in the month. This boost factor might increase as the month progresses.
        -   May include other factors (e.g., temporary promotions, strategic importance).
    -   **Input**: `value_score`, `time_urgency_score`, `min_coverage_status`, potentially other flags or scores from `tmp_customer_tracker`.
    -   **Output**: Numeric combined priority score.

### 2.5. `calculate_haversine_distance(lat1 NUMERIC, lon1 NUMERIC, lat2 NUMERIC, lon2 NUMERIC) RETURNS NUMERIC`
    -   **Purpose**: Calculates geographic distance between two lat/lon points.
    -   **Logic**: Standard Haversine formula.
        ```sql
        -- Example SQL for Haversine distance in kilometers
        -- R = 6371 (Earth's radius in km)
        -- dLat = RADIANS(lat2 - lat1)
        -- dLon = RADIANS(lon2 - lon1)
        -- a = SIN(dLat / 2) * SIN(dLat / 2) + COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * SIN(dLon / 2) * SIN(dLon / 2)
        -- c = 2 * ATAN2(SQRT(a), SQRT(1 - a))
        -- distance = R * c
        ```
    -   **Input**: Latitude/Longitude of two points.
    -   **Output**: Distance in kilometers or miles.
    -   **Note**: If PostGIS is available, `ST_DWithin` and `ST_Distance` are preferred for performance and accuracy with spatial indexes. This function is a fallback or for systems without PostGIS.
