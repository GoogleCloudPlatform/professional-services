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

"""End to End script draft."""

import argparse
import ast
import os
import time

import numpy as np
import six
import tensorflow as tf
from tensorflow.contrib.training.python.training import hparam

from input_pipeline_dask import InputReader, BasicStats, DatasetInput
from models import CannedModel, CustomModel
from utils.metric_utils import mean_acc, mar, my_auc, rmse
from utils.optimizer_utils import Optimizer


class Config(object):
    """
    Creates a run config object for training an estimator.
    Object to be initialized using default parameters or
    can be parsed by the user.
    """

    def __init__(
            self,
            model_dir=None,
            tf_random_seed=None,
            save_summary_steps=100,
            save_checkpoints_steps=None,
            save_checkpoints_secs=120,
            session_config=None,
            keep_checkpoint_max=5,
            keep_checkpoint_every_n_hours=10000,
            log_step_count_steps=100,
            train_distribute=None):
        """Initializes the config object.

        Arguments:
            model_dir : string, directory where the checkpoints are stored
            tf_random_seed : integer, seed to set for random initialization
            save_summary_steps : integer, number of global steps to save summaries
            save_checkpoints_steps ; integer, number of global steps to save checkpoints
            save_checkpoints_secs : integer, number of seconds to save checkpoints
            session_config : object, a config proto used to set session parameters
            keep_checkpoint_max : integer, maximum number of checkpoints to be stored
            keep_checkpoint_every_n_hours : integer, frequency of saving checkpoints
            log_step_count_steps : integer, frequency of steps to log information
            train_distribute : tf.distribute.Strategy object, distribution strategy for training
        """

        self.model_dir = model_dir
        self.tf_random_seed = tf_random_seed
        self.save_summary_steps = save_summary_steps
        self.save_checkpoints_steps = save_checkpoints_steps
        self.save_checkpoints_secs = save_checkpoints_secs
        self.session_config = session_config
        self.keep_checkpoint_max = keep_checkpoint_max
        self.keep_checkpoint_every_n_hours = keep_checkpoint_every_n_hours
        self.log_step_count_steps = log_step_count_steps
        self.train_distribute = train_distribute

    def set_config(self):
        """
        Sets the Run config object with the parameters parsed by the user
        """
        self.RunConfig = tf.estimator.RunConfig(
            model_dir=self.model_dir,
            tf_random_seed=self.tf_random_seed,
            save_summary_steps=self.save_summary_steps,
            session_config=self.session_config,
            save_checkpoints_steps=self.save_checkpoints_steps,
            save_checkpoints_secs=self.save_checkpoints_secs,
            keep_checkpoint_max=self.keep_checkpoint_max,
            keep_checkpoint_every_n_hours=self.keep_checkpoint_every_n_hours,
            log_step_count_steps=self.log_step_count_steps,
            train_distribute=self.train_distribute)

    def get_config(self):
        """
        Get Config object with parameters parsed by the user

        Returns: tf.estimator.RunConfig object for estimator training

        """
        return self.RunConfig

    def get_is_chief(self):
        """
        Get _is_chief boolean from RunConfig object

        Returns: tf.estimator.RunConfig object for estimator training
        """
        return self.RunConfig._is_chief


def prep_input(
        csv_path,
        task_type,
        target_var,
        na_values,
        column_names,
        to_drop,
        gcs_path,
        data_type,
        name):
    """
    Preprocessing function for train and eval datasets.

    Arguments:
        csv_path : str, path of the csv file
        task_type : string, ML task at hand, following options are expected
                [classification, regression, clustering]
        target_var : string, Name of the dependent/target variable
        na_values : string, String by which the na values are represented in the data
        column_names : string, Names of the columns passed in a text file
        to_drop : list, Any redundant columns which can be dropped
        gcs_path : boolean, Whether the csv is stored on google cloud storage
        data_type : dict, dictionary containing the data type of all columns in format
            {'a': 'float', 'b': 'object', 'c': 'int' }
        name : str, name of the data being based [train, eval]

    Returns:
        df : dask.DataFrame object, dataframe containing cleaned data of the passed csv file
        cols : list, list containing column names of the data
        defaults : list, list containing defaults of the columns
        mapped : dict, dictionary containing vocabulary of the categorical columns
        mean : pandas.Series, pandas series containing mean values of continous columns
        std_dev : pandas.Series, pandas series containing standard deviation values of continous columns
    """
    inp = InputReader(
        csv_path=csv_path,
        task_type=task_type,
        target_var=target_var,
        na_values=na_values,
        column_names=column_names,
        to_drop=to_drop,
        gcs_path=gcs_path,
        data_type=data_type)

    df, cols = inp.parse_csv_wrap()

    stats = BasicStats()

    df, mean, std_dev, defaults = stats.clean_data(
        df=df,
        target_var=inp.target_var,
        task_type=task_type,
        name=name)

    mapped = stats.find_vocab(df=df)

    mapped.pop(inp.target_var)

    return df, cols, defaults, mapped, mean, std_dev


