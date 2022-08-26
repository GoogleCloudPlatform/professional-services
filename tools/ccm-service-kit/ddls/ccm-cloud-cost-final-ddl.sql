/* 
 Copyright 2022 Google LLC All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/
-- product_name

CREATE TABLE `projectid.cloud_cost_final.product_name`
(
  product_name_key INT64 NOT NULL,
  product_name STRING
);

-- resource_location

CREATE TABLE `projectid.cloud_cost_final.resource_location`
(
  resource_location_key INT64 NOT NULL,
  resource_location STRING,
  resource_region STRING
);

-- service

CREATE TABLE `projectid.cloud_cost_final.service`
(
  service_key INT64 NOT NULL,
  service_id STRING,
  resource_project STRING
);

-- service_type

CREATE TABLE `projectid.cloud_cost_final.service_type`
(
  service_type_key INT64 NOT NULL,
  service_category STRING,
  service_type STRING
);



-- currency

CREATE TABLE `projectid.cloud_cost_final.currency`
(
  currency_key INT64 NOT NULL,
  currency STRING
);


-- charge_type

CREATE TABLE `projectid.cloud_cost_final.charge_type`
(
  charge_type_key INT64 NOT NULL,
  charge_type STRING
);


-- billing_account

CREATE TABLE `projectid.cloud_cost_final.billing_account`
(
  billing_account_key INT64 NOT NULL,
  billing_account_id STRING
);


-- usage_unit_of_measure

CREATE TABLE `projectid.cloud_cost_final.usage_unit_of_measure`
(
  usage_unit_of_measure_key INT64 NOT NULL,
  usage_unit_of_measure STRING
);

-- charge

CREATE TABLE `projectid.cloud_cost_final.charge`
(
  charge_key INT64 NOT NULL,
  charge_id STRING,
  charge_description STRING
);


-- cloud_provider

CREATE TABLE `projectid.cloud_cost_final.cloud_provider`
(
  cloud_provider_key INT64 NOT NULL,
  cloud_provider STRING
);

-- project

CREATE TABLE `projectid.cloud_cost_final.project` 
( 
  project_key INT64 NOT NULL,
  project_id STRING,
  project_name STRING 
);


-- unified_cloud_billing

CREATE TABLE `projectid.cloud_cost_final.unified_cloud_billing`
(
  row_key INT64 NOT NULL,
  project_key INT64 NOT NULL,
  service_type_key INT64 NOT NULL,
  resource_location_key INT64 NOT NULL,
  product_name_key INT64 NOT NULL,
  usage_unit_of_measure_key INT64 NOT NULL,
  cloud_provider_key INT64 NOT NULL,
  charge_type_key INT64 NOT NULL,
  billing_account_key INT64 NOT NULL,
  service_key INT64 NOT NULL,
  charge_key INT64 NOT NULL,
  currency_key INT64 NOT NULL,
  billing_end_date TIMESTAMP,
  billing_start_date TIMESTAMP,
  usage_start_date TIMESTAMP,
  usage_end_date TIMESTAMP,
  usage_quantity FLOAT64,
  cost FLOAT64,
  upload_date DATE
)
PARTITION BY DATE(_PARTITIONTIME);
