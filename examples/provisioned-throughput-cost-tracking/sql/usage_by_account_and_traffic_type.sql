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

-- Tokens per account and model, split into reserved capacity (PROVISIONED_THROUGHPUT) and pay-as-you-go
-- (ON_DEMAND, ON_DEMAND_FLEX, ON_DEMAND_PRIORITY). pt_charged_tokens is the Provisioned Throughput burndown,
-- already adjusted for caching and burndown rates. It stays 0 until a Provisioned Throughput order is active.
WITH r AS (
  SELECT
    e.principal.id AS account,
    resource.labels.model_user_id AS model,
    e.traffictype AS traffic_type,
    e.generatecontentdetails.usagemetadata.totaltokencount AS total_tokens,
    IFNULL(SAFE_CAST(JSON_VALUE(TO_JSON(e), '$.provisionedthroughput.ptchargedinputtokencount') AS FLOAT64), 0)
      + IFNULL(SAFE_CAST(JSON_VALUE(TO_JSON(e), '$.provisionedthroughput.ptchargedoutputtokencount') AS FLOAT64), 0)
      AS pt_charged_tokens
  FROM `${PROJECT_ID}.${DATASET}.${USAGE_TABLE}`, UNNEST([jsonpayload_logging_inferenceeventlogentry]) AS e
  WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
    AND severity != 'ERROR'
)
SELECT
  account, model, traffic_type,
  COUNT(*) AS requests,
  CAST(SUM(total_tokens) AS INT64) AS total_tokens,
  CAST(SUM(pt_charged_tokens) AS INT64) AS pt_charged_tokens
FROM r
GROUP BY account, model, traffic_type
ORDER BY account, model, traffic_type;
