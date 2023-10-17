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
"""Train and evaluate the model."""

import logging
import tensorflow as tf
import tensorflow_transform as tft
from tensorflow import keras
import keras.backend as K

from src.model_training import data, model


def train(
    train_data_dir,
    eval_data_dir,
    tft_output_dir,
    hyperparams,
    log_dir,
    base_model_dir=None,
    run=None
):

    logging.info(f"Loading tft output from {tft_output_dir}")
    tft_output = tft.TFTransformOutput(tft_output_dir)
    transformed_feature_spec = tft_output.transformed_feature_spec()
    
    batch_size = int(hyperparams["batch_size"])
    epochs = int(hyperparams["num_epochs"])
    steps_per_epoch = int(hyperparams["steps_per_epoch"])
    
    train_dataset = data.get_dataset(
        train_data_dir,
        transformed_feature_spec,
        batch_size,
        epochs
    )

    eval_dataset = data.get_dataset(
        eval_data_dir,
        transformed_feature_spec,
        batch_size,
        epochs
    )

    optimizer = keras.optimizers.Adam(learning_rate=hyperparams["learning_rate"])
    loss = keras.losses.BinaryCrossentropy(from_logits=True)
    #loss = f1_weighted_loss
    
    acc_name = f'accuracy_{run}' if run else 'accuracy'
    auc_name = f'auc_{run}' if run else 'auc'
    metrics = [keras.metrics.BinaryAccuracy(name=acc_name), keras.metrics.AUC(curve='PR', name=auc_name)]
    if run:
        # we need one just called "accuracy" as well, to have one metric to optimize across runs for HP tuning
        metrics.append(keras.metrics.BinaryAccuracy(name='accuracy'))
   

    early_stopping = tf.keras.callbacks.EarlyStopping(
        monitor="val_loss", patience=5, restore_best_weights=True
    )
    tensorboard_callback = tf.keras.callbacks.TensorBoard(log_dir=log_dir)

    classifier = model.create_model(transformed_feature_spec.keys(), hyperparams)
    if base_model_dir:
        try:
            classifier = keras.load_model(base_model_dir)
        except:
            pass

    classifier.compile(optimizer=optimizer, loss=loss, metrics=metrics)

    logging.info(f"Model training started... steps per epoch = {steps_per_epoch}")
    classifier.fit(
        train_dataset,
        epochs=hyperparams["num_epochs"],
        steps_per_epoch=steps_per_epoch,
        validation_data=eval_dataset,
        callbacks=[early_stopping, tensorboard_callback],
    )
    logging.info("Model training completed.")

    return classifier


def evaluate(model, data_dir, raw_schema_location, tft_output_dir, hyperparams):
    logging.info(f"Loading raw schema from {raw_schema_location}")

    logging.info(f"Loading tft output from {tft_output_dir}")
    tft_output = tft.TFTransformOutput(tft_output_dir)
    transformed_feature_spec = tft_output.transformed_feature_spec()

    logging.info("Model evaluation started...")
    eval_dataset = data.get_dataset(
        data_dir,
        transformed_feature_spec,
        int(hyperparams["batch_size"]),
        1
    )

    evaluation_metrics = model.evaluate(eval_dataset)
    logging.info("Model evaluation completed.")

    return evaluation_metrics


def f1(y_true, y_pred):
    y_pred = K.round(y_pred)
    tp = K.sum(K.cast(y_true*y_pred, 'float'), axis=0)
    fp = K.sum(K.cast((1-y_true)*y_pred, 'float'), axis=0)
    fn = K.sum(K.cast(y_true*(1-y_pred), 'float'), axis=0)

    p = tp / (tp + fp + K.epsilon())
    r = tp / (tp + fn + K.epsilon())

    f1 = 2*p*r / (p+r+K.epsilon())
    f1 = tf.where(tf.is_nan(f1), tf.zeros_like(f1), f1)
    return K.mean(f1)


def f1_loss(y_true, y_pred):
    
    tp = K.sum(K.cast(y_true*y_pred, 'float'), axis=0)
    fp = K.sum(K.cast((1-y_true)*y_pred, 'float'), axis=0)
    fn = K.sum(K.cast(y_true*(1-y_pred), 'float'), axis=0)

    p = tp / (tp + fp + K.epsilon())
    r = tp / (tp + fn + K.epsilon())

    f1 = 2*p*r / (p+r+K.epsilon())
    f1 = tf.where(tf.math.is_nan(f1), tf.zeros_like(f1), f1)
    return 1 - K.mean(f1)
