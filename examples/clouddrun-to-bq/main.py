"""
This application recieves data on HTTP endpoint and inserts into BQ
"""

import json
import logging
import os

from flask import Flask, request, jsonify
from google.api_core import retry
from google.cloud import bigquery
import google.cloud.logging
from google.cloud.logging.handlers import CloudLoggingHandler
from jsonschema import validate, ValidationError


PROJECT_ID = os.getenv('GCP_PROJECT')
BQ_DATASET = os.getenv('BQ_DATASET')
BQ_TABLE = os.getenv('BQ_TABLE')
SERVING_PORT = os.environ.get("SERVING_PORT", 8080)
LOG_LEVEL = os.environ.get("LOG_LEVEL", logging.INFO)
SCHEMA = {
  "type": "object",
  "properties": {
    "Name": { "type": "string" },
    "Age": { "type": "integer" }
  },
  "required": ["Name", "Age"],
  "additionalProperties": False
}

class BigQueryError(Exception):
    '''Exception raised whenever a BigQuery error happened'''

    def __init__(self, errors):
        super().__init__(self._format(errors))
        self.errors = errors

    def _format(self, errors):
        err = []
        for error in errors:
            err.extend(error['errors'])
        return json.dumps(err)


class BQApiClient:
    '''BQ Client to process bq requests'''

    def __init__(self, project_id):
        self._project_id = project_id
        self._client = bigquery.Client(PROJECT_ID)

    def insert(self, data, dataset, table):
        '''Insert data into BQ'''
        LOG.debug("Inserting data  in to %s:%s:%s",
                  PROJECT_ID,  dataset, table)
        table = self._client.dataset(dataset).table(table)
        errors = self._client.insert_rows_json(table,
                                               json_rows=[data],
                                               retry=retry.Retry(deadline=30))
        if errors:
            raise BigQueryError(errors)
        LOG.debug("Successfully Inserted data in to %s:%s:%s",
                  PROJECT_ID,  dataset, table)


def _get_logger():
    client = google.cloud.logging.Client(PROJECT_ID)
    handler = CloudLoggingHandler(client, name="cr-events-processor")
    cloud_logger = logging.getLogger('cr-events-processor')
    cloud_logger.setLevel(LOG_LEVEL)
    cloud_logger.addHandler(handler)
    return cloud_logger


app = Flask(__name__)
LOG = _get_logger()


@app.route("/")
def ping():
    '''Handle ping request'''
    return "BQ insertion Service"


@app.route("/events", methods=['POST'])
def post_events():
    '''Handle event POST request'''
    try:
        event = request.json
        LOG.debug("Recieved event %s", event)
        validate(instance=event, schema=SCHEMA)
        client = BQApiClient(PROJECT_ID)
        client.insert(event, BQ_DATASET, BQ_TABLE)
        return jsonify(status="success"), 200
    except ValidationError as er:
        return jsonify(status="Failure", reason=str(er)), 400
    except BigQueryError as bq_error:
        LOG.error(
            "Failed to insert data in to BQ due to bq_error: %s", str(bq_error))
        return jsonify(status="Failure", reason=str(bq_error)), 500
    except Exception as ex:
        LOG.error(
            "Failed to insert data due to %s", str(ex))
        return jsonify(status="Failure", reason=str(ex)), 500


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=int(SERVING_PORT))
