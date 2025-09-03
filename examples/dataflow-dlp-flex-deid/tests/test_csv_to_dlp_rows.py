# Copyright 2025 Google LLC
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

import importlib.util
import pathlib

# Load main.py without installing as a module
_spec = importlib.util.spec_from_file_location(
    "example_main", pathlib.Path(__file__).resolve().parents[1] / "main.py"
)
_main = importlib.util.module_from_spec(_spec)
assert _spec.loader is not None
_spec.loader.exec_module(_main)  # type: ignore

def test_build_table_schema():
    headers = ["name", "email", "phone"]
    schema = _main.build_table_schema(headers)
    assert "fields" in schema
    assert [f["name"] for f in schema["fields"]] == headers
    assert all(f["type"] == "STRING" for f in schema["fields"])

def test_parse_headers_from_csv_line():
    headers = _main.parse_headers_from_csv_line("a,b,c\n")
    assert headers == ["a","b","c"]
