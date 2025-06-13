# SQL Function Specification: `generate_monthly_visit_plan_v2`

This document details the specification for the `generate_monthly_visit_plan_v2` SQL function.

## 1. Purpose

The function aims to generate an optimized monthly visit plan for customers, addressing issues of incomplete coverage, poor clustering, and illogical/excessive visit frequencies found in previous versions. It incorporates dynamic clustering, advanced customer prioritization, and flexible visit frequency logic.

## 2. Input Parameters

| Parameter Name              | Data Type     | Description                                                                                                                               | Default Value |
|-----------------------------|---------------|-------------------------------------------------------------------------------------------------------------------------------------------|---------------|
| `p_planning_month`          | DATE          | The first day of the month for which the plan is to be generated (e.g., '2024-08-01').                                                    | Mandatory     |
| `p_target_daily_visits`     | INTEGER       | The desired number of customer visits per field representative per day.                                                                 | Mandatory     |
| `p_min_revisit_gap_days`    | INTEGER       | The minimum number of days that must pass before the same customer can be visited again.                                                    | Mandatory     |
| `p_force_regenerate`        | BOOLEAN       | If true, any existing plan data for the `p_planning_month` will be cleared and a new plan generated. If false, might resume or skip.       | `FALSE`       |
| `p_focused_zone_schedule`   | JSONB         | Optional. A JSON object defining a weekly cadence for focused geographic zones. Example: `{"Monday": "Zone A", "Tuesday": "Zone B", ...}` | `NULL`        |
| `p_country_code`            | VARCHAR(2)    | ISO 3166-1 alpha-2 country code for regional settings (e.g., holidays, workdays).                                                       | Mandatory     |
| `p_num_field_reps`          | INTEGER       | Number of field representatives available. Total daily capacity = `p_target_daily_visits` * `p_num_field_reps`.                             | `1`           |
| `p_min_coverage_visits_per_month` | INTEGER | Minimum number of times each active customer should be visited in the month, if possible.                                                 | `1`           |

## 3. Output Structure

The function will primarily output data into a `PlannedVisits` table (or a similarly named table, possibly temporary then copied). The schema for this output would be:

| Column Name          | Data Type     | Description                                                                 |
|----------------------|---------------|-----------------------------------------------------------------------------|
| `visit_id`           | BIGSERIAL     | Primary key for the visit.                                                  |
| `plan_id`            | BIGINT        | Foreign key to a general plan execution tracking table (if exists).         |
| `customer_id`        | BIGINT        | Identifier of the customer to be visited.                                   |
| `planned_visit_date` | DATE          | The date on which the visit is scheduled.                                   |
| `field_rep_id`       | INTEGER       | Identifier for the field representative assigned (if applicable at this stage).|
| `priority_score`     | NUMERIC       | The combined priority score of the customer at the time of planning.        |
| `cluster_id`         | VARCHAR       | Identifier for the mini-cluster this visit belongs to for the day.          |
| `is_min_coverage_visit`| BOOLEAN     | True if this visit was scheduled primarily to meet minimum coverage.        |
| `notes`                | TEXT          | Any notes related to this specific planned visit.                         |

The function may also update a summary table or return a status indicating success/failure and number of visits planned.

## 4. Core Logic Flow

The function will operate on a daily basis for the given `p_planning_month`.

### 4.1. Initialization
    - **Handle `p_force_regenerate`**: If true, clear any existing plan data for the month.
    - **Determine Working Days**: Identify all valid working days within `p_planning_month` (e.g., using a country-specific holiday calendar via `p_country_code`). Exclude weekends and public holidays.
    - **Initialize Customer Tracker**: Create and populate a central temporary table (e.g., `tmp_customer_tracker`) with relevant customer data. This includes `customer_id`, location (lat/long), `predicted_order_interval`, `last_visit_date`, `value_score_components`, `visits_this_month_count`, `min_coverage_status`, etc. (Details in `visit_plan_helpers_spec.md` under `InitialCustomerData` CTE). This table name should be dynamic or session-specific to allow concurrent runs if necessary (e.g., `tmp_customer_tracker_SESSIONID_YYYYMMDD`). For simplicity, `tmp_customer_tracker` will be used in this document.

