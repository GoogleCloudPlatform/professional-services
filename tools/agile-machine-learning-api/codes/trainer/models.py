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

"""Common script for all estimator models."""

import tensorflow as tf

from utils import custom_utils_fns


class CannedModel(object):
    """Builds a model
    using tensorflow canned estimators.
    """

    def __init__(
            self, model_name,
            feature_columns,
            deep_columns=None,
            hidden_units=None,
            model_dir=None,
            n_classes=2,
            label_dimension=1,
            weight_column=None,
            label_vocabulary=None,
            linear_optimizer='Ftrl',
            dnn_optimizer='Adagrad',
            activation_fn=None,
            dropout=None,
            batch_norm=None,
            partitioner=None,
            warm_start_from=None,
            input_layer_partitioner=None,
            loss_reduction=tf.losses.Reduction.MEAN,
            linear_sparse_combiner='sum',
            config=None):
        """Initializes the instance with parameters parsed from the user

        Args:
            model_name : string, Name of the model
            feature_columns : tf.feature_column object, Normal feature columns
            deep_columns : tf.feature_column object, DNN feature columns
            hidden_units : int, number of hidden units in neural network
            model_dir : str, directory to store model checkpoints
            n_classes : int, number of levels in target var
            label_dimension : int, dimensions of the label column
            weight_column : str, column defining feature column representing weights
            label_vocabulary : list of string,  A list of strings represents possible label values
            linear_optimizer : str, An instance of tf.Optimizer used to train the model
            dnn_optimizer : str, An instance of tf.Optimizer used to train the deep learning model
            activation_fn : function, Activation function applied to each layer
            dropout : float, When not None, the probability we will drop out a given coordinate.
            batch_norm : boolean, Whether to use batch normalization after each hidden layer.
            partitioner :  a partitioner function, Partitioner for input layer.
            warm_start_from : str, A string filepath to a checkpoint to warm-start from
            input_layer_partitioner : a partitioner function, Partitioner for input layer.
            loss_reduction : tf.losses.Reduction object, used to reduce training loss over batch.
            linear_sparse_combiner : str, A string specifying how to reduce
                    the linear model if a categorical column is multivalent.
            config : tf.Config object, RunConfig object to configure the runtime settings.
        """

        self.model_name = model_name
        self.feature_columns = feature_columns
        self.deep_columns = deep_columns
        self.hidden_units = hidden_units
        self.model_dir = model_dir
        self.n_classes = n_classes
        self.label_dimension = label_dimension
        self.weight_column = weight_column
        self.label_vocabulary = label_vocabulary
        self.linear_optimizer = linear_optimizer
        self.dnn_optimizer = dnn_optimizer
        self.activation_fn = activation_fn
        self.dropout = dropout
        self.batch_norm = batch_norm
        self.input_layer_partitioner = input_layer_partitioner
        self.partitioner = partitioner
        self.warm_start_from = warm_start_from
        self.loss_reduction = loss_reduction
        self.linear_sparse_combiner = linear_sparse_combiner
        self.config = config

    def linear_classifier(self):
        """Builds the logistic regression model
        with the parameters parsed from the user input
        Returns : tf.estimator object, Canned estimator of Linear Classifier
        """
        return tf.estimator.LinearClassifier(
            config=self.config,
            feature_columns=self.feature_columns,
            label_vocabulary=self.label_vocabulary,
            loss_reduction=self.loss_reduction,
            n_classes=self.n_classes,
            optimizer=self.linear_optimizer,
            partitioner=self.partitioner,
            warm_start_from=self.warm_start_from
        )

    def linear_regressor(self):
        """Builds the linear regression model
        with the parameters parsed from the user input
        Returns : tf.estimator object, Canned estimator of Linear Regressor
        """
        return tf.estimator.LinearRegressor(
            config=self.config,
            feature_columns=self.feature_columns,
            label_dimension=self.label_dimension,
            optimizer=self.linear_optimizer,
            weight_column=self.weight_column,
            partitioner=self.partitioner,
            warm_start_from=self.warm_start_from,
            loss_reduction=tf.losses.Reduction.MEAN
        )

    def dnn_classifier(self):
        """Builds the DNN model(classifier)
        with the parameters parsed from the user input
        Returns : tf.estimator object, Canned estimator of DNN Classifier
        """
        return tf.estimator.DNNClassifier(
            config=self.config,
            feature_columns=self.deep_columns,
            hidden_units=self.hidden_units,
            n_classes=self.n_classes,
            weight_column=self.weight_column,
            label_vocabulary=self.label_vocabulary,
            optimizer=self.dnn_optimizer,
            activation_fn=self.activation_fn,
            dropout=self.dropout,
            input_layer_partitioner=self.input_layer_partitioner,
            warm_start_from=self.warm_start_from,
            loss_reduction=self.loss_reduction
        )

    def dnn_regressor(self):
        """Builds the DNN model(regressor)
        with the parameters parsed from the user input
        Returns : tf.estimator object, Canned estimator of DNN Regressor
        """
        return tf.estimator.DNNRegressor(
            config=self.config,
            feature_columns=self.deep_columns,
            hidden_units=self.hidden_units,
            label_dimension=self.label_dimension,
            weight_column=self.weight_column,
            optimizer=self.dnn_optimizer,
            activation_fn=self.activation_fn,
            dropout=self.dropout,
            input_layer_partitioner=self.input_layer_partitioner,
            warm_start_from=self.warm_start_from,
            loss_reduction=self.loss_reduction
        )

    def combined_classifier(self):
        """Builds a combined DNN and linear classifier parsed from user input.
        Returns : tf.estimator object, Canned estimator of Combined Classifier
        """
        return tf.estimator.DNNLinearCombinedClassifier(
            config=self.config,
            linear_feature_columns=self.feature_columns,
            linear_optimizer=self.linear_optimizer,
            dnn_feature_columns=self.deep_columns,
            dnn_hidden_units=self.hidden_units,
            dnn_activation_fn=self.activation_fn,
            dnn_dropout=self.dropout,
            n_classes=self.n_classes,
            weight_column=self.weight_column,
            label_vocabulary=self.label_vocabulary,
            input_layer_partitioner=self.input_layer_partitioner,
            warm_start_from=self.warm_start_from,
            loss_reduction=self.loss_reduction,
            batch_norm=self.batch_norm,
            linear_sparse_combiner=self.linear_sparse_combiner
        )

    def combined_regressor(self):
        """Builds a combined DNN and linear regressor parsed from user input.
        Returns : tf.estimator object, Canned estimator of Combined Regressor
        """
        return tf.estimator.DNNLinearCombinedRegressor(
            config=self.config,
            linear_feature_columns=self.feature_columns,
            linear_optimizer=self.linear_optimizer,
            dnn_feature_columns=self.deep_columns,
            dnn_hidden_units=self.hidden_units,
            dnn_activation_fn=self.activation_fn,
            dnn_dropout=self.dropout,
            label_dimension=self.label_dimension,
            weight_column=self.weight_column,
            input_layer_partitioner=self.input_layer_partitioner,
            warm_start_from=self.warm_start_from,
            loss_reduction=self.loss_reduction,
            batch_norm=self.batch_norm,
            linear_sparse_combiner=self.linear_sparse_combiner
        )

    def build_model(self):
        """Builds one the models from the above list.
        Returns : A Canned Estimator of initiated model name"""
        if self.model_name == 'linearclassifier':
            model = self.linear_classifier()
        elif self.model_name == 'linearregressor':
            model = self.linear_regressor()
        elif self.model_name == 'dnnclassifier':
            model = self.dnn_classifier()
        elif self.model_name == 'dnnregressor':
            model = self.dnn_regressor()
        elif self.model_name == 'combinedclassifier':
            model = self.combined_classifier()
        elif self.model_name == 'combinedregressor':
            model = self.combined_regressor()
        return model


