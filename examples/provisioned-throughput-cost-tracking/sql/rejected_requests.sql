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

-- Failed requests per account and reason for the last 30 days (for example 429 when capacity is used up).
-- Failed requests are not billed, but they show which teams are short of capacity.
SELECT
  e.principal.id AS account,
  CAST(SAFE_CAST(JSON_VALUE(TO_JSON(e), '$.error.code') AS FLOAT64) AS INT64) AS grpc_code,
  JSON_VALUE(TO_JSON(e), '$.error.message') AS reason,
  COUNT(*) AS requests
FROM `${PROJECT_ID}.${DATASET}.${USAGE_TABLE}`, UNNEST([jsonpayload_logging_inferenceeventlogentry]) AS e
WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
  AND severity = 'ERROR'
GROUP BY account, grpc_code, reason
ORDER BY requests DESC;
