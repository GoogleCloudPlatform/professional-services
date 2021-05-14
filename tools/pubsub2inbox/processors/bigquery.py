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
from .base import Processor, NotConfiguredException
import json
from google.cloud import bigquery
from google.api_core.gapic_v1 import client_info as grpc_client_info


class BigqueryProcessor(Processor):

    def process(self):
        if 'bigquery' not in self.config:
            raise NotConfiguredException(
                'No BigQuery configuration specified in config!')

        bigquery_config = self.config['bigquery']
        if 'query' not in bigquery_config:
            raise NotConfiguredException(
                'No BigQuery query specified in configuration!')

        data = json.loads(self.data)
        self.jinja_environment.globals = {
            **self.jinja_environment.globals,
            **data
        }

        query_template = self.jinja_environment.from_string(
            bigquery_config['query'])
        query_template.name = 'query'
        query = query_template.render()

        dialect = 'legacy' if 'dialect' in bigquery_config and bigquery_config[
            'dialect'].lower() == 'legacy' else 'standard'
        self.logger.debug('Running BigQuery query.', extra={'query': query})

        client_info = grpc_client_info.ClientInfo(
            user_agent='google-pso-tool/pubsub2inbox/1.1.0')
        project = bigquery_config[
            'project'] if 'project' in bigquery_config else None
        client = bigquery.Client(client_info=client_info, project=project)
        labels = {}
        if 'labels' in bigquery_config:
            labels = bigquery_config['labels']
        job_options = bigquery.job.QueryJobConfig(
            use_legacy_sql=True if dialect == 'legacy' else False,
            labels=labels)

        query_job = client.query(query, job_config=job_options)
        results = query_job.result()
        records = []
        for row in results:
            record = {}
            for k in row.keys():
                record[k] = row.get(k)
            records.append(record)
        self.logger.debug('BigQuery execution finished.',
                          extra={'count': len(records)})
        return {
            'records': records,
        }
