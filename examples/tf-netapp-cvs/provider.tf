# Copyright 2021 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


terraform {
  required_version = "~> 1.1.6"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 3.79.0"
    }
    google-beta = {
      source = "hashicorp/google-beta"
    }
    netapp-gcp = {
      source  = "NetApp/netapp-gcp"
      version = "22.1.0"
    }
  }

  backend "gcs" {
    bucket = "bucket-name" # the bucket which store terraform state goes here
    prefix = "nfs"
  }
}

provider "google" {
  project = var.project_id
  region  = "us-west2"
}

provider "google-beta" {
  project = var.project_id
  region  = "us-west2"
}

provider "netapp-gcp" {
  project     = 1234567890 # project number goes here. BUG: Provider doesn't handle the project name to number convertion
  credentials = base64decode(google_service_account_key.nfs-key.private_key)
}