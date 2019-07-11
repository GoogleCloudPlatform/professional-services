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
"""TensorFlow model definition."""

import tensorflow as tf

from trainer import metrics


def get_feature_columns(tf_transform_output, exclude_columns=None):
    """Returns list of feature columns for a TensorFlow estimator.

    Args:
        tf_transform_output: tensorflow_transform.TFTransformOutput.
        exclude_columns: `tf_transform_output` column names to be excluded
            from feature columns.

    Returns:
        List of TensorFlow feature columns.
    """

    tf_numeric_types = [
        tf.float16,
        tf.float32,
        tf.float64,
        tf.int8,
        tf.int16,
        tf.int32,
        tf.int64,
    ]

    feature_columns = []
    feature_spec = tf_transform_output.transformed_feature_spec()

    if not exclude_columns:
        exclude_columns = []

    feature_spec = {
        col: val for (col, val) in feature_spec.items() if (
            col not in exclude_columns)
    }

    for k, v in feature_spec.items():
        if v.dtype in tf_numeric_types:
            feature_columns.append(tf.feature_column.numeric_column(
                k, dtype=v.dtype))
        elif v.dtype == tf.string:
            vocab_file = tf_transform_output.vocabulary_file_by_name(
                vocab_filename=k)
            feature_column = (
                tf.feature_column.categorical_column_with_vocabulary_file(
                    k,
                    vocab_file))
            feature_columns.append(tf.feature_column.indicator_column(
                feature_column))
    return feature_columns


def survival_likelihood_loss(y_true, y_pred, num_intervals):
    """Returns survival likelihood loss.

    Calculates the negative of the log likelihood function for a
    discrete-time statistical survival analysis model. The conditional hazard
    probability for each interval is the probability of failure in the
    interval, given survival until that interval.

    P(surviving interval) = likelihood = product(1 - hazard) for earlier (and
        current) intervals = (current hazard)*product(1- earlier hazards)
    log_likelihood = ln(current hazard) + sum(ln(1- earlier hazards))
    We want to maximize the likelihood, or minimize negative log likehood

    Contribution of each time interval to the loss:
        ln(hazard) for each

    Based off of: https://peerj.com/articles/6257.pdf
    """

    loss_survival = 1. + y_true[:, 0:num_intervals] * (y_pred - 1.)
    loss_death = 1. - y_true[:, num_intervals:2*num_intervals] * y_pred
    loss = tf.concat([loss_survival, loss_death], axis=-1)
    log_loss = tf.reduce_mean(-tf.math.log(tf.clip_by_value(
        loss, 1e-07, 1e32)))
    return log_loss


def survival_model(features, labels, mode, params):
    """Survival Analysis mode to predict likelihood of "death" (churn)."""

    net = tf.feature_column.input_layer(features, params['feature_columns'])
    for units in params['hidden_units']:
        net = tf.keras.layers.Dense(units=units, activation=tf.nn.relu)(net)
    output = tf.keras.layers.Dense(
        units=params['num_intervals'], activation=tf.nn.sigmoid)(net)

    if mode == tf.estimator.ModeKeys.PREDICT:
        predictions = {
            'conditional_likelihoods': output,
            'predicted_classes': metrics.get_class(output, params['threshold'])
        }
        return tf.estimator.EstimatorSpec(mode, predictions=predictions)

    loss = survival_likelihood_loss(labels, output, params['num_intervals'])

    metrics_ops = metrics.eval_metric_fn(labels, output, params)
    tf.summary.scalar('accuracy', metrics_ops['accuracy'][1])

    if mode == tf.estimator.ModeKeys.EVAL:
        return tf.estimator.EstimatorSpec(
            mode=mode,
            loss=loss,
            eval_metric_ops=metrics_ops)

    assert mode == tf.estimator.ModeKeys.TRAIN

    optimizer = tf.train.AdagradOptimizer(
        learning_rate=params['learning_rate'])
    train_op = optimizer.minimize(loss, global_step=tf.train.get_global_step())
    return tf.estimator.EstimatorSpec(mode, loss=loss, train_op=train_op)


def build_estimator(run_config, flags, feature_columns, num_intervals):
    """Returns TensorFlow estimator."""

    # Calculate hidden units based on CLI args to allow hyperparameter tuning
    if flags.num_layers is not None and flags.first_layer_size is not None:
        hidden_units = [
            max(2, int(
                flags.first_layer_size * flags.layer_sizes_scale_factor**i))
            for i in range(flags.num_layers)
        ]
    else:
        hidden_units = flags.hidden_units

    estimator = tf.estimator.Estimator(
        model_fn=survival_model,
        model_dir=flags.job_dir,
        config=run_config,
        params={
            'feature_columns': feature_columns,
            'hidden_units': hidden_units,
            'num_intervals': num_intervals,
            'learning_rate': flags.learning_rate,
            'threshold': flags.threshold
        }
    )
    return estimator
