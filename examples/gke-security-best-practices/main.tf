# Copyright 2018 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# What is this?
# An example (opinionated) 
# GKE Cluster -
#     this demo includes:
#     a. GKE cluster with baseline/benchmark security best practices enabled
#     b. A security hardened bastion host/jump-box to access the GKE cluster

provider "local" {}

provider google-beta {
  region  = "${var.region}"
  project = "${var.project}"
}

provider google {
  region  = "${var.region}"
  project = "${var.project}"
}

terraform {
  backend "gcs" {
    bucket = "tf-state-bucket-646d86cb4a68"
    prefix = "ws10mvp"
  }
}
