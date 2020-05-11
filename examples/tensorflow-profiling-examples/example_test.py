import unittest
from unittest.mock import MagicMock
from unittest.mock import patch

import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.python.keras import testing_utils
from tensorflow.python.keras import initializers

import example


class LinearBlockFullTest(tf.test.TestCase):
    def test_basic(self):
       testing_utils.layer_test(example.LinearBlockFull, input_shape=(4, 32))

    def test_output(self):
        batch_size, dim, output_dim = (3, 4, 2)
        testing_utils.layer_test(
            example.LinearBlockFull,
            kwargs={'units': output_dim},
            input_data=np.ones((batch_size, dim)),
            expected_output_dtype='float32'
        )


class LinearBlockTest(tf.test.TestCase):
    def test_shape_default(self):
        x = np.ones((4, 32))
        layer = example.LinearBlock()
        output = layer(x)
        self.assertAllEqual(output.shape, (4, 32))

    def test_shape(self):
        batch_size, dim = (4, 15)
        x = np.ones((batch_size, dim))
        layer = example.LinearBlock(dim)
        output = layer(x)
        self.assertAllEqual(output.shape, (batch_size, dim))

    def test_shape_multidim(self):
        batch_size, dim = (4, 15)
        x = np.ones((batch_size, 7, dim))
        layer = example.LinearBlock(dim)
        output = layer(x)
        self.assertAllEqual(output.shape, (batch_size, 7, dim))

    def test_output(self):
        dim = 4
        batch_size = 3
        x = np.ones((batch_size, dim))
        layer = example.LinearBlock(dim)
        output = layer(x)
        expected_output = np.array([[0.1250, -0.0576, 0.0513, -0.0305]]*batch_size)
        self.assertAllClose(output, expected_output, atol=1e-4)

    @patch.object(initializers, 'get', lambda _: tf.compat.v1.keras.initializers.Ones)
    def test_output_ones(self):
        dim = 4
        batch_size = 3
        output_dim = 2
        x = np.ones((batch_size, dim))
        layer = example.LinearBlock(output_dim)
        output = layer(x)
        expected_output = np.ones((batch_size, output_dim)) * (dim + 1)
        self.assertAllClose(output, expected_output, atol=1e-4)


class ExampleModelTest(tf.test.TestCase):
    def _get_data(self):
        dataset_path = tf.keras.utils.get_file(
            'auto-mpg.data',
            'http://archive.ics.uci.edu/ml/machine-learning-databases/auto-mpg/auto-mpg.data')
        column_names = ['MPG','Cylinders','Displacement','Horsepower','Weight',
                        'Acceleration', 'Model Year', 'Origin']
        dataset = pd.read_csv(dataset_path, names=column_names, na_values='?', comment='\t',
                              sep=' ', skipinitialspace=True)
        dataset = dataset.dropna()
        dataset['Origin'] = dataset['Origin'].map({1: 'USA', 2: 'Europe', 3: 'Japan'})
        dataset = pd.get_dummies(dataset, prefix='', prefix_sep='')
        dataset = dataset[dataset.columns].astype('float64')
        labels = dataset.pop('MPG')
        batch_size =   10
        df  = pd.DataFrame()
        LABEL = ""
        faked_dataset = tf.data.Dataset.from_tensor_slices((dict(df.pop(LABEL)), df[LABEL].values))
        return faked_dataset.repeat().batch(batch_size)

        return dataset, labels

    def test_basic(self):
        train_dataset, train_labels = self._get_data()
        dim = len(train_dataset.keys())
        example_model = example.get_model(dim)
        test_ind = train_dataset.sample(10).index
        test_dataset, test_labels = train_dataset.iloc[test_ind], train_labels.iloc[test_ind]
        history = example_model.fit(
            train_dataset, train_labels, steps_per_epoch=2, epochs=2,
            batch_size=10,
            validation_split=0.1,
            validation_steps=1)
        self.assertAlmostEqual(
            history.history['mse'][-1],
            history.history['loss'][-1],
            places=2)
        _ = example_model.evaluate(test_dataset, test_labels)
        _ = example_model.predict(test_dataset)


if __name__ == '__main__':
    tf.test.main()
