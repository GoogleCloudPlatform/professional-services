# Copyright 2019 Google Inc. All Rights Reserved.

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
"""Defines the model for product recommendation."""

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import json
import os

from tensorboard.plugins import projector
import tensorflow as tf
import tensorflow_transform as tft

# pylint: disable=g-bad-import-order
from constants import constants
from trainer import utils


def _default_embedding_size(vocab_size):
  """Returns a good dimension for an embedding given the vocab size.

  The 4th root of the number of categories is a good rule of thumb for choosing
  an embedding dimension according to:
  https://developers.googleblog.com/2017/11/introducing-tensorflow-feature-columns.html

  Args:
    vocab_size: the number of categories being embedded.

  Returns:
    A good embedding dimension to use for the given vocab size.
  """
  return int(vocab_size**.25)


def _make_embedding_col(feature_name, vocab_name, tft_output, mult=1):
  """Creates an embedding column.

  Args:
    feature_name: a attribute of features to get embedding vectors for.
    vocab_name: the name of the embedding vocabulary made with tft.
    tft_output: a TFTransformOutput object.
    mult: a multiplier on the embedding size.

  Returns:
    A tuple of (embedding_col, embedding_size):
      embedding_col: an n x d tensor, where n is the batch size and d is the
        length of all the features concatenated together.
      embedding_size: the embedding dimension.
  """
  vocab_size = tft_output.vocabulary_size_by_name(vocab_name)
  embedding_size = int(_default_embedding_size(vocab_size) * mult)
  cat_col = tf.feature_column.categorical_column_with_identity(
      key=feature_name, num_buckets=vocab_size + 1, default_value=vocab_size)
  embedding_col = tf.feature_column.embedding_column(cat_col, embedding_size)
  return embedding_col, embedding_size


def _get_net_features(features, tft_output, n_feats, n_lens, c_feats, vocabs):
  """Creates an input layer of features.

  Args:
    features: a batch of features.
    tft_output: a TFTransformOutput object.
    n_feats: a list of numerical feature names.
    n_lens: the lengths of each nemerical feature.
    c_feats: a list of categorical feature names.
    vocabs: a list of vocabulary names cooresponding the the features in
      c_feats.

  Returns:
    A tuple of (net_features, size):
      net_features: an n x d tensor, where n is the batch size and d is the
        length of all the features concatenated together.
      size: the size of the feature layer.
  """
  numerical_cols = [tf.feature_column.numeric_column(col, shape=length)
                    for col, length in zip(n_feats, n_lens)]
  categorical_cols = [_make_embedding_col(col, vocab_name, tft_output)
                      for col, vocab_name in zip(c_feats, vocabs)]
  cols = [x[0] for x in categorical_cols] + numerical_cols
  size = sum([x[1] for x in categorical_cols]
             + [x.shape[0] for x in numerical_cols])
  feature_names = {x: features[x] for x in n_feats + c_feats}
  net_features = tf.feature_column.input_layer(feature_names, cols)
  return net_features, size


def _make_input_layer(features, tft_output, feature_name, vocab_name, n_feats,
                      n_lens, c_feats, vocabs, mult=1):
  """Creates an input layer containing embeddings and features.

  Args:
    features: a batch of features.
    tft_output: a TFTransformOutput object.
    feature_name: a attribute of features to get embedding vectors for.
    vocab_name: the name of the embedding vocabulary made with tft.
    n_feats: a list of numerical feature names.
    n_lens: the lengths of each nemerical feature.
    c_feats: a list of categorical feature names.
    vocabs: a list of vocabulary names cooresponding the the features in
      c_features.
    mult: a multiplier on the embedding size.

  Returns:
    A tuple of (net, size):
      net: an n x d tensor, where n is the batch size and d is the embedding
        size.
      size: the size of the layer.
  """
  col, embedding_size = _make_embedding_col(feature_name, vocab_name,
                                            tft_output, mult)
  embedding_feature = tf.feature_column.input_layer(
      {feature_name: features[feature_name]}, [col])
  net_features, size = _get_net_features(features, tft_output, n_feats,
                                         n_lens, c_feats, vocabs)
  net = tf.concat([embedding_feature, net_features], 1)
  return net, embedding_size + size


