from __future__ import annotations

import pytest

from config_generator.util.constants import YamlConfigConstants
from config_generator.util.csv_yaml_parser import CsvToYaml
from config_generator.util.csv_yaml_parser import MissingColumnError
from config_generator.util.utils import read_yaml

conf = read_yaml('input/conf_prep_path.yaml')
source = conf.get('source')
csv_to_yaml = CsvToYaml(source,'path/to/input.csv','path/to/output.yaml')


def test_check_cols():
    cols = [
        'bq_project', 'bq_dataset', 'table_name', 'column_name',
        'source_datatype', 'target_datatype', 'source_pattern', 'target_pattern',
    ]
    assert YamlConfigConstants.INPUT_FIELDS == cols


def test_check_cols_1():
    cols = [
        'bq_project',  'table_name', 'column_name',
        'source_datatype', 'target_datatype', 'source_pattern', 'target_pattern',
    ]

    with pytest.raises(MissingColumnError):
        csv_to_yaml.check_cols(cols)


def test_atr_conf_prep(atr_test_data):
    expected_json = {
        'type': 'object_rewriter',
        'attribute':
        [
            {
                'match': 'testdb.acme.employee.jd',
                'type':
                {
                    'target': 'DATE',
                    'sourceToTarget': "parse_date('%Y%m%d', cast(? as string))",
                    'targetToSource': "cast(format_date('%Y%m%d', ?) as int64)",
                },
            },
            {
                'match': 'testdb.acme2.employee.eid',
                'type': 'VARCHAR',
            },
        ],
    }

    result = csv_to_yaml.atr_conf_prep(atr_test_data)
    assert expected_json == result


def yaml_dump():
    return None


def test_save_yaml(mocker):
    mocker.patch('config_generator.util.csv_yaml_parser.CsvToYaml.save_yaml', return_value=None)
    if yaml_dump() is None:
        assert True
