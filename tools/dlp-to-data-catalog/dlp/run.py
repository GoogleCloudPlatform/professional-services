# Copyright 2023 Google LLC. This software is provided as-is, without warranty
# or representation for any use or purpose. Your use of it is subject to your
# agreement with Google.
"""Runs DLP inspection on a dataset and tags the results in Data Catalog."""

import dataclasses
import argparse
import re
from typing import Type, Dict
import warnings

from dlp.preprocess import Preprocessing
from dlp.inspection import DlpInspection
from dlp.catalog import Catalog


@dataclasses.dataclass
class DbArgs:
    """Stores the arguments related to the database source.
    """
    instance_id: str
    dataset: str
    table: str
    preprocess_args: Dict


EMAIL_REGEX = re.compile(r"^[\w\.-]+@[\w\.-]+\.\w+$")


def is_valid_email(email: str) -> bool:
    """Checks if a string is a valid email."""
    return bool(EMAIL_REGEX.match(email))


def email_type(value) -> str:
    """Validates and returns a valid email."""
    if not is_valid_email(value):
        raise argparse.ArgumentTypeError(f"Invalid IAM user: {value}")
    return value


def get_db_args(args: Type[argparse.Namespace]) -> DbArgs:
    """Returns the database arguments based on the command line arguments.

    Args:
        args (argparse.Namespace): The parsed command line arguments.

    Returns:
        DbArgs: An object containing the database arguments.
    """
    if args.source == "bigquery":
        dataset = args.dataset
        table = args.table
        preprocess_args = {
            "bigquery_args": {"dataset": dataset, "table": table}
        }
        instance_id = None
    elif args.source == "cloudsql":
        instance_id = args.instance
        dataset = args.db_name
        table = args.table
        preprocess_args = {
            "cloudsql_args": {
                "instance": instance_id,
                "service_account": args.service_account,
                "db_name": dataset,
                "table": table,
                "db_type": args.db_type,
            }
        }
    else:
        # Handle unsupported source
        raise ValueError("Unsupported source: " + args.source)

    return DbArgs(instance_id=instance_id,
                  dataset=dataset,
                  table=table,
                  preprocess_args=preprocess_args
                  )


def parse_arguments() -> Type[argparse.ArgumentParser]:
    """Parses command line common arguments."""
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--project",
        type=str,
        required=True,
        help="The Google Cloud project to be used.",
    )
    parser.add_argument(
        "--location_category",
        type=str,
        help="The location to be inspected. Ex. 'CANADA'",
    )
    parser.add_argument(
        "--dlp_template",
        type=str,
        help="""Specify the DLP template using the format:
        RESOURCE_LOCATION/inspectTemplates/TEMPLATE_ID.
        TEMPLATE_ID is the identifier for a predefined DLP inspection configuration,
        and RESOURCE_LOCATION is the location storing the DLP template.
        Ex: --dlp_template global/inspectTemplates/my-template-id""",
    )
    parser.add_argument(
        "--zone",
        required=True,
        type=str,
        help="The zone to use, e.g. us-central1-b.",
    )

    return parser


def subparse_arguments(parser: Type[argparse.ArgumentParser]
                       ) -> Type[argparse.ArgumentParser]:
    """Parses command line subparsers arguments."""

    subparsers = parser.add_subparsers(dest="source")

    bigquery_parser = subparsers.add_parser(
        "bigquery",
        help="Use BigQuery as the data source."
    )
    bigquery_parser.add_argument(
        "--table",
        type=str,
        help="The BigQuery table to be scanned. Optional.",
    )
    bigquery_parser.add_argument(
        "--dataset",
        required=True,
        type=str,
        help="The BigQuery dataset to be scanned.",
    )

    cloudsql_parser = subparsers.add_parser(
        "cloudsql",
        help="Use CloudSQL as the data source.",
    )
    cloudsql_parser.add_argument(
        "--db_type",
        required=True,
        type=str,
        choices=["postgres", "mysql"],
        help="The CloudSQL type to be scanned. e.g. postgres, mysql.",
    )
    cloudsql_parser.add_argument(
        "--table",
        type=str,
        help="The CloudSQL table to be scanned. Optional.",
    )
    cloudsql_parser.add_argument(
        "--instance",
        required=True,
        type=str,
        help="The name of the database instance used.",
    )
    cloudsql_parser.add_argument(
        "--service_account",
        required=True,
        type=email_type,
        metavar="service_account",
        help="Email address of the service account to be used.",
    )
    cloudsql_parser.add_argument(
        "--db_name",
        required=True,
        type=str,
        help="The database to use. e.g. Bigquery, CloudSQL.",
    )

    return parser


