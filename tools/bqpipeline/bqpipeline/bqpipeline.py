#!/usr/bin/env python
# -*- coding: utf-8 -*-
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

import codecs
from google.cloud import bigquery
from jinja2.sandbox import SandboxedEnvironment
import logging
import sys


FORMAT = '%(asctime)-15s %(levelname)s %(message)s'


def get_logger(name, fmt):
    """
    Creates a Logger that logs to stdout
    :param name: name of the logger
    :param fmt: format string for log messages
    :return: Logger
    """
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(logging.DEBUG)
    handler.setFormatter(logging.Formatter(fmt))
    log = logging.getLogger(name)
    log.setLevel(logging.DEBUG)
    log.addHandler(handler)
    return log


logger = get_logger('job', FORMAT)


def read_sql(path):
    """
    Reads UTF-8 encoded SQL from a file
    :param path: path to SQL file
    :return: str contents of file
    """
    with codecs.open(path, mode='r', encoding='utf-8', buffering=-1) as f:
        return f.read()


def ts(project, dataset, table):
    """
    Creates a TableSpec from project, dataset and table
    :param project: project id containing the dataset
    :param dataset: dataset id
    :param table: table_id
    :return: str
    """
    return project + '.' + dataset + '.' + table


def tableref(project, dataset_id, table_id):
    """
    Creates a TableReference from project, dataset and table
    :param project: project id containing the dataset
    :param dataset_id: dataset id
    :param table_id: table_id
    :return: bigquery.table.TableReference
    """
    dataset_ref = bigquery.dataset.DatasetReference(project=project, dataset_id=dataset_id)
    return bigquery.table.TableReference(dataset_ref=dataset_ref, table_id=table_id)


def to_tableref(tablespec_str):
    """
    Creates a TableReference from TableSpec
    :param tablespec_str: BigQuery TableSpec in format 'project.dataset_id.table_id'
    :return: bigquery.table.TableReference
    """
    parts = tablespec_str.split('.')
    return tableref(parts[0], parts[1], parts[2])


def create_copy_job_config(overwrite=True):
    """
    Creates CopyJobConfig
    :param overwrite: if set to False, target table must not exist
    :return: bigquery.job.CopyJobConfig
    """
    if overwrite:
        # Target table will be overwritten
        return bigquery.job.CopyJobConfig(write_disposition=bigquery.job.WriteDisposition.WRITE_TRUNCATE)
    else:
        # Target table must not exist
        return bigquery.job.CopyJobConfig(write_disposition=bigquery.job.WriteDisposition.WRITE_EMPTY)


