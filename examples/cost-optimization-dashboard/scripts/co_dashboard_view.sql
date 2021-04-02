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
-- Cost optimization Dashboard data.
-- Update <PROJECT>.
-- Use this query as a Datastudio 'Custom Query'.
*/

SELECT
  co_pricing_data.* EXCEPT(pricing_sku_id,
    pricing_sku_description),
  --EXTRACT(YEAR from combined_billing_data_view.usage_date) as usage_year,
  --EXTRACT(MONTH from combined_billing_data_view.usage_date) as usage_month,
  co_billing_data.* EXCEPT(sku_id,
    sku_description,
    service_id,
    service_description)
FROM
  `<PROJECT>.dashboard.co_billing_data` as co_billing_data
LEFT JOIN
  `<PROJECT>.dashboard.co_pricing_data` as co_pricing_data
ON
  co_billing_data.sku_id = co_pricing_data.pricing_sku_id
WHERE
  usage_date >= PARSE_DATE('%Y%m%d', @DS_START_DATE)
  AND usage_date <= PARSE_DATE('%Y%m%d', @DS_END_DATE);
