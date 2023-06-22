from __future__ import annotations

import pytest

from config_generator.util.constants import JsonConfigConstants
from config_generator.util.constants import ObjectTypes
from config_generator.util.csv_json_parser import CsvToJson
from config_generator.util.csv_json_parser import MissingColumnError
from config_generator.util.model import NameMap
from config_generator.util.model import NameMapItem
from config_generator.util.model import Source
from config_generator.util.model import Target
from config_generator.util.utils import read_yaml

conf = read_yaml('input/conf_prep_path.yaml')
source = conf.get('source')
csv_json = CsvToJson(source,'path/to/input.csv','path/to/output.yaml')


def test_check_cols():
    cols = [
        'type', 'src_db', 'src_schema', 'src_relation', 'src_attribute',
        'bq_project', 'bq_dataset', 'bq_table', 'bq_column',
    ]
    assert JsonConfigConstants.INPUT_FIELDS == cols


def test_missing_check_cols():
    cols = [
        'type', 'src_db', 'src_schema', 'src_relation', 'src_attribute',
        'bq_project', 'bq_dataset',  'bq_column',
    ]
    with pytest.raises(MissingColumnError):
        csv_json.check_cols(cols)


def test_object_map_prep_type_rel(object_map_input):
    expected_json = NameMap(
        name_map=[
            NameMapItem(
                source=Source(type='RELATION', database='project', schema='dataset2', relation='table2', attribute=''),
                target=Target(database='bq_project', schema='bq_dataset2', relation='bq_table2', attribute=''),
            ),

        ],
    )
    input_namemap = [obj_map for obj_map in object_map_input if obj_map['type'] == ObjectTypes.RELATION]

    result = csv_json.object_map_prep(input_namemap)
    assert expected_json == result


def test_neg_object_map_prep_rel(object_map_input):
    expected_json = NameMap(
        name_map=[
            NameMapItem(
                source=Source(type='RELATION'),
                target=Target(),
            ),
        ],
    )

    input_namemap = [obj_map for obj_map in object_map_input if obj_map['type'] == ObjectTypes.RELATION]
    result = csv_json.object_map_prep(input_namemap)

    assert expected_json != result


def test_object_map_prep_type_schema(object_map_input):
    expected_json = NameMap(
        name_map=[
            NameMapItem(
                source=Source(type='SCHEMA', database='myProject', schema='mySchema'),
                target=Target(database='bq_project', schema='bq_dataset'),
            ),
        ],
    )

    input_namemap = [obj_map for obj_map in object_map_input if obj_map['type'] == ObjectTypes.SCHEMA]

    result = csv_json.object_map_prep(input_namemap)

    assert expected_json == result


def test_neg_object_map_prep_schema(object_map_input):
    expected_json = NameMap(
        name_map=[
            NameMapItem(
                source=Source(type='SCHEMA'),
                target=Target(),
            ),
        ],
    )

    input_namemap = [obj_map for obj_map in object_map_input if obj_map['type'] == ObjectTypes.SCHEMA]
    result = csv_json.object_map_prep(input_namemap)

    assert expected_json != result


def test_object_map_prep_type_db(object_map_input):
    expected_json = NameMap(
        name_map=[
            NameMapItem(
                source=Source(type='DATABASE', database='finance'),
                target=Target(database='bq_project_finance'),
            ),
        ],
    )

    input_namemap = [obj_map for obj_map in object_map_input if obj_map['type'] == ObjectTypes.DATABASE]

    result = csv_json.object_map_prep(input_namemap)

    assert expected_json == result


def test_neg_object_map_prep_type_db(object_map_input):
    expected_json = NameMap(
        name_map=[
            NameMapItem(
                source=Source(type='DATABASE'),
                target=Target(),
            ),
        ],
    )

    input_namemap = [obj_map for obj_map in object_map_input if obj_map['type'] == ObjectTypes.DATABASE]
    result = csv_json.object_map_prep(input_namemap)

    assert expected_json != result


