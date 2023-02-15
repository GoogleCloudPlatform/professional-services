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
  folders_l1_map = { for item in data.google_folders.folders_l1.folders : item.name => item }

  folders_l2_map = merge([
    for _, v in data.google_folders.folders_l2 :
    { for item in v.folders : item.name => item }
  ]...)

  folders_l3_map = merge([
    for _, v in data.google_folders.folders_l3 :
    { for item in v.folders : item.name => item }
  ]...)

  folders_l4_map = merge([
    for _, v in data.google_folders.folders_l4 :
    { for item in v.folders : item.name => item }
  ]...)

  folders_l5_map = merge([
    for _, v in data.google_folders.folders_l5 :
    { for item in v.folders : item.name => item }
  ]...)

  folders_l6_map = merge([
    for _, v in data.google_folders.folders_l6 :
    { for item in v.folders : item.name => item }
  ]...)

  folders_l7_map = merge([
    for _, v in data.google_folders.folders_l7 :
    { for item in v.folders : item.name => item }
  ]...)

  folders_l8_map = merge([
    for _, v in data.google_folders.folders_l8 :
    { for item in v.folders : item.name => item }
  ]...)

  folders_l9_map = merge([
    for _, v in data.google_folders.folders_l9 :
    { for item in v.folders : item.name => item }
  ]...)

  folders_l10_map = merge([
    for _, v in data.google_folders.folders_l10 :
    { for item in v.folders : item.name => item }
  ]...)

  all_folders = merge(
    local.folders_l1_map,
    local.folders_l2_map,
    local.folders_l3_map,
    local.folders_l4_map,
    local.folders_l5_map,
    local.folders_l6_map,
    local.folders_l7_map,
    local.folders_l8_map,
    local.folders_l9_map,
    local.folders_l10_map
  )

  parent_ids = toset(concat(
    [split("/", var.parent)[1]],
    [for k, _ in local.all_folders : split("/", k)[1]]
  ))

  projects = merge([
    for _, v in data.google_projects.projects :
    { for item in v.projects : item.project_id => item }
  ]...)
}

# 10 datasources are used to cover 10 possible nested layers in GCP organization hirerarcy. 
data "google_folders" "folders_l1" {
  parent_id = var.parent
}

data "google_folders" "folders_l2" {
  for_each  = local.folders_l1_map
  parent_id = each.value.name
}

data "google_folders" "folders_l3" {
  for_each  = local.folders_l2_map
  parent_id = each.value.name
}

data "google_folders" "folders_l4" {
  for_each  = local.folders_l3_map
  parent_id = each.value.name
}

data "google_folders" "folders_l5" {
  for_each  = local.folders_l4_map
  parent_id = each.value.name
}

data "google_folders" "folders_l6" {
  for_each  = local.folders_l5_map
  parent_id = each.value.name
}

data "google_folders" "folders_l7" {
  for_each  = local.folders_l6_map
  parent_id = each.value.name
}

data "google_folders" "folders_l8" {
  for_each  = local.folders_l7_map
  parent_id = each.value.name
}

data "google_folders" "folders_l9" {
  for_each  = local.folders_l8_map
  parent_id = each.value.name
}

data "google_folders" "folders_l10" {
  for_each  = local.folders_l9_map
  parent_id = each.value.name
}

# Getting all projects parented by any of the folders in the tree including root prg/folder provided by `parent` variable.
data "google_projects" "projects" {
  for_each = local.parent_ids
  filter   = "parent.id:${each.value} ${var.filter}"
}
