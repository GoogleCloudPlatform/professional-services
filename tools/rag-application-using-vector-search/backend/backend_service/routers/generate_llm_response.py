import logging
import os
from google import genai
from google.genai import types
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from google.cloud import firestore
from models.generate_llm_response_models import GenerateLlmResponseConfig

router = APIRouter()
logger = logging.getLogger(__name__)

PROJECT_ID = os.getenv("PROJECT_ID")
LOCATION = os.getenv("REGION")
CORPUS_NAME = os.getenv("CORPUS_NAME")
DATABASE_NAME = os.getenv("DATABASE_NAME")
PENDING_LRO_COLLECTION_NAME = "pending_lro"
FAILED_LRO_COLLECTION_NAME = "failed_lro"

db = firestore.Client(project=PROJECT_ID, database=DATABASE_NAME)
genai_client = genai.Client(vertexai=True, project=PROJECT_ID, location=LOCATION)

@router.post(path="/rag-engine")
def trigger_generate_llm_response_job(data: GenerateLlmResponseConfig):
  """Populates the rag retrieval tool from the user provided
     `GenerateLlmResponseConfig` and then generate a LLM response using
     Generative Model. Also checks if there is some pending/failed data
     ingestion jobs by querying the firestore DB.
     
  Args:
      data (GenerateLlmResponseConfig): Configuration for the generate llm response
      operation.

  Returns:
      dict: A dictionary containing the warning if there are any pending
      /failed ingestion operations and llm generated response.

  Raises:
      HTTPException: If an error occurs.
  """
  try:
    model = data.model_name
    contents = [
      types.Content(
        role="user",
        parts=[
          types.Part.from_text(text=data.prompt)
        ]
      ),
    ]
    tools = [
      types.Tool(
        retrieval=types.Retrieval(
          vertex_rag_store=types.VertexRagStore(
            rag_resources=[
              types.VertexRagStoreRagResource(
                rag_corpus=CORPUS_NAME
              )
            ],
            vector_distance_threshold=data.vector_distance_threshold,
            rag_retrieval_config=types.RagRetrievalConfig(
              ranking=types.RagRetrievalConfigRanking(
                llm_ranker=types.RagRetrievalConfigRankingLlmRanker(
                  model_name=data.llm_ranker
                ) if data.llm_ranker is not None else None,
                rank_service=types.RagRetrievalConfigRankingRankService(
                  model_name=data.rank_service
                ) if (data.rank_service is not None and data.llm_ranker is None) else None
              )
            )
          )
        )
      )
    ]
    generate_content_config = types.GenerateContentConfig(
      temperature = data.temperature,
      top_p = data.top_p,
      max_output_tokens = 8192,
      response_modalities = ["TEXT"],
      system_instruction =[
            types.Part.from_text(text=data.system_instruction),
        ] if data.system_instruction is not None else None,
      tools = tools,
    )

    generated_response = genai_client.models.generate_content(
      model = model,
      contents = contents,
      config = generate_content_config
    )
    
    failed_lro_count = db.collection(FAILED_LRO_COLLECTION_NAME).count().get()
    pending_lro_count = db.collection(PENDING_LRO_COLLECTION_NAME).count().get()
    
    failed_lros = True if failed_lro_count[0][0].value > 0 else False
    pending_lros = True if pending_lro_count[0][0].value > 0 else False

    grounding_sources = []
    if generated_response.candidates:
      for candidate in generated_response.candidates:
        if not candidate.grounding_metadata or not candidate.grounding_metadata.grounding_chunks:
          continue
        for grounding_chunk in candidate.grounding_metadata.grounding_chunks:
          if not grounding_chunk.retrieved_context:
            continue
          if grounding_chunk.retrieved_context.uri:
            grounding_sources.append(grounding_chunk.retrieved_context.uri)
    
    grounding_sources = list(set(grounding_sources))

    response = {
      "failed_lros": failed_lros,
      "pending_lros": pending_lros,
      "generated_response": generated_response.text,
      "grounding_sources": grounding_sources
    }

    return JSONResponse(
      status_code=200,
      content=response
    )
  except Exception as e:
    logger.error(f"Error triggering Generate LLM Response job: {str(e)}")
    raise HTTPException(status_code=500, detail=str(e))

