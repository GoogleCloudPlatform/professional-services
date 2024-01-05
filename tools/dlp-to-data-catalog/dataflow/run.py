# Copyright 2024 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Runs DLP inspection on a dataset and tags the results in Data Catalog."""

import argparse
from typing import Type, List, Tuple, Dict

import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions
from dlp.preprocess import Preprocessing
from dlp.inspection import DlpInspection
from dlp.catalog import Catalog
import dlp.run


def parse_arguments() -> Type[argparse.ArgumentParser]:
    """Parses command line arguments.

    Returns:
        argparse.ArgumentParser: The argument parser configured
        with necessary arguments.
    """

    # Parse command line arguments for the Dataflow pipeline
    parser_common = dlp.run.parse_arguments()

    # Common arguments
    parser_common.add_argument(
        "--runner",
        choices=["DataflowRunner", "DirectRunner"],
        type=str,
        help="""Specify the runner to use: DataflowRunner or DirectRunner.""",
    )

    parser_common.add_argument(
        "--output_txt_location",
        type=str,
        required=True,
        help="Specifies the location where the output text will be stored.",
    )

    main_args, _ = parser_common.parse_known_args()

    if main_args.runner == 'DataflowRunner':
        dataflow_group = parser_common.add_argument_group("Dataflow Group")
        # Dataflow-specific arguments
        dataflow_group.add_argument(
            "--temp_file_location",
            type=str,
            required=True,
            help="""Specifies the location in Google Cloud Storage where
            temporary files will be stored during the dataflow execution.""",
        )
        dataflow_group.add_argument(
            "--staging_location",
            type=str,
            required=True,
            help="""Specifies the location in Google Cloud Storage where files
            will be staged during the dataflow execution.""",
        )
        dataflow_group.add_argument(
            "--template_location",
            type=str,
            required=True,
            help="""Specifies the location in Google Cloud Storage where the
            dataflow template will be stored.""",
        )
    elif main_args.runner == 'DirectRunner':
        direct_group = parser_common.add_argument_group("Direct Group")
        # DirectRunner-specific arguments
        direct_group.add_argument(
            "--direct_num_workers",
            type=int,
            default=10,
            help="""Specify the number of workers for parallel execution
            with DirectRunner.""",
        )

    if not main_args.location_category and not main_args.dlp_template:
        parser_common.error("location_category or dlp_template are required.")

    return parser_common


