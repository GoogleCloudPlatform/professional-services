import streamlit as st
import requests
import os
import re # For GCS path validation
import google.auth.transport.requests
import google.oauth2.id_token


# --- Configuration ---
# Fetch the Backend API URL from environment variables.
# This should be set in the Cloud Run deployment configuration for the Streamlit app.
BACKEND_API_BASE_URL = os.getenv("BACKEND_SERVICE_URI")
SCOPES = ['https://www.googleapis.com/auth/cloud-platform']
DATA_INGESTION_ENDPOINT = "/data-ingestion/rag-engine" # As per your backend router

def get_full_api_url():
    """Constructs the full API URL for data ingestion."""
    if not BACKEND_API_BASE_URL:
        st.error("Backend API URL is not configured. Please set the BACKEND_SERVICE_URI environment variable.")
        return None
    return f"{BACKEND_API_BASE_URL.rstrip('/')}{DATA_INGESTION_ENDPOINT}"

def validate_gcs_path(path):
    """Validates if the GCS path is in the format gs://bucket/object or gs://bucket/folder/"""
    if not path:
        return "GCS Path cannot be empty."
    if not re.match(r"^gs://[a-zA-Z0-9._-]+(/[a-zA-Z0-9._/-]*)?/?$", path):
        return "Invalid GCS Path format. Expected format: gs://your-bucket/your-folder/"
    return None

