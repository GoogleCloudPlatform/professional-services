#!/usr/bin/python
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

# Script name : main.py
# Parameter : update_labels.config
# Purpose: Add/Update labels on GCP project, compute engine, storage, bigtable and bigquery

import json
import logging
import sys

import access_setup
import create_resource_map
import label_file_sanity_check
from resource_label_updater import resource_label_updater


# noinspection PyShadowingNames,PyShadowingNames,PyShadowingNames,PyShadowingNames
def main(p_resource_type, p_sub_resource_type, r_proj_resource_zone_dict):
    """
    This method calls other methods to update labels based on the resource value in the line of the input label file.
    :param p_resource_type: resource_type e.g. project, compute engine, bigtable, bigquery, storage
    :param r_proj_resource_zone_dict: It is a nested dictionary having attributes of the resource for each resource type
    e.g. structure like this : # {
    key: resource type,
    value: { key: "project_id|resource_id|zone",
           value: { project_id: project1,
                    resource_id: resource1,
                    zone: zone1,
                    tags: {
                       key: label_key,
                       value: labels_value
                    }
             }
         }
 }
    :return: It doesn't return anything
    """
    for proj_resource_zone_key in r_proj_resource_zone_dict:
        param = dict()
        # noinspection PyShadowingNames,PyShadowingNames
        param['config_file'] = config_file
        param['projectid'] = r_proj_resource_zone_dict[proj_resource_zone_key]['project_id']
        param['resourceid'] = r_proj_resource_zone_dict[proj_resource_zone_key]['resource_id']
        param['sub_resource_id'] = r_proj_resource_zone_dict[proj_resource_zone_key]['sub_resource_id']
        param['zone'] = r_proj_resource_zone_dict[proj_resource_zone_key]['zone']
        param['tags'] = r_proj_resource_zone_dict[proj_resource_zone_key]['tags']
        param['sub_resource_type'] = p_sub_resource_type

        logging.debug("Using parameters: " + json.dumps(param))
        try:
            logging.debug("Updating " + p_resource_type)
            resource_label_updater.update_resource(p_resource_type, param)
            logging.debug(p_resource_type + " Updated Successfully")
        except Exception as inst:
            error_file.write(str(inst) + "\n")


def loop_through_dict_make_update(resource_type_dict):
    for resource_type in resource_type_dict:
        sub_resource_dict = resource_type_dict[resource_type]
        for sub_resource_type in sub_resource_dict.keys():
            resource_proj_resource_zone_dict = sub_resource_dict[sub_resource_type]
            logging.debug(json.dumps(resource_proj_resource_zone_dict))
            main(resource_type, sub_resource_type, resource_proj_resource_zone_dict)


if __name__ == "__main__":

    try:
        config_file = sys.argv[1]
    except IOError:
        print("Please provide config file as argument of the script")
        exit(1)

    # creating log file name with same basename as the script name
    scriptname = sys.argv[0]
    log_filename = access_setup.get_logfile_name(scriptname)
    logging.basicConfig(format='%(asctime)s %(message)s', filename=log_filename, level=logging.DEBUG)

    try:
        error_file = access_setup.create_error_file(scriptname)
        invalid_records_file = open('gcp_update_labels.report', 'w')

        logging.info('Reading the Labels File')
        # noinspection PyUnboundLocalVariable
        all_cells = access_setup.get_spreadsheet_cells(config_file)

        contains_header = access_setup.is_header(config_file)

        logging.info("Running Validation and creating map")

        try:
            resource_type_dict, invalid_record_cnt, total_record_cnt, invalid_record_list = create_resource_map.label_file_to_resource_type_dict(all_cells, contains_header)
            invalid_records_file.write("Total record count in label file: " + str(total_record_cnt) + "\n")
            invalid_records_file.write("Invalid record count : " + str(invalid_record_cnt) + "\n")

            percent_of_invalid_record_cnt = float(invalid_record_cnt) / float(total_record_cnt) * 100
            invalid_records_file.write("Percent of invalid record count : " + str(percent_of_invalid_record_cnt) + "%" + "\n")
            invalid_records_file.write("Invalid Records are below:" + "\n" + str(invalid_record_list) + "\n")

            logging.debug("Resource type dict is " + json.dumps(resource_type_dict))
            # loop through the dict to make updates
            loop_through_dict_make_update(resource_type_dict)

            logging.info("Total number of invalid records in label file : " + str(invalid_record_cnt))

            if percent_of_invalid_record_cnt > 0:
                error_msg = "Resource update script completed. Percent of invalid records = " + str(percent_of_invalid_record_cnt) + "% ! Only valid records are processed!"
                logging.error(error_msg)
                print (error_msg)
            else:
                logging.info("Resource update script completed. Please check error files for any error.")
                print("Resource update script completed. Please check error files for any error.")

        except Exception as inst:
            error_file.write(str(inst) + "\n")

    except Exception as inst:
        logging.error(str(inst) + "|" + "Error: All resources could not be updated! Please check.")
        # noinspection PyUnboundLocalVariable
        error_file.write(str(inst) + "\n")
        print (str(inst) + "|" + "Error: All resources could not be updated! Please check.")
        pass
    finally:
        error_file.close()



















