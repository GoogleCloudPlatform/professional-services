# Copyright 2019 Google LLC.
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

"""Utilities module containing SQL queries to be executed during the data extraction.

The following global variables are published by this module:
	* QUERY_TEMP_DATA_TEMPLATE - Query template to shuffle the source data and save it
	in a temporary table.
	* QUERY_TRAINING_DATA_TEMPLATE - Query template to extract from the shuffled temporary
	table the training data.
	* QUERY_VALIDATION_DATA_TEMPLATE - Query template to extract from the shuffled
	temporary table the validation data.
"""

# Query template to shuffle the source data and save it in a temporary table.
QUERY_TEMP_DATA_TEMPLATE = """
	CREATE OR REPLACE TABLE
	  `{temp_table}`
	AS
	SELECT
		CAST(RAND() * {total_lines} AS INT64) AS random,
		*
	FROM (
		SELECT
			{feature_columns}, {target_columns_shuffle}
		FROM
			`{source_table}`
	)
"""

# Query template to extract from the shuffled temporary table the training data.
QUERY_TRAINING_DATA_TEMPLATE = """
	CREATE OR REPLACE TABLE
	  `{destination_table}`
	AS
	SELECT
		{feature_columns}, {target_columns_export}
	FROM
  		`{temp_table}`
  WHERE
  		random <= {split_index}
"""

# Query template to extract from the shuffled temporary table the validation data.
QUERY_VALIDATION_DATA_TEMPLATE = """
	CREATE OR REPLACE TABLE
	  `{destination_table}`
	AS
	SELECT
	  {feature_columns}, {target_columns_export}
	FROM
	  `{temp_table}`
	WHERE
  		random > {split_index}
"""
