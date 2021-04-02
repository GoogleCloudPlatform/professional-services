/*
  -- Copyright 2021 Google Inc. All Rights Reserved.

  -- Licensed under the Apache License, Version 2.0 (the "License");
  -- you may not use this file except in compliance with the License.
  -- You may obtain a copy of the License at

  --   http://www.apache.org/licenses/LICENSE-2.0

  -- Unless required by applicable law or agreed to in writing, software
  -- distributed under the License is distributed on an "AS IS" BASIS,
  -- WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  -- See the License for the specific language governing permissions and
  -- limitations under the License.
*/

/*
Cost optimization Dashboard Recommendations data.
NOTE: Use this for scheduled query job.
*/

WITH
  recommendations_data AS (
  SELECT
    _PARTITIONDATE AS Date,
    location,
    resource,
    cloud_entity_type,
    cloud_entity_id,
    REGEXP_EXTRACT(resource, r'.*googleapis.com/projects/(.*)/(?:regions|zones)/.*') AS project_name,
    description,
    primary_impact.category AS cost_category,
    primary_impact.cost_projection.cost.currency_code AS currency,
    primary_impact.cost_projection.cost.units AS cost,
    state,
    (CASE
        WHEN REGEXP_CONTAINS(recommender, r'google.compute.') THEN 'Compute Engine'
      ELSE
      ''
    END
      ) AS service,
    (CASE
        WHEN REGEXP_CONTAINS(recommender, r'google.compute.disk.') THEN 'Persistent Disk'
      ELSE
      'VM'
    END
      ) AS category,
    recommender AS type,
    recommender_subtype AS sub_type
  FROM
    `recommender.recommendations_export_v2`,
    UNNEST(target_resources) AS resource
  WHERE
    -- Show only the latest recommendations. Use a grace period of 3 days to avoid data export gaps.
    _PARTITIONDATE = DATE_SUB(CURRENT_DATE(), INTERVAL 3 DAY)
    AND cloud_entity_type = 'PROJECT_NUMBER'
    AND state = 'ACTIVE'
    AND recommender IN ( 'google.compute.commitment.UsageCommitmentRecommender',
      'google.compute.disk.IdleResourceRecommender',
      'google.compute.instance.IdleResourceRecommender',
      'google.compute.instance.MachineTypeRecommender' )
    AND primary_impact.cost_projection.cost.units IS NOT NULL )
-- Recommendations data for dashboard.
SELECT
  *
FROM
  recommendations_data