def create_deep_cols(feat_cols, name):
    """Creates embedding and indicator columns for canned DNNclassifier.

    Arguments:
        feat_cols : list, A list of feature column objects.
        name : string, name of the task in hand
    Returns:
        A list of feature column objects.
    """
    deep_cols = None
    if name not in ['linearclassifier', 'linearregressor',
                    'polynomialclassifier', 'polynomialregressor']:
        deep_cols = list()
        for i in feat_cols:
            if i.dtype == 'string':
                i = tf.feature_column.indicator_column(i)
            deep_cols.append(i)
    return deep_cols


def none_or_str(value):
    """
    Creates a nonetype argument from command line.

    Arguments:
        value : The keyword argument from command line

    Returns:
        None if the string none is found
    """
    if value == 'None':
        return None
    return value


def convert_to_list(value):
    """
    Creates a list argument from command line.

    Arguments:
        value : The keyword argument from command line

    Returns:
        None if the string none is found
        list if the string is space seperated values is found
    """
    if value == 'None':
        return None
    return value.split(' ')


def convert_to_dict(value):
    """
    Creates a dict argument from command line.

    Arguments:
        value : The keyword argument from command line

    Returns:
        None if the string none is found
        dict if the string is space seperated values is found
    """
    if value == 'None':
        return None
    return ast.literal_eval(value)


