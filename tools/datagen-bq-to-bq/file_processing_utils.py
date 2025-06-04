"""
Copyright 2025 Google. This software is provided as-is, 
without warranty or representation for any use or purpose. 
Your use of it is subject to your agreement with Google.

"""

import time
import json
import os
import shutil
import tempfile
import csv
from vertexai.generative_models import Part, Content
import gcs_ops  # For GCS interactions within preprocessing
import prompts_collection  # For prompts


def safe_strtobool(val):
    """Converts a string to boolean in a more robust way."""
    val = val.lower()
    if val in ("yes", "true", "t", "y", "1"):
        return True
    elif val in ("no", "false", "f", "n", "0"):
        return False
    else:
        raise ValueError(f"Invalid boolean string: '{val}'")


def file_pre_processing(
    gemini_model,
    input_gcs_path,  # Pass the map generated above
    staging_gcs_path,  # Pass the general staging path for intermediate files
    header_gcs_path,  # Pass the (potentially empty) header_gcs_path map
    table_attributes,
):
    for table_name, gcs_path in input_gcs_path.items():
        # Create a nested dictionary for 'table_name' before assigning values
        table_attributes[table_name] = {}

        print(f"Processing table: {table_name}")
    
        # Extract of the sample rows from the GCS File Path
        file_name, sample_rows = gcs_ops.get_filename_sample_rows(gcs_path)
        sample_rows_str = "\n".join(map(str, sample_rows))

        # Prediction of Header Flag
        header_prediction_prompt = prompts_collection.header_prediction(sample_rows_str)
        header_flag = gemini_model.generate_content([header_prediction_prompt]).text
        table_attributes[table_name]["column_header_flag"] = safe_strtobool(
            header_flag.strip()
        )

        # Extraction of Custom Header
        content = Content(
            parts=[
                Part.from_text(prompts_collection.Custom_Header_Extract_Prompt),
                Part.from_text(f"File Data: {sample_rows_str}"),
            ]
        )
        content.role = "user"  # Set the role to "user"
        custom_header = gemini_model.generate_content([content]).text
        table_attributes[table_name]["custom_header"] = custom_header

        # Predicting the Schema of the File
        content = Content(
            parts=[
                Part.from_text(prompts_collection.Schema_Prediction_Prompt),
                Part.from_text(f"file_name: {file_name}"),
                Part.from_text(f"sample_rows: {sample_rows_str}"),
                Part.from_text(f"header_flag: {header_flag}"),
            ]
        )
        content.role = "user"  # Set the role to "user"
        predicted_schema = gemini_model.generate_content([content]).text
        table_schema = predicted_schema.replace("```json\n", "").replace("```", "")
        table_attributes[table_name]["schema"] = table_schema

        # Extract the column names from the schema
        column_names = extract_column_names(table_schema)
        table_attributes[table_name]["column_names"] = column_names

        # Add the column names to the file, only if the header is not present in the source file
        if not (safe_strtobool(header_flag.strip())):
            # Append the column names to the file for further processing
            table_staging_path = gcs_ops.append_header_to_gcs_file(
                gcs_path, staging_gcs_path, column_names
            )
            table_attributes[table_name]["staging_gcs_path"] = table_staging_path

        if safe_strtobool(header_flag.strip()):
            table_staging_path = gcs_ops.append_header_to_gcs_file(
                gcs_path, staging_gcs_path, None
            )
            table_attributes[table_name]["staging_gcs_path"] = table_staging_path

        # Extracting the Delimiter of the File
        file_delimiter = gcs_ops.read_gcs_return_delimiter(gcs_path, gemini_model)
        # Add a delay to avoid exceeding the API request rate
        time.sleep(1)  # pause for 1 second
        file_delimiter = (
            file_delimiter.strip()
        )  # Remove leading/trailing whitespace, including newlines
        table_attributes[table_name]["delimiter"] = file_delimiter

    # Extracting the Header File Path, if present
    for table_name, gcs_path in header_gcs_path.items():
        # Check if the table_name exists in table_attributes before accessing it
        if table_name in table_attributes:
            table_attributes[table_name]["header_file_path"] = gcs_path
        else:
            # Handle the case where table_name is not found in table_attributes
            print(
                f"Warning: Table '{table_name}' not found in input_gcs_path. Skipping header file path assignment."
            )

    for table_name, gcs_path in input_gcs_path.items():
        # Check if the table_name exists in table_attributes before accessing it
        attributes = table_attributes.get(table_name)
        column_header_flag = attributes.get("column_header_flag")
        delimiter = attributes.get("delimiter")
        custom_header = attributes.get("custom_header")
        header_file_path = attributes.get("header_file_path")
        schema = attributes.get("schema")
        print(
            f"Table: {table_name}, column_names:{column_names},column_header_flag: {column_header_flag}, delimiter: {delimiter},custom_header:{custom_header},header_file_path:{header_file_path},schema:{schema}"
        )
    return table_attributes


