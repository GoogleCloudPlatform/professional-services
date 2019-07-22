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

import validate_input_label_file_fields
import access_setup
import create_resource_map
import project_label_updater
import compute_engine_label_updater
import storage_label_updater
import bigtable_label_updater
import bigquery_label_updater

# -----------------------------------------------------------


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
        # noinspection PyShadowingNames,PyShadowingNames
        projectid = r_proj_resource_zone_dict[proj_resource_zone_key]['project_id']
        resourceid = r_proj_resource_zone_dict[proj_resource_zone_key]['resource_id']
        sub_resource_id = r_proj_resource_zone_dict[proj_resource_zone_key]['sub_resource_id']
        zone = r_proj_resource_zone_dict[proj_resource_zone_key]['zone']
        tags = r_proj_resource_zone_dict[proj_resource_zone_key]['tags']

        if p_resource_type == 'project':
            logging.info("Getting Project Detail and Updating")
            try:
                project_label_updater.project_label_updater(config_file, projectid, tags)
                logging.info("Project Updated Successfully")
            except Exception as inst:
                logging.error(inst)
                error_file.write(str(p_resource_type) + "|" + str(projectid) + "|" + str(resourceid) + "|" + str(zone)
                                 + "|" + str(tags) + "|" + str(inst) + '| Unable to update the Project Labels: '
                                 + projectid + "\n")
                continue

        elif p_resource_type == 'compute engine':
            logging.info("Updating Instances Labels")
            try:
                compute_engine_label_updater.gce_label_updater(config_file, projectid, resourceid, zone, tags)
                logging.info("Compute Engine Labels Updated Successfully")
            except Exception as inst:
                error_file.write(str(p_resource_type) + "|" + str(projectid) + "|" + str(resourceid) + "|" + str(zone)
                                 + "|" + str(tags) + "|" + str(inst)
                                 + '| Unable to update the Compute Engine Instance Labels: ' + resourceid + "\n")
                logging.error(inst)
                continue

        elif p_resource_type == 'storage':
            logging.info("Getting Bucket labels")
            try:
                storage_label_updater.storage_label_updater(resourceid, tags)
                logging.info("Storage Labels Updated Successfully")
            except Exception as inst:
                error_file.write(str(p_resource_type) + "|" + str(projectid) + "|" + str(resourceid) + "|" + str(zone)
                                 + "|" + str(tags) + "|" + str(inst) + '| Unable to update the Storage Labels: '
                                 + resourceid + "\n")
                logging.error(inst)
                continue

        elif p_resource_type == 'bigtable':
            logging.info('Updating Bigtable Labels')
            try:
                bigtable_label_updater.bigtable_label_updater(projectid, resourceid, tags)
                logging.info("Bigtable Labels Updated Successfully")
            except Exception as inst:
                error_file.write(str(p_resource_type) + "|" + str(projectid) + "|" + str(resourceid) + "|" + str(zone)
                                 + "|" + str(tags) + "|" + str(inst) + '| Unable to update the Bigtable Labels: '
                                 + resourceid + "\n")
                logging.error(inst)
                continue

        elif p_resource_type == 'bigquery' and (p_sub_resource_type == 'table' or p_sub_resource_type == 'view'):
            logging.info('Updating BigQuery Table Labels')
            try:
                bigquery_label_updater.bigquery_table_label_updater(config_file, projectid, resourceid, sub_resource_id,
                                                                    tags)
                logging.info("Bigquery Table/View Labels Updated Successfully")
            except Exception as inst:
                error_file.write(str(p_resource_type) + "|" + str(projectid) + "|" + str(resourceid) + "|" + str(zone)
                        + "|" + str(tags) + "|" + str(p_sub_resource_type) + "|" + str(sub_resource_id) + "|" +
                        str(inst) + '| Unable to update the Bigquery Table/View Labels: ' + sub_resource_id + "\n")
                logging.error(inst)
                continue

        elif p_resource_type == 'bigquery' and p_sub_resource_type == '_NULL_':
            logging.info('Updating BigQuery Dataset Labels')
            try:
                bigquery_label_updater.bigquery_label_updater(config_file, projectid, resourceid, tags)
                logging.info("Bigquery Dataset Labels Updated Successfully")
            except Exception as inst:
                error_file.write(str(p_resource_type) + "|" + str(projectid) + "|" + str(resourceid) + "|" + str(zone)
                                 + "|" + str(tags) + "|" + str(inst) + '| Unable to update the Bigquery Labels: '
                                 + resourceid + "\n")
                logging.error(inst)
                continue


# -----------------------------------------------------------

if __name__ == "__main__":

    try:
        config_file = sys.argv[1]
    except IOError:
        print("Please provide config file as argument of the script")
        exit(1)

    # creating log file name with same basename as the script name
    scriptname = sys.argv[0]
    log_filename = access_setup.get_logfile_name(scriptname)
    logging.basicConfig(format='%(asctime)s %(message)s', filename=log_filename, level=logging.INFO)

    try:
        error_file = access_setup.create_error_file(scriptname)

        logging.info('Reading the Config File')
        # noinspection PyUnboundLocalVariable
        all_cells = access_setup.get_spreadsheet_cells(config_file)
        contains_header = access_setup.is_header(config_file)

        line_index = 0

        print "Running Validation on Input Label File"
        logging.info("Running Validation on Input Label File")
        try:
            validate_input_label_file_fields.validate_fields(config_file)
        except ValueError as ve:
            pass

        print "Completed Validation on Input Label File"
        logging.info("Completed Validation on Input Label File")

        print "Running Label Updates"
        logging.info("Running Label Updates")

        #  start reading google sheets line by line and get resource name and add to the labels dictionary

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

                    # grouping the labels into a dictionary by resource_type.
                    resource_type_dict = create_resource_map.resource_map(projectid, resource,
                                            resourceid,  sub_resource, sub_resource_id, zone, resourcelabels)

                except Exception as inst:
                    logging.error(inst)
                    error_file.write(str(line) + '|' + str(inst) + "\n")
                    continue

            else:
                logging.warning("Skipping below line as not enough information")
                logging.warning(line)
                continue
        # end for loop

        # noinspection PyUnboundLocalVariable
        logging.info("Resource type dict is " + json.dumps(resource_type_dict))

        # loop through the dict to make updates
        for resource_type in resource_type_dict:
            sub_resource_dict = resource_type_dict[resource_type]
            for sub_resource_type in sub_resource_dict.keys():
                resource_proj_resource_zone_dict = sub_resource_dict[sub_resource_type]
                logging.info(json.dumps(resource_proj_resource_zone_dict))
                main(resource_type, sub_resource_type, resource_proj_resource_zone_dict)

        logging.info("Resource update script completed. Please check error files for any error.")
        print("Resource update script completed. Please check error files for any error.")
    except Exception as inst:
        logging.error("Error: All resources could not be updated! Please check.")
        # noinspection PyUnboundLocalVariable
        error_file.write(str(inst) + "\n")
        print ("Error: All resources could not be updated! Please check.")
        pass
    finally:
        error_file.close()



















