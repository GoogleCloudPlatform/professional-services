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

import logging

# --- Setup Logging Globally First ---
from src.common.base_dto import AspectRatioEnum
from src.users.user_model import UserModel, UserRoleEnum
from src.config.logger_config import setup_logging

setup_logging()

import mimetypes
import os
from typing import Dict, List

from google.cloud.firestore_v1.base_query import FieldFilter

from bootstrap.seed_data import (
    TEMPLATES,
)  # pylint: disable=wrong-import-position
from src.auth import firebase_client_service

from src.common.storage_service import GcsService
from src.config.config_service import config_service
from src.media_templates.repository.media_template_repository import (
    MediaTemplateRepository,
)
from src.media_templates.schema.media_template_model import (
    GenerationParameters,
    MediaTemplateModel,
)
from src.source_assets.repository.source_asset_repository import (
    SourceAssetRepository,
)
from src.source_assets.schema.source_asset_model import (
    AssetScopeEnum as AssetScope,
)
from src.source_assets.schema.source_asset_model import (
    AssetTypeEnum as AssetType,
)
from src.source_assets.schema.source_asset_model import SourceAssetModel
from src.users.repository.user_repository import UserRepository
from src.workspaces.repository.workspace_repository import WorkspaceRepository
from src.workspaces.schema.workspace_model import (
    WorkspaceModel,
    WorkspaceScopeEnum,
)

logger = logging.getLogger(__name__)

# Get the absolute path of the directory where this script is located.
# This makes all file paths relative to the script's own location.
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))


def get_admin_user() -> str:
    return os.getenv("ADMIN_USER_EMAIL", "system")


def ensure_admin_user_exists():
    """
    Ensures a user document exists in Firestore for the admin running the script.
    If the user document doesn't exist, it creates one and assigns the 'admin' role.
    """
    logger.info("--- Ensuring Admin User Exists in Firestore ---")
    admin_email = get_admin_user()

    if admin_email == "system":
        logger.info(
            "Bootstrap running as 'system'. Skipping admin user creation."
        )
        return

    try:
        logger.info(f"Looking up Firebase user for email: {admin_email}")
        user_repo = UserRepository()
        # Use the dedicated repository method to find the user by email
        existing_user = user_repo.get_by_email(admin_email)

        if existing_user:
            logger.info(f"User document for '{admin_email}' already exists.")
        else:
            logger.warning(
                f"No user document found for email '{admin_email}'. Creating one."
            )
            name = admin_email.split("@")[0]
            logger.info(f"Setting user's default name to '{name}'.")

            new_user = UserModel(
                email=admin_email,
                name=name,
                roles=[UserRoleEnum.USER, UserRoleEnum.ADMIN],
            )
            user_repo.save(new_user)
            logger.info(
                f"Successfully created admin user document for '{admin_email}'."
            )

    except Exception as e:
        logger.error(
            f"Failed to create or verify admin user for '{admin_email}': {e}",
            exc_info=True,
        )
        logger.warning(
            "Please ensure the user exists in Firebase Authentication and that a user document is created in Firestore with the 'admin' role."
        )


def ensure_default_workspace_exists():
    """
    Checks if a public workspace exists and creates one if it doesn't.
    This is crucial for features like the public gallery.
    """
    try:
        logger.info("Checking for default public workspace...")
        workspace_repo = WorkspaceRepository()
        if not workspace_repo.get_public_workspace():
            logger.warning("No public workspace found. Creating a default one.")
            project_id = config_service.PROJECT_ID
            workspace_name = (
                project_id.replace("-", " ").replace("_", " ").title()
                + " Workspace"
            )

            default_workspace = WorkspaceModel(
                name=workspace_name,
                owner_id=get_admin_user(),
                scope=WorkspaceScopeEnum.PUBLIC,
                members=[],
            )
            workspace_repo.save(default_workspace)
            logger.info(
                f"Default public '{workspace_name}' created successfully."
            )
    except Exception as e:
        logger.error(
            f"Failed to ensure default workspace exists: {e}", exc_info=True
        )


def upload_assets_from_folder(
    local_folder: str, gcs_prefix: str
) -> Dict[str, str]:
    """
    Uploads all files from a local folder to a GCS path and returns a mapping.

    Args:
        local_folder: The local directory containing assets.
        gcs_prefix: The prefix (subfolder) in GCS to upload to.

    Returns:
        A dictionary mapping local filename to its new GCS URI.
    """
    gcs_service = GcsService()
    uri_map = {}
    logger.info(f"Uploading assets from '{local_folder}' to GCS...")

    # Construct an absolute path to the assets folder
    abs_local_folder = os.path.join(SCRIPT_DIR, "assets", local_folder)
    logger.info(
        f"Uploading assets from '{abs_local_folder}' to GCS prefix '{gcs_prefix}'..."
    )

    if not os.path.isdir(abs_local_folder):
        logger.warning(f"Local asset folder not found: {abs_local_folder}")
        return {}

    for filename in os.listdir(abs_local_folder):
        local_path = os.path.join(abs_local_folder, filename)

        if os.path.isfile(local_path):
            destination_blob_name = f"{gcs_prefix}/{filename}"
            mime_type, _ = mimetypes.guess_type(local_path)
            # Provide a default mime_type if it cannot be guessed
            if not mime_type:
                mime_type = "application/octet-stream"
            gcs_uri = gcs_service.upload_file_to_gcs(  # type: ignore
                local_path=local_path,
                destination_blob_name=destination_blob_name,
                mime_type=mime_type,
            )
            if gcs_uri:
                uri_map[filename] = gcs_uri
                logger.info(f"  - Uploaded {filename} to {gcs_uri}")
    return uri_map