class CustomModel(object):
    """Builds a Custom model
    using tensorflow estimators.
    """

    def __init__(
            self,
            model_name,
            batch_size,
            optimizer,
            feature_names,
            model_dir=None,
            config=None,
            warm_start_from=None,
            learning_rate=0.03,
            polynomial_degree=2):
        """Initializes the classifier instance with parameters parsed from the user

        Args:
            model_name : str, name of the model
            batch_size : int, batch size
            optimizer : str, name of the optimizer to be used
            feature_columns : tf.feature_column object, Normal feature columns
            model_dir : str, directory to store model checkpoints
            config : tf.Config object, RunConfig object to configure the runtime settings
            warm_start_from : str, A string filepath to a checkpoint to warm-start from
            polynomial_degree : int, degree to which polynomial model is to be used
        """
        self.model_name = model_name
        self.batch_size = batch_size
        self.model_dir = model_dir
        self.optimizer = optimizer
        self.config = config
        self.warm_start_from = warm_start_from
        self.polynomial_degree = polynomial_degree
        self.learning_rate = learning_rate
        self.feature_names = feature_names

    @staticmethod
    def poly_regression_model_fn(features, labels, mode, params):
        """Model function for custom model

        Args:
            features : This is batch_features from input_fn
            labels : This is batch_features from input_fn
            mode : An instance of tf.estimator.ModeKeys
            params : Additional configuration
        Returns: A Custom Estimator Spec of Polynomial regression

        """
        logits = custom_utils_fns.logits(features, params)
        labels = tf.reshape(labels, [1, params.batch_size])
        loss = tf.losses.mean_squared_error(labels=labels, predictions=logits)
        # Prediction mode
        if mode == tf.estimator.ModeKeys.PREDICT:
            predictions = {'prediction': logits}
            return_estimator_spec = tf.estimator.EstimatorSpec(
                mode=tf.estimator.ModeKeys.PREDICT,
                predictions=predictions,
                export_outputs={
                    'regress': tf.estimator.export.PredictOutput(predictions)
                }
            )

        # Training mode
        if mode == tf.estimator.ModeKeys.TRAIN:
            optimizer = params['optimizer']
            rmse = tf.metrics.root_mean_squared_error(
                tf.cast(labels, dtype=tf.float32),
                logits
            )
            mae = tf.metrics.mean_absolute_error(
                tf.cast(labels, dtype=tf.float32),
                logits
            )
            mse = tf.metrics.mean_squared_error(
                tf.cast(labels, dtype=tf.float32),
                logits
            )

            # Name tensors to be logged with LoggingTensorHook.
            tf.identity(loss, 'loss')
            tf.identity(rmse[1], name='rmse')
            tf.identity(mae[1], name='mae')
            tf.identity(mse[1], name='mse')

            # Save accuracy scalar to Tensorboard output.
            tf.summary.scalar('rmse', rmse[1])
            tf.summary.scalar('mae', mae[1])
            tf.summary.scalar('mse', mse[1])

            return_estimator_spec = tf.estimator.EstimatorSpec(
                mode=tf.estimator.ModeKeys.TRAIN,
                loss=loss,
                train_op=optimizer.minimize(
                    loss,
                    tf.train.get_or_create_global_step()
                )
            )

        # Evaluation mode
        if mode == tf.estimator.ModeKeys.EVAL:
            rmse = tf.metrics.root_mean_squared_error(
                tf.cast(labels, dtype=tf.float32),
                logits
            )
            mae = tf.metrics.mean_absolute_error(
                tf.cast(labels, dtype=tf.float32),
                logits
            )
            mse = tf.metrics.mean_squared_error(
                tf.cast(labels, dtype=tf.float32),
                logits
            )

            # Name tensors to be logged with LoggingTensorHook.
            tf.identity(loss, 'loss')
            tf.identity(rmse[1], name='rmse')
            tf.identity(mae[1], name='mae')
            tf.identity(mse[1], name='mse')
            metrics = {'rmse': rmse, 'mae': mae, 'mse': mse}

            # Save accuracy scalar to Tensorboard output.
            tf.summary.scalar('rmse', rmse[1])
            tf.summary.scalar('mae', mae[1])
            tf.summary.scalar('mse', mse[1])

            return_estimator_spec = tf.estimator.EstimatorSpec(
                mode=tf.estimator.ModeKeys.EVAL,
                loss=loss,
                eval_metric_ops=metrics
            )
        return return_estimator_spec

    @staticmethod
    def poly_classification_model_fn(features, labels, mode, params):
        """Model function for classification custom models

        Args:
            features : This is batch_features from input_fn
            labels : This is batch_features from input_fn
            mode : An instance of tf.estimator.ModeKeys
            params : Additional configuration
        Returns: A Custom Estimator Spec of Polynomial classification
        """
        logits = custom_utils_fns.logits(features, params)
        logits = tf.sigmoid(logits)
        labels = tf.reshape(labels, [1, params['batch_size']])

        loss = tf.reduce_mean(
            tf.nn.softmax_cross_entropy_with_logits_v2(
                labels=tf.cast(labels, dtype=tf.float32),
                logits=logits
            )
        )

        # Prediction mode
        if mode == tf.estimator.ModeKeys.PREDICT:
            predictions = {'prediction': logits}
            return_estimator_spec = tf.estimator.EstimatorSpec(
                mode=tf.estimator.ModeKeys.PREDICT,
                predictions=predictions,
                export_outputs={
                    'regress': tf.estimator.export.PredictOutput(predictions)
                }
            )

        # Training mode
        if mode == tf.estimator.ModeKeys.TRAIN:
            optimizer = params['optimizer']
            accuracy = tf.metrics.accuracy(
                labels=tf.cast(labels, dtype=tf.float32),
                predictions=logits
            )
            recall = tf.metrics.recall(
                labels=tf.cast(labels, dtype=tf.float32),
                predictions=logits
            )
            precision = tf.metrics.precision(
                labels=tf.cast(labels, dtype=tf.float32),
                predictions=logits
            )

            # Name tensors to be logged with LoggingTensorHook
            tf.identity(loss, 'loss')
            tf.identity(accuracy[1], name='accuracy')
            tf.identity(recall[1], name='recall')
            tf.identity(precision[1], name='precision')

            # Save accuracy scalar to Tensorboard output.
            tf.summary.scalar('accuracy', accuracy[1])
            tf.summary.scalar('precision', precision[1])
            tf.summary.scalar('recall', recall[1])

            return_estimator_spec = tf.estimator.EstimatorSpec(
                mode=tf.estimator.ModeKeys.TRAIN,
                loss=loss,
                train_op=optimizer.minimize(
                    loss,
                    tf.train.get_or_create_global_step()
                )
            )

        # Evaluation mode
        if mode == tf.estimator.ModeKeys.EVAL:
            accuracy = tf.metrics.accuracy(
                labels=tf.cast(labels, dtype=tf.float32),
                predictions=logits
            )
            recall = tf.metrics.recall(
                labels=tf.cast(labels, dtype=tf.float32),
                predictions=logits
            )
            precision = tf.metrics.precision(
                labels=tf.cast(labels, dtype=tf.float32),
                predictions=logits
            )

            # Name tensors to be logged with LoggingTensorHook.
            tf.identity(loss, 'loss')
            tf.identity(accuracy[1], name='accuracy')
            tf.identity(recall[1], name='recall')
            tf.identity(precision[1], name='precision')

            # Save accuracy scalar to Tensorboard output.
            tf.summary.scalar('accuracy', accuracy[1])
            tf.summary.scalar('precision', precision[1])
            tf.summary.scalar('recall', recall[1])

            metrics = {
                'accuracy': accuracy,
                'precision': precision,
                'recall': recall
            }

            return_estimator_spec = tf.estimator.EstimatorSpec(
                mode=tf.estimator.ModeKeys.EVAL,
                loss=loss,
                eval_metric_ops=metrics
            )
        return return_estimator_spec

    def polynomial_regressor(self):
        """Builds the polynomial regression model
        with the parameters parsed from the user input
        Returns: A Custom Estimator of Polynomial regression
        """
        return tf.estimator.Estimator(
            model_fn=self.poly_regression_model_fn,
            model_dir=self.model_dir, config=self.config,
            params={
                'batch_size': self.batch_size,
                'polynomial_degree': self.polynomial_degree,
                'feature_names': self.feature_names,
                'optimizer': self.optimizer
            },
            warm_start_from=self.warm_start_from
        )

    def polynomial_classifier(self):
        """Builds the logistic classification model
        with the parameters parsed from the user input
        Returns: A Custom Estimator of Polynomial classifier
        """
        return tf.estimator.Estimator(
            model_fn=self.poly_classification_model_fn,
            model_dir=self.model_dir,
            config=self.config,
            params={
                'degree': self.polynomial_degree,
                'feature_names': self.feature_names,
                'batch_size': self.batch_size,
                'optimizer': self.optimizer
            }
        )

    def build_model(self):
        """Builds one the models from the above list.
        Returns: A Custom Estimator of initiated model name
        """
        if self.model_name == 'polynomialregressor':
            model = self.polynomial_regressor()

        elif self.model_name == 'polynomialclassifier':
            model = self.polynomial_classifier()

        return model
