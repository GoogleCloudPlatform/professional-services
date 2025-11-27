import vertexai
from vertexai import rag
import os


project_id = os.environ.get("PROJECT_ID")
location = os.environ.get("LOCATION")
corpus_display_name = os.environ.get("CORPUS_DISPLAY_NAME")
print(project_id)
print(location)
print(corpus_display_name)


def create_rag_corpus(
    project_id: str,
    location: str,
    corpus_display_name: str
):
    """
    Creates a Vertex AI RAG Corpus and imports a file.

    Args:
        project_id: The Google Cloud project ID.
        location: The GCP region to create the corpus in.
        corpus_display_name: The display name for the new corpus.
        gcs_bucket_uri: The GCS URI of the file(s) to import (e.g., "gs://bucket/file.pdf").
    """
    # Initialize the Vertex AI SDK
    vertexai.init(project=project_id, location=location)

    # Create a RAG corpus
    print(f"Creating RAG Corpus: {corpus_display_name}...")
    embedding_model_config = rag.RagEmbeddingModelConfig(
        vertex_prediction_endpoint=rag.VertexPredictionEndpoint(
            publisher_model="publishers/google/models/text-embedding-005"
        )
    )

    rag_corpus = rag.create_corpus(
        display_name=corpus_display_name,
        backend_config=rag.RagVectorDbConfig(
            rag_embedding_model_config=embedding_model_config
        ),
    )
    
    corpus_id = rag_corpus.name.split("/")[-1]
    print(f"Successfully created RAG Corpus with path: {rag_corpus.name}")
    print(f"Corpus ID: {corpus_id}")
    print(f"Display name: {rag_corpus.display_name}\n")

    return rag_corpus
    
create_rag_corpus(
    project_id=project_id,
    location=location,
    corpus_display_name=corpus_display_name
)
