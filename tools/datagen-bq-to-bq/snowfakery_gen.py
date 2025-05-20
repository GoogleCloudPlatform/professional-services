"""
Copyright 2025 Google. This software is provided as-is, 
without warranty or representation for any use or purpose. 
Your use of it is subject to your agreement with Google.

"""

import yaml
import re
from io import StringIO
from snowfakery import generate_data
from vertexai.generative_models import Part
import prompts_collection  # For prompts
import config_vars  # For user_counts


def generate_receipes(table_attributes, gemini_model):
    combined_yaml = ""
    combined_schema = ""

    for table_name in config_vars.user_counts:
        attributes = table_attributes.get(table_name)
        # Check if the attributes are present, if not skip.
        if attributes is None:
            print(
                f"Warning: Table '{table_name}' not found in table_attributes. Skipping recipe generation."
            )
            continue
        staging_gcs_path = attributes.get("staging_gcs_path")
        print(staging_gcs_path)

        # Accessing the attributes for a specific table
        attributes = table_attributes.get(table_name)
        schema = attributes.get("schema")

        Recipe_Prompt = prompts_collection.create_receipe_prompt(
            prompts_collection.fake_function_list, schema
        )
        file_records = Part.from_uri(staging_gcs_path, mime_type="text/csv")
        yaml_output = gemini_model.generate_content(
            [Recipe_Prompt, "Sample Records:", file_records]
        ).text
        chat_yaml_corection = gemini_model.start_chat()
        final_yaml_output = chat_yaml_corection.send_message(
            prompts_collection.yaml_correction_prompt + """ **Input:** """ + yaml_output
        ).text
        combined_yaml = combined_yaml + final_yaml_output
        combined_schema = combined_schema + "Table Name:" + table_name + schema
    return combined_yaml, combined_schema


def generate_data_with_user_input(recipe, local_snowfakery_output_batch):
    """
    Generates synthetic data using Snowfakery based on user input.

    Args:
        recipe: The Snowfakery recipe as a string.
        output_format: The desired output format (e.g., csv, json).
        output_folder: The path to the folder where output will be saved.
    """

    # Generate data using Snowfakery
    generate_data(
        StringIO(recipe),
        output_format="csv",
        output_folder=local_snowfakery_output_batch,
    )

    print("Data generation complete. Check the output folder.")


def generate_output_data(
    gemini_model,
    table_attributes,  # Pass current table_attributes
    local_snowfakery_output_batch,  # Pass local output dir for this batch
):
    """
    Generates synthetic data and loads it into BigQuery tables.

    This function orchestrates the process of generating synthetic data
    based on source BigQuery tables and loading it into target BigQuery tables.
    It involves generating Snowfakery recipes, extracting table relationships,
    creating and uploading data to GCS, and finally loading the data into BigQuery.
    Args:
      source_table_list: A semicolon-separated list of source BigQuery tables.
      gcs_bucket_name: The name of the GCS bucket for storing data.
      total_rows_to_fetch_from_source_table: The number of rows to fetch from each source table.

      Returns:
      None
    """
    combined_yaml, combined_schema = generate_receipes(table_attributes, gemini_model)
    print(combined_yaml)
    print(combined_schema)
    relationship_output = gemini_model.generate_content(
        [prompts_collection.Relationship_builder, combined_schema]
    )
    print(relationship_output.text)
    combined_yaml = gemini_model.generate_content(
        [
            prompts_collection.Relationship_Prompt,
            relationship_output.text,
            combined_yaml,
        ]
    )
    combined_yaml = gemini_model.generate_content(
        [
            prompts_collection.Correct_Object_Name_Prompt,
            relationship_output.text,
            combined_yaml.text,
        ]
    )
    recipe = combined_yaml
    # Check for and replace problematic characters
    recipe = recipe.text
    # print(recipe)
    recipe = recipe.replace("`", "")  # Replace backticks with single quotes

    # Attempt to fix multiline string issues
    recipe = re.sub(r"^yaml\s*", "", recipe, flags=re.MULTILINE)
    # print(recipe)

    # Load the YAML recipe
    yaml_data = yaml.safe_load(recipe)

    # Update the counts for each object
    for item in yaml_data:
        object_name = item.get("object")
        if object_name in config_vars.user_counts:
            item["count"] = config_vars.user_counts[object_name]

    # Dump the updated YAML recipe
    updated_recipe = yaml.dump(yaml_data, sort_keys=False)
    print(updated_recipe)

    # Generate data based on the updated recipe
    generate_data_with_user_input(updated_recipe, local_snowfakery_output_batch)
    return "Sucess"
