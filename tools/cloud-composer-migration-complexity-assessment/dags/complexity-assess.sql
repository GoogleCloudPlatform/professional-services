/*
# Copyright 2023 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
*/

SELECT 
    dag_id,
    dag_size,
    unique_operators,
    list_of_unique_operators,
    tasks,
    complexity_score,
    CASE
        WHEN complexity_score <= 100 THEN 'Simple'
        WHEN complexity_score > 100 AND complexity_score < 5000 THEN 'Medium'
        ELSE 'Complex'
    END as complexity,
    CASE
        WHEN complexity_score <= 100 THEN 1
        WHEN complexity_score > 100 AND complexity_score < 5000 THEN 2
        ELSE 4
    END as work_hours_estimate
FROM 
(SELECT 
    sd.dag_id, 
    length(data) as dag_size, 
    uo.unique_operators,
    uo.list_of_unique_operators,
    tasks,
    round((tasks * uo.unique_operators) * length(data) / 10000, 2) as complexity_score
FROM serialized_dag sd 
JOIN (
    SELECT 
        dag_id, 
        count(distinct operator, dag_id) AS unique_operators,
        group_concat(distinct operator) as list_of_unique_operators
    FROM task_instance GROUP BY dag_id) uo
    ON sd.dag_id = uo.dag_id
JOIN (
    SELECT 
        dag_id, 
        count(distinct dag_id, task_id) AS tasks 
    FROM task_instance GROUP BY dag_id
    ) t
    ON sd.dag_id = t.dag_id
) c