def run(args: Type[argparse.Namespace]):
    """Runs DLP inspection scan and tags the results to Data Catalog.

    Args:
        source (str): The name of the source of data used.
        project (str): The name of the Google Cloud Platform project.
        location_category (str): The location to be inspected. Ex. "CANADA".
        zone (str): The default location to use when making API calls..
        bigquery_args (Dict):
            dataset (str): The name of the BigQuery dataset.
            table (str, optional): The name of the BigQuery table. If not
              provided, the entire dataset is scanned. Optional.
              Defaults to None.
        cloudsql_arg (Dict):
            instance (str): Name of the database instance.
            service_account (str): Service account email to be used.
            db_name (str): The name of the database.
            table (str): The name of the table.
            db_type(str): The type of the database. e.g. postgres, mysql.
    """

    source = args.source
    project = args.project
    location_category = args.location_category
    zone = args.zone

    db_args = get_db_args(args)

    entry_group_name = None
    if source == 'cloudsql':
        catalog = Catalog(
            data=None,
            project_id=project,
            zone=zone,
            instance_id=db_args.instance_id,
            entry_group_name=None,
        )
        entry_group_name = catalog.create_custom_entry_group()

    # Specify the number of cells to analyze per batch.
    batch_size = 50000

    # Create preprocessing and DLP inspection objects
    preprocess = Preprocessing(
        source=source,
        project=project,
        zone=zone,
        **db_args.preprocess_args,
    )

    dlpinspection = DlpInspection(project_id=project,
                                  location_category=location_category)

    # Get a list of table names.
    tables_info = preprocess.get_tables_info()

    # Store the top finding for each table.
    top_finding_tables = []

    # Iterate through each table to obtain the finding_result_per_table.
    for index, (table_name, _) in enumerate(tables_info):
        finding_results_per_table = []
        empty_search = False
        start_index = 0
        while not empty_search:
            # Retrieve DLP table per batch of cells.
            dlp_table = preprocess.get_dlp_table_per_block(
                batch_size, table_name, start_index)
            finding_result_per_block = dlpinspection.get_finding_results(
                dlp_table)
            finding_results_per_table.append(finding_result_per_block)

            if not dlp_table.rows:
                empty_search = True
            start_index += batch_size

        # Obtain the top finding for the table.
        top_finding_per_table = dlpinspection.merge_finding_results(
            finding_results_per_table)

        # Add the table and its top_finding to the list.
        top_finding_tables.append(top_finding_per_table)

        # Checks if there where findings in the inspection.
        if not top_finding_tables[index]:
            warnings.warn(f"No findings found on {table_name}")
            continue

        # Create Catalog instance for each table.
        catalog = Catalog(
            data=top_finding_tables[index],
            project_id=project,
            zone=zone,
            dataset=db_args.dataset,
            table=table_name,
            instance_id=db_args.instance_id,
            entry_group_name=entry_group_name)
        catalog.main()


if __name__ == "__main__":
    parser_common = parse_arguments()
    parser_run = subparse_arguments(parser_common)

    arguments = parser_run.parse_args()
    run(arguments)
