# Copyright 2018 Google Inc.
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

import argparse
from google.cloud import bigquery
from google.api_core.exceptions import NotFound, BadRequest


class BigQueryTableResizer(object):
    """
    BigQueryTableResizer is a class for copying a BigQuery table into itself
    until it reaches the desired size. This is useful when trying to quickly
    populate large tables in BigQuery. This class assumes that source and
    destination tables are in the same project.

    Attributes:
        location (str): The location of the BigQuery tables ['US' or 'EU'].
        project (str): The GCP project id for these tables.
        client (bigquery.client.Client): A client for making BigQuery API
            requests.
        source_table (bigquery.table.Table): The source data to be copied. This
            is constructred from the source_dataset and source_table args.
        dest_table_ref (bigquery.table.TableReference): This is the table that
            you want to be target_gb or target_rows. It is a TableReference
            not a Table because it may not exist prior to this call.
        target_rows (int): The desired number of rows in the destination table.
        target_gb (int): The desired number of GB for the destination table.
            Note that this will be cast to a number of rows and will only be
            used if that number is greater than target_rows.
    Methods:
        resize(): Performs the duplication according to this DataResizer's
            attributes.
    """
    def __init__(self,
                 project=None,
                 source_dataset=None,
                 destination_dataset=None,
                 source_table=None,
                 destination_table=None,
                 target_rows=1000000,
                 target_gb=None,
                 location='US'):
        """
        Constructor for DataDuplicator object.
        Args:
            location (str): The location of the BigQuery tables ['US' or 'EU'].
            project (str): The GCP project id for these tables.
            source_dataset (str): The BigQuery dataset ID containing the source
                data table to be copied.
            source_table (str): The BigQuery table ID containing the source
                data table to be copied.
            target_rows (int): The desired number of rows in the destination
                table. Either target_rows or target_gb is required.
            target_gb (int): The desired number of GB for the destination
                table. Note, that this will be cast to a number of rows and
                will only be used if that number is greater than target_rows.
            destination_dataset (str): The BigQuery dataset to populate the
                table that is the result of the copy operations.
                This is optional; chosing not to specify the destination
                dataset and table will result in an inplace copy.
            destination_table (str): The BigQuery table ID that you want to be
                target_gb or target_rows. This can be the same as source_table.
                It is a TableReference not a Table because it may not
                exist prior to this call.
       """
        self.location = location
        # Validate project argument.
        try:
            self.client = bigquery.Client(project=project)
            # This will error out if BigQuery not activated for this project.
            list(self.client.list_datasets())
            self.project = project
        except BadRequest:
            raise argparse.ArgumentError(
                "BigQuery is not setup in project: {}".format(project))

        source_table_ref = self.client.dataset(source_dataset).table(
            source_table)

        try:  # Validate source_table
            self.source_table = self.client.get_table(source_table_ref)
        except NotFound:
            raise argparse.ArgumentError(
                "Source table {} does not exist in {}.{}".format(
                    source_table, project, source_dataset))

        if destination_dataset and destination_table:
            self.dest_table_ref = \
                self.client.dataset(destination_dataset).table(
                    destination_table
                )
        else:  # Default to an inplace copy.
            self.dest_table_ref = self.source_table.reference

        if target_gb:
            target_bytes = target_gb * 1024**3
            increase_pct = target_bytes / self.source_table.num_bytes
            self.target_rows = int(self.source_table.num_rows * increase_pct)

        else:
            self.target_rows = target_rows

    def resize(self):
        """
        This is the execute function of this class. It copies the source table
        into the destination table and then copies the destination table into
        itself until it reaches or exceeds the target_rows.
        """
        # How many rows short of our target are we?
        gap = self.target_rows - self.source_table.num_rows

        while gap > 0:  # Copy until we've reached or exceeded target_rows

            # API requests to get the latest table info.
            source_table = self.client.get_table(self.source_table)
            try:
                dest_table = self.client.get_table(self.dest_table_ref)

            except NotFound:
                dest_table = self.client.create_table(
                    bigquery.Table(self.dest_table_ref))

            # Get the latest size of the dest_table.
            # Note that for the first call these properties are None.
            dest_rows = dest_table.num_rows
            dest_bytes = dest_table.num_bytes
            dest_gb = dest_bytes / float(1024**3)

            # Recalculate the gap.
            if dest_rows:
                gap = self.target_rows - dest_rows
            else:
                gap = self.target_rows

            print(('{} rows in table of size {} GB, with a target of {}, '
                   'leaving a gap of {}'.format(dest_rows, round(dest_gb, 2),
                                                self.target_rows, gap)))

            # Greedily copy the largest of dest_table and source_table into
            # dest_table without going over the target rows. The last query
            # will be a subset of source_table via a limit query.
            if gap < source_table.num_rows:
                # This will be the last copy operation if target_rows is
                # not a power of 2 times the number of rows originally in the
                # source table. It is not a full copy.
                job_config = bigquery.QueryJobConfig()
                # Set the destination table

                job_config.destination = self.dest_table_ref
                job_config.write_disposition = 'WRITE_APPEND'
                job_config.allow_large_results = True

                sql = """
                    SELECT *
                    FROM `{}.{}.{}`
                    LIMIT {}

                """.format(self.project, self.source_table.dataset_id,
                           self.source_table.table_id, gap)

                # API request to BigQuery with query and config defined above.
                query_job = self.client.query(
                    sql,
                    # Location must match that of the dataset(s) referenced in
                    # the query and of the destination table.
                    location=self.location,
                    job_config=job_config)
                # Wait for query_job to finish.
                query_job.result()
            else:
                if source_table.num_rows < dest_table.num_rows < gap:
                    use_as_source_table = self.dest_table_ref
                else:  # source_table.num_rows < gap < dest_table.num_rows
                    use_as_source_table = self.source_table.reference
                copy_config = bigquery.CopyJobConfig()
                copy_config.write_disposition = 'WRITE_APPEND'

                copy_job = self.client.copy_table(use_as_source_table,
                                                  self.dest_table_ref,
                                                  job_config=copy_config)
                # Wait for copy_job to finish.
                copy_job.result()


