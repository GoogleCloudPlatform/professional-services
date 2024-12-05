#!/usr/bin/env python
#
# Copyright 2019 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Import Cloud Asset Inventory exports into BigQuery.

Apache Beam pipeline to load Cloud Asset Inventory exports in GCS json objects
into a BigQuery dataset. There are options for appending to tables or truncating
them. The dataset must exist prior to import.

Most all export are small and can likely be processed very quickly by a single
machine with the direct runner. In some situations there might be a very large
number of assets like GCS buckets or BigQuery tables which will benefit from the
scalability of the Dataflow runner, or perhaps you wish to process the file from
environments that are not easily suited to large memory single machines like
Cloud Functions or App Engine.
"""

import copy
from datetime import datetime
import json
import logging
import pprint
import random

import apache_beam as beam
from apache_beam.coders import Coder
from apache_beam.io import ReadFromText
from apache_beam.io.filesystems import FileSystems
from apache_beam.options.pipeline_options import PipelineOptions
from apache_beam.options.value_provider import StaticValueProvider
from apache_beam.transforms import core
from asset_inventory import bigquery_schema
from asset_inventory.api_schema import APISchema
from six import string_types
from typing import Any

from google.api_core.exceptions import BadRequest
from google.api_core.exceptions import NotFound
from google.cloud import bigquery


class JsonCoder(Coder):
    """A coder interpreting each line as a JSON string."""

    def encode(self, value):
        return json.dumps(value)

    def decode(self, encoded):
        return json.loads(encoded)

    def to_type_hint(self):
        return Any


class AssignGroupByKey(beam.DoFn):
    """Split assets based on input feature:

    The group_by value can be either:

    - ASSET_TYPE, so we have a table for that asset type like
    `google.compute.Instance`.

    - ASSET_TYPE_VERSION to have a table for each asset type and version like
      `google.compute.Instance.v1alpha`

    - NONE to have a single table for all assets.

    - NAME for when merging the iam_policy and the resource together as an
      intermediary step prior to load.
    """

    def __init__(self, group_by, num_shards, *unused_args, **unused_kwargs):
        if isinstance(group_by, string_types):
            group_by = StaticValueProvider(str, group_by)

        if isinstance(num_shards, str):
            num_shards = StaticValueProvider(str, num_shards)
        self.num_shards = num_shards
        self.group_by = group_by
        self.shard_map = None

    def apply_shard(self, key):
        """Append shard suffix."""
        # Initialize shard_map from num_shard if first time.
        if self.shard_map is None:
            self.shard_map = {
                k: int(v) for (k, v) in
                [sc.split('=') for sc in self.num_shards.get().split(',')]}
        key_shards = self.shard_map.get(key)
        if key_shards is None:
            key_shards = self.shard_map.get('*')
        if key_shards is None:
            key_shards = 1
        shard = random.randint(0, key_shards - 1)
        return key + '.' + str(shard)

    @classmethod
    def remove_shard(cls, key):
        """Strip shard suffix."""
        return key[:key.rfind('.')]

    def process(self, element, **kwargs):
        key = 'ASSET_TYPE'
        group_by = self.group_by.get()
        if group_by == 'NAME':
            key = element['asset_type'] + '.' + element['name']
        elif group_by == 'NONE':
            key = self.apply_shard(element.pop('_group_by', 'resource'))
        elif group_by == 'ASSET_TYPE':
            # use group_by element override if present.
            key = self.apply_shard(element.pop('_group_by',
                                               element['asset_type']))
        elif group_by == 'ASSET_TYPE_VERSION':
            if 'resource' in element:
                version = element['resource']['version']
                key = element['asset_type'] + '.' + version
            key = element.pop('_group_by', key)
            key = self.apply_shard(key)
        yield key, element


class BigQuerySchemaCombineFn(core.CombineFn):
    """Reduce a list of schemas into a single schema."""

    def create_accumulator(self):
        return []

    def merge_accumulators(self, accumulators, **kwargs):
        return bigquery_schema.merge_schemas(accumulators)

    def extract_output(self, accumulator, **kwargs):
        return accumulator

    @staticmethod
    def get_api_schema_for_resource(element):
        """This will contain the discovery document drive resource schema is present."""
        element_resource = element.get('resource', {})
        return APISchema.bigquery_schema_for_resource(
            element['asset_type'],
            element_resource.get('discovery_name', None),
            element_resource.get('discovery_document_uri', None),
            'data' in element_resource,
            'iam_policy' in element)

    def add_input(self, mutable_accumulator, element, **kwargs):
        resource_schema = self.get_api_schema_for_resource(element)
        # use the API resource's schema if we have one.
        if bigquery_schema.contains_resource_data_schema(resource_schema):
            return resource_schema
        # we don't have a valid API schema, use the element schema.
        return bigquery_schema.merge_schemas([
            mutable_accumulator,
            resource_schema,
            bigquery_schema.translate_json_to_schema(element)])


class BigQuerySanitize(beam.DoFn):
    """Make the json acceptable to BigQuery."""

    def process(self, element, **kwargs):
        yield bigquery_schema.sanitize_property_value(element)


class ProduceResourceJson(beam.DoFn):
    """Create a json only element for every element."""

    def __init__(self, group_by, *unused_args, **unused_kwargs):
        if isinstance(group_by, string_types):
            group_by = StaticValueProvider(str, group_by)
        self.group_by = group_by

    @staticmethod
    def create_resource_copy(element):
        # Write out a json consistently structured row called 'resource' to the
        # 'resource' table. returns a copy of element without data field which
        # is grouped by the 'resource' key.
        resource_data = element.get('resource', {}).pop('data', None)
        resource_copy = copy.deepcopy(element)
        # add it back after the copy operation.
        if resource_data is not None:
            element['resource']['data'] = resource_data
        # override the group by field, so it's written to the `resource` table
        resource_copy['_group_by'] = 'resource'
        return resource_copy

    def process(self, element, **kwargs):
        # add the resource.json_data property if we have resource.data
        if ('resource' in element and
                'data' in element['resource']):
            element['resource']['json_data'] = json.dumps(
                element['resource']['data'])
        # yield the resource copy.
        yield self.create_resource_copy(element)
        # and the element if we are grouping by asset_type or
        # asset_type_version.
        if self.group_by.get() != 'NONE':
            yield element


class AddLoadTime(beam.DoFn):
    """Add timestamp field to track load time."""

    def __init__(self, load_time, *unused_args, **unused_kwargs):
        if isinstance(load_time, string_types):
            load_time = StaticValueProvider(str, load_time)
        self.load_time = load_time

    def process(self, element, **kwargs):
        element[1]['timestamp'] = self.load_time.get()
        yield element


class SanitizeBigQuerySchema(beam.DoFn):
    """Ensure final schema is valid."""

    def process(self, element, **kwargs):
        bigquery_schema.sanitize_bigquery_schema(element[1])
        yield element


class EnforceSchemaDataTypes(beam.DoFn):
    """Convert values to match schema types.
    Change json values to match the expected types of the input schema.
    """

    def process(self, element, schemas, **kwargs):
        """Enforce the datatypes of the input schema on the element data.
        :param element: the element to enforce schema on.
        :param schemas: schemas to enforce
        """
        key_name = element[0]
        elements = element[1]
        schema = schemas[key_name]
        for elem in elements:
            if elem.get('resource', {}).get('data', {}):
                yield (element[0], bigquery_schema.enforce_schema_data_types(
                    elem, schema))
            else:
                yield element[0], elem


class CombinePolicyResource(beam.DoFn):
    """Unions two json documents.

    Used when merging both the iam_policy and asset into a single document to be
    represented as a single BigQuery row when loaded in the same table.

    """

    def process(self, element, **kwargs):
        combined = {}
        for content in element[1]:
            # don't merge a `resource` element.
            if '_group_by' in content:
                yield content
                continue
            combined.update(content)
        if combined:
            yield combined


class WriteToGCS(beam.DoFn):
    """Stage in GCE the files to load into BigQuery.

    All written objects are prefixed by the input stage_dir and loadtime. There
    is an object for each group-key, either an object per asset type, or for
    each asset type version.

    There is nothing cleaning up these objects, so it might be prudent to have a
    lifecycle policy on the GCS destination bucket to purge old files.

    """

    def __init__(self, stage_dir, load_time, *unused_args, **unused_kwargs):
        if isinstance(stage_dir, string_types):
            stage_dir = StaticValueProvider(str, stage_dir)
        if isinstance(load_time, string_types):
            load_time = StaticValueProvider(str, load_time)

        self.stage_dir = stage_dir
        self.load_time = load_time
        self.open_files = {}

    def get_path_for_key_name(self, key_name):
        stage_dir = self.stage_dir.get()
        load_time = self.load_time.get()
        return FileSystems.join(stage_dir, load_time, key_name + '.json')

    def start_bundle(self):
        self.open_files = {}

    def _get_file_for_element(self, element):
        key_name = element[0]
        if key_name in self.open_files:
            return self.open_files[key_name], None
        file_path = self.get_path_for_key_name(key_name)
        file_handle = FileSystems.create(file_path, mime_type='text/json')
        self.open_files[key_name] = file_handle
        return file_handle, file_path

    def process(self, element, **kwargs):
        file_handle, created_file_path = self._get_file_for_element(element)
        for asset_line in element[1]:
            file_handle.write(json.dumps(asset_line).encode())
            file_handle.write(b'\n')
        if created_file_path:
            # key is bigquery table name so each table deleted and created
            # independently
            # value is sharded key and gcs filepath.
            yield (AssignGroupByKey.remove_shard(element[0]),
                   (element[0], created_file_path))

    def finish_bundle(self):
        for _, file_handle in self.open_files.items():
            logging.info('finish bundle')
            file_handle.close()


class AssignShardedKeyForLoad(beam.DoFn):
    """Element is a tuple keyed by table, value is iterable of sharded key and
       gcs file path. The transform unbundled the iterable and return a tuples of
       sharded key and gcs file path to be loaded in parallel to bigquery.
    """

    def process(self, element, **kwargs):
        for (sharded_key, created_file_path) in element[1]:
            yield sharded_key, created_file_path


class BigQueryDoFn(beam.DoFn):
    """Superclass for a DoFn that requires BigQuery dataset information."""

    def __init__(self, dataset, add_load_date_suffix, load_time, *unused_args, **unused_kwargs):
        if isinstance(dataset, string_types):
            dataset = StaticValueProvider(str, dataset)
        self.dataset = dataset
        if isinstance(add_load_date_suffix, string_types):
            add_load_date_suffix = StaticValueProvider(
                str, add_load_date_suffix)
        self.add_load_date_suffix = add_load_date_suffix
        if isinstance(load_time, string_types):
            load_time = StaticValueProvider(str, load_time)
        self.load_time = load_time
        self.bigquery_client = None
        self.dataset_location = None
        self.load_jobs = {}

    def get_dataset_ref(self):
        dataset = self.dataset.get()
        if '.' in dataset:
            return bigquery.DatasetReference.from_string(dataset)
        else:
            return self.bigquery_client.dataset(dataset)

    def get_dataset_location(self):
        if self.dataset:
            return self.bigquery_client.get_dataset(
                self.get_dataset_ref()).location
        return None

    def asset_type_to_table_name(self, asset_type):
        suffix = ''
        add_load_date_suffix = self.add_load_date_suffix.get()
        if (add_load_date_suffix and
                add_load_date_suffix.lower() in ('yes', 'true', 't', '1')):
            suffix = '_' + self.load_time.get()[0:10].replace('-', '')
        return asset_type.replace('.', '_').replace('/', '_') + suffix

    def start_bundle(self):
        if not self.bigquery_client:
            self.bigquery_client = bigquery.Client()
        self.dataset_location = self.get_dataset_location()
        self.load_jobs = {}


class DeleteDataSetTables(BigQueryDoFn):
    """Delete tables when truncating and not appending.

    If we are not keeping old data around, it safer to delete tables in the
    dataset before loading so that no old records remain.
    """

    def __init__(self, dataset, add_load_date_suffix, load_time,
                 write_disposition):
        # Can't use super().
        # https://issues.apache.org/jira/browse/BEAM-6158?focusedCommentId=16919945
        # super(DeleteDataSetTables, self).__init__(dataset)
        BigQueryDoFn.__init__(self, dataset, add_load_date_suffix, load_time)
        if isinstance(write_disposition, string_types):
            write_disposition = StaticValueProvider(str, write_disposition)
        self.write_disposition = write_disposition

    def process(self, element, **kwargs):
        # If we are appending to the table, no need to Delete first.
        if self.write_disposition.get() == 'WRITE_APPEND':
            yield element
            return

        # Delete the BigQuery table prior to loading to it.
        key_name = element[0]
        table_name = self.asset_type_to_table_name(key_name)
        table_ref = self.get_dataset_ref().table(
            table_name)
        try:
            self.bigquery_client.delete_table(table_ref)
        except NotFound:
            pass
        yield element


class LoadToBigQuery(BigQueryDoFn):
    """Load each writen GCS object to BigQuery.
    The Beam python SDK doesn't support dynamic BigQuery destinations yet so
    this must be done within the workers.
    """

    def __init__(self, dataset, add_load_date_suffix, load_time):
        # Can't use super().
        # https://issues.apache.org/jira/browse/BEAM-6158?focusedCommentId=16919945
        # super(LoadToBigQuery, self).__init__(dataset)
        BigQueryDoFn.__init__(self, dataset, add_load_date_suffix, load_time)

    def to_bigquery_schema(self, fields):
        """Convert list of dicts into `bigquery.SchemaFields`."""
        for field in fields:
            if 'fields' in field:
                field['fields'] = self.to_bigquery_schema(field['fields'])
        return [bigquery.SchemaField(**field) for field in fields]

    def process(self, element, schemas, **kwargs):
        """Element is a tuple of key_ name and iterable of filesystem paths.
        :param schemas: schema of the table.
        :param element: name of object to load.
        """

        dataset_ref = self.get_dataset_ref()
        sharded_key_name = element[0]
        key_name = AssignGroupByKey.remove_shard(element[0])
        object_paths = [object_path for object_path in element[1]]
        job_config = bigquery.LoadJobConfig()
        job_config.write_disposition = 'WRITE_APPEND'
        job_config.ignore_unknown_values = True
        job_config.schema_update_options = [
            bigquery.job.SchemaUpdateOption.ALLOW_FIELD_ADDITION]

        table_ref = dataset_ref.table(self.asset_type_to_table_name(key_name))

        # use load_time as a timestamp.
        job_config.time_partitioning = bigquery.table.TimePartitioning(
            field='timestamp')
        job_config.schema = self.to_bigquery_schema(schemas[sharded_key_name])
        job_config.source_format = bigquery.SourceFormat.NEWLINE_DELIMITED_JSON
        try:
            load_job = self.bigquery_client.load_table_from_uri(
                object_paths,
                table_ref,
                location=self.dataset_location,
                job_config=job_config)
            self.load_jobs[key_name] = load_job
        except BadRequest as e:
            logging.error('error in load_job %s, %s, %s, %s',
                          str(object_paths), str(table_ref),
                          str(self.dataset_location),
                          str(job_config.to_api_repr()))
            raise e

    def finish_bundle(self):
        self.bigquery_client = None
        # wait for the load jobs to complete
        for _, load_job in self.load_jobs.items():
            try:
                load_job.result()
            except BadRequest as e:
                logging.error('error in load_job %s', load_job.self_link)
                raise e


class ImportAssetOptions(PipelineOptions):
    """Required options.

    All options are required, but are not marked as such to support creation
    of Dataflow templates.
    """

    @classmethod
    def _add_argparse_args(cls, parser):
        parser.add_value_provider_argument(
            '--group_by',
            default='ASSET_TYPE',
            choices=['ASSET_TYPE', 'ASSET_TYPE_VERSION', 'NONE'],
            help='How to group exported resources into Bigquery tables.')

        parser.add_value_provider_argument(
            '--write_disposition',
            default='WRITE_APPEND',
            choices=['WRITE_APPEND', 'WRITE_EMPTY'],
            help='To append to or overwrite BigQuery tables..')

        parser.add_value_provider_argument(
            '--input', help='A glob of all input asset json files to process.')

        parser.add_value_provider_argument(
            '--num_shards', help=(
                'Number of shards to use per key.'
                'List of asset types and the number'
                'of shards to use for that type with "*" used as a default.'
                ' For example "google.compute.VpnTunnel=1,*=10"'),
            default='*=1')

        parser.add_value_provider_argument(
            '--stage',
            help='GCS location to write intermediary BigQuery load files.')

        parser.add_value_provider_argument(
            '--load_time',
            default=datetime.now().isoformat(),
            help='Load time of the data (YYYY-MM-DD[HH:MM:SS])).')

        parser.add_value_provider_argument(
            '--add_load_date_suffix',
            default='False',
            help='If the load date [YYYYMMDD] is added as a table suffix.')

        parser.add_value_provider_argument(
            '--dataset', help='BigQuery dataset to load to.')


def run(argv=None):
    """Construct the pipeline."""

    options = ImportAssetOptions(argv)

    p = beam.Pipeline(options=options)

    # Cleanup json documents.
    sanitized = (
            p | 'read' >> ReadFromText(options.input, coder=JsonCoder())
            | 'produce_resource_json' >> beam.ParDo(ProduceResourceJson(
               options.group_by))
            | 'bigquery_sanitize' >> beam.ParDo(BigQuerySanitize()))

    # Joining all iam_policy objects with resources of the same name.
    merged_iam = (
            sanitized | 'assign_name_key' >> beam.ParDo(
              AssignGroupByKey('NAME', ''))
            | 'group_by_name' >> beam.GroupByKey()
            | 'combine_policy' >> beam.ParDo(CombinePolicyResource()))

    # split into BigQuery tables.
    keyed_assets = merged_iam | 'assign_group_by_key' >> beam.ParDo(
        AssignGroupByKey(options.group_by, options.num_shards))

    # Generate BigQuery schema for each table.
    schemas = (keyed_assets
               | 'to_schema' >> core.CombinePerKey(
                BigQuerySchemaCombineFn())
               | 'sanitize_schema' >> beam.ParDo(SanitizeBigQuerySchema()))

    pvalue_schemas = beam.pvalue.AsDict(schemas)
    # Write to GCS and load to BigQuery.
    # pylint: disable=expression-not-assigned
    (keyed_assets
     | 'add_load_time' >> beam.ParDo(AddLoadTime(options.load_time))
     | 'group_by_sharded_key_for_enforce_schema' >> beam.GroupByKey()
     | 'enforce_schema' >> beam.ParDo(EnforceSchemaDataTypes(), pvalue_schemas)
     | 'group_by_sharded_key_for_write' >> beam.GroupByKey()
     | 'write_to_gcs' >> beam.ParDo(
                WriteToGCS(options.stage, options.load_time))
     | 'group_written_objects_by_key' >> beam.GroupByKey()
     | 'delete_tables' >> beam.ParDo(
                DeleteDataSetTables(options.dataset, options.add_load_date_suffix,
                                    options.load_time,
                                    options.write_disposition))
     | 'assign_sharded_key_for_load' >> beam.ParDo(AssignShardedKeyForLoad())
     | 'group_by_sharded_key_for_load' >> beam.GroupByKey()
     | 'load_to_bigquery' >> beam.ParDo(
                LoadToBigQuery(options.dataset, options.add_load_date_suffix,
                               options.load_time),
                beam.pvalue.AsDict(schemas)))

    return p.run()


if __name__ == '__main__':
    logging.basicConfig()
    logging.getLogger().setLevel(logging.INFO)
    pipeline_result = run()
    logging.info('waiting on pipeline : %s', pprint.pformat(pipeline_result))
    state = pipeline_result.wait_until_finish()
    logging.info('final state: %s', state)
