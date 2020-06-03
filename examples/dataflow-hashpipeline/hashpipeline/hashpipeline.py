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
import sys
import json
import re
import os
import hmac
from argparse import ArgumentTypeError
from google.cloud.dlp import DlpServiceClient
from google.cloud import secretmanager
from base64 import b64decode
from google.cloud import firestore

import apache_beam as beam
from apache_beam.transforms.window import Sessions
from apache_beam.io import ReadFromPubSub
from apache_beam.io import WriteToPubSub
from apache_beam.options.pipeline_options import StandardOptions
from apache_beam.options.pipeline_options import PipelineOptions

from hashpipeline.buffering import StatefulBufferingFn, FilePayloadFactory, ListPayloadFactory
from hashpipeline.filelines import ReadAllFromTextWithFilename

SSN_INSPECT_CONFIG = {
  'info_types'    : [{'name': 'US_SOCIAL_SECURITY_NUMBER'}],
  'min_likelihood': 'VERY_UNLIKELY',
  'include_quote' : True # We need the output to match against the KV Store
}

def run(argv):
  """Main entry point; defines and runs the pipeline."""
  opts = HashPipelineOptions()
  std_opts = opts.view_as(StandardOptions)
  std_opts.streaming = True 

  def counts_by_hash(iterable, *args, **kwargs):
    result = {}
    for h in iterable:
      if h in result:
        result[h] +=1
      else:
        result[h] = 1
    return json.dumps(result)

  def fmt(elem):
    filename, counts = elem
    obj = {'filename': filename, 'ssn_counts': counts}
    return json.dumps(obj).encode('utf-8')

  with beam.Pipeline(options=opts) as p:
    (p | 'Read filename from Pubsub' >> ReadFromPubSub(None, opts.input_subscription)
       | 'Decode from UTF-8' >> beam.Map(lambda elem: elem.decode('utf-8'))
       | 'Read filename and lines from file' >> ReadAllFromTextWithFilename()
       | 'Buffer before DLP API' >> beam.ParDo(StatefulBufferingFn(FilePayloadFactory))
       | 'Get DLP Findings' >> beam.ParDo(DlpFindingDoFn(opts.firestore_project, std_opts.runner))
       | 'Hash DLP Findings' >> beam.ParDo(HashQuotesDoFn(opts.salt, opts.secret_name, std_opts.runner))
       | 'Buffer Firestore Request' >> beam.ParDo(StatefulBufferingFn(ListPayloadFactory))
       | 'Determine if client SSN' >> beam.ParDo(ExistingSSNsDoFn(opts.firestore_project, opts.collection_name, std_opts.runner))
       | 'Apply windowing' >> beam.WindowInto(Sessions(10))
       | 'Group by Filename' >> beam.CombinePerKey(HashCombineFn()).with_hot_key_fanout(1000)
       | 'Format Message' >> beam.Map(fmt)
       | 'Write to Pubsub' >> WriteToPubSub(opts.output_topic))

class HashPipelineOptions(PipelineOptions):
  @classmethod
  def _add_argparse_args(cls, parser):
    parser.add_argument('--input_subscription',
      help='Fully qualified input Pubsub subscription that forwards raw events from GCS. i.e. projects/*/subscriptions/*')
    parser.add_argument('--output_topic',
      help='Fully qualified output Pubsub topic name. i.e. projects/*/topics/*')
    parser.add_argument('--secret_name', type=cls.valid_secret,
      help='Fully qualified name of the Secret Maneger secret where the base64 encoded hash key is stored. i.e. projects/*/secrets/*"')
    parser.add_argument('--firestore_project',
      help='Project Id where Firestore database is located and where DLP will be executed.')
    parser.add_argument('--collection_name',
      help='Name of the Firestore collection where hashed SSNs are stored')
    parser.add_argument('--salt',
      help='Random string for salting hashes.')

  @classmethod
  def valid_secret(cls, secret):
    if not re.match(r'^projects\/.+?\/secrets/.+?$', secret):
      raise ArgumentTypeError("Secret Name must be of format: projects/<PROJECT>/secrets/<SECRET_NAME>")
    return secret

