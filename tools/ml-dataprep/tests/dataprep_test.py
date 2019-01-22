# Copyright 2019 Google LLC.
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

"""Unit tests for the dataprep module."""

from __future__ import absolute_import
from __future__ import print_function

from ml_dataprep import dataprep
from unittest import TestCase

class Params():
    __dict__ = {}


def _create_simple_data_preparator():
    params_simple = Params()
    params_simple.key_file = None
    params_simple.source_project = 'analytics_project_id'
    params_simple.source_dataset = 'analytics_dataset'
    params_simple.source_table = 'analytics_table'
    params_simple.destination_project = 'ml_project_id'
    params_simple.destination_dataset = 'ml_dataset'
    params_simple.destination_gcs_path = 'gs://ml_datasets'
    params_simple.split_ratio = 0.75
    params_simple.all_columns = {
        'feature_columns': ['age', 'status'],
        'target_columns_shuffle': ['income'],
        'target_columns_export': ['income']
    }
    params_simple.parameters = None
    return dataprep.DataPreparator(params_simple), params_simple


def _create_complex_data_preparator():
    params_complex = Params()
    params_complex.key_file = None
    params_complex.source_project = 'analytics_project_id'
    params_complex.source_dataset = 'analytics_dataset'
    params_complex.source_table = 'analytics_table'
    params_complex.destination_project = 'ml_project_id'
    params_complex.destination_dataset = 'ml_dataset'
    params_complex.destination_gcs_path = 'gs://ml_datasets'
    params_complex.split_ratio = 0.75
    params_complex.all_columns = {
        'feature_columns': ['rate_{0}', 'rate_{1}'],
        'target_columns_shuffle': ['income', 'avg(rate_{0}, rate_{1}) as average_rate'],
        'target_columns_export': ['income', 'average_rate']
    }
    params_complex.parameters = ['25_35', '36_46']
    return dataprep.DataPreparator(params_complex), params_complex

class TestDataPreparator(TestCase):

    _simple_data_preparator, _params_simple =\
        _create_simple_data_preparator()
    _complex_data_preparator, _params_complex =\
        _create_complex_data_preparator()

    def test_source_table_uri(self):
        assert self._simple_data_preparator._source_table_uri ==\
            'analytics_project_id.analytics_dataset.analytics_table'

    def test_build_destination_table(self):
        table_id, table_uri = self._simple_data_preparator._build_destination_table(
            20190212194327, 'validation')
        assert table_id == 'analytics_table_validation_20190212194327' and\
            table_uri == 'ml_project_id.ml_dataset.analytics_table_validation_20190212194327'

    def test_build_gcs_destination_uri(self):
        gcs_path = self._simple_data_preparator._build_gcs_destination_uri(
            20190212194327, 'validation')
        assert gcs_path == 'gs://ml_datasets/analytics_table_20190212194327/validation_*.csv'

    def test_all_columns_simple(self):
        columns, target_columns_shuffle, target_columns_export =\
            self._simple_data_preparator._build_columns(self._params_simple.all_columns)
        assert columns == 'age,status' and target_columns_shuffle == 'income' and\
            target_columns_export == 'income'

    def test_feature_columns_simple(self):
        assert self._simple_data_preparator._columns == 'age,status'

    def test_target_columns_shuffle_simple(self):
        assert self._simple_data_preparator._target_columns_shuffle == 'income'

    def test_target_columns_export_simple(self):
        assert self._simple_data_preparator._target_columns_export == 'income'

    def test_all_columns_complex(self):
        columns, target_columns_shuffle, target_columns_export =\
            self._complex_data_preparator._build_columns(self._params_complex.all_columns)
        assert columns == 'rate_25_35,rate_36_46' and\
            target_columns_shuffle == 'income,avg(rate_25_35, rate_36_46) as average_rate' and\
            target_columns_export == 'income,average_rate'

    def test_feature_columns_complex(self):
        assert self._complex_data_preparator._columns == 'rate_25_35,rate_36_46'

    def test_target_columns_shuffle_complex(self):
        assert self._complex_data_preparator._target_columns_shuffle == 'income,avg(rate_25_35, rate_36_46) as average_rate'

    def test_target_columns_export_complex(self):
        assert self._complex_data_preparator._target_columns_export == 'income,average_rate'
