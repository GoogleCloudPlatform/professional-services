#  Copyright 2024 Google LLC
#
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.

load("@ytt:data", "data")
load("@ytt:struct", "struct")

services = [
  "artifactregistry",
  "bigquery",
  "cloudbuild",
  "cloudfunctions",
  "cloudkms",
  "cloudresourcemanager",
  "cloudrun", 
  "cloudsql",
  "compute", 
  "dataproc",
  "firewall", 
  "gke", 
  "iam",
  "logging",
  "network", 
  "secretmanager",
  "serviceusage",
  "storage",
  ]

# Retrieve the service associated with the constraint
# computeAllowedInstanceLabels -> compute
# firewallEnforceNamingConvention -> firewall
def get_service(constraint):
  for service in services:
      if constraint.startswith(service):
        return service
      end
  end
  return "not-found"
end

# Check if at least one of the bundles is enabled
def has_bundle(bundles):
  for bundle in bundles:
    if bundles[bundle]:
       return True
     end
   end
   return False
end

# Check if the constraint the and the policy should be included in the generation
# Behavior is:
# - No bundle definied, constraint is generated except if specifically "skip"
# - Bundle definied, constraint is not generated except if specifically "include" or part of the bundle
def include(constraint, bundles):
  if not has_bundle(bundles):
    return constraint["generation"] == "default" or constraint["generation"] == "include" 
  end

  # Bundle defined
  if constraint["generation"] == "include":
    return True
  end
  if constraint["generation"] == "skip":
    return False
  end

  # Default value, checking if constraint is include in bundle
  for bundle in bundles:
    if not bundles[bundle]:
      continue
     end
     if constraint.bundles[bundle]:
       return True
     end
  end
  return False
end

# Generate final config that has been used to generate the constraint and policies
# This can be used as file to know what is included and what is excluded
def generate_config():
  config = {}
  values = struct.decode(data.values)

  for service in services:
    if values.get(service) == None: 
      continue
    end

    config[service] = {}
    for name in values[service]:
      constraint = values[service][name] 

      if include(constraint, values["bundles"]):
        # Remove information not relevant for endusers
        constraint.pop("generation") 
        constraint.pop("bundles")
        config[service][name] = constraint  
      end
    end
  end
  return config
end



