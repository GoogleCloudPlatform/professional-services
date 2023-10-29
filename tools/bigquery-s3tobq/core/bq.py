from google.cloud import bigquery
from google.cloud.exceptions import NotFound

from typing import List

BQ_CLIENT  = bigquery.Client()

def create_table(table_id: str, fields: List):
  try:
    BQ_CLIENT.get_table(table_id)
  except NotFound:
    schema = []
    for field in fields:
      if 'mode' in field.keys():
        schema.append(bigquery.SchemaField(field['name'], field['type'], mode = field['mode']))
      else:
        schema.append(bigquery.SchemaField(field['name'], field['type']))
    table = bigquery.Table(table_id, schema=schema)
    BQ_CLIENT.create_table(table)

def create_dataset(dataset_id: str, dataset_location: str, timeout:int = 30):
  try:
    BQ_CLIENT.get_dataset(dataset_id)
  except NotFound:
    dataset = bigquery.Dataset(dataset_id)
    dataset.location = dataset_location

    dataset = BQ_CLIENT.create_dataset(dataset, timeout=30)

def create_udfs():
  pass

def run_query(query: str):
  return BQ_CLIENT.query(query)  # Make an API request.