def _resize_networks(user_net, user_size, item_net, item_size, num_layers,
                     embedding_size):
  """Use a neural net to make the user and item embeddings the given size.

  Args:
    user_net: a tensor consisting of a user_id embedding and features.
    user_size: the size of the user_net layer.
    item_net: a tensor consisting of an item_id embedding and features.
    item_size: the size of the item_net layer.
    num_layers: the number of hidden layers to use for resizing.
    embedding_size: the embedding size of the user-item embedding space.

  Returns:
    A tuple of (user_net, item_net):
      user_net: a tensor consisting of a user embedding.
      item_net: a tensor consisting of an item embedding.
  """
  layer_step_size = abs(user_size - embedding_size) // num_layers
  for i in reversed(range(num_layers)):
    dims = i * layer_step_size + min(user_size, embedding_size)
    user_net = tf.keras.layers.Dense(dims, activation="relu")(user_net)
  user_net = tf.keras.layers.Dense(embedding_size)(user_net)

  layer_step_size = abs(item_size - embedding_size) // num_layers
  for i in reversed(range(num_layers)):
    dims = i * layer_step_size + min(item_size, embedding_size)
    item_net = tf.keras.layers.Dense(dims, activation="relu")(item_net)
  item_net = tf.keras.layers.Dense(embedding_size)(item_net)
  return user_net, item_net


def _get_embedding_matrix(embedding_size, tft_output, vocab_name):
  """Returns a num_items x embedding_size lookup table of embeddings."""
  vocab_size = tft_output.vocabulary_size_by_name(vocab_name)
  return tf.get_variable(
      "{}_embedding".format(vocab_name),
      (vocab_size, embedding_size),
      initializer=tf.initializers.uniform_unit_scaling())


def _update_embedding_matrix(row_indices, rows, embedding_size, tft_output,
                             vocab_name):
  """Creates and maintains a lookup table of embeddings for inference.

  Args:
    row_indices: indices of rows of the lookup table to update.
    rows: the values to update the lookup table with.
    embedding_size: the size of the embedding.
    tft_output: a TFTransformOutput object.
    vocab_name: a tft vocabulary name.

  Returns:
    A num_items x embedding_size table of the latest embeddings with the given
      rows updated.
  """
  embedding = _get_embedding_matrix(embedding_size, tft_output, vocab_name)
  return tf.scatter_update(embedding, row_indices, rows)


def _get_top_k(features, embedding, feature_name, item_embedding, k=10):
  """Gets the k most similar items for a given feature (user or item).

  Args:
    features: a batch of features.
    embedding: an embedding matrix.
    feature_name: the name of the feature.
    item_embedding: an item embedding matrix.
    k: the number of similar items to return.

  Returns:
    A tuple of (similarities, items):
      similarities: the similarity score for each item.
      items: the k most similar items.
  """
  tft_ids = features[feature_name]
  indices = tf.where(
      tf.equal(tft_ids, constants.TFT_DEFAULT_ID),
      tf.zeros_like(tft_ids), tft_ids)
  norm = tf.gather(embedding, indices)
  sims = tf.abs(tf.matmul(norm, item_embedding, transpose_b=True))
  return tf.math.top_k(sims, k)


def _get_projector_data(user_embedding, user_indices, item_embedding,
                        item_indices):
  """Samples the given embeddings, joins them, and creates a projector config.

  Args:
    user_embedding: a (num_users x embedding_dim) embedding of users.
    user_indices: the indices to take from the user embedding.
    item_embedding: a (num_items x embedding_dim) embedding of items.
    item_indices: the indices to take from the item embedding.

  Returns:
    A tuple of (sample, config):
      sample: a tensor of samples of the user and item embeddings.
      config: a ProjectorConfig for the sample.
  """
  user_sample = tf.gather(user_embedding, user_indices)
  item_sample = tf.gather(item_embedding, item_indices)
  combined_samples = tf.concat([user_sample, item_sample], 0)
  sample = tf.get_variable(constants.PROJECTOR_NAME, combined_samples.shape)
  sample = tf.assign(sample, combined_samples)

  config = projector.ProjectorConfig()
  embedding = config.embeddings.add()
  embedding.tensor_name = constants.PROJECTOR_NAME
  embedding.metadata_path = constants.PROJECTOR_PATH
  return sample, config


