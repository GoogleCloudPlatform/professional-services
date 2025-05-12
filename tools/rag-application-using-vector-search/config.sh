#!/bin/bash

export PROJECT_ID="<gcp-project-id>"
export REGION="us-central1"
export DEPLOYMENT_ID="rag"
export RAG_CORPUS_DISPLAY_NAME="rag-corpus-fin"
export INDEX_DIMENSIONS=768
export TEXT_EMBEDDING_MODEL="projects/${PROJECT_ID}/locations/${REGION}/publishers/google/models/text-embedding-005"