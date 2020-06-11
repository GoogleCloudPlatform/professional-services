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

MARKDOWN_LIST_REGEX = re.compile(r'(\* (.+)\n)+', flags=re.MULTILINE)


def sort_list(matches):
    '''Returns the sorted version of a list'''
    list_text = matches.group(0)
    sorted_list = sorted(list_text.splitlines(), key=lambda v: v.upper())
    return '\n'.join(sorted_list) + '\n'


def main():
    '''Entrypoint for command-line script'''
    filename = sys.argv[1]

    with open(filename, "r+") as f:
        contents = f.read()
        sorted_contents = re.sub(MARKDOWN_LIST_REGEX, sort_list, contents)
        f.seek(0)
        f.write(sorted_contents)
        f.truncate()


main()
