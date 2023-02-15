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

# tfdoc:file:description Organization-level IAM.

locals {
  # organization authoritative IAM bindings, in an easy to edit format before
  # they are combined with var.iam a bit further in locals
  _iam = {
    "roles/browser" = [
      "domain:${var.organization.domain}"
    ]
    "roles/logging.admin" = [
      module.automation-tf-bootstrap-sa.iam_email
    ]
    "roles/owner" = local._iam_bootstrap_user
    "roles/resourcemanager.folderAdmin" = [
      module.automation-tf-resman-sa.iam_email
    ]
    "roles/resourcemanager.organizationAdmin" = concat(
      [module.automation-tf-bootstrap-sa.iam_email],
      local._iam_bootstrap_user
    )
    # the following is useful if roles/browser is not desirable
    # "roles/resourcemanager.organizationViewer" = [
    #   "domain:${var.organization.domain}"
    # ]
    "roles/resourcemanager.projectCreator" = concat(
      [module.automation-tf-bootstrap-sa.iam_email],
      local._iam_bootstrap_user
    )
    "roles/resourcemanager.projectMover" = [
      module.automation-tf-bootstrap-sa.iam_email
    ]
    "roles/resourcemanager.tagAdmin" = [
      module.automation-tf-resman-sa.iam_email
    ]
    "roles/resourcemanager.tagUser" = [
      module.automation-tf-resman-sa.iam_email
    ]
  }
  # organization additive IAM bindings, in an easy to edit format before
  # they are combined with var.iam_additive a bit further in locals
  _iam_additive = merge(
    {
      "roles/accesscontextmanager.policyAdmin" = [
        local.groups_iam.gcp-security-admins
      ]
      "roles/compute.orgFirewallPolicyAdmin" = [
        local.groups_iam.gcp-network-admins
      ]
      "roles/compute.xpnAdmin" = [
        local.groups_iam.gcp-network-admins
      ]
      # use additive to support cross-org roles for billing
      "roles/iam.organizationRoleAdmin" = [
        # uncomment if roles/owner is removed to organization admins
        # local.groups.gcp-organization-admins,
        local.groups_iam.gcp-security-admins,
        module.automation-tf-bootstrap-sa.iam_email
      ]
      "roles/orgpolicy.policyAdmin" = [
        local.groups_iam.gcp-organization-admins,
        local.groups_iam.gcp-security-admins,
        module.automation-tf-resman-sa.iam_email
      ]
    },
    local.billing_org ? {
      "roles/billing.admin" = [
        local.groups_iam.gcp-billing-admins,
        local.groups_iam.gcp-organization-admins,
        module.automation-tf-bootstrap-sa.iam_email,
        module.automation-tf-resman-sa.iam_email
      ],
      "roles/billing.costsManager" = [
        local.groups_iam.gcp-billing-admins,
        local.groups_iam.gcp-organization-admins,
        module.automation-tf-bootstrap-sa.iam_email,
        module.automation-tf-resman-sa.iam_email
      ]
    } : {}
  )
  _iam_bootstrap_user = (
    var.bootstrap_user == null ? [] : ["user:${var.bootstrap_user}"]
  )
  iam = {
    for role in local.iam_roles : role => distinct(concat(
      try(sort(local._iam[role]), []),
      try(sort(var.iam[role]), [])
    ))
  }
  iam_additive = {
    for role in local.iam_roles_additive : role => distinct(concat(
      try(sort(local._iam_additive[role]), []),
      try(sort(var.iam_additive[role]), [])
    ))
  }
  iam_roles = distinct(concat(
    keys(local._iam), keys(var.iam)
  ))
  iam_roles_additive = distinct(concat(
    keys(local._iam_additive), keys(var.iam_additive)
  ))
  log_sink_destinations = merge(
    # use the same dataset for all sinks with `bigquery` as  destination
    { for k, v in var.log_sinks : k => module.log-export-dataset.0 if v.type == "bigquery" },
    # use the same gcs bucket for all sinks with `storage` as destination
    { for k, v in var.log_sinks : k => module.log-export-gcs.0 if v.type == "storage" },
    # use separate pubsub topics and logging buckets for sinks with
    # destination `pubsub` and `logging`
    module.log-export-pubsub,
    module.log-export-logbucket
  )
}

