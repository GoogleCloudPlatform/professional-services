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
load("/config.lib.star", "include")

def _to_generate(self):
  return include(data.values["alerts"][self.alert], data.values.bundles)
end

def _params(self):
  return data.values["alerts"][self.alert].params
end

def _has_notification_channels(self):
  return len(data.values.notification_channels) >= 1 and data.values.notification_channels[0] != ""
end

def _log_bucket_name(self):
  return data.values["log_bucket_name"]
end

def build_alert(alert):
  alert = struct.make(alert=alert)
  alert = struct.make_and_bind(alert, to_generate= _to_generate, params=_params, has_notification_channels=_has_notification_channels, log_bucket_name=_log_bucket_name)
  return alert
end


