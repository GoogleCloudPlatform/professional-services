import glob
import json
import logging
import os

from apache_beam.testing.test_pipeline import TestPipeline
from apache_beam.testing.test_utils import TempDir
import pytest

from corder import customer_orders


def test_xml_to_bq():
    test_pipeline = TestPipeline()

    with TempDir() as temp_dir:
        input_file = os.path.join("../../sample-data", "customer-orders.xml")
        output_file = os.path.join(temp_dir.get_path(), "example.json")
        extra_opts = {'input': input_file, 'output': output_file}
        customer_orders.run(
            test_pipeline.get_full_options_as_args(**extra_opts))
        output_files = glob.glob(output_file + '*')[0]

        for file_name in output_files:
            if "order" in file_name:
                lines = open(output_file).read().splitlines()
                assert len(lines) == 44
            if "customer" in file_name:
                lines = open(output_file).read().splitlines()
                assert len(lines) == 4


if __name__ == '__main__':
    logging.getLogger().setLevel(logging.INFO)
    pytest.main()
