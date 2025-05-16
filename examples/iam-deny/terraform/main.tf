# Copyright 2025 Google LLC

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     https://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

locals {
  # IAM Deny profile Policies
  billing_policy    = jsondecode(file("./profiles/billing.json"))
  networking_policy = jsondecode(file("./profiles/networking.json"))
  security_policy   = jsondecode(file("./profiles/securitycenter.json"))

  # IAM Deny Exceptions Principals
  networking_exception_principals = var.networking_exception_principals
  billing_exception_principals    = var.billing_exception_principals
  security_exception_principals   = var.sec_exception_principals
  top_exception_principals        = var.top_exception_principals
}

# One Policy to Deny them all
resource "google_iam_deny_policy" "top_level_deny" {
  parent       = urlencode("cloudresourcemanager.googleapis.com/organizations/${var.org_id}") #attach at org level
  name         = "top-iam-deny-policy"
  display_name = "Top level Deny Permissions"
  rules {
    description = "One Rule to Deny them All"
    deny_rule {
      denied_principals = ["principalSet://goog/public:all"]
      denial_condition {
        title      = "Match IAM Deny Tag"
        expression = "resource.matchTagId('tagKeys/*', 'tagValues/*')" #Tag=iam_deny, value=enabled 
      }
      denied_permissions   = local.project_admin_perms_deny
      exception_principals = local.top_exception_principals
    }
  }
}

#Profile specific IAM Deny Policy  
resource "google_iam_deny_policy" "profile-deny-policy" {
  parent       = urlencode("${var.folder_path}${var.folder_id}") #attach at folder level
  name         = "profile-iam-deny-policy"
  display_name = "Profile Specific IAM Deny Policy"
  rules {
    # One Policy to Find them (Security),
    description = "One Rule to Find Them"
    deny_rule {
      denied_principals = ["principalSet://goog/public:all"] # all users and principals
      denial_condition {
        title      = "deny all"
        expression = "!resource.matchTag('*/*', '*')"
      }
      denied_permissions   = local.security_policy.deniedPermissions
      exception_principals = concat(local.top_exception_principals, local.security_exception_principals) #except for those we want 
    }
  }
  rules {
    # One Policy to Bill them all, 
    description = "One Rule to Bill them all"
    deny_rule {
      denied_principals = ["principalSet://goog/public:all"] # all users and principals
      denial_condition {
        title      = "deny all"
        expression = "!resource.matchTag('*/*', '*')"
      }
      denied_permissions   = local.billing_policy.deniedPermissions
      exception_principals = concat(local.top_exception_principals, local.billing_exception_principals) #except for those we want
    }
  }
  rules {
    # ..and in their Networks bind them
    description = "And in Their Networks Bind them"
    deny_rule {
      denied_principals = ["principalSet://goog/public:all"] # all users and principals
      denial_condition {
        title      = "deny all"
        expression = "!resource.matchTag('*/*', '*')"
      }
      denied_permissions   = local.networking_policy.deniedPermissions
      exception_principals = concat(local.top_exception_principals, local.networking_exception_principals) #except for those we want
    }
  }
}

resource "google_org_policy_custom_constraint" "deny_owner" {
  name           = "custom.denyOwner"
  parent         = "organizations/${var.org_id}"
  action_type    = "DENY"
  condition      = "resource.bindings.exists(binding, RoleNameMatches(binding.role, ['roles/owner']))" #limits granting of legacy "owner" role
  method_types   = ["CREATE", "UPDATE"]
  resource_types = ["iam.googleapis.com/AllowPolicy"]
}

resource "google_org_policy_policy" "bool" {

  name   = "organizations/${var.org_id}/policies/${google_org_policy_custom_constraint.deny_owner.name}"
  parent = "organizations/${var.org_id}"

  spec {
    rules {
      enforce = "TRUE"
    }
  }
}

module "gcp_org_policy_v2" {
  source  = "terraform-google-modules/org-policy/google//modules/org_policy_v2"
  version = "~> 5.3.0"

  policy_root         = "folder"                               # either of organization, folder or project
  policy_root_id      = var.folder_id                  # either of org id, folder id or project id
  constraint          = "gcp.restrictServiceUsage" # constraint identifier without constriants/ prefix. Example "compute.requireOsLogin"
  policy_type         = "list"
  inherit_from_parent = "false" # either of list or boolean
  exclude_folders     = []
  exclude_projects    = []

  rules = [
    # Rule 1
    {
      enforcement = true
      allow       = []
      deny = [
        "securitycenter.googleapis.com",
        "accessapproval.googleapis.com",
      ]
      conditions = []
    }
  ]
}