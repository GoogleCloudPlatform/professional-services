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

"""File to run unititest on models.py"""

import os
import sys
sys.path.append(os.path.abspath('codes/'))

import unittest
import tensorflow as tf
from trainer import input_pipeline_dask as test
from trainer import models
from shutil import copyfile


CSV_PATH = os.path.abspath('data/iris_formatted.csv')
TASK_TYPE = 'classification'
TASK_TYPE_2 = 'regression'
TARGET_VAR = 'label'
COLUMN_TO_DROP = 'Cluster_indices'
TASK_NAME = 'classification'
NUM_EPOCHS = 1
BATCH_SIZE = 4
BUFFER_SIZE = 4
NAME = 'Train'
NA_VALUES = None
MODE = 23


class Params(object):
    """Class to give parameters to model_fn"""

    def __init__(
            self,
            feature_names):
        """Initialize the class with parameters

        Arguments:
            feature_names : list of string, names of each feature
        """
        self.degree = 2
        self.batch_size = 64
        self.feature_names = feature_names
        self.learning_rate = 0.03
        self.num_of_clusters = 3
        self.optimizer = tf.train.FtrlOptimizer(learning_rate=0.03)

    def __getitem__(
            self,
            key):
        """Initialise getitem

        Arguments:
            key : key to be added
        """
        return getattr(self, key)


