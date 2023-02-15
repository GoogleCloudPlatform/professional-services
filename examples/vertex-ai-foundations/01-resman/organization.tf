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

# tfdoc:file:description Organization policies.


locals {
  all_drs_domains = concat(
    [var.organization.customer_id],
    try(local.policy_configs.allowed_policy_member_domains, [])
  )

  policy_configs = (
    var.organization_policy_configs == null
    ? {}
    : var.organization_policy_configs
  )
}

module "organization" {
  source          = "../modules/organization"
  organization_id = "organizations/${var.organization.id}"
  # IAM additive bindings, granted via the restricted Organization Admin custom
  # role assigned in stage 00; they need to be additive to avoid conflicts
  iam_additive = merge(
    {
      "roles/accesscontextmanager.policyAdmin" = [
        module.branch-security-sa.iam_email
      ]
      "roles/compute.orgFirewallPolicyAdmin" = [
        module.branch-network-sa.iam_email
      ]
      "roles/compute.xpnAdmin" = [
        module.branch-network-sa.iam_email
      ]
    },
    local.billing_org ? {
      "roles/billing.costsManager" = concat(
        local.branch_optional_sa_lists.pf-dev,
        local.branch_optional_sa_lists.pf-prod
      )
      "roles/billing.user" = concat(
        [
          module.branch-network-sa.iam_email,
          module.branch-security-sa.iam_email,
        ],
        local.branch_optional_sa_lists.dp-dev,
        local.branch_optional_sa_lists.dp-prod,
        local.branch_optional_sa_lists.gke-dev,
        local.branch_optional_sa_lists.gke-prod,
        local.branch_optional_sa_lists.pf-dev,
        local.branch_optional_sa_lists.pf-prod,
      )
    } : {}
  )

  # sample subset of useful organization policies, edit to suit requirements
  org_policies = {
    "iam.allowedPolicyMemberDomains" = { allow = { values = local.all_drs_domains } }

    #"gcp.resourceLocations" = {
    #   allow = { values = local.allowed_regions }
    # }
    # "iam.workloadIdentityPoolProviders" = {
    #   allow =  {
    #     values = [
    #       for k, v in coalesce(var.automation.federated_identity_providers, {}) :
    #       v.issuer_uri
    #     ]
    #   }
    # }
  }
  org_policies_data_path = "${var.data_dir}/org-policies"

  tags = {
    (var.tag_names.context) = {
      description = "Resource management context."
      iam         = {}
      values = {
        data       = null
        gke        = null
        networking = null
        sandbox    = null
        security   = null
        teams      = null
        dev        = null
        prod       = null
      }
    }
    (var.tag_names.environment) = {
      description = "Environment definition."
      iam         = {}
      values = {
        development = null
        production  = null
      }
    }
  }
}

# organization policy admin role assigned with a condition on tags

resource "google_organization_iam_member" "org_policy_admin_dp" {
  for_each = !var.fast_features.data_platform ? {} : {
    data-dev  = ["data", "development", module.branch-dp-dev-sa.0.iam_email]
    data-prod = ["data", "production", module.branch-dp-prod-sa.0.iam_email]
  }
  org_id = var.organization.id
  role   = "roles/orgpolicy.policyAdmin"
  member = each.value.2
  condition {
    title       = "org_policy_tag_dp_scoped"
    description = "Org policy tag scoped grant for ${each.value.0}/${each.value.1}."
    expression  = <<-END
    resource.matchTag('${var.organization.id}/${var.tag_names.context}', '${each.value.0}')
    &&
    resource.matchTag('${var.organization.id}/${var.tag_names.environment}', '${each.value.1}')
    END
  }
}

resource "google_organization_iam_member" "org_policy_admin_pf" {
  for_each = !var.fast_features.project_factory ? {} : {
    pf-dev  = ["teams", "development", module.branch-pf-dev-sa.0.iam_email]
    pf-prod = ["teams", "production", module.branch-pf-prod-sa.0.iam_email]
  }
  org_id = var.organization.id
  role   = "roles/orgpolicy.policyAdmin"
  member = each.value.2
  condition {
    title       = "org_policy_tag_pf_scoped"
    description = "Org policy tag scoped grant for ${each.value.0}/${each.value.1}."
    expression  = <<-END
    resource.matchTag('${var.organization.id}/${var.tag_names.context}', '${each.value.0}')
    &&
    resource.matchTag('${var.organization.id}/${var.tag_names.environment}', '${each.value.1}')
    END
  }
}
