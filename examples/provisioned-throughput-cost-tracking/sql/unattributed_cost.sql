-- Copyright 2026 Google LLC
--
-- Licensed under the Apache License, Version 2.0 (the "License");
-- you may not use this file except in compliance with the License.
-- You may obtain a copy of the License at
--
--     https://www.apache.org/licenses/LICENSE-2.0
--
-- Unless required by applicable law or agreed to in writing, software
-- distributed under the License is distributed on an "AS IS" BASIS,
-- WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
-- See the License for the specific language governing permissions and
-- limitations under the License.

-- Share of Gemini cost in the shared project that has no team label.
-- Schedule this daily and alert when unlabeled_pct is above your threshold (for example 2%).
SELECT
  DATE(usage_start_time) AS usage_date,
  ROUND(SUM(cost), 4) AS total_cost,
  ROUND(SUM(IF(NOT EXISTS (SELECT 1 FROM UNNEST(labels) WHERE key = 'consumer'), cost, 0)), 4) AS unlabeled_cost,
  ROUND(100 * SAFE_DIVIDE(
    SUM(IF(NOT EXISTS (SELECT 1 FROM UNNEST(labels) WHERE key = 'consumer'), cost, 0)), SUM(cost)), 1) AS unlabeled_pct
FROM `${BILLING_TABLE}`
WHERE _PARTITIONTIME >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 35 DAY)
  AND project.id = '${PROJECT_ID}'
  AND sku.description LIKE 'Gemini%'
GROUP BY usage_date
ORDER BY usage_date DESC;
