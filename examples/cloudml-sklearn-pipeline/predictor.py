# Copyright 2019 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# ==============================================================================

"""Custom prediction behavior definitions."""

from __future__ import print_function

import logging
import os

import pandas as pd
from sklearn.externals import joblib

from trainer import metadata


class PipelineWrapper(object):
  """The class is a wrapper for the dumped model, which will be invoked
  during online prediction to change the default behavior to handle both
  List[value] and List[JSON] input. Take iris dataset as example, the
  following two data format can be supported

  Format one: List[value]
  "instances" : [
      [39,34, " Private"," 9th"," Married-civ-spouse","
       Other-service"," Wife"," Black"," Female"," United-States"]
    ]

  Format two: List[JSON]
  "instances" : [
    {
      "age": 39,
      "hours_per_week": 34,
      "workclass": " Private",
      "education": " 9th",
      "marital_status": " Married-civ-spouse",
      "occupation": " Other-service",
      "relationship": " Wife",
      "race": " Black",
      "sex": " Female",
      "native_country": " United-States"
    }
  ]

  """

  def __init__(self, trained_pipeline):
    """Initialization

    Args:
      trained_pipeline: (pipeline.Pipeline), assemble pre-processing
      steps and model training

    Returns:
      None
    """
    self._pipeline = trained_pipeline

  def predict(self, instances, **kwargs):
    """Performs custom prediction.

    Instances are the decoded values from the request. They have already
    been deserialized from JSON.

    Args:
        instances: A list of prediction input instances.
        **kwargs: A dictionary of keyword args provided as additional
            fields on the predict request body.

    Returns:
        A list of outputs containing the prediction results.
    """
    # Convert input data into a DataFrame
    inputs = pd.DataFrame(data=instances)
    # If input is List[value], the column names will be arbitrary
    # If input is List[JSON], the column names is
    # suppose to align with metadata.FEATURE_COLUMNS
    input_columns = set(inputs.columns)
    feature_columns = set(metadata.FEATURE_COLUMNS)

    if not feature_columns.issubset(input_columns):
      # For the case of List[value]
      inputs.columns = metadata.FEATURE_COLUMNS

    ordered_inputs = inputs[metadata.FEATURE_COLUMNS]
    predictions = self._pipeline.predict(ordered_inputs)
    # Output should be a list
    return predictions.tolist()

  @classmethod
  def from_path(cls, model_dir):
    """Creates an instance of Model using the given path.

    Loading of the model should be done in this method.

    Args:
      model_dir: The local directory that contains the exported model file
          along with any additional files uploaded when creating the version
          resource.

    Returns:
      An instance implementing this Model class.
    """
    logging.info('The model_dir is {}'.format(model_dir))
    # The dumped model is assumed to be named as model.joblib
    model = joblib.load(os.path.join(model_dir, 'model.joblib'))
    return cls(model)
