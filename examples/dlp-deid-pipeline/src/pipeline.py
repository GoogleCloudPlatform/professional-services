#  Copyright 2024 Google LLC. This software is provided as-is, without warranty
#  or representation for any use or purpose. Your use of it is subject to your
#  agreement with Google.

"""This file is the main file that builds the Beam pipeline."""

from argparse import Namespace
from typing import Type
from apache_beam import Pipeline
from apache_beam.options.pipeline_options import PipelineOptions
from src.bq.pipeline import run_bq_pipeline
from src.gcs.pipeline import run_gcs_pipeline


def build_pipeline(
		pipeline: Pipeline,
		args: Type[Namespace]):
  """Builds and executes a Beam pipeline based on the specified mode."""
  if args.mode == "gcs":
    run_gcs_pipeline(pipeline, args)
  else:
    run_bq_pipeline(pipeline, args)