module "organization" {
  source          = "../modules/organization"
  organization_id = "organizations/${var.organization.id}"
  # human (groups) IAM bindings
  group_iam = {
    (local.groups.gcp-organization-admins) = [
      "roles/cloudasset.owner",
      "roles/cloudsupport.admin",
      "roles/compute.osAdminLogin",
      "roles/compute.osLoginExternalUser",
      "roles/owner",
      # granted via additive roles
      # roles/iam.organizationRoleAdmin
      # roles/orgpolicy.policyAdmin
      "roles/resourcemanager.folderAdmin",
      "roles/resourcemanager.organizationAdmin",
      "roles/resourcemanager.projectCreator",
    ],
    (local.groups.gcp-network-admins) = [
      "roles/cloudasset.owner",
      "roles/cloudsupport.techSupportEditor",
    ]
    (local.groups.gcp-security-admins) = [
      "roles/cloudasset.owner",
      "roles/cloudsupport.techSupportEditor",
      "roles/iam.securityReviewer",
      "roles/logging.admin",
      "roles/securitycenter.admin",
    ],
    (local.groups.gcp-support) = [
      "roles/cloudsupport.techSupportEditor",
      "roles/logging.viewer",
      "roles/monitoring.viewer",
    ]
  }
  # machine (service accounts) IAM bindings
  iam = local.iam
  # additive bindings, used for roles co-managed by different stages
  iam_additive = local.iam_additive
  custom_roles = {
    # this is needed for use in additive IAM bindings, to avoid conflicts
    (var.custom_role_names.organization_iam_admin) = [
      "resourcemanager.organizations.get",
      "resourcemanager.organizations.getIamPolicy",
      "resourcemanager.organizations.setIamPolicy"
    ]
    (var.custom_role_names.service_project_network_admin) = [
      "compute.globalOperations.get",
      # compute.networks.updatePeering and compute.networks.get are
      # used by automation service accounts who manage service
      # projects where peering creation might be needed (e.g. GKE). If
      # you remove them your network administrators should create
      # peerings for service projects
      "compute.networks.updatePeering",
      "compute.networks.get",
      "compute.organizations.disableXpnResource",
      "compute.organizations.enableXpnResource",
      "compute.projects.get",
      "compute.subnetworks.getIamPolicy",
      "compute.subnetworks.setIamPolicy",
      "dns.networks.bindPrivateDNSZone",
      "resourcemanager.projects.get",
    ]
  }
  logging_sinks = {
    for name, attrs in var.log_sinks : name => {
      bq_partitioned_table = attrs.type == "bigquery"
      destination          = local.log_sink_destinations[name].id
      exclusions           = {}
      filter               = attrs.filter
      iam                  = true
      include_children     = true
      type                 = attrs.type
    }
  }
}

# assign the custom restricted Organization Admin role to the relevant service
# accounts, with a condition that only enables granting specific roles;
# these roles use additive bindings everywhere to avoid conflicts / permadiffs

resource "google_organization_iam_binding" "org_admin_delegated" {
  org_id  = var.organization.id
  role    = module.organization.custom_role_id[var.custom_role_names.organization_iam_admin]
  members = [module.automation-tf-resman-sa.iam_email]
  condition {
    title       = "automation_sa_delegated_grants"
    description = "Automation service account delegated grants."
    expression = format(
      "api.getAttribute('iam.googleapis.com/modifiedGrantsByRole', []).hasOnly([%s])",
      join(",", formatlist("'%s'", concat(
        [
          "roles/accesscontextmanager.policyAdmin",
          "roles/compute.orgFirewallPolicyAdmin",
          "roles/compute.xpnAdmin",
          "roles/orgpolicy.policyAdmin",
        ],
        local.billing_org ? [
          "roles/billing.admin",
          "roles/billing.costsManager",
          "roles/billing.user",
        ] : []
      )))
    )
  }
  depends_on = [module.organization]
}
