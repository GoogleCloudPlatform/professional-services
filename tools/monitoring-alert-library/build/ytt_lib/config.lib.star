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
# - No bundle defined, constraint is generated except if specifically "skip"
# - Bundle defined, constraint is not generated except if specifically "include" or part of the bundle
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


