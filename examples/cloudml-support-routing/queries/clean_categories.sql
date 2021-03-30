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
/** Query to clean the categories of the columns - product, subproduct, issue
 * and subissue.
 */

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
                SELECT COUNT(*)
                FROM `{source_project_id}.{source_dataset}.{source_table}`
              )
          )*100 < 1
       )
      THEN "Other"
    WHEN subproduct = "Other (i.e. phone, health club, etc.)"
      THEN "Other"
    WHEN subproduct = "Loan"
      THEN "Other Loan"
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
                SELECT COUNT(*)
                FROM `{source_project_id}.{source_dataset}.{source_table}`
              )
          )*100 < 1
       ) 
      THEN "Other"
    WHEN issue IN ("Dealing with your lender or servicer",
                   "Dealing with my lender or servicer") 
      THEN "Dealing with lender or servicer"
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
                SELECT COUNT(*)
                FROM `{source_project_id}.{source_dataset}.{source_table}`
              )
          )*100 < 1
       ) 
      THEN "Other"
    WHEN subissue IN ("Debt is not yours","Debt is not mine") 
      THEN "Incorrect debt" 
    WHEN subissue = "Account status"
      THEN "Account status incorrect"
    ELSE subissue 
    END AS subissue

FROM
  `{source_project_id}.{source_dataset}.{source_table}`;                            