def seed_media_templates():
    """
    Uploads media template assets and seeds the media_templates collection.
    """
    logger.info("--- Starting Media Template Seeding ---")
    template_repo = MediaTemplateRepository()

    # 1. Upload all assets first
    uri_map = upload_assets_from_folder(
        "media-template", "media_template_assets"
    )
    # 2. Iterate through template data and create documents
    for template_data in TEMPLATES:
        template_name = template_data["name"]
        existing = template_repo.find_by_filter(
            FieldFilter("name", "==", template_name)
        )
        if existing:
            logger.info(f"Template '{template_name}' already exists. Skipping.")
            continue

        logger.info(f"Creating template: '{template_name}'")

        # Map local URIs to GCS URIs
        gcs_uris = [
            uri
            for local_uri in template_data.get("local_uris", [])
            if (uri := uri_map.get(local_uri)) is not None
        ]

        if not gcs_uris:
            logger.warning(
                f"  - No assets found/uploaded for template '{template_name}'. Skipping."
            )
            continue

        # Create the Pydantic models
        gen_params = GenerationParameters(
            **template_data["generation_parameters"]
        )
        new_template = MediaTemplateModel(
            name=template_name,
            description=template_data["description"],
            mime_type=template_data["mime_type"],
            industry=template_data.get("industry"),
            brand=template_data.get("brand"),
            tags=template_data.get("tags", []),
            gcs_uris=gcs_uris,
            thumbnail_uris=[],  # Can be generated later if needed
            generation_parameters=gen_params,
        )

        template_repo.save(new_template)
        logger.info(f"  - Successfully saved template '{template_name}'.")


def seed_vto_assets():
    """
    Uploads system-level VTO assets (garments, models) for the VTO feature.
    """
    logger.info("--- Starting VTO System Asset Seeding ---")
    asset_repo = SourceAssetRepository()
    workspace_repo = WorkspaceRepository()
    public_workspace = workspace_repo.get_public_workspace()

    if not public_workspace:
        logger.error("Cannot seed VTO assets: Public workspace not found.")
        return

    vto_asset_folders = ["vto/garments", "vto/models"]

    for folder in vto_asset_folders:
        local_folder = folder
        gcs_prefix = f"system_assets/{folder}"
        mime_type = "image/png"  # Assuming all VTO assets are PNGs

        uri_map = upload_assets_from_folder(local_folder, gcs_prefix)

        for filename, gcs_uri in uri_map.items():
            # Check if an asset with this GCS URI already exists
            existing = asset_repo.find_by_filter(
                FieldFilter("gcs_uri", "==", gcs_uri)
            )
            if existing:
                logger.info(
                    f"VTO asset for '{gcs_uri}' already exists. Skipping."
                )
                continue

            # --- Dynamically determine asset type from filename convention ---
            asset_type = None
            try:
                # Get filename without extension, e.g., "vto_top_0"
                base_name = os.path.splitext(filename)[0]
                # Split by underscore and remove the last part (the index)
                type_parts = base_name.split("_")[:-1]
                # Join the remaining parts to get the type string, e.g., "vto_top"
                type_string = "_".join(type_parts)
                # Convert the string to an AssetType enum member
                asset_type = AssetType(type_string)
                logger.info(
                    f"  - Detected asset type as '{asset_type.value}' for {filename}"
                )
            except (ValueError, IndexError):
                logger.warning(
                    f"  - Could not determine asset type for '{filename}' from its name. Skipping."
                )
                continue

            logger.info(f"Creating VTO asset for: {filename}")
            new_asset = SourceAssetModel(
                workspace_id=public_workspace.id,
                original_filename=filename,
                gcs_uri=gcs_uri,
                mime_type=mime_type,  # type: ignore
                file_hash="",  # Not strictly needed for system assets
                scope=AssetScope.SYSTEM,
                asset_type=asset_type,
                user_id=get_admin_user(),
                aspect_ratio=AspectRatioEnum.RATIO_9_16,
            )
            asset_repo.save(new_asset)
            logger.info(f"  - Successfully saved VTO asset '{filename}'.")


if __name__ == "__main__":
    ensure_admin_user_exists()
    ensure_default_workspace_exists()
    seed_vto_assets()
    seed_media_templates()
