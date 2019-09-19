/* Copyright 2019 Google Inc.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
     http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/
CREATE TEMP FUNCTION
  commitmentSKUToNegationSKU(sku_desc STRING)
  RETURNS STRING AS ( IF(REGEXP_CONTAINS(sku_desc, r"Commitment v[0-9]: [a-zA-Z]+ in [a-zA-Z0-9\\-] for [0-9]+ [_a-zA-Z]+"),
      CONCAT(
        --prefix
        "Reattribution_Negation_CUD_",
        --number
        REGEXP_EXTRACT(sku_desc, r"Commitment v[0-9]: [a-zA-Z]+ in [a-zA-Z0-9\\-] for ([0-9]+) [_a-zA-Z]+"),
        --timeframe
        REGEXP_EXTRACT(sku_desc, r"Commitment v[0-9]: [a-zA-Z]+ in [a-zA-Z0-9\\-] for [0-9]+ ([_a-zA-Z]+)"), "_",
        --UPPER(type)
        UPPER(REGEXP_EXTRACT(sku_desc, r"Commitment v[0-9]: ([a-zA-Z]+) in [a-zA-Z0-9\\-] for [0-9]+ [_a-zA-Z]+")), "_COST_",
        --region
        REGEXP_EXTRACT(sku_desc, r"Commitment v[0-9]: [a-zA-Z]+ in ([a-zA-Z0-9\\-]) for [0-9]+ [_a-zA-Z]+") ),
      NULL));
CREATE TEMP FUNCTION
  regionMapping(gcp_region STRING)
  RETURNS STRING AS (
    CASE
      WHEN gcp_region IS NULL THEN NULL
      WHEN gcp_region LIKE "us-%"
    OR gcp_region LIKE "northamerica%"
    OR gcp_region LIKE "southamerica%" THEN "AMERICAS"
      WHEN gcp_region LIKE "europe-%" THEN "EMEA"
      WHEN gcp_region LIKE "australia-%"
    OR gcp_region LIKE "asia-%" THEN"APAC" END);
(
  WITH
    billing_export_table AS (
        SELECT
         *
        FROM
         `{billing_project_id}.{billing_dataset_id}.{billing_table_name}`
    ),
    billing_id_table AS (
    SELECT
      billing_account_id
    FROM
      billing_export_table
    GROUP BY
      billing_account_id
    LIMIT
      1 ),
    usage_data AS (
    SELECT
      CAST(DATETIME(usage_start_time, "America/Los_Angeles") AS DATE) as usage_date,
      invoice.month AS invoice_month,
      sku.id AS sku_id,
      sku.description AS sku_description,
      -- Only include region if we are looking at data from 9/20/2018 and onwards
      location.region AS region,
      service.id AS service_id,
      service.description AS service_description,
      project.id AS project_id,
      project.name AS project_name,
      labels_1.value AS label_1_value,
      labels_2.value AS label_2_value,
      usage.unit AS unit,
      cost,
      usage.amount AS usage_amount,
      credits,
      cost_type
    FROM
      billing_export_table
    LEFT JOIN
      UNNEST(labels) AS labels_1
    ON
      labels_1.key = "label_1_key"
    LEFT JOIN
      UNNEST(labels) AS labels_2
    ON
      labels_2.key = "label_2_key"
    WHERE
      service.description = "Compute Engine"
      AND (
       FALSE
        OR (LOWER(sku.description) LIKE "%instance%"
          OR LOWER(sku.description) LIKE "% intel %")
        OR LOWER(sku.description) LIKE "%memory optimized core%"
        OR LOWER(sku.description) LIKE "%memory optimized ram%"
        OR LOWER(sku.description) LIKE "%commitment%")
     -- Filter out Sole Tenancy skus that do not represent billable compute instance usage
    AND NOT
    ( FALSE
      -- the VMs that run on sole tenancy nodes are not actually billed. Just the sole tenant node is
      OR LOWER(sku.description) LIKE "%hosted on sole tenancy%"
      -- sole tenancy premium charge is not eligible instance usage
      OR LOWER(sku.description) LIKE "sole tenancy premium%"
    )
    -- Filter to time range when necessary columns (region) were released into Billing BQ Export
    AND CAST(DATETIME(usage_start_time, "America/Los_Angeles") AS DATE) >= "2018-09-20"),
    -- Create temporary table prices, in order to calculate unit price per (date, sku, region) tuple.
    -- Export table only includes the credit dollar amount in the credit.amount field. We can get the credit
    -- usage amount (e.g. core hours) by dividing credit.amount by unit price for that sku.
    -- This assumes that the unit price for the usage is equal to the unit price for the associated
    -- CUD credit. This should be correct, except in rare cases where unit price for that sku changed
    -- during the day (i.e. a price drop, change in spending-based discount %)
    -- It is necessary to do this in a separate table and join back into the main data set vs.
    -- separately on each usage line because some line items have CUD credit but no associated
    -- usage. We would not otherwise be able to calculate a unit price for these line items.
    prices AS (
    SELECT
      usage_date,
      sku_id,
      -- Only include region if we are looking at data from 9/20/2018 and onwards
      region,
      -- calculate unit price per sku for each day. Catch line items with 0 usage to avoid divide by zero.
      -- using 1 assumes that there are no relevant (CUD related) skus with cost but 0 usage,
      -- which is correct for current billing data
      IF(SUM(usage_amount) = 0,
        0,
        SUM(cost) / SUM(usage_amount)) AS unit_price
    FROM
      usage_data,
      UNNEST(credits) AS cred
    WHERE
      cred.name LIKE "%Committed%"
    GROUP BY
      1,
      2,
      3
    ORDER BY
      1,
      2,
      3 ),
    -- sku_metadata temporary table captures information about skus, such as CUD eligibility,
    -- whether the sku is vCPU or RAM, etc.
    -- sku_metadata temporary table captures information about skus, such as CUD eligibility,
    -- whether the sku is vCPU or RAM, etc.
    sku_metadata AS (
    SELECT
      sku_id,
      -- parse sku_description to identify whether usage is CUD eligible, or if the
      -- line item is for a commitment charge
      CASE
        WHEN LOWER(sku_description) LIKE "%commitment%" THEN "CUD Commitment"
        WHEN ( LOWER(sku_description) LIKE "%preemptible%"
        OR LOWER(sku_description) LIKE "%micro%"
        OR LOWER(sku_description) LIKE "%small%"
        OR LOWER(sku_description) LIKE "%extended%" ) THEN "Ineligible Usage"
        WHEN ( (LOWER(sku_description) LIKE "%instance%" OR LOWER(sku_description) LIKE "% intel %") OR LOWER(sku_description) LIKE "%core%" OR LOWER(sku_description) LIKE "%ram%" ) THEN "Eligible Usage"
        ELSE NULL
      END AS usage_type,
      CASE
        WHEN ( LOWER(sku_description) LIKE "%megamem%" OR LOWER(sku_description) LIKE "%ultramem%" OR LOWER(sku_description) LIKE "%memory optimized%" ) THEN "Memory Optimized Usage"
        ELSE "Regular Usage"
      END AS cud_type,
      CASE
        WHEN LOWER(sku_description) LIKE "%americas%" OR LOWER(sku_description) LIKE "%los angeles%"
        OR LOWER(sku_description) LIKE "%sao paulo%" OR LOWER(sku_description) LIKE "%montreal%"
        OR LOWER(sku_description) LIKE "%virginia%" THEN "AMERICAS"
        WHEN LOWER(sku_description) LIKE "%emea%" OR LOWER(sku_description) LIKE "%netherlands%" OR
          LOWER(sku_description) LIKE "%frankfurt%" OR LOWER(sku_description) LIKE "%finland%"
          OR LOWER(sku_description) LIKE "%london%" THEN "EMEA"
        WHEN LOWER(sku_description) LIKE "%apac%" OR LOWER(sku_description) LIKE "%singapore%"
        OR LOWER(sku_description) LIKE "%japan%" OR LOWER(sku_description) LIKE "%hong kong%"
        OR LOWER(sku_description) LIKE "%mumbai%" OR LOWER(sku_description) LIKE "%sydney%" THEN "APAC"
        ELSE NULL
      END AS geo,
      -- for VM skus and commitments, "seconds" unit uniquely identifies vCPU usage
      -- and "byte-seconds" unit uniquely identifies RAM
      CASE
        WHEN LOWER(unit) LIKE "seconds" THEN "vCPU"
        WHEN LOWER(unit) LIKE "byte-seconds" THEN "RAM"
        ELSE NULL
      END AS unit_type,
      CASE
        WHEN LOWER(unit) LIKE "seconds" THEN "Avg. Concurrent vCPU"
        WHEN LOWER(unit) LIKE "byte-seconds" THEN "Avg. Concurrent RAM GB"
        ELSE NULL
      END AS display_unit
    FROM
      usage_data
    GROUP BY
      1,
      2,
      3,
      4,
      5,
      6
    ORDER BY
      1 ASC ),
    -- create temporary usage_credit_data table to separate out credits from usage into their own line items
    -- and associate necessary sku metadata with usage, commitment, and credit line items
    usage_credit_data AS ( (
        -- First usage query pulls out amount and dollar cost of Eligible Usage and Commitment charges
      SELECT
        usage_date,
        service_id,
        service_description,
        region,
        usage_type,
        cud_type,
        unit_type,
        unit,
        project_id,
        project_name,
        label_1_value,
        label_2_value,
        SUM(usage_amount) AS usage_amount,
        SUM(cost) AS cost,
        cost_type
      FROM
        usage_data AS u
      JOIN
        sku_metadata
      ON
        u.sku_id = sku_metadata.sku_id
      WHERE
        usage_type IS NOT NULL
      GROUP BY
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        15)
    UNION ALL (
        -- Second query pulls out CUD and SUD Credit usage and cost. This is done in a separate
        -- SELECT and unioned because if we unnest the repeated field for credit types, we can
        -- no longer correctly sum the usage in the first query.
      SELECT
        usage_date,
        service_id,
        service_description,
        region,
        usage_type,
        cud_type,
        unit_type,
        unit,
        project_id,
        project_name,
        label_1_value,
        label_2_value,
        SUM(usage_amount) AS usage_amount,
        SUM(cost) AS cost,
        cost_type
      FROM (
        SELECT
          u.usage_date,
          service_id,
          service_description,
          u.region,
          CASE
            WHEN LOWER(cred.name) LIKE "%committed%" THEN 'CUD Credit'
            WHEN LOWER(cred.name) LIKE "%sustained%" THEN 'SUD Credit'
            ELSE NULL
          END AS usage_type,
          cud_type,
          unit_type,
          unit,
          project_id,
          project_name,
          label_1_value,
          label_2_value,
          unit_price,
          IF(prices.unit_price IS NOT NULL, IF(prices.unit_price = 0,
            0,
            CASE
            -- Divide by # seconds in a day to get to core*days == avg daily concurrent usage
              WHEN LOWER(unit_type) = "vcpu" THEN -1*SUM(cred.amount)/prices.unit_price / 86400
            -- Divide by # seconds in a day and # bytes in a GB to get to
            -- GB*days == avg daily concurrent RAM GB
              WHEN LOWER(unit_type) = "ram" THEN -1*SUM(cred.amount)/prices.unit_price / (86400 * 1073741824)
              ELSE NULL
            END ), 0) AS usage_amount,
          SUM(cred.amount) AS cost,
          cost_type
        FROM
          usage_data AS u,
          UNNEST(credits) AS cred
        JOIN
          sku_metadata
        ON
          u.sku_id = sku_metadata.sku_id
        LEFT JOIN
          prices
        ON
          TRUE
          AND u.sku_id = prices.sku_id
          AND u.usage_date = prices.usage_date
          AND u.region = prices.region
        WHERE
          LOWER(cred.name) LIKE "%committed%"
          OR LOWER(cred.name) LIKE "%sustained%"
        GROUP BY
          1,
          2,
          3,
          4,
          5,
          6,
          7,
          8,
          9,
          10,
          11,
          12,
          13,
          16)
      GROUP BY
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        15) ),
    -- project_credit_breakout sums usage amount and cost
    -- across the cost organization schema of interest: labels within projects
    project_label_credit_breakout AS (
    SELECT
      usage_date,
      service_id,
      service_description,
      region,
      project_id,
      project_name,
      label_1_value,
      label_2_value,
      cud_type,
      unit_type,
      cost_type,
      SUM(IF(usage_type LIKE "CUD Commitment",
          usage_amount,
          0)) AS commitment_usage_amount,
      SUM(IF(usage_type LIKE "CUD Commitment",
          cost,
          0)) AS commitment_cost,
      SUM(IF(usage_type LIKE "CUD Credit",
          usage_amount,
          0)) AS cud_credit_usage_amount,
      SUM(IF(usage_type LIKE "CUD Credit",
          cost,
          0)) AS cud_credit_cost,
      SUM(IF(usage_type LIKE "SUD Credit",
          usage_amount,
          0)) AS sud_credit_usage_amount,
      SUM(IF(usage_type LIKE "SUD Credit",
          cost,
          0)) AS sud_credit_cost,
      SUM(IF(usage_type LIKE "Eligible Usage",
          usage_amount,
          0)) AS usage_amount,
      SUM(IF(usage_type LIKE "Eligible Usage",
          cost,
          0)) AS cost
    FROM
      usage_credit_data
    GROUP BY
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11),
    -- BA_credit_breakout sums usage amount and cost
    -- across the entire Billing Account within each unique CUD scope <location, unit_type, cud_type>
    -- so that we know what the total cost is that we need to attribute across each project/label
    BA_credit_breakout AS (
    SELECT
      usage_date,
      region,
      cud_type,
      unit_type,
      SUM(usage_amount) AS BA_usage_amount,
      SUM(cost) AS BA_cost,
      SUM(commitment_usage_amount) AS BA_commitment_usage_amount,
      SUM(commitment_cost) AS BA_commitment_cost,
      SUM(cud_credit_usage_amount) AS BA_cud_credit_usage_amount,
      SUM(cud_credit_cost) AS BA_cud_credit_cost,
      SUM(sud_credit_usage_amount) AS BA_sud_credit_usage_amount,
      SUM(sud_credit_cost) AS BA_sud_credit_cost,
      --cost of the commitment that was not consumed by any project. Do not sum across projects.
      IF(SUM(commitment_usage_amount)=0,
        0,
        SUM(cud_credit_usage_amount) / SUM(commitment_usage_amount)) AS BA_CUD_utilization,
      SUM(commitment_usage_amount) - SUM(cud_credit_usage_amount) AS BA_unutilized_commitment_amount,
      IF(SUM(commitment_usage_amount)=0,
        0,
        SUM(cud_credit_usage_amount) / SUM(commitment_usage_amount) * SUM(commitment_cost)) AS BA_utilized_commitment_cost,
      IF(SUM(commitment_usage_amount)=0,
        0,
        SUM(commitment_cost) - (SUM(cud_credit_usage_amount) / SUM(commitment_usage_amount) * SUM(commitment_cost))) AS BA_unutilized_commitment_cost
    FROM
      project_label_credit_breakout
    GROUP BY
      1,
      2,
      3,
      4 ),
    final_data AS (
      -- Final Select statement allocates the Billing Account CUD commitment charge, CUD credits,
      -- and SUD credits from each CUD scope <location, unit_type, cud_type> across each project_label
      -- cost bucket. It does the calculation using two different methods, as described in comments below.
    SELECT
      p.usage_date,
      p.service_id,
      p.cost_type,
      p.service_description,
      p.region,
      p.unit_type,
      p.cud_type,
      p.project_id,
      p.project_name,
      p.label_1_value,
      p.label_2_value,
      BA_commitment_usage_amount,
      BA_commitment_cost,
      BA_cud_credit_usage_amount,
      BA_cud_credit_cost,
      BA_sud_credit_usage_amount,
      BA_sud_credit_cost,
      BA_unutilized_commitment_amount,
      BA_CUD_utilization,
      BA_utilized_commitment_cost,
      BA_unutilized_commitment_cost,
      p.cud_credit_usage_amount AS P_orig_cud_credit_usage_amount,
      p.cud_credit_cost AS P_orig_cud_credit_cost,
      p.sud_credit_usage_amount AS P_orig_sud_credit_usage_amount,
      p.sud_credit_cost AS P_orig_sud_credit_cost,
      IF(BA_usage_amount=0,
        0,
        p.usage_amount / BA_usage_amount) AS P_usage_percentage,
      IF(BA_usage_amount=0,
        0,
        (p.usage_amount / BA_usage_amount) * BA_cud_credit_usage_amount) AS P_alloc_cud_credit_usage_amount,
      IF(BA_usage_amount=0,
        0,
        (p.usage_amount / BA_usage_amount) * BA_cud_credit_cost) AS P_alloc_cud_credit_cost,
      IF(BA_usage_amount=0,
        0,
        (p.usage_amount / BA_usage_amount) * BA_sud_credit_usage_amount) AS P_alloc_sud_credit_usage_amount,
      IF(BA_usage_amount=0,
        0,
        (p.usage_amount / BA_usage_amount) * BA_sud_credit_cost) AS P_alloc_sud_credit_cost,
      --Method 1: allocate credits and UTILIZED commitment proportional to usage in project.
      --could leave some CUD commitment charge unallocated if the commitment was not fully consumed
      IF(BA_usage_amount=0,
        0,
        (p.usage_amount / b.BA_usage_amount) * BA_cud_credit_usage_amount) AS P_method_1_commitment_usage_amount,
      IF(BA_usage_amount=0,
        0,
        (p.usage_amount / b.BA_usage_amount) * BA_utilized_commitment_cost) AS P_method_1_commitment_cost,
      --Method 2: allocate credits and commitment proportional to usage in project.
      --all CUD commitment charge is allocated proportionally to projects, regardless of whether it was utilized
      IF(BA_usage_amount=0,
        0,
        (p.usage_amount / b.BA_usage_amount) * BA_commitment_usage_amount) AS P_method_2_commitment_usage_amount,
      IF(BA_usage_amount=0,
        0,
        (p.usage_amount / b.BA_usage_amount) * BA_commitment_cost) AS P_method_2_commitment_cost
    FROM
      project_label_credit_breakout AS p
    JOIN
      BA_credit_breakout AS b
    ON
      TRUE
      AND p.usage_date = b.usage_date
      AND p.region = b.region
      AND p.cud_type = b.cud_type
      AND p.unit_type = b.unit_type
    ORDER BY
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9 ),
    cancelled_cud_costs AS (
    SELECT
      billing_account_id,
      service AS service,
      STRUCT ( commitmentSKUToNegationSKU(sku.description ) AS id,
        commitmentSKUToNegationSKU(sku.description) AS description ) AS sku,
      TIMESTAMP_TRUNC(usage_start_time, DAY) AS usage_start_time,
      TIMESTAMP_ADD(TIMESTAMP_TRUNC(usage_end_time, DAY), INTERVAL ((3600*23)+3599) SECOND) AS usage_end_time,
      project AS project,
      ARRAY<STRUCT<key STRING,
      value STRING>> [("is_corrected_data",
        "1")] AS labels,
      system_labels,
      location AS location,
      export_time,
      -1.0*cost AS cost,
      currency,
      currency_conversion_rate,
      STRUCT( 0.0 AS amount,
        usage.unit AS unit,
        0.0 AS amount_in_pricing_units,
        usage.pricing_unit AS pricing_unit) AS usage,
      ARRAY<STRUCT<name STRING,
      amount FLOAT64>> [] AS credits,
      invoice,
      cost_type
    FROM
      billing_export_table
    WHERE
      service.description = "Compute Engine"
      AND ( LOWER(sku.description) LIKE "%commitment%"
        OR LOWER(sku.description) LIKE "%sustained%" )
      AND cost <> 0 ),
    correct_cud_costs AS (
    SELECT
      b.billing_account_id AS billing_account_id,
      STRUCT ( service_id AS id,
        service_description AS description) AS service,
      STRUCT (CONCAT("Reattribution_Addition_CUD_", IF(LOWER(unit_type) LIKE "ram",
            "RAM_COST",
            "CORE_COST"), "_", regionMapping(region)) AS id,
        CONCAT("Reattribution_Addition_CUD_", IF(LOWER(unit_type) LIKE "ram",
            "RAM_COST",
            "CORE_COST"), "_", regionMapping(region)) AS description) AS sku,
      TIMESTAMP(usage_date) AS usage_start_time,
      TIMESTAMP_ADD(TIMESTAMP(usage_date), INTERVAL ((3600*23)+3599) SECOND) AS usage_end_time,
      STRUCT ( project_id AS id,
        project_name AS name,
        ARRAY<STRUCT<key STRING,
        value STRING>> [] AS labels,
        "" AS ancestry_numbers) AS project,
      ARRAY<STRUCT<key STRING,
      value STRING>> [] AS labels,
      ARRAY<STRUCT<key STRING,
      value STRING>> [] AS system_labels,
      STRUCT ( "" AS location,
        "" AS country,
        region AS region,
        "" AS zone ) AS location,
      CURRENT_TIMESTAMP() AS export_time,
      {allocation_method} AS cost,
      "USD" AS currency,
      1.0 AS currency_conversion_rate,
      STRUCT ( 0.0 AS amount,
        IF(LOWER(unit_type) LIKE "ram", "byte-seconds", "gibibyte hour") AS unit,
        0.0 AS amount_in_pricing_units,
        IF(LOWER(unit_type) LIKE "ram", "seconds", "hour") AS pricing_unit ) AS usage,
      ARRAY<STRUCT<name STRING,
      amount FLOAT64>> [] AS credits,
      STRUCT ( FORMAT_DATE("%Y%m", usage_date) AS month) AS invoice,
      cost_type
    FROM
      final_data,
      billing_id_table AS b
    WHERE
      {allocation_method} <> 0),
    correct_cud_credits AS (
    SELECT
      b.billing_account_id AS billing_account_id,
      STRUCT ( service_id AS id,
        service_description AS description) AS service,
      STRUCT ( CONCAT("Reattribution_Addition_CUD_", IF(LOWER(unit_type) LIKE "ram",
            "RAM",
            "CORE"), "_CREDIT_", regionMapping(region)) AS id,
        CONCAT("Reattribution_Addition_CUD_", IF(LOWER(unit_type) LIKE "ram",
            "RAM",
            "CORE"), "_CREDIT_", regionMapping(region)) AS description) AS sku,
      TIMESTAMP(usage_date) AS usage_start_time,
      TIMESTAMP_ADD(TIMESTAMP(usage_date), INTERVAL ((3600*23)+3599) SECOND) AS usage_end_time,
      STRUCT ( project_id AS id,
        project_name AS name,
        ARRAY<STRUCT<key STRING,
        value STRING>> [] AS labels,
        "" AS ancestry_numbers) AS project,
      ARRAY<STRUCT<key STRING,
      value STRING>> [] AS labels,
      ARRAY<STRUCT<key STRING,
      value STRING>> [] AS system_labels,
      STRUCT ( "" AS location,
        "" AS country,
        region AS region,
        "" AS zone ) AS location,
      CURRENT_TIMESTAMP() AS export_time,
      0.0 AS cost,
      "USD" AS currency,
      1.0 AS currency_conversion_rate,
      STRUCT ( 0.0 AS amount,
        IF(LOWER(unit_type) LIKE "ram", "byte-seconds", "gibibyte hour") AS unit,
        0.0 AS amount_in_pricing_units,
        IF(LOWER(unit_type) LIKE "ram", "seconds", "hour") AS pricing_unit ) AS usage,
      ARRAY<STRUCT<name STRING,
      amount FLOAT64>> [(IF(LOWER(unit_type) LIKE "ram",
          "Committed Usage Discount: RAM",
          "Committed Usage Discount: CPU"),
        P_alloc_cud_credit_cost)] AS credits,
      STRUCT ( FORMAT_DATE("%Y%m", usage_date) AS month) AS invoice,
      cost_type
    FROM
      final_data,
      billing_id_table AS b
    WHERE
      P_alloc_cud_credit_cost <> 0),
    correct_sud_credits AS (
    SELECT
      b.billing_account_id AS billing_account_id,
      STRUCT ( service_id AS id,
        service_description AS description) AS service,
      STRUCT ( "Reattribution_Addition_SUD_CREDIT" AS id,
        "Reattribution_Addition_SUD_CREDIT" AS description) AS sku,
      TIMESTAMP(usage_date) AS usage_start_time,
      TIMESTAMP_ADD(TIMESTAMP(usage_date), INTERVAL ((3600*23)+3599) SECOND) AS usage_end_time,
      STRUCT ( project_id AS id,
        project_name AS name,
        ARRAY<STRUCT<key STRING,
        value STRING>> [] AS labels,
        "" AS ancestry_numbers)
         AS project,
      ARRAY<STRUCT<key STRING,
      value STRING>> [] AS labels,
      ARRAY<STRUCT<key STRING,
      value STRING>> [] AS system_labels,
      STRUCT ( "" AS location,
        "" AS country,
        region AS region,
        "" AS zone ) AS location,
      CURRENT_TIMESTAMP() AS export_time,
      0.0 AS cost,
      "USD" AS currency,
      1.0 AS currency_conversion_rate,
      STRUCT ( 0.0 AS amount,
        IF(LOWER(unit_type) LIKE "ram", "byte-seconds", "gibibyte hour") AS unit,
        0.0 AS amount_in_pricing_units,
        IF(LOWER(unit_type) LIKE "ram", "seconds", "hour") AS pricing_unit ) AS usage,
      ARRAY<STRUCT<name STRING,
      amount FLOAT64>> [("Sustained Usage Discount",
        P_alloc_sud_credit_cost)] AS credits,
      STRUCT ( FORMAT_DATE("%Y%m", usage_date) AS month) AS invoice,
      cost_type
    FROM
      final_data,
      billing_id_table AS b
    WHERE
      P_alloc_sud_credit_cost <> 0),
    cancelled_credits AS (
    SELECT
      billing_account_id,
      service AS service,
      STRUCT ( CONCAT("Reattribution_Negation_", IF(LOWER(cs.name) LIKE "committed usage discount: ram",
            "CUD_RAM_CREDIT",
            IF(LOWER(cs.name) LIKE "committed usage discount: cpu",
              "CUD_CORE_CREDIT",
              IF(LOWER(cs.name) LIKE "sustained usage discount",
                "SUD_CREDIT",
                "ERROR")) )) AS id,
        CONCAT("Reattribution_Negation_", IF(LOWER(cs.name) LIKE "committed usage discount: ram",
            CONCAT("CUD_RAM_CREDIT_", regionMapping(location.region)),
            IF(LOWER(cs.name) LIKE "committed usage discount: cpu",
              CONCAT("CUD_CORE_CREDIT_", regionMapping(location.region)),
              IF(LOWER(cs.name) LIKE "sustained usage discount",
                "SUD_CREDIT",
                "ERROR")) )) AS description ) AS sku,
      TIMESTAMP_TRUNC(usage_start_time, DAY) AS usage_start_time,
      TIMESTAMP_ADD(TIMESTAMP_TRUNC(usage_end_time, DAY), INTERVAL ((3600*23)+3599) SECOND) AS usage_end_time,
      project AS project,
      ARRAY<STRUCT<key STRING,
      value STRING>> [("is_corrected_data",
        "1")] AS labels,
      system_labels,
      location AS location,
      export_time,
      0.0 AS cost,
      currency,
      currency_conversion_rate,
      STRUCT( 0.0 AS amount,
        usage.unit AS unit,
        0.0 AS amount_in_pricing_units,
        usage.pricing_unit AS pricing_unit) AS usage,
      ARRAY<STRUCT<name STRING,
      amount FLOAT64>> [(cs.name,
        -1*cs.amount)] AS credits,
      invoice,
      cost_type
    FROM
      billing_export_table,
      UNNEST(credits) AS cs
    WHERE
      service.description = "Compute Engine"
      AND ( (LOWER(sku.description) LIKE "%instance%"
          OR LOWER(sku.description) LIKE "% intel %")
        OR LOWER(sku.description) LIKE "%memory optimized core%"
        OR LOWER(sku.description) LIKE "%memory optimized ram%"
        OR LOWER(sku.description) LIKE "%commitment%"
        OR LOWER(sku.description) LIKE "%sustained%")
      AND ARRAY_LENGTH(credits) > 0 )
  SELECT
    *
  FROM
    correct_cud_credits
  UNION ALL
  SELECT
    *
  FROM
    correct_sud_credits
  UNION ALL
  SELECT
    *
  FROM
    cancelled_credits
  UNION ALL
  SELECT
    *
  FROM
    correct_cud_costs
  UNION ALL
  SELECT
    *
  FROM
    cancelled_cud_costs
  UNION ALL
  SELECT
    *
  FROM
    billing_export_table
)
