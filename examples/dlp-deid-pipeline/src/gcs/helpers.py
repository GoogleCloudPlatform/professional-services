#  Copyright 2024 Google LLC. This software is provided as-is, without warranty
#  or representation for any use or purpose. Your use of it is subject to your
#  agreement with Google.

"""
This file contains all the helper functions and classes used by the GCS-mode 
pipeline.
"""

from io import BytesIO
import logging
from typing import Dict, List, Tuple
import apache_beam as beam
from apache_beam.io import fileio
from fastavro import reader
from fastavro import writer
from google.cloud import storage


class TextFileSink(fileio.TextSink):
  """
  A sink for writing text data to files.

  This class extends the `fileio.TextSink` class to provide a specific 
  implementation for writing text data to files. It takes a list of 
  text lines as input and writes them to a file, ensuring each line 
  is encoded in UTF-8 and followed by a newline character.
  """

  def write(self, element):
    self._fh.write(element[1].encode("utf8"))
    self._fh.write("\n".encode("utf8"))


class AvroFileSink(fileio.FileSink):
  """
  A sink for writing Avro data to files.

  This class extends `fileio.FileSink` to handle writing Avro data to files. 
  It uses a buffer to accumulate Avro records and then writes the entire 
  buffer to the file when flushed.

  Methods:
    open(self, fh): Opens the file for writing and initializes the buffer.
    write(self, element): Writes a single Avro record to the buffer.
    flush(self): Writes the buffer contents to the file.
    close(self): Closes the file and flushes any remaining data.
  """

  def open(self, fh):
    self.fh = fh
    self.buffer = BytesIO()
    return self.buffer

  def write(self, element):
    writer(self.buffer, element[2], element[1])

  def flush(self):
    self.buffer.seek(0)  # Reset the buffer for reading
    self.fh.write(self.buffer.read())
    self.buffer.close()

  def close(self):
    self.flush()


def key_naming(window, pane, shard_index, total_shards, compression, destination):
  """Callable for WriteToFiles IO that defines how to name a file."""
  return f"{destination}"


class AvroSchema(beam.DoFn):
  """
  DoFn to extract the schema from Avro files in GCS.

  This DoFn reads Avro files from GCS, extracts their schema, and yields a tuple 
  containing the GCS URI, the original file contents, and the extracted schema.
  """

  def setup(self):
    """Initializes a Google Cloud Storage client."""
    self.storage_client = storage.Client()

  def process(self, element):
    """
    Extracts the schema from an Avro file.

    Args:
      element: A tuple where:
        - element[0] is the GCS URI of the Avro file
        - element[1] is the original file contents

    Yields:
      A tuple containing:
        - The GCS URI of the Avro file (str).
        - The original file contents (List[Any]).
        - The extracted Avro schema (dict).
    """
    gcs_uri = element[0]
    parts = gcs_uri[5:].split("/", 1)
    bucket_name, file_path = parts
    bucket = self.storage_client.bucket(bucket_name)
    blob = bucket.blob(file_path)
    with blob.open("rb") as avro_file:
      avro_reader = reader(avro_file)
      schema = avro_reader.schema
    yield gcs_uri, element[1], schema

  def teardown(self):
    """Cleans up the storage client."""
    del self.storage_client


def read_text_with_filename(
      pipeline: beam.Pipeline,
      file_pattern: str,
      label: str = "Read Files") -> Tuple[str, Dict]:
  """
  Reads text files with their filenames from a given pattern.

  This function reads text files that match the provided file pattern and 
  returns a PCollection where each element is a tuple containing the filename 
  and the file contents.

  Args:
    pipeline: The Apache Beam pipeline object.
    file_pattern: The file pattern to match (e.g., "gs://my-bucket/data/*.txt").
    label: An optional string label for the Beam transform.

  Returns:
    A PCollection of tuples, where each tuple contains:
      - The filename (str).
      - The file content (a line) as a single string (str).
  """
  try:
    files = pipeline | label >> beam.io.ReadFromTextWithFilename(file_pattern)
  except OSError as e:
    files = pipeline | label >> beam.Create([])
    logging.info(f"Error reading files: {e}")
  return files


