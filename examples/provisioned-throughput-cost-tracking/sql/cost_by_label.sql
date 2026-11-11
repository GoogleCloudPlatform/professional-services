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

-- Gemini cost per team label from the Cloud Billing detailed export.
-- Requests sent without the label appear as '(no label)'. Label values are kept exactly as sent.
-- Note: for Gemini usage lines, usage.unit can read "requests" while usage.amount is the token count.
SELECT
  IFNULL((SELECT value FROM UNNEST(labels) WHERE key = 'consumer'), '(no label)') AS team,
  sku.description AS sku,
  SUM(usage.amount) AS usage_amount,
  ROUND(SUM(cost), 4) AS cost,
  ANY_VALUE(currency) AS currency
FROM `${BILLING_TABLE}`
WHERE _PARTITIONTIME >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 35 DAY)
  AND project.id = '${PROJECT_ID}'
  AND sku.description LIKE 'Gemini%'
GROUP BY team, sku
ORDER BY team, sku;
