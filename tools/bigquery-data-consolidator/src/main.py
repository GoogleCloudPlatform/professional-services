# Copyright 2023 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""
Python utility to invoke separate utility in Python to copy all 
required tables, like Cost Exports, into a single dataset for Analytics. 

Created for the sake of dataset/table consolidations for easy one-stop reporting 
using Looker, Looker Studio, or any other BI systems on GCP or on-prem. 

Useful for copying data from multiple projects under same organization into 
single project/dataset/table for analysis and all related use cases. 
"""

# import all regular libraries.
import sys
import logging 
from time import sleep

# import Google cloud libraries
from google.cloud import bigquery
from google.oauth2 import service_account

# import all required custom developed modules.
import list_all_projects
import list_datasets
import list_tables_in_dataset
import copy_bq_table

# setting logging behavior 
logging.basicConfig(format='%(asctime)s - %(levelname)s - %(message)s', datefmt='%d-%b-%y %H:%M:%S', level=logging.INFO)

# print starting log. 
logging.info("GCP BigQuery Tables Consolidator!")

# check and act basis if we have received all input parameters. 
if len(sys.argv) < 7:
    logging.error("One or more input parameters are missing. Please check README file for details.")
    exit(1)
elif len(sys.argv) == 7:
    logging.info("All input parameters recieved.")

# store input parameter
org_id = sys.argv[1]
consolidation_project = sys.argv[2]
consolidation_dataset = sys.argv[3]
consolidation_table = sys.argv[4]
which_table_to_find = sys.argv[5]
key_file_loc = sys.argv[6]

# create empty set for final set of source tables to be copied.
list_of_source_tables = set()

# create empty set to store datasets in applicable projects where we have data. 
datasets_in_project = set()

# create empty sets to store any or all errors. 
errors_in_listing_datasets = set()
errors_in_copy_table = set()
errors_in_copy_stg_table = set()

# counter for loading data into staging tables. 
copy_counter = 1

# create empty set for list of staging tables. 
list_stg_tables = set() 

# Generate the required credentials
credentials = service_account.Credentials.from_service_account_file(key_file_loc)

# delete the target table, if it exists
client = bigquery.Client(credentials=credentials)
target_table = consolidation_project + '.' + consolidation_dataset + '.' + consolidation_table
logging.info("Truncating target table:" + target_table)
client.delete_table(target_table, not_found_ok=True, timeout=60)
logging.info("Target table truncated.")

# fetch list of all projects and datasets
logging.info("Finding list of all projects in our Organization.")
all_projects = set(list_all_projects.list_projects(key_file_loc, org_id))
logging.info("List of projects found.")

# for each project (other than the consolidation/target project)
logging.info("Checking for matching tables in each Project. ")
for each_project in all_projects:
    logging.info("Checking details for project:" + each_project)

    # list all datasets in this/each project
    # handle errors for cases where the BigQuery API is not enabled in the project! 
    try:
        client = bigquery.Client(credentials=credentials, project=each_project)
        datasets_in_project = set(list_datasets.dataset_list(client))
    except Exception as err:
        logging.error("Error loading datasets in project: " + each_project)
        logging.error("It may be that the BigQuery API is not enabled! The actual error is as under:")
        logging.error(err)
        errors_in_listing_datasets.add(err)
        continue 
    
    # for each dataset (other than the consolidated/target dataset)
    for each_dataset in datasets_in_project:
        # optional print: only for debugging
        # print(each_dataset)
      
        # loop through each project.dataset and list the tables
        tables_list = list_tables_in_dataset.list_all_tables(client, each_project, each_dataset)

        # for tables matching an input criteria, create a final list of source tables to be copied.
        for each_table in tables_list:
            if each_table.find(which_table_to_find) != -1:
                #if ((each_project != consolidation_project) and (each_dataset != consolidation_dataset) and (each_table != consolidation_table)):
                if (each_table != consolidation_table):
                    # optional print: useful for debug
                    # print(each_project + "." + each_dataset + "." + each_table)
                    # append the final list of source tables
                    table_to_copy = each_project + "." + each_dataset + "." + each_table
                    list_of_source_tables.add(table_to_copy)
                    logging.info("Copying data for table: " + table_to_copy)
                    try:
                        # name a staging table in target dataset
                        stg_tbl = consolidation_project + "." + consolidation_dataset + "." + consolidation_table + "_" + str(copy_counter)

                        # calling the copy operation. 
                        copy_bq_table.copy_table(client, table_to_copy, stg_tbl)
                        sleep(5) # sleep timer for copy table to continue properly
                        logging.info("Transfer completed to staging table:" + stg_tbl + " for source table:" + table_to_copy)
                        
                        # add the STG table name into the list of STG Tables. 
                        list_stg_tables.add(stg_tbl)

                        # increase the table counter. 
                        copy_counter += 1 
                    except Exception as err:
                        logging.error("Error copying data for target tables.")
                        logging.error("It may be that the Service Account lacks permissions! The actual error is as under:")
                        logging.error(err)
                        errors_in_copy_table.add(err)
  

# If there was no copy, then the list of tables is empty.
# display error, or print the list of tables we tried to copy/transfer. 
if len(list_of_source_tables) == 0:
    logging.error("No tables' list generated. Either the search string is incorrect, or our Service account is missing permissions!")
else:
    logging.info("Tables list was generated. For reference, here is a list of all tables.")
    # this is optional: is only here for Logging purposes. 
    for each_table in list_of_source_tables:
        print(each_table)

# perform actual copy data operation. 
try: 
    # calling the copy operation --> from STG table to Target table. 
    copy_bq_table.copy_table(client, list(list_stg_tables), target_table)
    logging.info("Transfer completed for STG tables.")
except Exception as err:
    # print the error and save it too. 
    logging.error("Error copying data for staging table.")
    logging.error("It may be that the Service Account lacks permissions! The actual error is as under:")
    logging.error(err)
    errors_in_copy_stg_table.add(err)

# print all errors in the execution. 
# ideally, this part should be commented. 
logging.info("Printing all errors which we got during listing datasets with our choice of table.")
for each_error in errors_in_listing_datasets:
    print(each_error)
logging.info("Printing all errors which we got during copying data into target table.")
for each_error in errors_in_copy_table:
    print(each_error) 

# finally, removing all staging tables. 
for each_stg in list_stg_tables:
    client.delete_table(each_stg, not_found_ok=True, timeout=60)
logging.info("Removed all staging tables from the target project/dataset.")

# End of program logging
logging.info("End.")

# End of program.
