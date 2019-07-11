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
"""Script for making predictions on AI Platform and parsing results."""

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import argparse
import json
import sys
from googleapiclient import discovery

from constants import constants  # pylint: disable=g-bad-import-order


def _parse_arguments(argv):
  """Parses execution arguments and replaces default values.

  Args:
    argv: Input arguments from sys.

  Returns:
    Dictionary of parsed arguments.
  """

  parser = argparse.ArgumentParser()
  parser.add_argument(
      "--project",
      required=True,
      help="GCP project name.")
  parser.add_argument(
      "--model",
      help="Model name.",
      required=True)
  parser.add_argument(
      "--version",
      help="Model version.")
  parser.add_argument(
      "--usernames",
      required=True,
      help="File where username queries are stored.")

  args, _ = parser.parse_known_args(args=argv[1:])
  return args


def _get_instances(usernames_file):
  """Creates inputs for prediction given is file with usernames.

  Args:
    usernames_file: path to a file containing usernames of users to get
      recommendations for.

  Returns:
    A list of input dicts to be passed to the model for prediction.
  """
  with open(usernames_file, "r") as f:
    lines = f.read().splitlines()

  instances = []
  for line in lines:
    instance = {
        constants.USER_KEY: "",
        constants.ITEM_KEY: "",
    }
    instance.update(json.loads(line))
    instances.append(instance)
  return instances


def _predict_json(project, model, instances, version):
  """Send json data to a deployed model for prediction.

  Args:
    project: project where the Cloud AI Platform Model is deployed.
    model: model name.
    instances: Keys should be the names of Tensors
      your deployed model expects as inputs. Values should be datatypes
      convertible to Tensors, or (potentially nested) lists of datatypes
      convertible to tensors.
    version: version of the model to target.

  Returns:
    Dictionary of prediction results defined by the model.

  Raises:
    RuntimeError: predictions couldn't be made.
  """
  service = discovery.build("ml", "v1")
  name = "projects/{}/models/{}".format(project, model)

  if version is not None:
    name += "/versions/{}".format(version)

  response = service.projects().predict(
      name=name,
      body={"instances": instances}
  ).execute()

  if "error" in response:
    raise RuntimeError(response["error"])

  return response["predictions"]


def _print_predictions(instances, predictions):
  """Prints top k titles predicted for each user.

  Args:
    instances: predication inputs.
    predictions: a list of prediction dicts returned by the model.
  """
  for inputs, pred in zip(instances, predictions):
    if inputs[constants.USER_KEY]:
      print("Recommended songs for", pred[constants.USER_KEY])
      print("Title | Similarity")
      for item_id, sim in zip(pred["user_top_k"], pred["user_sims"]):
        print(item_id, "|", sim)
      print("------")
    if inputs[constants.ITEM_KEY]:
      print("Recommended songs for", pred[constants.ITEM_KEY])
      print("Title | Similarity")
      for item_id, sim in zip(pred["item_top_k"], pred["item_sims"]):
        print(item_id, "|", sim)
      print("------")


def main():
  """Uses the usernames in the given usernames file to produce predictions.

  The model expects all features to be populated, although predictions are only
  made with usernames. So, as a preprocessing step, stubbed features are passed
  to the model along with each username.
  """
  params = _parse_arguments(sys.argv)
  instances = _get_instances(params.usernames)
  predictions = _predict_json(params.project, params.model, instances,
                              params.version)
  _print_predictions(instances, predictions)


if __name__ == "__main__":
  main()

