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


import bigframes.pandas as bpd
from bigframes.ml.llm import GeminiTextGenerator
from google.adk.tools.tool_context import ToolContext
from google.cloud import bigquery

from .utils.commons import cleanup_metadata

DATA_GENERATION_PROMPT = """\
Write python code to generate a pandas dataframe based on the following schema:
{METADATA}

Note:
  - Return the code only, no additional texts or comments
  - Use faker library
  - Generate 100 rows
  - You must return all dataframes.
  - The final return value must be named as 'result_df'
"""
 

def generate_data(tool_context: ToolContext):
  project_id = tool_context.state["project_id"]
  dataset_id = tool_context.state["dataset_id"]
  metadata = tool_context.state["metadata"]
  cleaned_metadata = cleanup_metadata(metadata)
  tool_context.state["metadata"] = cleaned_metadata

  bpd.options.bigquery.project = project_id
  bpd.options.bigquery.dataset = dataset_id

  model = GeminiTextGenerator()
  prompt = DATA_GENERATION_PROMPT.format(METADATA=cleaned_metadata)
  df_prompt = bpd.DataFrame({"prompt" : [prompt]})
  df_result = model.predict(df_prompt)
  print("df_result:", df_result)
  llm_result = df_result["ml_generate_text_llm_result"].iloc[0]
  # Python code comes back as a markdown code block,
  # # remove the prefix "```python" and suffix "```"
  # code = llm_result[9:-3]
  code_block = llm_result[9:-3]
  f = open("code_block.py", "w")
  f.write(code_block)
  f.close()
  
  #Local verification of the generated code with a small sample 
  execution_context = {}
  exec(code_block, execution_context)
  result_df = execution_context.get("result_df")
  for df_name, df in result_df.items():
    # Initialize a BigQuery client
    client = bigquery.Client()
    table_id = f"{project_id}.{dataset_id}.{df_name}"
    try:
        # Configure the load job
        job_config = bigquery.LoadJobConfig(
            # Autodetect schema, or define it explicitly
            autodetect=True, 
            # Specify the write disposition (append, truncate, etc.)
            write_disposition="WRITE_APPEND", 
        )

        # Load the DataFrame into BigQuery
        job = client.load_table_from_dataframe(
            df, table_id, job_config=job_config
        )

        job.result()  # Wait for the job to complete
        
        #return json.dumps({"status": "Success", "message": f"Loaded {len(df)} rows into {table_id}"}), 200

    except Exception as e:
        print(f"Error loading data into BigQuery: {e}", str(df_name), str(df))
        continue
  return
  '''
  @bpd.remote_function([int], str, packages=["faker", "pandas","google-cloud-bigquery"], cloud_function_service_account = "default")
  def data_generator(id):
    context = {}
    exec(code_block, context)
    result_df = context.get("result_df")
    for df_name, df in result_df.items():
          # Initialize a BigQuery client
      client = bigquery.Client()
      table_id = f"{project_id}.{dataset_id}.{df_name}"
      try:
          # Configure the load job
          job_config = bigquery.LoadJobConfig(
              # Autodetect schema, or define it explicitly
              autodetect=True, 
              # Specify the write disposition (append, truncate, etc.)
              write_disposition="WRITE_APPEND", 
          )

          # Load the DataFrame into BigQuery
          job = client.load_table_from_dataframe(
              df, table_id, job_config=job_config
          )

          job.result()  # Wait for the job to complete
          
          #return json.dumps({"status": "Success", "message": f"Loaded {len(df)} rows into {table_id}"}), 200

      except Exception as e:
          print(f"Error loading data into BigQuery: {e}")
          continue
    return result_df.to_json(orient="records")

  #Scale the data integration
  desired_num_rows = 100 # 1 million rows
  batch_size = 100 # used in the prompt
  num_batches = int(desired_num_rows/batch_size)
  df = bpd.DataFrame({"row_id": range(num_batches)})
  df["json_data"] = df["row_id"].apply(data_generator)

'''