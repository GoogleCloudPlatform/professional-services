#  Copyright 2024 Google LLC. This software is provided as-is, without warranty
#  or representation for any use or purpose. Your use of it is subject to your
#  agreement with Google.

"""This file builds the pipeline that is ran when using BQ mode."""

from typing import Type
from argparse import Namespace
import apache_beam as beam
from src.bq.helpers import AddKey, AddSchema, bq_to_beam_table_schema, ensure_bq_data_follows_schema
from src.common.utils import get_table_schemas, list_all_table_refs
from src.dlp.deidentify import DeidentifyDoFn


def run_bq_pipeline(pipeline: beam.Pipeline, args: Type[Namespace]):
	"""Executes a Beam pipeline to de-identify data in BigQuery.

	This function defines a Beam pipeline that reads data from multiple BigQuery 
	tables, de-identifies sensitive information using DLP, and then writes the 
	de-identified data to corresponding tables in the destination BigQuery project.

	Args:
		pipeline: The Apache Beam pipeline object.
		args: A Namespace object containing arguments, including:
					- input_projects: A list of input BigQuery project IDs.
					- output_projects: A list of output BigQuery project IDs.
					- inspect_template: The DLP inspect template name.
					- deidentify_template: The DLP de-identify template name.
					- dlp_batch_size: The batch size for DLP processing.
	"""
	input_table_refs, output_table_refs = list_all_table_refs(
		args.input_projects, args.output_projects)
	schemas = get_table_schemas(input_table_refs)

	for i in range(len(input_table_refs)):
		input_table_ref = input_table_refs[i]
		schema = schemas[i]
		output_table_ref = output_table_refs[i]
		(
				pipeline
				| f"Read from {input_table_ref}" >> beam.io.ReadFromBigQuery(table=input_table_ref)
				| f"Attach {input_table_ref}" >> beam.ParDo(AddKey(input_table_ref))
				| f"Group by {input_table_ref}" >> beam.GroupByKey()
				| f"Attach schema for {input_table_ref}" >> beam.ParDo(AddSchema(schema))
				| f"Deidentify {input_table_ref}" >> beam.ParDo(DeidentifyDoFn(
						inspect_template=args.inspect_template,
						deidentify_template=args.deidentify_template,
						batch=args.dlp_batch_size,
						is_structured=True
				))
				| f"Enforce schema for {input_table_ref}" >> beam.Map(
						lambda element: ensure_bq_data_follows_schema(element[1], element[2])
				)
				| f"Flatten {input_table_ref}" >> beam.FlatMap(lambda element: element)
				| f"Write to {output_table_ref}" >> beam.io.WriteToBigQuery(
					table=output_table_ref,
					schema=bq_to_beam_table_schema(schema),
					write_disposition=beam.io.BigQueryDisposition.WRITE_TRUNCATE
				)
		)