class TestModel(unittest.TestCase):
    """Class to perform unititest"""

    def is_not_used(self):
        """"Function to remove no-self-use warning"""
        pass

    def _create_deep_cols(self, feat_cols):
        """Create deep cols

        Arguments:
            feat_cols : list of string, list of names of feature columns
        """
        self.is_not_used()
        deep_cols = list()
        for i in feat_cols:
            if i.dtype == 'string':
                i = tf.feature_column.indicator_column(i)
                deep_cols.append(i)
            else:
                deep_cols.append(i)
        return deep_cols

    def init_inputreader(self):
        '''Initialise class InputReader'''
        self.is_not_used()
        return test.InputReader(
            csv_path=CSV_PATH,
            task_type=TASK_TYPE,
            target_var=TARGET_VAR,
            gcs_path=False,
            na_values=NA_VALUES
        )

    def init_inputreader_2(self):
        """
        Initialise class InputReader
        """
        self.is_not_used()
        return test.InputReader(
            csv_path=CSV_PATH,
            task_type=TASK_TYPE_2,
            target_var=TARGET_VAR,
            gcs_path=False,
            na_values=NA_VALUES
        )

    def init_basicstats(self):
        """
        Initialise class BasicStats
        """
        self.is_not_used()
        return test.BasicStats()

    def get_feature_columns(self):
        """
        Initialise class Dataset
        """
        iread = self.init_inputreader()
        stats = self.init_basicstats()
        ddf, _ = iread._parse_csv()
        copyfile(CSV_PATH, '/tmp/data.csv')
        ddf, mean, std_dev, csv_defaults = stats.clean_data(
            df=ddf,
            target_var=TARGET_VAR,
            task_type=TASK_TYPE,
            name=TASK_NAME
        )
        mapped = stats.find_vocab(ddf)
        data = test.DatasetInput(
            NUM_EPOCHS,
            BATCH_SIZE,
            BUFFER_SIZE,
            csv_defaults,
            ddf.columns,
            TARGET_VAR,
            TASK_TYPE
        )
        return data._create_feature_columns(
            mapped,
            mean,
            std_dev
        )

    def get_feature_columns_2(self):
        """
        Initialise class Dataset
        """
        iread = self.init_inputreader_2()
        stats = self.init_basicstats()
        ddf, _ = iread._parse_csv()
        copyfile(CSV_PATH, '/tmp/data.csv')
        ddf, mean, std_dev, csv_defaults = stats.clean_data(
            df=ddf,
            target_var=TARGET_VAR,
            task_type=TASK_TYPE_2,
            name=TASK_NAME
        )
        mapped = stats.find_vocab(ddf)
        data = test.DatasetInput(
            num_epochs=NUM_EPOCHS,
            batch_size=BATCH_SIZE,
            buffer_size=BUFFER_SIZE,
            csv_defaults=csv_defaults,
            csv_cols=ddf.columns,
            target_var=TARGET_VAR,
            task_type=TASK_TYPE_2)
        return data._create_feature_columns(
            dictionary=mapped,
            mean=mean,
            std_dev=std_dev)

    def init_canned_model(self):
        """
        Initialise class CannedModel
        """
        model_name = 'linearclassifier'
        feature_columns = self.get_feature_columns()
        return models.CannedModel(
            model_name=model_name,
            feature_columns=feature_columns
        )

    def test_canned_build_model(self):
        """
        Test function build_model in CannedModel
        """
        model = self.init_canned_model()
        estimator_model = model.build_model()
        self.assertIsInstance(estimator_model, tf.estimator.LinearClassifier)

    def test_linear_classifier(self):
        """
        Test function linearclassifier in CannedModel
        """
        model = self.init_canned_model()
        estimator_model = model.linear_classifier()
        self.assertIsInstance(estimator_model, tf.estimator.LinearClassifier)

    def init_canned_model_1(self):
        """
        Initialise CannedModel
        """
        model_name = 'dnnclassifier'
        feature_columns = self.get_feature_columns()
        deep_cols = self._create_deep_cols(feature_columns)
        return models.CannedModel(
            model_name=model_name,
            feature_columns=feature_columns,
            deep_columns=deep_cols
        )

    def test_canned_build_model_1(self):
        """
        Test function build_model in CannedModel
        """
        model = self.init_canned_model_1()
        estimator_model = model.build_model()
        self.assertIsInstance(estimator_model, tf.estimator.DNNClassifier)

    def test_dnn_classifier(self):
        """
        Test function dnnclassifier in CannedModel
        """
        model = self.init_canned_model_1()
        estimator_model = model.dnn_classifier()
        self.assertIsInstance(estimator_model, tf.estimator.DNNClassifier)

    def init_canned_model_2(self):
        """
        Initialise CannedModel
        """
        model_name = 'combinedclassifier'
        feature_columns = self.get_feature_columns()
        deep_cols = self._create_deep_cols(feature_columns)
        return models.CannedModel(
            model_name=model_name,
            feature_columns=feature_columns,
            deep_columns=deep_cols
        )

    def test_canned_build_model_2(self):
        """
        Test function build_model in CannedModel
        """
        model = self.init_canned_model_2()
        estimator_model = model.build_model()
        self.assertIsInstance(
            estimator_model, tf.estimator.DNNLinearCombinedClassifier)

    def test_combined_classifier(self):
        """
        Test function combinedclassifier in CannedModel
        """
        model = self.init_canned_model_2()
        estimator_model = model.combined_classifier()
        self.assertIsInstance(
            estimator_model, tf.estimator.DNNLinearCombinedClassifier)

    def init_canned_model_3(self):
        """
        Test function linearregressor in CannedModel
        """
        model_name = 'linearregressor'
        feature_columns = self.get_feature_columns_2()
        return models.CannedModel(
            model_name=model_name,
            feature_columns=feature_columns
        )

    def test_canned_build_model_3(self):
        """
        Test function build_model in CannedModel
        """
        model = self.init_canned_model_3()
        estimator_model = model.build_model()
        self.assertIsInstance(
            estimator_model, tf.estimator.LinearRegressor)

    def test_linear_regressor(self):
        """
        Test function linearregressor in CannedModel
        """
        model = self.init_canned_model_3()
        estimator_model = model.linear_regressor()
        self.assertIsInstance(
            estimator_model, tf.estimator.LinearRegressor)

    def init_canned_model_4(self):
        """
        Initialise CannedModel
        """
        model_name = 'dnnregressor'
        feature_columns = self.get_feature_columns_2()
        deep_cols = self._create_deep_cols(feature_columns)
        return models.CannedModel(
            model_name=model_name,
            feature_columns=feature_columns,
            deep_columns=deep_cols
        )

    def test_canned_build_model_4(self):
        """
        Test function build_model in CannedModel
        """
        model = self.init_canned_model_4()
        estimator_model = model.build_model()
        self.assertIsInstance(estimator_model, tf.estimator.DNNRegressor)

    def test_dnn_regressor(self):
        """
        Test function dnnregressor in CannedModel
        """
        model = self.init_canned_model_4()
        estimator_model = model.dnn_regressor()
        self.assertIsInstance(estimator_model, tf.estimator.DNNRegressor)

    def init_canned_model_5(self):
        """
        Initialise CannedModel
        """
        model_name = 'combinedregressor'
        feature_columns = self.get_feature_columns_2()
        deep_cols = self._create_deep_cols(feature_columns)
        return models.CannedModel(
            model_name=model_name,
            feature_columns=feature_columns,
            deep_columns=deep_cols
        )

    def test_canned_build_model_5(self):
        """
        Test function build_model in CannedModel
        """
        model = self.init_canned_model_5()
        estimator_model = model.build_model()
        self.assertIsInstance(
            estimator_model, tf.estimator.DNNLinearCombinedRegressor)

    def test_combined_regressor(self):
        """
        Test function combinedregressor in CannedModel
        """
        model = self.init_canned_model_5()
        estimator_model = model.combined_regressor()
        self.assertIsInstance(
            estimator_model, tf.estimator.DNNLinearCombinedRegressor)

    def init_custom_model(self):
        """
        Initialise class CustomModel
        """
        self.is_not_used()
        custom_model_name = 'polynomialclassifier'
        batch_size = 64
        feature_names = ['id', 'a', 'b', 'c', 'd']
        optimizer = tf.train.FtrlOptimizer(
            learning_rate=0.001
        )
        return models.CustomModel(
            model_name=custom_model_name,
            batch_size=batch_size,
            optimizer=optimizer,
            feature_names=feature_names,
            model_dir=None,
            config=None,
            warm_start_from=None,
            polynomial_degree=2
        )

    def test_Custom_build_model(self):
        """
        Test function build_model in CustomModel
        """
        model = self.init_custom_model()
        estimator_model = model.build_model()
        self.assertIsInstance(estimator_model, tf.estimator.Estimator)

    def init_dataset(self):
        """
        Initialise class Dataset
        """
        iread = self.init_inputreader()
        stats = self.init_basicstats()
        ddf, _ = iread._parse_csv()
        copyfile(CSV_PATH, '/tmp/data.csv')
        ddf, _, _, csv_defaults = stats.clean_data(
            df=ddf,
            target_var=TARGET_VAR,
            task_type=TASK_TYPE,
            name=TASK_NAME)
        return test.DatasetInput(
            num_epochs=NUM_EPOCHS,
            batch_size=BATCH_SIZE,
            buffer_size=BUFFER_SIZE,
            csv_defaults=csv_defaults,
            csv_cols=ddf.columns,
            target_var=TARGET_VAR,
            task_type=TASK_TYPE)

    def get_features(self):
        """Get features and labels from input_fn"""
        data = self.init_dataset()
        feat, label = data.input_fn(NAME)
        return feat, label

    def test_poly_regression_model_fn(self):
        """
        Test poly_regression_model_fn
        """
        model = self.init_custom_model()
        iread = self.init_inputreader()
        _, list_cols = iread._parse_csv()
        list_cols.remove(TARGET_VAR)
        params = Params(list_cols)
        features, labels = self.get_features()
        train_mode = tf.estimator.ModeKeys.TRAIN
        eval_mode = tf.estimator.ModeKeys.EVAL
        predict_mode = tf.estimator.ModeKeys.PREDICT

        # train_mode
        estimator_spec = model.poly_regression_model_fn(
            features=features,
            labels=labels,
            mode=train_mode,
            params=params)
        self.assertIsInstance(estimator_spec, tf.estimator.EstimatorSpec)

        # eval_mode
        estimator_spec = model.poly_regression_model_fn(
            features=features,
            labels=labels,
            mode=eval_mode,
            params=params)
        self.assertIsInstance(estimator_spec, tf.estimator.EstimatorSpec)

        # predict_mode
        estimator_spec = model.poly_regression_model_fn(
            features=features,
            labels=labels,
            mode=predict_mode,
            params=params)
        self.assertIsInstance(estimator_spec, tf.estimator.EstimatorSpec)

    def test_poly_classification_model_fn(self):
        """
        Test poly_classification_model_fn
        """
        model = self.init_custom_model()
        iread = self.init_inputreader()
        _, list_cols = iread._parse_csv()
        list_cols.remove(TARGET_VAR)
        params = Params(list_cols)
        features, labels = self.get_features()
        train_mode = tf.estimator.ModeKeys.TRAIN
        eval_mode = tf.estimator.ModeKeys.EVAL
        predict_mode = tf.estimator.ModeKeys.PREDICT

        # train_mode
        estimator_spec = model.poly_classification_model_fn(
            features=features,
            labels=labels,
            mode=train_mode,
            params=params)
        self.assertIsInstance(estimator_spec, tf.estimator.EstimatorSpec)

        # eval_mode
        estimator_spec = model.poly_classification_model_fn(
            features=features,
            labels=labels,
            mode=eval_mode,
            params=params)
        self.assertIsInstance(estimator_spec, tf.estimator.EstimatorSpec)

        # predict_mode
        estimator_spec = model.poly_classification_model_fn(
            features=features,
            labels=labels,
            mode=predict_mode,
            params=params)
        self.assertIsInstance(estimator_spec, tf.estimator.EstimatorSpec)


if __name__ == "__main__":
    unittest.main()
