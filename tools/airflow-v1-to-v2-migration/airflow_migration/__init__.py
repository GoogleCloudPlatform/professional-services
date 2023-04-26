import argparse
import os
import logging

# Setup a handler for printing INFO logs to the console
console = logging.StreamHandler()
console.setLevel(logging.INFO)
formatter = logging.Formatter('%(levelname)-8s %(message)s')
console.setFormatter(formatter)
logging.getLogger('').addHandler(console)


def validate_folder_access(input_folder):
    if os.access(input_folder, os.F_OK) and os.access(input_folder, os.R_OK) and os.access(input_folder, os.W_OK):
        return True
    else:
        return False


# Main class to get the check the inputs for rw_access and location. Pass to the main migration class
def main(input_dag, output_dag, rules_folder, comments, report_generation):
    invalid_folders = [folder for folder in [input_dag, output_dag, rules_folder] if not validate_folder_access(folder)]
    if invalid_folders:
        invalid_folder_names = ','.join(invalid_folders)
        msg = f"The following folder may have invalid permissions or may not exist: {invalid_folder_names}"
        logging.error(msg)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter)

    parser.add_argument(
        '--input_DAG', dest='input_DAG_folder', required=True,
        help='[REQUIRED]The path to the input DAG folder location'
    )
    parser.add_argument(
        '--output_DAG', dest='output_DAG_folder', required=True,
        help='[REQUIRED]The path to the output DAG folder location'
    )
    parser.add_argument(
        '--rules_folder', dest='rules_folder',
        help='[OPTIONAL]The path to optional rules.csv folder when custom rules are to be used',
        default="/Users/harishsridhar/Projects/python/learn/rules.csv"
    )
    parser.add_argument(
        '--comments', dest='comment',
        help='[OPTIONAL]The path to optional rules.csv folder when custom rules are to be used',
        default="#Migration Utility Generated Comment -- Replaced the below line of code")
    parser.add_argument(
        '--report_req', dest='report_generation', type=bool,
        help='[OPTIONAL]True or False to determine the generation of final output report', default=False)

    args = parser.parse_args()
    main(args.input_DAG_folder, args.output_DAG_folder, args.rules_folder, args.comment, args.report_generation)