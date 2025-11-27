"""
Copyright 2025 Google. This software is provided as-is, 
without warranty or representation for any use or purpose. 
Your use of it is subject to your agreement with Google.

"""

from google.cloud import storage
import os
import re
from vertexai.generative_models import Part, Content  # For read_gcs_return_delimiter
import prompts_collection


def append_header_to_gcs_file(input_gcs_path, staging_gcs_path, header_variable):
    """
    Reads a GCS file from input path, appends a header from a variable, and uploads
    the updated file to output GCS path with the same filename in the specified folder.

    Args:
        input_gcs_path: The GCS path to the input file.
        staging_gcs_path: The GCS path including bucket and folder for output.
        header_variable: The variable containing the header string.
    """
    try:
        # Extract bucket and blob names from GCS input path
        input_bucket_name = input_gcs_path.split("/")[2]
        input_blob_name = "/".join(input_gcs_path.split("/")[3:])
        # Extract file name from blob name
        file_name = os.path.basename(input_blob_name)

        # Extract bucket name and folder from staging_gcs_path
        output_gcs_bucket = staging_gcs_path.split("/")[2]
        output_gcs_folder = "/".join(staging_gcs_path.split("/")[3:]).rstrip(
            "/"
        )  # Remove trailing slash if present

        # Initialize GCS client and get bucket/blob objects
        storage_client = storage.Client()
        input_bucket = storage_client.bucket(input_bucket_name)
        input_blob = input_bucket.blob(input_blob_name)

        # Download file content as string
        file_content = input_blob.download_as_string().decode("utf-8")

        if header_variable is not None:
            # Append header to file content
            file_content = header_variable + "\n" + file_content

        # Construct output GCS path using the extracted bucket and folder
        output_gcs_path = f"gs://{output_gcs_bucket}/{output_gcs_folder}/{file_name}"

        # Get output bucket/blob objects
        output_bucket = storage_client.bucket(output_gcs_bucket)
        output_blob = output_bucket.blob(f"{output_gcs_folder}/{file_name}")

        # Upload updated content to output GCS path
        output_blob.upload_from_string(file_content)
        return output_gcs_path

    except Exception as e:
        print(f"Error: {e}")


def get_filename_sample_rows(gcs_file_path, num_sample_rows=5):
    """
    Reads a GCS file, extracts the file name, and returns sample rows.

    Args:
        gcs_file_path: The GCS path to the file (e.g., "gs://my-bucket/path/to/file.csv").
        num_sample_rows: The number of sample rows to return (default: 5).

    Returns:
        A tuple containing the file name and a pandas DataFrame with the sample rows.
    """

    # Extract file name from GCS path
    file_name = gcs_file_path.split("/")[-1]

    # Initialize a GCS client
    client = storage.Client()

    # Parse the GCS path to get bucket and blob names
    bucket_name = gcs_file_path.split("/")[2]
    blob_name = "/".join(gcs_file_path.split("/")[3:])

    # Get the bucket and blob objects
    bucket = client.get_bucket(bucket_name)
    blob = bucket.blob(blob_name)

    # Download the file content as a string
    file_content = blob.download_as_string().decode("utf-8")

    # Split the content into rows and take only the first num_sample_rows
    rows = file_content.split("\n")[:num_sample_rows]

    return file_name, rows


def upload_from_local_to_gcs(gcs_output_path, local_file_path):
    """
    Uploads a file from local storage to Google Cloud Storage.
    Retrieves the bucket name from the gcs_output_path.

    Args:
        gcs_output_path: The path to the file in GCS, including the bucket name (e.g., "gs://my-bucket/path/to/file.csv").
        local_file_path: The local path to the file.
    """

    # Extract bucket name from gcs_output_path using regex
    match = re.match(r"gs://([^/]+)/(.+)", gcs_output_path)
    if match:
        bucket_name = match.group(1)
        gcs_output_path_without_bucket = match.group(
            2
        )  # Get the path without the bucket name
    else:
        raise ValueError("Invalid GCS output path format.")

    # Initialize GCS client
    client = storage.Client()

    # Get a reference to the bucket
    bucket = client.bucket(bucket_name)

    # Create a blob object
    blob = bucket.blob(
        gcs_output_path_without_bucket
    )  # Use the path without the bucket name

    # Upload the file to GCS
    blob.upload_from_filename(local_file_path)

    print(f"Uploaded local file to gs://{bucket_name}/{gcs_output_path_without_bucket}")


def read_gcs_return_delimiter(gcs_file_path, gemini_model):
    """
    Reads a file from GCS and return the file delimter as output.

    Args:
        gcs_file_path: The GCS path to the file.

    Returns:
        The File Delimter.
    """

    # Initialize a GCS client.
    storage_client = storage.Client()

    # Get the bucket and blob names from the GCS path.
    bucket_name = gcs_file_path.split("/")[2]
    blob_name = "/".join(gcs_file_path.split("/")[3:])

    # Get the blob object.
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(blob_name)

    # Download the file content as a string.
    file_content = blob.download_as_string().decode("utf-8")

    # Create Content objects for the prompt and file data.
    prompt_content = Content(
        parts=[Part.from_text(prompts_collection.Delimiter_Prediction_Prompt)],
        role="user",
    )
    file_data_content = Content(
        parts=[Part.from_text("File Data:")], role="user"
    )  # Added "File Data:" to the content
    content = Content(parts=[Part.from_text(file_content)], role="user")

    # Generate content using the Gemini model.
    # Passing a list of Content objects to generate_content.
    file_delimiter = gemini_model.generate_content(
        [prompt_content, file_data_content, content]
    ).text

    return file_delimiter
