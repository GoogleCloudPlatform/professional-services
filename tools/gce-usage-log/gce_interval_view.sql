/*
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#standardSQL

WITH
  timestamp_interval_table AS (
  SELECT
    instance_id,
    GENERATE_TIMESTAMP_ARRAY(TIMESTAMP_TRUNC(inserted, _TIME_INTERVAL_UNIT_),
      TIMESTAMP_TRUNC(IFNULL(deleted,
          CURRENT_TIMESTAMP()), _TIME_INTERVAL_UNIT_),
      INTERVAL _TIME_INTERVAL_AMOUNT _TIME_INTERVAL_UNIT_) AS time_interval
  FROM
    `_PROJECT_.gce_usage_log._gce_usage_log`)
SELECT
  timestamp_interval.instance_id,
  time_interval,
  preemptible,
  project_id,
  zone,
  machine_type,
  cores,
  memory_mb,
  pd_standard_size_gb,
  pd_ssd_size_gb,
  tags,
  labels
FROM
  timestamp_interval_table,
  UNNEST(time_interval) AS time_interval
JOIN
  `_PROJECT_.gce_usage_log._gce_usage_log` usage_view
ON
  usage_view.instance_id = timestamp_interval_table.instance_id
WHERE
  time_interval > TIMESTAMP_TRUNC(CURRENT_TIMESTAMP(), MONTH)
ORDER BY time_interval asc