/**
 * Copyright 2023 Google LLC
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
    github_branch = try(local.github.branch, null),
    docker_repo   = module.mlops.github.DOCKER_REPO,
    sa_mlops      = module.mlops.github.SA_MLOPS,
    subnetwork    = module.mlops.github.SUBNETWORK
  })

  gh_containers_yaml = templatefile("${path.module}/../../.github/workflows/containers.yml.TEMPLATE", {
    wip         = module.mlops.github.WORKLOAD_ID_PROVIDER,
    project_id  = module.mlops.github.PROJECT_ID,
    sa          = module.mlops.github.SERVICE_ACCOUNT,
    docker_repo = module.mlops.github.DOCKER_REPO
    environment = var.environment
  })

  gh_main_tfx_yaml = templatefile("${path.module}/../../.github/workflows/main.yml.TEMPLATE", {
    wip         = module.mlops.github.WORKLOAD_ID_PROVIDER,
    project_id  = module.mlops.github.PROJECT_ID,
    sa          = module.mlops.github.SERVICE_ACCOUNT,
    docker_repo = module.mlops.github.DOCKER_REPO,
    environment = var.environment,
    framework   = "tfx"
  })

  gh_main_kfp_yaml = templatefile("${path.module}/../../.github/workflows/main.yml.TEMPLATE", {
    wip         = module.mlops.github.WORKLOAD_ID_PROVIDER,
    project_id  = module.mlops.github.PROJECT_ID,
    sa          = module.mlops.github.SERVICE_ACCOUNT,
    docker_repo = module.mlops.github.DOCKER_REPO,
    environment = var.environment,
    framework   = "kfp"
  })
  
  gh_main_bqml_yaml = templatefile("${path.module}/../../.github/workflows/main.yml.TEMPLATE", {
    wip         = module.mlops.github.WORKLOAD_ID_PROVIDER,
    project_id  = module.mlops.github.PROJECT_ID,
    sa          = module.mlops.github.SERVICE_ACCOUNT,
    docker_repo = module.mlops.github.DOCKER_REPO,
    environment = var.environment,
    framework   = "bqml"
  })

  gh_run_tfx_yaml = templatefile("${path.module}/../../.github/workflows/run.yml.TEMPLATE", {
    wip         = module.mlops.github.WORKLOAD_ID_PROVIDER,
    project_id  = module.mlops.github.PROJECT_ID,
    sa          = module.mlops.github.SERVICE_ACCOUNT,
    docker_repo = module.mlops.github.DOCKER_REPO,
    environment = var.environment,
    framework   = "tfx"
  })

  gh_run_kfp_yaml = templatefile("${path.module}/../../.github/workflows/run.yml.TEMPLATE", {
    wip         = module.mlops.github.WORKLOAD_ID_PROVIDER,
    project_id  = module.mlops.github.PROJECT_ID,
    sa          = module.mlops.github.SERVICE_ACCOUNT,
    docker_repo = module.mlops.github.DOCKER_REPO,
    environment = var.environment,
    framework   = "kfp"
  })

  gh_run_bqml_yaml = templatefile("${path.module}/../../.github/workflows/run.yml.TEMPLATE", {
    wip         = module.mlops.github.WORKLOAD_ID_PROVIDER,
    project_id  = module.mlops.github.PROJECT_ID,
    sa          = module.mlops.github.SERVICE_ACCOUNT,
    docker_repo = module.mlops.github.DOCKER_REPO,
    environment = var.environment,
    framework   = "bqml"
  })


  gh_deploy_yaml = templatefile("${path.module}/../../.github/workflows/deploy.yml.TEMPLATE", {
    wip         = module.mlops.github.WORKLOAD_ID_PROVIDER,
    project_id  = module.mlops.github.PROJECT_ID,
    sa          = module.mlops.github.SERVICE_ACCOUNT,
    docker_repo = module.mlops.github.DOCKER_REPO,
    environment = var.environment
  })

  pipeline_deploy_tfx = templatefile("${path.module}/../../build/pipeline-deployment-tfx.yaml.TEMPLATE", {
    project_id    = module.mlops.github.PROJECT_ID,
    region        = var.region,
    github_org    = try(var.github.organization, null),
    github_repo   = try(var.github.repo, null),
    github_branch = try(local.github.branch, null),
    docker_repo   = module.mlops.github.DOCKER_REPO,
    sa_mlops      = module.mlops.github.SA_MLOPS,
    subnetwork    = module.mlops.github.SUBNETWORK,
    bucket_name   = "${var.prefix}-${var.bucket_name}-${var.environment}"
  })

  pipeline_deploy_kfp = templatefile("${path.module}/../../build/pipeline-deployment-kfp.yaml.TEMPLATE", {
    project_id    = module.mlops.github.PROJECT_ID,
    region        = var.region,
    github_org    = try(var.github.organization, null),
    github_repo   = try(var.github.repo, null),
    github_branch = try(local.github.branch, null),
    docker_repo   = module.mlops.github.DOCKER_REPO,
    sa_mlops      = module.mlops.github.SA_MLOPS,
    dataflow_network = "regions/europe-west4/subnetworks/subnet-europe-west4",
    subnetwork    = module.mlops.github.SUBNETWORK,
    bucket_name   = "${var.prefix}-${var.bucket_name}-${var.environment}"
  })

  pipeline_deploy_bqml = templatefile("${path.module}/../../build/pipeline-deployment-bqml.yaml.TEMPLATE", {
    project_id    = module.mlops.github.PROJECT_ID,
    region        = var.region,
    github_org    = try(var.github.organization, null),
    github_repo   = try(var.github.repo, null),
    github_branch = try(local.github.branch, null),
    docker_repo   = module.mlops.github.DOCKER_REPO,
    sa_mlops      = module.mlops.github.SA_MLOPS,
    dataflow_network = "regions/europe-west4/subnetworks/subnet-europe-west4",
    subnetwork    = module.mlops.github.SUBNETWORK,
    bucket_name   = "${var.prefix}-${var.bucket_name}-${var.environment}"
  })

  pipeline_run_tfx = templatefile("${path.module}/../../build/pipeline-run.yaml.TEMPLATE", {
    project_id    = module.mlops.github.PROJECT_ID,
    region        = var.region,
    github_org    = try(var.github.organization, null),
    github_repo   = try(var.github.repo, null),
    github_branch = try(local.github.branch, null),
    sa_mlops      = module.mlops.github.SA_MLOPS,
    bucket_name   = "${var.prefix}-${var.bucket_name}-${var.environment}",
    pipeline_name = "creditcards-classifier-v02-train-pipeline",
    pipeline_params = "{\"num_epochs\": 7, \"learning_rate\": 0.0015, \"batch_size\": 512, \"steps_per_epoch\": 9, \"hidden_units\": \"256,126\"}"
  })  
  
  pipeline_run_kfp = templatefile("${path.module}/../../build/pipeline-run.yaml.TEMPLATE", {
    project_id    = module.mlops.github.PROJECT_ID,
    region        = var.region,
    github_org    = try(var.github.organization, null),
    github_repo   = try(var.github.repo, null),
    github_branch = try(local.github.branch, null),
    sa_mlops      = module.mlops.github.SA_MLOPS,
    bucket_name   = "${var.prefix}-${var.bucket_name}-${var.environment}",
    pipeline_name = "creditcards-classifier-kfp-train",
    pipeline_params = "{\"bq_table\": \"${module.mlops.github.PROJECT_ID}.${var.dataset_name}.creditcards_ml\", \"xgboost_param_max_depth\": 5, \"xgboost_param_learning_rate\": 0.1, \"xgboost_param_n_estimators\": 20}"
  })
  
  pipeline_run_bqml = templatefile("${path.module}/../../build/pipeline-run.yaml.TEMPLATE", {
    project_id    = module.mlops.github.PROJECT_ID,
    region        = var.region,
    github_org    = try(var.github.organization, null),
    github_repo   = try(var.github.repo, null),
    github_branch = try(local.github.branch, null),
    sa_mlops      = module.mlops.github.SA_MLOPS,
    bucket_name   = "${var.prefix}-${var.bucket_name}-${var.environment}",
    pipeline_name = "creditcards-classifier-bqml-train",
    pipeline_params = "{\"bq_table\": \"${module.mlops.github.PROJECT_ID}.${var.dataset_name}.creditcards_ml\"}"
  })

  model_deployment = templatefile("${path.module}/../../build/model-deployment.yaml.TEMPLATE", {
    project_id    = module.mlops.github.PROJECT_ID,
    region        = var.region,
    github_org    = try(var.github.organization, null),
    github_repo   = try(var.github.repo, null),
    github_branch = try(local.github.branch, null),
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

resource "local_file" "main_tfx_yml" {
  filename = "${path.module}/../../.github/workflows/main-tfx.yml"
  content  = local.gh_main_tfx_yaml
}

resource "local_file" "main_kfp_yml" {
  filename = "${path.module}/../../.github/workflows/main-kfp.yml"
  content  = local.gh_main_kfp_yaml
}

resource "local_file" "main_bqml_yml" {
  filename = "${path.module}/../../.github/workflows/main-bqml.yml"
  content  = local.gh_main_bqml_yaml
}

resource "local_file" "run_tfx_yml" {
  filename = "${path.module}/../../.github/workflows/run-tfx.yml"
  content  = local.gh_run_tfx_yaml
}

resource "local_file" "run_kfp_yml" {
  filename = "${path.module}/../../.github/workflows/run-kfp.yml"
  content  = local.gh_run_kfp_yaml
}

resource "local_file" "run_bqml_yml" {
  filename = "${path.module}/../../.github/workflows/run-bqml.yml"
  content  = local.gh_run_bqml_yaml
}

resource "local_file" "deploy_yml" {
  filename = "${path.module}/../../.github/workflows/deploy.yml"
  content  = local.gh_deploy_yaml
}

resource "local_file" "deployment_tfx_yml" {
  filename = "${path.module}/../../build/${var.environment}/pipeline-deployment-tfx.yaml"
  content  = local.pipeline_deploy_tfx
}

resource "local_file" "deployment_kfp_yml" {
  filename = "${path.module}/../../build/${var.environment}/pipeline-deployment-kfp.yaml"
  content  = local.pipeline_deploy_kfp
}

resource "local_file" "deployment_bqml_yml" {
  filename = "${path.module}/../../build/${var.environment}/pipeline-deployment-bqml.yaml"
  content  = local.pipeline_deploy_kfp
}

resource "local_file" "pipeline_run_tfx_ml" {
  filename = "${path.module}/../../build/${var.environment}/pipeline-run-tfx.yaml"
  content  = local.pipeline_run_tfx
}

resource "local_file" "pipeline_run_kfp_ml" {
  filename = "${path.module}/../../build/${var.environment}/pipeline-run-kfp.yaml"
  content  = local.pipeline_run_kfp
}

resource "local_file" "pipeline_run_bqml_ml" {
  filename = "${path.module}/../../build/${var.environment}/pipeline-run-bqml.yaml"
  content  = local.pipeline_run_kfp
}

resource "local_file" "model_deploy_yml" {
  filename = "${path.module}/../../build/${var.environment}/model-deployment.yaml"
  content  = local.model_deployment
}

output "mlops" {
  description = "Created project, service accounts and associates resources."
  value       = module.mlops
}
