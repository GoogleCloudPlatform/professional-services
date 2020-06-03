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
from argparse import ArgumentTypeError

import apache_beam as beam
from apache_beam.transforms.window import Sessions
from apache_beam.io import ReadFromPubSub
from apache_beam.io import WriteToPubSub
from apache_beam.options.pipeline_options import StandardOptions
from apache_beam.options.pipeline_options import PipelineOptions
# NOTE: In the latest versions of Beam for Python there are several issues
# with saving the main session that cause bugs in dataflow, so instead of
# requiring at the top of the file, we do so inside the DoFns and PTransforms
# See: BEAM-10150

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
       | 'Buffer before DLP API' >> beam.ParDo(StatefulBufferingFn())
       | 'Get DLP Findings' >> beam.ParDo(DlpFindingDoFn(opts.firestore_project, std_opts.runner))
       | 'Determine if client SSN' >> beam.ParDo(ExistingSSNsDoFn(
          opts.firestore_project, opts.salt, opts.secret_name, opts.collection_name, std_opts.runner))
       | 'Apply windowing' >> beam.WindowInto(Sessions(10))
       | 'Group by Filename' >> beam.CombinePerKey(HashCombineFn()).with_hot_key_fanout(1000)
       | 'Format Message' >> beam.Map(fmt)
       | 'print' >> beam.Map(print))
       #| 'Write to Pubsub' >> WriteToPubSub(opts.output_topic))

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
    from base64 import b64decode
    os.environ["GCLOUD_PROJECT"] = self.project
    self.db = firestore.Client()
    sm = secretmanager.SecretManagerServiceClient()
    version = sm.access_secret_version('{}/versions/latest'.format(self.secret_name))
    self.key = b64decode(version.payload.data)

  def process(self, element):
    import hmac
    # TODO: Remove when version 2.22.0 is released BEAM-7885
    if self.runner == 'DirectRunner':
      self.setup()
    
    filename, ssn = element
    
    norm_ssn = ssn.replace('-', '')
    salt = self.salt.encode('utf-8')
    mac = hmac.new(self.key, msg=salt, digestmod='sha256')
    mac.update(norm_ssn.encode('utf-8'))
    digest = mac.hexdigest()
 
    col = self.db.collection(self.collection_name)
    doc = col.document(digest).get()

    if doc.exists:
      yield (filename, digest)

