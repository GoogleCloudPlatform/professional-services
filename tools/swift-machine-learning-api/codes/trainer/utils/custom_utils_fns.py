"""Utils funtions for custom model creation."""

import tensorflow as tf


def logits(features, params):
    """Forward pass function for custom model.

    Arguments:
      features : tf.feature_columns object, Features of the dataset
      params: list, hyperparameters to be parsed

    Returns:
      Predictions from the forward pass
    """
    degree = params['degree']
    feature_names = params['feature_names']
    batch_size = params['batch_size']
    num_features = len(features)

    # Polynomial regression model
    preds = tf.Variable(
        tf.random_normal([]),
        dtype=tf.float32,
        name='bias')
    features = [
        tf.cast(features[name], dtype=tf.float32) for name in feature_names
    ]
    features = tf.reshape(
        tf.convert_to_tensor(features),
        [num_features, batch_size])

    for pow_i in range(1, degree+1):
        with tf.name_scope('Pred'):
            weights = tf.Variable(
                tf.random_normal([1, num_features]),
                name='weight_%d' % pow_i
            )
            preds = tf.reshape(
                tf.add(tf.pow(tf.matmul(weights, features), pow_i), preds),
                [1, batch_size],
                name='preds_%d' % pow_i
            )
    return preds
