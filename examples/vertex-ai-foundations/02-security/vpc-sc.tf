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
  _perimeter_names = ["dev", "landing", "prod"]
  # dereference perimeter egress policy names to the actual objects
  _vpc_sc_perimeter_egress_policies = {
    for k, v in coalesce(var.vpc_sc_perimeter_egress_policies, {}) :
    k => [
      for i in coalesce(v, []) : var.vpc_sc_egress_policies[i]
      if lookup(var.vpc_sc_egress_policies, i, null) != null
    ]
  }
  # dereference perimeter ingress policy names to the actual objects
  _vpc_sc_perimeter_ingress_policies = {
    for k, v in coalesce(var.vpc_sc_perimeter_ingress_policies, {}) :
    k => [
      for i in coalesce(v, []) : var.vpc_sc_ingress_policies[i]
      if lookup(var.vpc_sc_ingress_policies, i, null) != null
    ]
  }
  # compute the number of projects in each perimeter to detect which to create
  vpc_sc_counts = {
    for k in local._perimeter_names : k => length(
      local.vpc_sc_perimeter_projects[k]
    )
  }
  # define dry run spec at file level for convenience
  vpc_sc_explicit_dry_run_spec = true
  # compute perimeter bridge resources (projects)
  vpc_sc_p_bridge_resources = {
    landing_to_dev = concat(
      local.vpc_sc_perimeter_projects.landing,
      local.vpc_sc_perimeter_projects.dev
    )
    landing_to_prod = concat(
      local.vpc_sc_perimeter_projects.landing,
      local.vpc_sc_perimeter_projects.prod
    )
  }
  # computer perimeter regular specs / status
  vpc_sc_p_regular_specs = {
    dev = {
      access_levels = coalesce(
        try(var.vpc_sc_perimeter_access_levels.dev, null), []
      )
      resources           = local.vpc_sc_perimeter_projects.dev
      restricted_services = local.vpc_sc_restricted_services
      egress_policies = try(
        local._vpc_sc_perimeter_egress_policies.dev, null
      )
      ingress_policies = try(
        local._vpc_sc_perimeter_ingress_policies.dev, null
      )
      vpc_accessible_services = null
      # vpc_accessible_services = {
      #   allowed_services   = ["RESTRICTED-SERVICES"]
      #   enable_restriction = true
      # }
    }
    landing = {
      access_levels = coalesce(
        try(var.vpc_sc_perimeter_access_levels.landing, null), []
      )
      resources           = local.vpc_sc_perimeter_projects.landing
      restricted_services = local.vpc_sc_restricted_services
      egress_policies = try(
        local._vpc_sc_perimeter_egress_policies.landing, null
      )
      ingress_policies = try(
        local._vpc_sc_perimeter_ingress_policies.landing, null
      )
      vpc_accessible_services = null
      # vpc_accessible_services = {
      #   allowed_services   = ["RESTRICTED-SERVICES"]
      #   enable_restriction = true
      # }
    }
    prod = {
      access_levels = coalesce(
        try(var.vpc_sc_perimeter_access_levels.prod, null), []
      )
      # combine the security project, and any specified in the variable
      resources           = local.vpc_sc_perimeter_projects.prod
      restricted_services = local.vpc_sc_restricted_services
      egress_policies = try(
        local._vpc_sc_perimeter_egress_policies.prod, null
      )
      ingress_policies = try(
        local._vpc_sc_perimeter_ingress_policies.prod, null
      )
      vpc_accessible_services = null
      # vpc_accessible_services = {
      #   allowed_services   = ["RESTRICTED-SERVICES"]
      #   enable_restriction = true
      # }
    }
  }
  # account for null values in variable
  vpc_sc_perimeter_projects = (
    var.vpc_sc_perimeter_projects == null ?
    {
      for k in local._perimeter_names : k => []
    }
    : {
      for k in local._perimeter_names : k => (
        var.vpc_sc_perimeter_projects[k] == null
        ? []
        : var.vpc_sc_perimeter_projects[k]
      )
    }
  )
  # get the list of restricted services from the yaml file
  vpc_sc_restricted_services = yamldecode(
    file("${path.module}/vpc-sc-restricted-services.yaml")
  )
}

module "vpc-sc" {
  source = "../modules/vpc-sc"
  # only enable if we have projects defined for perimeters
  count         = anytrue([for k, v in local.vpc_sc_counts : v > 0]) ? 1 : 0
  access_policy = null
  access_policy_create = {
    parent = "organizations/${var.organization.id}"
    title  = "default"
  }
  access_levels = coalesce(try(var.vpc_sc_access_levels, null), {})
  # bridge type perimeters
  service_perimeters_bridge = merge(
    # landing to dev, only we have projects in landing and dev perimeters
    local.vpc_sc_counts.landing * local.vpc_sc_counts.dev == 0 ? {} : {
      landing_to_dev = {
        spec_resources            = local.vpc_sc_p_bridge_resources.landing_to_dev
        status_resources          = null
        use_explicit_dry_run_spec = local.vpc_sc_explicit_dry_run_spec
      }
    },
    # landing to prod, only we have projects in landing and prod perimeters
    local.vpc_sc_counts.landing * local.vpc_sc_counts.prod == 0 ? {} : {
      landing_to_prod = {
        spec_resources            = local.vpc_sc_p_bridge_resources.landing_to_prod
        status_resources          = null
        use_explicit_dry_run_spec = local.vpc_sc_explicit_dry_run_spec
      }
    }
  )
  # regular type perimeters
  service_perimeters_regular = merge(
    # dev if we have projects in var.vpc_sc_perimeter_projects.dev
    local.vpc_sc_counts.dev == 0 ? {} : {
      dev = {
        spec                      = local.vpc_sc_p_regular_specs.dev
        status                    = null
        use_explicit_dry_run_spec = local.vpc_sc_explicit_dry_run_spec
      }
    },
    # landing if we have projects in var.vpc_sc_perimeter_projects.landing
    local.vpc_sc_counts.landing == 0 ? {} : {
      landing = {
        spec                      = local.vpc_sc_p_regular_specs.landing
        status                    = null
        use_explicit_dry_run_spec = local.vpc_sc_explicit_dry_run_spec
      }
    },
    # prod if we have projects in var.vpc_sc_perimeter_projects.prod
    local.vpc_sc_counts.prod == 0 ? {} : {
      prod = {
        spec                      = local.vpc_sc_p_regular_specs.prod
        status                    = null
        use_explicit_dry_run_spec = local.vpc_sc_explicit_dry_run_spec
      }
    },
  )
}
