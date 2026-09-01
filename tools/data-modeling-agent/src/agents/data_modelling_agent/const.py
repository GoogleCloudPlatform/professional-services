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


KIND_OF_ACTIVITY_STATE_LBL = "KIND_OF_ACTIVITY"
KIND_OF_ACTIVITY_USER_TXT = """
What kind of activity you would like to perform ?
1. Start a fresh modelling activity
2. Continue a previous modelling activity
"""
KIND_OF_ACTIVITY_ALLOWED_VALS = ["1","2"]
KIND_OF_ACTIVITY_START_FRESH = "1"
KIND_OF_ACTIVITY_PREVIOUS = "2"
INITIALIZATION_INSTRUCTION_ACTIVITY = f"""
Can you help with following details:
{KIND_OF_ACTIVITY_USER_TXT}
"""

INITIALIZATION_INSTRUCTION_PARAMS = """Can you help with following details: project_id, dataset_id, gcs_folder.
e.g: You can give input as:
project_id=your-project-id,dataset_id=analytics_dw,gcs_folder=20250807102755
"""

SAMPLE_PROMPTS = """
Great, let's get started. To help me design the best solution for you, please provide some context. Tell me about your business domain (e.g., e-commerce, finance), the data warehouse technology you're using (e.g., BigQuery), and your main modeling objective (e.g., tracking marketing KPIs, analyzing customer behavior).
Suggested Prompts for the User:
 - "I'm working on a retail analytics platform for e-commerce. We want to move from flat reporting tables to a semantic dimensional model to optimize reporting for key marketing KPIs."
 - "Show me the source tables. What do they look like? What are the columns with user IDs, product IDs, and transaction IDs?"
 - "I'm working on a retail analytics platform for e-commerce. We want to move from flat reporting tables to a semantic dimensional model to optimize reporting for key marketing KPIs."
 - "I need a data model for a finance company to track customer lifetime value (CLV). We're using a BigQuery data warehouse."

"""