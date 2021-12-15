// Copyright 2021 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

data "archive_file" "provider_archive" {
  for_each = fileset(var.provider_binary_folder, "*")
  type     = "zip"

  source_file = "${var.provider_binary_folder}/terraform-provider-ipam_${split("_", each.value)[1]}_${split("_", each.value)[2]}_${split("_", each.value)[3]}"
  output_path = "${path.module}/.temp/terraform-provider-ipam_${split("_", each.value)[1]}_${split("_", each.value)[2]}_${split("_", each.value)[3]}.zip"
}

resource "local_file" "shasum" {
  content = templatefile("${path.module}/templates/shasum.tpl", {
    zips : fileset("${path.module}/.temp", "*.zip")
  })
  filename = "${path.module}/.temp/shasums"

  depends_on = [
    data.archive_file.provider_archive
  ]
}
resource "null_resource" "shasums_sig" {
  provisioner "local-exec" {
    command = <<EOT
gpg --export -a > ./public.key	
rm ./.temp/shasums.sig
gpg --output ./.temp/shasums.sig  --detach-sign ./.temp/shasums
EOT
  }

  depends_on = [
    resource.local_file.shasum
  ]

  triggers = {
    shasums = local_file.shasum.content
  }
}
data "local_file" "public_key" {
  filename = "${path.module}/public.key"
  depends_on = [
    resource.local_file.shasum
  ]
}
resource "random_string" "random" {
  length  = 5
  upper   = false
  special = false
}
resource "google_storage_bucket" "provider" {
  name          = "ipam_provider_${random_string.random.result}"
  location      = "EU"
  force_destroy = true

  uniform_bucket_level_access = true
}

resource "google_storage_bucket_iam_member" "zips_member" {
  bucket = google_storage_bucket.provider.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.autopilot.email}"
}

resource "google_storage_bucket_object" "zips" {
  for_each = fileset("${path.module}/.temp", "*.zip")
  name     = each.value
  bucket   = google_storage_bucket.provider.name
  source   = "${path.module}/.temp/${each.value}"

  depends_on = [
    data.archive_file.provider_archive
  ]
}

resource "google_storage_bucket_object" "shasums" {
  name   = "shasums"
  bucket = google_storage_bucket.provider.name
  source = "${path.module}/.temp/shasums"

  depends_on = [
    local_file.shasum
  ]
}

resource "google_storage_bucket_object" "shasums_sig" {
  name   = "shasums.sig"
  bucket = google_storage_bucket.provider.name
  source = "${path.module}/.temp/shasums.sig"
  depends_on = [
    null_resource.shasums_sig
  ]
}

resource "local_file" "version_json" {
  for_each = google_storage_bucket_object.zips
  content = templatefile("${path.module}/templates/version_json.tpl", {
    zip : each.value,
    shasums_url : google_storage_bucket_object.shasums,
    shasums_sig_url : google_storage_bucket_object.shasums_sig,
    public_key : data.local_file.public_key.content
  })
  filename = "${path.module}/output/ipam-autopilot/ipam/${var.provider_version}/download/${split("_", each.value.name)[2]}/${replace(split("_", each.value.name)[3], ".zip", "")}"
}

resource "local_file" "versions_json" {
  content = templatefile("${path.module}/templates/versions_json.tpl", {
    version : var.provider_version,
    platforms : [
      for zip in google_storage_bucket_object.zips : {
        os   = split("_", zip.name)[2]
        arch = replace(split("_", zip.name)[3], ".zip", "")
      }
    ]
  })
  filename = "${path.module}/output/ipam-autopilot/ipam/versions"

}

/*
data "google_storage_object_signed_url" "zips" {
  provider = google.impersonate
  for_each = google_storage_bucket_object.zips
  bucket = google_storage_bucket.provider.name
  path   =  each.value.output_name

  depends_on = [
    google_storage_bucket_iam_member.zips_member
  ]
}

data "google_storage_object_signed_url" "shasums_url" {
  provider = google.impersonate
  bucket = google_storage_bucket.provider.name
  path   =  google_storage_bucket_object.shasums.output_name

  depends_on = [
    google_storage_bucket_iam_member.zips_member
  ]
}

data "google_storage_object_signed_url" "shasums_sig_url" {
  provider = google.impersonate
  bucket = google_storage_bucket.provider.name
  path   =  google_storage_bucket_object.shasums_sig.output_name

  depends_on = [
    google_storage_bucket_iam_member.zips_member
  ]
}
*/