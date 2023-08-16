from __future__ import annotations

from config_generator.util.constants import JsonConfigConstants
from config_generator.util.constants import YamlConfigConstants


def test_yamlconfig_input_fields():
    expected = [
        'bq_project', 'bq_dataset', 'table_name', 'column_name',
        'source_datatype', 'target_datatype', 'source_pattern', 'target_pattern',
    ]
    assert expected == YamlConfigConstants.INPUT_FIELDS


def test_yamlconfig_mandatory_input_fields():
    expected = [
        'bq_project', 'bq_dataset', 'table_name', 'column_name',
        'source_datatype', 'target_datatype',
    ]
    assert expected == YamlConfigConstants.MANDATORY_INPUT_FIELDS


def test_yamlconfig_supported_trgt():
    expected = [
        'BOOLEAN', 'TINYINT', 'SMALLINT', 'INTEGER', 'BIGINT', 'FLOAT', 'DOUBLE', 'NUMERIC',
        'TIME', 'TIMETZ', 'DATE', 'DATETIME', 'TIMESTAMP', 'TIMESTAMPTZ', 'CHAR', 'VARCHAR',
    ]
    assert expected == YamlConfigConstants.SUPPORTED_TARGET_TYPES


def test_jsonconfig_supported_trgt():
    expected = [
        'type', 'src_db', 'src_schema', 'src_relation', 'src_attribute',
        'bq_project', 'bq_dataset', 'bq_table', 'bq_column',
    ]
    assert expected == JsonConfigConstants.INPUT_FIELDS
