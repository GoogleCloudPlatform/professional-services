# Copyright 2018 Google Inc.
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

"""Runs online predictions and scores the model on them."""

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import collections
import os
import sys

from googleapiclient import discovery
import numpy as np
from sklearn import metrics
from tensorflow import flags
from tensorflow import gfile
from tensorflow import logging

from constants import constants


FLAGS = flags.FLAGS
flags.DEFINE_integer('size', 1000,
                     'Number of records to consider for predictions.')
flags.DEFINE_string('project_name', None, 'Name of GCP project.')
flags.DEFINE_string('model_name', None, 'Name of Gooele Cloud ML Engine model.')
flags.DEFINE_string('input_path', None, 'Directory with records to score.')
flags.DEFINE_integer('random_seed', 1, 'Random seed for subset selection.')
flags.DEFINE_integer('batch_size', 20, 'Batch size for prediction job.')
flags.mark_flag_as_required('project_name')
flags.mark_flag_as_required('input_path')
flags.mark_flag_as_required('input_path')

# Model scoring constants.
_INSTANCE_KEY = 'inputs'
_SCORES_KEY = 'scores'
_CLASSES_KEY = 'classes'
_CONTINUOUS_TYPE = 'continuous_input'
_CATEGORICAL_TYPE = 'categorical_input'
_METRICS = {_CATEGORICAL_TYPE: ['accuracy_score', 'precision_score',
                              'recall_score'],
            _CONTINUOUS_TYPE: ['log_loss', 'roc_auc_score']}
_ACCURACY_THRESHOLD = 0.5


def get_prediction_input(files):
  """Reads and concatenates text files in input directory.

  Args:
    files: List of `str`, containing absolute path to files to read.

  Returns:
    List of `str` containing independent text reviews.

  Raises:
    ValueError: If input files are empty.
  """

  instances = []
  for path in files:
    with gfile.GFile(path, 'r') as lines:
      instances += lines
  if not instances:
    raise ValueError('No review found in input files.')
  return instances


def format_input(input_path, size):
  """Reads input path, randomly selects a sub-sample and concatenates them.

  Args:
    input_path: `str`, directory to read files from.
    size: `int`, number of files to read.

  Returns:
    List of `str` containing independent text reviews.
  """

  files = [path for path in gfile.ListDirectory(input_path)
           if path.endswith(constants.FILE_EXTENSION)]
  files = np.random.choice(files, size, replace=False)
  files = [os.path.join(input_path, filename) for filename in files]
  return get_prediction_input(files)


def predict_json(project, model, instances, version=None):
  """Sends json data to a CMLE deployed model for prediction.

  Args:
    project: str, project where the Cloud ML Engine Model is deployed.
    model: str, model name.
    instances: [Mapping[str: Any]], Keys should be the names of Tensors
      your deployed model expects as inputs. Values should be datatypes
      convertible to Tensors, or (potentially nested) lists of datatypes
      convertible to tensors.
    version: str, version of the model to target.

  Returns:
    Mapping[str: any]: dictionary of prediction results defined by the
      model.

  Raises:
    RuntimeError: If the call to ml-engine returns an error.
  """

  # Create the ML Engine service object.
  # To authenticate set the environment variable
  # GOOGLE_APPLICATION_CREDENTIALS=<path_to_service_account_file>
  service = discovery.build('ml', 'v1')
  name = 'projects/{}/models/{}'.format(project, model)

  if version:
    name += '/versions/{}'.format(version)

  response = service.projects().predict(
      name=name,
      body={'instances': instances}
  ).execute()

  if 'error' in response:
    raise RuntimeError(response['error'])

  return response['predictions']


def analyze(probas, target):
  """Analyzes predictions and returns results.

  Computes different metrics (specified by `constants.METRICS`) comparing
  predictions to true labels.

  Args:
    probas: `np.array` with predicted probabilities.
    target: `np.array` of `int` with true labels.

  Returns:
    Dictionary of `str` to `float` mapping metric names to the corresponding
      scores.
  """

  results = {}
  for metric_type, sub_metrics in _METRICS.iteritems():
    for metric_name in sub_metrics:
      metric = getattr(metrics, metric_name)

      results[metric_name] = metric(
          target,
          (probas if metric_type == _CONTINUOUS_TYPE
           else probas > _ACCURACY_THRESHOLD))
  return results


def run(project, model, size, input_path, batch_size, random_seed=None):
  """Runs prediction job on sample of labelled reviews and analyzes results.

  Args:
    project: `str`, GCP project id.
    model: `str`, name of Cloud ML Engine model.
    size: `int`, number of reviews to process.
    input_path: `str`, path to input data (reviews).
    batch_size: `int`, size of predictions batches.
    random_seed: `int`, random seed for sub-sample selection.

  Returns:
    Dictionary of `str` to `float` mapping metric names to the corresponding
      scores.

  Raises:
    ValueError: If the total number of review found don't match the number of
      files.
    ValueError: If the size of output is not greater than `0`.
    ValueError: If the number of predictions returned by API dont match input.
  """

  if random_seed is not None:
    np.random.seed(random_seed)

  def _get_probas(subdir):
    """Computes predicted probabilities from records in input directory."""

    instances = format_input(os.path.join(input_path, subdir), size)
    # Checks that the number of records matches the number of files (expected
    # exactly one review per file.
    if len(instances) != size:
      raise ValueError(
          'Number of reviews found dont match the number of files.')

    probas = collections.defaultdict(lambda: [])
    step = int(size / batch_size) if batch_size else size
    start = 0
    failed_predictions = 0
    while start < len(instances):
      to_predict = instances[start:(start+step)]
      try:
        predictions = predict_json(project, model, to_predict)
      except KeyboardInterrupt:
        raise
      except:  # pylint: disable=bare-except
        logging.info('Error: %s', sys.exc_info()[0])
        failed_predictions += len(to_predict)
      else:
        for pred in predictions:
          for proba, cl in zip(pred[_SCORES_KEY], pred[_CLASSES_KEY]):
            probas[cl].append(proba)
      start += step

    probas_positive = np.array(probas[str(constants.POSITIVE_SENTIMENT_LABEL)])
    if not len(probas_positive):  # pylint: disable=g-explicit-length-test
      raise ValueError('Size of output expected to be greater than `0`.')
    if len(probas_positive) + failed_predictions != size:
      raise ValueError(
          'Number of predictions returned by API dont match input.')
    return probas_positive, failed_predictions

  neg_probas, neg_failed = _get_probas(constants.SUBDIR_NEGATIVE)
  pos_probas, pos_failed = _get_probas(constants.SUBDIR_POSITIVE)

  pos_label = constants.POSITIVE_SENTIMENT_LABEL
  neg_label = constants.NEGATIVE_SENTIMENT_LABEL

  target = []
  for label, proba in zip([pos_label, neg_label], [pos_probas, neg_probas]):
    target.append(label * np.ones(proba.shape))

  target = np.array(np.concatenate(target), dtype=np.int32)
  probas = np.concatenate([pos_probas, neg_probas])

  results = analyze(probas, target)
  results['num_failed'] = neg_failed + pos_failed
  results['num_succeeded'] = len(target)
  return results


def main():
  logging.set_verbosity(logging.INFO)

  results = run(
      project=FLAGS.project_name,
      model=FLAGS.model_name,
      size=FLAGS.size,
      input_path=FLAGS.input_path,
      random_seed=FLAGS.random_seed,
      batch_size=FLAGS.batch_size)
  logging.info('Results on batch: %s.', results)

if __name__ == '__main__':
  main()
