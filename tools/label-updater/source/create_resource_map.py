# Copyright 2019 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#         http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


# creating the map by grouping all records of same same resource type and resource id
# key: resource type, value:  {"project_id": "project 1", "resource_id": "resource 1",
#                                                                             "zone": "zone 1", "labels_dict": {}}

# {
#  key: resource type,
#  value: { key: "project_id|resource_id|zone",
#           value: { project_id: project1,
#                    resource_id: resource1,
#                    zone: zone1,
#                    tags: {
#                       key: label_key,
#                       value: labels_value
#                    }
#             }
#         }
# }

import label_file_sanity_check

def label_file_to_resource_type_dict(all_cells, contains_header):
    resource_type_dict = {}
    line_index = 0
    invalid_record_cnt = 0
    total_record_cnt = 0
    invalid_record_list = list()

    for line in all_cells:
        # Skip first line
        if contains_header == "Y" and line_index == 0:
            line_index = line_index + 1
            continue

        # if project id and label both are not given then the record cannot be processed
        if line:
            try:
                projectid = line[0].strip()
                resource = line[1].strip()
                resourceid = line[2].strip()
                resourcelabels = line[6].strip()

                if line[5]:
                    zone = line[5].strip()
                else:
                    zone = ''

                if line[3]:
                    sub_resource = line[3].strip()
                else:
                    sub_resource = '_NULL_'

                if line[4]:
                    sub_resource_id = line[4].strip()
                else:
                    sub_resource_id = ''

                total_record_cnt += 1

                invalid_record_flag, invalid_record = label_file_sanity_check.sanity_check_fields(line, projectid, resource,
                                                    resourceid, sub_resource, sub_resource_id, zone)
                if invalid_record_flag == False:
                    # grouping the labels into a dictionary by resource_type.
                    resource_type_dict = resource_map(projectid, resource, resourceid, sub_resource, sub_resource_id,
                                                  zone, resourcelabels, resource_type_dict)
                else:
                    invalid_record_cnt += 1

                    invalid_record_list.append(invalid_record)

            except Exception as inst:

                err_msg = str(line) + '|' + str(inst)

                raise Exception(err_msg)

    return resource_type_dict, invalid_record_cnt, total_record_cnt, invalid_record_list


def resource_map(projectid, resource, resourceid, sub_resource, sub_resource_id, zone, resourcelabels, resource_type_dict):
    """
    Appends each line from label file into a nested dictionary to be used for update all at once.
    :param projectid: project id e.g. cardinal-data-piper-sbx
    :param resource: resource type e.g. project, compute engine, storage, bigtable, bigquery
    :param resourceid: id/name of that resource e.g. project id for project resource, instance id
    for compute engine resource
    :param zone: zone for the resource if applicable e.g. us-west2-a
    :param resourcelabels: key-value pair of the labels e.g. env:dev
    :return: It returns resource_type_dict, which is a nested dictionary of the above values combined
    """
    label_key, label_value = resourcelabels.split(":")

    proj_resource_zone_key = projectid + "|" + resourceid + "|" + sub_resource_id + "|" + zone

    if resource not in resource_type_dict.keys():
        resource_type_dict[resource] = dict()

    if sub_resource not in resource_type_dict[resource].keys():
        resource_type_dict[resource][sub_resource] = dict()

    if proj_resource_zone_key not in resource_type_dict[resource][sub_resource].keys():
        resource_type_dict[resource][sub_resource][proj_resource_zone_key] = dict()

    if 'tags' not in resource_type_dict[resource][sub_resource][proj_resource_zone_key].keys():
        resource_type_dict[resource][sub_resource][proj_resource_zone_key]['tags'] = dict()

    resource_type_dict[resource][sub_resource][proj_resource_zone_key]['project_id'] = projectid
    resource_type_dict[resource][sub_resource][proj_resource_zone_key]['resource_id'] = resourceid
    resource_type_dict[resource][sub_resource][proj_resource_zone_key]['sub_resource_id'] = sub_resource_id
    resource_type_dict[resource][sub_resource][proj_resource_zone_key]['zone'] = zone
    resource_type_dict[resource][sub_resource][proj_resource_zone_key]['tags'][label_key.strip()] = label_value.strip()

    return resource_type_dict
