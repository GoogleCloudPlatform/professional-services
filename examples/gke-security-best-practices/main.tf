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

/*
  What is this?
  An example (opinionated) 
  GKE Cluster -
      this demo includes:
      a. GKE cluster with baseline/benchmark security best practices enabled
      b. A security hardened bastion host/jump-box to access the GKE cluster
*/

//TODO 1. add a sane default Calico network policy to allow outbound traffic
//TODO 2. further harden bastion host security hardening, shielded boot, reduced meta service, etc

//enable some "beta" capabilies
provider google-beta {
  region  = "${var.region}"
  project = "${var.project}"
}

provider google {
  region  = "${var.region}"
  project = "${var.project}"
}
//set the latest gke version
data "google_container_engine_versions" "acme-cluster" {
  zone = "${var.zone}"
}