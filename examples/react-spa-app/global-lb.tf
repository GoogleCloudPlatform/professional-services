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

locals {
  route_rule_api = {
    description = "Send all backend traffic to our Cloud Function"
    match_rules = [
      {
        path = {
          value = "/api/"
          type  = "prefix"
        }
      }
    ]
    service  = "python-backend"
    priority = 50
    header_action = var.dns_config != null ? {
      response_add = {
        "Access-Control-Allow-Origin" = {
          # Be careful not to put a slash at the end in this
          value = format("https://%s.%s", var.dns_config.frontend, trimsuffix(module.dns[""].domain, "."))
        }
        "Access-Control-Allow-Methods" = {
          value = "POST, GET, OPTIONS"
        }
        "Access-Control-Allow-Headers" = {
          value = "Content-Type"
        }
        "Access-Control-Allow-Credentials" = {
          value = "true"
        }
      }
    } : {}

  }
  route_rule_frontend = {
    description = "Passthrough all static assets to the bucket"
    match_rules = [
      {
        path = {
          value = "/*.ico"
          type  = "template"
        }
      },
      {
        path = {
          value = "/*.png"
          type  = "template"
        }
      },
      {
        path = {
          value = "/*.json"
          type  = "template"
        }
      },
      {
        path = {
          value = "/*.txt"
          type  = "template"
        }
      },
      {
        path = {
          value = "/*.css"
          type  = "template"
        }
      },
      {
        path = {
          value = "/*.js"
          type  = "template"
        }
      },
    ]
    service = "gcs-static"
    header_action = {
      response_add = {
        "Content-Security-Policy" = {
          value = local.csp_header_global
        }
      }
    }
    priority = 60
  }
  route_rule_rewrite = {
    description = "Rewrite all non-static requests to index.html"
    match_rules = [
      {
        path = {
          value = "/**"
          type  = "template"
        }
      }
    ]
    service  = "gcs-static"
    priority = 100
    header_action = {
      response_add = {
        "Content-Security-Policy" = {
          value = local.csp_header_global
        }
      }
    }
    route_action = {
      url_rewrite = {
        path_template = "/index.html"
      }
    }
  }
}

module "xlb" {
  for_each            = toset(var.global_lb ? [""] : [])
  source              = "github.com/GoogleCloudPlatform/cloud-foundation-fabric//modules/net-lb-app-ext?ref=daily-2024.12.30"
  project_id          = module.project.project_id
  name                = var.lb_name
  use_classic_version = false
  backend_service_configs = {
    python-backend = {
      backends = [
        { backend = "python-backend-neg" },
      ]
      health_checks   = []
      port_name       = "http"
      security_policy = var.iap_config.enabled == false ? google_compute_security_policy.policy.id : null
      iap_config = var.iap_config.enabled == true ? {
        oauth2_client_id     = google_iap_client.project-client[""].client_id
        oauth2_client_secret = google_iap_client.project-client[""].secret
      } : null
    }
  }
  backend_buckets_config = {
    gcs-static = {
      bucket_name          = module.bucket.name
      enable_cdn           = var.enable_cdn
      edge_security_policy = google_compute_security_policy.edge-policy.id
    }
  }
  health_check_configs = {}

  urlmap_config = {
    default_service = "gcs-static"
    host_rules = var.dns_config != null ? [{
      hosts        = ["*"]
      path_matcher = "combined"
      }] : [
      {
        hosts        = [trimsuffix(format("%s.%s", var.dns_config.backend, module.dns[""].domain), ".")]
        path_matcher = "api"
      },
      {
        hosts        = ["*"]
        path_matcher = "frontend"
      }
    ]
    path_matchers = {
      combined = {
        default_service = "gcs-static"
        route_rules = [
          local.route_rule_api,
          local.route_rule_frontend,
          local.route_rule_rewrite,
        ]
      }
      api = {
        default_service = "gcs-static"
        route_rules = [
          local.route_rule_api,
        ]
      }
      frontend = {
        default_service = "gcs-static"
        route_rules = [
          local.route_rule_frontend,
          local.route_rule_rewrite,
        ]
      }
    }
  }

  neg_configs = {
    python-backend-neg = {
      cloudrun = {
        region = var.region
        target_service = {
          name = module.backend.function_name
        }
      }
    }
  }

  protocol = var.dns_config != null ? "HTTPS" : "HTTP"
  ssl_certificates = var.dns_config != null ? {
    managed_configs = {
      default = {
        domains = [
          trimsuffix(format("%s.%s", var.dns_config.frontend, module.dns[""].domain), "."),
          trimsuffix(format("%s.%s", var.dns_config.backend, module.dns[""].domain), ".")
        ]
      }
    }
  } : null
}
