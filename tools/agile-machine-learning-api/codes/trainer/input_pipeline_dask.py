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
Input Pipeline for loading data into the model
"""

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

from multiprocessing import cpu_count

import dask
import dask.dataframe as dd
import dill
import lime.lime_tabular
import numpy as np
import pandas as pd
import tensorflow as tf
from google.cloud import storage
from six.moves.urllib.parse import urlparse


class InputReader(object):
    """Class for reading input from different sources
    Assuming csv files for now
    """

    def __init__(self, csv_path, task_type, target_var, na_values=None,
                 column_names=None,
                 to_drop=None, gcs_path=False, data_type=None):
        """The init method initialise and keeps track of the source of input
        (say csv, json etc) and other variables.

        Arguments:
                csv_path : string, Path of the csv files whether local or on remote storage
                task_type : string, ML task at hand, following options are expected
                        [classification, regression, clustering]
                target_var : string, Name of the dependent/target variable
                na_values : string, String by which the na values are represented in the data
                column_names : string, Names of the columns passed in a text file
                to_drop : list, Any redundant columns which can be dropped
                gcs_path : boolean, Whether the csv is stored on google cloud storage
                data_type : dict, dictionary containing the data type of all columns in format
                    {'a': 'float', 'b': 'object', 'c': 'int' }
        """
        self.csv_path = csv_path
        self.task_type = task_type
        self.target_var = target_var
        self.na_values = na_values
        self.to_drop = to_drop
        self.gcs_path = gcs_path
        self.data_type = data_type
        if column_names:
            with tf.gfile.Open(column_names, 'r') as f:
                self.column_names = [line.rstrip() for line in f]
                self.column_names = [
                    line for line in self.column_names if line]
        else:
            self.column_names = column_names

    def parse_csv_wrap(self):
        """
        A Wrapper function for parsing csv files

        Returns:
            _parse_csv function
        """
        return self._parse_csv()

    def _parse_csv(self):
        """Reads csv files in dask to determine the datatypes and other features about data
        this helps in creating a dataset object in tensorflow

        Returns:
                df : dask dataframe, parsed dataframe object
                list(df.columns) : list, list of column names
        """
        if self.gcs_path:
            if isinstance(self.csv_path, list):
                for index, path in enumerate(self.csv_path):
                    parse_result = urlparse(path)
                    bucket = parse_result.hostname
                    csv_name = parse_result.path
                    self._download_csv(
                        bucket,
                        csv_name,
                        path_name='/tmp/data_' +
                                  str(index) +
                                  '.csv')
                csv_path = '/tmp/data_*.csv'
            else:
                parse_result = urlparse(self.csv_path)
                bucket = parse_result.hostname
                csv_name = parse_result.path
                self._download_csv(bucket, csv_name)
                csv_path = '/tmp/data.csv'
        else:
            csv_path = self.csv_path

        if self.column_names:
            header = None
        else:
            header = 'infer'

        try:
            df = dd.read_csv(
                csv_path,
                names=self.column_names,
                header=header,
                na_values=self.na_values,
                sample=12800000,
                dtype=self.data_type)
            if isinstance(csv_path, list):
                len(df)  # Checks whether schema is consistent throughout the data
        except Exception:
            raise AssertionError(
                'Data types given are inconsistent with data provided')

        if self.to_drop is not None:
            drop_column_names = self.to_drop
            drop_column_names = [
                name for name in drop_column_names if name in df.columns]
            df = self.drop_cols(df, drop_column_names)
            tf.logging.info('Dropping the columns : %s', drop_column_names)

        return df, list(df.columns)

    @classmethod
    def drop_cols(cls, df, col_names):
        """Drops any columns which are not required by the user.

        Arguments:
                df : dask dataframe, Dataframe of input data
                col_names : list, Columns in the data to be dropped

        returns:
                dask dataframe, Updated dataframe with columns dropped
        """
        return df.drop(col_names, axis=1)

    @classmethod
    def _download_csv(cls, bucket_name, csv_path, path_name='/tmp/data.csv'):
        """Utility to download the csv files which is stored on Google Cloud Storage
        to local files system. Once processed the file will be deleted

        Arguments:
                bucket_name : string, Remote location of csv file
                csv_name : string, Name of the csv file on GCS
        """
        client = storage.Client()
        bucket = client.get_bucket(bucket_name)
        blob = bucket.blob(csv_path)
        blob.download_to_filename(path_name)


class BasicStats(object):
    """Calculating stats and using them for cleaning the data"""

    def __init__(self):
        """Data type parameters"""

    def is_not_used(self):
        pass

    @classmethod
    def dropping_zero_var_cols(cls, df, target_var, stddev_list):
        """Check columns which have zero variance and removes the from the dataframe.
            As the zero variance columns or contant columns can't be considered as output column

        Arguments:
                df : dask dataframe, The dataframe to validate
                stddev : dask series, Series containing the standard deviation values for columns
                target_var : string, Dependent variable for the analysis

        Returns:
                df : dask dataframe, Dataframe with redundant columns removed

        Raises:
                AssertionError : If the target column has zero deviation
        """
        continuous_cols = [
            col for col in df.columns if df[col].dtype != 'object']
        for col in continuous_cols:
            if stddev_list[col] == 0.0:
                df = df.drop(col, axis=1)
                if col == target_var:
                    err_msg = 'Target variable has zero standard deviation or a contant column. ' \
                              'Please check the data'
                    tf.logging.error(err_msg)
                    raise AssertionError(err_msg)
        return df

    @classmethod
    def normalize(cls, df, target_var, mean_list, stddev_list):
        """Normalizes the numerical columns in a dataframe.

        Arguments:
                df : dask dataframe, The dataframe to normalize
                target_var : string, Dependent variable for the analysis
                mean_list : dask series, Series with all the mean values
                stddev_list : dask series, Series with all the standard deviation values

        Returns:
                df : Dataframe with mean normalized numerical columns
        """
        continuous_cols = [
            col for col in df.columns if df[col].dtype != 'object' and col != target_var]
        for col in continuous_cols:
            df[col] = df[col].sub(mean_list[col]).div(stddev_list[col])

        return df

    @classmethod
    def calculate_stats(cls, df, target_var):
        """Calculates descriptive stats of the dataframe required for cleaning.

        Arguments:
                df : dask dataframe, The dataframe at hand
                target_var : string, Dependent variable for the analysis

        Returns:
                mean : dask series, mean of each column
                median : dask series, median of each column
                dict(zip(categorical_cols, mode)) : dict, Dictionary containing
                        categorical column as keys and their modes as values
                std : dask series, standard deviation of each column
        """
        categorical_columns = [
            col for col in df.columns if col != target_var and df[col].dtype == 'object']
        mean_op = df.mean()
        std_op = df.std()
        median_op = df.quantile(0.5)
        mode_op = [df[col].value_counts().idxmax()
                   for col in categorical_columns]
        mean, median, mode, std = dask.compute(
            mean_op, median_op, mode_op, std_op)
        return mean, median, dict(zip(categorical_columns, mode)), std

    @classmethod
    def impute(cls, df, target_var, median, mode):
        """Imputing missing values using median for continuous columns and mode
        for categorical columns.

        Arguments:
                df : dask dataframe, The dataframe at hand
                target_var : string, Dependent variable for the analysis
                median : list, median of all columns in data
                mode : list, mode of all columns in data
        Returns:
                df : dask dataframe, Dataframe without missing values
        """
        missing_stats = df.isna().sum().compute()
        cols = [col for col in df.columns if col != target_var]
        for col in cols:
            if missing_stats[col] > 0 and df[col].dtype == 'object':
                df[col] = df[col].fillna(mode[col])
            elif missing_stats[col] > 0:
                df[col] = df[col].fillna(median[col])
        return df

    def clean_data(self, df, target_var, task_type, name):
        """Cleans a dataset by removing outliers
        Outiers and missing values are replaced by
        median for continuous and mode for categorical

        Arguments:
                df : dask dataframe, The dataframe to be cleaned
                target_var : string, Name of the target variable
                task_type : string, Type of the task at hand
                name : string, Name of the data being cleaned (train or eval)

        Returns:
                df : dask dataframe, Cleaned dataframe
                mean : dask series, mean of each column
                std_dev : dask series, standard deviation of each column
                _csv_defaults : list, list of default value of each column

        """
        mean, median, mode, std_dev = self.calculate_stats(df, target_var)
        df = self.dropping_zero_var_cols(df, target_var, std_dev)
        df = self.impute(df, target_var, median, mode)
        if task_type == 'classification':
            if df[target_var].dtype == 'float64':
                df[target_var] = df[target_var].astype(np.int64)
        dtype_map = {'float64': 0., 'int64': 0, 'object': ''}
        dtype_list = [str(dtype) for dtype in df.dtypes]
        _csv_defaults = [[dtype_map[dtype]] for dtype in dtype_list]
        if name == 'train' and task_type == 'classification':
            self.creating_explainer_lime(df, target_var)
        df.to_csv('/tmp/clean_*_' + str(name) + '.csv', index=False)
        return df, mean, std_dev, _csv_defaults

    def find_vocab(self, df):
        """Finds the number of levels in each categorical column.
        Helps for creation of feature columns for use in tf.data API

        Arguments:
          df : dask dataframe, Dataframe to extract the levels from

        Returns:
                A dictionary of column names and the levels in each variables
                        [ 0 for numerical columns and number of levels for categorical columns]
        """
        self.is_not_used()
        cat_columns = [
            col for col in df.columns if df[col].dtype == 'object']
        continuous_cols = [
            col for col in df.columns if df[col].dtype != 'object']
        temp = dask.compute([df[col].drop_duplicates() for col in cat_columns])

        column_mapping = dict()

        for col in continuous_cols:
            column_mapping[col] = 0

        for index, col in enumerate(cat_columns):
            column_mapping[col] = np.array(temp[0][index])

        return column_mapping

    def creating_explainer_lime(self, df, target_var):
        """Creates a LIME explainer and saves it as a pickle object

        Arguments:
                df : dask dataframe, Dataframe for which explainer is to be created
                target_var : string, Output column of the dataframe

        """
        self.is_not_used()
        pandas_df = df.compute()
        class_names = list(pandas_df[target_var].unique())
        pandas_df = pandas_df.drop(target_var, axis=1)
        dict_mapping = dict()

        categorical_columns = [
            col for col in pandas_df.columns if pandas_df[col].dtype == 'object']

        categorical_columns_index = [index for index in range(0, len(
            pandas_df.columns)) if pandas_df[pandas_df.columns[index]].dtype == 'object']

        for col in categorical_columns:
            pandas_df[col] = pd.Categorical(
                pandas_df[col], categories=pandas_df[col].unique())
            dict_mapping[col] = dict(enumerate(pandas_df[col].cat.categories))
            pandas_df[col] = pandas_df[col].cat.codes

        feature_names = list(pandas_df.columns)
        dict_of_feature_names = dict()
        for col_index in categorical_columns_index:
            dict_of_feature_names[col_index] = dict_mapping[feature_names[col_index]].values(
            )
        explainer = lime.lime_tabular.LimeTabularExplainer(
            np.array(pandas_df),
            feature_names=feature_names,
            class_names=class_names,
            categorical_features=categorical_columns_index,
            categorical_names=dict_of_feature_names,
            verbose=True)
        with open('/tmp/lime_explainer', 'wb') as dill_file:
            dill.dump(explainer, dill_file)
            dill.dump(dict_mapping, dill_file)
            dill.dump(feature_names, dill_file)


class DatasetInput(object):
    """
    Class for building a tf.data object and input function for tf.Estimator
    """

    def __init__(self, num_epochs, batch_size, buffer_size,
                 csv_defaults, csv_cols, target_var, task_type,
                 condition=None):
        """Initializes the dataset object for a csv reader

        num_epochs : integer, number of epochs to run
        batch_size : integer, batch size of the data
        buffer_size : integer, buffer size
        csv_defaults : dict, default value for each column
        csv_cols : list, list of column names of the data
        target_var : string, name of the target variable
        feat_cols : list, tf.featurecolumn objects to define features
        task_type : string, ML task at hand, following options are expected
                        [classification, regression, clustering]
        condition : string, condition of target variable

        """
        self.num_epochs = num_epochs
        self.batch_size = batch_size
        self.buffer_size = buffer_size
        self.csv_defaults = csv_defaults
        self.csv_cols = csv_cols
        self.target_var = target_var
        self.feat_cols = []
        self.task_type = task_type
        self.condition = condition

    def parse_csv(self, line):
        """Decodes an item from the textline dataset and parses them into columns

        Arguments:
                line : string, The items returned by the dataset object

        Returns:
                features : textline dataset, Data with all the features column except label column
                label : textline dataset, Data of label column
        """
        parsed_line = tf.decode_csv(line, record_defaults=self.csv_defaults)
        tf.logging.info(
            'The Default datatypes read are : %s',
            self.csv_defaults)
        features = dict(zip(self.csv_cols, parsed_line))
        label = features.pop(self.target_var)
        if self.condition:
            label = tf.equal(label, self.condition)
        return features, label

    @staticmethod
    def _get_pattern(name, csv_path=None):
        """
        Helper function for returnning the naming pattern of the cleaned data
        Arguments:
            name : string, type of the data ['Train' or 'Eval']
            csv_path : string, path of the cleaned csv
        Returns :
            pattern : string, globpath of the cleaned data
        """
        pattern = '/tmp/clean_*_{}*'.format(name)
        if csv_path is not None:
            pattern = csv_path
        return pattern

    def input_fn(self, name, csv_path=None):
        """Creates a dataset object for the model to consume. Input function for estimator

        Arguments:
                name : string, Name of the data [Train or Eval]
                csv_path : The path of the csv on any storage system

        Returns:
                features : tf.data.TextLineDataset object, Dataset containing batch of features
                labels : tf.data.TextLineDataset object, Dataset containing batch of labels
        """
        pattern = self._get_pattern(name, csv_path)
        tf.logging.info('The Pattern of files is : %s', pattern)
        filenames = tf.matching_files(pattern=pattern)
        dataset = tf.data.TextLineDataset(filenames).skip(1).map(
            self.parse_csv, num_parallel_calls=cpu_count())
        dataset = dataset.shuffle(buffer_size=self.batch_size * 100)
        dataset = dataset.apply(tf.contrib.data.ignore_errors())
        dataset = dataset.repeat(self.num_epochs)
        dataset = dataset.batch(self.batch_size)  # determine the ideal number
        dataset = dataset.prefetch(self.buffer_size)
        iterator = dataset.make_one_shot_iterator()
        feats, labs = iterator.get_next()
        return feats, labs

    def kmeans_input_fn(self, name, csv_path=None):
        """Input function for kmeans

        Arguments:
                name : string, Name of the data [Train or Eval]
                csv_path : The path of the csv on any storage system

        Returns:
                A batch of features
        """
        pattern = self._get_pattern(name, csv_path)
        tf.logging.info('The Pattern of files is : %s', pattern)
        df = dd.read_csv(pattern)
        vectors = dask.compute(df.values)
        return tf.train.limit_epochs(
            tf.convert_to_tensor(vectors[0], dtype=tf.float32), num_epochs=1)

    def create_feature_columns_wrap(self, dictionary, mean, std_dev):
        """
        Wrapper function for returning create_feature_columns function
        Arguments:
            dictionary : dict, Dictionary with variable names and levels
            mean : dask series, mean of the data
            std_dev : dask_series, standard deviation of the data
        Returns:
            _create_feature_columns function
        """
        return self._create_feature_columns(dictionary, mean, std_dev)

    def _create_feature_columns(self, dictionary, mean, std_dev):
        """Creates an instance of tf.feature columns for each column
        in the feature set. Required for canned estimators

        Arguments:
            dictionary : dict, Dictionary with variable names and levels
            mean : dask series, mean of the data
            std_dev : dask_series, standard deviation of the data

        Returns:
            A list of feature column objects based on the dictionary
        """
        tmp_mean = 0.0
        tmp_std_dev = 0.0
        for col, vocab in dictionary.items():
            if isinstance(vocab, int):
                tmp_mean = mean[col]
                tmp_std_dev = std_dev[col]
                feat_col = tf.feature_column.numeric_column(
                    col, normalizer_fn=lambda x: (x - tmp_mean) / tmp_std_dev)
            else:
                feat_col = tf.feature_column.categorical_column_with_vocabulary_list(
                    col, vocab, num_oov_buckets=1)
            self.feat_cols.append(feat_col)
        return self.feat_cols
