#standardSQL
# Copyright 2019 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
WITH
  fixity_dates AS (
  SELECT
    DISTINCT bucket,
    bag,
    fixity_date
  FROM
    `PROJECT_ID.fixity_data.records`
  ORDER BY
    bucket,
    bag,
    fixity_date ASC ),
  ranked_fixity_dates AS (
  SELECT
    ROW_NUMBER() OVER (PARTITION BY bucket, bag ORDER BY fixity_date ASC) AS version,
    bucket,
    bag,
    fixity_date
  FROM
    fixity_dates ),
  fixity_files AS (
  SELECT
    DISTINCT bucket,
    bag,
    file_name
  FROM
    `PROJECT_ID.fixity_data.records` ),
  ranked_fixity_files AS (
  SELECT
    f.*,
    d.version
  FROM
    `PROJECT_ID.fixity_data.records` f
  JOIN
    ranked_fixity_dates d
  ON
    f.fixity_date = d.fixity_date
    AND f.bag = d.bag
    AND f.bucket = d.bucket
  ORDER BY
    bucket,
    bag,
    file_name,
    version ),
  running_manifest AS (
  SELECT
    DISTINCT d.version,
    f.bucket,
    f.bag,
    f.file_name,
    f1.file_size,
    f1.file_updated_date,
    d.fixity_date,
    f1.file_md5sum AS file_md5sum
  FROM
    fixity_files f
  JOIN
    ranked_fixity_dates d
  ON
    f.bag = d.bag
    AND f.bucket = d.bucket
  LEFT JOIN
    ranked_fixity_files f1
  ON
    f.file_name = f1.file_name
    AND d.version = (f1.version)
  ORDER BY
    file_name,
    version DESC ),
  ranked_manifest AS (
  SELECT
    bucket,
    bag,
    file_name,
    file_size,
    file_updated_date,
    fixity_date,
    file_md5sum,
    RANK() OVER (PARTITION BY file_name ORDER BY version DESC) AS rank
  FROM
    running_manifest)
SELECT
  bucket,
  bag,
  file_name,
  file_size,
  file_updated_date,
  fixity_date,
  file_md5sum
FROM
  ranked_manifest
WHERE
  rank = 1
  AND file_md5sum IS NOT NULL;
