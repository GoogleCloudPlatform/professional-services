"""G Suite Grant Analyzer."""
# Copyright 2019 Google LLC
#
#    Licensed under the Apache License, Version 2.0 (the "License");
#    you may not use this file except in compliance with the License.
#    You may obtain a copy of the License at
#
#        http://www.apache.org/licenses/LICENSE-2.0
#
#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS,
#    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#    See the License for the specific language governing permissions and
#    limitations under the License.
#
#    This script is a proof of concept and is not meant to be fully functional
#    nor feature-complete. Error checking and log reporting should be adjusted
#    based on the user's needs. Script invocation is still in its infancy.
#
#    Please, refer to README.md file for instructions.

import argparse
import logging
import multiprocessing
import signal
import sys

from gsuite_grant_analyzer.bigquery_helpers import (bq_create_client,
                                                    bq_create_dataset,
                                                    bq_create_table,
                                                    bq_insert_rows)

from gsuite_grant_analyzer.google_api_helpers import (
    create_delegated_credentials, create_directory_client,
    get_denormalized_scopes_for_user, get_users)

# Hard limit on the number of processes from the command line. This limit can
# be raised, however, expect more throttling from the APIs as you go up.
MAX_PROCESSES = 8

# These scopes must be granted in G Suite Admin Console to the service account
# client. See README.md file for more information on setup.
SCOPES = [
    "https://www.googleapis.com/auth/admin.directory.user.readonly",
    "https://www.googleapis.com/auth/admin.directory.user.security",
    "https://www.googleapis.com/auth/bigquery",
    "https://www.googleapis.com/auth/cloud-platform"
]

logging.basicConfig(filename="gsuite_grant_analyzer.log",
                    level=logging.DEBUG,
                    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s")

logger = logging.getLogger(__name__)

terminate_processes = multiprocessing.Value("i", 0)


def handle_signal(s, f):
    """Handles termination by CTRL-C.

  Args:
    s: signal
    f: frame
  """
    del s
    del f
    global terminate_processes
    terminate_processes = multiprocessing.Value("i", 1)


def parse_args(args):
    """Parses script arguments.

  Args:
    args: script arguments

  Returns:
    Parsed arguments
  """
    parser = argparse.ArgumentParser(
        description="Finds applications and scopes for all users in a given "
        "OU and loads them into BigQuery")
    parser.add_argument("--domain", help="Domain", type=str, required=True)
    parser.add_argument("--ou",
                        help="Organizational Unit path, default is /",
                        type=str,
                        required=False,
                        default="/")
    parser.add_argument("--sa",
                        help="Path to Service Account credentials",
                        type=str,
                        required=True)
    parser.add_argument("--admin",
                        help="Administrator email",
                        type=str,
                        required=True)
    parser.add_argument("--project",
                        help="Project where BigQuery dataset will be created",
                        type=str,
                        required=True)
    parser.add_argument("--dry-run",
                        help="Do not load data into BigQuery",
                        required=False,
                        dest="dry_run",
                        action="store_true",
                        default=False)
    parser.add_argument("--processes",
                        help="Number of concurrent processes (default: 4)",
                        type=int,
                        required=False,
                        dest="num_processes",
                        default=4)

    return parser.parse_args(args)


def build_rows_process(queue, users, directory_client, process_number,
                       num_processes):
    """A process functions to process all users in parallel.

  Gets all users, but processes and builds the rows only for the subset of
  users assigned to the process.

  Args:
    queue: shared synchronized queue where results are stored
    users: list of all users
    directory_client: client for the Directory SDK API
    process_number: number of this process, from 0 to num_processes
    num_processes: total number of processes
  """
    rows = []
    total_users = len(users)
    for i, user in enumerate(users, 1):
        if terminate_processes.value:
            break
        if i % num_processes == process_number:
            logger.debug("Process #%s - User %d/%d: %s", process_number, i,
                         total_users, user)
            rows.extend(get_denormalized_scopes_for_user(
                directory_client, user))

    # Post results in the queue, if not terminating
    if not terminate_processes.value:
        queue.put({
            "process_number": process_number,
            "message_type": "DATA",
            "data": rows
        })

    # Post process complete message
    queue.put({"process_number": process_number, "message_type": "STOP"})


def analyze():
    """Main function for G Suite Grant Analyzer."""
    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)

    args = parse_args(sys.argv[1:])

    logger.info("### G Suite Grant Analyzer ###")
    logger.debug("Domain=%s", args.domain)
    logger.debug("OU=%s", args.ou)
    logger.debug("Admin=%s", args.admin)
    logger.debug("SA=%s", args.sa)
    logger.debug("Project=%s", args.project)
    logger.debug("Dry run=%s", args.dry_run)
    logger.debug("Processes=%d", args.num_processes)

    if args.num_processes > MAX_PROCESSES:
        logger.error(
            "The maximum number of processes is %d. Please, edit your command "
            "line.", MAX_PROCESSES)
        exit(1)

    # Get credentials for service account and create services and clients
    logger.info("Creating credentials...")
    delegated_credentials = create_delegated_credentials(
        service_account_file=args.sa, scopes=SCOPES, user=args.admin)
    logger.info("Creating Directory API client...")
    directory = create_directory_client(delegated_credentials)

    if not args.dry_run:
        logger.info("Setting up BigQuery...")
        bq_client = bq_create_client(args.project, delegated_credentials)
        dataset = bq_create_dataset(bq_client)
        table = bq_create_table(bq_client, dataset)

    logger.info("Setup complete.")

    logger.info("Getting user list...")
    users = get_users(directory, args.domain, args.ou)
    total_users = len(users)
    logger.info("Got %d users", total_users)

    # Shared queue for process messages
    queue = multiprocessing.Queue()

    # Stores running processes by process number
    processes = {}

    # Create and start processes
    for process_number in range(0, args.num_processes):
        logger.info("Creating process %d", process_number)
        process = multiprocessing.Process(target=build_rows_process,
                                          args=(queue, users, directory,
                                                process_number,
                                                args.num_processes))
        processes[process_number] = process
        process.start()

    total_rows = 0

    # Process results until all processes have terminated
    while processes:
        message = queue.get()
        process_number = message["process_number"]
        message_type = message["message_type"]
        if message_type == "DATA":
            # Insert data in BQ
            if not args.dry_run and not terminate_processes.value:
                logger.info("Inserting data from process #%d", process_number)
                data = message["data"]
                total_rows += len(data)
                bq_insert_rows(bq_client, table, data)
        elif message_type == "STOP":
            # Remove completed process from running processes
            processes[process_number].join()
            logger.info("Process #%d completed", process_number)
            del processes[process_number]
        else:
            logger.error("Unknown message %s from process",
                         message["message_type"])
            exit(1)

    logger.info("All processes terminated - %d rows processed", total_rows)


if __name__ == "__main__":
    analyze()
