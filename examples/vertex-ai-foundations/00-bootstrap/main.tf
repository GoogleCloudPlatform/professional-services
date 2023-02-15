/**
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

locals {
  gcs_storage_class = (
    length(split("-", var.locations.gcs)) < 2
    ? "MULTI_REGIONAL"
    : "REGIONAL"
  )
  groups = {
    for k, v in var.groups :
    k => "${v}@${var.organization.domain}"
  }
  groups_iam = {
    for k, v in local.groups :
    k => "group:${v}"
  }
  # convenience flags that express where billing account resides
  billing_ext     = var.billing_account.organization_id == null
  billing_org     = var.billing_account.organization_id == var.organization.id
  billing_org_ext = !local.billing_ext && !local.billing_org
  # naming: environment used in most resource names
  prefix = join("-", compact([var.prefix, "prod"]))
}
