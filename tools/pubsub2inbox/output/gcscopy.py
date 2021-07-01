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
from google.cloud import storage
from google.api_core.gapic_v1 import client_info as grpc_client_info


class GcscopyOutput(Output):

    def output(self):
        if 'sourceBucket' not in self.output_config:
            raise NotConfiguredException(
                'No source bucket defined in GCS output.')
        if 'sourceObject' not in self.output_config:
            raise NotConfiguredException(
                'No source object defined in GCS output.')
        if 'destinationBucket' not in self.output_config:
            raise NotConfiguredException(
                'No destination bucket defined in GCS output.')
        if 'destinationObject' not in self.output_config:
            raise NotConfiguredException(
                'No destination object defined in GCS output.')

        bucket_template = self.jinja_environment.from_string(
            self.output_config['sourceBucket'])
        bucket_template.name = 'bucket'
        source_bucket = bucket_template.render()

        object_template = self.jinja_environment.from_string(
            self.output_config['sourceObject'])
        object_template.name = 'object'
        source_object = object_template.render()

        bucket_template = self.jinja_environment.from_string(
            self.output_config['destinationBucket'])
        bucket_template.name = 'bucket'
        destination_bucket = bucket_template.render()

        object_template = self.jinja_environment.from_string(
            self.output_config['destinationObject'])
        object_template.name = 'object'
        destination_object = object_template.render()

        self.logger.debug('Starting to copy source to destination.',
                          extra={
                              'source_url':
                                  'gs://%s/%s' % (source_bucket, source_object),
                              'destination_url':
                                  'gs://%s/%s' %
                                  (destination_bucket, destination_object)
                          })

        client_info = grpc_client_info.ClientInfo(
            user_agent='google-pso-tool/pubsub2inbox/1.1.0')
        project = self.output_config[
            'project'] if 'project' in self.output_config else None
        storage_client = storage.Client(client_info=client_info,
                                        project=project)

        bucket = storage_client.bucket(source_bucket)
        source_blob = bucket.blob(source_object)

        bucket = storage_client.bucket(destination_bucket)
        destination_blob = bucket.blob(destination_object)
        token = None
        while True:
            self.logger.debug(
                'Copying file...',
                extra={
                    'token':
                        token,
                    'source_url':
                        'gs://%s/%s' % (source_bucket, source_object),
                    'destination_url':
                        'gs://%s/%s' % (destination_bucket, destination_object)
                })
            ret = destination_blob.rewrite(source_blob, token=token)
            token = ret[0]
            if token is None:
                break

        self.logger.info('Object copied from source to destination.',
                         extra={
                             'bytes_rewritten':
                                 ret[1],
                             'total_bytes':
                                 ret[2],
                             'source_url':
                                 'gs://%s/%s' % (source_bucket, source_object),
                             'destination_url':
                                 'gs://%s/%s' %
                                 (destination_bucket, destination_object)
                         })
