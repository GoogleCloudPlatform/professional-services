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
from argparse import ArgumentTypeError

import apache_beam as beam
from apache_beam.transforms.window import FixedWindows
from apache_beam.io import ReadFromPubSub
from apache_beam.io import WriteToPubSub
from apache_beam.options.pipeline_options import StandardOptions
from apache_beam.options.pipeline_options import PipelineOptions

# NOTE: In the latest versions of Beam for Python there are several issues
# wth saving the main session that cause bugs in dataflow, so instead of
# requiring at the top of the file, we do so inside the DoFns and PTransforms
# See: BEAM-10150 for more

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
    parts = secret.split('/')
    if len(parts) != 4 or parts[0] != 'projects' or parts[2] != 'secrets':
      raise ArgumentTypeError("Secret Name must be of format: projects/<PROJECT>/secrets/<SECRET_NAME>")
    return secret

def run(argv):
  """Main entry point; defines and runs the pipeline."""
  opts = HashPipelineOptions()
  std_opts = opts.view_as(StandardOptions)
  std_opts.streaming = True 

  def fmt(elem):
    filename, counts = elem
    obj = {'filename': filename, 'ssn_counts': counts}
    return json.dumps(obj).encode('utf-8')

  with beam.Pipeline(options=opts) as p:
    (p | 'Read filename from Pubsub' >> ReadFromPubSub(None, opts.input_subscription)
       | 'Decode from UTF-8' >> beam.Map(lambda elem: elem.decode('utf-8'))
       | 'Read filename and lines from file' >> ReadAllFromTextWithFilename()
       | 'Get DLP Findings' >> beam.ParDo(DlpFindingDoFn(opts.firestore_project, std_opts.runner))
       | 'Determine if client SSN' >> beam.ParDo(ExistingSSNsDoFn(
          opts.firestore_project, opts.salt, opts.secret_name, opts.collection_name, std_opts.runner))
       | 'Apply windowing' >> beam.WindowInto(FixedWindows(5))
       | 'Group by Filename' >> beam.GroupByKey()
       | 'Count SSNs by Filename' >> beam.Map(lambda elem : (elem[0], sum(elem[1])))
       | 'Format Message' >> beam.Map(fmt)
       | 'Write to Pubsub' >> WriteToPubSub(opts.output_topic))

class DlpFindingDoFn(beam.DoFn):
  """Fetch DLP Findings as a PCollection"""
  def __init__(self, project, runner):
    beam.DoFn.__init__(self)
    self.project = project
    self.runner = runner
    self.inspect_config = {
      'info_types'    : [{'name': 'US_SOCIAL_SECURITY_NUMBER'}],
      'min_likelihood': 'VERY_UNLIKELY',
      'include_quote' : True # We need the output to match against the KV Store
    }

  def setup(self):
    from google.cloud.dlp import DlpServiceClient
    self.dlp_client = DlpServiceClient()

  def process(self, element):
    # TODO: Remove when version 2.22.0 is released BEAM-7885
    if self.runner == 'DirectRunner':
      self.setup()
    # Convert the project id into a full resource id.
    parent = self.dlp_client.project_path(self.project)
    filename, chunk = element
    # Call the API.
    response = self.dlp_client.inspect_content(parent, self.inspect_config, {'value': chunk})

    if response.result.findings:
      for f in response.result.findings:
        yield (filename, f.quote)

class ExistingSSNsDoFn(beam.DoFn):
  """Attempt to submit the finding to Firestore to see if the SSN exists"""
  def __init__(self, project, salt, secret_name, collection_name, runner):
    beam.DoFn.__init__(self)
    self.project = project
    self.salt = salt
    self.secret_name = secret_name
    self.collection_name = collection_name
    self.runner = runner

  def setup(self): 
    import os
    from google.cloud import firestore
    from google.cloud import secretmanager
    os.environ["GCLOUD_PROJECT"] = self.project
    self.db = firestore.Client()
    self.sm = secretmanager.SecretManagerServiceClient()

  def process(self, element):
    from base64 import b64decode
    import hmac
    # TODO: Remove when version 2.22.0 is released BEAM-7885
    if self.runner == 'DirectRunner':
      self.setup()
    
    filename, ssn = element
    version = self.sm.access_secret_version('{}/versions/latest'.format(self.secret_name))
    key = b64decode(version.payload.data)
    
    norm_ssn = ssn.replace('-', '')
    salt = self.salt.encode('utf-8')
    mac = hmac.new(key, msg=salt, digestmod='sha256')
    mac.update(norm_ssn.encode('utf-8'))
    digest = mac.hexdigest()
 
    col = self.db.collection(self.collection_name)
    doc = col.document(digest).get()

    if doc.exists:
      yield (filename, 1)

# XXX: This is a hacky fix for lack of support for ReadAllFromTextWithFilename
# which is being tracked at BEAM-10061. The following two classes re-implement
# filebasedsource._ReadRange and ReadAllFromText to allow us to keep track of
# the filename through the transforms.
class ReadRange(beam.DoFn):
  def __init__(self, source_from_file):
    self._source_from_file = source_from_file

  def process(self, element):
    metadata, range = element
    source = self._source_from_file(metadata.path)
    # Following split() operation has to be performed to create a proper
    # _SingleFileSource. Otherwise what we have is a ConcatSource that contains
    # a single _SingleFileSource. ConcatSource.read() expects a RangeTraker for
    # sub-source range and reads full sub-sources (not byte ranges).
    source = list(source.split(float('inf')))[0].source
    for record in source.read(range.new_tracker()):
      yield (metadata.path, record)

# NOTE: This basically re-implements ReadAllFromText but allows tracking of filename
class ReadAllFromTextWithFilename(beam.PTransform):
  DEFAULT_DESIRED_BUNDLE_SIZE = 64 * 1024 * 1024  # 64MB
  from apache_beam.coders import coders
  from apache_beam.io.filesystem import CompressionTypes

  def __init__(self, min_bundle_size=0, desired_bundle_size=DEFAULT_DESIRED_BUNDLE_SIZE,
      compression_type=CompressionTypes.AUTO, strip_trailing_newlines=True,
      coder=coders.StrUtf8Coder(), skip_header_lines=0, **kwargs):
      
      from functools import partial
      from apache_beam.io.textio import _create_text_source
      super(ReadAllFromTextWithFilename, self).__init__(**kwargs)
      self.source_from_file = partial(
          _create_text_source,
          min_bundle_size=min_bundle_size,
          compression_type=compression_type,
          strip_trailing_newlines=strip_trailing_newlines,
          coder=coder,
          skip_header_lines=skip_header_lines)
      self.desired_bundle_size = desired_bundle_size
      self.min_bundle_size = min_bundle_size
      self.compression_type = compression_type
      self.strip_trailing_newlines = strip_trailing_newlines

  def expand(self, pvalue):
    from apache_beam.io.filebasedsource import _ExpandIntoRanges
    from apache_beam.transforms.util import Reshuffle
    return (
        pvalue
        | 'ExpandIntoRanges' >> beam.ParDo(
            _ExpandIntoRanges(self.strip_trailing_newlines,
              self.compression_type,
              self.desired_bundle_size,
              self.min_bundle_size))
        | 'Reshard' >> Reshuffle()
        | 'ReadRange' >> beam.ParDo(ReadRange(self.source_from_file)))

if __name__ == '__main__':
  logging.getLogger().setLevel(logging.INFO)
  run(sys.argv[1:])
