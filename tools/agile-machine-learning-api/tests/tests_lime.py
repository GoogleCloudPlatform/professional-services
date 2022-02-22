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

"""Testing file for lime_utils"""
import os
import sys
from lime_utils import get_explainer, getting_signature, visualization, visualization_2
import tensorflow as tf
import unittest
import lime

sys.path.append(os.path.abspath('codes/trainer/'))
import launch_demo

CSV_PATH_2 = os.path.abspath('data/census_train.csv')
TASK_TYPE = 'classification'
TARGET_VAR_2 = 'income_bracket'
TASK_NAME = 'classification'
NA_VALUES = None
EXPORT_DIR = '/tmp/export_dir'
PREDICT_JSON_1 = os.path.abspath(
    'tests/files_for_testing/predict_points_batch_with_id.json')
PREDICT_JSON_2 = os.path.abspath(
    'tests/files_for_testing/predict_points_batch.json')


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
        self.num_epochs = 20
        self.batch_size = 64
        self.buffer_size = 64
        self.n_classes = 2
        self.train_steps = 5000
        self.eval_steps = 1000
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


class TestLime(unittest.TestCase):
    """Class to test api calls of Training, Deployment and Prediction"""

    def is_not_used(self):
        """"Function to remove no-self-use warning"""
        pass

    def test_a_creating_export_dir(self):
        """Testing if export_dir is created"""
        self.is_not_used()
        params = Params()
        launch_demo.run_experiment(params)

    def get_export_dir(self):
        """Gets export_dir path"""
        self.is_not_used()
        return '/tmp/export_dir/'+str([a for a in os.listdir('/tmp/export_dir/')][0])

    def test_getting_signature(self):
        """Tests getting_signature function"""
        export_dir = self.get_export_dir()
        _ = getting_signature(export_dir)

    def test_get_explainer(self):
        """Tests get_explainer function"""
        export_dir = self.get_export_dir()
        explainer, dict_mapping, feature_names = get_explainer(
            export_dir)
        self.assertIsInstance(
            explainer, lime.lime_tabular.LimeTabularExplainer)
        self.assertIsInstance(dict_mapping, dict)
        test_feat_names = ['age', 'workclass', 'fnlwgt', 'education', 'education_num', 'marital_status', 'occupation',
                           'relationship', 'race', 'gender', 'capital_gain', 'capital_loss', 'hours_per_week', 'native_country']
        test_dict_mapping = {'native_country': {0: 'United-States', 1: 'Cuba', 2: 'Jamaica', 3: 'India', 4: 'Mexico', 5: 'South', 6: 'Puerto-Rico', 7: 'Honduras', 8: 'England', 9: 'Canada', 10: 'Germany', 11: 'Iran', 12: 'Philippines', 13: 'Italy', 14: 'Poland', 15: 'Columbia', 16: 'Cambodia', 17: 'Thailand', 18: 'Ecuador', 19: 'Laos', 20: 'Taiwan', 21: 'Haiti', 22: 'Portugal', 23: 'Dominican-Republic', 24: 'El-Salvador', 25: 'France', 26: 'Guatemala', 27: 'China', 28: 'Japan', 29: 'Yugoslavia', 30: 'Peru', 31: 'Outlying-US(Guam-USVI-etc)', 32: 'Scotland', 33: 'Trinadad&Tobago', 34: 'Greece', 35: 'Nicaragua', 36: 'Vietnam', 37: 'Hong', 38: 'Ireland', 39: 'Hungary', 40: 'Holand-Netherlands'}, 'relationship': {0: 'Not-in-family', 1: 'Husband', 2: 'Wife', 3: 'Own-child', 4: 'Unmarried', 5: 'Other-relative'}, 'gender': {0: 'Male', 1: 'Female'}, 'marital_status': {0: 'Never-married', 1: 'Married-civ-spouse', 2: 'Divorced', 3: 'Married-spouse-absent', 4: 'Separated', 5: 'Married-AF-spouse', 6: 'Widowed'}, 'race': {
            0: 'White', 1: 'Black', 2: 'Asian-Pac-Islander', 3: 'Amer-Indian-Eskimo', 4: 'Other'}, 'workclass': {0: 'State-gov', 1: 'Self-emp-not-inc', 2: 'Private', 3: 'Federal-gov', 4: 'Local-gov', 5: 'Self-emp-inc', 6: 'Without-pay', 7: 'Never-worked'}, 'education': {0: 'Bachelors', 1: 'HS-grad', 2: '11th', 3: 'Masters', 4: '9th', 5: 'Some-college', 6: 'Assoc-acdm', 7: 'Assoc-voc', 8: '7th-8th', 9: 'Doctorate', 10: 'Prof-school', 11: '5th-6th', 12: '10th', 13: '1st-4th', 14: 'Preschool', 15: '12th'}, 'occupation': {0: 'Adm-clerical', 1: 'Exec-managerial', 2: 'Handlers-cleaners', 3: 'Prof-specialty', 4: 'Other-service', 5: 'Sales', 6: 'Craft-repair', 7: 'Transport-moving', 8: 'Farming-fishing', 9: 'Machine-op-inspct', 10: 'Tech-support', 11: 'Protective-serv', 12: 'Armed-Forces', 13: 'Priv-house-serv'}}
        self.assertListEqual(test_feat_names, feature_names)
        self.assertDictEqual(test_dict_mapping, dict_mapping)
        self.assertIsInstance(feature_names, list)

    def test_visualization(self):
        """Tests visualization function"""
        cfg = dict()
        cfg['bucket_name'] = None
        export_dir = self.get_export_dir()
        result = visualization(
            cfg, '12345', export_dir, PREDICT_JSON_1, True, ['ALL'], name='testing')
        self.assertIsInstance(result, dict)
        for key in result.keys():
            self.assertAlmostEqual(
                result[key]['output']['class_0'] + result[key]['output']['class_1'], 1)

    def test_visualization_2(self):
        """Tests visualization_2 function"""
        cfg = dict()
        cfg['bucket_name'] = None
        export_dir = self.get_export_dir()
        result = visualization_2(
            cfg, '12345', export_dir, PREDICT_JSON_2, True, name='testing')
        self.assertIsInstance(result, list)
        for res in result:
            self.assertAlmostEqual(res['class_0'] + res['class_1'], 1)
