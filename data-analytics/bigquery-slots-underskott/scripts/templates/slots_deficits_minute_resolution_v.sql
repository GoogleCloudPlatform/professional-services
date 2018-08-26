/*
 Copyright 2017 Google Inc.

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
SELECT
  SAFE_CONVERT_BYTES_TO_STRING(project_id) AS project_id,
  SAFE_CONVERT_BYTES_TO_STRING(job_id) AS job_id,
  DATETIME_TRUNC(DATETIME(time_window),
    MINUTE) AS minute_window,
  MAX(pending_units) as pending_units,
  MAX(active_units) as active_units
FROM
  `${PROJECT_ID}.slots_deficits.slots_deficits`
GROUP BY
  minute_window,
  project_id,
  job_id
