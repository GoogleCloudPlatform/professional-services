# Copyright 2019 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#         http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import unittest
from bqpipeline.bqpipeline import BQPipeline
from google.cloud import bigquery


class TestQueryParameters(unittest.TestCase):
    def test_datasetspec_resolution(self):
        bq = BQPipeline(job_name='testjob', default_project='testproject', default_dataset='testdataset')
        # resolve from dataset only
        self.assertEqual(bq.resolve_dataset_spec('testdataset'), 'testproject.testdataset')
        # resolve from project.dataset
        self.assertEqual(bq.resolve_dataset_spec('testproject1.testdataset1'), 'testproject1.testdataset1')
        # leave project.dataset unchanged
        self.assertEqual(bq.resolve_dataset_spec('testproject.testdataset'), 'testproject.testdataset')

    def test_tablespec_resolution(self):
        bq = BQPipeline(job_name='testjob', default_project='testproject', default_dataset='testdataset')
        # resolve from table only
        self.assertEqual(bq.resolve_table_spec('testtable'), 'testproject.testdataset.testtable')
        # resolve from dataset.table
        self.assertEqual(bq.resolve_table_spec('testdataset.testtable'), 'testproject.testdataset.testtable')
        # leave project.dataset.table unchanged
        self.assertEqual(bq.resolve_table_spec('testproject.testdataset.testtable'), 'testproject.testdataset.testtable')

    def test_create_job_config_default(self):
        bq = BQPipeline(job_name='testjob', default_project='testproject', default_dataset='testdataset')

        cfg = bq.create_job_config()
        self.assertIsNone(cfg.destination)
        self.assertIsNotNone(cfg.default_dataset)
        self.assertEqual(cfg.default_dataset.project, 'testproject')
        self.assertEqual(cfg.default_dataset.dataset_id, 'testdataset')
        self.assertEqual(cfg.create_disposition, bigquery.job.CreateDisposition.CREATE_IF_NEEDED)
        self.assertEqual(cfg.write_disposition, bigquery.job.WriteDisposition.WRITE_TRUNCATE)
        self.assertEqual(cfg.priority, bigquery.QueryPriority.BATCH)

    def test_create_job_config_destination(self):
        bq = BQPipeline(job_name='testjob', default_project='testproject', default_dataset='testdataset')

        cfgs = [
            bq.create_job_config(dest='testtable'),
            bq.create_job_config(dest='testdataset.testtable'),
            bq.create_job_config(dest='testproject.testdataset.testtable')
        ]

        for cfg in cfgs:
            self.assertEqual(cfg.destination.table_id, 'testtable')
            self.assertEqual(cfg.destination.dataset_id, 'testdataset')
            self.assertEqual(cfg.destination.project, 'testproject')

    def test_create_job_config_flags(self):
        bq = BQPipeline(job_name='testjob', default_project='testproject', default_dataset='testdataset')
        cfg = bq.create_job_config(batch=False, create=False, overwrite=False)
        self.assertEqual(cfg.priority, bigquery.QueryPriority.INTERACTIVE)
        self.assertEqual(cfg.create_disposition, bigquery.job.CreateDisposition.CREATE_NEVER)
        self.assertEqual(cfg.write_disposition, bigquery.job.WriteDisposition.WRITE_EMPTY)
