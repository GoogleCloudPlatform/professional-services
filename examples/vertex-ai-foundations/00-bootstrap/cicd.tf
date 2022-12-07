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

# tfdoc:file:description Workload Identity Federation configurations for CI/CD.

locals {
  cicd_repositories = {
    for k, v in coalesce(var.cicd_repositories, {}) : k => v
    if(
      v != null
      &&
      (
        try(v.type, null) == "sourcerepo"
        ||
        contains(keys(local.identity_providers), coalesce(try(v.identity_provider, null), ":"))
      )
      &&
      fileexists(format("${path.module}/templates/workflow-%s.yaml", try(v.type, "")))
    )
  }
  cicd_workflow_providers = {
    bootstrap = "00-bootstrap-providers.tf"
    cicd      = "00-cicd-providers.tf"
    resman    = "01-resman-providers.tf"
  }
  cicd_workflow_var_files = {
    bootstrap = []
    cicd = [
      "00-bootstrap.auto.tfvars.json",
      "globals.auto.tfvars.json"
    ]
    resman = [
      "00-bootstrap.auto.tfvars.json",
      "globals.auto.tfvars.json"
    ]
  }
}

# source repository

module "automation-tf-cicd-repo" {
  source = "../modules/source-repository"
  for_each = {
    for k, v in local.cicd_repositories : k => v if v.type == "sourcerepo"
  }
  project_id = module.automation-project.project_id
  name       = each.value.name
  iam = {
    "roles/source.admin" = [
      each.key == "bootstrap"
      ? module.automation-tf-bootstrap-sa.iam_email
      : module.automation-tf-resman-sa.iam_email
    ]
    "roles/source.reader" = [
      module.automation-tf-cicd-sa[each.key].iam_email
    ]
  }
  triggers = {
    "fast-00-${each.key}" = {
      filename        = ".cloudbuild/workflow.yaml"
      included_files  = ["**/*tf", ".cloudbuild/workflow.yaml"]
      service_account = module.automation-tf-cicd-sa[each.key].id
      substitutions   = {}
      template = {
        project_id  = null
        branch_name = each.value.branch
        repo_name   = each.value.name
        tag_name    = null
      }
    }
  }
}

# SAs used by CI/CD workflows to impersonate automation SAs

module "automation-tf-cicd-sa" {
  source       = "../modules/iam-service-account"
  for_each     = local.cicd_repositories
  project_id   = module.automation-project.project_id
  name         = "${each.key}-1"
  display_name = "Terraform CI/CD ${each.key} service account."
  prefix       = local.prefix
  iam = (
    each.value.type == "sourcerepo"
    # used directly from the cloud build trigger for source repos
    ? {}
    # impersonated via workload identity federation for external repos
    : {
      "roles/iam.workloadIdentityUser" = [
        each.value.branch == null
        ? format(
          local.identity_providers_defs[each.value.type].principalset_tpl,
          google_iam_workload_identity_pool.default.0.name,
          each.value.name
        )
        : format(
          local.identity_providers_defs[each.value.type].principal_tpl,
          google_iam_workload_identity_pool.default.0.name,
          each.value.name,
          each.value.branch
        )
      ]
    }
  )
  iam_project_roles = {
    (module.automation-project.project_id) = ["roles/logging.logWriter"]
  }
  iam_storage_roles = {
    (module.automation-tf-output-gcs.name) = ["roles/storage.objectViewer"]
  }
}