class StatefulBufferingFn(beam.DoFn):
  from apache_beam.transforms.userstate import BagStateSpec, TimerSpec, CombiningValueStateSpec, on_timer
  from apache_beam.transforms.core import CombineValues
  from apache_beam.transforms.timeutil import TimeDomain
  from apache_beam.coders import VarIntCoder, TupleCoder, StrUtf8Coder
  from apache_beam.transforms.combiners import CountCombineFn

  MAX_BUFFER_SIZE = 500 # 500 lines
  BUFFER_STATE = BagStateSpec('buffer', TupleCoder((StrUtf8Coder(), StrUtf8Coder())))
  COUNT_STATE = CombiningValueStateSpec('count', VarIntCoder(), CountCombineFn())
  EXPIRY_TIMER = TimerSpec('expiry', TimeDomain.WATERMARK)
  STALE_TIMER = TimerSpec('stale', TimeDomain.REAL_TIME)
  MAX_BUFFER_DURATION = 1
  ALLOWED_LATENESS = 5

  class PayloadConstructor():
    MAX_BYTE_SIZE_PER_REQUEST = 400000 # 0.4MB giving 100KB for metadata

    def __init__(self, filename, max_size = MAX_BYTE_SIZE_PER_REQUEST):
        self.all = []
        self.current = ""
        self.filename = filename
        self.max_size = max_size
    
    # NOTE: This does not handle the case where a single line is longer than max_size   
    def concat(self, data):
      if len(self.current) + len(data) > self.max_size:
        self.all.append(self.current)
        self.current = ""
      else:
        self.current += data

    def flatten(self):
      self.all.append(self.current)
      return [(self.filename, payload) for payload in self.all]

  def construct_payloads(self, events):
    payloads = {}
    for filename, line in events:
      if filename not in payloads:
        payloads[filename] = StatefulBufferingFn.PayloadConstructor(filename)
      p = payloads[filename]
      p.concat(line)
    return [tup for tup in p.flatten() for p in payloads.items()]
    
      
  def process(self, element,
    w=beam.DoFn.WindowParam,
    buffer_state=beam.DoFn.StateParam(BUFFER_STATE),
    count_state=beam.DoFn.StateParam(COUNT_STATE),
    expiry_timer=beam.DoFn.TimerParam(EXPIRY_TIMER),
    stale_timer=beam.DoFn.TimerParam(STALE_TIMER)) :
    import time
    if count_state.read() == 0:
      stale_timer.set(time.time() + StatefulBufferingFn.MAX_BUFFER_DURATION)

    expiry_timer.set(w.end + StatefulBufferingFn.ALLOWED_LATENESS)
    buffer_state.add(element)
    count_state.add(1)
    count = count_state.read()

    if count >= StatefulBufferingFn.MAX_BUFFER_SIZE:
      events = buffer_state.read()
      for filename, payload in self.construct_payloads(events):
        yield (filename, payload)
      count_state.clear()
      buffer_state.clear()

  @on_timer(EXPIRY_TIMER)
  def expiry(self, buffer_state=beam.DoFn.StateParam(BUFFER_STATE), count_state=beam.DoFn.StateParam(COUNT_STATE)):
    events = buffer_state.read()

    for filename, payload in self.construct_payloads(events):
      yield (filename, payload)

    buffer_state.clear()
    count_state.clear()

  @on_timer(STALE_TIMER)
  def stale(self,buffer_state=beam.DoFn.StateParam(BUFFER_STATE), count_state=beam.DoFn.StateParam(COUNT_STATE)):
    events = buffer_state.read()

    for filename, payload in self.construct_payloads(events):
      yield (filename, payload)

    buffer_state.clear()
    count_state.clear()

class ReadAllFromTextWithFilename(beam.io.ReadAllFromText):
  from apache_beam.coders import StrUtf8Coder
  from apache_beam.io.filesystem import CompressionTypes

  def __init__(self,
    min_bundle_size=0,
    desired_bundle_size=beam.io.ReadAllFromText.DEFAULT_DESIRED_BUNDLE_SIZE,
    compression_type=CompressionTypes.AUTO,
    strip_trailing_newlines=False,
    coder=StrUtf8Coder(),  # type: coders.Coder
    skip_header_lines=0,
    **kwargs):
      import functools
      from apache_beam.io.textio import ReadAllFiles
      
      super(ReadAllFromTextWithFilename,self).__init__(min_bundle_size,desired_bundle_size,compression_type
        ,strip_trailing_newlines,coder,skip_header_lines,**kwargs)
      source_from_file = functools.partial(
        self.create_text_source_with_filename, min_bundle_size=min_bundle_size,
        compression_type=compression_type,
        strip_trailing_newlines=strip_trailing_newlines, coder=coder,
        skip_header_lines=skip_header_lines)
      self._read_all_files = ReadAllFiles(
      True, compression_type, desired_bundle_size, min_bundle_size,
      source_from_file) 
  
  def create_text_source_with_filename(self,
      file_pattern=None, min_bundle_size=None, compression_type=None,
      strip_trailing_newlines=None, coder=None, skip_header_lines=None):
        from apache_beam.io.textio import _TextSourceWithFilename
        return _TextSourceWithFilename(
            file_pattern=file_pattern, min_bundle_size=min_bundle_size,
            compression_type=compression_type,
            strip_trailing_newlines=strip_trailing_newlines,
            coder=coder, validate=False, skip_header_lines=skip_header_lines)

if __name__ == '__main__':
  logging.getLogger().setLevel(logging.INFO)
  run(sys.argv[1:])
