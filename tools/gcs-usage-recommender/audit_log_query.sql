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

WITH
  -- Create a temporary table storing deleted buckets, to be used for filtering out later.
  deleted_buckets AS (
  SELECT
    op.bucket_name
  FROM (
    -- Select the most recent operation per bucket and per operation, and the timestmap
    SELECT
      ARRAY_AGG( STRUCT(resource.labels.bucket_name,
          protopayload_auditlog.methodName,
          timestamp)
      ORDER BY
        timestamp DESC
      LIMIT
        1 ) ops
    FROM
      `{AUDIT_LOG_PROJECT_ID}.{AUDIT_LOG_DATASET_ID}.cloudaudit_googleapis_com_activity_*`
    GROUP BY
      resource.labels.bucket_name ),
    UNNEST(ops) AS op
  WHERE
    op.methodName = "storage.buckets.delete"),
  -- Create a temporary table with only read/create operations
  read_created_logs AS (
  SELECT
    resource.labels.bucket_name AS bucket_name,
    resource.labels.project_id AS project_id,
    timestamp
  FROM
    `{AUDIT_LOG_PROJECT_ID}.{AUDIT_LOG_DATASET_ID}.cloudaudit_googleapis_com_data_access_*` data_access
  WHERE
    -- Only include audit logs relating to read/create operations for objects
    protopayload_auditlog.methodName = "storage.objects.get"
    OR protopayload_auditlog.methodName = "storage.objects.create"),
  -- Create a temporary table of all audit logs for GCS objects, but exclude those that have been deleted since.
  non_deleted_buckets_prev_90_days AS (
  SELECT
    data_access_logs.bucket_name AS bucket_name,
    project_id,
    data_access_logs.timestamp,
    TIMESTAMP_DIFF(CURRENT_TIMESTAMP(), data_access_logs.timestamp, DAY) AS days_since_op
  FROM
    read_created_logs data_access_logs
    -- Filter out deleted objects from aggregation statistics
  WHERE NOT EXISTS (
    SELECT bucket_name
    FROM deleted_buckets
    WHERE data_access_logs.bucket_name = deleted_buckets.bucket_name)),
  -- Create a temporary table of historic GCS data, but remove objects that have been deleted since
  non_deleted_buckets_older_than_90_days AS (
  SELECT
    last_read_timestamp,
    days_since_last_read,
    read_count_30_days,
    read_count_90_days,
    historic_data.project_id,
    historic_data.bucket_name,
    export_day,
    recommended_OLM
  FROM
    `{OUTPUT_PROJECT_ID}.{OUTPUT_DATASET_ID}.{OUTPUT_TABLE_NAME}` historic_data
    -- Filter out objects that have been deleted in the last 90 days
  WHERE NOT EXISTS (
    SELECT bucket_name
    FROM deleted_buckets
    WHERE deleted_buckets.bucket_name = historic_data.bucket_name)),
  bucket_level_stats AS (
    -- Get the last accessed time for the object, comparing audit log and historic data
  SELECT
    MAX(timestamp) AS last_read_timestamp,
    TIMESTAMP_DIFF(CURRENT_TIMESTAMP(), MAX(timestamp), DAY) AS days_since_last_read,
    COUNTIF(days_since_op <= 30) AS read_count_30_days,
    COUNTIF(days_since_op <= 90) AS read_count_90_days,
    non_deleted_buckets_prev_90_days.project_id,
    non_deleted_buckets_prev_90_days.bucket_name,
    CURRENT_DATE() AS export_day
  FROM
    non_deleted_buckets_prev_90_days
  GROUP BY
    5,
    6,
    7)
SELECT
  last_read_timestamp,
  days_since_last_read,
  read_count_30_days,
  read_count_90_days,
  project_id,
  bucket_name,
  export_day,
  CASE
    WHEN read_count_30_days > 1 THEN '''"rule": [
  {
    "action": {
      "type": "SetStorageClass",
      "storageClass": "STANDARD"
    },
    "condition": {
      "matchesStorageClass": ["NEARLINE", "COLDLINE"]
    }]'''
    WHEN read_count_30_days <= 1 AND (30 <= days_since_last_read AND days_since_last_read < 365) THEN '''"rule": [
  {
    "action": {
      "type": "SetStorageClass",
      "storageClass": "NEARLINE"
    },
    "condition": {
      "matchesStorageClass": ["MULTI_REGIONAL", "STANDARD", "COLDLINE", "DURABLE_REDUCED_AVAILABILITY"]
    }]'''
  ELSE
  '''"rule": [
  {
    "action": {
      "type": "SetStorageClass",
      "storageClass": "COLDLINE"
    },
    "condition": {
      "matchesStorageClass": ["MULTI_REGIONAL", "STANDARD", "NEARLINE", "DURABLE_REDUCED_AVAILABILITY"]
    }]'''
END
  AS recommended_OLM
FROM
  bucket_level_stats
UNION ALL
  -- Append in objects that haven't been accessed in 90 days and therefore won't be in audit logs, and also weren't recently deleted.
SELECT
  last_read_timestamp,
  -- Update last day read by subtracting out from current day
  IF(days_since_last_read = -1, -1, TIMESTAMP_DIFF(CURRENT_TIMESTAMP(), last_read_timestamp, DAY)) AS days_since_last_read,
  -- Subtract out delta between current date and date when this entry was created
  IF(read_count_30_days = -1, -1, read_count_30_days - DATE_DIFF(CURRENT_DATE(), export_day, DAY)) AS read_count_30_days,
  -- Subtract out delta between current date and date when this entry was created
  IF(read_count_90_days = -1, -1,  read_count_90_days - DATE_DIFF(CURRENT_DATE(), export_day, DAY)) AS read_count_90_days,
  project_id,
  bucket_name,
  export_day,
  recommended_OLM
FROM
  non_deleted_buckets_older_than_90_days
-- Filter out objects that already exist in left side of union
WHERE NOT EXISTS (SELECT bucket_name
                  FROM bucket_level_stats
                  WHERE bucket_level_stats.bucket_name = non_deleted_buckets_older_than_90_days.bucket_name)