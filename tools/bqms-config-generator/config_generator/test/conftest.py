from __future__ import annotations

import pytest

from config_generator.util.model import NameMap
from config_generator.util.model import NameMapItem
from config_generator.util.model import Source
from config_generator.util.model import Target


def pytest_addoption(parser):
    parser.addoption('--conf_prep_path', action='store', default='default name')


def pytest_generate_tests(metafunc):

    option_value = metafunc.config.option.conf_prep_path
    if 'conf_prep_path' in metafunc.fixturenames and option_value is not None:
        metafunc.parametrize('conf_prep_path', [option_value])


@pytest.fixture
def object_map_input():
    name_map = [
        {
            'type': 'RELATION', 'src_db': 'project', 'src_schema': 'dataset2',
            'src_relation': 'table2', 'src_attribute': '', 'bq_project': 'bq_project',
            'bq_dataset': 'bq_dataset2', 'bq_table': 'bq_table2', 'bq_column': '',
        },
        {
            'type': 'SCHEMA', 'src_db': 'myProject', 'src_schema': 'mySchema',
            'src_relation': '', 'src_attribute': '', 'bq_project': 'bq_project',
            'bq_dataset': 'bq_dataset', 'bq_table': '', 'bq_column': None,
        },
        {
            'type': 'DATABASE', 'src_db': 'finance', 'src_schema': '',
            'src_relation': '', 'src_attribute': '', 'bq_project': 'bq_project_finance',
            'bq_dataset': '', 'bq_table': '', 'bq_column': '',
        },
        {
            'type': 'RELATION_ALIAS',
            'src_db': '', 'src_schema': '', 'src_relation': 'table1', 'src_attribute': '',
            'bq_project': '', 'bq_dataset': '', 'bq_table': 'table1_alias',
            'bq_column': '',
        }, {
            'type': 'ATTRIBUTE', 'src_db': 'project',
            'src_schema': 'dataset2', 'src_relation': 'table2', 'src_attribute': 'field1',
            'bq_project': 'bq_project', 'bq_dataset': 'bq_dataset2', 'bq_table': 'bq_table2',
            'bq_column': 'bq_column',
        }, {
            'type': 'ATTRIBUTE_ALIAS', 'src_db': 'project',
            'src_schema': 'dataset2', 'src_relation': 'table2', 'src_attribute': 'field1',
            'bq_project': 'bq_project', 'bq_dataset': 'bq_dataset2', 'bq_table': 'bq_table2',
            'bq_column': 'bq_column',
        }, {
            'type': 'FUNCTION', 'src_db': 'mydb', 'src_schema': 'myschema',
            'src_relation': 'myprocedure', 'src_attribute': '', 'bq_project': 'bq_project',
            'bq_dataset': 'myschema', 'bq_table': 'procedure1', 'bq_column': None,
        },
    ]

    return name_map


@pytest.fixture
def atr_test_data():
    object_dict = [
        {
            'bq_project': 'testdb', 'bq_dataset': 'acme', 'table_name': 'employee',
            'column_name': 'jd', 'source_datatype': 'int64', 'target_datatype': 'DATE',
            'source_pattern': '%Y%m%d', 'target_pattern': '%Y%m%d',
        },
        {
            'bq_project': 'testdb', 'bq_dataset': 'acme2', 'table_name': 'employee',
            'column_name': 'eid', 'source_datatype': 'int', 'target_datatype': 'VARCHAR',
            'source_pattern': '', 'target_pattern': '',
        },
    ]

    return object_dict


@pytest.fixture()
def source_json():
    return Source(type='DATABASE', database='hive_default_db', schema='default_schema', relation='DATABASE', attribute='')


@pytest.fixture()
def target_json():
    return Target(database='bq_project_finance', schema='', relation='', attribute='')


@pytest.fixture()
def namemapitem_json(source_json, target_json):
    return NameMapItem(source=source_json, target=target_json)


@pytest.fixture()
def namemap_json(namemapitem_json):
    return NameMap(name_map=namemapitem_json)