def _model_fn(features, labels, mode, params):
  """A model function for item recommendation.

  Two Tower Architecture:
  Builds neural nets for users and items that learn n-dimensional
  representations of each. The distance between these representations is used
  to make a prediction for a binary classification.

  Args:
    features: a batch of features.
    labels: a batch of labels or None if predicting.
    mode: an instance of tf.estimator.ModeKeys.
    params: a dict of additional params.

  Returns:
    A tf.estimator.EstimatorSpec that fully defines the model that will be run
      by an Estimator.
  """
  tft_output = tft.TFTransformOutput(params["tft_dir"])
  tft_features = tft_output.transform_raw_features(features)
  hparams = params["hparams"]

  # Prediction op: Return the top k closest items for a given user or item.
  if mode == tf.estimator.ModeKeys.PREDICT:
    table = tf.contrib.lookup.index_to_string_table_from_file(
        tft_output.vocabulary_file_by_name(constants.ITEM_VOCAB_NAME))
    item_embedding = _get_embedding_matrix(hparams.embedding_size, tft_output,
                                           constants.ITEM_VOCAB_NAME)
    item_sims, item_top_k = _get_top_k(tft_features,
                                       item_embedding,
                                       constants.TFT_ITEM_KEY,
                                       item_embedding)
    user_embedding = _get_embedding_matrix(hparams.embedding_size, tft_output,
                                           constants.USER_VOCAB_NAME)
    user_sims, user_top_k = _get_top_k(tft_features,
                                       user_embedding,
                                       constants.TFT_USER_KEY,
                                       item_embedding)
    predictions = {
        constants.USER_KEY: tf.identity(features[constants.USER_KEY]),
        "user_top_k": table.lookup(tf.cast(user_top_k, tf.int64)),
        "user_sims": user_sims,
        constants.ITEM_KEY: tf.identity(features[constants.ITEM_KEY]),
        "item_top_k": table.lookup(tf.cast(item_top_k, tf.int64)),
        "item_sims": item_sims,
    }
    return tf.estimator.EstimatorSpec(mode, predictions=predictions)

  # Build user and item networks.
  user_net, user_size = _make_input_layer(tft_features,
                                          tft_output,
                                          constants.TFT_USER_KEY,
                                          constants.USER_VOCAB_NAME,
                                          constants.USER_NUMERICAL_FEATURES,
                                          constants.USER_NUMERICAL_FEATURE_LENS,
                                          constants.USER_CATEGORICAL_FEATURES,
                                          constants.USER_CATEGORICAL_VOCABS,
                                          hparams.user_embed_mult)
  item_net, item_size = _make_input_layer(tft_features,
                                          tft_output,
                                          constants.TFT_ITEM_KEY,
                                          constants.ITEM_VOCAB_NAME,
                                          constants.ITEM_NUMERICAL_FEATURES,
                                          constants.ITEM_NUMERICAL_FEATURE_LENS,
                                          constants.ITEM_CATEGORICAL_FEATURES,
                                          constants.ITEM_CATEGORICAL_VOCABS,
                                          hparams.item_embed_mult)
  user_net, item_net = _resize_networks(user_net,
                                        user_size,
                                        item_net,
                                        item_size,
                                        hparams.num_layers,
                                        hparams.embedding_size)

  user_norm = tf.nn.l2_normalize(user_net, 1)
  item_norm = tf.nn.l2_normalize(item_net, 1)
  sims = tf.abs(tf.reduce_sum(tf.multiply(user_norm, item_norm), axis=1))
  loss = tf.losses.log_loss(labels, sims,
                            weights=features[constants.WEIGHT_KEY])

  user_embedding = _update_embedding_matrix(
      tft_features[constants.TFT_USER_KEY],
      user_norm,
      hparams.embedding_size,
      tft_output,
      constants.USER_VOCAB_NAME)
  item_embedding = _update_embedding_matrix(
      tft_features[constants.TFT_ITEM_KEY],
      item_norm,
      hparams.embedding_size,
      tft_output,
      constants.ITEM_VOCAB_NAME)

  # Eval op: Log the recall of the batch and save a sample of user+item
  # shared embedding space for tensorboard projector.

  item_sample = tf.random_shuffle(item_embedding)[:constants.EVAL_SAMPLE_SIZE]
  item_sample_sims = tf.sort(tf.matmul(user_norm, item_sample,
                                       transpose_b=True),
                             direction="DESCENDING")

  metrics = {}
  with tf.name_scope("recall"):
    for k in constants.EVAL_RECALL_KS:
      thresh_idx = min(k, item_sample.shape[0] - 1)
      thresh = item_sample_sims[:, thresh_idx]
      is_top_k = tf.cast(tf.greater_equal(sims, thresh), tf.float32)
      recall = tf.metrics.mean(is_top_k, weights=labels)
      key = "recall_{0}".format(k)
      metrics["recall/{0}".format(key)] = recall
      tf.summary.scalar(key, recall[1])
  metrics["acc"] = tf.metrics.accuracy(labels, tf.round(sims))
  tf.summary.scalar("acc", metrics["acc"][1])
  tf.summary.merge_all()

  if mode == tf.estimator.ModeKeys.EVAL:
    samples, config = _get_projector_data(user_embedding,
                                          params["projector_users"],
                                          item_embedding,
                                          params["projector_items"])
    writer = tf.summary.FileWriter(params["model_dir"])
    projector.visualize_embeddings(writer, config)
    with tf.control_dependencies([samples]):
      loss = tf.identity(loss)
    return tf.estimator.EstimatorSpec(mode, loss=loss, eval_metric_ops=metrics)

  # Training op: Update the weights via backpropagation.
  num_samples = len(params["projector_users"]) + len(params["projector_items"])
  sample = tf.get_variable(constants.PROJECTOR_NAME,
                           [num_samples, hparams.embedding_size])

  optimizer = tf.train.AdagradOptimizer(learning_rate=hparams.learning_rate)
  with tf.control_dependencies([user_embedding, item_embedding, sample]):
    train_op = optimizer.minimize(loss, global_step=tf.train.get_global_step())

  return tf.estimator.EstimatorSpec(mode, loss=loss, train_op=train_op)


