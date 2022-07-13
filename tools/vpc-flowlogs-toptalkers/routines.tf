/**
 * Copyright 2021 Google LLC
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
  labels = yamldecode(file("labels.yaml"))
  ipv4_range_labels = coalesce(lookup(local.labels, "ipv4_range_labels", {}), {})
  ipv6_range_labels = coalesce(lookup(local.labels, "ipv6_range_labels", {}), {})
  port_labels = coalesce(lookup(local.labels, "port_labels", {}), {})
}

resource "google_bigquery_routine" "IP_FROM_CIDR_STRING" {
  project      = var.logs_project_id
  dataset_id   = var.dataset_name
  routine_id   = "IP_FROM_CIDR_STRING"
  language     = "SQL"
  routine_type = "SCALAR_FUNCTION"
  definition_body = "NET.IP_FROM_STRING(SPLIT(cidr, '/')[OFFSET(0)])"
  arguments {
    name      = "cidr"
    data_type = "{\"typeKind\" :  \"STRING\"}"
  }
  depends_on    = [
    module.destination,
  ]
}

resource "google_bigquery_routine" "NET_MASK_FROM_CIDR_STRING" {
  project      = var.logs_project_id
  dataset_id   = var.dataset_name
  routine_id   = "NET_MASK_FROM_CIDR_STRING"
  language     = "SQL"
  routine_type = "SCALAR_FUNCTION"
  definition_body = "NET.IP_NET_MASK(address_length, CAST(SPLIT(cidr, '/')[OFFSET(1)] AS INT64))"
  arguments {
    name      = "cidr"
    data_type = "{\"typeKind\" :  \"STRING\"}"
  }
  arguments {
    name      = "address_length"
    data_type = "{\"typeKind\" :  \"INT64\"}"
  }
  depends_on    = [
    module.destination,
  ]
}

resource "google_bigquery_routine" "IP_IN_NET" {
  project      = var.logs_project_id
  dataset_id   = var.dataset_name
  routine_id   = "IP_IN_NET"
  language     = "SQL"
  routine_type = "SCALAR_FUNCTION"
  definition_body = "(ip & mask) = (net & mask)"
  arguments {
    name      = "ip"
    data_type = "{\"typeKind\" :  \"BYTES\"}"
  }
  arguments {
    name      = "net"
    data_type = "{\"typeKind\" :  \"BYTES\"}"
  }
  arguments {
    name      = "mask"
    data_type = "{\"typeKind\" :  \"BYTES\"}"
  }
  depends_on    = [
    module.destination,
  ]
}

resource "google_bigquery_routine" "IPBYTES_IN_CIDR" {
  project      = var.logs_project_id
  dataset_id   = var.dataset_name
  routine_id   = "IPBYTES_IN_CIDR"
  language     = "SQL"
  routine_type = "SCALAR_FUNCTION"
  definition_body = trimspace(<<EOF
    `${var.logs_project_id}.${var.dataset_name}.IP_IN_NET`(
      ip,
      `${var.logs_project_id}.${var.dataset_name}.IP_FROM_CIDR_STRING`(
          cidr
      ),
      `${var.logs_project_id}.${var.dataset_name}.NET_MASK_FROM_CIDR_STRING`(
          cidr,
          BYTE_LENGTH(ip)
      )
    )
EOF
  )
  arguments {
    name      = "ip"
    data_type = "{\"typeKind\" :  \"BYTES\"}"
  }
  arguments {
    name      = "cidr"
    data_type = "{\"typeKind\" :  \"STRING\"}"
  }
  depends_on    = [
    module.destination,
    google_bigquery_routine.IP_IN_NET,
    google_bigquery_routine.IP_FROM_CIDR_STRING,
    google_bigquery_routine.NET_MASK_FROM_CIDR_STRING
  ]
}

resource "google_bigquery_routine" "PORTS_TO_PROTO" {
  project      = var.logs_project_id
  dataset_id   = var.dataset_name
  routine_id   = "PORTS_TO_PROTO"
  language     = "SQL"
  routine_type = "SCALAR_FUNCTION"
  definition_body = trimspace(<<EOF
    CASE
      ${join("\n", formatlist("WHEN src_port = %s OR dst_port = %s then '%s'", keys(local.port_labels), keys(local.port_labels), values(local.port_labels)))}
      ELSE FORMAT('other-%d->%d', src_port, dst_port)
    END
EOF
  )
  arguments {
    name      = "src_port"
    data_type = "{\"typeKind\" :  \"INT64\"}"
  }
  arguments {
    name      = "dst_port"
    data_type = "{\"typeKind\" :  \"INT64\"}"
  }
  depends_on    = [
    module.destination
  ]
}

resource "google_bigquery_routine" "IP_STRINGS_IN_CIDR" {
  project      = var.logs_project_id
  dataset_id   = var.dataset_name
  routine_id   = "IP_STRINGS_IN_CIDR"
  language     = "SQL"
  routine_type = "SCALAR_FUNCTION"
  definition_body = trimspace(<<EOF
    `${var.logs_project_id}.${var.dataset_name}.IPBYTES_IN_CIDR`(NET.IP_FROM_STRING(src_ip), cidr) OR
    `${var.logs_project_id}.${var.dataset_name}.IPBYTES_IN_CIDR`(NET.IP_FROM_STRING(dest_ip), cidr)
EOF
  )
  arguments {
    name      = "src_ip"
    data_type = "{\"typeKind\" :  \"STRING\"}"
  }
  arguments {
    name      = "dest_ip"
    data_type = "{\"typeKind\" :  \"STRING\"}"
  }
  arguments {
    name      = "cidr"
    data_type = "{\"typeKind\" :  \"STRING\"}"
  }
  depends_on    = [
    module.destination,
    google_bigquery_routine.IPBYTES_IN_CIDR
  ]
}


resource "google_bigquery_routine" "IP_VERSION" {
  project      = var.logs_project_id
  dataset_id   = var.dataset_name
  routine_id   = "IP_VERSION"
  language     = "SQL"
  routine_type = "SCALAR_FUNCTION"
  definition_body = "IF(BYTE_LENGTH(NET.IP_FROM_STRING(ip_str)) = 4, 4, 6)"
  arguments {
    name      = "ip_str"
    data_type = "{\"typeKind\" :  \"STRING\"}"
  }
  depends_on    = [module.destination]
}


resource "google_bigquery_routine" "IP_TO_DEFAULT_LABEL" {
  project      = var.logs_project_id
  dataset_id   = var.dataset_name
  routine_id   = "IP_TO_DEFAULT_LABEL"
  language     = "SQL"
  routine_type = "SCALAR_FUNCTION"
  definition_body = trimspace(<<EOF
    IF(`${var.logs_project_id}.${var.dataset_name}.IP_VERSION`(ip_str) = 4,
      FORMAT('netaddr4-%s', NET.IP_TO_STRING(NET.IP_FROM_STRING(ip_str) & NET.IP_NET_MASK(4, ${var.ipv4_aggregate_prefix}))),
      FORMAT('netaddr6-%s', NET.IP_TO_STRING(NET.IP_FROM_STRING(ip_str) & NET.IP_NET_MASK(16, ${var.ipv6_aggregate_prefix})))
    )
EOF
  )
  arguments {
    name      = "ip_str"
    data_type = "{\"typeKind\" :  \"STRING\"}"
  }
  depends_on    = [module.destination, google_bigquery_routine.IP_VERSION]
}
