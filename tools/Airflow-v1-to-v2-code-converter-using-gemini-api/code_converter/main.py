import os
import json
#from io import BytesIO
from concurrent.futures import ThreadPoolExecutor, as_completed
import traceback

from google.cloud import storage
import vertexai
from vertexai.generative_models import GenerativeModel, Part

from flask import Flask, request as flask_request

# Flask app setup
app = Flask(__name__)

# --- Configuration (Defaults, can be overridden by env vars) ---
# DEFAULT_VERTEX_AI_LOCATION = "us-central1"
# DEFAULT_MAX_WORKERS = 5

# Initialize GCS client globally
storage_client = storage.Client()


def list_gcs_files(bucket_name, folder_path, file_extension_filter=None):
    """Lists files in a GCS folder, optionally filtering by extension."""
    blobs = storage_client.list_blobs(bucket_name, prefix=folder_path)
    file_paths = []
    for blob in blobs:
        if not blob.name.endswith("/"):  # Skip "folders"
            if file_extension_filter:
                if any(
                    blob.name.lower().endswith(ext) for ext in file_extension_filter
                ):
                    file_paths.append(blob.name)
            else:
                file_paths.append(blob.name)
    return file_paths


def read_gcs_file(bucket_name, file_path):
    """Reads content of a file from GCS."""
    try:
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(file_path)
        content = blob.download_as_text()
        print(f"Successfully read: gs://{bucket_name}/{file_path}")
        return content
    except Exception as e:
        print(f"Error reading gs://{bucket_name}/{file_path}: {e}")
        raise


def write_gcs_file(bucket_name, file_path, content):
    """Writes content to a file in GCS."""
    try:
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(file_path)
        blob.upload_from_string(content, content_type="text/plain")
        print(f"Successfully wrote: gs://{bucket_name}/{file_path}")
    except Exception as e:
        print(f"Error writing gs://{bucket_name}/{file_path}: {e}")
        raise


def convert_code_with_vertexai(
    model,user_question_template, prompt_variables, code_content
):
    """Converts code using Vertex AI Generative Model."""
    prompt_params = {**prompt_variables, "code_content": code_content}
    full_user_question = user_question_template.format(**prompt_params)

    try:
        response = model.generate_content(
            [Part.from_text(full_user_question)],
        )
        converted_code = response.text
        print("Starting cleaning process for a code snippet")  # Clarified log
        # cleaning, models sometimes add ```language ``` wrappers
        if converted_code.startswith("```python"):
            converted_code = converted_code[len("```python") :]
        elif converted_code.startswith("```sql"):
            converted_code = converted_code[len("```sql") :]
        elif converted_code.startswith("```"):
            converted_code = converted_code[len("```") :]

        if converted_code.endswith("```"):
            converted_code = converted_code[: -len("```")]

        print("Successfully converted code snippet")
        return converted_code
    except Exception as e:
        print(f"Error during Vertex AI call: {e}")
        # print(f"Full user question sent to model: {full_user_question}") # For debugging
        raise


def process_single_file(
    input_bucket_name,
    input_folder_prefix_in_bucket,
    full_input_file_gcs_path,
    output_bucket_name,
    output_folder_prefix_in_bucket,
#    model=None,
    user_question_template=None,
    prompt_variables=None,
):
    """
    Reads a single file from GCS, converts its content using Vertex AI,
    and writes the converted content to another GCS location, preserving the
    relative directory structure from the input folder.

    Args:
        input_bucket_name (str): Name of the GCS bucket to read from.
        input_folder_prefix_in_bucket (str): The prefix path in the input bucket (e.g., "dags/v1/").
                                             This is used to determine the relative path.
        full_input_file_gcs_path (str): The full GCS path of the input file
        (e.g., "dags/v1/team_a/dag_file.py")
        output_bucket_name (str): Name of the GCS bucket to write to.
        output_folder_prefix_in_bucket (str): The prefix path in the output bucket
        where converted files will be stored (e.g., "dags/v3_converted/").
        model: The initialized Vertex AI GenerativeModel.
        system_instruction (str or list): System instruction for the Vertex AI model.
        user_question_template (str): Template for the user question to the model.
        prompt_variables (dict): Variables to format the user question template.
    """
    try:
        print(f"Processing file: gs://{input_bucket_name}/{full_input_file_gcs_path}")
        original_code = read_gcs_file(input_bucket_name, full_input_file_gcs_path)

        model="gemini-2.5-flash"

        converted_code = convert_code_with_vertexai(
            model,# model,
            user_question_template,
            prompt_variables,
            original_code,
        )


        relative_path_to_input_prefix = os.path.relpath(
            full_input_file_gcs_path, start=input_folder_prefix_in_bucket or "."
        )
        final_output_file_gcs_path = os.path.join(
            output_folder_prefix_in_bucket, relative_path_to_input_prefix
        )

        # placeholder.
        # change file extensions, this is where you'd implement it.
        # For example, to change '.py' to '.py_v3converted':
        # target_extensions = tuple(prompt_variables.get("file_extension_filter", [".py"]))
        # new_extension_suffix = "_v3converted" # Or get from prompt_variables
        # if final_output_file_gcs_path.endswith(target_extensions):
        #    base, old_ext = os.path.splitext(final_output_file_gcs_path)
        #    final_output_file_gcs_path = base + new_extension_suffix + old_ext #
        # else:
        # Handle files not matching the filter, or apply a default transformation
        #    pass

        write_gcs_file(output_bucket_name, final_output_file_gcs_path, converted_code)
        return {
            "file": full_input_file_gcs_path,
            "status": "success",
            "output_path": f"gs://{output_bucket_name}/{final_output_file_gcs_path}",
        }
    except FileNotFoundError as e:
        print(f"Failed to process file {full_input_file_gcs_path}: {e}")
        return {"file": full_input_file_gcs_path, "status": "error", "message": str(e)}


