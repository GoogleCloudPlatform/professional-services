/* Copyright 2018 Google Inc.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.i

*/
WITH 
  new_billing_data AS (
      SELECT
        SUM(slot_days) AS prj_total_slot_days,
        project_id 
      FROM
         `$bq_billing_breakdown_table`
      WHERE
        EXTRACT(MONTH FROM start_day) = EXTRACT(MONTH FROM Date('$extracted_day')) AND EXTRACT(YEAR FROM start_day) = EXTRACT(YEAR FROM Date('$extracted_day')) AND 
        EXTRACT(DAY FROM start_day) = EXTRACT(DAY FROM Date('$extracted_day'))
      GROUP BY 
        project_id 
      ORDER BY 
        prj_total_slot_days DESC
  ),
  total_slots_in_new_billing_data AS
  (
      SELECT 
          SUM(prj_total_slot_days) AS total_slots_days 
      FROM 
        new_billing_data
  ),
 new_billing_data_view AS (
      SELECT 
        project_id ,
        prj_total_slot_days AS usage_amount,
        "slot_days" AS usage_unit,
        (prj_total_slot_days/total_slots_in_new_billing_data.total_slots_days) AS percent_split_by_slots 
      FROM 
        new_billing_data, 
        total_slots_in_new_billing_data
  ),
  service_id_description AS (
    SELECT billing_account_id AS billing_account_id, 
          service.id AS id, 
          service.description AS description FROM `billing-data-2.DailyBillingExport.gcp_billing_export_v1_01EB05_B1778F_D20612` WHERE 
          service.description = 'BigQuery' AND
          sku.description = 'BigQuery Reserved Capacity Fee'
        LIMIT 1 
        ),
  bq_billing_export_data_total_cost AS (
        SELECT 
        sum(cost) AS total_cost
        FROM
         `$bq_billing_table`
        WHERE
        invoice.month =  CONCAT( CAST (EXTRACT(YEAR FROM Date('$extracted_day')) AS STRING), LPAD((CAST( EXTRACT(MONTH FROM Date('$extracted_day')) AS STRING)),2,"0") ) AND
        EXTRACT(MONTH FROM usage_start_time) = EXTRACT(MONTH FROM Date('$extracted_day'))  AND EXTRACT(YEAR FROM usage_start_time) = EXTRACT(YEAR FROM Date('$extracted_day'))  AND 
        EXTRACT(DAY FROM usage_start_time) = EXTRACT(DAY FROM Date('$extracted_day'))  AND
        service.description = '$service_description' AND
        sku.description = '$sku_description'
    )
(SELECT
      (SELECT billing_account_id FROM  service_id_description) AS billing_account_id,
      STRUCT((SELECT id FROM  service_id_description) AS id, (SELECT description FROM  service_id_description) AS description) AS service,
      STRUCT("Madeup_SKU_Cancel_BQ_Reserved_Capacity_Fee" AS id, "Madeup_SKU_Cancel_BQ_Reserved_Capacity_Fee" AS description) AS sku,
      CURRENT_TIMESTAMP() AS usage_start_time,
      CURRENT_TIMESTAMP() AS  usage_end_time,
      CURRENT_TIMESTAMP() AS export_time,
      STRUCT ( "org_id" AS id,  "org_name" AS name,  ARRAY<STRUCT<key STRING, value STRING>> [("is_corrected_data" , "1")] AS labels ) AS project,
      STRUCT( null AS key, null AS value) AS labels,
      STRUCT( null AS key, null AS value) AS system_labels,
      STRUCT( null AS location, null AS country, null AS region, null AS zone) AS location,
      sum(cost) AS cost, 
      "USD" AS currency,
      1.0 AS currency_conversion_rate,
      STRUCT( sum(usage.amount) AS amount,
      "seconds" AS unit,
      sum(usage.amount_in_pricing_units) AS amount_in_pricing_units,
      "month" AS pricing_unit) AS usage,
       STRUCT( null AS name, null AS amount) AS credit,
       STRUCT(CONCAT( CAST (EXTRACT(YEAR FROM Date('$extracted_day')) AS STRING), CAST( EXTRACT(MONTH FROM Date('$extracted_day')) AS STRING))  AS month) AS invoice 
FROM
      `$bq_billing_table` AS bq_export
WHERE
      invoice.month =  CONCAT( CAST (EXTRACT(YEAR FROM Date('$extracted_day')) AS STRING), LPAD((CAST( EXTRACT(MONTH FROM Date('$extracted_day')) AS STRING)),2,"0") ) AND
      EXTRACT(MONTH FROM usage_start_time) = EXTRACT(MONTH FROM Date('$extracted_day'))  AND EXTRACT(YEAR FROM usage_start_time) = EXTRACT(YEAR FROM Date('$extracted_day'))  AND
      EXTRACT(DAY FROM usage_start_time) = EXTRACT(DAY FROM Date('$extracted_day'))  AND
      service.description = '$service_description' AND
      sku.description = '$sku_description' AND billing_account_id=(SELECT billing_account_id FROM  service_id_description)
LIMIT 1)

UNION ALL       
(SELECT 
      (SELECT billing_account_id FROM  service_id_description) AS billing_account_id,
       STRUCT((SELECT id FROM  service_id_description) AS id, (SELECT description FROM  service_id_description) AS description) AS service,
       STRUCT("Madeup_SKU_Correct_BQ_Reserved_Capacity_Fee" AS id, "Madeup_SKU_Allocated_BQ_Reserved_Capacity_Fee" AS description) AS sku,
       CURRENT_TIMESTAMP() AS usage_start_time,
       CURRENT_TIMESTAMP() AS  usage_end_time,
       CURRENT_TIMESTAMP() AS export_time,
       STRUCT ( new_billing_data_view.project_id AS id,  NULL AS name,  ARRAY<STRUCT<key STRING, value STRING>> [("is_corrected_data" , "1")] AS labels ) AS project,
       STRUCT( null AS key, null AS value) AS labels,
       STRUCT( null AS key, null AS value) AS system_labels,
       STRUCT( null AS location, null AS country, null AS region, null AS zone) AS location,
       (new_billing_data_view.percent_split_by_slots * bq_billing_export_data_total_cost.total_cost) AS cost,
       "USD" AS currency,
       1.0 AS currency_conversion_rate,
       STRUCT(new_billing_data_view.usage_amount AS amount,
       new_billing_data_view.usage_unit AS unit,
       0.0 AS amount_in_pricing_units,
       "slot days" AS pricing_unit) AS usage,
       STRUCT( null AS name, null AS amount) AS credit,
       STRUCT(CONCAT( CAST (EXTRACT(YEAR FROM Date('$extracted_day')) AS STRING), CAST( EXTRACT(MONTH FROM Date('$extracted_day')) AS STRING))  AS month) AS invoice
FROM 
    bq_billing_export_data_total_cost,new_billing_data_view 
    )
