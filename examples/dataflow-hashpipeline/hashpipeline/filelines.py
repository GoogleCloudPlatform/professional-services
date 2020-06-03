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

import functools
from apache_beam.io.textio import ReadAllFiles, ReadAllFromText
from apache_beam.coders import StrUtf8Coder
from apache_beam.io.filesystem import CompressionTypes

class ReadAllFromTextWithFilename(ReadAllFromText):
  '''Reads a file but emits a tuple of (filename, line_in_file)'''
  def __init__(self,
    min_bundle_size=0,
    desired_bundle_size=ReadAllFromText.DEFAULT_DESIRED_BUNDLE_SIZE,
    compression_type=CompressionTypes.AUTO,
    strip_trailing_newlines=False,
    coder=StrUtf8Coder(),  # type: coders.Coder
    skip_header_lines=0,
    **kwargs):
      
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
