#   Copyright 2022 Google LLC
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.
provider "google" {{"{"}}
{{"}"}}

{{if ne .createrole "" }} 
provider "aws" {{"{"}}
{{if ne .awsregion "" }} 
  region = "{{ .awsregion }}"
{{end}}  
{{"}"}}
{{end}}

{{if ne .createrole "" }} 
data "aws_iam_policy_document" "inline-policy" {{"{"}}
  statement {{"{"}}
    actions   = ["s3:GetObject", "s3:GetObjectVersion"]
    resources = ["*"]
  {{"}"}}
{{"}"}}

resource "aws_iam_role" "role" {{"{"}}
  name = format("%s-role", local.service)

  # Terraform's "jsonencode" function converts a
  # Terraform expression result to valid JSON syntax.
  assume_role_policy = jsonencode({{"{"}}
    Version = "2012-10-17"
    Statement = [
      {{"{"}}
        Action = "sts:AssumeRoleWithWebIdentity"
        Effect = "Allow"
        Principal = {{"{"}}
          Federated = "accounts.google.com"
        {{"}"}}
        Condition = {{"{"}}
          StringEquals = {{"{"}}
            "accounts.google.com:oaud" = format("gcp-trust-%s", local.service)
            "accounts.google.com:sub" = module.cloud-run.service_account.unique_id
          {{"}"}}
        {{"}"}}
      {{"}"}}
    ]
  {{"}"}})

  inline_policy {{"{"}}
    name   = "s3-sample-policy"
    policy = data.aws_iam_policy_document.inline-policy.json
  }
{{"}"}}
{{end}}

resource "google_project_service" "project-services" {{"{"}}
  for_each = toset(["run.googleapis.com"])

  project = var.project_id
  service = each.value
{{"}"}}

locals {{"{"}}
  service = lower(var.service)
{{"}"}}

module "cloud-run" {{"{"}}
  source     = "github.com/GoogleCloudPlatform/cloud-foundation-fabric//modules/cloud-run?ref=v13.0.0"
  project_id = var.project_id
  name       = local.service
  region     = var.region

  service_account        = var.service_account
  service_account_create = var.service_account_create
  
  containers = [{{"{"}}
    image = format("%s:%s", var.container_url, var.container_tag)
    options = {{"{"}}
      command = null
      args    = null
      env = {{"{"}}
        {{if ne .createrole "" }} 
        OIDC_AUDIENCE  = format("gcp-trust-%s", local.service)
        AWS_ROLE_ARN   = aws_iam_role.role.arn
        REGION_MAP     = jsonencode({{"{"}}
          (var.region) = "{{ .awsregion }}"
        {{"}"}})
        {{else}}
        OIDC_AUDIENCE  = var.oidc_audience
        AWS_ROLE_ARN   = var.role_arn
        {{end}}
        JSON_TRANSFORM = var.json_transform
      {{"}"}}
      env_from = null
    {{"}"}}
    ports         = null
    resources     = null
    volume_mounts = null
  {{"}"}}]

  depends_on = [
    google_project_service.project-services
  ]
{{"}"}}

resource "google_compute_region_network_endpoint_group" "serverless-neg" {{"{"}}
  for_each = toset(var.create_load_balancer ? [""] : [])

  name    = format("%s-neg", local.service)
  project = var.project_id
  region  = var.region
  
  network_endpoint_type = "SERVERLESS"
  cloud_run {{"{"}}
    service = module.cloud-run.service.name
  {{"}"}}
{{"}"}}

module "load-balancer" {{"{"}}
  for_each = toset(var.create_load_balancer ? [""] : [])

  source     = "github.com/GoogleCloudPlatform/cloud-foundation-fabric//modules/net-glb?ref=v13.0.0"
  name       = format("%s-lb", local.service)
  project_id = var.project_id

  health_checks_config_defaults = null
  backend_services_config = {{"{"}}
    format("%s-be", var.service) = {{"{"}}
      bucket_config = null
      enable_cdn    = false
      cdn_config    = null
      group_config = {{"{"}}
        backends = [
          {{"{"}}
            group = google_compute_region_network_endpoint_group.serverless-neg[""].id
            options = null
          {{"}"}}
        ],
        health_checks = []
        log_config = null
        options = null
      {{"}"}}
    {{"}"}}
  {{"}"}}
{{"}"}}