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

WITH access_stats_30_days AS (
      SELECT
          protopayload_auditlog.resourceName AS object_path,
          COUNT(timestamp) AS read_count_30_days
      FROM
          `{AUDIT_LOG_PROJECT_ID}.{AUDIT_LOG_DATASET_ID}.cloudaudit_googleapis_com_data_access_*`
      WHERE
          timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
      GROUP BY 1
),
access_stats_90_days AS (
    SELECT
        protopayload_auditlog.resourceName AS object_path,
        COUNT(timestamp) AS read_count_90_days
    FROM
        `{AUDIT_LOG_PROJECT_ID}.{AUDIT_LOG_DATASET_ID}.cloudaudit_googleapis_com_data_access_*`
    WHERE
        timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 90 DAY)
  GROUP BY 1
),
last_access_time AS (
    SELECT
        MAX(timestamp) AS last_read_timestamp,
        protopayload_auditlog.resourceName AS object_path
    FROM
        `{AUDIT_LOG_PROJECT_ID}.{AUDIT_LOG_DATASET_ID}.cloudaudit_googleapis_com_data_access_*`
    GROUP BY 2
)

SELECT
    last_read_timestamp,
    TIMESTAMP_DIFF(CURRENT_TIMESTAMP(), last_read_timestamp, DAY) AS days_since_last_read,
    access_stats_30_days.read_count_30_days,
    access_stats_90_days.read_count_90_days,
    last_access_time.object_path
FROM
    last_access_time
JOIN
    access_stats_30_days
ON
    access_stats_30_days.object_path = last_access_time.object_path
JOIN
    access_stats_90_days
ON
    access_stats_90_days.object_path = last_access_time.object_path
ORDER BY
    3 DESC
