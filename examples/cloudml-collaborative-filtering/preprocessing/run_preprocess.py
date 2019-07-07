# Copyright 2019 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Preprocess Steam product data and save the results as tf-records."""

import argparse
import logging
import os
import sys

import apache_beam as beam
import configparser
from tensorflow_transform.beam import impl as beam_impl

from constants import constants  # pylint: disable=g-bad-import-order
import preprocessing.preprocess as preprocess  # pylint: disable=g-bad-import-order


def parse_arguments(argv):
  """Parse command line arguments."""
  parser = argparse.ArgumentParser(
      description="Runs Preprocessing on Steam product data.")
  parser.add_argument(
      "--cloud",
      action="store_true",
      help="Run preprocessing on the cloud.")
  parser.add_argument(
      "--job_name",
      help="Dataflow job name.")
  parser.add_argument(
      "--job_dir",
      help="Bucket to stage code and write temp outputs for cloud runs.")
  parser.add_argument(
      "--output_dir",
      required=True,
      help="Dir or bucket (if cloud run) to write train, val and test data.")
  parser.add_argument(
      "--tft_dir",
      required=True,
      help="Dir or bucket (if cloud run) where tft outputs are written.")
  parser.add_argument(
      "--user_min_count",
      required=True,
      type=int,
      help="Min number of users owning an item to include it in the vocab.")
  parser.add_argument(
      "--item_min_count",
      required=True,
      type=int,
      help="Min number of items owned by a user to include it in the vocab.")
  parser.add_argument(
      "--plain_text",
      action="store_true",
      help="Write pipeline output to plain text instead of tf-record.")
  args = parser.parse_args(args=argv[1:])
  return args


def set_logging(log_level):
  """Set the logging."""
  logging.getLogger().setLevel(getattr(logging, log_level.upper()))


def get_relative_path(path):
  """Return the given path relative to this module."""
  module_dir = os.path.dirname(__file__)
  return os.path.join(module_dir, path)


def parse_config(env, config_file_path):
  """Parses configuration file.

  Args:
    env: The environment in which the preprocessing job will be run.
    config_file_path: Path to the configuration file to be parsed.

  Returns:
    A dictionary containing the parsed runtime config.
  """
  config = configparser.ConfigParser()
  config.read(config_file_path)
  return dict(config.items(env))


def get_pipeline_options(args, config):
  """Returns pipeline options based on args and confs."""
  options = {"project": str(config.get("project"))}
  if args.cloud:
    if not args.job_name:
      raise ValueError("Job name must be specified for cloud runs.")
    if not args.job_dir:
      raise ValueError("Job dir must be specified for cloud runs.")
    options.update({
        "job_name": args.job_name,
        "max_num_workers": int(config.get("max_num_workers")),
        "setup_file": os.path.abspath(get_relative_path(
            "../setup.py")),
        "staging_location": os.path.join(args.job_dir, "staging"),
        "temp_location": os.path.join(args.job_dir, "tmp"),
        "zone": config.get("zone")
    })
  pipeline_options = beam.pipeline.PipelineOptions(flags=[], **options)
  return pipeline_options


def main():
  """Configures and runs a pipeline."""
  args = parse_arguments(sys.argv)
  config = parse_config(
      "CLOUD" if args.cloud else "LOCAL",
      get_relative_path("config.ini"))
  set_logging(config.get("log_level"))
  options = get_pipeline_options(args, config)
  runner = str(config.get("runner"))

  with beam.Pipeline(runner, options=options) as pipeline:
    with beam_impl.Context(
        temp_dir=os.path.join(args.tft_dir, constants.TMP_DIR)):
      preprocess.run(pipeline, args)


if __name__ == "__main__":
  main()
