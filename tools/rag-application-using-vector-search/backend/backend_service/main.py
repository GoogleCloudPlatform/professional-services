from fastapi import FastAPI
from routers.data_ingestion import router as data_ingestion_router
from routers.generate_llm_response import router as generate_llm_response_router

app = FastAPI()
app.include_router(data_ingestion_router, prefix="/data-ingestion", tags=["ingestion"])
app.include_router(generate_llm_response_router, prefix="/generate-llm-response", tags=["retrieval"])