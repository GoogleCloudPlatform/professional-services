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

import tensorflow as tf
from tensorflow import keras


def json_serving_input_fn(feat_names):
  """
  Build the serving inputs

  Args:
    feat_name   - list, Name list of features used in the prediction model.

  Returns:
    tf.estimator.export.ServingInputReceive
  """

  def serving_input_fn():
    feat_cols = [tf.feature_column.numeric_column(x) for x in feat_names]
    inputs = {}
    for feat in feat_cols:
      inputs[feat.name] = tf.placeholder(shape=[None], dtype=feat.dtype)
    return tf.estimator.export.ServingInputReceiver(inputs, inputs)

  return serving_input_fn


def make_input_fn(data_file,
                  seq_len,
                  batch_size,
                  cols=None,
                  num_epochs=None,
                  shuffle=False,
                  train_flag=False,
                  filter_prob=1.0):
  """Input function for estimator.

  Input function for estimator.

  Args:
    data_file   - string, Path to input csv file.
    seq_len     - int, Length of time sequence.
    batch_size  - int, Mini-batch size.
    num_epochs  - int, Number of epochs
    shuffle     - bool, Whether to shuffle the data
    cols        - list, Columns to extract from csv file.
    train_flag  - bool, Whether in the training phase, in which we may
                  ignore sequences when all appliances are off.
    filter_prob - float, The probability to pass data sequences with all
                  appliances being 'off', only valid when train_flag is True.
  Returns:
    tf.data.Iterator.
  """

  def _mk_data(*argv):
    """Format data for further processing.

    This function slices data into subsequences, extracts the flags
    from the last time steps and treat each as the target for the subsequences.
    """
    data = {'ActivePower_{}'.format(i + 1): x
            for i, x in enumerate(tf.split(argv[0], seq_len))}
    # Only take the label of the last time step in the sequence as target
    flags = [tf.split(x, seq_len)[-1][0] for x in argv[1:]]
    return data, tf.cast(tf.stack(flags), dtype=tf.uint8)

  def _filter_data(data, labels):
    """Filter those sequences with all appliances 'off'.

    Filter those sequences with all appliances 'off'.
    However, with filter_prob we pass the sequence.
    """
    rand_num = tf.random_uniform([], 0, 1, dtype=tf.float64)
    thresh = tf.constant(filter_prob, dtype=tf.float64, shape=[])
    is_all_zero = tf.equal(tf.reduce_sum(labels), 0)
    return tf.logical_or(tf.logical_not(is_all_zero),
                         tf.less(rand_num, thresh))

  record_defaults = [tf.float64, ] + [tf.int32] * (len(cols) - 1)
  dataset = tf.contrib.data.CsvDataset([data_file, ],
                                       record_defaults,
                                       header=True,
                                       select_cols=cols)

  dataset = dataset.apply(
    tf.contrib.data.sliding_window_batch(window_size=seq_len))
  dataset = dataset.map(_mk_data)

  if train_flag:
    dataset = dataset.filter(_filter_data).shuffle(60 * 60 * 24 * 7)

  if shuffle:
    dataset = dataset.shuffle(buffer_size=batch_size * 10)

  dataset = dataset.repeat(num_epochs)
  dataset = dataset.batch(batch_size)
  dataset = dataset.prefetch(buffer_size=1)

  iterator = dataset.make_one_shot_iterator()
  return iterator.get_next()


