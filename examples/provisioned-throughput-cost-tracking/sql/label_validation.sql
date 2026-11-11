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

-- Finds team label keys or values that are not on your allowed list (for example 'Team B' or the key 'Consumer').
-- Labels are not validated when requests are sent, so typos create new values in billing reports.
-- Run with: --parameter='allowed_values:ARRAY<STRING>:["team-a","team-b"]'
SELECT
  l.key AS label_key,
  l.value AS label_value,
  ROUND(SUM(cost), 4) AS cost,
  MIN(DATE(usage_start_time)) AS first_seen
FROM `${BILLING_TABLE}`, UNNEST(labels) AS l
WHERE _PARTITIONTIME >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 35 DAY)
  AND project.id = '${PROJECT_ID}'
  AND sku.description LIKE 'Gemini%'
  AND NOT STARTS_WITH(l.key, 'goog-')
  AND (LOWER(l.key) = 'consumer')
  AND (l.key != 'consumer' OR l.value NOT IN UNNEST(@allowed_values))
GROUP BY label_key, label_value
ORDER BY cost DESC;
