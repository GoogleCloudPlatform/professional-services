# Copyright 2023 Google LLC
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
import re


def validate_comma_separated_string(input_string):
    # Define a regular expression pattern for valid format
    pattern = r"^\s*\w+\s*(,\s*\w+\s*)*$"

    # Use re.match() to check if the string matches the pattern
    if re.match(pattern, input_string):
        print(
            f"Successfully validated input_string {input_string} follows comma separated regex"
        )
        return True
    else:
        print(
            f"Validation failed for input_string {input_string} to follow comma separated regex"
        )
        return False
