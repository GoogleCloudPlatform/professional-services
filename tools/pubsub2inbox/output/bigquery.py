#   Copyright 2021 Google LLC
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.
from .base import Output, NotConfiguredException
import re
from google.cloud import bigquery


class InvalidJobOptionException(Exception):
    pass


class BigqueryOutput(Output):

    def output(self):
        if 'datasetWithTable' not in self.output_config:
            raise NotConfiguredException(
                'No destination dataset specified in BigQuery output.')
        if 'source' not in self.output_config:
            raise NotConfiguredException(
                'No GCS source specified in BigQuery output.')
        if 'location' not in self.output_config:
            raise NotConfiguredException(
                'No dataset location specified in BigQuery output.')
        if 'job' not in self.output_config:
            raise NotConfiguredException(
                'No load job location specified in BigQuery output.')

        project = self.output_config[
            'project'] if 'project' in self.output_config else None
        bigquery_client = bigquery.Client(
            client_info=self._get_grpc_client_info(), project=project)

        job_config = {}
        job_field_type = {
            'projectionFields': 'list',
            'schema': 'dict',
            'schemaUpdateOptions': 'list',
            'timePartitioning': 'dict',
            'rangePartitioning': 'dict',
            'clustering': 'dict',
            'destinationEncryptionConfiguration': 'dict',
            'hivePartitioningOptions': 'dict',
            'useAvroLogicalTypes': 'bool',
            'allowQuotedNewlines': 'bool',
            'allowJaggedRows': 'bool',
            'ignoreUnknownValues': 'bool,',
            'autodetect': 'bool',
            'decimalTargetTypes': 'list',
            'parquetOptions': 'dict',
            'destinationTableDescription': 'str',
            'destinationTableFriendlyName': 'str',
            'nullMarker': 'str',
            'quoteCharacter': 'str',
            'labels': 'dict',
            'sourceFormat': 'str',
            'encoding': 'str',
            'writeDisposition': 'str',
            'createDisposition': 'str',
            'maxBadRecords': 'int',
            'skipLeadingRows': 'int'
        }
        job_field_map = {}
        for camel_name in job_field_type:
            snake_name = re.sub(r'(?<!^)(?=[A-Z])', '_', camel_name).lower()
            job_field_map[camel_name] = snake_name

        if 'job' in self.output_config:
            for k, v in self.output_config['job'].items():
                if k not in job_field_map:
                    raise InvalidJobOptionException('Unknown job option "%s"' %
                                                    k)
                field = job_field_map[k]
                if k not in job_field_type or job_field_type[k] == 'str':
                    job_config[field] = self._jinja_expand_string(v)
                elif job_field_type[k] == 'list':
                    job_config[field] = self._jinja_var_to_list(v)
                elif job_field_type[k] == 'dict':
                    job_config[field] = self._jinja_expand_dict(v)
                elif job_field_type[k] == 'bool':
                    job_config[field] = self._jinja_expand_bool(v)
                elif job_field_type[k] == 'int':
                    job_config[field] = self._jinja_expand_int(v)

        bq_job_config = bigquery.job.LoadJobConfig.from_api_repr(
            {'load': job_config})

        table = self._jinja_expand_string(
            self.output_config['datasetWithTable'])
        location = self._jinja_expand_string(self.output_config['location'])
        source = self._jinja_expand_string(self.output_config['source'])

        self.logger.info('BigQuery load job starting...',
                         extra={
                             'source_url': source,
                             'dataset': table,
                             'location': location,
                             'job_config': job_config,
                         })
        load_job = bigquery_client.load_table_from_uri(
            source,
            table,
            location=location,
            job_config=bq_job_config,
        )
        load_job.result()
        self.logger.info('BigQuery load job finished.',
                         extra={
                             'source_url': source,
                             'dataset': table,
                             'location': location,
                             'output_rows': load_job.output_rows,
                             'output_bytes': load_job.output_bytes,
                             'errors': load_job.errors,
                         })