def model_fn(features, labels, mode, params):
  """Build a customized model for energy disaggregation.

  The model authoring uses pure tensorflow.layers.

  Denote gross energy in the house as a sequence
  $(x_t, x_{t+1}, \cdots, x_{t+n-1}) \in \mathcal{R}^n$,
  and the on/off states of appliances at time $t$ as
  $y_{t} = \{y^i_t \mid y^i_t = [{appliance}\ i\ is\ on\ at\ time\ t ]\}$,
  then we are learning a function
  $f(x_t, x_{t+1}, \cdots, x_{t+n-1}) \mapsto \hat{y}_{t+n-1}$.

  Args:
    features: dict(str, tf.data.Dataset)
    labels: tf.data.Dataset
    mode: One of {tf.estimator.ModeKeys.EVAL,
                  tf.estimator.ModeKeys.TRAIN,
                  tf.estimator.ModeKeys.PREDICT}
    params: Other related parameters

  Returns:
    tf.estimator.EstimatorSpec.
  """

  if mode == tf.estimator.ModeKeys.TRAIN:
    tf.logging.info('TRAIN')
  else:
    tf.logging.info('EVAL | PREDICT')

  feat_cols = [tf.feature_column.numeric_column(x) for x in params['feat_cols']]
  seq_data = tf.feature_column.input_layer(features, feat_cols)

  if not params['use_keras']:
    tf.logging.info('Tensorflow authoring')

    seq_data_shape = tf.shape(seq_data)
    batch_size = seq_data_shape[0]

    # RNN network using multilayer LSTM
    cells = [tf.nn.rnn_cell.DropoutWrapper(
      tf.nn.rnn_cell.LSTMCell(params['lstm_size']), input_keep_prob=1 - params['dropout_rate'])
      for _ in range(params['num_layers'])]
    lstm = tf.nn.rnn_cell.MultiRNNCell(cells)

    # Initialize the state of each LSTM cell to zero
    state = lstm.zero_state(batch_size, dtype=tf.float32)
    # Unroll multiple time steps and the output size is:
    # [batch_size, max_time, cell.output_size]
    outputs, states = tf.nn.dynamic_rnn(cell=lstm,
                                        inputs=tf.expand_dims(seq_data, -1),
                                        initial_state=state,
                                        dtype=tf.float32)

    # Flatten the 3D output to 2D as [batch_size, max_time * cell.output_size]
    flatten_outputs = tf.layers.Flatten()(outputs)

    # A fully connected layer. The number of output equals the number of target appliances
    logits = tf.layers.Dense(params['num_appliances'])(flatten_outputs)

  else:
    tf.logging.info('Keras authoring')

    # RNN network using multilayer LSTM with the help of Keras
    model = keras.Sequential()
    for _ in range(params['num_layers']):
      model.add(
        keras.layers.LSTM(params['lstm_size'],
                          dropout=params['dropout_rate'],
                          return_sequences=True)
      )

    # Flatten the 3D output to 2D as [batch_size, max_time * cell.output_size]
    model.add(keras.layers.Flatten())
    # A fully connected layer. The number of output equals the number of target appliances
    model.add(keras.layers.Dense(params['num_appliances']))

    # Logits can be easily computed using Keras functional API
    logits = model(tf.expand_dims(seq_data, -1))

  # Probability of turning-on of each appliances corresponding output are computed by applying a sigmoid function
  probs = tf.nn.sigmoid(logits)
  predictions = {
    'probabilities': probs,
    'logits': logits
  }
  if mode == tf.estimator.ModeKeys.PREDICT:
    return tf.estimator.EstimatorSpec(mode, predictions=predictions)

  # Binary cross entropy is used as loss function
  loss = tf.losses.sigmoid_cross_entropy(multi_class_labels=labels, logits=logits)
  loss_avg = tf.reduce_mean(loss)

  predicted_classes = tf.cast(tf.round(probs), tf.uint8)
  precision = tf.metrics.precision(labels=labels,
                                   predictions=predicted_classes)
  recall = tf.metrics.recall(labels=labels,
                             predictions=predicted_classes)
  f1_score = tf.contrib.metrics.f1_score(labels=labels,
                                         predictions=predicted_classes)

  metrics = {'precision': precision,
             'recall': recall,
             'f_measure': f1_score}

  if mode == tf.estimator.ModeKeys.EVAL:
    return tf.estimator.EstimatorSpec(mode, loss=loss, eval_metric_ops=metrics)

  optimizer = tf.train.AdamOptimizer(learning_rate=params['learning_rate'])
  train_op = optimizer.minimize(loss_avg, global_step=tf.train.get_global_step())
  return tf.estimator.EstimatorSpec(mode,
                                    loss=loss,
                                    train_op=train_op)
