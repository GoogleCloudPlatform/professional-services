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
  # split record name and type and set as keys in a map
  _recordsets_0 = {
    for key, attrs in var.recordsets :
    key => merge(attrs, zipmap(["type", "name"], split(" ", key)))
  }
  # compute the final resource name for the recordset
  _recordsets = {
    for key, attrs in local._recordsets_0 :
    key => merge(attrs, {
      resource_name = (
        attrs.name == ""
        ? var.domain
        : (
          substr(attrs.name, -1, 1) == "."
          ? attrs.name
          : "${attrs.name}.${var.domain}"
        )
      )
    })
  }
  # split recordsets between regular, geo and wrr
  geo_recordsets = {
    for k, v in local._recordsets :
    k => v
    if v.geo_routing != null
  }
  regular_recordsets = {
    for k, v in local._recordsets :
    k => v
    if v.records != null
  }
  wrr_recordsets = {
    for k, v in local._recordsets :
    k => v
    if v.wrr_routing != null
  }
  zone = (
    var.zone_create
    ? try(
      google_dns_managed_zone.non-public.0, try(
        google_dns_managed_zone.public.0, null
      )
    )
    : try(data.google_dns_managed_zone.public.0, null)
  )
  dns_keys = try(
    data.google_dns_keys.dns_keys.0, null
  )
}

resource "google_dns_managed_zone" "non-public" {
  count       = (var.zone_create && var.type != "public") ? 1 : 0
  provider    = google-beta
  project     = var.project_id
  name        = var.name
  dns_name    = var.domain
  description = var.description
  visibility  = "private"

  dynamic "forwarding_config" {
    for_each = (
      var.type == "forwarding" &&
      var.forwarders != null &&
      length(var.forwarders) > 0
      ? [""]
      : []
    )
    content {
      dynamic "target_name_servers" {
        for_each = var.forwarders
        iterator = forwarder
        content {
          ipv4_address    = forwarder.key
          forwarding_path = forwarder.value
        }
      }
    }
  }

  dynamic "peering_config" {
    for_each = (
      var.type == "peering" && var.peer_network != null ? [""] : []
    )
    content {
      target_network {
        network_url = var.peer_network
      }
    }
  }

  dynamic "private_visibility_config" {
    for_each = length(var.client_networks) > 0 ? [""] : []
    content {
      dynamic "networks" {
        for_each = var.client_networks
        iterator = network
        content {
          network_url = network.value
        }
      }
    }
  }

  dynamic "service_directory_config" {
    for_each = (
      var.type == "service-directory" && var.service_directory_namespace != null
      ? [""]
      : []
    )
    content {
      namespace {
        namespace_url = var.service_directory_namespace
      }
    }
  }

}

data "google_dns_managed_zone" "public" {
  count   = var.zone_create ? 0 : 1
  project = var.project_id
  name    = var.name
}

resource "google_dns_managed_zone" "public" {
  count       = (var.zone_create && var.type == "public") ? 1 : 0
  project     = var.project_id
  name        = var.name
  dns_name    = var.domain
  description = var.description
  visibility  = "public"

  dynamic "dnssec_config" {
    for_each = var.dnssec_config == null ? [] : [1]
    iterator = config
    content {
      kind          = "dns#managedZoneDnsSecConfig"
      non_existence = var.dnssec_config.non_existence
      state         = var.dnssec_config.state

      default_key_specs {
        algorithm  = var.dnssec_config.key_signing_key.algorithm
        key_length = var.dnssec_config.key_signing_key.key_length
        key_type   = "keySigning"
        kind       = "dns#dnsKeySpec"
      }

      default_key_specs {
        algorithm  = var.dnssec_config.zone_signing_key.algorithm
        key_length = var.dnssec_config.zone_signing_key.key_length
        key_type   = "zoneSigning"
        kind       = "dns#dnsKeySpec"
      }
    }
  }

}

data "google_dns_keys" "dns_keys" {
  count        = var.zone_create && (var.dnssec_config == {} || var.type != "public") ? 0 : 1
  managed_zone = local.zone.id
}

resource "google_dns_record_set" "cloud-static-records" {
  for_each = (
    var.type == "public" || var.type == "private"
    ? local.regular_recordsets
    : {}
  )
  project      = var.project_id
  managed_zone = var.name
  name         = each.value.resource_name
  type         = each.value.type
  ttl          = each.value.ttl
  rrdatas      = each.value.records

  depends_on = [
    google_dns_managed_zone.non-public, google_dns_managed_zone.public
  ]
}

resource "google_dns_record_set" "cloud-geo-records" {
  for_each = (
    var.type == "public" || var.type == "private"
    ? local.geo_recordsets
    : {}
  )
  project      = var.project_id
  managed_zone = var.name
  name         = each.value.resource_name
  type         = each.value.type
  ttl          = each.value.ttl

  routing_policy {
    dynamic "geo" {
      for_each = each.value.geo_routing
      iterator = policy
      content {
        location = policy.value.location
        rrdatas  = policy.value.records
      }
    }
  }

  depends_on = [
    google_dns_managed_zone.non-public, google_dns_managed_zone.public
  ]
}

resource "google_dns_record_set" "cloud-wrr-records" {
  for_each = (
    var.type == "public" || var.type == "private"
    ? local.wrr_recordsets
    : {}
  )
  project      = var.project_id
  managed_zone = var.name
  name         = each.value.resource_name
  type         = each.value.type
  ttl          = each.value.ttl

  routing_policy {
    dynamic "wrr" {
      for_each = each.value.wrr_routing
      iterator = policy
      content {
        weight  = policy.value.weight
        rrdatas = policy.value.records
      }
    }
  }

  depends_on = [
    google_dns_managed_zone.non-public, google_dns_managed_zone.public
  ]
}
