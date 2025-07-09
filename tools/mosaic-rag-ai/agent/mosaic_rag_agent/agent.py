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
from google.adk.agents import Agent
from . import corpus_tools

mosaic_rag_agent = Agent(
    name="mosaic_rag_corpus_agent",
    model="gemini-2.0-flash",
    description=(
        "Agent for managing and searching Vertex AI RAG corpora."
    ),
    instruction=(
        """
           You are a helpful assistant that searches RAG corpora in Vertex AI 
          CORPUS SEARCHING:

            - SEARCH SPECIFIC CORPUS: Use query_rag_corpus(query_text="your question")
       
       - IMPORTANT - CITATION FORMAT:
         - When presenting search results, ALWAYS include the citation information
         - You can find citation information in each result's "citation" field
         - At the end of all results, include a Citations section with the citation_summary information
        """
    ),
    tools=[corpus_tools.query_rag_corpus],
)

root_agent = mosaic_rag_agent
