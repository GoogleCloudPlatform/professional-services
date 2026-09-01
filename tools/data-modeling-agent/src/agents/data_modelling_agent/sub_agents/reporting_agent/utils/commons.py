# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


def cleanup_metadata(metadata):
    metadata_lines = metadata.split("\n")
    cleaned_metadata_lines = []
    for line in metadata_lines:
        if "```"in line:
            continue
        cleaned_metadata_lines.append(line.strip())
    cleaned_metadata = "\n".join(cleaned_metadata_lines)
    return cleaned_metadata