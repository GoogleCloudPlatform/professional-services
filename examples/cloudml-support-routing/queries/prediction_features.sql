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
/** Query to create the prediction features table.*/

SELECT
  PredictionFeatures.complaint_id,
  PredictionFeatures.product,
  PredictionFeatures.subproduct,
  PredictionFeatures.issue,
  PredictionFeatures.subissue,
  PredictionFeatures.date_received,
  PredictionFeatures.consumer_complaint_narrative,
  PredictionFeatures.company_public_response,
  PredictionFeatures.company_name,
  PredictionFeatures.state,
  PredictionFeatures.zip_code,
  PredictionFeatures.tags,
  PredictionFeatures.consumer_consent_provided,
  PredictionFeatures.submitted_via,
  PredictionFeatures.date_sent_to_company,
  PredictionFeatures.timely_response,
  PredictionFeatures.consumer_disputed
FROM `{destination_project_id}.{destination_dataset}.{clean_table}`
  AS PredictionFeatures
JOIN `{destination_project_id}.{destination_dataset}.{train_predict_split}` Split
  ON PredictionFeatures.complaint_id = Split.complaint_id
WHERE Split.splitting = 'PREDICT';
