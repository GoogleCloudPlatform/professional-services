# Copyright 2023 Google LLC
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
"""A run_fn method called by the TFX Trainer component."""

import os
import logging

from src.model_training import trainer, exporter, defaults


# TFX Trainer will call this function.
def run_fn(fn_args):
    """Train the model based on given args.
    Args:
      fn_args: Holds args used to train the model as name/value pairs.
    """
    logging.info("Runner started...")
    logging.info(f"fn_args: {fn_args}")
    logging.info("")

    try:
        log_dir = fn_args.model_run_dir
    except KeyError:
        log_dir = os.path.join(os.path.dirname(fn_args.serving_model_dir), "logs")

    hyperparams = fn_args.hyperparameters
    if not hyperparams:
        hyperparams = dict()

    hyperparams = defaults.update_hyperparams(hyperparams)
    logging.info("Hyperparameter:")
    logging.info(hyperparams)
    logging.info("")

    logging.info("Runner executing trainer...")
    classifier = trainer.train(
        train_data_dir=fn_args.train_files,
        eval_data_dir=fn_args.eval_files,
        tft_output_dir=fn_args.transform_output,
        hyperparams=hyperparams,
        log_dir=log_dir,
        base_model_dir=fn_args.base_model,
    )

    logging.info("Runner executing exporter...")
    exporter.export_serving_model(
        classifier=classifier,
        serving_model_dir=fn_args.serving_model_dir,
        raw_schema_location=fn_args.schema_path,
        tft_output_dir=fn_args.transform_output,
    )
    logging.info("Runner completed.")
