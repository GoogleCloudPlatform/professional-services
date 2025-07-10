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
import vertexai
from vertexai.preview import rag
from google.adk.tools import FunctionTool
from typing import Dict, Optional, Any
from mosaic_rag_agent.rag_config import (
    PROJECT_ID,
    LOCATION,
    RAG_DEFAULT_TOP_K,
    CORPUS_PATH,
    RAG_DEFAULT_VECTOR_DISTANCE_THRESHOLD
)

# Initialize Vertex AI API
vertexai.init(project=PROJECT_ID, location=LOCATION)

# Function for simple direct corpus querying
def query_rag_corpus(
    query_text: str,
    top_k: Optional[int] = None,
    vector_distance_threshold: Optional[float] = None
) -> Dict[str, Any]:
    """
    Directly queries a RAG corpus using the Vertex AI RAG API.
    
    Args:
        query_text: The search query text
        top_k: Maximum number of results to return (default: 10)
        vector_distance_threshold: Threshold for vector similarity (default: 0.5)
        
    Returns:
        A dictionary containing the query results
    """
    if top_k is None:
        top_k = RAG_DEFAULT_TOP_K
    if vector_distance_threshold is None:
        vector_distance_threshold = RAG_DEFAULT_VECTOR_DISTANCE_THRESHOLD
    try:
        # Construct full corpus resource path
        corpus_path = CORPUS_PATH
        
        # Create the resource config
        rag_resource = rag.RagResource(rag_corpus=corpus_path)
        
        # Configure retrieval parameters
        retrieval_config = rag.RagRetrievalConfig(
            top_k=top_k,
            filter=rag.utils.resources.Filter(vector_distance_threshold=vector_distance_threshold)
        )
        
        # Execute the query directly using the API
        response = rag.retrieval_query(
            rag_resources=[rag_resource],
            text=query_text,
            rag_retrieval_config=retrieval_config
        )
        
        # Process the results
        results = []
        if hasattr(response, "contexts"):
            # Handle different response structures
            contexts = response.contexts
            if hasattr(contexts, "contexts"):
                contexts = contexts.contexts
            
            # Extract text and metadata from each context
            for context in contexts:
                result = {
                    "text": context.text if hasattr(context, "text") else "",
                    "source_uri": context.source_uri if hasattr(context, "source_uri") else None,
                    "relevance_score": context.relevance_score if hasattr(context, "relevance_score") else None
                }
                results.append(result)
        
        return {
            "status": "success",
            "corpus_path": CORPUS_PATH,
            "results": results,
            "count": len(results),
            "query": query_text,
            "message": f"Found {len(results)} results for query: '{query_text}'"
        }
        
    except Exception as e:
        return {
            "status": "error",
            "corpus_path": CORPUS_PATH,
            "error_message": str(e),
            "message": f"Failed to query corpus: {str(e)}"
        }