class BQPipeline(object):
    """
    BigQuery Python SDK Client Wrapper
    Provides methods for running queries, copying and deleting tables.
    Supports Jinja2 templated SQL and enables default project and dataset to be set for an entire pipeline.
    """

    def __init__(self,
                 job_name,
                 query_project=None,
                 location='US',
                 default_project=None,
                 default_dataset=None,
                 json_credentials_path=None):
        """
        :param job_name: used as job name prefix
        :param query_project: project used to submit queries
        :param location: BigQuery defaults to 'US'
        :param default_project: project to use when tablespec does not specify project
        :param default_dataset: dataset to use when tablespec does not specify dataset, if default_project is also set
        :param json_credentials_path: (optional) path to service account JSON credentials file
        """
        self.job_id_prefix = job_name + '-'
        self.query_project = query_project
        self.location = location
        if default_project is None and query_project is not None:
            self.default_project = query_project
        else:
            self.default_project = default_project
        self.json_credentials_path = json_credentials_path
        self.default_dataset = default_dataset
        self.bq = None
        self.j2 = SandboxedEnvironment()

    def get_client(self):
        """
        Initializes bigquery.Client
        :return bigquery.Client
        """
        if self.bq is None:
            if self.json_credentials_path is not None:
                self.bq = bigquery.Client.from_service_account_json(self.json_credentials_path)
                if self.query_project is not None:
                    self.bq.project = self.query_project
                if self.location is not None:
                    self.bq._location = self.location
            else:
                self.bq = bigquery.Client(project=self.query_project, location=self.location)
        return self.bq

    def resolve_ts(self, dest):
        """
        Resolves a full TableSpec from a partial TableSpec by adding default project and dataset.
        :param dest: TableSpec string or partial TableSpec string
        :return str TableSpec
        """
        table_id = dest
        if table_id is not None:
            parts = table_id.split('.')
            if len(parts) == 2 and self.default_project is not None:
                table_id = self.default_project + '.' + dest
            elif len(parts) == 1 and self.default_project is not None and self.default_dataset is not None:
                table_id = self.default_project + '.' + self.default_dataset + '.' + dest
        return table_id

    def create_job_config(self, batch=True, dest=None, create=True, overwrite=True, append=False):
        """
        Creates a QueryJobConfig
        :param batch: use QueryPriority.BATCH if true
        :param dest: tablespec of destination table
        :param create: if False, destination table must already exist
        :param overwrite: if False, destination table must not exist
        :param append: if True, destination table will be appended to
        :return: bigquery.QueryJobConfig
        """
        if create:
            cd = bigquery.job.CreateDisposition.CREATE_IF_NEEDED
        else:
            cd = bigquery.job.CreateDisposition.CREATE_NEVER

        if overwrite:
            wd = bigquery.job.WriteDisposition.WRITE_TRUNCATE
        elif append:
            wd = bigquery.job.WriteDisposition.WRITE_APPEND
        else:
            wd = bigquery.job.WriteDisposition.WRITE_EMPTY

        if batch:
            pr = bigquery.QueryPriority.BATCH
        else:
            pr = bigquery.QueryPriority.INTERACTIVE

        if dest is not None:
            dest_tableref = to_tableref(self.resolve_ts(dest))
        else:
            dest_tableref = None

        if self.default_project is not None and self.default_dataset is not None:
            ds = bigquery.dataset.DatasetReference(project=self.default_project, dataset_id=self.default_dataset)
        else:
            ds = None

        return bigquery.QueryJobConfig(priority=pr,
                                       default_dataset=ds,
                                       destination=dest_tableref,
                                       create_disposition=cd,
                                       write_disposition=wd)

    def run_query(self, path, batch=True, wait=True, create=True, overwrite=True, timeout=20*60, **kwargs):
        """
        Executes a SQL query from a Jinja2 template file
        :param path: path to sql file or tuple of (path to sql file, destination tablespec)
        :param batch: run query with batch priority
        :param wait: wait for job to complete before returning
        :param create: if False, destination table must already exist
        :param overwrite: if False, destination table must not exist
        :param timeout: time in seconds to wait for job to complete
        :param kwargs: replacements for Jinja2 template
        :return: bigquery.job.QueryJob
        """
        dest = None
        sql_path = path
        if type(path) == tuple:
            sql_path = path[0]
            dest = self.resolve_ts(path[1])

        template_str = read_sql(sql_path)
        template = self.j2.from_string(template_str)
        query = template.render(**kwargs)
        client = self.get_client()
        job = client.query(query,
                           job_config=self.create_job_config(batch, dest, create, overwrite),
                           job_id_prefix=self.job_id_prefix)
        logger.info('Executing query %s %s', sql_path, job.job_id)
        if wait:
            job.result(timeout=timeout)  # wait for job to complete
            job = client.get_job(job.job_id)
            logger.info('Finished query %s %s', sql_path, job.job_id)
        return job

    def run_queries(self, query_paths, batch=True, wait=True, create=True, overwrite=True, timeout=20*60, **kwargs):
        """
        :param query_paths: List[Union[str,Tuple[str,str]]] path to sql file or tuple of (path, destination tablespec)
        :param batch: run query with batch priority
        :param wait: wait for job to complete before returning
        :param create: if False, destination table must already exist
        :param overwrite: if False, destination table must not exist
        :param timeout: time in seconds to wait for job to complete
        :param kwargs: replacements for Jinja2 template
        """
        for path in query_paths:
            self.run_query(path, batch=batch, wait=wait, create=create, overwrite=overwrite, timeout=timeout, **kwargs)

    def copy_table(self, src, dest, wait=True, overwrite=True, timeout=20 * 60):
        """
        :param src: tablespec 'project.dataset.table'
        :param dest: tablespec 'project.dataset.table'
        :param wait: block until job completes
        :param overwrite: overwrite destination table
        :param timeout: time in seconds to wait for operation to complete
        :return: bigquery.job.CopyJob
        """
        src = self.resolve_ts(src)
        dest = self.resolve_ts(dest)
        job = self.get_client().copy_table(sources=src,
                                           destination=dest,
                                           job_id_prefix=self.job_id_prefix,
                                           job_config=create_copy_job_config(overwrite=overwrite))
        logger.info('Copying table `%s` to `%s` %s', src, dest, job.job_id)
        if wait:
            job.result(timeout=timeout)  # wait for job to complete
            logger.info('Finished copying table `%s` to `%s` %s', src, dest, job.job_id)
            job = self.get_client().get_job(job.job_id)
        return job

    def delete_table(self, table):
        """
        Deletes a table
        :param table: table spec `project.dataset.table`
        """
        table = self.resolve_ts(table)
        logger.info("Deleting table `%s`", table)
        self.get_client().delete_table(table)

    def delete_tables(self, tables):
        """
        Deletes multiple tables
        :param tables: List[str] of table spec `project.dataset.table`
        """
        for table in tables:
            self.delete_table(table)