def main_handler(request):
    """Cloud Run entry point."""
    try:
        request_json = request.get_json(silent=True)
        if not request_json:
            return "Error: Invalid JSON payload.", 400

        # --- Extract and Validate Parameters ---
        project_id = request_json.get(
            "project_id", os.environ.get("GOOGLE_CLOUD_PROJECT")
        )
        location = request_json.get("location")
        read_bucket_name = request_json.get("read_bucket_name")
        # input_folder_path is the prefix for listing and base for relative path calculation
        input_folder_path = request_json.get(
            "input_folder_path", ""
        )  # Default to root if not specified
        write_bucket_name = request_json.get("write_bucket_name")
        output_folder_path = request_json.get(
            "output_folder_path"
        )  # Base path for output files
        model_id = request_json.get("model_id")
        system_instruction_parts = request_json.get("system_instruction")
        user_question_template = request_json.get("user_question_template")
        prompt_variables = request_json.get("prompt_variables", {})
        file_extension_filter = request_json.get("file_extension_filter")
        max_workers = int(request_json.get("max_workers"))

        required_params = {
            "project_id": project_id,
            "location": location,
            "read_bucket_name": read_bucket_name,
            "write_bucket_name": write_bucket_name,
            "output_folder_path": output_folder_path,  # output_folder_path must exist
            "model_id": model_id,
            "system_instruction": system_instruction_parts,
            "user_question_template": user_question_template,
        }
        for param, value in required_params.items():
            if not value:  # Note: input_folder_path can be empty string (bucket root)
                if param == "input_folder_path" and value == "":
                    continue
                return f"Error: Missing required parameter: {param}", 400
        if not isinstance(system_instruction_parts, (list, str)):
            return (
                "Error: 'system_instruction' must be a string or a list of strings.",
                400,
            )

        # --- Initialize Vertex AI ---
        print(
            f"Initializing Vertex AI for project '{project_id}' in location " \
            "'{location}' with model '{model_id}'..."
        )
        vertexai.init(project=project_id, location=location)

        model = GenerativeModel(model_id, system_instruction=system_instruction_parts)
        print("Vertex AI model initialized.")

        # --- List input files ---
        # Ensure input_folder_path for listing is correctly formatted if not empty
        # list_blobs prefix doesn't strictly need a trailing slash, but consistency is good.
        list_prefix = input_folder_path
        if list_prefix and not list_prefix.endswith("/"):
            # This is more for conceptual clarity; list_blobs prefix matching is quite flexible.
            # However, for os.path.relpath, having a consistent base is helpful.
            # The logic in process_single_file with `or "."` for `start` handles this.
            pass

        print(
            f"Listing files in gs://{read_bucket_name}/{list_prefix} "
        )
        input_files = list_gcs_files(
            read_bucket_name, list_prefix, file_extension_filter
        )
        if not input_files:
            return "No files found in the input GCS path matching the filter.", 200
        print(f"Found {len(input_files)} files to process.")

        # --- Process files in parallel ---
        results = []
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {
                executor.submit(
                    process_single_file,
                    read_bucket_name,
                    input_folder_path,
                    file_path,
                    write_bucket_name,
                    output_folder_path,
                    model,
                    system_instruction_parts,
                    user_question_template,
                    prompt_variables,
                ): file_path
                for file_path in input_files
            }
            for future in as_completed(futures):
                results.append(future.result())

        successful_conversions = [r for r in results if r["status"] == "success"]
        failed_conversions = [r for r in results if r["status"] == "error"]

        summary = {
            "total_files_processed": len(results),
            "successful_conversions": len(successful_conversions),
            "failed_conversions": len(failed_conversions),
            "details": results,
        }

        print(
            f"Processing summary: {json.dumps(summary, indent=2)}"
        )  # Pretty print summary
        if failed_conversions:
            # Return 207 Multi-Status if some failed
            return json.dumps(summary), 207
        return json.dumps(summary), 200

    except FileNotFoundError as e:
        print(f"Unhandled error in main_handler: {e}")
        traceback.print_exc()
        return f"An internal server error occurred: {str(e)}", 500


@app.route("/", methods=["POST"])
def entrypoint():
    """Flask route for Cloud Run."""
    response_data, status_code = main_handler(flask_request)
    return response_data, status_code


# For local testing (requires GOOGLE_APPLICATION_CREDENTIALS to be set)
if __name__ == "__main__":
    server_port = int(os.environ.get("PORT", 8080))
    app.run(debug=True, host="0.0.0.0", port=server_port)
