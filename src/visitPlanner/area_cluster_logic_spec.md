# Area/Cluster Scheduling Logic for Visit Planning V2

This document details the refined area/cluster scheduling logic used within the `generate_monthly_visit_plan_v2` SQL function. This logic aims to provide a balance between structured geographic coverage and dynamic, needs-based planning.

## 1. Primary Mechanism: `p_focused_zone_schedule`

-   **Parameter**: `p_focused_zone_schedule` (JSONB)
-   **Purpose**: Allows users to define a preferred weekly cadence for broader geographic zones. These zones typically correspond to `customer.cluster_name` or a similar field representing a manageable sales territory or area.
-   **Format**: A JSON object where keys are days of the week (e.g., "Monday", "Tuesday") and values are the names of the zones/clusters to be focused on that day.
    ```json
    {
      "Monday": "North Quadrant",
      "Tuesday": "East End",
      "Wednesday": "City Center",
      "Thursday": "North Quadrant", // Zones can be repeated
      "Friday": "South Industrial"
      // Saturday and Sunday typically excluded if not working days
    }
    ```
-   **Application**:
    -   On each planning day, the system checks if `p_focused_zone_schedule` contains an entry for the current day of the week.
    -   If a zone is scheduled, it primarily guides the **`SeedCustomerSelection` CTE**. When selecting a seed customer to initiate a mini-cluster, preference is given to eligible customers within this designated zone.
    -   This does *not* mean that *only* customers from this zone will be visited. It's a preference for starting points. Mini-clusters can still span across zone boundaries if customers are geographically close.

## 2. Fallback Strategy (No Scheduled Zone or Insufficient Candidates)

If `p_focused_zone_schedule` is `NULL`, not provided, or has no entry for the current day of the week, or if the designated zone fails to yield enough candidates to meet daily targets, a fallback strategy is employed to select a zone/area of focus.

This strategy aims to select a zone based on a combination of:

### 2.1. Urgency of Customer Needs within Zones
    -   **Metric**: Aggregate unmet needs within each zone. This could be based on:
        -   The number of customers who are `is_due_today = TRUE`.
        -   The sum of `combined_priority_score` for due customers.
        -   The number of customers 'lagging in minimum coverage' (`min_coverage_status = 'Lagging'`).
    -   **Logic**: Zones with higher aggregate urgency are prioritized.

### 2.2. Recency of Zone Focus
    -   **Tracking**: The system needs to maintain (or be able to calculate) a `last_focused_date_in_plan` for each distinct zone/`cluster_name`. This could be stored in a temporary tracking table associated with the current plan generation.
    -   **Logic**: Zones that haven't been the focus recently are given higher priority to ensure rotation and balanced coverage over the month. A zone that was focused yesterday would have lower priority than one focused a week ago or never.

### 2.3. Combining Urgency and Recency
    -   A scoring system can be developed:
        `zone_focus_score = (urgency_metric * weight_urgency) + (days_since_last_focus * weight_recency)`
    -   The zone with the highest `zone_focus_score` is chosen as the fallback focus for the day.

## 3. Guiding Seed Selection

-   Whether determined by `p_focused_zone_schedule` or the fallback strategy, the selected "focus zone" for the day primarily influences the `SeedCustomerSelection` CTE.
-   It acts as a strong preference. If a high-priority customer exists outside the focus zone, they might still be chosen if significantly more critical, but generally, seed customers will be picked from the day's target zone.

## 4. Tracking Zone Coverage

-   **Mechanism**: During and after plan generation, it's useful to track how many visits or what proportion of attention each zone has received.
-   **Metrics**:
    -   Total visits per zone.
    -   Percentage of customers visited in each zone.
    -   Average priority score of visits in each zone.
-   **Purpose**: This data helps evaluate the effectiveness of the scheduling logic and can inform future `p_focused_zone_schedule` inputs or adjustments to the fallback strategy.

## 5. Focus Relaxation for Target Attainment

-   **Principle**: While zone focus (either scheduled or fallback) guides the *initiation* of daily work (seed customers), the primary goal is still to meet the `p_target_daily_visits`.
-   **Logic**:
    -   If, after attempting to build clusters starting from the focused zone, the daily visit target is not met, the zone constraint is relaxed.
    -   The system will then consider any high-priority, due customers from *any* zone to fill the remaining visit slots for the day.
    -   This ensures that daily capacity is utilized effectively even if a particular zone has fewer immediate opportunities on a given day.
    -   The "Handle Under-Target Days (Minimum Coverage Focus)" step in the main algorithm also plays a role here, potentially picking customers from any zone if they are lagging in minimum coverage.

## 6. Balance

The overall approach seeks a balance:
-   **Structured Coverage**: `p_focused_zone_schedule` allows for deliberate, planned rotation through territories.
-   **Dynamic Response**: The fallback mechanism and focus relaxation ensure that pressing needs are addressed and daily targets are met, preventing rigidity from causing missed opportunities or underutilization.
