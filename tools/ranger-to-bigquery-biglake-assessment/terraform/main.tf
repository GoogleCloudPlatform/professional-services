#  Copyright 2023 Google LLC

#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at

#      http://www.apache.org/licenses/LICENSE-2.0

#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.

terraform {
  required_version = ">= 1.0"
  required_providers {

    google = {
      source  = "hashicorp/google"
      version = "~> 4"
    }

    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 4"
    }
  }

}

resource "google_storage_bucket" "ranger_assessment" {
  name                        = "${var.project_id}-ranger-assessment"
  location                    = var.storage_region
  project                     = var.project_id
  force_destroy               = true
  uniform_bucket_level_access = true
}

module "bigquery-ranger-assessment" {
  source                     = "terraform-google-modules/bigquery/google"
  version                    = "~> 5.4"
  dataset_id                 = var.dataset_id
  dataset_name               = var.dataset_id
  description                = "Ranger rules are uploaded to tables for assessment"
  project_id                 = var.project_id
  location                   = var.storage_region
  delete_contents_on_destroy = true

  tables = [
    {
      table_id           = "hive_ranger_policies",
      schema             = file("ranger_schema.json"),
      time_partitioning  = null,
      range_partitioning = null,
      expiration_time    = null,
      clustering         = null,
      labels             = {}
    }
  ]
}

resource "google_bigquery_table" "hive_policies_view" {
  project    = var.project_id
  dataset_id = var.dataset_id
  depends_on = [
    module.bigquery-ranger-assessment
  ]
  table_id = "hive_policies_view"
  view {
    use_legacy_sql = false
    query          = <<-QUERY
    select *, 
    array_length(validitySchedules) > 0 as temporary_policy,
    (array_length(denyPolicyItems) > 0 or isDenyAllElse) as hasDenyPolicy,
    array_length(policyItems) > 0 as hasAllowPolicy,
    array_length(allowExceptions) > 0 as hasAllowExceptions,
    (resources.udf is not null or resources.url is not null) as isNonBQResource,
    (array_length(resources.column.values) > 0 and regexp_contains(ARRAY_TO_STRING(resources.column.values, ','), r'[0-9A-Za-z_]' ) ) as isColumnBased,
    (array_length(resources.table.values) > 0 and regexp_contains(ARRAY_TO_STRING(resources.table.values, ','), r'[0-9A-Za-z_]' ) and regexp_contains(ARRAY_TO_STRING(resources.column.values, ','), r'\*' ) ) as isTableBased,
    (array_length(resources.database.values) > 0 and not regexp_contains(ARRAY_TO_STRING(resources.table.values, ','), r'[0-9A-Za-z_]' ) and not regexp_contains(ARRAY_TO_STRING(resources.column.values, ','), r'[0-9A-Za-z_]' ) ) as isDatabaseBased,
    (resources.column.isExcludes or resources.database.isExcludes or resources.table.isExcludes) as hasExcludes,
    ["Authorization", "Column Masking", "Row Level Filtering"][OFFSET(policyType)] as policyTypeName,
    
    from `${var.project_id}.${var.dataset_id}.hive_ranger_policies`
    QUERY
  }


}

resource "google_bigquery_table" "hive_policy_stats" {
  project    = var.project_id
  dataset_id = var.dataset_id

  depends_on = [
    google_bigquery_table.hive_policies_view
  ]
  table_id = "hive_policy_stats"
  view {
    use_legacy_sql = false
    query          = <<-QUERY
    select
    (select count(1) from `${var.project_id}.${var.dataset_id}.hive_policies_view`) as AllPolicies,
    (select count(1) from `${var.project_id}.${var.dataset_id}.hive_policies_view` where not (
    hasDenyPolicy = true or hasAllowExceptions = true or hasExcludes = true or temporary_policy = true or policyPriority = 1
    )) as ValidPolicies,
    (select count(1) from `${var.project_id}.${var.dataset_id}.hive_policies_view` where 
    hasDenyPolicy = true 
    ) as Deny,
    (select count(1) from `${var.project_id}.${var.dataset_id}.hive_policies_view` where 
    hasAllowExceptions = true 
    ) as AllowExceptions,
    (select count(1) from `${var.project_id}.${var.dataset_id}.hive_policies_view` where 
    temporary_policy = true 
    ) as Temporary,
    (select count(1) from `${var.project_id}.${var.dataset_id}.hive_policies_view` where 
    policyPriority > 0 
    ) as HighPriority,
    (select count(1) from `${var.project_id}.${var.dataset_id}.hive_policies_view` where 
    HasExcludes = true 
    ) as HasExcludes
    QUERY
  }

}
