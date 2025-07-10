# Copyright 2025 Google LLC
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
"""
Configuration settings for the Vertex AI RAG engine.
"""
import os
from dotenv import load_dotenv

# Load environment variables from a .env file for local development
load_dotenv()

# Google Cloud Project Settings
PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT")  # Replace with your project ID
LOCATION = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")  # Default location for Vertex AI and GCS resources

# RAG Corpus Settings
CORPUS_PATH = os.environ.get("VERTEX_AI_RAG_CORPUS_ID")  # Replace with your project ID
RAG_DEFAULT_TOP_K = 10  # Default number of results for single corpus query
RAG_DEFAULT_VECTOR_DISTANCE_THRESHOLD = 0.5