-- Copyright 2020 Google LLC
--
-- Licensed under the Apache License, Version 2.0 (the "License");
-- you may not use this file except in compliance with the License.
-- You may obtain a copy of the License at
--
--    http://www.apache.org/licenses/LICENSE-2.0
--
-- Unless required by applicable law or agreed to in writing, software
-- distributed under the License is distributed on an "AS IS" BASIS,
-- WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
-- See the License for the specific language governing permissions and
-- limitations under the License.
-- =============================================================================
/**
 * Query to remove nulls in the consumer_complaint_narrative and
 * company_response_to_consumer column.
 *
 * The query reads the table and filters out the rows that do not have null
 * values in the columns - consumer_complaint_narrative and
 * company_response_to_consumer (target).
 */

SELECT 
  *
FROM 
  `{source_project_id}.{source_dataset}.{source_table}`
WHERE 
  `{}` IS NOT NULL
  AND `{}` IS NOT NULL;
