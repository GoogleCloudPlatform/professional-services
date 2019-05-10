
resource_type_dict = {}

# creating the map by grouping all records of same same resource type and resource id
# key: resource type, value:  {"project_id": "project 1", "resource_id": "resource 1", "zone": "zone 1", "labels_dict": {}}

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


def resource_map(projectid, resource, resourceid, zone, resourcelabels):
    label_key, label_value = resourcelabels.split(":")

    proj_resource_zone_key = projectid + "|" + resourceid + "|" + zone

    if resource not in resource_type_dict.keys():
        resource_type_dict[resource] = dict()

    if proj_resource_zone_key not in resource_type_dict[resource].keys():
        resource_type_dict[resource][proj_resource_zone_key] = dict()

    if 'tags' not in resource_type_dict[resource][proj_resource_zone_key].keys():
        resource_type_dict[resource][proj_resource_zone_key]['tags'] = dict()

    resource_type_dict[resource][proj_resource_zone_key]['project_id'] = projectid
    resource_type_dict[resource][proj_resource_zone_key]['resource_id'] = resourceid
    resource_type_dict[resource][proj_resource_zone_key]['zone'] = zone
    resource_type_dict[resource][proj_resource_zone_key]['tags'][label_key.strip()] = label_value.strip()
    return resource_type_dict