def file_post_processing(
    input_gcs_path,  # Pass original input_gcs_path for iteration reference
    table_attributes,  # Pass current table_attributes
    output_gcs_path,  # Base GCS path for final outputs (batch specific)
    local_snowfakery_output_batch,  # Local directory where generated files are
):
    for table_name, gcs_path in input_gcs_path.items():
        attributes = table_attributes.get(table_name)
        # local_file_path = f"/output/{table_name}.csv"
        local_file_path = os.path.join(
            local_snowfakery_output_batch, f"{table_name}.csv"
        )  # Renamed

        # Get the record count of the data generated
        table_attributes[table_name]["num_records_generated"] = count_data_records(
            local_file_path
        )

        # Get the input file delimiter
        delimiter = attributes.get("delimiter")
        delimiter = delimiter.strip()

        # Convert the output delimiter to the input delimiter
        if delimiter != ",":
            convert_delimiter(local_file_path, delimiter)

        # Remove the column header
        column_header_flag = attributes.get("column_header_flag")
        if not column_header_flag:
            remove_column_header(local_file_path)

        # Add Custom-Header
        custom_header = attributes.get("custom_header")

        if custom_header.lower().strip() != "false":
            add_custom_header(local_file_path, custom_header)

        # After all the processing, upload the file to gcs output folder
        gcs_output_path = f"{output_gcs_path}{table_name}.csv"
        gcs_ops.upload_from_local_to_gcs(gcs_output_path, local_file_path)
        table_attributes[table_name]["output_gcs_path"] = gcs_output_path
    return table_attributes


def extract_column_names(schema_string):
    """
    Extracts column names from a schema string and formats them as a comma-separated string.

    Args:
        schema_string: The schema string in JSON format.

    Returns:
        A comma-separated string of column names.
    """
    # Find the start and end positions of the JSON string
    start_index = schema_string.find("[")
    end_index = schema_string.find("]") + 1

    # Extract the JSON string
    schema_json = schema_string[start_index:end_index]

    # Load the JSON string as a JSON object
    schema = json.loads(schema_json)

    # Extract and format column names
    column_names = ",".join([list(item.keys())[0] for item in schema])

    return column_names


def count_data_records(file_path):
    """
    Counts the number of data records (lines excluding the header) in a large file efficiently.

    Args:
      file_path: Path to the file.

    Returns:
      The number of data records in the file.
    """
    with open(file_path, "rb") as file:  # Open in binary mode for efficiency
        # Skip the header line (first line) by reading until the first newline character
        file.readline()  # Read and discard the header line
        # Count the remaining lines (data records) using buffered reads
        record_count = sum(
            chunk.count(b"\n") for chunk in iter(lambda: file.read(1024 * 1024), b"")
        )
    return record_count


def remove_column_header(file_path):
    """
    Removes the column header from the file

    Args:
        file_path: The path to the file.
    """
    temp_file = "temp_file.txt"
    with open(temp_file, "w") as outfile:
        with open(file_path, "r") as infile:
            # Skip the first line
            next(infile)
            # Copy remaining lines to temporary file
            shutil.copyfileobj(infile, outfile)

    # Replace the original file with the temporary file
    os.replace(temp_file, file_path)


def add_custom_header(input_file_path, custom_header):
    """Adds a custom header to the beginning of a file.

    Args:
        input_file_path: Path to the input file.
        custom_header: The custom header to add.
    """
    # Create a temporary file to write the modified contents to.
    with tempfile.NamedTemporaryFile(
        mode="w+b", delete=False
    ) as temp_file:  # Changed mode to "w+b"
        # Write the custom header to the temporary file.
        temp_file.write(custom_header.encode())  # Encode the header to bytes

        # Efficiently copy the contents of the input file to the temporary file.
        with open(input_file_path, "rb") as input_file:
            shutil.copyfileobj(input_file, temp_file)

    # Replace the original input file with the temporary file (atomic operation).
    shutil.move(temp_file.name, input_file_path)


def convert_delimiter(input_file, input_delimiter):
    """
    Reads a comma-separated CSV file and converts it to a delimiter-separated file,
    replacing the original file with the converted one.
    Optimized for large files by processing in chunks.

    Args:
        input_file: Path to the input CSV file.
        input_delimiter: The delimiter to use in the output file.
    """
    input_delimiter = input_delimiter.replace("\n", "").replace(
        "\r", ""
    )  # Removing new line char

    if input_delimiter == ",":
        print("Input and output delimiters are the same. Skipping conversion.")
        return  # Skip if delimiters are the same

    # Create a temporary file to write the converted data in chunks
    with tempfile.NamedTemporaryFile(mode="w", delete=False) as temp_file:
        temp_file_path = temp_file.name

        # Open input and output files
        with (
            open(input_file, "r", newline="") as infile,
            open(temp_file_path, "w", newline="") as outfile,
        ):
            reader = csv.reader(infile)
            writer = csv.writer(outfile, delimiter=input_delimiter)

            # Process the file in chunks to reduce memory usage
            chunk_size = 10000  # Adjust chunk size as needed
            for i, row in enumerate(reader):
                writer.writerow(row)
                if i % chunk_size == chunk_size - 1:
                    outfile.flush()  # Flush buffer to write to disk

    # Replace the original input file with the temporary file
    os.replace(temp_file_path, input_file)

    print(
        f"File converted and replaced successfully with delimiter: '{input_delimiter}'"
    )
