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

# tfdoc:file:description URL maps.

locals {
  # Look for a backend service in the config whose id is
  # the default_service given in the url-map.
  # If not found, use the default_service id as given
  # (assuming it's already existing).
  # If the variable is null, will be set to null.
  _default_service = try(
    google_compute_region_backend_service.backend_service[var.url_map_config.default_service].id,
    var.url_map_config.default_service,
    null
  )

  # If no backend services are specified,
  # the first backend service defined is associated
  default_service = (
    try(local._default_service, null) == null
    && try(var.url_map_config.default_route_action.weighted_backend_services, null) == null
    && try(var.url_map_config.default_url_redirect, null) == null
    ? try(
      google_compute_region_backend_service.backend_service[keys(google_compute_region_backend_service.backend_service)[0]].id,
      null
    )
    : null
  )
}

resource "google_compute_region_url_map" "url_map" {
  name            = var.name
  description     = "Terraform managed."
  project         = var.project_id
  region          = var.region
  default_service = local.default_service


  dynamic "host_rule" {
    for_each = (
      try(var.url_map_config.host_rules, null) == null
      ? []
      : var.url_map_config.host_rules
    )
    content {
      description  = try(host_rule.value.description, null)
      hosts        = try(host_rule.value.hosts, null)
      path_matcher = try(host_rule.value.path_matcher, null)
    }
  }

  dynamic "path_matcher" {
    for_each = (
      try(var.url_map_config.path_matchers, null) == null
      ? []
      : var.url_map_config.path_matchers
    )
    content {
      name        = try(path_matcher.value.name, null)
      description = try(path_matcher.value.description, null)
      default_service = try(
        google_compute_region_backend_service.backend_service[var.url_map_config.default_service].id,
        path_matcher.value.default_service,
        null
      )

      dynamic "path_rule" {
        for_each = (
          try(path_matcher.value.path_rules, null) == null
          ? []
          : path_matcher.value.path_rules
        )
        content {
          paths = try(path_rule.value.paths, null)
          service = try(
            google_compute_region_backend_service.backend_service[path_rule.value.service].id,
            path_rule.value.service,
            null
          )

          dynamic "route_action" {
            for_each = (
              try(path_rule.value.route_action, null) == null
              ? []
              : [path_rule.value.route_action]
            )
            content {

              dynamic "cors_policy" {
                for_each = (
                  try(route_action.value.cors_policy, null) == null
                  ? []
                  : [route_action.value.cors_policy]
                )
                content {
                  allow_credentials    = try(cors_policy.value.allow_credentials, null)
                  allow_headers        = try(cors_policy.value.allow_headers, null)
                  allow_methods        = try(cors_policy.value.allow_methods, null)
                  allow_origin_regexes = try(cors_policy.value.allow_origin_regexes, null)
                  allow_origins        = try(cors_policy.value.allow_origins, null)
                  disabled             = try(cors_policy.value.disabled, null)
                  expose_headers       = try(cors_policy.value.expose_headers, null)
                  max_age              = try(cors_policy.value.max_age, null)
                }
              }

              dynamic "fault_injection_policy" {
                for_each = (
                  try(route_action.value.fault_injection_policy, null) == null
                  ? []
                  : [route_action.value.fault_injection_policy]
                )
                iterator = policy
                content {

                  dynamic "abort" {
                    for_each = (
                      try(policy.value.abort, null) == null
                      ? []
                      : [policy.value.abort]
                    )
                    content {
                      http_status = try(abort.value.http_status, null) # Must be between 200 and 599 inclusive
                      percentage  = try(abort.value.percentage, null)  # Must be between 0.0 and 100.0 inclusive
                    }
                  }

                  dynamic "delay" {
                    for_each = (
                      try(policy.value.delay, null) == null
                      ? []
                      : [policy.value.delay]
                    )
                    content {
                      percentage = try(delay.value.percentage, null) # Must be between 0.0 and 100.0 inclusive

                      dynamic "fixed_delay" {
                        for_each = (
                          try(delay.value.fixed_delay, null) == null
                          ? []
                          : [delay.value.fixed_delay]
                        )
                        content {
                          nanos   = try(fixed_delay.value.nanos, null)   # Must be from 0 to 999,999,999 inclusive
                          seconds = try(fixed_delay.value.seconds, null) # Must be from 0 to 315,576,000,000 inclusive
                        }
                      }
                    }
                  }
                }
              }

              dynamic "request_mirror_policy" {
                for_each = (
                  try(route_action.value.request_mirror_policy, null) == null
                  ? []
                  : [route_action.value.request_mirror_policy]
                )
                iterator = policy
                content {
                  backend_service = try(
                    google_compute_region_backend_service.backend_service[policy.value.backend_service].id,
                    policy.value.backend_service,
                    null
                  )
                }
              }

              dynamic "retry_policy" {
                for_each = (
                  try(route_action.value.retry_policy, null) == null
                  ? []
                  : [route_action.value.retry_policy]
                )
                iterator = policy
                content {
                  num_retries = try(policy.num_retries, null) # Must be > 0
                  # Valid values at https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/compute_url_map#retry_conditions
                  retry_conditions = try(policy.retry_conditions, null)

                  dynamic "per_try_timeout" {
                    for_each = (
                      try(policy.value.per_try_timeout, null) == null
                      ? []
                      : [policy.value.per_try_timeout]
                    )
                    iterator = timeout
                    content {
                      nanos   = try(timeout.value.nanos, null)   # Must be from 0 to 999,999,999 inclusive
                      seconds = try(timeout.value.seconds, null) # Must be from 0 to 315,576,000,000 inclusive
                    }
                  }
                }
              }

              dynamic "timeout" {
                for_each = (
                  try(route_action.value.timeout, null) == null
                  ? []
                  : [route_action.value.timeout]
                )
                content {
                  nanos   = try(timeout.value.nanos, null)   # Must be from 0 to 999,999,999 inclusive
                  seconds = try(timeout.value.seconds, null) # Must be from 0 to 315,576,000,000 inclusive
                }
              }

              dynamic "url_rewrite" {
                for_each = (
                  try(route_action.value.url_rewrite, null) == null
                  ? []
                  : [route_action.value.url_rewrite]
                )
                content {
                  host_rewrite        = try(url_rewrite.value.host_rewrite, null)        # Must be between 1 and 255 characters
                  path_prefix_rewrite = try(url_rewrite.value.path_prefix_rewrite, null) # Must be between 1 and 1024 characters
                }
              }

              dynamic "weighted_backend_services" {
                for_each = (
                  try(route_action.value.weighted_backend_services, null) == null
                  ? []
                  : route_action.value.weighted_backend_services
                )
                iterator = weighted
                content {
                  weight = try(weighted.value.weigth, null)
                  backend_service = try(
                    google_compute_region_backend_service.backend_service[weighted.value.backend_service].id,
                    policy.value.backend_service,
                    null
                  )
                  dynamic "header_action" {
                    for_each = (
                      try(path_matcher.value.header_action, null) == null
                      ? []
                      : [path_matcher.value.header_action]
                    )
                    content {
                      request_headers_to_remove  = try(header_action.value.request_headers_to_remove, null)
                      response_headers_to_remove = try(header_action.value.response_headers_to_remove, null)

                      dynamic "request_headers_to_add" {
                        for_each = (
                          try(header_action.value.request_headers_to_add, null) == null
                          ? [] :
                          [header_action.value.request_headers_to_add]
                        )
                        content {
                          header_name  = try(request_headers_to_add.value.header_name, null)
                          header_value = try(request_headers_to_add.value.header_value, null)
                          replace      = try(request_headers_to_add.value.replace, null)
                        }
                      }

                      dynamic "response_headers_to_add" {
                        for_each = (
                          try(header_action.response_headers_to_add, null) == null
                          ? []
                          : [header_action.response_headers_to_add]
                        )
                        content {
                          header_name  = try(response_headers_to_add.value.header_name, null)
                          header_value = try(response_headers_to_add.value.header_value, null)
                          replace      = try(response_headers_to_add.value.replace, null)
                        }
                      }
                    }
                  }
                }
              }
            }
          }

          dynamic "url_redirect" {
            for_each = (
              try(path_rule.value.url_redirect, null) == null
              ? []
              : path_rule.value.url_redirect
            )
            content {
              host_redirect   = try(url_redirect.value.host_redirect, null) # Must be between 1 and 255 characters
              https_redirect  = try(url_redirect.value.https_redirect, null)
              path_redirect   = try(url_redirect.value.path_redirect, null)
              prefix_redirect = try(url_redirect.value.prefix_redirect, null) # Must be between 1 and 1024 characters
              # Valid valus at https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/compute_url_map#redirect_response_code
              redirect_response_code = try(url_redirect.value.redirect_response_code, null)
              strip_query            = try(url_redirect.value.strip_query, null)
            }
          }
        }
      }

      dynamic "route_rules" {
        for_each = (
          try(path_matcher.value.route_rules, null) == null
          ? []
          : path_matcher.value.route_rules
        )
        content {
          priority = try(route_rules.value.priority, null)
          service = try(
            google_compute_region_backend_service.backend_service[route_rules.value.service].id,
            route_rules.value.service,
            null
          )

          dynamic "header_action" {
            for_each = (
              try(path_matcher.value.header_action, null) == null
              ? []
              : [path_matcher.value.header_action]
            )
            content {
              request_headers_to_remove  = try(header_action.value.request_headers_to_remove, null)
              response_headers_to_remove = try(header_action.value.response_headers_to_remove, null)

              dynamic "request_headers_to_add" {
                for_each = (
                  try(header_action.value.request_headers_to_add, null) == null
                  ? []
                  : [header_action.value.request_headers_to_add]
                )
                content {
                  header_name  = try(request_headers_to_add.value.header_name, null)
                  header_value = try(request_headers_to_add.value.header_value, null)
                  replace      = try(request_headers_to_add.value.replace, null)
                }
              }

              dynamic "response_headers_to_add" {
                for_each = (
                  try(header_action.response_headers_to_add, null) == null
                  ? []
                  : [header_action.response_headers_to_add]
                )
                content {
                  header_name  = try(response_headers_to_add.value.header_name, null)
                  header_value = try(response_headers_to_add.value.header_value, null)
                  replace      = try(response_headers_to_add.value.replace, null)
                }
              }
            }
          }

          dynamic "match_rules" {
            for_each = (
              try(path_matcher.value.match_rules, null) == null
              ? []
              : path_matcher.value.match_rules
            )
            content {
              full_path_match = try(match_rules.value.full_path_match, null) # Must be between 1 and 1024 characters
              ignore_case     = try(match_rules.value.ignore_case, null)
              prefix_match    = try(match_rules.value.prefix_match, null)
              regex_match     = try(match_rules.value.regex_match, null)

              dynamic "header_matches" {
                for_each = (
                  try(match_rules.value.header_matches, null) == null
                  ? []
                  : [match_rules.value.header_matches]
                )
                content {
                  exact_match   = try(header_matches.value.exact_match, null)
                  header_name   = try(header_matches.value.header_name, null)
                  invert_match  = try(header_matches.value.invert_match, null)
                  prefix_match  = try(header_matches.value.prefix_match, null)
                  present_match = try(header_matches.value.present_match, null)
                  regex_match   = try(header_matches.value.regex_match, null)
                  suffix_match  = try(header_matches.value, null)

                  dynamic "range_match" {
                    for_each = try(header_matches.value.range_match, null) == null ? [] : [header_matches.value.range_match]
                    content {
                      range_end   = try(range_match.value.range_end, null)
                      range_start = try(range_match.value.range_start, null)
                    }
                  }
                }
              }

              dynamic "metadata_filters" {
                for_each = (
                  try(match_rules.value.metadata_filters, null) == null
                  ? []
                  : [match_rules.value.metadata_filters]
                )
                content {
                  # Valid values at https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/compute_url_map#filter_match_criteria
                  filter_match_criteria = try(metadata_filters.value.filter_match_criteria, null)

                  dynamic "filter_labels" {
                    for_each = (
                      try(metadata_filters.value.filter_labels, null) == null
                      ? []
                      : metadata_filters.value.filter_labels
                    )
                    content {
                      name  = try(filter_labels.value.name, null)  # Must be between 1 and 1024 characters
                      value = try(filter_labels.value.value, null) # Must be between 1 and 1024 characters
                    }
                  }
                }
              }

              dynamic "query_parameter_matches" {
                for_each = (
                  try(match_rules.value.query_parameter_matches, null) == null
                  ? []
                  : [match_rules.value.query_parameter_matches]
                )
                iterator = query
                content {
                  exact_match   = try(query.value.exact_match, null)
                  name          = try(query.value.name, null)
                  present_match = try(query.value.present_match, null)
                  regex_match   = try(query.value.regex_match, null)
                }
              }
            }
          }

          dynamic "route_action" {
            for_each = (
              try(route_rules.value.route_action, null) == null
              ? []
              : [route_rules.value.route_action]
            )
            content {

              dynamic "cors_policy" {
                for_each = (
                  try(route_action.value.cors_policy, null) == null
                  ? []
                  : [route_action.value.cors_policy]
                )
                content {
                  allow_credentials    = try(cors_policy.value.allow_credentials, null)
                  allow_headers        = try(cors_policy.value.allow_headers, null)
                  allow_methods        = try(cors_policy.value.allow_methods, null)
                  allow_origin_regexes = try(cors_policy.value.allow_origin_regexes, null)
                  allow_origins        = try(cors_policy.value.allow_origins, null)
                  disabled             = try(cors_policy.value.disabled, null)
                  expose_headers       = try(cors_policy.value.expose_headers, null)
                  max_age              = try(cors_policy.value.max_age, null)
                }
              }

              dynamic "fault_injection_policy" {
                for_each = (
                  try(route_action.value.fault_injection_policy, null) == null
                  ? []
                  : [route_action.value.fault_injection_policy]
                )
                iterator = policy
                content {

                  dynamic "abort" {
                    for_each = (
                      try(policy.value.abort, null) == null
                      ? []
                      : [policy.value.abort]
                    )
                    content {
                      http_status = try(abort.value.http_status, null) # Must be between 200 and 599 inclusive
                      percentage  = try(abort.value.percentage, null)  # Must be between 0.0 and 100.0 inclusive
                    }
                  }

                  dynamic "delay" {
                    for_each = (
                      try(policy.value.delay, null) == null
                      ? []
                      : [policy.value.delay]
                    )
                    content {
                      percentage = try(delay.value.percentage, null) # Must be between 0.0 and 100.0 inclusive

                      dynamic "fixed_delay" {
                        for_each = (
                          try(delay.value.fixed_delay, null) == null
                          ? []
                          : [delay.value.fixed_delay]
                        )
                        content {
                          nanos   = try(fixed_delay.value.nanos, null)   # Must be from 0 to 999,999,999 inclusive
                          seconds = try(fixed_delay.value.seconds, null) # Must be from 0 to 315,576,000,000 inclusive
                        }
                      }
                    }
                  }
                }
              }

              dynamic "request_mirror_policy" {
                for_each = (
                  try(route_action.value.request_mirror_policy, null) == null
                  ? []
                  : [route_action.value.request_mirror_policy]
                )
                iterator = policy
                content {
                  backend_service = try(
                    google_compute_region_backend_service.backend_service[policy.value.backend_service].id,
                    policy.value.backend_service,
                    null
                  )
                }
              }

              dynamic "retry_policy" {
                for_each = (
                  try(route_action.value.retry_policy, null) == null
                  ? []
                  : [route_action.value.retry_policy]
                )
                iterator = policy
                content {
                  num_retries = try(policy.num_retries, null) # Must be > 0
                  # Valid values at https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/compute_url_map#retry_conditions
                  retry_conditions = try(policy.retry_conditions, null)

                  dynamic "per_try_timeout" {
                    for_each = (
                      try(policy.value.per_try_timeout, null) == null
                      ? []
                      : [policy.value.per_try_timeout]
                    )
                    iterator = timeout
                    content {
                      nanos   = try(timeout.value.nanos, null)   # Must be from 0 to 999,999,999 inclusive
                      seconds = try(timeout.value.seconds, null) # Must be from 0 to 315,576,000,000 inclusive
                    }
                  }
                }
              }

              dynamic "timeout" {
                for_each = (
                  try(route_action.value.timeout, null) == null
                  ? []
                  : [route_action.value.timeout]
                )
                content {
                  nanos   = try(timeout.value.nanos, null)   # Must be from 0 to 999,999,999 inclusive
                  seconds = try(timeout.value.seconds, null) # Must be from 0 to 315,576,000,000 inclusive
                }
              }

              dynamic "url_rewrite" {
                for_each = (
                  try(route_action.value.url_rewrite, null) == null
                  ? []
                  : [route_action.value.url_rewrite]
                )
                content {
                  host_rewrite        = try(url_rewrite.value.host_rewrite, null)        # Must be between 1 and 255 characters
                  path_prefix_rewrite = try(url_rewrite.value.path_prefix_rewrite, null) # Must be between 1 and 1024 characters
                }
              }

              dynamic "weighted_backend_services" {
                for_each = (
                  try(route_action.value.weighted_backend_services, null) == null
                  ? []
                  : [route_action.value.url_rewrite]
                )
                iterator = weighted
                content {
                  weight = try(weighted.value.weigth, null)
                  backend_service = try(
                    google_compute_region_backend_service.backend_service[weighted.value.backend_service].id,
                    weighted.value.backend_service,
                    null
                  )

                  dynamic "header_action" {
                    for_each = (
                      try(path_matcher.value.header_action, null) == null
                      ? [] :
                      [path_matcher.value.header_action]
                    )
                    content {
                      request_headers_to_remove  = try(header_action.value.request_headers_to_remove, null)
                      response_headers_to_remove = try(header_action.value.response_headers_to_remove, null)

                      dynamic "request_headers_to_add" {
                        for_each = (
                          try(header_action.value.request_headers_to_add, null) == null
                          ? []
                          : [header_action.value.request_headers_to_add]
                        )
                        content {
                          header_name  = try(request_headers_to_add.value.header_name, null)
                          header_value = try(request_headers_to_add.value.header_value, null)
                          replace      = try(request_headers_to_add.value.replace, null)
                        }
                      }

                      dynamic "response_headers_to_add" {
                        for_each = (
                          try(header_action.response_headers_to_add, null) == null
                          ? []
                          : [header_action.response_headers_to_add]
                        )
                        content {
                          header_name  = try(response_headers_to_add.value.header_name, null)
                          header_value = try(response_headers_to_add.value.header_value, null)
                          replace      = try(response_headers_to_add.value.replace, null)
                        }
                      }
                    }
                  }
                }
              }
            }
          }

          dynamic "url_redirect" {
            for_each = (
              try(route_rules.value.url_redirect, null) == null
              ? []
              : route_rules.value.url_redirect
            )
            content {
              host_redirect   = try(url_redirect.value.host_redirect, null) # Must be between 1 and 255 characters
              https_redirect  = try(url_redirect.value.https_redirect, null)
              path_redirect   = try(url_redirect.value.path_redirect, null)
              prefix_redirect = try(url_redirect.value.prefix_redirect, null) # Must be between 1 and 1024 characters
              # Valid valus at https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/compute_url_map#redirect_response_code
              redirect_response_code = try(url_redirect.value.redirect_response_code, null)
              strip_query            = try(url_redirect.value.strip_query, null)
            }
          }
        }
      }

      dynamic "default_url_redirect" {
        for_each = (
          try(path_matcher.value.default_url_redirect, null) == null
          ? []
          : path_matcher.value.default_url_redirect
        )
        content {
          host_redirect   = try(default_url_redirect.value.host_redirect, null) # Must be between 1 and 255 characters
          https_redirect  = try(default_url_redirect.value.https_redirect, null)
          path_redirect   = try(default_url_redirect.value.path_redirect, null)   # Must be between 1 and 1024 characters
          prefix_redirect = try(default_url_redirect.value.prefix_redirect, null) # Must be between 1 and 1024 characters
          # Valid values at https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/compute_url_map#redirect_response_code
          redirect_response_code = try(default_url_redirect.value.redirect_response_code, null)
          strip_query            = try(default_url_redirect.value.strip_query, null)
        }
      }
    }
  }

  # Up to 100 tests per url_map
  dynamic "test" {
    for_each = (
      try(var.url_map_config.tests, null) == null
      ? []
      : var.url_map_config.tests
    )
    content {
      description = try(test.value.description, null)
      host        = try(test.value.host, null)
      path        = try(test.value.path, null)
      service = try(
        google_compute_region_backend_service.backend_service[test.value.service].id,
        test.value.service,
        null
      )
    }
  }

  dynamic "default_url_redirect" {
    for_each = (
      try(var.url_map_config.default_url_redirect, null) == null
      ? []
      : [var.url_map_config.default_url_redirect]
    )
    content {
      host_redirect   = try(default_url_redirect.value.host_redirect, null) # Must be between 1 and 255 characters
      https_redirect  = try(default_url_redirect.value.https_redirect, null)
      path_redirect   = try(default_url_redirect.value.path_redirect, null)   # Must be between 1 and 1024 characters
      prefix_redirect = try(default_url_redirect.value.prefix_redirect, null) # Must be between 1 and 1024 characters
      # Valid values at https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/compute_url_map#redirect_response_code
      redirect_response_code = try(default_url_redirect.value.redirect_response_code, null)
      strip_query            = try(default_url_redirect.value.strip_query, null)
    }
  }
}
