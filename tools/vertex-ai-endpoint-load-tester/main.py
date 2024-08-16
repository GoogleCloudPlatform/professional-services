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
# Script deploys vertex AI endpoint
# and Capture endpoint performance to BQ
#
# Authors: ajitsonawane@,suddhasatwa@
# Team:    Google Cloud Consulting
# Date:    25.01.2024

# Imports
import sys
import logging
import traceback
import uuid
import time
import json
from google.cloud import aiplatform

from utils import utils
# from utils import config_parser as cfp
# from utils.utils import register_latency
# from utils.utils import log_latencies_to_bq
# from utils.utils import write_results_to_bq

# function to process requests to endpoint.
def process(machine_type: str, latencies: list, log_level: str):
    """
    Deploys machine based on user input, creates endpoint and measure latencies.
    Takes the latencies List as input.
    Calls the Vegata utility to update latencies for each machine type.
    Passes it to another utility to generate full Results. 
    Returns the Results back.

    Inputs:
        machine_type: each type of machine to be tested.
        latencies: list (usually empty) to get results from Vegata
        log_level: level of logging.

    Outputs:
        results: Combined results for each machine type.
    """

    # set logging setup
    logging.basicConfig(level=log_level, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")

    # start logging.
    logging.info("Reading configuration.")

    # read config.
    config_data = utils.read_config("config/config.ini")
    MODEL_ID = config_data["config"]["model_id"] # model ID
    RATE = json.loads(config_data["config"]["rate"]) # the QPS rates to try
    DURATION = str(config_data["config"]["duration"]) # duration for which tests will be ran
    PROJECT = config_data["config"]["project"] # project ID 
    LOCATION = config_data["config"]["location"] # region
    TIMEOUT = config_data["config"]["timeout"] # endpoint timeout
    MIN_NODES = int(config_data["config"]["min_nodes"]) # min nodes for scaling
    MAX_NODES = int(config_data["config"]["max_nodes"]) #max nodes for scaling
    REQUEST_FILE = str(config_data["config"]["request_file"])

    # deploy model on endpoint.   
    logging.info(
        "Deploying endpoint on machine: %s for model: %s", machine_type, MODEL_ID)
    try:
        # create client for Vertex AI. 
        logging.info("Creating AI Platform object.")
        aiplatform.init(project=PROJECT, location=LOCATION)

        # load the model from registry.
        logging.info("Loading {} from Model registry.".format(MODEL_ID))
        model = aiplatform.Model(model_name=MODEL_ID)

        # generate random UUID
        logging.info("Generating random UUID for endpoint creation.")
        ep_uuid = uuid.uuid4().hex
        display_name = f"ep_{machine_type}_{ep_uuid}"

        # create endpoint instance
        logging.info("Creating endpoint instance.")
        endpoint = aiplatform.Endpoint.create(display_name=display_name)

        # deploy endpoint on specific machine type
        logging.info("Deploying model {} on endpoint {}".format(model, display_name))
        endpoint.deploy(model, min_replica_count=MIN_NODES,
                        max_replica_count=MAX_NODES, machine_type=machine_type)

        # Sleep for 5 minutes
        # general best practice with Vertex AI Endpoints
        logging.info("Sleeping for 5 minutes, for the endpoint to be ready!")
        time.sleep(TIMEOUT)

        # Register latencies for predictions
        logging.info("Calling utility to register the latencies.")
        ret_code, latencies = utils.register_latencies(RATE, DURATION, endpoint, machine_type, endpoint.display_name, latencies, REQUEST_FILE, log_level)
        if ret_code == 1:
            logging.info("Latencies recorded for {}".format(machine_type))
        else:
            logging.error("Error in recording latencies for {}".format(machine_type))
            sys.exit(1)

        # preprocess registered latencies
        logging.info("Calling utility to prepare latencies for BigQuery.")
        results = utils.log_latencies_to_bq(MODEL_ID, latencies, log_level)
        if results:
            logging.info("Latencies information processed successfully.")
        else:
            logging.error("Error in recording all latencies. Exiting.")
            sys.exit(1)

        # Un-deploy endpoint
        logging.info("Un-deploying endpoint: %s", endpoint.resource_name)
        endpoint.undeploy_all()

        # Deleting endpoint
        logging.info("Deleting endpoint: %s", endpoint.resource_name)
        endpoint.delete()

        logging.info("Processing completed for machine: %s", machine_type)

    except Exception as ex:
        logging.error(''.join(traceback.format_exception(etype=type(ex),
                                                         value=ex, tb=ex.__traceback__)))

    # return results. 
    return (results)

# entrypoint function.
def main():
    """ Entrypoint """

    # Read config. 
    config_data = utils.read_config("config/config.ini")
    MACHINE_TYPES_LST = config_data["config"]["machine_types_lst"].split(',') # List of machine types
    LOG_LEVEL = config_data["config"]["log_level"] # level of logging.
    OUTPUT_BQ_TBL_ID = config_data["config"]["output_bq_tbl_id"] # BigQuery table to store results
    PROJECT = config_data["config"]["project"] # project ID 

    # log setup.
    logging.basicConfig(level=LOG_LEVEL, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")

    # start logging.
    logging.info("Vertex Endpoint Stress Tester Utility.")

    # variables
    logging.info("Prepping local variables.")
    LATENCIES = []
    RESULTS = []

    # record start time.
    start = time.time()

    # loop through each machine type
    # and process the records.
    try:
        for machine_type in MACHINE_TYPES_LST:
            # log calling the utility
            logging.info("Calling data processing utility.")

            # append the results from utility
            RESULTS.extend(process(machine_type, LATENCIES, LOG_LEVEL))

            # log end. 
            logging.info("Results utility completed.")

            # reset the latencies variable
            LATENCIES = []
    except Exception as e:
        # log error
        logging.error("Got error while running load tests.")
        logging.error(e)
        # exit
        sys.exit(1) 
   
    # REMOVE
    logging.info(len(LATENCIES))
    logging.info(len(RESULTS))
    
    # write collected results to BigQuery
    logging.info(" Writing data of load testing on machine type %s", machine_type)
    bq_write_ret_code = utils.write_results_to_bq(RESULTS, OUTPUT_BQ_TBL_ID, PROJECT, LOG_LEVEL)
    if bq_write_ret_code == 1:
        # log success
        logging.info("Successfully written data into BQ in {} table.".format(OUTPUT_BQ_TBL_ID))
    else:
        # log error
        logging.error("Errors in writing data into BigQuery. Exiting.")
        # exit
        sys.exit(1)

    # print the total time taken.
    # this is for all machines.
    logging.info(f"Total time taken for execution {time.time()-start}")

# Call entrypoint
if __name__ == "__main__":
    main()

# End.
