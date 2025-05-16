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
  # Broad list of permissions intended for denial at the Organization level
  # via the 'top_level_deny' policy. This aims to prevent non-admin principals
  # from performing high-impact actions, even if granted specific roles lower
  # in the hierarchy. Assumes Organization Admins are in the exception list.
  #
  # Permissions use the IAM v2 FQDN format required for Deny Policies.
  # Permissions listed in the 400 error (invalid on Org resource type) have been removed.
  # Always verify against the latest GCP documentation:
  # https://cloud.google.com/iam/docs/deny-permissions-support
  project_admin_perms_deny = [

    # --- Organization & Folder Management ---
    # Prevent non-admins from modifying org/folder structure or top-level access.
    # NOTE: Org/Folder management permissions (create, delete, move, setIamPolicy) were reported as unsupported at the Org level deny attachment point.
    "cloudresourcemanager.googleapis.com/projects.create",      # Prevent non-admins creating new projects bypassing potential controls.
    "cloudresourcemanager.googleapis.com/projects.delete",      # Prevent deletion of projects outside of approved processes.
    "cloudresourcemanager.googleapis.com/projects.move",        # Prevent moving projects between folders/org.
    "cloudresourcemanager.googleapis.com/projects.undelete",    # Prevent undeleting projects outside approved processes.
    "cloudresourcemanager.googleapis.com/projects.update",      # Prevent modifying core project settings like labels/parent.
    "cloudresourcemanager.googleapis.com/projects.updateLiens", # Prevent modifying project liens, which block deletion.
    "cloudresourcemanager.googleapis.com/projects.setIamPolicy",# Prevent non-admins setting IAM policies directly on projects from org level.

    # --- Billing Management ---
    # Prevent non-admins managing billing accounts or linking projects improperly.
    # NOTE: Billing account management permissions (update, close, setIamPolicy) were reported as unsupported at the Org level deny attachment point.
    # Note: billing assignment permissions were already removed as they exist in billing.json

    # --- IAM & Identity Management (Organization Level) ---
    # Prevent non-admins creating/modifying org-level roles, keys, or federation.
    "iam.googleapis.com/roles.create",                          # Prevent creating custom IAM roles at the org level.
    "iam.googleapis.com/roles.delete",                          # Prevent deleting org-level custom IAM roles.
    "iam.googleapis.com/roles.undelete",                        # Prevent undeleting org-level custom IAM roles.
    "iam.googleapis.com/roles.update",                          # Prevent updating org-level custom IAM roles.
    "iam.googleapis.com/serviceAccountKeys.create",             # Prevent creating service account keys, often long-lived credentials.
    "iam.googleapis.com/serviceAccountKeys.delete",             # Prevent deleting service account keys.
    "iam.googleapis.com/serviceAccounts.getAccessToken",        # Prevent impersonating service accounts to get access tokens.
    "iam.googleapis.com/serviceAccounts.getOpenIdToken",        # Prevent impersonating service accounts to get OIDC tokens.
    "iam.googleapis.com/serviceAccounts.implicitDelegation",    # Prevent implicit delegation chains through service accounts.
    "iam.googleapis.com/serviceAccounts.signBlob",              # Prevent using service accounts to sign arbitrary blobs.
    "iam.googleapis.com/serviceAccounts.signJwt",               # Prevent using service accounts to sign JWTs.
    "iam.googleapis.com/serviceAccounts.setIamPolicy",          # Prevent changing permissions on service accounts themselves (if defined at org level).
    "iam.googleapis.com/workloadIdentityPools.create",          # Prevent creating new Workload Identity Pools for federation.
    "iam.googleapis.com/workloadIdentityPools.delete",          # Prevent deleting Workload Identity Pools.
    "iam.googleapis.com/workloadIdentityPools.update",          # Prevent modifying Workload Identity Pools.
    "iam.googleapis.com/workloadIdentityPoolProviders.delete",  # Prevent deleting Workload Identity Providers.
    "iam.googleapis.com/workloadIdentityPoolProviders.undelete",# Prevent undeleting Workload Identity Providers.
    "iam.googleapis.com/workloadIdentityPoolProviders.update",  # Prevent modifying Workload Identity Providers.

    # --- Organization-Level Networking ---
    # Prevent non-admins modifying core/shared network infrastructure.
    # NOTE: Network Firewall Policy permissions were reported as unsupported at the Org level deny attachment point.
    # Note: Many compute networking permissions were already removed as they exist in networking.json
    "compute.googleapis.com/organizations.setSecurityPolicy",   # Prevent changing org-level security policies (e.g., Cloud Armor).
    "dns.googleapis.com/managedZones.create",                   # Prevent creating new managed DNS zones if centrally managed.
    "dns.googleapis.com/managedZones.delete",                   # Prevent deleting managed DNS zones.
    "dns.googleapis.com/managedZones.update",                   # Prevent updating managed DNS zones.

    # --- Organization-Level Security & Policy ---
    # Prevent non-admins tampering with security posture or Org Policies.
    # NOTE: accesscontextmanager & securitycenter org settings permissions reported as unsupported at the Org level deny attachment point.
    # Note: Some SCC permissions were already removed as they exist in securitycenter.json
    "orgpolicy.googleapis.com/policy.set",                      # Critical: Prevent changing Organization Policies.
    "secretmanager.googleapis.com/secrets.setIamPolicy",        # Prevent changing access to secrets (if managed centrally).
    "secretmanager.googleapis.com/secrets.delete",              # Prevent deleting secrets (if managed centrally).

    # --- Service & API Management ---
    # Prevent non-admins enabling/disabling services org-wide or creating org-level keys.
    "serviceusage.googleapis.com/services.enable",              # Prevent enabling APIs/services outside of controlled processes.
    "serviceusage.googleapis.com/services.disable",             # Prevent disabling critical APIs/services.
    "apikeys.googleapis.com/keys.create",                       # Prevent creating potentially unrestricted API keys.
    "apikeys.googleapis.com/keys.delete",                       # Prevent deleting API keys.
    "apikeys.googleapis.com/apiKeys.regenerate",                # Prevent regenerating (changing) API keys.
    "apikeys.googleapis.com/apiKeys.revert",                    # Prevent reverting API key changes.
    "apikeys.googleapis.com/keys.update",                       # Prevent updating API key settings.

    # --- Storage (Org-Level Concerns) ---
    # Prevent creating long-lived storage credentials.
    "storage.googleapis.com/hmacKeys.create",                   # Prevent creating HMAC keys, often used for long-term access.
    "storage.googleapis.com/hmacKeys.delete",
    "storage.googleapis.com/hmacKeys.get",
    "storage.googleapis.com/hmacKeys.list",
    "storage.googleapis.com/hmacKeys.update",

    # --- Client OAuth2 clients --- (Original Entry - Retained)
    # Prevent non-admins from creating/managing OAuth clients which could be used for phishing or abuse.
    # Note: Verify these specific permissions against the latest Deny documentation if critical.
    "clientauthconfig.googleapis.com/brands.create",
    "clientauthconfig.googleapis.com/brands.delete",
    "clientauthconfig.googleapis.com/brands.update",
    "clientauthconfig.googleapis.com/clients.create",
    "clientauthconfig.googleapis.com/clients.createSecret",
    "clientauthconfig.googleapis.com/clients.delete",
    "clientauthconfig.googleapis.com/clients.getWithSecret",
    "clientauthconfig.googleapis.com/clients.listWithSecrets",
    "clientauthconfig.googleapis.com/clients.undelete",
    "clientauthconfig.googleapis.com/clients.update",

     # --- Remaining Compute Permissions (Not in networking.json) ---
     # These relate to VPN Gateways not covered in the specific networking profile removal.
     "compute.googleapis.com/vpnGateways.create",
     "compute.googleapis.com/vpnGateways.delete",
     "compute.googleapis.com/vpnGateways.setLabels",
     "compute.googleapis.com/vpnGateways.use",

    # --- Remaining Subnetwork Permission (Not in networking.json) ---
    "compute.googleapis.com/subnetworks.getIamPolicy",          # Prevent viewing subnetwork IAM policies directly (defense in depth).

  ] # End of project_admin_perms_deny
}   # End of locals