def run(args: Type[argparse.Namespace]):
    """Runs DLP inspection scan and tags the results to Data Catalog.

    Args:
        source (str): The name of the source of data used.
        project (str): The name of the Google Cloud Platform project.
        location_category (str): The location to be inspected. Ex. "CANADA".
        zone(str): The name of the zone.
        bigquery_args(Dict):
            dataset (str): The name of the BigQuery dataset.
            table (str, optional): The name of the BigQuery table. If not
              provided, the entire dataset is scanned. Optional.
              Defaults to None.
        cloudsql_args(Dict):
            instance (str): Name of the database instance.
            service_account(str): Service account email to be used.
            db_name(str): The name of the database.
            table (str): The name of the table.
            db_type(str): The type of the database. e.g. postgres, mysql.
    """
    # Extract command line arguments
    source = args.source
    project = args.project
    location_category = args.location_category
    dlp_template = args.dlp_template
    zone = args.zone
    output_txt_location = args.output_txt_location
    runner = args.runner

    db_args = dlp.run.get_db_args(args)

    entry_group_name = None
    if source == 'cloudsql':
        # Create a custom entry group for Cloud SQL
        catalog = Catalog(
            data=None,
            project_id=project,
            zone=zone,
            instance_id=db_args.instance_id,
            entry_group_name=entry_group_name,
        )
        entry_group_name = catalog.create_custom_entry_group()

    if runner == 'DataflowRunner':
        # Set up pipeline options
        pipeline_options = PipelineOptions([
            f'--runner={runner}',
            f'--project={project}',
            f'--region={zone}',
            f'--staging_location={args.staging_location}',
            f'--temp_file_location={args.temp_file_location}',
            f'--template_location={args.template_location}'
        ],
            setup_file='../setup.py',
            save_main_session=True
        )
    elif runner == 'DirectRunner':
        # Set up pipeline options
        pipeline_options = PipelineOptions([
            f'--runner={runner}',
            f'--project={project}',
            f'--region={zone}',
            f'--direct_num_workers={args.direct_num_workers}'
        ],
            save_main_session=True
        )

    # Specify the number of cells to analyze per batch.
    batch_size = 50000

    def get_tables_indexes(_) -> List[Tuple]:
        """Returns a list of tuples representing the table name and the
        start index of each cell block, taken in chunks of 50,000.
        This allows for parallel processing of the blocks.

        Returns:
            List[Tuple]: A list of tuples containing the table name and
            the start index of each cell block.
        """
        preprocess = Preprocessing(
            source=source,
            project=project,
            zone=zone,
            **db_args.preprocess_args
        )
        tables_info = preprocess.get_tables_info()
        tables_start_index_list = []

        for table_name, total_cells in tables_info:
            range_list = list(range(0, total_cells, batch_size))
            for num in range_list:
                tables_start_index_list.append((table_name, num))
        return tables_start_index_list

    def preprocess_table(table_start_index_tuple: Tuple) -> Tuple:
        """Process table based on their start indexes and retrieve DLP tables.

        Args:
            table_start_index (Tuple): Tuple containing
            the table name and start index.

        Returns:
            Tuple: Tuple containing the table name and DLP table objects.

        """
        table_name, start_index = table_start_index_tuple
        preprocess = Preprocessing(
            source=source,
            project=project,
            zone=zone,
            **db_args.preprocess_args
        )

        dlp_table = preprocess.get_dlp_table_per_block(
            50000, table_name, start_index)
        return table_name, dlp_table

    def inspect_table(table_dlp_table_tuple: Tuple) -> Tuple[str, Dict]:
        """Inspect table and retrieve finding results for each block.

        Args:
            table_dlp_table_list (Tuple): A tuple containing
            the table name and DLP table object.

        Returns:
            Tuple: A tuple containing the table name and finding results.
        """
        table_name, dlp_table = table_dlp_table_tuple
        dlpinspection = DlpInspection(project_id=project,
                                      location_category=location_category,
                                      dlp_template=dlp_template)

        finding_results_per_block = dlpinspection.get_finding_results(
            dlp_table)
        return table_name, finding_results_per_block

    def merge_top_findings(finding_tuple: Tuple) -> Tuple:
        """Merge and extract the top finding result for each table.

        Args:
            finding_tuple (Tuple): A tuple containing the table
            name and its corresponding finding_results.

        Returns:
            Tuple: A tuple containing the table name
            and the top finding result.
        """
        table_name, finding_results = finding_tuple

        dlpinspection = DlpInspection(project_id=project,
                                      location_category=location_category,
                                      dlp_template=dlp_template)
        top_finding = dlpinspection.merge_finding_results(finding_results)
        return table_name, top_finding

    def process_catalog(top_finding_tuple: Tuple) -> None:
        """Process the top finding_result for a table and create a tag template
        for BigQuery tables and custom entries for Cloud SQL.

        Args:
            top_finding_tuple (Tuple): A tuple containing the table name
            and the top finding result.
        """
        table_name, top_finding = top_finding_tuple

        catalog = Catalog(
            data=top_finding,
            project_id=project,
            zone=zone,
            dataset=db_args.dataset,
            table=table_name,
            instance_id=db_args.instance_id,
            entry_group_name=entry_group_name
        )
        catalog.main()

    with beam.Pipeline(options=pipeline_options) as pipeline:

        # pylint: disable=expression-not-assigned
        top_finding = (pipeline | 'InitialPcollection' >> beam.Create([None])
                       # Generate a list of tuples representing the table name
                       # and start index of each cell block.
                       | 'TablesIndexes' >> beam.FlatMap(get_tables_indexes)

                       # Reshuffle the data to allow parallel processing.
                       | 'ReshuffledData' >> beam.Reshuffle()

                       # Preprocess each table based on their start indexes
                       # and retrieve DLP tables.
                       | 'PreProcessTable' >> beam.Map(preprocess_table)

                       # Inspect each DLP table and retrieve finding results
                       # for each block.
                       | 'Inspect' >> beam.Map(inspect_table)

                       # Group finding results by table name.
                       | 'GroupByKey' >> beam.GroupByKey()

                       # Merge and extract the top finding result
                       # for each table.
                       | 'ProcessTopFinding' >> beam.Map(merge_top_findings)
                       )
        # Write the top finding results to a text file.
        top_finding | 'WriteOutput' >> beam.io.WriteToText(
            output_txt_location)

        # Process the top finding results and create tags in Data Catalog.
        top_finding | 'ProcessCatalog' >> beam.Map(process_catalog)


if __name__ == "__main__":
    # Parse command line arguments.
    parse_common = parse_arguments()
    parse_dataflow = dlp.run.subparse_arguments(parse_common)
    arguments = parse_dataflow.parse_args()

    # Run the DLP inspection and tagging pipeline
    run(arguments)