def run():
    """
    Displays the data ingestion form and handles submission.
    """
    st.set_page_config(
        page_title="Data Ingestion",
        page_icon="📥",
        layout="wide"
    )
    st.title("📥 Data Ingestion")
    st.markdown("Configure and submit your data for ingestion into the RAG system.")

    # --- Layout Parser Configuration ---
    st.subheader("Optional: Layout Parser Configuration")
    
    # Move the checkbox outside the form for immediate reactivity
    enable_layout_parser = st.checkbox(
        "Enable Document AI Layout Parser",
        help="Check this to use a Document AI Layout Parser processor for more structured document parsing.",
        key="enable_layout_parser_checkbox"
    )

    # Start the form after the checkbox decision has been made
    with st.form("data_ingestion_form"):
        st.subheader("Data Source Configuration")

        # Data Source Path
        data_source_path = st.text_input(
            "Google Cloud Storage Path (URI)",
            placeholder="gs://your-bucket/your-data-folder/",
            help="Enter the URI of the GCS bucket or folder containing your documents (e.g., gs://my-bucket/documents/).",
        )
        # Placeholder for GCS path error
        gcs_path_error_placeholder = st.empty()

        st.subheader("Chunking Configuration")
        # Chunk Size
        chunk_size = st.number_input(
            "Chunk Size",
            min_value=1,
            value=1024,
            step=1,
            help="The size of each chunk of text processed from your documents. Larger chunks provide more context but might be less precise. Default: 1024.",
            key="chunk_size_input"
        )

        # Chunk Overlap
        chunk_overlap = st.number_input(
            "Chunk Overlap",
            min_value=0,
            value=200,
            step=1,
            help="The number of characters or tokens that consecutive chunks will share. This helps maintain context across chunk boundaries. Default: 200.",
            key="chunk_overlap_input"
        )

        # Layout Parser fields (conditionally displayed)
        processor_name = ""
        max_parsing_requests_per_min = 120
        processor_name_error_placeholder = st.empty()
        
        # Only show layout parser fields if the checkbox is checked
        if enable_layout_parser:
            st.subheader("Layout Parser Details")
            
            processor_name = st.text_input(
                "Layout Parser Processor Name",
                placeholder="projects/{project_id}/locations/{location}/processors/{processor_id}",
                help="Full resource name of the Document AI Layout Parser processor or processor version.",
                key="processor_name_input"
            )
            
            processor_name_error_placeholder = st.empty()

            max_parsing_requests_per_min = st.number_input(
                "Max Parsing Requests per Minute (QPM)",
                min_value=1,
                value=120, # Pre-filled default
                step=1,
                help="Maximum requests per minute to the Document AI processor. Default: 120 QPM.",
                key="max_qpm_input"
            )

        # Submit Button
        st.markdown("---")
        submitted = st.form_submit_button("🚀 Submit Ingestion Job", type="primary", use_container_width=True)

            # --- Form Submission Logic ---
    if submitted:
        # Client-side validation
        valid_form = True
        gcs_error = validate_gcs_path(data_source_path)
        if gcs_error:
            gcs_path_error_placeholder.error(gcs_error)
            valid_form = False

        # Create layout_parser_config only if the checkbox is checked
        layout_parser_config = None
        if enable_layout_parser:
            # Validate processor name if layout parser is enabled
            if not processor_name:
                if 'processor_name_error_placeholder' in locals():
                    processor_name_error_placeholder.error("Layout Parser Processor Name cannot be empty when enabled.")
                else:
                    st.error("Layout Parser Processor Name cannot be empty when enabled.")
                valid_form = False
            elif 'processor_name_error_placeholder' in locals():
                processor_name_error_placeholder.empty() # Clear previous error if now valid
            
            # Only create layout_parser_config if the processor name is valid
            if processor_name:
                layout_parser_config = {
                    "processor_name": processor_name,
                    "max_parsing_requests_per_min": max_parsing_requests_per_min
                }

        if valid_form:
            gcs_path_error_placeholder.empty() # Clear GCS error if now valid

            api_url = get_full_api_url()
            if api_url:
                # Create the payload based on backend expectations
                payload = {
                    "data_source_path": data_source_path,
                    "chunk_size": chunk_size,
                    "chunk_overlap": chunk_overlap,
                    "layout_parser_processor": layout_parser_config if layout_parser_config else None
                }

                with st.spinner("Submitting data ingestion job... Please wait."):
                    try:
                        headers = {"Content-Type": "application/json"}

                        # Fetch an identity token for authorization
                        auth_req = google.auth.transport.requests.Request()
                        id_token = google.oauth2.id_token.fetch_id_token(auth_req, BACKEND_API_BASE_URL)
                        headers["Authorization"] = f"Bearer {id_token}"

                        response = requests.post(api_url, json=payload, headers=headers)

                        # Handle different response status codes
                        if response.status_code == 202: # Success (Accepted)
                            response_text = response.content.decode('utf-8').strip()
                            message = response_text if response_text else "Initiated Data Ingestion job triggered successfully."
                            st.success(f"✅ Data Ingestion job successfully initiated! The system will process your data in the background. Message from server: {message}")
                        else:
                            # Try to extract error details from response
                            error_message = ""
                            try:
                                error_data = response.json()
                                # Handle Pydantic validation errors (422 status code)
                                if response.status_code == 422 and "detail" in error_data and isinstance(error_data["detail"], list):
                                    error_parts = []
                                    for err in error_data["detail"]:
                                        # Extract field path (skip the first element which is usually 'body')
                                        field_path = " → ".join(str(p) for p in err.get("loc", [])[1:]) 
                                        error_parts.append(f"Field '{field_path}': {err.get('msg', 'Invalid')}")
                                    error_message = "; ".join(error_parts)
                                else:
                                    # Handle regular error with 'detail' field
                                    error_message = error_data.get("detail", str(error_data))
                            except ValueError:
                                # Handle non-JSON responses
                                error_message = response.text
                            
                            # Show appropriate error based on status code
                            if response.status_code == 422:
                                st.error(f"⚠️ Validation Error: {error_message}")
                            elif response.status_code == 500:
                                st.error(f"❌ Server Error: {error_message}")
                            else:
                                st.error(f"❌ Error ({response.status_code}): {error_message}")
                    except requests.exceptions.RequestException as e:
                        st.error(f"❌ Network or connection error: {e}")
            else:
                # Error for BACKEND_API_BASE_URL not being set is handled by get_full_api_url
                pass
        else:
            st.warning("Please correct the errors in the form before submitting.")

if __name__ == "__main__":
    run()