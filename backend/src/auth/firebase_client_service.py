# Copyright 2024 Google LLC
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
import os

import firebase_admin
import google.auth
from fastapi import HTTPException, status
from firebase_admin import auth, credentials, firestore
from google.auth.exceptions import RefreshError
from google.cloud import resourcemanager_v3

from src.config.config_service import config_service

logger = logging.getLogger(__name__)


class FirebaseClient:
    """
    A class to initialize the Firebase Admin SDK and provide access to Firestore and Auth.
    """

    def __init__(self):
        """
        Initializes the Firebase Admin SDK with credentials and creates a Firestore client.
        """
        try:
            # Init Firebase Creds
            if not firebase_admin._apps:  # Check if already initialized
                cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")

                if cred_path:
                    logger.info(
                        f"Initializing Firebase Admin SDK with credentials from: {cred_path}"
                    )
                    if not os.path.exists(cred_path):
                        # If path is provided but file doesn't exist, it's a configuration error.
                        raise FileNotFoundError(
                            f"Firebase credentials file specified but not found at {cred_path}"
                        )
                    cred = credentials.Certificate(cred_path)
                    firebase_admin.initialize_app(cred)
                else:
                    # If FIREBASE_CREDENTIALS_PATH is not set,
                    # try to initialize with Application Default Credentials (ADC).
                    # This is typical for Cloud Run, GCE, GKE, App Engine, etc.
                    logger.info("Initializing Firebase Admin SDK using ADC.")
                    firebase_admin.initialize_app()
                    # If ADC are not found or lack permissions, this will raise an error.
                    # e.g., google.auth.exceptions.DefaultCredentialsError

                logger.info(
                    f"Firebase App Name: {firebase_admin.get_app().name}"
                )

                # Check if reauthentication is needed
                self.check_adc_authentication()

        except Exception as e:
            logger.critical(
                f"CRITICAL: Error initializing Firebase Admin SDK: {e}",
                exc_info=True,
            )
            raise RuntimeError(f"Failed to initialize Firebase Admin SDK: {e}")

        db_name = config_service.FIREBASE_DB
        logger.info(f"Connecting to Firestore database: '{db_name}'")

    def check_adc_authentication(self):
        """
        Checks if Application Default Credentials (ADC) are valid by making a
        lightweight API call.

        Returns:
            bool: True if authentication is successful, False otherwise.
        """
        try:
            # 1. Attempt to find and load ADC
            credentials, project_id = google.auth.default()

            # If no project ID is found, credentials might be for a service account
            # but we need a project to make a test call.
            if not project_id:
                logger.warning(
                    "Could not determine project ID from ADC. "
                    "Unable to perform a live authentication check."
                )
                # You might still consider this a success if credentials exist
                return credentials is not None

            logger.info(
                f"ADC found for project: {project_id}. Attempting a test API call..."
            )

            # 2. Make a lightweight, authenticated API call to test the credentials
            client = resourcemanager_v3.ProjectsClient(credentials=credentials)  # type: ignore
            project_name = f"projects/{project_id}"
            client.get_project(
                name=project_name
            )  # This call requires 'resourcemanager.projects.get' permission

            logger.info("✅ ADC Authentication successful.")
            return True

        except RefreshError as e:
            # This is the specific error for expired user credentials
            logger.critical(
                "❌ ADC REAUTHENTICATION NEEDED. "
                f"Please run `gcloud auth application-default login`. Details: {e}"
            )
            raise e
        except Exception as e:
            # Catch other potential exceptions (e.g., permissions, project not found)
            logger.error(f"An unexpected error occurred during ADC check: {e}")
            raise e


firebase_client = FirebaseClient()



def create_firebase_user(email: str, password: str):
    try:
        user_record = auth.create_user(email=email, password=password)
        return user_record
    except auth.EmailAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered with Firebase.",
        )
    except Exception as e:
        logger.error(
            f"Error creating Firebase user {email}: {e}", exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not create user in Firebase.",  # Avoid leaking raw error details to client
        )


def verify_firebase_token(id_token: str):
    try:
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Firebase ID token has expired.",
        )
    except auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Firebase ID token.",
        )
    except Exception as e:
        logger.error(
            f"Unexpected error verifying Firebase token: {e}", exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not process token.",
        )
