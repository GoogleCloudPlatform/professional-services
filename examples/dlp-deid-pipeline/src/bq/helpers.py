#  Copyright 2024 Google LLC. This software is provided as-is, without warranty
#  or representation for any use or purpose. Your use of it is subject to your
#  agreement with Google.

"""
This file contains all the helper functions and classes used by the BQ-mode 
pipeline.
"""

import apache_beam as beam

from typing import Any, Dict, List
from google.cloud.bigquery import SchemaField


class AddKey(beam.DoFn):
  """This DoFn takes a key as input and adds it as the first element of a tuple,
  where the second element is the original element from the PCollection.

  Example:
    with beam.Pipeline() as pipeline:
      keyed_data = (
          pipeline
          | "Create Input" >> beam.Create([1, 2, 3])
          | "Add Key" >> beam.ParDo(AddKey("my_key"))
      )
       # Output: [("my_key", 1), ("my_key", 2), ("my_key", 3)]
  """
  def __init__(self, key):
    self.key = key

  def process(self, element):
    yield (self.key, element)


class AddSchema(beam.DoFn):
  """Adds a schema to each element in a PCollection.

  This DoFn takes a schema as input and adds it as the third element of a tuple,
  where the first and second elements are the original elements from the PCollection.

  Example:
    with beam.Pipeline() as pipeline:
      data_with_schema = (
          pipeline
          | "Create Input" >> beam.Create([("key1", "value1"), ("key2", "value2")])
          | "Add Schema" >> beam.ParDo(AddSchema(my_schema))

      # Output: [("key1", "value1", my_schema), ("key2", "value2", my_schema)]
      )
  """
  def __init__(self, schema):
    self.schema = schema

  def process(self, element):
    yield (element[0], element[1], self.schema)


def convert_to_type(
    value: Any, field_type: str,
    field_schema: List[SchemaField] = None):
  """
  Converts a value to the specified BigQuery field type, including nested types.
  """
  if value is None or value == 'None':
    return None  # Allow null values

  try:
    if field_type == 'STRING':
      return str(value)
    elif field_type == 'INTEGER':
      return int(value)
    elif field_type == 'FLOAT':
      return float(value)
    elif field_type == 'BOOLEAN':
      return value in [True, 'true', 'True', 1, '1']
    elif field_type == 'TIMESTAMP':
      import dateutil.parser
      return dateutil.parser.parse(value).isoformat()
    elif field_type == 'DATE':
      from datetime import datetime
      return datetime.strptime(value, '%Y-%m-%d').date().isoformat()
    elif field_type == 'DATETIME':
      from datetime import datetime
      try:
        return datetime.strptime(value, '%Y-%m-%dT%H:%M:%S.%f')
      except ValueError:
        return datetime.strptime(value, '%Y-%m-%dT%H:%M:%S')
    elif field_type == 'TIME':
      from datetime import datetime
      return datetime.strptime(value, '%H:%M:%S').time().isoformat()
    elif field_type == 'BYTES':
      return bytes(value, encoding='utf-8')
    elif field_type == 'ARRAY':
      if not isinstance(value, list):
        raise ValueError(f"Expected a list for ARRAY type, got {type(value)}")
      # Convert each element in the array
      return [convert_to_type(v, field_schema[0].field_type, field_schema[0].fields) for v in value]
    elif field_type in ['STRUCT', 'RECORD']:
      if not isinstance(value, dict):
        raise ValueError(f"Expected a dictionary for STRUCT type, got {type(value)}")
      # Convert each field in the struct
      return ensure_schema_conformance(value, field_schema)
    else:
      raise ValueError(f"Unsupported field type: {field_type}")
  except (ValueError, TypeError) as e:
    raise ValueError(f"Error converting value '{value}' to type '{field_type}': {e}")


def ensure_schema_conformance(data: Dict[str, Any], schema: List[SchemaField]) -> Dict[str, Any]:
  """
  Ensures a dictionary conforms to a BigQuery schema defined as SchemaField objects.

  Parameters:
  - data: Dict[str, Any] representing a row of data.
  - schema: List[SchemaField] representing the BigQuery table schema.

  Returns:
  - Dict[str, Any] with transformed values that conform to the schema.
  """
  transformed_data = {}
  for field in schema:
    field_name = field.name
    field_type = field.field_type
    field_schema = field.fields  # Nested schema for STRUCT or ARRAY elements
    if field_name in data:
      transformed_data[field_name] = convert_to_type(data[field_name], field_type, field_schema)
    else:
      transformed_data[field_name] = None  # Assign None if field is missing
  return transformed_data


def ensure_bq_data_follows_schema(
    data_list: List[Dict[str, Any]],
    schema: List[SchemaField]) -> List[Dict[str, Any]]:
  """
  Ensures a list of dictionaries conforms to a BigQuery schema.

  Parameters:
  - data_list: List[Dict[str, Any]] representing rows of data.
  - schema: List[SchemaField] representing the BigQuery table schema.

  Returns:
  - List[Dict[str, Any]] with transformed values that conform to the schema.
  """
  return [ensure_schema_conformance(data, schema) for data in data_list]


def bq_to_beam_table_schema(bq_schema: List[SchemaField]) -> dict:
  """
  Converts a BigQuery schema (list of SchemaField objects) to a Beam TableSchema.

  Parameters:
  - bq_schema: List[SchemaField] representing the BigQuery schema.

  Returns:
  - dict representing the Beam TableSchema.
  """

  def convert_field(field: SchemaField) -> dict:
    """
    Converts a single SchemaField to a Beam-compatible field representation.
    """
    beam_field = {
        'name': field.name,
        'type': field.field_type.upper(),
        'mode': field.mode.upper() if field.mode else 'NULLABLE'
    }
    if field.field_type.upper() in ['RECORD', 'STRUCT']:
      # Handle nested fields
      beam_field['fields'] = [convert_field(sub_field) for sub_field in field.fields]
    return beam_field

  return {'fields': [convert_field(field) for field in bq_schema]}
