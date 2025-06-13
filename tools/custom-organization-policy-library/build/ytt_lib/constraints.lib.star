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
load("/config.lib.star", "include_constraint", "get_service")

def _constraint_name(self):
   return "organizations/" + data.values.organization + "/customConstraints/custom." + self.constraint
end

def _to_generate(self):
  return include_constraint(data.values[self.service][self.constraint], data.values.bundles)
end

def _params(self):
  return data.values[self.service][self.constraint].params
end


def build_constraint(constraint):
  service = get_service(constraint)
  constraint = struct.make(service=service, constraint=constraint)
  constraint = struct.make_and_bind(constraint, to_generate= _to_generate, constraint_name=_constraint_name, params=_params)
  return constraint
end


