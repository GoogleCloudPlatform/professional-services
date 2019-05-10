#!/usr/bin/python

import sys
import access_setup
import logging
import gcp_update_labels

config_file = sys.argv[1]


def validate_fields(config_file):
    error_file = open("validate_gcp_update_labels.err", 'w')
    access_setup.access_set_up(config_file)
    all_cells = access_setup.get_spreadsheet_cells(config_file)
    contains_header = access_setup.is_header(config_file)

    line_index = 0

    for line in all_cells:
        if contains_header == "Y" and line_index == 0:
            line_index = line_index + 1
            continue

        # if project id and label both are not given then the record cannot be processed
        if line:

                projectid = line[0].strip()
                resource = line[1].strip()
                resourceid = line[2].strip()
                zone = line[4].strip()

                if resource == "project" and not projectid:
                    error_file.write (resource + "|" + str(line) + " | projectid is None" + "\n")
                    logging.error(resource + "|" + str(line) + '| Please provide the required fields for Project.' + "\n")
                    print(resource + "|" + str(line) + '| Please provide the required fields for Project.')
                    exit(1)

                elif resource == "compute engine" and (not projectid or not resourceid or not zone):
                    error_file.write (resource + "|" + str(line) + " | resourceid is None" + "\n")
                    logging.error(resource + "|" + str(line) + '| Please provide the required fields for Compute Engine.' + "\n")
                    print(resource + "|" + str(line) + '| Please provide the required fields for Compute Engine.')
                    exit(1)

                elif (resource == "storage" or resource == "bigtable" or resource == "bigquery") and (not projectid or not resourceid):
                    error_file.write (resource + "|" + str(line) + " | resourceid is None" + "\n")
                    logging.error(resource + "|" + str(line) + "| Please provide the required fields for Resource." + "\n")
                    print(resource + "|" + str(line) + "| Please provide the required fields for Resource.")

                elif (resource == ''):
                    error_file.write (resource + "|" + str(line) + " | resource field is None. You may remove this line, otherwise it will just be skipped." + "\n")
                    logging.error("The Resource field is empty. You may remove this line, otherwise it will just be skipped." + "\n")
                    print("The Resource field is empty. You may remove this line, otherwise it will just be skipped.")

                line_index = line_index + 1

    logging.info ("\n" + "Completed validating " + str(line_index) + " lines in input label file.")

