-- Copyright 2021 Google LLC

-- Licensed under the Apache License, Version 2.0 (the "License");
-- you may not use this file except in compliance with the License.
-- You may obtain a copy of the License at

-- https://www.apache.org/licenses/LICENSE-2.0

-- Unless required by applicable law or agreed to in writing, software
-- distributed under the License is distributed on an "AS IS" BASIS,
-- WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
-- See the License for the specific language governing permissions and
-- limitations under the License.

{{ config(
    owner='data_analysts',
    cluster_by = ["id"]
)}}

SELECT 
  EXTRACT(year from last_activity_date) as last_activity_year, 
  EXTRACT(month from last_activity_date) as last_activity_month, 
  owner_user_id, 
  reputation, 
  views, 
  SUM(total_post) as total_post 
FROM 
  {{ ref('fact_posts_daily') }} fact_posts_daily 
  JOIN {{ ref('dim_users') }} dim_users ON fact_posts_daily.owner_user_id = dim_users.id 
GROUP BY 
  last_activity_year, 
  last_activity_month, 
  owner_user_id, 
  reputation, 
  views
