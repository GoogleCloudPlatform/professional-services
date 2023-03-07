
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



/*******************************************
  Create terragrunt Folder under org
 *******************************************/

resource "google_folder" "terragrunt" {
  display_name = "terragrunt_test"
  parent       = var.org_id
}



/*******************************************
  Project creation
 *******************************************/

resource "random_id" "server" {
  byte_length = 3
}


resource "google_project" "seed_project" {
  name                = "terragrunt-seedproject"
  project_id          = "terragrunt-seedproject-${random_id.server.hex}"
  folder_id           = google_folder.terragrunt.name
  billing_account     = var.billing_account
  auto_create_network = "false"
}

resource "google_storage_bucket" "tf_state_bkt" {
  project                     = google_project.seed_project.project_id
  name                        = "terragrunt-iac-core-bkt-${random_id.server.hex}"
  location                    = var.default_region
  force_destroy               = true
  uniform_bucket_level_access = true
  versioning {
    enabled = true
  }

}

resource "local_file" "root-vars" {
  content = templatefile("root.yaml.tpl", {
    ROOT_PROJECT = google_project.seed_project.project_id
    GCS_BUCKET   = google_storage_bucket.tf_state_bkt.name
    REGION       = var.default_region
  })
  filename = "../root.yaml"
}


/*************************************************
  Create Team1 Folder and populate defaults.yaml 
 ************************************************/
resource "google_folder" "team1" {
  display_name = "team1"
  parent       = google_folder.terragrunt.id
}


resource "local_file" "team1-vars" {
  content = templatefile("defaults.yaml.tpl", {
    FOLDER_ID       = google_folder.team1.id
    ORG_ID          = trim(var.org_id, "organizations/")
    BILLING_ACCOUNT = var.billing_account
  })
  filename = "../data/team1/defaults.yaml"
}

/*************************************************
  Create Team1 Folder and populate defaults.yaml 
 ************************************************/
resource "google_folder" "team2" {
  display_name = "team2"
  parent       = google_folder.terragrunt.id
}

resource "local_file" "team2-vars" {
  content = templatefile("defaults.yaml.tpl", {
    FOLDER_ID       = google_folder.team2.id
    ORG_ID          = trim(var.org_id, "organizations/")
    BILLING_ACCOUNT = var.billing_account
  })
  filename = "../data/team2/defaults.yaml"
}