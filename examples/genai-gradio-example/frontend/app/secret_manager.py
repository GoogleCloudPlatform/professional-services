# ============================================================================
# Copyright 2023 Google. This software is provided as-is, without warranty or
# representation for any use or purpose. Your use of it is subject to your
# agreement with Google.
# ============================================================================

"""This module communicates with secret manager to get secret values."""

import configparser
from google.cloud import secretmanager


class SecretManager:
  """SecretManager class to load secrets from GCP secret manager service.

  Attributes:
      config: A configparser having secret configurations loaded from config.ini
        file.
  """

  def __init__(self, config: configparser):
    """Initialize class and load secret manager configurations.

    Args:
        config: A configparser having secret configurations loaded from
          config.ini file.
    """
    self.config = config

  def access_secret_version(self, secret_id: str, version_id="latest") -> str:
    """Read secret value from secret manager.

    Args:
        secret_id: A string id from secret manager to identify secret.
        version_id: A string id representing secret version.

    Returns:
        Secret value.
    """
    client = secretmanager.SecretManagerServiceClient()
    name = f"projects/{self.config['sm-project-id']}/secrets/{secret_id}/versions/{version_id}"
    response = client.access_secret_version(name=name)
    return response.payload.data.decode("UTF-8")
