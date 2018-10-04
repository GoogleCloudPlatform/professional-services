"""Runs data preprocessing.

Splits training data into a train and validation set.
"""

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import os
import apache_beam as beam

from tensorflow import flags
from tensorflow import logging

from preprocessing import preprocess

FLAGS = flags.FLAGS
flags.DEFINE_string('logging_verbosity', 'INFO', 'Level of logging verbosity '
                    '(e.g. `INFO` `DEBUG`).')
flags.DEFINE_string('project_id', None, 'GCP project id.')
flags.DEFINE_string('job_name', None, 'Dataflow job name.')
flags.DEFINE_integer('num_workers', None, 'Number of dataflow workers.')
flags.DEFINE_string('worker_machine_type', None, 'Machine types.')
flags.DEFINE_string('region', None, 'GCP region to use.')
flags.DEFINE_string('input_dir', None,
                    'Path of the directory containing input data.')
flags.DEFINE_string('output_dir', None, 'Path to write output data to.')
flags.DEFINE_float('train_size', 0.7, 'Percentage of input data to use for'
                   ' training vs validation.')
flags.DEFINE_boolean('gcp', False, 'Runs on GCP or locally.')
flags.mark_flag_as_required('input_dir')
flags.mark_flag_as_required('output_dir')


def _mark_gcp_flags_as_required(inputs):
  if FLAGS.gcp:
    return bool(inputs['project_id']) & bool(inputs['job_name'])
  return True
flags.register_multi_flags_validator(
    ['project_id', 'job_name'],
    _mark_gcp_flags_as_required,
    message=('--project_id and --job_name must be specified if --gcp set to '
             '`true`.'))

# Preprocessing constants.
_DATAFLOW_RUNNER = 'DataflowRunner'
_DIRECT_RUNNER = 'DirectRunner'


def run(params):
  """Sets and runs Beam preprocessing pipeline.

  Args:
    params: Object holding a set of parameters as name-value pairs.

  Raises:
    ValueError: If `gcp` argument is `True` and `project_id` or `job_name` are
      not specified.
  """

  options = {}
  if params.gcp:
    options = {
        'project': params.project_id,
        'job_name': params.job_name,
        'temp_location': os.path.join(params.output_dir, 'temp'),
        'staging_location': os.path.join(params.output_dir, 'staging'),
        'setup_file': os.path.abspath(os.path.join(
            os.path.dirname(__file__), 'setup.py'))
    }

    def _update(param_name):
      param_value = getattr(params, param_name)
      if param_value:
        options.update({param_name: param_value})

    _update('worker_machine_type')
    _update('num_workers')
    _update('region')

  pipeline_options = beam.pipeline.PipelineOptions(flags=[], **options)
  runner = _DATAFLOW_RUNNER if params.gcp else _DIRECT_RUNNER
  with beam.Pipeline(runner, options=pipeline_options) as p:
    preprocess.run(p=p, params=params)


def main():
  logging.set_verbosity(getattr(logging, FLAGS.logging_verbosity))
  run(FLAGS)


if __name__ == '__main__':
  main()
