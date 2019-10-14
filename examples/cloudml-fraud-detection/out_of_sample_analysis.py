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

"""Computes model performances on out of sample data.

Computes precision-recall AUC curve taking predictions and true labels as input.
"""





import argparse
import collections
import json
import os
import sys

import matplotlib.pyplot as plt
import numpy as np
from sklearn.metrics import average_precision_score
from sklearn.metrics import precision_recall_curve


def extract_from_json(path, key, values, proc=(lambda x: x)):
  """Extracts and parses data from json files and returns a dictionary.

  Args:
    path: string, path to input data.
    key: string, name of key column.
    values: string, name of column containing values to extract.
    proc: function, used to process values from input. Follows the signature:
      * Args:
        * x: string or tuple of string
      * Returns:
        string

  Returns:
    Dictionary of parsed data.
  """

  res = {}
  keys = []
  with open(path) as f:
    for line in f:
      line = json.loads(line)
      item_key = proc(line[key])
      res[item_key] = line[values]
      keys.append(item_key)

  key_count = collections.Counter(keys)
  unique_keys = [key for key in keys if key_count[key] == 1]
  return {k: res[k] for k in unique_keys}


def compute_and_print_pr_auc(labels, probabilities, output_path=None):
  """Computes statistic on predictions, based on true labels.

  Prints precision-recall curve AUC and writes the curve as a PNG image to the
  specified directory.

  Args:
    labels: np.array, vector containing true labels.
    probabilities: np.array, 2-dimensional vector containing inferred
      probabilities.
    output_path: string, path to output directory.
  """

  average_precision = average_precision_score(labels, probabilities[:, 1])

  precision, recall, _ = precision_recall_curve(labels, probabilities[:, 1])
  plt.step(recall, precision, color='b', alpha=0.2, where='post')
  plt.fill_between(recall, precision, step='post', alpha=0.2, color='b')
  plt.xlabel('Recall')
  plt.ylabel('Precision')
  plt.ylim([0.0, 1.05])
  plt.xlim([0.0, 1.0])
  plt.title('Precision-Recall curve: AUC={0:0.2f}'.format(average_precision))

  if output_path:
    full_path_jpg = os.path.join(output_path, 'pr_curve.png')
    plt.savefig(full_path_jpg)
    full_path_log = os.path.join(output_path, 'pr_auc.txt')
    with open(full_path_log, 'w+') as f:
      f.write('Precision-Recall AUC: {0:0.2f}\n'.format(average_precision))
      f.write('Precision-Recall curve exported to: {}'.format(full_path_jpg))


def run(labels_path, predictions_path, output_path):
  """Reads input data and runs analysis on predictions.

  Args:
    labels_path: string, path to true labels.
    predictions_path: string, path to inferred probabilities.
    output_path: string, path to output directory.
  """

  labels = extract_from_json(labels_path, 'key', 'Class')
  proba = extract_from_json(
      predictions_path, 'key', 'probabilities', proc=(lambda x: x[0]))

  keys = set(labels.keys()) & set(proba.keys())
  labels = np.array([labels[key] for key in keys])
  proba = np.array([proba[key] for key in keys])

  compute_and_print_pr_auc(
      labels=labels, probabilities=proba, output_path=output_path)


def parse_arguments(argv):
  """Parses execution arguments.

  Args:
    argv: Input arguments from sys.

  Returns:
    Parsed arguments.
  """

  parser = argparse.ArgumentParser()
  parser.add_argument(
      '--output_path', required=True, help='Directory to write output.')
  parser.add_argument(
      '--labels', required=True, help='Name of file containing labels.')
  parser.add_argument(
      '--predictions',
      required=True,
      help='Name of file containing predictions.')
  args, _ = parser.parse_known_args(args=argv[1:])
  return args


def main():
  """Parses execution arguments and calls running function."""

  args = parse_arguments(sys.argv)
  run(labels_path=os.path.join(args.output_path, args.labels),
      predictions_path=os.path.join(args.output_path, args.predictions),
      output_path=args.output_path)


if __name__ == '__main__':
  main()
