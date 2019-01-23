# Copyright 2019 Google LLC
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


import argparse
import io
import json
import os
import pandas as pd
import numpy as np
import sklearn.metrics
import trainer.model as model
import tensorflow as tf
from google.cloud import storage

SELECT_COLUMN = [19, ] + list(range(21, 29))


def test(hparams, estimator):
  """Run trained estimator on the test set.

  Run trained estimator on the testset for debugging.

  Args:
    hparams: hyper-parameteters
    estimator: trained tf estimator
  """
  test_input = lambda: model.make_input_fn(
    data_file=hparams.test_file,
    seq_len=hparams.seq_len,
    batch_size=hparams.eval_batch_size,
    cols=SELECT_COLUMN,
    num_epochs=1)
  # load test data
  if hparams.test_file.startswith("gs"):

    bucket_name = hparams.test_file.split('/')[2]
    file_path = '/'.join(hparams.test_file.split('/')[3:])

    storage_client = storage.Client()
    bucket = storage_client.get_bucket(bucket_name)
    blob_context = bucket.blob(file_path)

    test_data = pd.read_csv(io.BytesIO(blob_context.download_as_string()),
                            index_col=0,
                            encoding='utf-8')
  else:
    test_data = pd.read_csv(hparams.test_file, index_col=0)

  tf.logging.info('test_data.shape={}'.format(test_data.shape))
  # make predictions
  predictions = estimator.predict(input_fn=test_input)
  preds = []
  for pred_dict in predictions:
    preds.append(pred_dict['probabilities'])
  preds = np.array(preds)
  tf.logging.info('preds.shape={}'.format(preds.shape))
  tf.logging.info('preds.max()={}'.format(preds.max()))
  # output metrics
  groundtruth = test_data.iloc[hparams.seq_len - 1:]
  pred_names = [x.replace('_on', '_pred')
                for x in groundtruth.columns if '_on' in x]
  preds = preds.round().astype(np.uint8)
  preds = pd.DataFrame(preds, columns=pred_names, index=groundtruth.index)
  df = pd.merge(groundtruth, preds, left_index=True, right_index=True)
  appliances_names = [x.replace('_pred', '') for x in pred_names]
  for i, app in enumerate(appliances_names):
    precision = sklearn.metrics.precision_score(
      df[app + '_on'], df[app + '_pred'])
    recall = sklearn.metrics.recall_score(
      df[app + '_on'], df[app + '_pred'])
    tf.logging.info('{0}:\tprecision={1:.2f}, recall={2:.2f}'.format(
      app, precision, recall))


def run_experiment(hparams):
  """Run the training and evaluate using the high level API

  Args:
    hparams: dict, dictionary of hyper-parameters related to the running experiment.
  """

  select_cols = SELECT_COLUMN
  feat_col_names = ['ActivePower_{}'.format(i + 1)
                    for i in range(hparams.seq_len)]

  # Construct input function for training, evaluation and testing
  # Note: Don't filter on the evaluation and test data
  train_input = lambda: model.make_input_fn(
    data_file=hparams.train_file,
    seq_len=hparams.seq_len,
    batch_size=hparams.train_batch_size,
    cols=select_cols,
    train_flag=True,
    num_epochs=hparams.num_epochs,
    filter_prob=hparams.filter_prob)
  eval_input = lambda: model.make_input_fn(
    data_file=hparams.eval_file,
    seq_len=hparams.seq_len,
    batch_size=hparams.eval_batch_size,
    cols=select_cols,
    num_epochs=1)

  model_dir = os.path.join(
    hparams.job_dir,
    json.loads(os.environ.get('TF_CONFIG', '{}'))
      .get('task', {}).get('trial', '')
  )

  tf.logging.info('model dir {}'.format(model_dir))

  # Experiment running configuration
  # Checkpoint is configured to be saved every ten minutes
  run_config = tf.estimator.RunConfig(save_checkpoints_steps=2500)
  run_config = run_config.replace(model_dir=model_dir)

  params = {'feat_cols': feat_col_names,
            'seq_len': hparams.seq_len,
            'lstm_size': hparams.lstm_size,
            'batch_size': hparams.train_batch_size,
            'num_appliances': len(select_cols) - 1,
            'num_layers': hparams.num_layers,
            'learning_rate': hparams.learning_rate,
            'dropout_rate': hparams.dropout_rate,
            'use_keras': hparams.keras}

  estimator = tf.estimator.Estimator(model_fn=model.model_fn,
                                     model_dir=model_dir,
                                     config=run_config,
                                     params=params)

  # Set training spec
  early_stopping = tf.contrib.estimator.stop_if_no_increase_hook(
    estimator,
    metric_name='f_measure',
    max_steps_without_increase=2000,
    min_steps=100,
    run_every_secs=300)
  train_spec = tf.estimator.TrainSpec(input_fn=train_input,
                                      max_steps=hparams.train_steps,
                                      hooks=[early_stopping])

  # Set serving function, exporter and evaluation spec
  # The serving function is only applicable for JSON format input
  serving_function = model.json_serving_input_fn(feat_names=feat_col_names)
  exporter = tf.estimator.FinalExporter(name=hparams.model_name,
                                        serving_input_receiver_fn=serving_function)
  eval_spec = tf.estimator.EvalSpec(input_fn=eval_input,
                                    steps=None,
                                    throttle_secs=120,
                                    exporters=[exporter],
                                    name='energy-disaggregation-eval')

  tf.estimator.train_and_evaluate(estimator, train_spec, eval_spec)

  # test on test data, just for CMLE online debugging's purpose
  if hparams.test:
    test(hparams, estimator)


