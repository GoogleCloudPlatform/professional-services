#  Copyright 2020 Google LLC.
#  This software is provided as-is, without warranty or representation for any use or purpose.
#  Your use of it is subject to your agreement with Google.

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