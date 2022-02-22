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

"""
Unit tests for input_pipeline_dask
"""
import sys
import os
sys.path.append(os.path.abspath('codes/'))
from shutil import copyfile
import unittest
from trainer import input_pipeline_dask as test
import dask
import pandas as pd
import tensorflow as tf

CSV_PATH = os.path.abspath('data/iris_formatted.csv')
TASK_TYPE = 'classification'
TARGET_VAR = 'label'
COLUMN_TO_DROP = ['Cluster_indices']
TASK_NAME = 'classification'
NUM_EPOCHS = 1
BATCH_SIZE = 4
BUFFER_SIZE = 4
NAME = 'train'
MODE = 23
COLUMN_NAMES = os.path.abspath('data/iris_names.txt')
NA_VALUES = None
DATA_TYPE = {'id': 'int',
             'a': 'float',
             'b': 'float',
             'c': 'float',
             'd': 'float',
             'label': 'int',
             'Cluster_indices': 'int'}


class BasicInput(unittest.TestCase):
    """Class which will perform unittests"""

    def is_not_used(self):
        """Function to remove warning"""
        pass

    def init_inputreader(self):
        """
        Initialise class InputReader
        """
        self.is_not_used()
        return test.InputReader(
            csv_path=CSV_PATH,
            task_type=TASK_TYPE,
            target_var=TARGET_VAR,
            gcs_path=False,
            na_values=NA_VALUES)

    def init_basicstats(self):
        """
        Initialise class BasicStats
        """
        self.is_not_used()
        return test.BasicStats()

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
            name=TASK_NAME
        )
        return test.DatasetInput(
            num_epochs=NUM_EPOCHS,
            batch_size=BATCH_SIZE,
            buffer_size=BUFFER_SIZE,
            csv_defaults=csv_defaults,
            csv_cols=ddf.columns,
            target_var=TARGET_VAR,
            task_type=TASK_TYPE
        )

    def test__parse_csv(self):
        """
        Testing function parse_csv
        """
        iread = self.init_inputreader()
        data = iread._parse_csv()
        self.assertEqual(type(data[0]), dask.dataframe.core.DataFrame)
        self.assertEqual(len(data[0]), 150)
        self.assertIsInstance(data[1], list)
        self.assertListEqual(
            data[1], ['id', 'a', 'b', 'c', 'd', 'label', 'Cluster_indices'])

    def test_drop_cols(self):
        """
        Testing function drop_cols
        """
        iread = self.init_inputreader()
        ddf, _ = iread._parse_csv()
        data = iread.drop_cols(
            df=ddf,
            col_names=COLUMN_TO_DROP
        )
        self.assertFalse(set(data.columns) <= set(COLUMN_TO_DROP))

    def test_dropping_zero_var_cols(self):
        """
        Testing function drop_cols
        """
        copyfile(CSV_PATH, '/tmp/data.csv')
        iread = self.init_inputreader()
        stats = self.init_basicstats()
        ddf, _ = iread._parse_csv()
        ddf, _, std_dev, _ = stats.clean_data(
            df=ddf,
            task_type=TASK_TYPE,
            target_var=TARGET_VAR,
            name=TASK_NAME
        )
        stats.dropping_zero_var_cols(
            df=ddf,
            target_var=TARGET_VAR,
            stddev_list=std_dev
        )
        std_list = ddf.std(axis=0, skipna=True)
        std = dask.compute(std_list)
        for i in range(len(std[0])):
            self.assertNotEqual(std[0][i], 0)

    def test_clean_data(self):
        """
        Testing function clean_csv
        """
        copyfile(CSV_PATH, '/tmp/data.csv')
        iread = self.init_inputreader()
        stats = self.init_basicstats()
        ddf, _ = iread._parse_csv()
        data, mean, std_dev, csv_defaults = stats.clean_data(
            df=ddf,
            task_type=TASK_TYPE,
            target_var=TARGET_VAR,
            name=NAME
        )

        self_computed_mean = dask.compute(ddf.mean())
        self.assertListEqual(list(mean), list(self_computed_mean[0]))
        self_computed_std_dev = dask.compute(ddf.std(axis=0, skipna=True))
        self.assertListEqual(list(std_dev), list(self_computed_std_dev[0]))
        self.assertIsInstance(data, dask.dataframe.core.DataFrame)
        self.assertIsInstance(mean, pd.core.series.Series)
        self.assertIsInstance(std_dev, pd.core.series.Series)
        self.assertIsInstance(csv_defaults, list)

    def test_creating_lime_explainer(self):
        copyfile(CSV_PATH, '/tmp/data.csv')
        iread = self.init_inputreader()
        stats = self.init_basicstats()
        ddf, _ = iread._parse_csv()
        stats.creating_explainer_lime(
            df=ddf,
            target_var=TARGET_VAR
        )
        self.assertTrue(os.path.isfile('/tmp/lime_explainer'))

    def test_normalize(self):
        """
        Testing function normalise
        """
        iread = self.init_inputreader()
        stats = self.init_basicstats()
        ddf, _ = iread._parse_csv()
        copyfile(CSV_PATH, '/tmp/data.csv')
        ddf, mean, std_dev, _ = stats.clean_data(
            df=ddf,
            task_type=TASK_TYPE,
            target_var=TARGET_VAR,
            name=NAME)
        data = stats.normalize(
            df=ddf,
            target_var=TARGET_VAR,
            mean_list=mean,
            stddev_list=std_dev
        )
        dataframe = dask.compute(data)[0]
        rows = dataframe.columns
        for row in rows:
            if row != 'label':
                col = dask.compute(data)[0][row]
                self.assertAlmostEqual(col.std(), 1)
        self.assertIsInstance(data, dask.dataframe.core.DataFrame)

    def test_calculate_stats(self):
        """
        Testing function calculate_stats
        """
        iread = self.init_inputreader()
        stats = self.init_basicstats()
        ddf, _ = iread._parse_csv()
        mean, median, mode_dict, std_dev = stats.calculate_stats(
            df=ddf,
            target_var=TARGET_VAR
        )
        self_computed_mean = dask.compute(ddf.mean())
        self.assertListEqual(list(mean), list(self_computed_mean[0]))
        self_computed_std_dev = dask.compute(ddf.std(axis=0, skipna=True))
        self.assertListEqual(list(std_dev), list(self_computed_std_dev[0]))
        self_computed_median = dask.compute(ddf.quantile(0.5))
        self.assertListEqual(list(median), list(self_computed_median[0]))
        self.assertIsInstance(mean, pd.core.series.Series)
        self.assertIsInstance(std_dev, pd.core.series.Series)
        self.assertIsInstance(median, pd.core.series.Series)
        self.assertIsInstance(mode_dict, dict)

    def test_impute(self):
        """
        Testing function impute
        """
        iread = self.init_inputreader()
        stats = self.init_basicstats()
        ddf, _ = iread._parse_csv()
        _, median, _, _ = stats.calculate_stats(
            df=ddf,
            target_var=TARGET_VAR
        )
        data = stats.impute(
            df=ddf,
            target_var=TARGET_VAR,
            median=median,
            mode=MODE
        )
        imputed_data = dask.compute(data.isnull().sum())
        rows = ddf.columns
        for row in rows:
            col = imputed_data[0][row]
            self.assertEqual(col, 0)
        self.assertIsInstance(data, dask.dataframe.core.DataFrame)

    def test_find_vocab(self):
        """
        Testing function find_vocab
        """
        iread = self.init_inputreader()
        stats = self.init_basicstats()
        ddf, _ = iread._parse_csv()
        col_mapping = stats.find_vocab(
            df=ddf
        )
        test_col_mapping = {'a': 0, 'c': 0, 'b': 0, 'd': 0,
                            'label': 0, 'Cluster_indices': 0, 'id': 0}
        self.assertIsInstance(col_mapping, dict)
        self.assertDictEqual(col_mapping, test_col_mapping)

    def test_kmeans_input_fn(self):
        """
        Testing function kmeans_input_fn
        """
        copyfile(CSV_PATH, '/tmp/clean_1_train.csv')
        data = self.init_dataset()
        inp_fn = data.kmeans_input_fn(
            name=NAME
        )
        self.assertIsInstance(inp_fn, tf.Tensor)

    def test_creating_feature_cols(self):
        """
        Testing function of _create_feature_columns function
        """
        iread = self.init_inputreader()
        stats = self.init_basicstats()
        data = self.init_dataset()
        ddf, _ = iread._parse_csv()
        mean, _, _, std_dev = stats.calculate_stats(
            df=ddf,
            target_var=TARGET_VAR
        )
        vocab = stats.find_vocab(ddf)
        feat_cols = data._create_feature_columns(
            dictionary=vocab,
            mean=mean,
            std_dev=std_dev
        )
        test_vocab = {'a': 0, 'c': 0, 'b': 0, 'd': 0,
                      'label': 0, 'Cluster_indices': 0, 'id': 0}
        self.assertIsInstance(vocab, dict)
        self.assertIsInstance(feat_cols, list)
        self.assertDictEqual(vocab, test_vocab)

    def test_input_fn(self):
        """
        Testing function input_csv
        """
        data = self.init_dataset()
        inp_fn = data.input_fn(
            name=NAME
        )
        for _, v in inp_fn[0].items():
            self.assertIsInstance(v, tf.Tensor)


if __name__ == "__main__":
    unittest.main()
