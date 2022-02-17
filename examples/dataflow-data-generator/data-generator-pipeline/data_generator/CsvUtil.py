# Copyright 2019 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import io
import csv
from contextlib import closing


def dict_to_csv(input_dict, output_order=[]):
    """
    This funciton converts a python dictionary to a
    CSV line.
    Note keys in output schema that are missing in the
    dictionary or that contains commas will result in
    empty values.

    Arguments:
        dictionary: (dict) A dictionary containing the data of interest.
        output_order: (list of strings) The order of field names to write to CSV.
    """
    with closing(io.StringIO()) as csv_string:
        writer = csv.DictWriter(csv_string, output_order)
        writer.writerow(input_dict)
        # Our desired output is a csv string not a line in a file so we strip the
        # newline character written by the writerow function by default.
        return csv_string.getvalue().strip()
