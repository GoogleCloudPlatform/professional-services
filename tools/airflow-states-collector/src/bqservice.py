# Copyright 2023 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from google.cloud import bigquery
from jinja2.sandbox import SandboxedEnvironment

from src.utils import get_logger, read_file

LOGGER = get_logger('bq-service')

def tableref(project, dataset_id, table_id):
  """
  Creates a TableReference from project, dataset and table
  :param project: project id containing the dataset
  :param dataset_id: dataset id
  :param table_id: table_id
  :return: bigquery.table.TableReference
  """
  dataset_ref = bigquery.dataset.DatasetReference(project=project,
                                                  dataset_id=dataset_id)
  return bigquery.table.TableReference(dataset_ref=dataset_ref,
                                       table_id=table_id)


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
    return bigquery.job.CopyJobConfig(
        write_disposition=bigquery.job.WriteDisposition.WRITE_TRUNCATE)
  # Target table must not exist
  return bigquery.job.CopyJobConfig(
      write_disposition=bigquery.job.WriteDisposition.WRITE_EMPTY)


class BQService(object):
  """
  BigQuery Python SDK Client Wrapper
  Provides methods for running queries, copying and deleting tables.
  Supports Jinja2 templated SQL and enables default project and dataset to
  be set for an entire pipeline.
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
    :param default_project: project to use when tablespec does not specify
        project
    :param default_dataset: dataset to use when tablespec does not specify
        dataset, if default_project is also set
    :param json_credentials_path: (optional) path to service account JSON
        credentials file
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
    self.jinja2 = SandboxedEnvironment()

  def get_client(self):
    """
    Initializes bigquery.Client
    :return bigquery.Client
    """
    if self.bq is None:
      if self.json_credentials_path is not None:
        self.bq = bigquery.Client.from_service_account_json(
            self.json_credentials_path)
        if self.query_project is not None:
          self.bq.project = self.query_project
        if self.location is not None:
          self.bq._location = self.location
      else:
        self.bq = bigquery.Client(project=self.query_project,
                                  location=self.location)
    return self.bq

  def resolve_table_spec(self, dest):
    """
    Resolves a full TableSpec from a partial TableSpec by adding default
    project and dataset.
    :param dest: TableSpec string or partial TableSpec string
    :return str TableSpec
    """
    table_id = dest
    if table_id is not None:
      parts = table_id.split('.')
      if len(parts) == 2 and self.default_project is not None:
        table_id = self.default_project + '.' + dest
      elif len(parts) == 1 and \
          self.default_project is not None \
          and self.default_dataset is not None:
        table_id = self.default_project + '.' + self.default_dataset + '.' + dest
    return table_id

  def resolve_dataset_spec(self, dataset):
    """
    Resolves a full DatasetSpec from a partial DatasetSpec by adding default
    project.
    :param dest: DatasetSpec string or partial DatasetSpec string
    :return str DatasetSpec
    """
    dataset_id = dataset
    if dataset_id is not None:
      parts = dataset_id.split('.')
      if len(parts) == 1 and \
          self.default_project is not None:
        dataset_id = self.default_project + '.' + dataset
    return dataset_id

  def create_dataset(self, dataset, exists_ok=False):
    """
    Creates a BigQuery Dataset from a full or partial dataset spec.
    :param dataset: DatasetSpec string or partial DatasetSpec string
    """
    dataset_id = self.resolve_dataset_spec(dataset)
    LOGGER.info("Creating Dataset: `%s`", dataset_id)
    return self.get_client().create_dataset(dataset_id,
                                  exists_ok=exists_ok)

  def create_job_config(self, batch=True, dest=None, create=True,
      overwrite=True, append=False, script=True):
    """
    Creates a QueryJobConfig
    :param batch: use QueryPriority.BATCH if true
    :param dest: tablespec of destination table
    :param create: if False, destination table must already exist
    :param overwrite: if False, destination table must not exist
    :param append: if True, destination table will be appended to
    :param script: if True, treat as script and not set write dispositions
    :return: bigquery.QueryJobConfig
    """
    if create:
      create_disp = bigquery.job.CreateDisposition.CREATE_IF_NEEDED
    else:
      create_disp = bigquery.job.CreateDisposition.CREATE_NEVER

    if overwrite:
      write_disp = bigquery.job.WriteDisposition.WRITE_TRUNCATE
    elif append:
      write_disp = bigquery.job.WriteDisposition.WRITE_APPEND
    else:
      write_disp = bigquery.job.WriteDisposition.WRITE_EMPTY

    if batch:
      priority = bigquery.QueryPriority.BATCH
    else:
      priority = bigquery.QueryPriority.INTERACTIVE

    if dest is not None:
      dest_tableref = to_tableref(self.resolve_table_spec(dest))
    else:
      dest_tableref = None

    if self.default_project is not None \
        and self.default_dataset is not None:
      ds = bigquery.dataset.DatasetReference(
          project=self.default_project,
          dataset_id=self.default_dataset
      )
    else:
      ds = None

    return \
      bigquery.QueryJobConfig(priority=priority,
                                   default_dataset=ds,
                                   destination=dest_tableref,
                                   create_disposition=create_disp,
                                   write_disposition=write_disp) \
      if script == False \
      else bigquery.QueryJobConfig(priority=priority,default_dataset=ds);


  def run_query(self, path, batch=True, wait=True, create=True,
      overwrite=True, append=False, timeout=20 * 60, **kwargs):
    """
    Executes a SQL query from a Jinja2 template file
    :param path: path to sql file or tuple of (path to sql file, destination tablespec)
    :param batch: run query with batch priority
    :param wait: wait for job to complete before returning
    :param create: if False, destination table must already exist
    :param overwrite: if False, destination table must not exist
    :param append: if True, destination table must exist
    :param timeout: time in seconds to wait for job to complete
    :param kwargs: replacements for Jinja2 template
    :return: bigquery.job.QueryJob
    """
    dest = None
    sql_path = path
    if type(path) == tuple:
      sql_path = path[0]
      dest = self.resolve_table_spec(path[1])

    template_str = read_file(sql_path)
    template = self.jinja2.from_string(template_str)
    query = template.render(**kwargs)
    client = self.get_client()
    job = client.query(query,
                       job_config=self.create_job_config(batch, dest, create,
                                                         overwrite, append),
                       job_id_prefix=self.job_id_prefix)
    LOGGER.info('Executing query %s | JobId: %s', sql_path, job.job_id)
    if wait:
      job.result(timeout=timeout)  # wait for job to complete
      job = client.get_job(job.job_id)
      LOGGER.info('Finished query %s | JobId: %s', sql_path, job.job_id)
    return job

  def run_queries(self, query_paths, batch=True, wait=True, create=True,
      overwrite=True, append=False, timeout=20 * 60, **kwargs):
    """
    :param query_paths: List[Union[str,Tuple[str,str]]] path to sql file or
           tuple of (path, destination tablespec)
    :param batch: run query with batch priority
    :param wait: wait for job to complete before returning
    :param create: if False, destination table must already exist
    :param overwrite: if False, destination table must not exist
    :param timeout: time in seconds to wait for job to complete
    :param kwargs: replacements for Jinja2 template
    """
    for path in query_paths:
      self.run_query(path, batch=batch, wait=wait, create=create,
                     overwrite=overwrite, append=append, timeout=timeout,
                     **kwargs)

  def copy_table(self, src, dest, wait=True, overwrite=True, timeout=20 * 60):
    """
    :param src: tablespec 'project.dataset.table'
    :param dest: tablespec 'project.dataset.table'
    :param wait: block until job completes
    :param overwrite: overwrite destination table
    :param timeout: time in seconds to wait for operation to complete
    :return: bigquery.job.CopyJob
    """
    src = self.resolve_table_spec(src)
    dest = self.resolve_table_spec(dest)
    job = self.get_client().copy_table(sources=src,
                                       destination=dest,
                                       job_id_prefix=self.job_id_prefix,
                                       job_config=create_copy_job_config(
                                           overwrite=overwrite))
    LOGGER.info('Copying table `%s` to `%s` %s', src, dest, job.job_id)
    if wait:
      job.result(timeout=timeout)  # wait for job to complete
      LOGGER.info('Finished copying table `%s` to `%s` %s', src, dest,
                  job.job_id)
      job = self.get_client().get_job(job.job_id)
    return job

  def delete_table(self, table):
    """
    Deletes a table
    :param table: table spec `project.dataset.table`
    """
    table = self.resolve_table_spec(table)
    LOGGER.info("Deleting table `%s`", table)
    self.get_client().delete_table(table)

  def delete_tables(self, tables):
    """
    Deletes multiple tables
    :param tables: List[str] of table spec `project.dataset.table`
    """
    for table in tables:
      self.delete_table(table)

  def export_csv_to_gcs(self, table, gcs_path, delimiter=',', header=True):
    """
    Export a table to GCS as CSV.
    :param table: str of table spec `project.dataset.table`
    :param gcs_path: str of destination GCS path
    :param delimiter: str field delimiter for output data.
    :param header: boolean indicates the output CSV file print the header.
    """
    src = self.resolve_table_spec(table)
    extract_job_config = bigquery.job.ExtractJobConfig(
        compression='NONE',
        destination_format='CSV',
        field_delimiter=delimiter,
        print_header=header
    )

    return self.get_client().extract_table(src, gcs_path,
                                           job_config=extract_job_config)

  def export_json_to_gcs(self, table, gcs_path):
    """
    Export a table to GCS as a Newline Delimited JSON file.
    :param table: str of table spec `project.dataset.table`
    :param gcs_path: str of destination GCS path
    """
    src = self.resolve_table_spec(table)
    extract_job_config = bigquery.job.ExtractJobConfig(
        compression='NONE',
        destination_format='NEWLINE_DELIMITED_JSON',
    )

    return self.get_client().extract_table(src, gcs_path,
                                           job_config=extract_job_config)

  def export_avro_to_gcs(self, table, gcs_path, compression='snappy'):
    """
    Export a table to GCS as a Newline Delimited JSON file.
    :param compression:
    :param table: str of table spec `project.dataset.table`
    :param gcs_path: str of destination GCS path
    """
    src = self.resolve_table_spec(table)
    extract_job_config = bigquery.job.ExtractJobConfig(
        compression=compression,
        destination_format='AVRO'
    )

    return self.get_client().extract_table(src, gcs_path,
                                           job_config=extract_job_config)
