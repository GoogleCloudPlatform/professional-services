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
/** Query to create the training features table and the manual train-validation
 * split.
 */

WITH
  ResponseTypes AS (
    SELECT
      company_response_to_consumer
    FROM  
      `{destination_project_id}.{destination_dataset}.{clean_table}`
    GROUP BY 
      company_response_to_consumer
    HAVING 
      COUNT(*) >= 1 / {test_threshold}
  ),
  Training AS (
    SELECT
      TrainingFeatures.*
    FROM `{destination_project_id}.{destination_dataset}.{clean_table}`
      AS TrainingFeatures
    JOIN `{destination_project_id}.{destination_dataset}.{train_predict_split}`
      AS Split
      ON TrainingFeatures.complaint_id = Split.complaint_id
    WHERE Split.splitting = 'TRAIN'
  )

SELECT
  Training.*,
  CASE
    WHEN
      (
        1.0 * ROW_NUMBER() OVER (
          PARTITION BY Training.company_response_to_consumer ORDER BY rand()
        )
      ) / COUNT(*) OVER (
        PARTITION BY Training.company_response_to_consumer
      ) < {test_threshold}
      THEN 'TEST'
    ELSE 'UNASSIGNED'
    END AS splitting
FROM Training
JOIN ResponseTypes
  ON Training.company_response_to_consumer = ResponseTypes.company_response_to_consumer
WHERE Training.company_response_to_consumer IN (
  'Untimely response',
  'Closed',
  'Closed with monetary relief',
  'Closed with non-monetary relief',
  'Closed with explanation'
);
