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
load("/config.lib.star", "include", "get_service")

def _to_generate(self):
  return include(data.values[self.service][self.sha], data.values.bundles)
end

def _params(self):
  return data.values[self.service][self.sha].params
end


def build_sha(sha):
  service = get_service(sha)
  sha = struct.make(service=service, sha=sha)
  sha = struct.make_and_bind(sha, to_generate= _to_generate, params=_params)
  return sha
end


