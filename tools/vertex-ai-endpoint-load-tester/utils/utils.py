# Copyright 2024 Google LLC
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

#
# Set of utilities to
# assist running the
# load tester utility.
#
# Authors: ajitsonawane@,suddhasatwa@
# Team:    Google Cloud Consulting
# Date:    25.01.2024
#

# Imports
import logging
import datetime
import time
import os
import json
from subprocess import Popen, PIPE
from os.path import dirname,  realpath
import configparser

import pandas as pd

# Utility function to store records
# in the provided BigQuery table
def write_results_to_bq(records, table, project, log_level):
    """
    Writes results of load testing to BQ Table
    in a specific format, like a dataframe.

    Input:
        records: entries to be written in the target table
        table: the table in BigQuery to write the results (format: dataset.table)
        project: the GCP project where the table exists
        log_level: level of logging
    
    Output:
        ret_code: 1 for success, 0 for failure

    """

    # set logging preferences
    logging.basicConfig(level=log_level, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")

    # start log
    logging.info("Writing output to BigQuery")

    # say how many results are being written
    logging.info("Writing %d records in BigQuery table", len(records))
    
    try:
        # create dataframe with records
        df = pd.json_normalize(records)

        
        #setting the GOOGLE_CLOUD_PROJECT environment variable
        os.environ['GOOGLE_CLOUD_PROJECT'] = str(project)

        
        # write to BigQuery table
        df.to_gbq(table, project_id=project, if_exists='append')

        # set return code
        ret_code = 1
        
    except Exception as e:

        # print error log
        logging.error("Error while writing to BigQuery table")
        logging.error(e)

        # set return code
        ret_code = 0
    
    # return the code to caller
    return(ret_code)

# Utility function to log endpoint latencies
# and return the dictionary
def log_latencies_to_bq(model_id, latencies, log_level):
    """
    Preparing registered latencies to add to the BQ Table
    
    Input: 
        latencies: empty/existing dictionary

    Output:
        updated_latency: updated list with records.
    """

    # set logging preferences
    logging.basicConfig(level=log_level, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")

    # start log
    logging.info("Logging latencies for BQ insetions")

    # create result dict
    RESULT = []

    # for each value from input list
    for record in latencies:
        temp = {}
        temp['min_latency_ms'] = record["latencies"]["min"] / 1000000
        temp['p50_latency_ms'] = record["latencies"]["50th"] / 1000000
        temp['p90_latency_ms'] = record["latencies"]["90th"] / 1000000
        temp['p95_latency_ms'] = record["latencies"]["95th"] / 1000000
        temp['p99_latency_ms'] = record["latencies"]["99th"] / 1000000
        temp['max_latency_ms'] = record["latencies"]["max"] / 1000000
        temp['mean_latency_ms'] = record["latencies"]["mean"] / 1000000
        temp['model_id'] = model_id
        temp["duration_secs"] = record["duration"]
        temp["qps"] = record["qps"]
        temp["status_codes"] = str(record['status_codes'])
        temp["errors"] = str(record['errors'])
        temp["ep_display_name"] = record['ep_display_name']
        temp["record_ts"] = datetime.datetime.now()
        RESULT.append(temp)
    
    # return list
    return (RESULT)

# Utility function to run the Vegeta Tool
# and record the observed latencies
def register_latencies(rate, duration, endpoint, machine_type, ep_display_name, latencies, request_file, log_level):
    """
    Register latencies of the given endpoint
    
    Input:
        rate: the QPS rates to be tried 
        duration: the duration of each load test for each QPS Rate
        endpoint: the Vertex AI Endpoint ID
        machine_type: type of VM of the endpoint
        ep_display_name: endpoint display name, for logging
        latencies: blank/existing set of latencies
        log_level: level of logging
    
    Output:
        ret_code: 1 for success, 0 for errors
        latencies: list of latencies captured during the tests
    
    """

    # log configuration
    logging.basicConfig(level=log_level, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")

    # start log.
    logging.info("Registering latencies for endpoint %s", endpoint.resource_name)

    # getting endpoint ID value
    endpoint_id = endpoint.resource_name.split("/")[-1]
    project_number =  endpoint.resource_name.split("/")[1]

    #request file path 
    request_filepath = f"{dirname(dirname(realpath(__file__)))}/requests/{request_file}"
    # send load test requests
    for qps in rate:

        # get teh QPS value
        qps = str(qps)

        # run a SHELL process
        shell_process = Popen(['sh', 'utils/vegeta_test.sh', endpoint_id, duration, qps, project_number, request_filepath], stdout=PIPE, stderr=PIPE)
        
        # interim log.
        logging.info("Executing Vegata for endpoint: %s with QPS: %s", endpoint_id, qps)

        # start the shell process
        stdout, stderr = shell_process.communicate()
        
        # timeout [optional]
        time.sleep(100)

        # handle errors
        if not stderr:

            # interim log
            logging.info("Shell script execution completed")

            # store results
            vegeta_result = json.loads(str(stdout, 'UTF-8'))
            vegeta_result["duration"] = duration
            vegeta_result["qps"] = qps
            vegeta_result['ep_display_name'] = ep_display_name
            vegeta_result['timestamp'] = datetime.datetime.now()
            vegeta_result['machine_type'] = machine_type

            # interim: log results: optional
            logging.info(vegeta_result)

            # append final results
            latencies.append(vegeta_result)
            ret_code = 1

        else:
            # display error
            logging.error("Error while running Vegata load tests")
            logging.error(stderr)

            # set return code value
            ret_code = 0
    
    # return code + list of latencies
    return (ret_code, latencies)

# utility function to read config file.
def read_config(config_file):
    """Reads configuration data from a specified file.

    Args:
        config_file (str): Path to the configuration file.

    Returns:
        dict: A dictionary containing the configuration data.
    """
    try:
        # create object of config parser
        # and read the data file
        config = configparser.ConfigParser()
        config.read(config_file)

        # create empty dict to store config.
        data = {}

        # read/store all config
        for section in config.sections():
            data[section] = {}
            for option in config.options(section):
                data[section][option] = config.get(section, option)

        # finally return the dict.
        return data
        
    except Exception as e:
        raise(e)

# End.
