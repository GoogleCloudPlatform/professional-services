#!/usr/bin/env python3

# Copyright 2018 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
'''
Alphabetically sort lists from input file
'''

import re
import sys

markdown_list_regex = re.compile(r'(\* (.+)\n)+', flags=re.MULTILINE)

def sort_list(matches):
    list_text = matches.group(0)
    sorted_list = sorted(list_text.splitlines())
    return '\n'.join(sorted_list) + '\n'

filename = sys.argv[1]

with open(filename, "r+") as fp:
    contents = fp.read()
    sorted_contents = re.sub(markdown_list_regex, sort_list, contents)
    fp.seek(0)
    fp.write(sorted_contents)
    fp.truncate()
