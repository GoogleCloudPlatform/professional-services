import streamlit as st
import requests
import os
import google.auth.transport.requests
import google.oauth2.id_token

# --- Configuration ---
# Fetch the Backend API URL from environment variables.
# This should be set in the Cloud Run deployment configuration for the Streamlit app.
BACKEND_API_BASE_URL = os.getenv("BACKEND_SERVICE_URI")
SCOPES = ['https://www.googleapis.com/auth/cloud-platform']
GENERATE_LLM_RESPONSE_ENDPOINT = "/generate-llm-response/rag-engine"  # As per your backend router

def get_full_api_url():
    """Constructs the full API URL for LLM response generation."""
    if not BACKEND_API_BASE_URL:
        st.error("Backend API URL is not configured. Please set the BACKEND_SERVICE_URI environment variable.")
        return None
    return f"{BACKEND_API_BASE_URL.rstrip('/')}{GENERATE_LLM_RESPONSE_ENDPOINT}"

def run():
    """
    Displays the Generate LLM Response page and handles submission.
    """
    st.set_page_config(
        page_title="Generate LLM Response",
        page_icon="💬",
        layout="wide"
    )
    st.title("💬 Generate LLM Response")
    st.markdown("Use your ingested data to generate responses from a large language model.")


    # Main form for generating responses
    with st.form("generate_llm_response_form"):
        # User prompt
        st.subheader("Your Question")
        prompt = st.text_area(
            "Enter your query",
            placeholder="Ask a question about your data...",
            height=100,
            help="The question you want to ask about your ingested data."
        )
        
        # Advanced Configuration section (collapsible)
        with st.expander("Advanced Configuration", expanded=False):
            # Model selection
            st.subheader("Model Settings")
            model_options = [
                "gemini-2.5-pro-preview-03-25",
                "gemini-2.5-flash-preview-04-17",
                "gemini-1.5-pro",
                "gemini-1.5-flash"
            ]
            model_name = st.selectbox(
                "Model",
                options=model_options,
                index=0,
                help="Select the AI model to use for generating responses."
            )
            system_instructions = st.text_area(
                "System Instructions",
                height=100,
                help="Instructions to guide the model's behavior (optional)."
            )
            
            # Generation settings
            st.subheader("Generation Settings")
            
            temperature = st.slider(
                "Temperature",
                min_value=0.0,
                max_value=2.0,
                value=1.0,
                step=0.1,
                help="Controls randomness in response generation. Lower values (close to 0) make responses more deterministic and focused, while higher values allow more creativity and variety."
            )
            
            top_p = st.slider(
                "Top-p (Nucleus Sampling)",
                min_value=0.0,
                max_value=1.0,
                value=0.95,
                step=0.01,
                help="Controls diversity by limiting token selection to a cumulative probability. A value of 0.95 means the model will only consider tokens comprising the top 95% of probability mass."
            )
            
            vector_distance_threshold = st.slider(
                "Vector Distance Threshold",
                min_value=0.0,
                max_value=1.0,
                value=0.8,
                step=0.01,
                help="Threshold for vector similarity (0-1). Higher values include only more semantically similar chunks, while lower values include a broader range of potentially relevant information."
            )
            
            # Ranker settings
            st.subheader("Ranking Settings")
            
            st.markdown("""
            **About Ranking Methods:**
            Ranking determines how retrieved chunks are prioritized before being sent to the model.
            """)
            
            ranking_method = st.radio(
                "Ranking Method",
                options=["Semantic Ranker", "LLM Ranker", "None"],
                index=0,
                help="Choose how retrieved information is ranked before being sent to the model."
            )
            
            # Conditional fields based on ranking method
            llm_ranker = None
            rank_service = None
            
            if ranking_method == "Semantic Ranker":
                st.markdown("""
                *Semantic Rankers* use embedding-based algorithms to rank chunks based on semantic relevance to your query. 
                They're fast, cost-effective, and work well for straightforward information retrieval needs.
                """)
                
                semantic_ranker_options = [
                    "semantic-ranker-default@latest",
                    "semantic-ranker-1@latest"
                ]
                rank_service = st.selectbox(
                    "Semantic Ranker Model",
                    options=semantic_ranker_options,
                    index=0,
                    help="Select the semantic ranking model to use. The default ranker provides a good balance of performance and quality."
                )
            elif ranking_method == "LLM Ranker":
                st.markdown("""
                *LLM Rankers* use a language model to evaluate and rank chunks based on their relevance to your query.
                They're more computationally intensive but can understand nuanced relationships between your query and the content.
                Use this for complex queries or when semantic similarity isn't enough.
                """)
                
                llm_ranker_options = [
                    "gemini-1.5-flash-002"
                ]
                llm_ranker = st.selectbox(
                    "LLM Ranker Model",
                    options=llm_ranker_options,
                    index=0,
                    help="The LLM model used for ranking. Gemini models provide high-quality ranking with good performance."
                )
            else:
                st.markdown("""
                *No Ranking* means chunks will be used based only on their initial vector similarity score without additional ranking.
                This is fastest but may not prioritize the most relevant information.
                """)
                
        
        # Submit button
        st.markdown("---")
        submitted = st.form_submit_button("🚀 Generate Response", type="primary", use_container_width=True)
    
    # Form submission logic
    if submitted:
        # Validate inputs
        if not prompt or prompt.strip() == "":
            st.error("⚠️ Please enter a question or prompt.")
        else:
            api_url = get_full_api_url()
            if api_url:
                # Prepare payload based on user selections
                payload = {
                    "prompt": prompt,
                    "system_instruction": system_instructions if len(system_instructions) != 0 else None,
                    "model_name": model_name,
                    "vector_distance_threshold": vector_distance_threshold,
                    "temperature": temperature,
                    "top_p": top_p,
                    "llm_ranker": llm_ranker,
                    "rank_service": rank_service if ranking_method == "Semantic Ranker" else None
                }
                
                # Display request information in a collapsible section
                with st.expander("Request Details", expanded=False):
                    st.json(payload)
                
                # Send request to backend
                with st.spinner("Generating response... This may take a moment."):
                    try:
                        headers = {"Content-Type": "application/json"}

                        # Fetch an identity token for authorization
                        auth_req = google.auth.transport.requests.Request()
                        id_token = google.oauth2.id_token.fetch_id_token(auth_req, BACKEND_API_BASE_URL)
                        headers["Authorization"] = f"Bearer {id_token}"

                        response = requests.post(api_url, json=payload, headers=headers)
                        
                        if response.status_code == 200:  # Success
                            try:
                                # Parse the response JSON
                                response_data = response.json()
                                
                                # Show warnings about pending or failed ingestion jobs if any
                                if response_data.get("pending_lros", False):
                                    st.warning("⚠️ There are pending data ingestion jobs. The response may not include the most recent data.")
                                
                                if response_data.get("failed_lros", False):
                                    st.warning("⚠️ There are failed data ingestion jobs. Some data may not be available for querying.")
                                
                                # Display the generated response
                                st.subheader("Response")
                                st.markdown(response_data.get("generated_response", "No response generated."))

                                # Creating a markdown list for Grounding Sources
                                file_uris = ''
                                for file_uri in response_data.get("grounding_sources", []):
                                    file_uris += "- " + file_uri + "\n"
                                    
                                # Display Grounding Sources
                                with st.expander("Grounding Sources", expanded=False):
                                    st.markdown(file_uris)
                                
                            except ValueError:
                                st.error("❌ Failed to parse response from server.")
                        else:
                            # Handle error responses
                            try:
                                error_data = response.json()
                                error_message = error_data.get("detail", str(error_data))
                            except ValueError:
                                error_message = response.text
                            
                            if response.status_code == 500:
                                st.error(f"❌ Server Error: {error_message}")
                            else:
                                st.error(f"❌ Error ({response.status_code}): {error_message}")
                    
                    except requests.exceptions.RequestException as e:
                        st.error(f"❌ Network or connection error: {e}")
            else:
                # Error for BACKEND_API_BASE_URL not being set is handled by get_full_api_url
                pass

if __name__ == "__main__":
    run()