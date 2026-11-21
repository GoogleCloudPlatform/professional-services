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

-- Requests and tokens per calling account for the last 30 days, from the inference request metadata log.
-- Works even when requests carry no labels: the log records the account that made each request.
-- Thinking tokens are billed at the output rate.
WITH r AS (
  SELECT
    e.principal.id AS account,
    e.generatecontentdetails.usagemetadata AS u
  FROM `${PROJECT_ID}.${DATASET}.${USAGE_TABLE}`, UNNEST([jsonpayload_logging_inferenceeventlogentry]) AS e
  WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
    AND severity != 'ERROR'
)
SELECT
  account,
  COUNT(*) AS requests,
  CAST(SUM(u.prompttokencount) AS INT64) AS input_tokens,
  CAST(SUM(u.candidatestokencount) AS INT64) AS output_tokens,
  CAST(SUM(IFNULL(u.thoughtstokencount, 0)) AS INT64) AS thinking_tokens,
  CAST(SUM(u.totaltokencount) AS INT64) AS total_tokens,
  ROUND(100 * SUM(u.totaltokencount) / SUM(SUM(u.totaltokencount)) OVER (), 1) AS share_pct
FROM r
GROUP BY account
ORDER BY total_tokens DESC;
