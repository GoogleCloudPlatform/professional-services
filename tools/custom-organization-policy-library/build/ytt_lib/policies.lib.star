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
load("/config.lib.star", "include_policy", "get_service")

def _name(self):
  if data.values.deployment and  data.values.deployment.parent != "":
    return data.values.deployment.parent + "/policies/custom." + self.name
  end
  return "organizations/" + data.values.organization + "/policies/custom." + self.name
end

def _to_generate(self):
  service = get_service(self.name)
  return include_policy(data.values[service][self.name], data.values.bundles)
end

def _filename(self):
  return "custom." + self.name + ".yaml"
end

def _service(self):
  return get_service(self.name)
end

def build_policy(name):
  policy = struct.make(name=name)
  policy = struct.make_and_bind(policy, name=_name, filename=_filename, service=_service, to_generate= _to_generate)
  return policy
end


