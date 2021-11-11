# Copyright 2019 Google LLC
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
import datetime
from dateutil import tz
import logging

from google.cloud import bigquery

INITIAL_TIMESTAMP = datetime.datetime(1900,
                                      1,
                                      1,
                                      00,
                                      00,
                                      00,
                                      000,
                                      tzinfo=tz.tzutc())


class UserInfoUpdater(object):
    """Class for updating Identity data in BigQuery.

    Holds methods for gathering updates to identity data and merging
    updates into the master identity table.

    Attributes:
        bq_client(google.cloud.bigquery.client.Client): Client to hold
            configurations needed for BigQuery API requests.
        project_id(str): Id of project holding BQ resources.
        dataset_id(str): Id of dataset holding Identity BQ tables.
        updates_table_id(str): Id of table holding updates for the identity
            table.
        temp_updates_table_id(str): Id of table that deduped update rows will
            be written to.
        final_table_id(str): Id of identity table holding golden record for
            each user.

    """

    def __init__(self, project_id, dataset_id, updates_table_id,
                 temp_updates_table_id, final_table_id):
        self.bq_client = bigquery.Client(project=project_id)
        self.project_id = project_id
        self.dataset_id = dataset_id
        self.dataset_ref = self.bq_client.dataset(self.dataset_id)
        self.updates_table_id = updates_table_id
        self.temp_updates_table_id = temp_updates_table_id
        self.final_table_id = final_table_id

    def get_max_ingest_timestamp(self):
        """Gets the max timestamp that was set during the latest merge.

        Returns:
            latest_merge as a timestamp in string format.
        """
        get_last_max_ts_config = bigquery.QueryJobConfig()
        get_last_max_ts_config.use_legacy_sql = False
        get_last_max_timestamp_query = self.bq_client.query(
            query='SELECT max(ingestTimestamp) as max_ingest_timestamp '
            'FROM `{0:s}.{1:s}.{2:s}`'.format(self.project_id, self.dataset_id,
                                              self.temp_updates_table_id),
            job_config=get_last_max_ts_config,
            location='US')
        get_last_max_timestamp_query.result()
        results = list(get_last_max_timestamp_query)
        max_ingest_timestamp = results[0]['max_ingest_timestamp']
        if not max_ingest_timestamp:
            max_ingest_timestamp = INITIAL_TIMESTAMP

        return max_ingest_timestamp.strftime('%Y-%m-%d %H:%M:%S.%f %Z')

    def gather_updates(self, gather_updates_query):
        """Gathers updates to a temp table.

        Args:
            gather_updates_query(str): Query string for gathering updates.

        Returns:
            Boolean True if at least one row was returned by the bql query,
            indicating that at least one update occurred during the last time
            interval. Else returns Boolean False.
        """
        logging.info(
            '{0:s} Gathering updates and writing to temp table.'.format(
                str(datetime.datetime.now())))
        max_ingest_timestamp = self.get_max_ingest_timestamp()
        temp_updates_table_ref = self.dataset_ref.table(
            self.temp_updates_table_id)
        gather_updates_job_config = bigquery.QueryJobConfig()
        gather_updates_job_config.use_legacy_sql = False
        gather_updates_query_job = self.bq_client.query(
            query=gather_updates_query.format(max_ingest_timestamp),
            location='US',
            job_config=gather_updates_job_config)
        gather_updates_query_job.result()

        if len(list(gather_updates_query_job)) > 0:
            load_updates_job_config = bigquery.QueryJobConfig()
            load_updates_job_config.destination = temp_updates_table_ref
            load_updates_job_config.write_disposition = 'WRITE_TRUNCATE'
            load_updates_job_config.use_legacy_sql = False
            load_updates_query_job = self.bq_client.query(
                query=gather_updates_query.format(max_ingest_timestamp),
                location='US',
                job_config=load_updates_job_config)
            load_updates_query_job.result()
            logging.info('{0:s} Successfully wrote updates to {1:s}.'.format(
                str(datetime.datetime.now()), self.temp_updates_table_id))
            return True
        else:

            logging.info('{0:s} No new updates found for this interval.'.format(
                str(datetime.datetime.now())))
            return False

    def merge_updates(self, merge_updates_query):
        """Merges rows from the temp table into the final table.

        Args:
            merge_updates_query(str): Query for merging updates from the temp
                updates table to the final table.

        """

        logging.info('{0:s} Merging updates from {1:s} into {2:s}.'.format(
            str(datetime.datetime.now()), self.temp_updates_table_id,
            self.final_table_id))

        merge_updates_job_config = bigquery.QueryJobConfig()
        merge_updates_job_config.use_legacy_sql = False

        merge_updates_query_job = self.bq_client.query(
            query=merge_updates_query,
            location='US',
            job_config=merge_updates_job_config)
        merge_updates_query_job.result()
        logging.info('{0:s} Successfully merged updates into {1:s}.'.format(
            str(datetime.datetime.now()), self.final_table_id))
