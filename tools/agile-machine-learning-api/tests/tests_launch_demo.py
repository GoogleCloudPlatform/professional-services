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

import sys
import os
sys.path.append(os.path.abspath('codes/'))
import unittest
import tensorflow as tf
from trainer import launch_demo
from shutil import copyfile
import dask
import pandas as pd


CSV_PATH = os.path.abspath('data/iris_formatted.csv')
CSV_PATH_2 = os.path.abspath('data/census_train.csv')
TASK_TYPE = 'classification'
TASK_TYPE_2 = 'regression'
TARGET_VAR = 'label'
TARGET_VAR_2 = 'income_bracket'
TASK_NAME = 'classification'
NA_VALUES = None


class Params(object):
    """Class to pass arguments to launch demo function"""

    def __init__(self):
        """
        Initializing class with default parameters

        Arguments:
            train_csv_path : CSV file path either on local or GCS
            eval_csv_path : CSV file path for model eval
            task_type : Machine learning task at hand
            target_var : Name of the target variable
            data_type : schema of the input data
            column_names : text file containing column names
            num_clusters : number of clusters
            to_drop : list of columns that can be dropped
            na_values : string by which na values are represented
            condition : logic to turn the target variable into levels
            gcs_path : Whether the csv is on GCS
            num_epochs : number of epochs for dataset to repeat
            batch_size : batch size to train and eval the model
            buffer_size : buffer size for prefetch
            n_classes : number of levels in target var
            train_steps : number of steps to train the model
            eval_steps : number of eval batches to run
            job-dir : directory to store model checkpoints
            seed : seed to set for random initialization
            save_summary_steps : number of global steps to save summaries
            save_checkpoints_steps : number of global steps to save checkpoints
            save_checkpoints_secs : number of seconds after which to save checkpoints
            keep_checkpoint_max : max number of checkpoints to save
            keep_checkpoint_every_n_hours : save checkpoint frequency
            log_step_count_steps : how frequently to log information
            distribute_strategy : distribution strategy to use for training
            name : name of the model you want to use
            hidden_units : number of hidden units in each layer of dnn
            num_layers : number of hidden layers
            lin_opt : optimizer to use for linear models
            deep_opt : optimizer to use for NN models
            lr_rate_decay : whether to use learninf=g rate decay
            activation_fn : activation fn to use for hidden units
            dropout : dropout rate for hidden layers
            batch_norm : whether to use batch norm for hidden layers
            learning_rate : learning rate for model training
            eval_freq : frequency in seconds to trigger evaluation run
            eval_times : early stopping criteria
            early_stopping : how to define when model training should end
            export_dir : Directory for storing the frozen graph
            export_format : Format for the serving inputs
        """
        self.train_csv_path = CSV_PATH_2
        self.eval_csv_path = CSV_PATH_2
        self.task_type = TASK_TYPE
        self.target_var = TARGET_VAR_2
        self.export_dir = '/tmp/export_dir/'
        self.name = 'linearclassifier'
        self.data_type = None
        self.column_names = None
        self.num_clusters = 3
        self.to_drop = None
        self.na_values = None
        self.condition = None
        self.gcs_path = False
        self.num_epochs = 50
        self.batch_size = 64
        self.buffer_size = 64
        self.n_classes = 2
        self.train_steps = 50000
        self.eval_steps = 100
        self.job_dir = '/tmp/temp/'
        self.seed = None
        self.save_summary_steps = 100
        self.save_checkpoints_steps = 500
        self.save_checkpoints_secs = None
        self.keep_checkpoint_max = 5
        self.keep_checkpoint_every_n_hours = 10000
        self.log_step_count_steps = 100
        self.distribute_strategy = None
        self.hidden_units = 64
        self.num_layers = 2
        self.lin_opt = 'ftrl'
        self.deep_opt = 'adam'
        self.lr_rate_decay = False
        self.activation_fn = tf.nn.relu
        self.dropout = None
        self.batch_norm = False
        self.learning_rate = 0.001
        self.eval_freq = 30
        self.eval_times = 10
        self.early_stopping = False
        self.export_format = 'JSON'

    def __getitem__(
            self,
            key):
        """Initialise getitem

        Arguments:
            key : key to be added
        """
        return getattr(self, key)


class TestLaunchDemo(unittest.TestCase):
    """class to perform testing"""

    def is_not_used(self):
        """Function to remove self not used warning"""
        pass

    def test_config(self):
        self.is_not_used()
        test_config = launch_demo.Config()
        test_config.set_config()

    def tests_prep_input(self):
        copyfile(CSV_PATH, '/tmp/data.csv')
        df, cols, defaults, mapped, mean, std_dev = launch_demo.prep_input(
            csv_path=CSV_PATH,
            task_type=TASK_TYPE,
            target_var=TARGET_VAR,
            na_values=NA_VALUES,
            column_names=None,
            to_drop=None,
            gcs_path=False,
            data_type=None,
            name='Train')
        test_col_list = ['id', 'a', 'b', 'c', 'd', 'label', 'Cluster_indices']
        test_defaults = [[0], [0.0], [0.0], [0.0], [0.0], [0], [0]]
        test_mapped = {'id': 0, 'a': 0, 'b': 0,
                       'c': 0, 'd': 0, 'Cluster_indices': 0}
        self.assertEqual(type(df), dask.dataframe.core.DataFrame)
        self.assertEqual(len(df), 150)
        self.assertListEqual(cols, test_col_list)
        self.assertListEqual(defaults, test_defaults)
        self.assertDictEqual(mapped, test_mapped)
        self.assertIsInstance(mean, pd.core.series.Series)
        self.assertIsInstance(std_dev, pd.core.series.Series)

    def tests_run_experiment(self):
        self.is_not_used()
        params = Params()
        launch_demo.run_experiment(params)
