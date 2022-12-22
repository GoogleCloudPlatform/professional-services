#
# Copyright 2022 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

from google.protobuf import field_mask_pb2


def get_routers(config):
  '''
    Returns a dictionary of all Cloud Routers in the GCP organization.

      Parameters:
        config (dict): The dict containing config like clients and limits
      Returns:
        routers_dict (dictionary of string: list of string): Key is the network link and value is a list of router links.
  '''

  read_mask = field_mask_pb2.FieldMask()
  read_mask.FromJsonString('name,versionedResources')

  routers_dict = {}

  response = config["clients"]["asset_client"].search_all_resources(
      request={
          "scope": f"organizations/{config['organization']}",
          "asset_types": ["compute.googleapis.com/Router"],
          "read_mask": read_mask,
          "page_size": config["page_size"],
      })
  for resource in response:
    network_link = None
    router_link = None
    for versioned in resource.versioned_resources:
      for field_name, field_value in versioned.resource.items():
        if field_name == "network":
          network_link = field_value
        if field_name == "selfLink":
          router_link = field_value

    if network_link in routers_dict:
      routers_dict[network_link].append(router_link)
    else:
      routers_dict[network_link] = [router_link]

  return routers_dict
