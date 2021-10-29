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

-- This model is an example of a table that use incremental, merge strategy
-- https://docs.getdbt.com/reference/resource-configs/bigquery-configs#the-merge-strategy


{{ config(
    owner='data_engineer',
    materialized='incremental',
    unique_key='surrogate_key',
    partition_by={
      "field": "last_activity_date",
      "data_type": "date",
      "granularity": "day"
    }
)}}

SELECT 
  EXTRACT(DATE from last_activity_date) as last_activity_date,
  owner_user_id,
  concat(EXTRACT(DATE from last_activity_date),owner_user_id) as surrogate_key,
  count(id) as total_post

FROM 
  {{ ref('stackoverflow_posts') }}

{% if is_incremental() %}
WHERE 
  EXTRACT(DATE from last_activity_date) = PARSE_DATE('%Y-%m-%d','{{ var("execution_date") }}')
{% endif %}

GROUP BY 
  last_activity_date, 
  owner_user_id,
  surrogate_key
