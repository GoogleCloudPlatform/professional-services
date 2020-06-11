# Copyright 2019 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#            http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""
`bigquery.py`
BigQuery exporter class.
"""
import json
import logging
import google.api_core
from google.cloud import bigquery

LOGGER = logging.getLogger(__name__)


class BigqueryExporter:
    """BigQuery exporter class."""

    def __init__(self):
        self.client = bigquery.Client(project="unset")

    def export(self, data, **config):
        """Export results to BigQuery.

        Args:
            data (dict): Data to export.
                service_name (str): Service name.
                feature_name (str): Feature name.
                slo_name (str): SLO name.
                timestamp_human (str): Timestamp in human-readable format.
                measurement_window_seconds (int): Measurement window (in s).

            config (dict): Exporter config.
                project_id (str): BigQuery dataset project id.
                dataset_id (str): BigQuery dataset id.
                table_id (str): BigQuery table id.

        Raises:
            BigQueryError (object): BigQuery exception object.
        """
        project_id = config['project_id']
        dataset_id = config['dataset_id']
        table_id = config['table_id']
        self.client.project = project_id
        table_ref = self.client.dataset(dataset_id).table(table_id)
        try:
            table = self.client.get_table(table_ref)
        except google.api_core.exceptions.NotFound:
            table = self.create_table(project_id,
                                      dataset_id,
                                      table_id,
                                      schema=TABLE_SCHEMA)
        row_ids = "%s%s%s%s%s" % (data["service_name"], data["feature_name"],
                                  data["slo_name"], data["timestamp_human"],
                                  data["window"])
        results = self.client.insert_rows_json(
            table,
            json_rows=[data],
            row_ids=[row_ids],
            retry=google.api_core.retry.Retry(deadline=30))
        if results != []:
            raise BigQueryError(results)

        return results

    def create_table(self, project_id, dataset_id, table_id, schema=None):
        """Creates a BigQuery table from a schema.

        Args:
            project_id (str): Project id.
            dataset_id (str): Dataset id.
            table_id (str): Table id to create.
            schema (dict): BigQuery table schema in JSON format.
        """
        pyschema = []
        if schema is not None:
            schema = TABLE_SCHEMA
        for row in schema:
            field = bigquery.SchemaField(row['name'],
                                         row['type'],
                                         mode=row['mode'])
            pyschema.append(field)
        table_name = f"{project_id}.{dataset_id}.{table_id}"
        LOGGER.info(f"Creating table {table_name}", table_name)
        table = bigquery.Table(table_name, schema=pyschema)
        return self.client.create_table(table)


class BigQueryError(Exception):
    """Exception raised whenever a BigQuery error happened.

    Args:
        errors (list): List of errors.
    """

    def __init__(self, errors):
        super().__init__(BigQueryError._format(errors))
        self.errors = errors

    @staticmethod
    def _format(errors):
        err = []
        for error in errors:
            err.extend(error['errors'])
        return json.dumps(err)


TABLE_SCHEMA = [{
    "description": "",
    "name": "service_name",
    "type": "STRING",
    "mode": "REQUIRED"
}, {
    "description": "",
    "name": "feature_name",
    "type": "STRING",
    "mode": "REQUIRED"
}, {
    "description": "",
    "name": "slo_name",
    "type": "STRING",
    "mode": "REQUIRED"
}, {
    "description": "",
    "name": "slo_target",
    "type": "FLOAT64",
    "mode": "NULLABLE"
}, {
    "description": "",
    "name": "slo_description",
    "type": "STRING",
    "mode": "REQUIRED"
}, {
    "description": "",
    "name": "error_budget_policy_step_name",
    "type": "STRING",
    "mode": "NULLABLE"
}, {
    "description": "",
    "name": "error_budget_remaining_minutes",
    "type": "FLOAT64",
    "mode": ""
}, {
    "description": "",
    "name": "consequence_message",
    "type": "STRING",
    "mode": "NULLABLE"
}, {
    "description": "",
    "name": "error_budget_minutes",
    "type": "FLOAT64",
    "mode": "NULLABLE"
}, {
    "description": "",
    "name": "error_minutes",
    "type": "FLOAT64",
    "mode": "NULLABLE"
}, {
    "description": "",
    "name": "error_budget_target",
    "type": "FLOAT64",
    "mode": "NULLABLE"
}, {
    "description": "",
    "name": "timestamp_human",
    "type": "TIMESTAMP",
    "mode": "REQUIRED"
}, {
    "description": "",
    "name": "timestamp",
    "type": "FLOAT64",
    "mode": "NULLABLE"
}, {
    "description": "",
    "name": "cadence",
    "type": "STRING",
    "mode": "NULLABLE"
}, {
    "description": "",
    "name": "window",
    "type": "INT64",
    "mode": "REQUIRED"
}, {
    "description": "",
    "name": "bad_events_count",
    "type": "INT64",
    "mode": "NULLABLE"
}, {
    "description": "",
    "name": "good_events_count",
    "type": "INT64",
    "mode": "NULLABLE"
}, {
    "description": "",
    "name": "sli_measurement",
    "type": "FLOAT64",
    "mode": "NULLABLE"
}, {
    "description": "",
    "name": "gap",
    "type": "FLOAT64",
    "mode": "NULLABLE"
}, {
    "description": "",
    "name": "error_budget_measurement",
    "type": "FLOAT64",
    "mode": "NULLABLE"
}, {
    "description": "",
    "name": "error_budget_burn_rate",
    "type": "FLOAT64",
    "mode": "NULLABLE"
}, {
    "description": "",
    "name": "alerting_burn_rate_threshold",
    "type": "FLOAT64",
    "mode": "NULLABLE"
}, {
    "description": "",
    "name": "alert",
    "type": "BOOL",
    "mode": "NULLABLE"
}]
