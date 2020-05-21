# Copyright 2020 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#



# pytype: skip-file

from __future__ import absolute_import

import logging
import os
import sys

from google.cloud.dlp import DlpServiceClient
from google.cloud import firestore
from google.cloud import secretmanager
from google.cloud import pubsub
from base64 import b64decode
from hashlib import blake2b

import apache_beam as beam
from apache_beam.io import ReadFromText
from apache_beam.options.pipeline_options import SetupOptions
from apache_beam.options.pipeline_options import PipelineOptions

class MyOptions(PipelineOptions):
  @classmethod
  def _add_argparse_args(cls, parser):
    parser.add_value_provider_argument('--input',
      help='Input GCS bucket url')
    parser.add_value_provider_argument('--secret_name',
      help='Fully qualified name of the base64 encoded Hash key including project')
    parser.add_value_provider_argument('--project_id',
      help='Project where the Firstore, Secret and Topic live')
    parser.add_value_provider_argument('--collection_name',
      help='Name of the Firestore collection where hashed SSNs are stored')
    parser.add_value_provider_argument('--salt',
      help='Random string for salting hashes. Max 16 Bytes for BLAKE2b')
    parser.add_value_provider_argument('--topic',
      help='Output Pubsub topic')


def run(argv):
  """Main entry point; defines and runs the wordcount pipeline."""
  opts = PipelineOptions()
  opts.view_as(SetupOptions).save_main_session = True
  o = opts.view_as(MyOptions)

  with beam.Pipeline(options=opts) as p:
    # Read the text file[pattern] into a PCollection.
    (p | 'read' >> ReadFromText(o.input)
        | 'Get DLP Findings' >> beam.ParDo(DlpFindingDoFn(o.project_id))
        | 'Determine if client SSN' >> beam.ParDo(ExistingSSNsDoFn(o.project_id, o.salt, o.secret_name, o.collection_name))
        | 'Count findings' >> beam.combiners.Count.Globally()
        | 'Write to Pubsub' >> beam.ParDo(WriteToPubsub(o.project_id, o.topic, o.input)))


class DlpFindingDoFn(beam.DoFn):
  """Fetch DLP Findings as a PCollection"""
  def __init__(self, project):
    beam.DoFn.__init__(self)
    self.project = project
    self.inspect_config = {
      'info_types'    : [{'name': 'US_SOCIAL_SECURITY_NUMBER'}],
      'min_likelihood': 'VERY_UNLIKELY',
      'include_quote' : True # We need the output to match against the KV Store
    }

  def setup(self):
    self.dlp_client = DlpServiceClient()

  def process(self, element):
    # Convert the project id into a full resource id.
    parent = self.dlp_client.project_path(self.project.get())

    # Call the API.
    response = self.dlp_client.inspect_content(parent, self.inspect_config, {'value': element})

    if response.result.findings:
      for f in response.result.findings:
        yield f.quote

class ExistingSSNsDoFn(beam.DoFn):
  """Attempt to submit the finding to Firestore to see if the SSN exists"""
  def __init__(self, project, salt, secret_name, collection_name):
    beam.DoFn.__init__(self)
    self.project = project
    self.salt = salt
    self.secret_name = secret_name
    self.collection_name = collection_name

  def setup(self):
    logging.info(f'Collection Name {self.collection_name.get()}')
    os.environ["GCLOUD_PROJECT"] = self.project.get()
    self.db = firestore.Client()
    self.sm = secretmanager.SecretManagerServiceClient()

  def process(self, element):
    version = self.sm.access_secret_version(f'{self.secret_name.get()}/versions/latest')
    key = b64decode(version.payload.data)

    ssn = element.replace('-', '').encode('utf-8')
    digest = blake2b(ssn, digest_size=16, salt=self.salt.get().encode('utf-8'), key=key).hexdigest()

    col = self.db.collection(self.collection_name.get())
    doc = col.document(digest)
    if doc.get().exists:
      logging.info(f"Found SSN in Firestore: {element}")
      yield (element, digest)

# NOTE: Currently the beam.io.WriteStringsToPubsub function is only supported
# in streaming mode
class WriteToPubsub(beam.DoFn):
  def __init__(self, project, topic, infile):
    self.project = project
    self.topic = topic
    self.infile = infile

  def setup(self):
    self.publisher = pubsub.PublisherClient()

  def process(self, element):
    msg = f'Found {element} SSNs in {self.infile.get()}'.encode('utf-8')
    topic_path = self.publisher.topic_path(self.project.get(), self.topic.get())
    self.publisher.publish(topic_path, msg)
    yield "Success!"

if __name__ == '__main__':
  logging.getLogger().setLevel(logging.INFO)
  run(sys.argv[1:])