def read_avro_with_filename(
    pipeline: beam.Pipeline, 
    file_pattern: str, 
    label: str) -> Tuple[str, Dict]:
  """Reads files with their filenames from a given avro file pattern.

  This function reads Avro files matching the provided file pattern and returns a 
  PCollection. Each element in the PCollection is a tuple containing the filename 
  and the Avro records read from the file.

  Args:
    pipeline: The Apache Beam pipeline object.
    file_pattern: The file pattern to match (e.g., "gs://my-bucket/data/*.avro").
    label: A string label for the Beam transform.

  Returns:
    A PCollection of tuples, where each tuple contains:
      - The filename (str).
      - An avro ecords (Dict).
  """
  try:
    files = (
        pipeline
        | "Create AVRO File Pattern" >> beam.Create([file_pattern])
        | label >> beam.io.ReadAllFromAvro(with_filename=True)
    )
  except OSError as e:
    files = pipeline | label >> beam.Create([])
    logging.info(f"Error reading files: {e}")
  return files


def ensure_avro_record_follows_schema(record: Dict, schema: Dict) -> Dict:
  """
  Ensures that a dictionary of record conforms to a given Avro schema.

  Args:
      record (Dict): The record dictionary to validate and convert.
      schema (Dict): The Avro schema as a dictionary.

  Returns:
      (Dict) A new dictionary with fields converted to conform to the schema.

  Raises:
      ValueError: If the record cannot be converted to match the schema.
  """
  def convert_value(value, field_type):
    """
    Converts a value to match the specified field type.
    """
    if isinstance(field_type, list):  # Union types
      for subtype in field_type:
        try:
          return convert_value(value, subtype)
        except ValueError:
          continue
      raise ValueError(f"Value {value} does not match any type in {field_type}")

    elif field_type == "int":
      return int(value)
    elif field_type == "long":
      return int(value)
    elif field_type == "float":
      return float(value)
    elif field_type == "double":
      return float(value)
    elif field_type == "string":
      return str(value)
    elif field_type == "boolean":
      if isinstance(value, bool):
        return value
      if str(value).lower() in ["true", "false"]:
        return str(value).lower() == "true"
      raise ValueError(f"Cannot convert {value} to boolean")
    elif isinstance(field_type, dict) and field_type.get("type") == "record":
      return ensure_avro_record_follows_schema(value, field_type)
    elif isinstance(field_type, dict) and field_type.get("type") == "array":
      if not isinstance(value, list):
        raise ValueError(f"Value {value} is not a list for array type")
      item_type = field_type["items"]
      return [convert_value(item, item_type) for item in value]
    elif isinstance(field_type, dict) and field_type.get("type") == "map":
      if not isinstance(value, dict):
        raise ValueError(f"Value {value} is not a dictionary for map type")
      value_type = field_type["values"]
      return {k: convert_value(v, value_type) for k, v in value.items()}
    elif isinstance(field_type, dict) and field_type.get("type") == "enum":
      if value not in field_type["symbols"]:
        raise ValueError(f"Value {value} is not a valid enum symbol: {field_type['symbols']}")
      return value
    else:
      raise ValueError(f"Unsupported Avro type: {field_type}")

  # Validate and convert each field in the schema
  if schema["type"] != "record":
    raise ValueError("Schema root must be of type 'record'")

  result = {}
  for field in schema["fields"]:
    field_name = field["name"]
    field_type = field["type"]
    if field_name in record:
      result[field_name] = convert_value(record[field_name], field_type)
    elif "default" in field:
      result[field_name] = field["default"]
    else:
      raise ValueError(f"Missing required field: {field_name}")

  return result


def ensure_avro_data_follows_schema(data: List[Dict], schema: Dict) -> List[Dict]:
  """
  Ensures that a list of dictionaries conforms to a given Avro schema.

  Args:
      data (List[Dict]): A list of row dictionaries to validate and convert.
      schema (Dict): The Avro schema as a dictionary.

  Returns:
      A new list of dictionaries with fields converted to conform to the schema.
  """
  if not isinstance(data, list):
    raise ValueError("Input data must be a list of dictionaries")

  return [ensure_avro_record_follows_schema(row, schema) for row in data]
