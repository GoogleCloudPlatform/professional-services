#!/usr/bin/python

# Script name : gcp_update_labels.py
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
# this is the method from where different other methods are being called based on the resource_type information in input label file


def process_update(resource_type, r_proj_resource_zone_dict):
    for proj_resource_zone_key in r_proj_resource_zone_dict:
        projectid = r_proj_resource_zone_dict[proj_resource_zone_key]['project_id']
        resourceid = r_proj_resource_zone_dict[proj_resource_zone_key]['resource_id']
        zone = r_proj_resource_zone_dict[proj_resource_zone_key]['zone']
        tags = r_proj_resource_zone_dict[proj_resource_zone_key]['tags']

        if resource_type == 'project':
            logging.info("Getting Project Detail and Updating")
            try:
                project_label_updater.project_label_updater(config_file, projectid, tags)
                logging.info("Project Updated Successfully")
            except Exception as inst:
                logging.warning(inst)
                error_file.write(str(line) + "|" + str(inst) + '| Unable to update the Project Labels: ' + projectid + "\n")
                exit(1)

        elif resource_type == 'compute engine':
            logging.info("Updating Instances Labels")
            try:
                compute_engine_label_updater.gce_label_updater(config_file, projectid, resourceid, zone, tags)
                logging.info ("Compute Engine Labels Updated Successfully")
            except Exception as inst:
                error_file.write(str(line) + "|" + str(inst) + '| Unable to update the Compute Engine Instance Labels: ' + resourceid + "\n")
                logging.error(inst)
                exit(1)

        elif resource_type == 'storage':
            logging.info("Getting Bucket labels")
            try:
                storage_label_updater.storage_label_updater(resourceid, tags)
                logging.info("Storage Labels Updated Successfully")
            except Exception as inst:
                error_file.write(str(line) + "|" + str(inst) + '| Unable to update the Storage Labels: ' + resourceid + "\n")
                logging.error(inst)
                exit(1)

        elif resource_type == 'bigtable':
            logging.info('Updating Bigtable Labels')
            try:
                bigtable_label_updater.bigtable_label_updater(projectid, resourceid, tags)
                logging.info("Bigtable Labels Updated Successfully")
            except Exception as inst:
                error_file.write(str(line) + "|" + str(inst) + '| Unable to update the Bigtable Labels: ' + resourceid + "\n")
                logging.error(inst)
                exit(1)

        elif resource_type == 'bigquery':
            logging.info('Updating BigQuery Labels')
            try:
                bigquery_label_updater.bigquery_label_updater(config_file, projectid, resourceid, tags)
                logging.info("Bigquery Labels Updated Successfully")
            except Exception as inst:
                error_file.write(str(line) + "|" + str(inst) + '| Unable to update the Bigquery Labels: ' + resourceid + "\n")
                logging.error(inst)
                exit(1)


# -----------------------------------------------------------

if __name__ == "__main__":

    try:
        config_file = sys.argv[1]
    except IOError:
        print("Please provide config file as argument of the script")
        exit(1)

    #creating log file name with same basename as the script name
    scriptname = sys.argv[0]
    log_filename = access_setup.get_logfile_name(scriptname)
    logging.basicConfig(format='%(asctime)s %(message)s', filename=log_filename, level=logging.INFO)

    error_file = access_setup.create_error_file(scriptname)

    logging.info('Reading the Config File')
    all_cells = access_setup.get_spreadsheet_cells(config_file)
    contains_header = access_setup.is_header(config_file)

    line_index = 0

    print "Running Validation on Input Label File"
    logging.info("Running Validation on Input Label File")
    validate_input_label_file_fields.validate_fields(config_file)

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
                resourcelabels = line[3].strip()

                if line[4]:
                    zone = line[4].strip()
                else:
                    zone = ''

                # grouping the labels into a dictionary by resource_type.
                resource_type_dict = create_resource_map.resource_map(projectid, resource, resourceid, zone, resourcelabels)

            except Exception as inst:
                logging.error(inst)
                error_file.write(str(line) + '|' + str(inst))
                continue

        else:
            logging.warning("Skipping below line as not enough information")
            logging.warning(line)
            continue
    # end for loop

    logging.info("Resource type dict is " + json.dumps(resource_type_dict))

    # loop through the dict to make updates
    for resource_type in resource_type_dict:
        resource_proj_resource_zone_dict = resource_type_dict[resource_type]
        logging.info (json.dumps(resource_proj_resource_zone_dict))
        process_update(resource_type, resource_proj_resource_zone_dict)

    logging.info("All resources updated successfully")
    print("All resources updated successfully")
    error_file.close()



















