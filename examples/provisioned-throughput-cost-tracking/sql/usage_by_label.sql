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

-- Tokens per team label for the last 30 days, from the inference request metadata log.
-- request_label: the "consumer" label in the request body (also reaches the billing export).
-- header_label: the x-goog-agent-platform-observability-label-team header (log only, never billed).
SELECT
  IFNULL(JSON_VALUE(TO_JSON(t.labels), '$.consumer'), '(none)') AS request_label,
  IFNULL(JSON_VALUE(TO_JSON(e), '$.httpheaders.x_goog_agent_platform_observability_label_team.values[0]'), '(none)')
    AS header_label,
  COUNT(*) AS requests,
  CAST(SUM(e.generatecontentdetails.usagemetadata.totaltokencount) AS INT64) AS total_tokens
FROM `${PROJECT_ID}.${DATASET}.${USAGE_TABLE}` AS t, UNNEST([jsonpayload_logging_inferenceeventlogentry]) AS e
WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
  AND severity != 'ERROR'
GROUP BY request_label, header_label
ORDER BY total_tokens DESC;
