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

# tfdoc:file:description Billing export project and dataset.

locals {
  # used here for convenience, in organization.tf members are explicit
  billing_ext_admins = [
    local.groups_iam.gcp-billing-admins,
    local.groups_iam.gcp-organization-admins,
    module.automation-tf-bootstrap-sa.iam_email,
    module.automation-tf-resman-sa.iam_email
  ]
}

# billing account in same org (IAM is in the organization.tf file)

module "billing-export-project" {
  source          = "../modules/project"
  count           = local.billing_org ? 1 : 0
  billing_account = var.billing_account.id
  name            = "billing-exp-0"
  parent = coalesce(
    var.project_parent_ids.billing, "organizations/${var.organization.id}"
  )
  prefix = local.prefix
  iam = {
    "roles/owner" = [module.automation-tf-bootstrap-sa.iam_email]
  }
  services = [
    # "cloudresourcemanager.googleapis.com",
    # "iam.googleapis.com",
    # "serviceusage.googleapis.com",
    "bigquery.googleapis.com",
    "bigquerydatatransfer.googleapis.com",
    "storage.googleapis.com"
  ]
}

module "billing-export-dataset" {
  source        = "../modules/bigquery-dataset"
  count         = local.billing_org ? 1 : 0
  project_id    = module.billing-export-project.0.project_id
  id            = "billing_export"
  friendly_name = "Billing export."
  location      = var.locations.bq
}

# billing account in a different org

module "billing-organization-ext" {
  source          = "../modules/organization"
  count           = local.billing_org_ext ? 1 : 0
  organization_id = "organizations/${var.billing_account.organization_id}"
  iam_additive = {
    "roles/billing.admin" = local.billing_ext_admins
  }
}


resource "google_organization_iam_binding" "billing_org_ext_admin_delegated" {
  # refer to organization.tf for the explanation of how this binding works
  count  = local.billing_org_ext ? 1 : 0
  org_id = var.billing_account.organization_id
  # if the billing org does not have our custom role, user the predefined one
  # role = "roles/resourcemanager.organizationAdmin"
  role = join("", [
    "organizations/${var.billing_account.organization_id}/",
    "roles/${var.custom_role_names.organization_iam_admin}"
  ])
  members = [module.automation-tf-resman-sa.iam_email]
  condition {
    title       = "automation_sa_delegated_grants"
    description = "Automation service account delegated grants."
    expression = format(
      "api.getAttribute('iam.googleapis.com/modifiedGrantsByRole', []).hasOnly([%s])",
      join(",", formatlist("'%s'", [
        "roles/billing.costsManager",
        "roles/billing.user",
        ]
      ))
    )
  }
  depends_on = [module.billing-organization-ext]
}

# standalone billing account

resource "google_billing_account_iam_member" "billing_ext_admin" {
  for_each = toset(
    local.billing_ext ? local.billing_ext_admins : []
  )
  billing_account_id = var.billing_account.id
  role               = "roles/billing.admin"
  member             = each.key
}

resource "google_billing_account_iam_member" "billing_ext_cost_manager" {
  for_each = toset(
    local.billing_ext ? local.billing_ext_admins : []
  )
  billing_account_id = var.billing_account.id
  role               = "roles/billing.costsManager"
  member             = each.key
}