def _get_trial_id():
  """Returns the trial id if it exists, else "0"."""
  trial_id = json.loads(
      os.environ.get("TF_CONFIG", "{}")).get("task", {}).get("trial", "")
  return trial_id if trial_id else "1"


def get_recommender(params):
  """Returns the product recommendation model."""
  config = tf.estimator.RunConfig(
      save_checkpoints_steps=params.save_checkpoints_steps,
      keep_checkpoint_max=params.keep_checkpoint_max,
      log_step_count_steps=params.log_step_count_steps)
  trial_id = _get_trial_id()
  model_dir = os.path.join(params.model_dir, trial_id)
  user_indices, item_indices = utils.write_projector_metadata(model_dir,
                                                              params.tft_dir)

  hparams = tf.contrib.training.HParams(
      user_embed_mult=params.user_embed_mult,
      item_embed_mult=params.item_embed_mult,
      learning_rate=params.learning_rate,
      num_layers=params.num_layers,
      embedding_size=params.embedding_size)
  model_params = {
      "model_dir": model_dir,
      "tft_dir": params.tft_dir,
      "hparams": hparams,
      "projector_users": user_indices,
      "projector_items": item_indices,
  }
  estimator = tf.estimator.Estimator(
      model_fn=_model_fn,
      model_dir=model_dir,
      config=config,
      params=model_params)
  return estimator

