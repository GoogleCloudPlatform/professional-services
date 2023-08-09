import argparse
import logging
import os
import sys
import traceback

import irm_migration.main_mig as irm_mig


def validate_folder_access(input_folder):
    if os.access(input_folder, os.F_OK) and os.access(input_folder, os.R_OK) and os.access(input_folder, os.W_OK):
        return True
    else:
        msg = f"The following folder may have invalid permissions or may not exist: {input_folder}"
        logging.error(msg)


def main(gcloud_invoke, gcloud_output, output_folder):
    try:
        # check validity of input folders
        if validate_folder_access(output_folder):
            irm_mig.run_migration(gcloud_invoke, gcloud_output, output_folder)

    except:
        logging.error("Oops! Ran into an error. Kindly check the trace log")
        traceback.print_exception(*sys.exc_info())


if __name__ == '__main__':
    # Set up a handler for printing INFO logs to the console
    console = logging.StreamHandler()
    console.setLevel(logging.INFO)
    formatter = logging.Formatter('%(levelname)-8s %(message)s')
    console.setFormatter(formatter)
    logging.getLogger('').addHandler(console)

    # initialize the input parameters
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter)

    parser.add_argument(
        '--execute-gcloud', dest='gcloud_invoke', default=True,
        required=True,
        help='[REQUIRED]Boolean value to determine if the tool must execute the gcloud commands,[TYPE]=Boolean',
    )
    parser.add_argument(
        '--rules_file', dest='rules_file', default= './master-sheet/rules.csv',
        help='[OPTIONAL]The service account with which the tool runs gcloud commands on target gcp env, [TYPE]=string'
    )
    parser.add_argument(
        '--generate-gcloud-txt', dest='gcloud_output',
        help='[OPTIONAL]Boolean value to determine if the tool must generate an output text with all gcloud commands,[TYPE]Boolean',
        default=True
    )
    parser.add_argument(
        '--output-folder', dest='output_folder',
        help='[OPTIONAL]The folder location to store the gcloud command file ',
        default=True
    )

    args = parser.parse_args()
    main(args.gcloud_invoke, args.rules_file, args.gcloud_output,
         args.output_folder)
