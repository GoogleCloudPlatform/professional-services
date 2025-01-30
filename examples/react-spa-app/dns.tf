# Copyright 2024 Google LLC
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

module "dns" {
  for_each   = toset(var.dns_config != null ? [""] : [])
  source     = "github.com/GoogleCloudPlatform/cloud-foundation-fabric//modules/dns?ref=daily-2024.12.30"
  project_id = module.project.project_id
  name       = var.dns_config.zone_name
  zone_config = {
    domain = format("%s.", var.dns_config.zone_dns_name)
  }

  # We create the record sets separately to allow TLS certificates to be 
  # provisioned properly
  recordsets = {}

  iam = {}
}

# Create subdomain delegation records, if required

data "google_dns_managed_zone" "subdomain" {
  for_each = toset(var.dns_config != null && try(var.dns_config.subdomain_delegation_zone_name, null) != null ? [""] : [])
  name     = var.dns_config.subdomain_delegation_zone_name
  project  = var.dns_config.subdomain_delegation_project_id != null ? var.dns_config.subdomain_delegation_project_id : module.project.project_id
}

resource "google_dns_record_set" "subdomain-delegation" {
  for_each = toset(var.dns_config != null && try(var.dns_config.subdomain_delegation_zone_name, null) != null ? [""] : [])
  name     = format("%s", module.dns[""].domain)
  type     = "NS"
  ttl      = 300

  project = var.dns_config.subdomain_delegation_project_id != null ? var.dns_config.subdomain_delegation_project_id : module.project.project_id

  managed_zone = data.google_dns_managed_zone.subdomain[""].name

  rrdatas = module.dns[""].name_servers
}


resource "google_dns_record_set" "frontend" {
  for_each = toset(var.dns_config != null && var.global_lb ? [""] : [])
  name     = format("%s.%s", var.dns_config.frontend, module.dns[""].domain)
  type     = "A"
  ttl      = 60

  project      = module.project.project_id
  managed_zone = module.dns[""].name

  rrdatas = [module.xlb[""].address]
}

resource "google_dns_record_set" "frontend-regional" {
  for_each = toset(var.dns_config != null && var.regional_lb ? [""] : [])
  name     = format("%s.regional.%s", var.dns_config.frontend, module.dns[""].domain)
  type     = "A"
  ttl      = 60

  project      = module.project.project_id
  managed_zone = module.dns[""].name

  rrdatas = [module.xlb-regional[""].address]
}

resource "google_dns_record_set" "backend" {
  for_each = toset(var.dns_config != null && var.global_lb ? [""] : [])
  name     = format("%s.%s", var.dns_config.backend, module.dns[""].domain)
  type     = "A"
  ttl      = 60

  project      = module.project.project_id
  managed_zone = module.dns[""].name

  rrdatas = [module.xlb[""].address]
}

resource "google_dns_record_set" "backend-regional" {
  for_each = toset(var.dns_config != null && var.regional_lb ? [""] : [])
  name     = format("%s.regional.%s", var.dns_config.backend, module.dns[""].domain)
  type     = "A"
  ttl      = 60

  project      = module.project.project_id
  managed_zone = module.dns[""].name

  rrdatas = [module.xlb-regional[""].address]
}

resource "google_certificate_manager_certificate" "regional-certificate" {
  for_each    = toset(var.dns_config != null && var.regional_lb ? [""] : [])
  name        = format("my-react-app-regional-cert-%s", var.region)
  description = "TLS certificate for regional load balancer"
  project     = module.project.project_id
  location    = var.region

  managed {
    domains = [
      trimsuffix(format("%s.regional.%s", var.dns_config.frontend, module.dns[""].domain), "."),
      trimsuffix(format("%s.regional.%s", var.dns_config.backend, module.dns[""].domain), ".")
    ]
    dns_authorizations = [
      google_certificate_manager_dns_authorization.frontend[""].id,
      google_certificate_manager_dns_authorization.backend[""].id,
    ]
  }
  depends_on = [
    google_dns_record_set.frontend-auth,
    google_dns_record_set.backend-auth,
  ]
}

resource "google_certificate_manager_dns_authorization" "frontend" {
  for_each    = toset(var.dns_config != null && var.regional_lb ? [""] : [])
  project     = module.project.project_id
  name        = "my-react-app-frontend-dnsauth"
  location    = var.region
  description = "DNS authorization for frontend domain"
  domain      = trimsuffix(format("%s.regional.%s", var.dns_config.frontend, module.dns[""].domain), ".")
}

resource "google_certificate_manager_dns_authorization" "backend" {
  for_each    = toset(var.dns_config != null && var.regional_lb ? [""] : [])
  project     = module.project.project_id
  name        = "my-react-app-backend-dnsauth"
  location    = var.region
  description = "DNS authorization for backend domain"
  domain      = trimsuffix(format("%s.regional.%s", var.dns_config.backend, module.dns[""].domain), ".")
}

resource "google_dns_record_set" "frontend-auth" {
  for_each = toset(var.dns_config != null && var.regional_lb ? [""] : [])
  name     = google_certificate_manager_dns_authorization.frontend[""].dns_resource_record[0].name
  type     = google_certificate_manager_dns_authorization.frontend[""].dns_resource_record[0].type
  ttl      = 60

  project      = module.project.project_id
  managed_zone = module.dns[""].name

  rrdatas = [google_certificate_manager_dns_authorization.frontend[""].dns_resource_record[0].data]
}

resource "google_dns_record_set" "backend-auth" {
  for_each = toset(var.dns_config != null && var.regional_lb ? [""] : [])
  name     = google_certificate_manager_dns_authorization.backend[""].dns_resource_record[0].name
  type     = google_certificate_manager_dns_authorization.backend[""].dns_resource_record[0].type
  ttl      = 60

  project      = module.project.project_id
  managed_zone = module.dns[""].name

  rrdatas = [google_certificate_manager_dns_authorization.backend[""].dns_resource_record[0].data]
}
