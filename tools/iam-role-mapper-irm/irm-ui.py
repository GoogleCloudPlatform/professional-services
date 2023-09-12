import argparse
import logging
import os
import sys
import traceback

import irm_migration.main_mig as irm_mig


def validate_folder_access(folder):
    if (
        os.access(folder, os.F_OK)
        and os.access(folder, os.R_OK)
        and os.access(folder, os.W_OK)
    ):
        return True
    else:
        msg = f"The following folder may have invalid permissions or may not exist: {folder}"
        logging.error(msg)


def main(execute, rules_file, generate_report, output_folder):
    try:
        # check validity of input folders
        validate_folder_access(output_folder)
        # pass the input values to the mig class
        # irm_mig.run_migration(execute, rules_file, generate_report, output_folder)
        # irm_mig.run_migration()

    except:
        logging.error("Oops! Ran into an error. Kindly check the trace log")
        traceback.print_exception(*sys.exc_info())


if __name__ == "__main__":
    # Set up a handler for printing INFO logs to the console
    console = logging.StreamHandler()
    console.setLevel(logging.INFO)
    formatter = logging.Formatter("%(levelname)-8s %(message)s")
    console.setFormatter(formatter)
    logging.getLogger("").addHandler(console)

    # initialize the input parameters
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )

    parser.add_argument(
        "--execute",
        dest="execute",
        default=True,
        required=True,
        help="[REQUIRED]Boolean value to determine if the tool must execute the gcloud commands at the target gcp org,[TYPE]=Boolean",
    )
    parser.add_argument(
        "--rules_file",
        dest="rules_file",
        default="./master-sheet/rules.csv",
        help="[OPTIONAL]Location of the rules file if the user wants to pass a custom rules sheet, [TYPE]=string",
    )
    parser.add_argument(
        "--generate_report",
        dest="det_report",
        default=True,
        help="[OPTIONAL]Boolean value to determine if the detailed report is to be generated at the target output folder. ,[TYPE]Boolean",
    )
    parser.add_argument(
        "--output_folder",
        dest="output_folder",
        default="./outputs",
        help="[OPTIONAL]Location of the rules file if the user wants to pass a custom rules sheet. If no value is provided the default sheet is used.",
    )

    args = parser.parse_args()
    main(args.execute, args.rules_file, args.det_report, args.output_folder)
