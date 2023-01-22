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

# tfdoc:file:description Vertex MLOps

module "mlops" {
  source = "../../../../../cloud-foundation-fabric/blueprints/data-solutions/vertex-mlops"
  #source               = "github.com/GoogleCloudPlatform/cloud-foundation-fabric//blueprints/data-solutions/vertex-mlops?ref=f33456abf4f48d37e37050d1040e5c25986ce07d"
  project_id           = var.project_id
  project_create       = var.project_create
  prefix               = var.prefix
  bucket_name          = var.bucket_name
  dataset_name         = var.dataset_name
  group_iam            = var.group_iam
  identity_pool_claims = var.identity_pool_claims
  labels               = var.labels
  notebooks            = var.notebooks
  sa_mlops_name        = var.sa_mlops_name
}
