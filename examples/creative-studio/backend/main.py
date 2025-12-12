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

# --- Setup Logging Globally First ---
from src.config.logger_config import setup_logging

setup_logging()

import logging
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager
from os import getenv

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.audios.audio_controller import router as audio_router
from src.auth import firebase_client_service
from src.brand_guidelines.brand_guideline_controller import (
    router as brand_guideline_router,
)
from src.galleries.gallery_controller import router as gallery_router
from src.generation_options.generation_options_controller import (
    router as generation_options_router,
)
from src.images.imagen_controller import router as imagen_router
from src.media_templates.media_templates_controller import (
    router as media_template_router,
)
from src.multimodal.gemini_controller import router as gemini_router
from src.source_assets.source_asset_controller import (
    router as source_asset_router,
)
from src.users.user_controller import router as user_router
from src.videos.veo_controller import router as video_router
from src.workspaces.workspace_controller import router as workspace_router

# Get a logger instance for use in this file. It will inherit the root setup.
logger = logging.getLogger(__name__)


def configure_cors(app):
    """Configures CORS middleware based on the environment."""
    environment = getenv("ENVIRONMENT")
    allowed_origins = []

    if environment == "production":
        frontend_url = getenv("FRONTEND_URL")
        if not frontend_url:
            raise ValueError(
                "FRONTEND_URL environment variable not set in production"
            )
        allowed_origins.append(frontend_url)
    elif environment in ["development", "test", "local"]:
        allowed_origins.append("*")  # Allow all origins in development
    else:
        raise ValueError(
            f"Invalid ENVIRONMENT: {environment}. Must be 'production', 'development' or 'local'"
        )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for the FastAPI application.
    Handles startup and shutdown logic.
    """
    # --- Startup ---
    logger.info("Starting up application...")
    
    # Initialize Firebase Admin SDK (Auth only)
    try:
        from src.auth.firebase_client_service import firebase_client
        # Trigger initialization
        _ = firebase_client
    except Exception as e:
        logger.error(f"Failed to initialize Firebase: {e}")

    # Run Database Migrations
    try:
        from src.database_migrations import run_pending_migrations
        await run_pending_migrations()
    except Exception as e:
        logger.error(f"Failed to run database migrations: {e}")
        # We might want to stop startup here if migrations fail
        raise e

    logger.info("Creating ThreadPoolExecutor...")
    # Create the pool and attach it to the app's state
    app.state.executor = ThreadPoolExecutor(max_workers=4)

    yield

    logger.info("Application shutdown terminating")

    logger.info("Closing ThreadPoolExecutor...")
    app.state.executor.shutdown(wait=True)
    # Your shutdown logic here, e.g., closing database connections


app = FastAPI(
    lifespan=lifespan,
    title="Creative Studio API",
    description="""GenMedia Creative Studio is an app that highlights the capabilities
    of Google Cloud Vertex AI generative AI creative APIs, including Imagen, Veo, Lyria, Chirp and more! 🚀""",
)


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """
    This is the global 'catch-all' exception handler.
    It catches any exception that is not specifically handled by other exception handlers.
    """
    # Log the full error for debugging purposes
    logger.error(
        f"Unhandled exception for request {request.method} {request.url}: {exc}",
        exc_info=True,
    )

    # Return a standardized 500 Internal Server Error response
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred."},
    )


@app.get("/", tags=["Health Check"])
async def root():
    return "You are calling Creative Studio Backend"


@app.get("/api/version", tags=["Health Check"])
def version():
    return "v0.0.1"


configure_cors(app)

app.include_router(imagen_router)
app.include_router(audio_router)
app.include_router(video_router)
app.include_router(gallery_router)
app.include_router(gemini_router)
app.include_router(user_router)
app.include_router(generation_options_router)
app.include_router(media_template_router)
app.include_router(source_asset_router)
app.include_router(workspace_router)
app.include_router(brand_guideline_router)
