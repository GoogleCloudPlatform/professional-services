#  Copyright 2024 Google LLC. This software is provided as-is, without warranty
#  or representation for any use or purpose. Your use of it is subject to your
#  agreement with Google.

"""This file builds the pipeline that is ran when using gcs mode."""

from argparse import Namespace
from typing import Type
import apache_beam as beam
from apache_beam.io import fileio
from apache_beam.options.pipeline_options import PipelineOptions
from src.dlp.deidentify import DeidentifyDoFn
from src.gcs.helpers import AvroFileSink, AvroSchema, TextFileSink
from src.gcs.helpers import ensure_avro_data_follows_schema, key_naming
from src.gcs.helpers import read_avro_with_filename, read_text_with_filename


def run_gcs_pipeline(pipeline: beam.Pipeline, args: Type[Namespace]):
	"""Executes a Beam pipeline to de-identify data stored in GCS

	This function defines a Beam pipeline that reads various file types from GCS,
	de-identifies sensitive information within them using Cloud DLP, and then
	writes the de-identified data back to GCS.

	The pipeline supports the following file types:
		* CSV (.csv)
		* TSV (.tsv)
		* TXT (.txt)
		* DAT (.dat)
		* XML (.xml)
		* JSON (.json)
		* AVRO (.avro)

	Args:
		pipeline (beam.Pipeline): A Pipeline object containing the pipeline's 
			configuration.
		args (Namespace): A Namespace object containing arguments that specify
			the input directory, output directory, Cloud DLP templates, and other 
			pipeline parameters.
	"""
	file_prefix = f"{args.input_dir}/**/*"
	csv_files = read_text_with_filename(pipeline, f"{file_prefix}.csv", label="Read CSV Files")
	tsv_files = read_text_with_filename(pipeline, f"{file_prefix}.tsv", label="Read TSV Files")
	txt_files = read_text_with_filename(pipeline, f"{file_prefix}.txt", label="Read TXT Files")
	dat_files = read_text_with_filename(pipeline, f"{file_prefix}.dat", label="Read DAT Files")
	xml_files = read_text_with_filename(pipeline, f"{file_prefix}.xml", label="Read XML Files")
	json_files = read_text_with_filename(pipeline, f"{file_prefix}.json", label="Read JSON Files")
	avro_files = read_avro_with_filename(pipeline, f"{file_prefix}.avro", label="Read AVRO Files")

	# TODO: Validate Avro file is appending all batches of a file
	# Avro files pipeline
	(
			avro_files
			| "Group Avro by File Name" >> beam.GroupByKey()
			| "Add Avro Schema" >> beam.ParDo(AvroSchema())
			| "Deidentify Avro" >> beam.ParDo(
					DeidentifyDoFn(
							project=args.project,
							inspect_template=args.inspect_template,
							deidentify_template=args.deidentify_template,
							batch=args.dlp_batch_size,
							is_structured=True,
							input_dir=args.input_dir)
			)
			| "Prepare for Write" >> beam.Map(
					lambda element: (
							element[0],
							ensure_avro_data_follows_schema(element[1], element[2]),
							element[2])
			)
			| "Output" >> fileio.WriteToFiles(
					args.output_dir,
					destination=lambda element: element[0],
					sink=AvroFileSink(),
					shards=1,
					file_naming=key_naming,
			)
	)
	# Unstructed Text files pipeline
	(
			(csv_files, tsv_files, txt_files, dat_files, xml_files, json_files)
			| "Flatten" >> beam.Flatten()
			| "Group by File Name" >> beam.GroupByKey()
			| "Deidentify" >> beam.ParDo(DeidentifyDoFn(
					project=args.project,
					inspect_template=args.inspect_template,
					deidentify_template=args.deidentify_template,
					batch=args.dlp_batch_size,
					input_dir=args.input_dir
			))
			| "Output " >> fileio.WriteToFiles(
					args.output_dir,
					destination=lambda element: element[0],
					sink=TextFileSink(),
					shards=1,
					file_naming=key_naming)
	)