def test_object_map_prep_type_rel_alias(object_map_input):
    expected_json = NameMap(
        name_map=[
            NameMapItem(
                source=Source(type='RELATION_ALIAS', relation='table1'),
                target=Target(relation='table1_alias'),
            ),
        ],
    )

    input_namemap = [obj_map for obj_map in object_map_input if obj_map['type'] == ObjectTypes.RELATION_ALIAS]

    result = csv_json.object_map_prep(input_namemap)

    assert expected_json == result


def test_neg_object_map_prep_type_rel_alias(object_map_input):
    expected_json = NameMap(
        name_map=[
            NameMapItem(
                source=Source(type='RELATION_ALIAS'),
                target=Target(),
            ),
        ],
    )

    input_namemap = [obj_map for obj_map in object_map_input if obj_map['type'] == ObjectTypes.RELATION_ALIAS]
    result = csv_json.object_map_prep(input_namemap)

    assert expected_json != result


def test_object_map_prep_type_attr(object_map_input):
    expected_json = NameMap(
        name_map=[
            NameMapItem(
                source=Source(
                    type='ATTRIBUTE', database='project', schema='dataset2',
                    relation='table2', attribute='field1',
                ),
                target=Target(
                    database='bq_project', schema='bq_dataset2', relation='bq_table2',
                    attribute='bq_column',
                ),
            ),
        ],
    )

    input_namemap = [obj_map for obj_map in object_map_input if obj_map['type'] == ObjectTypes.ATTRIBUTE]

    result = csv_json.object_map_prep(input_namemap)

    assert expected_json == result


def test_neg_object_map_prep_type_attr(object_map_input):
    expected_json = NameMap(
        name_map=[
            NameMapItem(
                source=Source(type='ATTRIBUTE'),
                target=Target(),
            ),
        ],
    )

    input_namemap = [obj_map for obj_map in object_map_input if obj_map['type'] == ObjectTypes.ATTRIBUTE]
    result = csv_json.object_map_prep(input_namemap)

    assert expected_json != result


def test_object_map_prep_type_attr_alias(object_map_input):
    expected_json = NameMap(
        name_map=[
            NameMapItem(
                source=Source(
                    type='ATTRIBUTE_ALIAS', database='project', schema='dataset2',
                    relation='table2', attribute='field1',
                ),
                target=Target(
                    database='bq_project', schema='bq_dataset2', relation='bq_table2',
                    attribute='bq_column',
                ),
            ),
        ],
    )

    input_namemap = [obj_map for obj_map in object_map_input if obj_map['type'] == ObjectTypes.ATTRIBUTE_ALIAS]

    result = csv_json.object_map_prep(input_namemap)

    assert expected_json == result


def test_neg_object_map_prep_type_attr_alias(object_map_input):
    expected_json = NameMap(
        name_map=[
            NameMapItem(
                source=Source(type='ATTRIBUTE_ALIAS'),
                target=Target(),
            ),
        ],
    )

    input_namemap = [obj_map for obj_map in object_map_input if obj_map['type'] == ObjectTypes.ATTRIBUTE_ALIAS]
    result = csv_json.object_map_prep(input_namemap)

    assert expected_json != result


def test_object_map_prep_type_func(object_map_input):
    expected_json = NameMap(
        name_map=[
            NameMapItem(
                source=Source(type='FUNCTION', database='mydb', schema='myschema', relation='myprocedure'),
                target=Target(database='bq_project', schema='myschema', relation='procedure1'),
            ),
        ],
    )

    input_namemap = [obj_map for obj_map in object_map_input if obj_map['type'] == ObjectTypes.FUNCTION]

    result = csv_json.object_map_prep(input_namemap)

    assert expected_json == result


def test_neg_object_map_prep_type_func(object_map_input):
    expected_json = NameMap(
        name_map=[
            NameMapItem(
                source=Source(type='FUNCTION'),
                target=Target(),
            ),
        ],
    )

    input_namemap = [obj_map for obj_map in object_map_input if obj_map['type'] == ObjectTypes.FUNCTION]
    result = csv_json.object_map_prep(input_namemap)

    assert expected_json != result
