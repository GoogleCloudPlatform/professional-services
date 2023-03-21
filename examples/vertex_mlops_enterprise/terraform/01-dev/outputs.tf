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
  mainconfig_yaml = templatefile("${path.module}/../../mainconfig.yaml.TEMPLATE", {
    project_id    = module.mlops.github.PROJECT_ID,
    region        = var.region,
    github_org    = try(var.github.organization, null),
    github_repo   = try(var.github.repo, null),
    github_branch = try(var.github.branch, null),
    docker_repo   = module.mlops.github.DOCKER_REPO,
    sa_mlops      = module.mlops.github.SA_MLOPS,
    subnetwork    = module.mlops.github.SUBNETWORK
  })

  gh_containers_yaml = templatefile("${path.module}/../../.github/workflows/containers.yml.TEMPLATE", {
    wip         = module.mlops.github.WORKLOAD_ID_PROVIDER,
    project_id  = module.mlops.github.PROJECT_ID,
    sa          = module.mlops.github.SERVICE_ACCOUNT,
    docker_repo = module.mlops.github.DOCKER_REPO
  })

  gh_main_yaml = templatefile("${path.module}/../../.github/workflows/main.yml.TEMPLATE", {
    wip         = module.mlops.github.WORKLOAD_ID_PROVIDER,
    project_id  = module.mlops.github.PROJECT_ID,
    sa          = module.mlops.github.SERVICE_ACCOUNT,
    docker_repo = module.mlops.github.DOCKER_REPO
  })

  gh_run_yaml = templatefile("${path.module}/../../.github/workflows/run.yml.TEMPLATE", {
    wip         = module.mlops.github.WORKLOAD_ID_PROVIDER,
    project_id  = module.mlops.github.PROJECT_ID,
    sa          = module.mlops.github.SERVICE_ACCOUNT,
    docker_repo = module.mlops.github.DOCKER_REPO
  })

  gh_deploy_yaml = templatefile("${path.module}/../../.github/workflows/deploy.yml.TEMPLATE", {
    wip         = module.mlops.github.WORKLOAD_ID_PROVIDER,
    project_id  = module.mlops.github.PROJECT_ID,
    sa          = module.mlops.github.SERVICE_ACCOUNT,
    docker_repo = module.mlops.github.DOCKER_REPO
  })

  pipeline_deploy = templatefile("${path.module}/../../build/pipeline-deployment.yaml.TEMPLATE", {
    project_id    = module.mlops.github.PROJECT_ID,
    region        = var.region,
    github_org    = try(var.github.organization, null),
    github_repo   = try(var.github.repo, null),
    github_branch = try(var.github.branch, null),
    docker_repo   = module.mlops.github.DOCKER_REPO,
    sa_mlops      = module.mlops.github.SA_MLOPS,
    subnetwork    = module.mlops.github.SUBNETWORK
  })

  pipeline_run = templatefile("${path.module}/../../build/pipeline-run.yaml.TEMPLATE", {
    project_id    = module.mlops.github.PROJECT_ID,
    region        = var.region,
    github_org    = try(var.github.organization, null),
    github_repo   = try(var.github.repo, null),
    github_branch = try(var.github.branch, null),
    sa_mlops      = module.mlops.github.SA_MLOPS,
  })


  model_deployment = templatefile("${path.module}/../../build/model-deployment.yaml.TEMPLATE", {
    project_id    = module.mlops.github.PROJECT_ID,
    region        = var.region,
    github_org    = try(var.github.organization, null),
    github_repo   = try(var.github.repo, null),
    github_branch = try(var.github.branch, null),
    docker_repo   = module.mlops.github.DOCKER_REPO,
    sa_mlops      = module.mlops.github.SA_MLOPS,
  })
}


resource "local_file" "mainconfig_yml" {
  filename = "${path.module}/../../mainconfig.yaml"
  content  = local.mainconfig_yaml
}


resource "local_file" "containers_yml" {
  filename = "${path.module}/../../.github/workflows/containers.yml"
  content  = local.gh_containers_yaml
}



resource "local_file" "main_yml" {
  filename = "${path.module}/../../.github/workflows/main.yml"
  content  = local.gh_main_yaml
}

resource "local_file" "run_yml" {
  filename = "${path.module}/../../.github/workflows/run.yml"
  content  = local.gh_run_yaml
}

resource "local_file" "deploy_yml" {
  filename = "${path.module}/../../.github/workflows/deploy.yml"
  content  = local.gh_deploy_yaml
}

resource "local_file" "deployment_yml" {
  filename = "${path.module}/../../build/pipeline-deployment.yaml"
  content  = local.pipeline_deploy
}


resource "local_file" "pipeline_run_yml" {
  filename = "${path.module}/../../build/pipeline-run.yaml"
  content  = local.pipeline_run
}

resource "local_file" "model_deploy_yml" {
  filename = "${path.module}/../../build/model-deployment.yaml"
  content  = local.model_deployment
}


output "mlops" {
  description = "Created project, service accounts and associates resources."
  value       = module.mlops
}