### 4.2. Main Daily Planning Loop
    Iterate through each working day of `p_planning_month`:
    1.  **Daily Customer Updates**:
        -   Update `tmp_customer_tracker` for each customer:
            -   Recalculate Time-based Urgency Score.
            -   Recalculate Combined Priority Score.
            -   Update `is_due_today` status based on `target_visit_interval_days` (derived from `predicted_order_interval`) and `p_min_revisit_gap_days` from their last actual or planned visit in the current developing plan.
            -   Update `min_coverage_status` (e.g., 'lagging', 'met').
        (Details in `visit_plan_helpers_spec.md` under `DailyCustomerUpdates` CTE).
    2.  **Identify Eligible Customers**:
        -   Select customers from `tmp_customer_tracker` who are `is_due_today = TRUE` and have not exceeded any maximum visit frequency (if applicable).
        -   Apply `p_focused_zone_schedule`: If a zone is scheduled for the current day, preference might be given to customers in that zone for seed selection. If no specific customers are found or targets aren't met, this focus can be relaxed.
        (Details in `visit_plan_helpers_spec.md` under `EligibleCustomersToday` CTE).
    3.  **Iterative Mini-Cluster Building (per field representative or in aggregate for total daily target)**:
        Repeat until daily visit target (`p_target_daily_visits` * `p_num_field_reps`) is met or no more eligible/suitable customers:
        a.  **Seed Customer Selection**:
            -   Select the highest priority 'seed' customer from the eligible pool (considering focused zone if applicable).
            (Details in `visit_plan_helpers_spec.md` under `SeedCustomerSelection` CTE).
        b.  **Grow Mini-Cluster**:
            -   Find other nearby 'due' customers geographically close to the seed customer (using PostGIS `ST_DWithin` or Haversine distance).
            -   Add them to the current day's visit list for this emerging cluster, respecting `p_min_revisit_gap_days` based on visits already planned *in this session for previous days*.
            -   Continue adding until a local capacity for the cluster is met (e.g., 3-5 customers or if no more nearby due customers).
            (Details in `visit_plan_helpers_spec.md` under `NearbyCustomersForSeed` CTE).
        c.  Mark selected customers in `tmp_customer_tracker` as planned for today to prevent re-selection by this iteration.
    4.  **Handle Under-Target Days (Minimum Coverage Focus)**:
        -   If the daily visit target is not met after primary clustering, iterate through customers who are 'lagging in minimum coverage'.
        -   Prioritize these customers, potentially forming new mini-clusters or adding them to existing ones if geographically feasible (less strict clustering).
    5.  **Store Planned Visits**:
        -   Write the day's planned visits (customer_id, planned_visit_date, priority_score, etc.) to the main `PlannedVisits` output table.
        -   Update `tmp_customer_tracker` with the `last_planned_visit_date` for these customers and increment their `visits_this_month_count`.

### 4.3. Wrap-up
    - **Summary Updates**: Update any summary tables or logs with the results of the plan generation (e.g., total visits planned, coverage statistics).
    - **Cleanup**: Drop temporary tables (e.g., `tmp_customer_tracker` should be `ON COMMIT DROP` if a standard temporary table, or manually dropped if a regular table used as temporary).

## 5. Temporary Table: `tmp_customer_tracker`

This table is central to the planning process. Its schema will include, but not be limited to:

| Column Name                     | Data Type     | Description                                                                    |
|---------------------------------|---------------|--------------------------------------------------------------------------------|
| `customer_id`                   | BIGINT        | Primary Key.                                                                   |
| `latitude`                      | NUMERIC       | Customer's latitude.                                                           |
| `longitude`                     | NUMERIC       | Customer's longitude.                                                          |
| `cluster_name`                  | VARCHAR       | Broader pre-defined area/cluster name.                                         |
| `predicted_order_interval`      | INTEGER       | Predicted days between customer orders.                                        |
| `target_visit_interval_days`    | INTEGER       | Calculated ideal number of days between visits for this customer.              |
| `value_score`                   | NUMERIC       | Score representing the customer's value.                                       |
| `time_urgency_score`            | NUMERIC       | Score representing urgency based on time since last visit vs. target interval. |
| `combined_priority_score`       | NUMERIC       | Overall priority, combining value, urgency, and other factors.                 |
| `last_visit_date_actual`        | DATE          | The date of the last actual (historical) visit before the planning period.     |
| `last_visit_date_planned_current`| DATE         | The date of the last visit *planned within the current execution of this function*. Used for `p_min_revisit_gap_days` checks. |
| `visits_this_month_count`       | INTEGER       | Number of visits scheduled for this customer in the current plan.              |
| `is_due_today`                  | BOOLEAN       | Flag indicating if customer is due for a visit on the current planning day.    |
| `min_coverage_status`           | VARCHAR       | E.g., 'Lagging', 'Met', 'Exceeded'.                                            |
| ... (other relevant customer attributes) | ...          | ...                                                                            |

The name of this temporary table should be dynamic to support concurrent execution or specific tracking, e.g., `tmp_customer_tracker_YYYYMMDD_HHMISS_ProcessID`.

## 6. Exception Handling

-   The function should be wrapped in a transaction block (`BEGIN...COMMIT/ROLLBACK`).
-   If any critical error occurs, the transaction should be rolled back.
-   The system should log the error and clearly mark the plan generation attempt as 'Failed' in a tracking table, possibly with error messages.
-   Consider using `RAISE NOTICE` for verbose logging during development/debugging.
