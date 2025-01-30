#  Copyright 2024 Google LLC. This software is provided as-is, without warranty
#  or representation for any use or purpose. Your use of it is subject to your
#  agreement with Google.

"""This file contains shared helper functions for both pipeline modes."""

import argparse
import datetime
from typing import Tuple, List

from google.cloud import bigquery
from google.cloud import storage


def get_job_name_with_timestamp(job_name: str) -> Tuple[str, datetime.datetime]:
	"""Appends the timestamp to the given job name.

	Args:
			 job_name: The name of the job.

	Returns:
			A 2-tuple (job name with timestamp suffix, timestamp object).
	"""
	timestamp = datetime.datetime.now()
	return f"{job_name}-{timestamp.strftime('%Y%m%d%H%M%S')}", timestamp


def parse_gcs_uri(uri: str) -> Tuple[str, str]:
	"""Returns the given GCS URI's bucket and blob separately as a tuple.

	This function assumes that the given URI has been validated for GCS URI
	formatting (i.e., it begins with "gs://"). If no additional directory was
	specified, the second item in the tuple is `None`.

	Args:
			uri: GCS URI to parse.

	Returns:
			2-tuple of format (bucket name, blob name).
	"""
	split = uri.split("/", 3)
	bucket_name = split[2]
	blob_name = split[3] if len(split) > 3 else None
	return bucket_name, blob_name


def read_file(path: str) -> str:
	"""Returns the contents of the given local or GCS file as string.

	Args:
			path: Path to the file either locally or on GCS.

	Returns:
			The file's contents as str.
	"""
	if path.startswith("gs://"):
		client = storage.Client()
		bucket_name, blob_name = parse_gcs_uri(path)
		bucket = client.get_bucket(bucket_name)
		blob = bucket.get_blob(blob_name)
		return blob.download_as_string()
	else:
		with open(path, "r", encoding="utf-8") as f:
			return f.read()


def remove_prefix(path, prefix):
	if prefix and path.startswith(prefix):
		return path[len(prefix)+1:]
	return path


def list_all_table_refs(
		input_projects: List[str],
		output_projects: List[str]) -> Tuple[List[str], List[str]]:
	"""Lists all BigQuery table references in the given input projects and the 
	generates the corresponding output table reference in the output project

	Args:
		input_projects: A list of Google Cloud project IDs for the input tables.
		output_projects: A list of Google Cloud project IDs for the output tables.

	Returns:
		A tuple containing two lists:
			- A list of fully-qualified table references for the input tables 
				(e.g., "project1:dataset1.table1").
			- A list of fully-qualified table references for the output tables 
				(e.g., "project2:dataset1.table1").
	"""
	input_table_list, output_table_list = [], []
	for input_proj, output_proj in zip(input_projects, output_projects):
		client = bigquery.Client(project=input_proj)
		datasets = list(client.list_datasets())
		for dataset in datasets:
			dataset_id = dataset.dataset_id
			tables = list(client.list_tables(dataset_id))
			for table in tables:
				input_table_str = f"{input_proj}:{dataset_id}.{table.table_id}"
				output_table_str = f"{output_proj}:{dataset_id}.{table.table_id}"
				input_table_list.append(input_table_str)
				output_table_list.append(output_table_str)
	return input_table_list, output_table_list


def get_table_schemas(table_refs: List[str]) -> List[List[bigquery.SchemaField]]:
	"""Retrieves the schemas of the specified BigQuery tables.

	Args:
		table_refs: A list of fully-qualified BigQuery table references 
				(e.g., "project.dataset.table").

	Returns:
		A list of schemas, where each schema is a list of `SchemaField` objects.
	"""
	client = bigquery.Client()
	schemas = []
	for table_ref in table_refs:
		table_ref = table_ref.replace(':', '.')
		table = client.get_table(table_ref)
		schemas.append(table.schema)
	return schemas


def str_to_bool(v: str) -> bool:
	"""Returns boolean representation of string.

	Args:
			v: String value to convert.

	Returns:
			Boolean version of string.
	"""
	if isinstance(v, bool):
		return v
	if v.lower() == "true":
		return True
	if v.lower() == "false":
		return False
	else:
		return argparse.ArgumentTypeError("Value can only be true/false")
