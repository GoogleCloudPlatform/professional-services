from __future__ import absolute_import
from __future__ import division
from __future__ import print_function
import json
import os

from google.cloud import bigquery
from google.cloud import storage

from bq_file_load_benchmark.benchmark_tools import file_generator


class TestFileGenerator(object):
    """Tests functionality of benchmark_tools.file_generator.FileGenerator.

    Attributes:

    """

    def setup(self):
        """Sets up resources for tests.
        """
       # create bucket
       # create test params that will result in 2 files
       # add one file to bucket so that it will be skipped
       # leave one file
       # create staging tables of the correct size

    def test_create_files(self, project_id):
        # run create_files()
        # assert that the file has the correct name
        # assert that there are the correct number of files
        # assert that the schema of the file matches that of the table
        assert True

    def test_create_resized_tables(self, project_id):
        assert True

    def teardown(self):
        """Tears down resources created in setup().
        """
