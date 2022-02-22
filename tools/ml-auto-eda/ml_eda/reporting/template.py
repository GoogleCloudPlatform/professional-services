# Copyright 2019 Google Inc. All Rights Reserved.
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
# ==============================================================================

"""Inventory holding building block templates for report."""

REPORT_TITLE = """
# {content}
"""

SECTION_TITLE = """
<br/>
<br/>

* * *
## {content}
"""

SUB_SECTION_TITLE = """
<br/>

* * *
### {content}
"""

SUB_SUB_SECTION_TITLE = """
#### {content}
"""

SUB_SUB_SUB_SECTION_TITLE = """
##### {content}
"""

DESCRIPTION_TEMPLATE = """
{content}
"""

BOLD = "**{content}**"

LIST_TEMPLATE = """{level}* {content}"""

"""
| Tables        | Are           | Cool  |
| ------------- |:-------------:| -----:|
| col 3 is      | right-aligned | $1600 |
| col 2 is      | centered      |   $12 |
| zebra stripes | are neat      |    $1 |
"""
TABLE_TEMPLATE = """
{header}
{header_separator}
{table_content}
"""

IMAGE_TEMPLATE = """
<img src="{url}" alt="{alt_text}" width="600px"/>
"""

DATASET_INFO_TEMPLATE = """
|**Dataset info:**||
|:-----|:-----|
|Location:|{location}|
|Number of numerical attributes:|{numerical_attributes}|
|Number of categorical attributes:|{categorical_attributes}|
|Target:|{target_name}|
|ML Problem type:|{ml_problem_type}|
"""

TABLE_DESCRIPTIVE_TEMPLATE = """
|**Features properties** | | |
|---|---|---|
{row_content}
"""

# pylint: disable=line-too-long
TABLE_DESCRIPTIVE_ROW_TEMPLATE = """|**{name}** <br/> *{type}*|{stats}|<img src={url} alt="{alt_text}" width="400px"/>|
"""

TABLE_DESCRIPTIVE_STATS_TEMPLATE = "**{metric}:** {value}"

TARGET_METRIC_HIGHLIGHT_TEMPLATE = """
{target_column}|{metric_names}
:-----:|{seperators}
{row_content}
"""

TARGET_HEADLINE_TEMPLATE = """
Target: {target}
      
Type: {target_type}
"""
TARGET_METRIC_HIGHLIGHT_ROW_TEMPLATE = "**{name}**|{values}"

HIGH_CARDINALITY = "`{name}` has a high cardinality: {value} distinct values"
HIGH_MISSING = "`{name}` has {value} missing values"
HIGH_CORRELATION = "`{name_one}` is highly correlated with `{name_two}` ({metric} = {value})"  # pylint: disable=line-too-long
LOW_P_VALUE = "`{name_one}` is correlated with `{name_two}` ({metric} = {value})"  # pylint: disable=line-too-long

JOB_CONFIG_TEMPLATE = """
```ini
{config_content}
```
"""

CLI_PARAM_LIST_TEMPLATE = """{param}={value}"""

CLI_PARAM_TEMPLATE = """
```shell
{param_content}
```
"""
