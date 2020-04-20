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
/** Query to clean the categories of the columns - product, subproduct, issue and subissue. */

SELECT 
  complaint_id,
  CASE
    WHEN LOWER(product) LIKE "%card%"
      THEN "Credit card or prepaid card"
    WHEN LOWER(product) LIKE "%payday%"
      THEN "Payday loan, title loan, or personal loan"
    WHEN LOWER(product) LIKE "%money transfers%"
      THEN "Money transfer, virtual currency, or money service"
    WHEN LOWER(product) LIKE "%virtual currency%"
      THEN "Money transfer, virtual currency, or money service"
    ELSE product
    END AS product,

  CASE 
    WHEN subproduct IN 
      (
        SELECT 
          subproduct
        FROM 
          `{source_project_id}.{source_dataset}.{source_table}`
        GROUP BY
          subproduct
        HAVING
          (
            COUNT(issue)/
              (
                SELECT COUNT(*) FROM `{source_project_id}.{source_dataset}.{source_table}`
              )
          )*100 < 1
       )
      THEN "{new_subprod1}"
    WHEN subproduct = "{old_subprod1}"
      THEN "{new_subprod1}"
    WHEN subproduct = "{old_subprod2}"
      THEN "{new_subprod2}"
    ELSE subproduct 
    END AS subproduct,

  CASE 
    WHEN issue IN 
      (
        SELECT
          issue
        FROM 
          `{source_project_id}.{source_dataset}.{source_table}`
        GROUP BY 
          issue
        HAVING 
          (
            COUNT(product)/
              (
                SELECT COUNT(*) FROM `{source_project_id}.{source_dataset}.{source_table}`
              )
          )*100 < 1
       ) 
      THEN "{new_issue1}"
    WHEN issue IN ("{old_issue1}","{old_issue2}") 
      THEN "{new_issue2}"
    ELSE issue 
    END AS issue,

  CASE 
    WHEN subissue IN 
      (
        SELECT 
          subissue
        FROM 
          `{source_project_id}.{source_dataset}.{source_table}`
        GROUP BY 
          subissue
        HAVING 
          (
            COUNT(product)/
              (
                SELECT COUNT(*) FROM `{source_project_id}.{source_dataset}.{source_table}`
              )
          )*100 < 1
       ) 
      THEN "{new_subissue1}"
    WHEN subissue IN ("{old_subissue1}","{old_subissue2}") 
      THEN "{new_subissue2}" 
    WHEN subissue = "{old_subissue3}"
      THEN "{new_subissue3}"
    ELSE subissue 
    END AS subissue

FROM `{source_project_id}.{source_dataset}.{source_table}`;                                                             
