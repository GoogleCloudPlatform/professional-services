/*
 * Copyright 2021 Google LLC. This software is provided as-is, without warranty
 * or representation for any use or purpose. Your use of it is subject to your 
 * agreement with Google.  
 */

locals {
  suffix      = var.random_suffix == "false" ? "" : "_${random_id.this.hex}"
  suffix_dash = var.random_suffix == "false" ? "" : "-${random_id.this.hex}"
}

# If enabled in the config parameters, this random suffix will be added to
# resources that cannot be deleted and recreated with the same name right away.
# Some resources, like projects, GCS buckets and KMS keys are deleted only
# after a grece period. For test purposes, this random suffix can be useful.
resource "random_id" "this" {
  byte_length = 2
}