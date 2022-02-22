"""Trains an example TensorFlow model as well as prepares a validation dataset.
"""

#!/usr/bin/env python

# Copyright 2020 Google Inc. All rights reserved.
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

import numpy as np
import pandas as pd

import tensorflow as tf

from tensorflow import feature_column
from tensorflow.keras import layers
from sklearn.model_selection import train_test_split


def df_to_dataset(dataframe, shuffle=True, batch_size=32):
    """A utility method to create a tf.data dataset from a Pandas Dataframe."""
    dataframe = dataframe.copy()
    labels = dataframe.pop('target')
    ds = tf.data.Dataset.from_tensor_slices((dict(dataframe), labels))
    if shuffle:
        ds = ds.shuffle(buffer_size=len(dataframe))
    return ds.batch(batch_size)


def get_data(dataset_url):
    """Prepares a training dataset as pd.DataFrame."""
    csv_file = 'datasets/petfinder-mini/petfinder-mini.csv'

    tf.keras.utils.get_file('petfinder_mini.zip', dataset_url,
                            extract=True, cache_dir='.')
    dataframe = pd.read_csv(csv_file)

    # In the original dataset "4" indicates the pet was not adopted.
    dataframe['target'] = np.where(dataframe['AdoptionSpeed']==4, 0, 1)

    # Drop un-used columns.
    dataframe = dataframe.drop(columns=['AdoptionSpeed', 'Description'])
    return dataframe


def get_feature_columns(dataframe):
    """Creates feature columns from pd.DataFrame."""
    feature_columns = []
    feature_layer_inputs = {}

    # numeric cols
    for col_name in ['PhotoAmt', 'Fee', 'Age']:
        feature_columns.append(feature_column.numeric_column(col_name))
        feature_layer_inputs[col_name] = tf.keras.Input(shape=(1,), name=col_name)

    # bucketized cols
    age = feature_column.numeric_column('Age')
    age_buckets = feature_column.bucketized_column(age, boundaries=[1, 2, 3, 4, 5])
    feature_columns.append(age_buckets)
    
    # indicator_columns
    indicator_column_names = ['Type', 'Color1', 'Color2', 'Gender', 'MaturitySize',
                              'FurLength', 'Vaccinated', 'Sterilized', 'Health']
    for col_name in indicator_column_names:
        categorical_column = feature_column.categorical_column_with_vocabulary_list(
            col_name, dataframe[col_name].unique())
        indicator_column = feature_column.indicator_column(categorical_column)
        feature_columns.append(indicator_column)
        feature_layer_inputs[col_name] = tf.keras.Input(shape=(1,), name=col_name, dtype=tf.string)

    # embedding columns
    breed1 = feature_column.categorical_column_with_vocabulary_list(
        'Breed1', dataframe.Breed1.unique())
    breed1_embedding = feature_column.embedding_column(breed1, dimension=16)
    feature_columns.append(breed1_embedding)
    feature_layer_inputs['Breed1'] = tf.keras.Input(shape=(1,), name='Breed1', dtype=tf.string)

    # crossed columns
    animal_type = feature_column.categorical_column_with_vocabulary_list(
      'Type', ['Cat', 'Dog'])
    feature_columns.append(feature_column.indicator_column(animal_type))
    age_type_feature = feature_column.crossed_column([age_buckets, animal_type], hash_bucket_size=100)
    feature_columns.append(feature_column.indicator_column(age_type_feature))
    feature_layer_inputs['Type'] = tf.keras.Input(shape=(1,), name='Type', dtype=tf.string)

    return feature_columns, feature_layer_inputs


def get_model(feature_columns, feature_layer_inputs):
    """Creates a Keras model."""
    layer = tf.keras.layers.DenseFeatures(feature_columns)(feature_layer_inputs)
    layer = layers.Dense(4096, activation='relu')(layer)
    layer = layers.Dropout(.1)(layer)
    layer = layers.Dense(2048, activation='relu')(layer)
    layer = layers.Dropout(.1)(layer)
    layer = layers.Dense(1024, activation='relu')(layer)
    layer = layers.Dropout(.1)(layer)
    layer = layers.Dense(512, activation='relu')(layer)
    layer = layers.Dropout(.1)(layer)
    layer = layers.Dense(1)(layer)
    
    model = tf.keras.Model(
        inputs=[v for v in feature_layer_inputs.values()], outputs=layer)
    model.compile(
        optimizer='adam',
        loss=tf.keras.losses.BinaryCrossentropy(from_logits=True),
        metrics=['accuracy'])
    return model


def main():
    batch_size = 64
    dataset_url = 'http://storage.googleapis.com/download.tensorflow.org/data/petfinder-mini.zip'
    dataframe = get_data(dataset_url)
    train, test = train_test_split(dataframe, test_size=0.2)
    train, val = train_test_split(train, test_size=0.2)
    print(len(train), 'train examples')
    print(len(val), 'validation examples')
    print(len(test), 'test examples')
    train_ds = df_to_dataset(train, batch_size=batch_size)
    val_ds = df_to_dataset(val, shuffle=False, batch_size=batch_size)
    test_ds = df_to_dataset(test, shuffle=False, batch_size=batch_size)

    feature_columns, feature_layer_inputs = get_feature_columns(dataframe)
    model = get_model(feature_columns, feature_layer_inputs=feature_layer_inputs)

    model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=1)

    model.summary()

    loss, accuracy = model.evaluate(test_ds)
    print("Accuracy", accuracy)
    tf.keras.models.save_model(
        model,
        './saved_model_regression/1',
        overwrite=True,
        include_optimizer=True,
        save_format=None,
        signatures=None,
        options=None)
    model.save('./saved_model_regression/1')
    val = val.drop(columns=['target'])
    val.to_csv('../locust/testdata/regression_test.csv', header=True, index=False)


if __name__ == '__main__':
    main()
