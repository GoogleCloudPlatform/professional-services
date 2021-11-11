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
/** Query to combine the cleaned features and the table with nulls removed. */

SELECT 
  CleanFeatures.*,
  NullsRemoved.date_received,
  NullsRemoved.consumer_complaint_narrative,
  NullsRemoved.company_public_response,
  NullsRemoved.company_name,
  NullsRemoved.state,
  NullsRemoved.zip_code,
  NullsRemoved.tags,
  NullsRemoved.consumer_consent_provided,
  NullsRemoved.submitted_via,
  NullsRemoved.date_sent_to_company,
  NullsRemoved.company_response_to_consumer,
  NullsRemoved.timely_response,
  NullsRemoved.consumer_disputed
FROM 
  `{destination_project_id}.{destination_dataset}.{nulls_removed_table}`
  AS NullsRemoved
LEFT JOIN
  `{destination_project_id}.{destination_dataset}.{cleaned_features_table}`
  AS CleanFeatures
  ON NullsRemoved.complaint_id = CleanFeatures.complaint_id;