def run_experiment(hparams):
    """
    Arguments:
        hparams : tf.contrib.training.HParams object, contains all the arguments
                    as a set of key value pairs

    Sets up the experiment to be launched on cloud machine learning engine
    """
    a = time.time()
    _, csv_cols, csv_defaults, mapped, mean, std_dev = prep_input(
        csv_path=hparams.train_csv_path,
        task_type=hparams.task_type,
        target_var=hparams.target_var,
        na_values=hparams.na_values,
        column_names=hparams.column_names,
        to_drop=hparams.to_drop,
        gcs_path=hparams.gcs_path,
        data_type=hparams.data_type,
        name='train')

    _, _, _, _, _, _ = prep_input(
        csv_path=hparams.eval_csv_path,
        task_type=hparams.task_type,
        target_var=hparams.target_var,
        na_values=hparams.na_values,
        column_names=hparams.column_names,
        to_drop=hparams.to_drop,
        gcs_path=hparams.gcs_path,
        data_type=hparams.data_type,
        name='eval')

    data = DatasetInput(
        num_epochs=hparams.num_epochs,
        batch_size=hparams.batch_size,
        buffer_size=hparams.buffer_size,
        csv_defaults=csv_defaults,
        csv_cols=csv_cols,
        target_var=hparams.target_var,
        task_type=hparams.task_type,
        condition=hparams.condition)

    feature_cols = data.create_feature_columns_wrap(
        dictionary=mapped,
        mean=mean,
        std_dev=std_dev)
    b = time.time()

    tf.logging.info('Parse time is : %s', b - a)

    if hparams.name == 'kmeanscluster':
        def train_input():
            return data.kmeans_input_fn('train')

        def eval_input():
            return data.kmeans_input_fn('eval')
    else:
        def train_input():
            return data.input_fn('train')

        def eval_input():
            return data.input_fn('eval')

    def json_serving_input_fn():
        """
        Build the serving inputs.

        Returns: Serving input function for JSON data
        """
        inputs = {}
        for feat in feature_cols:
            inputs[feat.name] = tf.placeholder(
                shape=[None], dtype=feat.dtype, name=feat.name)
        return tf.estimator.export.ServingInputReceiver(inputs, inputs)

    def parse_csv(rows_string_tensor):
        """
        Takes the string input tensor and returns a dict of rank-2 tensors.
        Arguments:
            rows_string_tensor : tf.Tensor object, Tensor of the prediction datapoint
        Returns:
            features : tensor objects of features for inference
        """
        columns = tf.decode_csv(
            rows_string_tensor, record_defaults=csv_defaults)
        features = dict(zip(csv_cols, columns))
        for key, _ in six.iteritems(features):
            features[key] = tf.expand_dims(features[key], -1)
        return features

    def csv_serving_input_fn():
        """
        Build the serving inputs.

        Returns: Serving input function for CSV data
        """
        csv_row = tf.placeholder(
            shape=[None],
            dtype=tf.string)
        features = parse_csv(rows_string_tensor=csv_row)
        return tf.estimator.export.ServingInputReceiver(
            features,
            {'csv_row': csv_row})

    serving_functions = {
        'JSON': json_serving_input_fn,
        'CSV': csv_serving_input_fn
    }

    config_obj = Config(
        model_dir=hparams.job_dir,
        tf_random_seed=hparams.seed,
        save_summary_steps=hparams.save_summary_steps,
        session_config=None,
        save_checkpoints_secs=hparams.save_checkpoints_secs,
        save_checkpoints_steps=hparams.save_checkpoints_steps,
        keep_checkpoint_max=hparams.keep_checkpoint_max,
        keep_checkpoint_every_n_hours=hparams.keep_checkpoint_every_n_hours,
        log_step_count_steps=hparams.log_step_count_steps,
        train_distribute=hparams.distribute_strategy)

    config_obj.set_config()
    config = config_obj.get_config()

    opt = Optimizer()

    def linear_optimizer():
        return opt.set_opt_wrap(
            hparams.lin_opt,
            hparams.learning_rate,
            hparams.lr_rate_decay)

    def deep_optimizer():
        return opt.set_opt_wrap(
            hparams.deep_opt,
            hparams.learning_rate,
            hparams.lr_rate_decay)

    def poly_optimizer():
        return opt.set_opt_wrap(
            hparams.poly_opt,
            hparams.learning_rate,
            hparams.lr_rate_decay)

    deep_cols = create_deep_cols(feature_cols, hparams.name)

    hidden_units = [hparams.hidden_units]

    feature_names = list(csv_cols)

    feature_names.remove(hparams.target_var)

    if hparams.name not in ['polynomialclassifier', 'polynomialregressor']:
        model = CannedModel(
            model_name=hparams.name,
            feature_columns=feature_cols,
            deep_columns=deep_cols,
            hidden_units=hidden_units,
            n_classes=hparams.n_classes,
            linear_optimizer=linear_optimizer,
            dnn_optimizer=deep_optimizer,
            activation_fn=hparams.activation_fn,
            dropout=hparams.dropout,
            batch_norm=hparams.batch_norm,
            config=config)
    else:
        model = CustomModel(
            model_name=hparams.name,
            batch_size=hparams.batch_size,
            optimizer=poly_optimizer,
            model_dir=hparams.job_dir,
            config=config,
            feature_names=feature_names,
            learning_rate=hparams.learning_rate)

    def mean_acc_metric(labels, predictions):
        """
        Defining mean per class accuracy metric
        Arguments:
            labels : labels of the data
            predictions : prediction of the model
        Returns: function defining mean per class accuracy metric
        """
        return mean_acc(labels, predictions, hparams.n_classes)

    estimator = model.build_model()
    if data.task_type == 'classification' and hparams.n_classes == 2:
        estimator = tf.contrib.estimator.add_metrics(estimator, my_auc)
    elif hparams.n_classes > 2:
        estimator = tf.contrib.estimator.add_metrics(
            estimator, mean_acc_metric)
    else:
        estimator = tf.contrib.estimator.add_metrics(estimator, rmse)
        estimator = tf.contrib.estimator.add_metrics(estimator, mar)

    if hparams.early_stopping:
        old_loss = np.inf
        for _ in range(hparams.eval_times):
            estimator.train(input_fn=train_input,
                            steps=hparams.train_steps // hparams.eval_times)
            output = estimator.evaluate(
                input_fn=eval_input, steps=hparams.eval_steps)
            loss = output['loss']
            if loss >= old_loss:
                tf.logging.info(
                    'EARLY STOPPING....... LOSS SATURATED AT : %s', loss)
                break
            else:
                old_loss = loss

    else:
        train_spec = tf.estimator.TrainSpec(
            train_input,
            hparams.train_steps)

        eval_spec = tf.estimator.EvalSpec(
            eval_input,
            hparams.eval_steps,
            throttle_secs=hparams.eval_freq)
        tf.estimator.train_and_evaluate(estimator, train_spec, eval_spec)

    if config_obj.get_is_chief():
        estimator.export_savedmodel(
            hparams.export_dir,
            serving_functions[hparams.export_format],
            assets_extra={
                'lime_explainer': '/tmp/lime_explainer'},
            strip_default_attrs=False)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()

    parser.add_argument(
        '--train_csv_path',
        type=convert_to_list,
        help='CSV file path[s] either on local or GCS',
        required=True)

    parser.add_argument(
        '--eval_csv_path',
        help='CSV file path for model eval',
        required=True)

    parser.add_argument(
        '--task_type',
        help='Machine learning task at hand',
        required=True)

    parser.add_argument(
        '--target_var',
        help='Name of the target variable',
        required=True)

    parser.add_argument(
        '--data_type',
        help='schema of the input data',
        type=convert_to_dict,
        default=None)

    parser.add_argument(
        '--column_names',
        type=none_or_str,
        help='text file containing column names',
        default=None)

    parser.add_argument(
        '--num_clusters',
        type=int,
        help='number of clusters',
        default=3)

    parser.add_argument(
        '--to_drop',
        type=convert_to_list,
        help='list of columns that can be dropped',
        default=None)

    parser.add_argument(
        '--na_values',
        type=none_or_str,
        help='string by which na values are represented',
        default=None)

    parser.add_argument(
        '--condition',
        type=none_or_str,
        help='logic to turn the target variable into levels',
        default=None)

    parser.add_argument(
        '--gcs_path',
        help='Whether the csv is on GCS',
        default=True)

    parser.add_argument(
        '--num_epochs',
        help='number of epochs for dataset to repeat',
        type=int,
        default=50)

    parser.add_argument(
        '--batch_size',
        help='batch size to train and eval the model',
        type=int,
        default=64)

    parser.add_argument(
        '--buffer_size',
        help='buffer size for prefetch',
        type=int,
        default=64)

    parser.add_argument(
        '--n_classes',
        help='number of levels in target var',
        default=2,
        type=int)

    parser.add_argument(
        '--train_steps',
        help='number of steps to train the model',
        type=int,
        default=50000)

    parser.add_argument(
        '--eval_steps',
        help='number of eval batches to run',
        type=int,
        default=100)

    parser.add_argument(
        '--job-dir',
        help='directory to store model checkpoints',
        type=str,
        default='/temp')

    parser.add_argument(
        '--seed',
        help='seed to set for random initialization',
        default=None)

    parser.add_argument(
        '--save_summary_steps',
        help='number of global steps to save summaries',
        type=int,
        default=100)

    parser.add_argument(
        '--save_checkpoints_steps',
        help='number of global steps to save checkpoints',
        type=int,
        default=500)

    parser.add_argument(
        '--save_checkpoints_secs',
        help='number of seconds after which to save checkpoints',
        type=int,
        default=None)

    parser.add_argument(
        '--keep_checkpoint_max',
        help='max number of checkpoints to save',
        type=int,
        default=5)

    parser.add_argument(
        '--keep_checkpoint_every_n_hours',
        help='save checkpoint frequency',
        type=int,
        default=10000)

    parser.add_argument(
        '--log_step_count_steps',
        help='how frequently to log information',
        type=int,
        default=100)

    parser.add_argument(
        '--distribute_strategy',
        help='distribution strategy to use for training',
        type=none_or_str,
        default=None)

    # model params
    parser.add_argument(
        '--name',
        help='name of the model you want to use',
        required=True,
        choices=['linearclassifier', 'linearregressor',
                 'dnnclassifier', 'dnnregresssor', 'combinedclassifier',
                 'combinedregressor', 'kmeanscluster'])

    parser.add_argument(
        '--hidden_units',
        help='number of hidden units in each layer of dnn',
        type=int,
        default=64
    )

    parser.add_argument(
        '--num_layers',
        help='number of hidden layers',
        type=int,
        default=2)

    parser.add_argument(
        '--lin_opt',
        help='optimizer to use for linear models',
        type=str,
        default='ftrl')

    parser.add_argument(
        '--deep_opt',
        help='optimizer to use for NN models',
        type=str,
        default='adam')

    parser.add_argument(
        '--lr_rate_decay',
        help='whether to use learninf=g rate decay',
        type=bool,
        default=False)

    parser.add_argument(
        '--activation_fn',
        help='activation fn to use for hidden units',
        default=tf.nn.relu)

    parser.add_argument(
        '--dropout',
        help='dropout rate for hidden layers',
        default=None)

    parser.add_argument(
        '--batch_norm',
        help='whether to use batch norm for hidden layers',
        default=False)

    parser.add_argument(
        '--learning_rate',
        help='learning rate for model training',
        type=float,
        default=0.001)

    parser.add_argument(
        '--eval_freq',
        help='frequency in seconds to trigger evaluation run',
        type=int,
        default=30)

    parser.add_argument(
        '--eval_times',
        help='early stopping criteria',
        type=int,
        default=10)

    parser.add_argument(
        '--early_stopping',
        help='how to define when model training should end',
        type=bool,
        default=False)

    parser.add_argument(
        '--export_dir',
        help='Directory for storing the frozen graph',
        type=str,
        required=True)

    parser.add_argument(
        '--export_format',
        help='Format for the serving inputs',
        type=str,
        default='JSON')

    parser.add_argument(
        '--logging_level',
        help='Format for the serving inputs',
        type=str,
        default='INFO',
        choices=['INFO', 'DEBUG', 'ERROR', 'FATAL', 'WARN'])

    args = parser.parse_args()

    hparams = hparam.HParams(**args.__dict__)
    tf.logging.set_verbosity(hparams.logging_level)
    run_experiment(hparams)
    os.system('rm -r /tmp/*.csv')
