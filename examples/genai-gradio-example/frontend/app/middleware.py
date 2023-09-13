# ============================================================================
# Copyright 2023 Google. This software is provided as-is, without warranty or
# representation for any use or purpose. Your use of it is subject to your
# agreement with Google.
# ============================================================================

"""Module to call Middleware APIs to generate Bot responses."""

import configparser
import logging
import google.oauth2.id_token
from models.middleware_reponse import ModelResponse
from models.session_info import SessionInfo
import requests


class MiddlewareService:
  """A class defines methods to get responses from Middleware API.

  Attributes:
          api_config: A configparser having middleware api configurations loaded
            from config.ini file.
  """

  def __init__(self):
    config = configparser.ConfigParser()
    config.read("config.ini")
    self.api_config = config["api-config"]

  def get_id_token(self, url: str):
    """generate identity token for authentication.

    Args:
            url (str): Middleware API host url to generate token for.

    Returns:
            id_token: Identity token.
    """
    auth_req = google.auth.transport.requests.Request()
    id_token = google.oauth2.id_token.fetch_id_token(auth_req, url)
    return id_token

  def get_bot_response(
      self, user_input: str, session_info: SessionInfo
  ) -> ModelResponse:
    """Calls middleware to get bot responses.

    Args:
            user_input (str): User input.
            session_info: A SessionInfo object storing session id. information.

    Returns:
            model_res: A ModelResponse object storing LLM response and source
            location.
    """
    try:
      headers = {
          "Authorization": (
              f"Bearer {self.get_id_token(self.api_config['llm-mw-endpoint'])}"
          )
      }
      response = requests.post(
          self.api_config["llm-mw-endpoint"]
          + self.api_config["get-llm-response"],
          json={"user_input": user_input, "session_id": session_info.id},
          headers=headers,
      )
      response.raise_for_status()
      jsonres = response.json()
      model_res = ModelResponse()
      model_res.output_text = jsonres["output"]
      model_res.gcs_link = jsonres["gcs_link"] if "gcs_link" in jsonres else ""
      return model_res
    except requests.exceptions.HTTPError as err:
      logging.error(err)
