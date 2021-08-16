 /*
  -- Copyright 2021 Google Inc. All Rights Reserved.

  -- Licensed under the Apache License, Version 2.0 (the "License");
  -- you may not use this file except in compliance with the License.
  -- You may obtain a copy of the License at

  --   http://www.apache.org/licenses/LICENSE-2.0

  -- Unless required by applicable law or agreed to in writing, software
  -- distributed under the License is distributed on an "AS IS" BASIS,
  -- WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  -- See the License for the specific language governing permissions and
  -- limitations under the License.
*/

/*
Categorize pricing data for dashboard reports.
NOTE:
1. Replace `billing.<PRICING_EXPORT_TABLE>` with correct table name.
2. Use this query to set up a scheduled query.
*/

WITH
  pricing_data as (
    SELECT
      service.description as pricing_service_description,
      sku.id as pricing_sku_id,
      LOWER(sku.description) as pricing_sku_description,
      product_taxonomy as pricing_product_taxonomy,
      product_taxonomy[SAFE_OFFSET(1)] as pricing_category,
      LOWER(
        ARRAY_TO_STRING(product_taxonomy, '->')
      ) as pricing_product_taxonomy_str,
      geo_taxonomy.type as pricing_geo_type,
      geo_taxonomy as pricing_geo_taxonomy,
      LOWER(
        ARRAY_TO_STRING(geo_taxonomy.regions, '->')
      ) as pricing_geo_taxonomy_str
    FROM
      `billing.<PRICING_EXPORT_TABLE>`
    WHERE
      service.description IN (
        'Compute Engine',
        'Cloud Storage',
        'BigQuery',
        'BigQuery Reservation API',
        'BigQuery Storage API'
        -- These are not part of MVP
        --,
        --'BigQuery BI Engine'
        --,
        --'BigQuery Data Transfer Service'
      )
  ),
  unique_pricing_data as (
      SELECT distinct pricing_data.* EXCEPT(pricing_product_taxonomy, pricing_geo_taxonomy) FROM pricing_data
  ),
  -- Categorized pricing data
  categorized_pricing_data AS (
    select
      unique_pricing_data.* EXCEPT(pricing_category, pricing_product_taxonomy_str, pricing_geo_taxonomy_str),
      dashboard.ItemSpec(
        pricing_service_description,
        pricing_category,
        pricing_product_taxonomy_str,
        pricing_sku_description
      ).*
    from unique_pricing_data
  )

select * from categorized_pricing_data
