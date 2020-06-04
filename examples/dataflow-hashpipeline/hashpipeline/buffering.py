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
from apache_beam.transforms.userstate import BagStateSpec, TimerSpec, CombiningValueStateSpec, on_timer
from apache_beam.transforms.timeutil import TimeDomain
from apache_beam.coders import VarIntCoder, TupleCoder, StrUtf8Coder
from apache_beam.transforms.combiners import CountCombineFn
import apache_beam as beam
import time
from abc import ABC, abstractmethod
from collections import defaultdict

class BufferedPayloadFactory(ABC):
  def __init__(self, max_size):
    self.payloads = []
    self.max_size = max_size

  @abstractmethod
  def running_payload(self):
    '''Returns a singleton instance of the current payload'''
    raise NotImplementedError
  
  def get_payloads(self):
    '''Adds current payload to payloads list and flattens'''
    self.payloads.append(self.running_payload())
    return self.payloads
  
  @abstractmethod
  def extend_running_payload(self, data):
    '''Extends the current_singleton object until extending it further would pass max_size'''
    raise NotImplementedError

class FileLineBufferedPayloadFactory(BufferedPayloadFactory):
  '''Payload factory for buffering lines in a file before sending batch requests to DLP'''
  MAX_BYTE_SIZE_PER_REQUEST = 400000 # 0.4MB giving 100KB for metadata

  def __init__(self, max_size = MAX_BYTE_SIZE_PER_REQUEST):
    super(FileLineBufferedPayloadFactory, self).__init__(max_size)
    self._current = ""
  
  def running_payload(self):
    return self._current
  
  # NOTE: This does not handle the case where a single line is longer than max_size
  def extend_running_payload(self, data):
    if len(self._current) + len(data) > self.max_size:
      self.payloads.append(self._current)
      self._current = ""
    else:
      self._current += data

class ListBufferedPayloadFactory(BufferedPayloadFactory):
  '''Payload factory for buffering SSN hash digests to batch get from Firestore'''
  MAX_KEYS_PER_REQUEST = 1000

  def __init__(self, max_size = MAX_KEYS_PER_REQUEST):
    super(ListBufferedPayloadFactory, self).__init__(max_size)
    self._current = []
  
  def running_payload(self):
    return self._current
  
  def extend_running_payload(self, data):
    if len(self._current) == self.max_size:
      self.payloads.append(self._current)
      self._current = []
    else:
      self._current.append(data)


class StatefulBufferingFn(beam.DoFn):
  MAX_BUFFER_SIZE = 1000
  BUFFER_STATE = BagStateSpec('buffer', TupleCoder((StrUtf8Coder(), StrUtf8Coder())))
  COUNT_STATE = CombiningValueStateSpec('count', VarIntCoder(), CountCombineFn())
  STALE_TIMER = TimerSpec('stale', TimeDomain.REAL_TIME)
  MAX_BUFFER_DURATION = 10
  
  def __init__(self, payload_factory):
    self.payload_factory = payload_factory
 
  def process(self, element,
    buffer_state=beam.DoFn.StateParam(BUFFER_STATE),
    count_state=beam.DoFn.StateParam(COUNT_STATE),
    stale_timer=beam.DoFn.TimerParam(STALE_TIMER)):
    if count_state.read() == 0:
      stale_timer.set(time.time() + StatefulBufferingFn.MAX_BUFFER_DURATION)

    buffer_state.add(element)
    count_state.add(1)
    count = count_state.read()

    if count >= StatefulBufferingFn.MAX_BUFFER_SIZE:
      return self.flush(buffer_state, count_state)

  def construct_payloads(self, events):
    payload_buffers = defaultdict(self.payload_factory)
    for filename, elem in events:
      payload_buffers[filename].extend_running_payload(elem)
    return [(k, v.get_payloads()) for k, v in payload_buffers.items()]

  @on_timer(STALE_TIMER)
  def flush(self, buffer_state=beam.DoFn.StateParam(BUFFER_STATE), count_state=beam.DoFn.StateParam(COUNT_STATE)):
    events = buffer_state.read()

    buffer_state.clear()
    count_state.clear()
    for filename, payloads in self.construct_payloads(events):
      for payload in payloads:
        yield (filename, payload)

