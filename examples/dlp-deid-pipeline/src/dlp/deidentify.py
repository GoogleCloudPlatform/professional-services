#  Copyright 2024 Google LLC. This software is provided as-is, without warranty
#  or representation for any use or purpose. Your use of it is subject to your
#  agreement with Google.

"""
This file contains Deidentify DoFn and all helper functions/classes used to 
deidentify sensitive data.
"""

import datetime
import google.cloud.dlp
import google.cloud.dlp_v2 as dlp_v2
import apache_beam as beam

from typing import Any, Dict, List, Tuple, Union

from src.common.utils import remove_prefix


def deidentify(
				dlp_client: dlp_v2.DlpServiceClient,
				project: str,
				item: Dict,
				inspect_template: str,
				deidentify_template: str) -> dlp_v2.DeidentifyContentResponse:
	"""
	De-identifies sensitive data within a given item using DLP.

	This function uses the DLP API to de-identify sensitive information ound in
	the input `item`. It utilizes the provided inspection and de-identification
	templates to identify and transform sensitive data.

	Args:
		dlp_client: An instance of the DLP service client.
		project: The Google Cloud project ID.
		item: A dictionary representing the data item to de-identify. The
					structure of this dictionary depends on the data type being
					processed (e.g., text, image, structured data).
		inspect_template: The name of the DLP inspection template to use.
		deidentify_template: The name of the DLP de-identification template to use.

	Returns:
		A DeidentifyContentResponse object containing the de-identified data.
	"""

	response = dlp_client.deidentify_content(
			request={
					"parent": f"projects/{project}",
					"inspect_template_name": inspect_template,
					"deidentify_template_name": deidentify_template,
					"deidentify_config": {
							"transformation_error_handling": {
									"leave_untransformed": {}
							}
					},
					"item": item
			}
	)
	return response


def format_data_for_dlp(data: List[Dict[str, Any]]) -> Dict[str, List[Dict]]:
	"""
	Formats data for use with the DLP API.

	This function transforms a list of dictionaries into the specific format
	required by the DLP API for structured data. It converts data types
	like dates and datetimes to ISO format strings and structures the data
	into a dictionary with "headers" and "rows".

	Args:
		data: A list of dictionaries, where each dictionary represents a row
					of data. The keys in the dictionaries represent the column names.

	Returns:
		A dictionary formatted for DLP with the following structure:
		{
			'headers': [ {'name': 'column1'}, {'name': 'column2'}, ... ],
			'rows': [
				{'values': [{'string_value': 'value1'}, {'string_value': 'value2'}, ...]},
				{'values': [{'string_value': 'value3'}, {'string_value': 'value4'}, ...]},
				...
			]
		}
	"""
	headers = [{'name': key} for key in data[0].keys()]
	rows = []
	for record in data:
		values = []
		for key, value in record.items():
			if isinstance(value, (datetime.date, datetime.datetime)):
				value = value.isoformat()
			values.append({'string_value': str(value)})
		rows.append({'values': values})
	return {'headers': headers, 'rows': rows}


def format_dlp_output_for_write(dlp_output_table: dlp_v2.Table) -> List[Dict[str, str]]:
	"""
	Formats DLP output to Dict format.

	This function takes a `Table` object returned by the DLP API and
	transforms it into a list of dictionaries suitable for writing to a file or
	BQ table.

	Args:
		dlp_output_table: A `dlp_v2.Table` object containing the de-identified data
				from DLP.

	Returns:
		A list of dictionaries, where each dictionary represents a row of data,
		and the keys in the dictionaries correspond to the column headers.
	"""
	headers = [header.name for header in dlp_output_table.headers]
	data = []
	for row in dlp_output_table.rows:
		record = {}
		for i, value in enumerate(row.values):
			value = value.string_value
			key = headers[i]
			record[key] = value
		data.append(record)
	return data


class DeidentifyDoFn(beam.DoFn):
	"""De-identifies data using DLP.

	This DoFn processes batches of data and applies de-identification using
	the DLP API. It supports both structured and unstructured data.

	For structured data, it expects a list of dictionaries, where each
	dictionary represents a row. For unstructured data, it expects a string.

	Attributes:
		is_structured: A boolean indicating whether the data is structured.
		batch: The batch size for processing data.
		inspect_template: The name of the DLP inspect template.
		deidentify_template: The name of the DLP de-identify template.
		input_dir: The input directory for the data (used for filename prefix removal).

	Methods:
		setup(self): Initializes the DLP client.
		process(self, element): De-identifies batches of data.
		teardown(self): Cleans up the DLP client.
	"""
	def __init__(self,
							project: str,
							inspect_template: str,
              deidentify_template: str,
							batch: int,
              is_structured: bool = False,
              input_dir: str = None):
		"""Initializes the DeidentifyDoFn."""
		self.is_structured = is_structured
		self.batch = batch
		self.project = project
		self.inspect_template = inspect_template
		self.deidentify_template = deidentify_template
		self.input_dir = input_dir

	def setup(self):
		"""Initializes the DLP client."""
		self.dlp_client = google.cloud.dlp_v2.DlpServiceClient()

	def process(self, element):
		"""De-identifies data in batches.

    Args:
      element: A tuple containing the filename and the data.

    Yields:
      A tuple containing the filename and the de-identified data.
    """
		file_name, data = element[0], element[1]
		file_name = remove_prefix(file_name, self.input_dir)

		# batch the data
		batched_data = []
		for i in range(0, len(data), self.batch):
			if self.is_structured:
				batched_data.append(data[i:i + self.batch])
			else:
				batched_data.append('\n'.join(data[i:i + self.batch]))

		for data in batched_data:
			if self.is_structured:
				item = {"table": format_data_for_dlp(data)}
				response = deidentify(
						dlp_client=self.dlp_client,
						project=self.project,
						inspect_template=self.inspect_template,
						deidentify_template=self.deidentify_template,
						item=item
				)
				yield file_name, format_dlp_output_for_write(response.item.table), element[2]
			else:
				item = {"value": data}
				response = deidentify(
						dlp_client=self.dlp_client,
						project=self.project,
						inspect_template=self.inspect_template,
						deidentify_template=self.deidentify_template,
						item=item
				)
				yield file_name, response.item.value

	def teardown(self):
		"""Cleans up the DLP client."""
		del self.dlp_client