if __name__ == '__main__':
  parser = argparse.ArgumentParser()
  # Input Arguments
  parser.add_argument(
    '--train-file',
    help='GCS or local paths to training data'
  )
  parser.add_argument(
    '--num-epochs',
    help="""
      Maximum number of training data epochs on which to train.
      If both --max-steps and --num-epochs are specified,
      the training job will run for --max-steps or --num-epochs,
      whichever occurs first. If unspecified will run for --max-steps.
      """,
    type=int,
    default=40
  )
  parser.add_argument(
    '--train-batch-size',
    help='Batch size for training steps',
    type=int,
    default=64
  )
  parser.add_argument(
    '--eval-file',
    help='GCS or local paths to evaluation data',
  )
  parser.add_argument(
    '--eval-batch-size',
    help='Batch size for evaluation steps',
    type=int,
    default=64
  )
  parser.add_argument(
    '--test-file',
    help='GCS or local paths to test data',
  )
  # Training arguments
  parser.add_argument(
    '--seq-len',
    help='Length of cropped sequence',
    default=5,
    type=int
  )
  parser.add_argument(
    '--lstm-size',
    help='Size of lstm',
    default=131,
    type=int
  )
  parser.add_argument(
    '--num-layers',
    help='Number of layers in the model',
    default=4,
    type=int
  )
  parser.add_argument(
    '--dropout-rate',
    help='The rate of drop out',
    default=0.3204,
    type=float
  )
  parser.add_argument(
    '--learning-rate',
    help='Learning rate',
    default=8.1729e-5,
    type=float
  )
  parser.add_argument(
    '--filter-prob',
    help='Filter probability',
    default=0.6827,
    type=float
  )
  parser.add_argument(
    '--job-dir',
    help='GCS location to write checkpoints and export models',
    default='/tmp/estimator'
  )
  parser.add_argument(
    '--model-name',
    help='name of the model',
    default='estimator'
  )
  # Argument to turn on all logging
  parser.add_argument(
    '--verbosity',
    choices=[
      'DEBUG',
      'ERROR',
      'FATAL',
      'INFO',
      'WARN'
    ],
    default='INFO',
  )
  # Experiment arguments
  parser.add_argument(
    '--train-steps',
    help="""\
      Steps to run the training job for. If --num-epochs is not specified,
      this must be. Otherwise the training job will run indefinitely.\
      """,
    default=1e5,
    type=int
  )
  parser.add_argument(
    '--eval-steps',
    help='Number of steps to run evalution for at each checkpoint',
    default=1e3,
    type=int
  )
  parser.add_argument(
    '--test',
    help='Whether to test a model',
    default=False,
    type=bool
  )
  parser.add_argument(
    '--keras',
    help='Whether use keras authoring',
    action='store_true'
  )

  args, _ = parser.parse_known_args()

  # Set python level verbosity
  tf.logging.set_verbosity(args.verbosity)
  # Set C++ Graph Execution level verbosity
  os.environ['TF_CPP_MIN_LOG_LEVEL'] = str(
    tf.logging.__dict__[args.verbosity] / 10)

  config = args.__dict__
  for k, v in config.items():
    tf.logging.info('{}: {}'.format(k, v))

  # Run the training job
  run_experiment(args)
