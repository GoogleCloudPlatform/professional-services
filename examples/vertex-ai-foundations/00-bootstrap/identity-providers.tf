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

# tfdoc:file:description Workload Identity Federation provider definitions.

locals {
  identity_providers = {
    for k, v in var.federated_identity_providers : k => merge(
      v,
      lookup(local.identity_providers_defs, v.issuer, {})
    )
  }
  identity_providers_defs = {
    # https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect
    github = {
      attribute_mapping = {
        "google.subject"             = "assertion.sub"
        "attribute.sub"              = "assertion.sub"
        "attribute.actor"            = "assertion.actor"
        "attribute.repository"       = "assertion.repository"
        "attribute.repository_owner" = "assertion.repository_owner"
        "attribute.ref"              = "assertion.ref"
      }
      issuer_uri       = "https://token.actions.githubusercontent.com"
      principal_tpl    = "principal://iam.googleapis.com/%s/subject/repo:%s:ref:refs/heads/%s"
      principalset_tpl = "principalSet://iam.googleapis.com/%s/attribute.repository/%s"
    }
    # https://docs.gitlab.com/ee/ci/cloud_services/index.html#how-it-works
    gitlab = {
      attribute_mapping = {
        "google.subject"                  = "assertion.sub"
        "attribute.sub"                   = "assertion.sub"
        "attribute.environment"           = "assertion.environment"
        "attribute.environment_protected" = "assertion.environment_protected"
        "attribute.namespace_id"          = "assertion.namespace_id"
        "attribute.namespace_path"        = "assertion.namespace_path"
        "attribute.pipeline_id"           = "assertion.pipeline_id"
        "attribute.pipeline_source"       = "assertion.pipeline_source"
        "attribute.project_id"            = "assertion.project_id"
        "attribute.project_path"          = "assertion.project_path"
        "attribute.repository"            = "assertion.project_path"
        "attribute.ref"                   = "assertion.ref"
        "attribute.ref_protected"         = "assertion.ref_protected"
        "attribute.ref_type"              = "assertion.ref_type"
      }
      allowed_audiences = ["https://gitlab.com"]
      issuer_uri        = "https://gitlab.com"
      principal_tpl     = "principalSet://iam.googleapis.com/%s/attribute.sub/project_path:%s:ref_type:branch:ref:%s"
      principalset_tpl  = "principalSet://iam.googleapis.com/%s/attribute.repository/%s"
    }
  }
}

resource "google_iam_workload_identity_pool" "default" {
  provider                  = google-beta
  count                     = length(local.identity_providers) > 0 ? 1 : 0
  project                   = module.automation-project.project_id
  workload_identity_pool_id = "${var.prefix}-bootstrap"
}

resource "google_iam_workload_identity_pool_provider" "default" {
  provider = google-beta
  for_each = local.identity_providers
  project  = module.automation-project.project_id
  workload_identity_pool_id = (
    google_iam_workload_identity_pool.default.0.workload_identity_pool_id
  )
  workload_identity_pool_provider_id = "${var.prefix}-bootstrap-${each.key}"
  attribute_condition                = each.value.attribute_condition
  attribute_mapping                  = each.value.attribute_mapping
  oidc {
    allowed_audiences = (
      try(each.value.custom_settings.allowed_audiences, null) != null
      ? each.value.custom_settings.allowed_audiences
      : try(each.value.allowed_audiences, null)
    )
    issuer_uri = (
      try(each.value.custom_settings.issuer_uri, null) != null
      ? each.value.custom_settings.issuer_uri
      : try(each.value.issuer_uri, null)
    )
  }
}
