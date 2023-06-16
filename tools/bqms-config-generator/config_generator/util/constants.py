# Copyright 2023 Google. This software is provided as-is, without warranty or
# representation for any use or purpose. Your use of it is subject to your
# agreement with Google.

"""String constants"""
from dataclasses import dataclass


@dataclass(frozen=True)
class ObjectTypes:
    """ The type of source object used for renaming in a name mapping rule """

    DATABASE = 'DATABASE'
    SCHEMA = 'SCHEMA'
    RELATION = 'RELATION'
    RELATION_ALIAS = 'RELATION_ALIAS'
    ATTRIBUTE = 'ATTRIBUTE'
    ATTRIBUTE_ALIAS = 'ATTRIBUTE_ALIAS'
    FUNCTION = 'FUNCTION'


@dataclass(frozen=True)
class YamlConfigConstants:
    """Constants for yaml config generation"""

    INPUT_FIELDS = ['bq_project', 'bq_dataset', 'table_name', 'column_name', 'source_datatype',
                    'target_datatype', 'source_pattern', 'target_pattern']

    MANDATORY_INPUT_FIELDS = ['bq_project', 'bq_dataset', 'table_name', 'column_name', 'source_datatype',
                              'target_datatype']

    SUPPORTED_TARGET_TYPES = ['BOOLEAN', 'TINYINT', 'SMALLINT', 'INTEGER', 'BIGINT', 'FLOAT', 'DOUBLE', 'NUMERIC',
                              'TIME', 'TIMETZ', 'DATE', 'DATETIME', 'TIMESTAMP', 'TIMESTAMPTZ', 'CHAR', 'VARCHAR']


@dataclass(frozen=True)
class JsonConfigConstants:
    """Constants for json config generation"""

    DEFAULT_DATABASE = "__DEFAULT_DATABASE__"

    INPUT_FIELDS = ['type', 'src_db', 'src_schema', 'src_relation', 'src_attribute',
                    'bq_project', 'bq_dataset', 'bq_table', 'bq_column']


YAML_CONSTANTS = YamlConfigConstants()
JSON_CONSTANTS = JsonConfigConstants()
OBJECT_TYPE = ObjectTypes()
