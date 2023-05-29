import argparse
import os
import logging
import airflow_migration.migration as migration


def convert_to_bool(arg):
    ua = str(arg).upper()
    if 'TRUE'.startswith(ua):
        return True
    elif 'FALSE'.startswith(ua):
        return False
    else:
        return False

def validate_folder_access(input_folder):
    if os.access(input_folder, os.F_OK) and os.access(input_folder, os.R_OK) and os.access(input_folder, os.W_OK):
        return True
    else:
        return False


# Main class to get the check the inputs for rw_access and location. Pass to the main migration class
def main(input_dag, output_dag, rules_file, add_comments, comments, report_generation):
    invalid_folders = [folder for folder in [input_dag, output_dag, rules_file] if not validate_folder_access(folder)]
    if invalid_folders:
        invalid_folder_names = ','.join(invalid_folders)
        msg = f"The following folder may have invalid permissions or may not exist: {invalid_folder_names}"
        logging.error(msg)
    else:
        add_comments = convert_to_bool(add_comments)
        migration.run_migration(input_dag, output_dag, rules_file, add_comments, comments, report_generation)


if __name__ == '__main__':
    # Set up a handler for printing INFO logs to the console
    console = logging.StreamHandler()
    console.setLevel(logging.INFO)
    formatter = logging.Formatter('%(levelname)-8s %(message)s')
    console.setFormatter(formatter)
    logging.getLogger('').addHandler(console)

    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter)

    parser.add_argument(
        '--input_dag_folder', dest='input_dag_folder', required=True,
        help='[REQUIRED]The path to the input DAG folder location'
    )
    parser.add_argument(
        '--output_dag_folder', dest='output_dag_folder', required=True,
        help='[REQUIRED]The path to the output DAG folder location'
    )
    parser.add_argument(
        '--rules_file', dest='rules_file',
        help='[OPTIONAL]The path to optional rules.csv folder when custom rules are to be used',
        default="./migration_rules/rules.csv"
    )
    parser.add_argument(
        '--add_comments', dest='add_comments',
        help='[OPTIONAL]If client wants to see Migration Utility generated comments in the outpur files',
        default="True")
    parser.add_argument(
        '--comments', dest='comment',
        help='[OPTIONAL]The path to optional rules.csv folder when custom rules are to be used',
        default="")
    parser.add_argument(
        '--report_req', dest='report_generation', type=bool,
        help='[OPTIONAL]True or False to determine the generation of final output report', default=False)

    args = parser.parse_args()
    main(args.input_dag_folder, args.output_dag_folder, args.rules_file, args.add_comments,
         args.comment, args.report_generation)