def parse_data_resizer_args(argv):
    """
    This is a convienence function for parsing command line arguments and
    returning an BigQueryTableResizer object.
    Args:
        argv: The command line arguments.
    """
    parser = argparse.ArgumentParser()

    parser.add_argument('--project',
                        dest='project',
                        required=True,
                        help='Name of the project containing source and '
                        'destination tables')

    parser.add_argument('--source_dataset',
                        dest='source_dataset',
                        required=True,
                        help='Name of the dataset in which the source table is'
                        ' located')

    parser.add_argument('--source_table',
                        dest='source_table',
                        required=True,
                        help='Name of the source table')

    parser.add_argument('--destination_dataset',
                        dest='destination_dataset',
                        required=False,
                        help='Name of the dataset in which the destination '
                        'table is located')

    parser.add_argument('--destination_table',
                        dest='destination_table',
                        required=False,
                        help='Name of the destination table')

    parser.add_argument('--target_rows',
                        dest='target_rows',
                        required=False,
                        type=int,
                        help='Number of records (rows) desired in the '
                        'destination table',
                        default=10000)

    parser.add_argument('--target_gb',
                        dest='target_gb',
                        required=False,
                        type=float,
                        help='Size in GB desired for the destination table',
                        default=None)

    parser.add_argument('--location',
                        dest='location',
                        required=False,
                        help='The location of the BigQuery Tables.',
                        default='US')

    data_args = parser.parse_args(argv)
    return BigQueryTableResizer(
        project=data_args.project,
        source_dataset=data_args.source_dataset,
        destination_dataset=data_args.destination_dataset,
        source_table=data_args.source_table,
        destination_table=data_args.destination_table,
        target_rows=data_args.target_rows,
        target_gb=data_args.target_gb,
        location=data_args.location)


def run(argv=None):
    data_resizer = parse_data_resizer_args(argv)
    data_resizer.resize()


if __name__ == '__main__':
    run()
