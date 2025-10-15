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
from typing import List

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from firebase_admin import auth

# --- Google Auth for Identity Platform ---
from google.auth.transport import requests as google_auth_requests
from google.oauth2 import id_token

from src.config.config_service import config_service
from src.users.user_model import UserModel, UserRoleEnum
from src.users.user_service import UserService

# Initialize the service once to be used by dependencies.
user_service = UserService()

# This scheme will require the client to send a token in the Authorization header.
# It tells FastAPI how to find the token but doesn't validate it itself.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


logger = logging.getLogger(__name__)


def get_current_user(token: str = Depends(oauth2_scheme)) -> UserModel:
    """
    Dependency that handles the entire authentication and user provisioning flow.

    1. Verifies the Firebase ID token.
    2. Extracts user information (id, email).
    3. Checks if a user document exists in Firestore.
    4. If the user is new, creates their document ("Just-In-Time Provisioning").
    5. Returns a Pydantic model with the user's data.
    """
    try:
        decoded_token = {}
        if config_service.ENVIRONMENT == "local":
            # --- Local: Use Firebase Auth ---
            # Verifies the token using the standard Firebase Admin SDK method.
            logger.info("Verifying token using Firebase Admin SDK...")
            decoded_token = auth.verify_id_token(token)
        else:
            # --- Development/Production: Use Google Identity Platform (OIDC) ---
            # Verifies the Google-issued OIDC ID token. The audience must be the
            # OAuth 2.0 client ID of the Identity Platform-protected resource.
            GOOGLE_TOKEN_AUDIENCE = config_service.GOOGLE_TOKEN_AUDIENCE
            decoded_token = id_token.verify_oauth2_token(
                token,
                google_auth_requests.Request(),
                audience=GOOGLE_TOKEN_AUDIENCE,
            )

        email = decoded_token.get("email")
        name = decoded_token.get("name")
        picture = decoded_token.get("picture")
        token_info_hd = decoded_token.get("hd")

        # Restrict by particular organizations if it's a closed environment
        if not email:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: User identity could not be confirmed from token.",
            )

        # If ALLOWED_ORGS is configured, check the user's organization.
        if config_service.ALLOWED_ORGS:
            if (
                not token_info_hd
                or token_info_hd not in config_service.ALLOWED_ORGS
            ):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"User from '{token_info_hd}' is not part of an allowed organization.",
                )

        # Just-In-Time (JIT) User Provisioning:
        # Create a user profile in our database on their first API call.
        user_doc = user_service.create_user_if_not_exists(
            email=email, name=name, picture=picture
        )

        if not user_doc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not create or retrieve user profile.",
            )

        return user_doc

    except auth.ExpiredIdTokenError:
        logger.error(f"[get_current_user - auth.ExpiredIdTokenError]")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired.",
        )
    except auth.InvalidIdTokenError as e:
        logger.error(f"[get_current_user - auth.InvalidIdTokenError]: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {e}",
        )
    except HTTPException as e:
        logger.error(f"[get_current_user - Exception]: {e}")
        raise e
    except Exception as e:
        logger.error(f"[get_current_user - Exception]: {e}")
        raise HTTPException(
            status_code=getattr(
                e, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=f"An unexpected error occurred during authentication: {e}",
        )


class RoleChecker:
    """
    Dependency that checks if the authenticated user has the required roles.
    It depends on `get_current_user` to ensure the user is authenticated first.
    """

    def __init__(self, allowed_roles: List[UserRoleEnum]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: UserModel = Depends(get_current_user)):
        """
        Checks the user's roles against the allowed roles.
        """
        is_authorized = any(role in self.allowed_roles for role in user.roles)

        if not is_authorized:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have sufficient permissions to perform this action.",
            )
