# Copyright 2022 Google LLC
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
import glob

INLINING_REGEX = re.compile(
    r'(INLINE\(\"([^"]+)\"\)\n)(\s+)(.+)(#ENDINLINE)',
    re.DOTALL)

def inliner(match):
    header = match.group(1)
    filename = match.group(2)
    indent = match.group(3)
    contents = match.group(4)
    footer = match.group(5)

    with open(filename, "r") as f:
        body = f.read()
        contents = ''.join(indent + line for line in body.splitlines(True))

    return header + contents + indent + footer

def build_file(filename):
    print("Inlining {}".format(filename))
    with open(filename, 'r+') as f:
        contents = f.read()
        final = re.sub(INLINING_REGEX, inliner, contents)
        f.seek(0)
        f.write(final)
        f.truncate()

def build_yaml_files():
    for filename in glob.glob("policies/templates/*.yaml"):
        build_file(filename)

build_yaml_files()
