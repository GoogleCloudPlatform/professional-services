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

import sys
import access_setup
import logging

config_file = sys.argv[1]


# noinspection PyShadowingNames
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
            zone = line[5].strip()

            if resource is not None and resource.strip().lower() in ('project', 'compute engine', 'bigquery',
                                                                     'bigtable', 'storage'):

                if resource == "project" and not projectid:
                    error_file.append(resource + "|" + str(line) + " | projectid is None" + "\n")
                    logging.error(resource + "|" + str(line) + '| Please provide the required fields for Project.'
                                  + "\n")
                    print(resource + "|" + str(line) + '| Please provide the required fields for Project.')

                elif resource == "compute engine" and (not projectid or not resourceid or not zone):
                    error_file.append(resource + "|" + str(line) + " | resourceid is None" + "\n")
                    logging.error(resource + "|" + str(line) + '| Please provide the required fields '
                                                               'for Compute Engine.' + "\n")
                    print(resource + "|" + str(line) + '| Please provide the required fields for Compute Engine.')

                elif (resource == "storage" or resource == "bigtable" or resource == "bigquery") and \
                        (not projectid or not resourceid):
                    error_file.append(resource + "|" + str(line) + " | resourceid is None" + "\n")
                    logging.error(resource + "|" + str(line) + "| Please provide the required fields "
                                                               "for Resource." + "\n")
                    print(resource + "|" + str(line) + "| Please provide the required fields for Resource.")

            else:
                error_file.write(resource + "|" + str(line) + " | resource field is empty or invalid, "
                                                              "it will just be skipped." + "\n")
                logging.error(resource + "|" + str(line) + "The Resource field is empty or invalid, "
                                                           "it will just be skipped." + "\n")
                print(resource + "|" + str(line) + "The Resource field is empty or invalid, it will just be skipped.")

            line_index = line_index + 1

    logging.info("\n" + "Completed validating " + str(line_index) + " lines in input label file.")

