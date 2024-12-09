#  Copyright 2024 Google LLC. This software is provided as-is, without warranty
#  or representation for any use or purpose. Your use of it is subject to your
#  agreement with Google.

"""This file runs the main pipeline."""

import argparse
import logging
import os
import sys
from typing import List, Type
import yaml

import apache_beam as beam
from apache_beam.options import pipeline_options

from src.common import utils
from src import pipeline


def parse_arguments(argv: List[str]) -> Type[argparse.Namespace]:
	"""
	Creates and parses arguments provided from CLI or from config file.

	Args:
		argv (List[str]): A list of strings representing the input arguments.

	Returns:
		Type[argparse.Namespace]: A Namespace object containing the parsed arguments 
			as attributes.
	"""
	config_parser = argparse.ArgumentParser(
			description=__doc__,
			formatter_class=argparse.RawDescriptionHelpFormatter,
			add_help=False,
	)
	config_parser.add_argument(
			"--config_file",
			help="""Local or GCS path to YAML config file. If none specified,
				required arguments will be parsed from the command-line.""",
			type=str,
	)
	args, _ = config_parser.parse_known_args(argv)
	config = {}
	if args.config_file:
		config = yaml.safe_load(utils.read_file(path=args.config_file))

	parser = argparse.ArgumentParser(
			parents=[config_parser],
			description=__doc__,
	)
	parser.add_argument(
			"--project",
			help="GCP project ID.",
			type=str,
			required=("project" not in config),
	)
	parser.add_argument(
			"--job_dir",
			help="""Directory for temporary, staging, and intermediate files.
				Must be a GCS bucket if running on the cloud.""",
			type=str,
			required=("job_dir" not in config),
	)
	parser.add_argument(
			"--region",
			help="GCP region to run Dataflow in.",
			type=str,
			required=("region" not in config),
	)
	parser.add_argument(
			"--job_name",
			help="Dataflow job name. Timestamp will be appended.",
			type=str,
			required=("job_name" not in config),
	)
	parser.add_argument(
			"--machine_type",
			help="Dataflow worker machine type. Default `n1-standard-2`.",
			type=str,
			default="n1-standard-2",
	)
	parser.add_argument(
			"--max_num_workers",
			help="""Maximum number of workers allowed in the Dataflow job. Default
				`None` which allows GCP default of 1000.""",
			type=int,
			default=None,
	)
	parser.add_argument(
			"--service_account",
			help="Dataflow Service account",
			type=str,
			default=None,
	)
	parser.add_argument(
			"--setup_file",
			help="Path to setup.py file specifying local package dependencies.",
			type=str,
			default="./setup.py",
	)
	parser.add_argument(
			"--prod",
			help="Whether to run the job on GCP (True). Default `False`.",
			type=utils.str_to_bool,
			default=False,
	)
	parser.add_argument(
			"--mode",
			help="Whether to run GCS usecase or BQ usecase ",
			type=str,
			required=("mode" not in config),
	)
	parser.add_argument(
			"--inspect_template",
			help="DLP Inspect Template ",
			type=str,
			required=("mode" not in config),
	)
	parser.add_argument(
			"--deidentify_template",
			help="DLP Deidentify Template ",
			type=str,
			required=("mode" not in config),
	)
	parser.add_argument(
			"--dlp_batch_size",
			help="Batch size for DLP API ",
			type=int,
			default=100
	)

	# Set defaults from config file.
	parser.set_defaults(**config)
	args, _ = parser.parse_known_args(argv)

	# Set the required paramaters for each mode
	parser.add_argument(
			"--input_dir",
			help="GCS Input dir",
			type=str,
			required=(args.mode == "gcs" and "input_dir" not in config)
	)
	parser.add_argument(
			"--output_dir",
			help="GCS Output dir",
			type=str,
			required=(args.mode == "gcs" and "output_dir" not in config)
	)
	parser.add_argument(
			"--input_projects",
			help="BigQuery Input Projects (separated by comma)",
			type=str,
			required=(args.mode == "bq" and "input_projects" not in config)
	)
	parser.add_argument(
			"--output_projects",
			help="BigQuery Output Projects (separated by comma)",
			type=str,
			required=(args.mode == "bq" and "output_projects" not in config)
	)
	args, _ = parser.parse_known_args(argv)

	if args.mode == "bq":
		args.input_projects = args.input_projects.split(",")
		args.output_projects = args.output_projects.split(",")
		if len(args.input_projects) != len(args.output_projects):
			raise ValueError("Each input project should have a corresponding output project")

	# Append current timestamp to job name
	args.job_name, args.timestamp = utils.get_job_name_with_timestamp(
			args.job_name)
	logging.info(f"Job name with timestamp: {args.job_name}.")

	return args


def get_pipeline_options(
		args: Type[argparse.Namespace]
) -> Type[pipeline_options.PipelineOptions]:
	"""Constructs and returns PipelineOptions based on provided arguments.

	Args:
		args (argparse.Namespace): A Namespace object containing the parsed 
			arguments as attributes.

	Returns:
		(pipeline_options.PipelineOptions): A PipelineOptions object 
			configured with the provided arguments.
	"""
	options_dict = {
			"runner": "DirectRunner",
			"project": args.project,
			"temp_location": os.path.join(args.job_dir, "tmp"),
			"staging_location": os.path.join(args.job_dir, "stg"),
	}
	if not args.prod:
		return pipeline_options.PipelineOptions(flags=[], **options_dict)

	options_dict.update({
			"runner": "DataflowRunner",
			"job_name": args.job_name,
			"region": args.region,
			"max_num_workers": args.max_num_workers,
			"setup_file": args.setup_file,
			"service_account_email": args.service_account,
			"use_public_ips": False
	})
	options = pipeline_options.PipelineOptions(flags=[], **options_dict)
	options.view_as(
			pipeline_options.WorkerOptions).machine_type = args.machine_type
	return options


def main():
	"""Configures and runs the Apache Beam pipeline."""
	logging.getLogger().setLevel(logging.INFO)
	args = parse_arguments(sys.argv)
	options = get_pipeline_options(args)
	with beam.Pipeline(options=options) as beam_pipeline:
		pipeline.build_pipeline(beam_pipeline, args)


if __name__ == "__main__":
	main()
