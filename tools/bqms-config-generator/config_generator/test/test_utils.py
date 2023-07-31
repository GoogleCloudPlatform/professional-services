from __future__ import annotations

from contextlib import nullcontext as does_not_raise

import pytest

from config_generator.util import utils


@pytest.mark.parametrize(
    'example_input,expectation',
    [
        ('input/hive_bq_datatype_map.csv', does_not_raise()),
        ('input/hive_bq_datatype_map1.csv', pytest.raises(ValueError)),
    ],
)
def test_read_csv_as_text(example_input, expectation):
    with expectation:
        assert utils.read_csv_as_text(example_input) is not None


@pytest.mark.parametrize(
    'example_input,expectation',
    [
        ('output/ATR_mapping.yaml', does_not_raise()),
        ('input/hive_bq_datatype_map.csv', does_not_raise()),
    ],
)
def test_read_yaml(example_input, expectation):
    with expectation:
        assert utils.read_yaml(example_input) is not None
