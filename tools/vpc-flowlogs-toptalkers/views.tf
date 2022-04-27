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
  report_suffix = {
    "day" = "daily"
    "week" = "weekly"
    "month" = "monthly"
  }
  ip_range_labels   = yamldecode(file("ip-range-labels.yaml"))
  ipv4_ranges_start = [for ip_range in local.ip_range_labels.ipv4_range_labels : ip_range[1]]
  ipv4_ranges_end   = [for ip_range in local.ip_range_labels.ipv4_range_labels : ip_range[2]]
  ipv4_ranges_label = [for ip_range in local.ip_range_labels.ipv4_range_labels : ip_range[0]]
  ipv6_ranges_start = [for ip_range in local.ip_range_labels.ipv6_range_labels : ip_range[1]]
  ipv6_ranges_end   = [for ip_range in local.ip_range_labels.ipv6_range_labels : ip_range[2]]
  ipv6_ranges_label = [for ip_range in local.ip_range_labels.ipv6_range_labels : ip_range[0]]
  ipv4_include_text = trimspace(<<EOT
  %{if var.enable_ipv4_traffic}
    %{if 0 < length(var.ipv4_ranges_to_include)}
      include ${join(", ", var.ipv4_ranges_to_include)} IP address ranges ${local.ipv4_except_text}
    %{else}
      include all IP address ranges ${local.ipv4_except_text}
    %{endif}
  %{else}
    not include any ranges
  %{endif}
EOT
    )
  ipv4_except_text = trimspace(<<EOT
    %{if 0 < length(var.ipv4_ranges_to_exclude)}
      except ${join(", ", var.ipv4_ranges_to_exclude)}
    %{endif}
EOT
    )

  ipv6_include_text = trimspace(<<EOT
  %{if var.enable_ipv6_traffic}
    %{if 0 < length(var.ipv6_ranges_to_include)}
      include ${join(", ", var.ipv6_ranges_to_include)} IP address ranges ${local.ipv6_except_text}
    %{else}
      include all IP address ranges ${local.ipv6_except_text}
    %{endif}
  %{else}
    not include any ranges
  %{endif}
EOT
    )
  ipv6_except_text = trimspace(<<EOT
    %{if 0 < length(var.ipv6_ranges_to_exclude)}
      except ${join(", ", var.ipv6_ranges_to_exclude)}
    %{endif}
EOT
    )

  ipv4_filter = <<EOT
  %{if var.enable_ipv4_traffic}
    TRUE
    %{if 0 < length(var.ipv4_ranges_to_include)}
      AND (${join(" OR ", formatlist("IP_STRINGS_IN_CIDR(jsonPayload.connection.src_ip, jsonPayload.connection.dest_ip, '%s')", var.ipv4_ranges_to_include))})
    %{endif}
    %{if 0 < length(var.ipv4_ranges_to_exclude)}
      AND NOT (${join(" OR ", formatlist("IP_STRINGS_IN_CIDR(jsonPayload.connection.src_ip, jsonPayload.connection.dest_ip, '%s')", var.ipv4_ranges_to_exclude))})
    %{endif}
  %{else}
    FALSE
  %{endif}

EOT
  ipv6_filter = <<EOT
  %{if var.enable_ipv6_traffic}
    TRUE
    %{if 0 < length(var.ipv6_ranges_to_include)}
      AND (${join(" OR ", formatlist("IP_STRINGS_IN_CIDR(jsonPayload.connection.src_ip, jsonPayload.connection.dest_ip, '%s')", var.ipv6_ranges_to_include))})
    %{endif}
    %{if 0 < length(var.ipv6_ranges_to_exclude)}
      AND NOT (${join(" OR ", formatlist("IP_STRINGS_IN_CIDR(jsonPayload.connection.src_ip, jsonPayload.connection.dest_ip, '%s')", var.ipv6_ranges_to_exclude))})
    %{endif}
  %{else}
    FALSE
  %{endif}
EOT

  group_by = join(", ", concat(
    ["src"],
    var.enable_split_by_destination ? ["dest"] : [],
    ["ip_version", "time_period"],
    var.enable_split_by_protocol ? ["protocol"] : []
  ))
}

