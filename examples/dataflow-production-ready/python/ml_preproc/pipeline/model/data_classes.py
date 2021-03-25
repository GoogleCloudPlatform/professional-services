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

from collections import namedtuple
from typing import Iterable

# to use it to filter out the header of the CSV file.
HEADER = 'source_address;source_city;target_address;target_city'

# Here we return field names that are not duplicated and can be used with a named tuple.
def _input_fields(header: str, sep: str = ";"):
  return header.split(sep)


# Because writing a data class is boring, named tuples just make it much easier
Record = namedtuple('Record', _input_fields(HEADER))


def line2record(line: str, sep: str = ";") -> Iterable[Record]:
  """ Transform a line of data into a Record.

  Args:
      line: A line from the CSV data file
      sep: The separator used in the line. Default is ;

  Returns:
      object:
      A Record object
  """
  elements = line.split(sep)
  return Record(*elements)