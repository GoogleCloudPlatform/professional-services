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
import base64


class GcsOutput(Output):

    def output(self):
        if 'bucket' not in self.output_config:
            raise NotConfiguredException(
                'No destination bucket defined in GCS output.')
        if 'object' not in self.output_config and 'objects' not in self.output_config:
            raise NotConfiguredException(
                'No destination object(s) defined in GCS output.')
        if 'contents' not in self.output_config:
            raise NotConfiguredException('No GCS contents defined in output.')

        bucket_template = self.jinja_environment.from_string(
            self.output_config['bucket'])
        bucket_template.name = 'bucket'
        destination_bucket = bucket_template.render()

        project = self.output_config[
            'project'] if 'project' in self.output_config else None
        storage_client = storage.Client(
            client_info=self._get_grpc_client_info(), project=project)

        bucket = storage_client.bucket(destination_bucket)

        if 'objects' in self.output_config:
            all_objects = self._jinja_var_to_list(self.output_config['objects'])
            for destination_object, destination_key in all_objects.items():
                self.logger.debug(
                    'Creating destination file in bucket.',
                    extra={
                        'url':
                            'gs://%s/%s' %
                            (destination_bucket, destination_object)
                    })

                contents_template = self.jinja_environment.from_string(
                    self.output_config['contents'])
                contents_template.name = 'contents'
                contents = contents_template.render({
                    'filename': destination_object,
                    'key': destination_key
                })
                if 'base64decode' in self.output_config and self.output_config[
                        'base64decode']:
                    contents = base64.decodebytes(contents.encode('ascii'))

                blob = bucket.blob(destination_object)
                blob.upload_from_string(contents)

                self.logger.info(
                    'Object created in Cloud Storage bucket.',
                    extra={
                        'url':
                            'gs://%s/%s' %
                            (destination_bucket, destination_object),
                        'size':
                            len(contents)
                    })

        else:  # Single object
            object_template = self.jinja_environment.from_string(
                self.output_config['object'])
            object_template.name = 'object'
            destination_object = object_template.render()

            self.logger.debug('Creating destination file in bucket.',
                              extra={
                                  'url':
                                      'gs://%s/%s' %
                                      (destination_bucket, destination_object)
                              })

            contents_template = self.jinja_environment.from_string(
                self.output_config['contents'])
            contents_template.name = 'contents'
            contents = contents_template.render()
            if 'base64decode' in self.output_config and self.output_config[
                    'base64decode']:
                contents = base64.decodebytes(contents.encode('ascii'))

            blob = bucket.blob(destination_object)
            blob.upload_from_string(contents)

            self.logger.info('Object created in Cloud Storage bucket.',
                             extra={
                                 'url':
                                     'gs://%s/%s' %
                                     (destination_bucket, destination_object),
                                 'size':
                                     len(contents)
                             })