resource "google_bigquery_table" "report" {
  for_each = { for e in setproduct(["current", "previous"], ["day", "week", "month"]) : format("%s-%s", e[0], e[1]) => e }
  dataset_id    = var.dataset_name
  friendly_name = "Top Talkers Report for the ${each.value[0]} month grouped by ${each.value[1]}"
  table_id      = "top_talkers_report_${each.value[0]}_month_${local.report_suffix[each.value[1]]}"

  project       = var.logs_project_id
  depends_on    = [
    module.destination,
    google_bigquery_routine.PORTS_TO_PROTO,
    google_bigquery_routine.IP_VERSION,
    google_bigquery_routine.IP_TO_DEFAULT_LABEL
  ]
  description   = <<EOT
  Regarding IPv4, the report will ${local.ipv4_include_text}.
  Regarding IPv6, the report will ${local.ipv6_include_text}.
EOT

  deletion_protection = false
  view {
    query = trimspace(<<EOF
WITH ip_range_labels AS (
  SELECT *
  FROM 
  UNNEST(ARRAY<STRUCT<ip_start BYTES, ip_end BYTES, label STRING>>[
    ${join("\n", formatlist("(NET.IP_FROM_STRING('%s'), NET.IP_FROM_STRING('%s'), '%s'),", local.ipv4_ranges_start, local.ipv4_ranges_end, local.ipv4_ranges_label))}
    ${join("\n", formatlist("(NET.IP_FROM_STRING('%s'), NET.IP_FROM_STRING('%s'), '%s'),", local.ipv6_ranges_start, local.ipv6_ranges_end, local.ipv6_ranges_label))}
    (CAST("" AS BYTES), CAST("" AS BYTES), NULL)
  ])
)
SELECT
  DATE_TRUNC(PARSE_DATE('%F', SPLIT(jsonPayload.start_time, 'T')[OFFSET(0)]), `${each.value[1]}`) as time_period,
  COALESCE(
    (SELECT label
      FROM ip_range_labels
      WHERE (NET.IP_FROM_STRING(jsonPayload.connection.src_ip) BETWEEN ip_range_labels.ip_start AND ip_range_labels.ip_end)
      LIMIT 1
    ),
    `${var.logs_project_id}.${var.dataset_name}.IP_TO_DEFAULT_LABEL`(jsonPayload.connection.src_ip)
  ) AS src,
  COALESCE(
    (SELECT label
      FROM ip_range_labels
      WHERE (NET.IP_FROM_STRING(jsonPayload.connection.dest_ip) BETWEEN ip_range_labels.ip_start AND ip_range_labels.ip_end)
      LIMIT 1
    ),
    `${var.logs_project_id}.${var.dataset_name}.IP_TO_DEFAULT_LABEL`(jsonPayload.connection.dest_ip)
  ) AS dest,
  MIN(jsonPayload.src_vpc.vpc_name) as src_vpc,
  MIN(jsonPayload.dest_vpc.vpc_name) as dest_vpc,
  `${var.logs_project_id}.${var.dataset_name}.PORTS_TO_PROTO`(
    CAST(jsonPayload.connection.src_port as INT64),
    CAST(jsonPayload.connection.dest_port as INT64)) as protocol,
  SUM(CAST(jsonPayload.bytes_sent as int64)) as bytes,
  SUM(CAST(jsonPayload.packets_sent as int64)) as packets,
  `${var.logs_project_id}.${var.dataset_name}.IP_VERSION`(jsonPayload.connection.src_ip) as ip_version

FROM `${var.logs_project_id}.${var.dataset_name}.compute_googleapis_com_vpc_flows_*`

WHERE
  IF(`${var.logs_project_id}.${var.dataset_name}.IP_VERSION`(jsonPayload.connection.src_ip) = 4, ${local.ipv4_filter}, ${local.ipv6_filter})
  %{if "current" == each.value[0] }
    AND _TABLE_SUFFIX BETWEEN FORMAT_DATE("%Y%m01", CURRENT_DATE()) AND FORMAT_DATE("%Y%m31", CURRENT_DATE())
  %{endif}
  %{if "previous" == each.value[0] }
    AND _TABLE_SUFFIX BETWEEN FORMAT_DATE("%Y%m01", DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)) AND FORMAT_DATE("%Y%m31", DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
  %{endif}

GROUP BY ${local.group_by}

EOF
    )
    use_legacy_sql = false
  }
}
