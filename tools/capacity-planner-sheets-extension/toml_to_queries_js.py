# Copyright 2023 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#        http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
# Use this script to update "queries.js" after updates to the TOML source
# https://github.com/GoogleCloudPlatform/professional-services/blob/main/tools/capacity-planner-cli/queries.toml
#
# Usage:
#   python3 toml_to_queries_js.py
#
# NOTE: This code requires Python version >= 3.11 for tomllib
# https://docs.python.org/3/library/tomllib.html).

from collections import OrderedDict
from pathlib import Path
import json
import re
import tomllib

TOML_FILE_PATH = Path("../capacity-planner-cli/queries.toml")
QUERIES_JS_PATH = Path("queries.js")

FILE_HEADER = """/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 * This file stores the queries for the Google Cloud Monitoring API.
 * 
 * NOTE: Apps Script only allows HTML or .gs files so there is no simple way to include a TOML or JSON file here.
 * Queries are originally from the queries.toml file below. Use toml_to_queries_js.py to automatically
 * update this file.
 * https://github.com/GoogleCloudPlatform/professional-services/blob/main/tools/capacity-planner-cli/queries.toml
*/"""

with open(TOML_FILE_PATH, "rb") as f:
    queries = tomllib.load(f)

# Modify the structure so all metrics are nested under a key "metrics"
# instead of at the same level as "product_name"
queries_js = OrderedDict()
for product, product_data in sorted(queries.items()):
    queries_js[product] = {"product_name": product_data["product_name"]}

    metrics = OrderedDict()
    for metric_name in sorted(product_data.keys()):
        if metric_name != "product_name":
            metrics[metric_name] = product_data[metric_name]
            # Remove extra whitespace in the query
            metrics[metric_name]["query"] = re.sub(
                "\s{2,}", " ", metrics[metric_name]["query"])
    queries_js[product]["metrics"] = metrics

with open(QUERIES_JS_PATH, "w") as f:
    f.write(FILE_HEADER)
    f.write(f"\n\nconst QUERIES = {json.dumps(queries_js, indent=2)}")