class HashCombineFn(beam.CombineFn):
  def create_accumulator(self, *args, **kwargs):
    return {}
  def add_input(self, accumulator, elem, *args, **kwargs):
    if elem in accumulator:
      accumulator[elem] +=1
    else:
      accumulator[elem] = 1
    return accumulator
  def merge_accumulators(self, accumulators, *args, **kwargs):
    merged = {}
    for acc in accumulators:
      for key in acc:
        if key in merged:
          merged[key] += acc[key]
        else:
          merged[key] = acc[key]
    return merged
  
  def extract_output(self, accumulator, *args, **kwargs):
    # We must set a limit on how many findings to emit before
    # just emitting the count since pubsub has a limit of 10MB
    # If there was a single SSN on each line, the max JSON payload
    # would be ~140K unique keys, so to give a buffer, we'll
    # cap the unique SSNs at 100K before just emitting a total count.
    # This is a worst case and if you are expecting these type of
    # results, consider modifying this pipeline to output
    # to a BigQuery table instead.
    if len(accumulator.keys()) > 10**5:
      return {'total': sum(accumulator.values())}
    return accumulator

class DlpFindingDoFn(beam.DoFn):
  """Fetch DLP Findings as a PCollection"""
  def __init__(self, project, runner):
    beam.DoFn.__init__(self)
    self.project = project
    self.runner = runner
  
  def setup(self):
    self.dlp_client = DlpServiceClient()

  def process(self, element):
    # TODO: Remove when version 2.22.0 is released BEAM-7885
    if self.runner == 'DirectRunner':
      self.setup()
    # Convert the project id into a full resource id.
    parent = self.dlp_client.project_path(self.project)
    filename, chunk = element
    # Call the API.
    response = self.dlp_client.inspect_content(parent, SSN_INSPECT_CONFIG, {'value': chunk})

    if response.result.findings:
      for f in response.result.findings:
        yield (filename, f.quote)

class HashQuotesDoFn(beam.DoFn):
  def __init__(self, salt, secret_name, runner):
    beam.DoFn.__init__(self)
    self.salt = salt
    self.secret_name = secret_name
    self.runner = runner

  def setup(self): 
    sm = secretmanager.SecretManagerServiceClient()
    version = sm.access_secret_version('{}/versions/latest'.format(self.secret_name))
    self.key = b64decode(version.payload.data)

  def process(self, element):
    # TODO: Remove when version 2.22.0 is released BEAM-7885
    if self.runner == 'DirectRunner':
      self.setup()
    filename, ssn = element
    
    norm_ssn = ssn.replace('-', '')
    salt = self.salt.encode('utf-8')
    mac = hmac.new(self.key, msg=salt, digestmod='sha256')
    mac.update(norm_ssn.encode('utf-8'))
    digest = mac.hexdigest()
    yield (filename, digest)


class ExistingSSNsDoFn(beam.DoFn):
  """Attempt to submit the finding to Firestore to see if the SSN exists"""
  def __init__(self, project, collection_name, runner):
    beam.DoFn.__init__(self)
    self.project = project
    self.collection_name = collection_name
    self.runner = runner

  def setup(self): 
    os.environ["GCLOUD_PROJECT"] = self.project
    self.db = firestore.Client()
    
  def process(self, element):
    # TODO: Remove when version 2.22.0 is released BEAM-7885
    if self.runner == 'DirectRunner':
      self.setup()
    
    filename, digest_list = element
    col = self.db.collection(self.collection_name)
    refs = [col.document(digest) for digest in digest_list]
    for doc in self.db.get_all(refs):
      if doc.exists:
        yield (filename, doc.reference.path)
