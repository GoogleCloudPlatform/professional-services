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
    return 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjgzOGMwNmM2MjA0NmMyZDk0OGFmZmUxMzdkZDUzMTAxMjlmNGQ1ZDEiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXpwIjoiNjE4MTA0NzA4MDU0LTlyOXMxYzRhbGczNmVybGl1Y2hvOXQ1Mm4zMm42ZGdxLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiYXVkIjoiNjE4MTA0NzA4MDU0LTlyOXMxYzRhbGczNmVybGl1Y2hvOXQ1Mm4zMm42ZGdxLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTA2MjEyOTA0NTQ3Mjc3MTY4MTA2IiwiaGQiOiJnb29nbGUuY29tIiwiZW1haWwiOiJwdXNocGRlZXBAZ29vZ2xlLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoiNkNfaEtWNDREWkJwWktWYUcySlBQUSIsIm5iZiI6MTY5NDQxMzA4MCwiaWF0IjoxNjk0NDEzMzgwLCJleHAiOjE2OTQ0MTY5ODAsImp0aSI6Ijc1OTVjOWE2ZjJhMjAyNDg1ZDcxZWYxZTE3NmQ2NDc2MzhiYzAwMTQifQ.Iqmpp41Oaa_v0VDVoLg1jq0BIM9OQvboL7jquAsnMdxazmC4Tdg1T_Esfs9MN3tM4gkT1j37jTZZ1WCHIrhudG5U--NLQD6Zv9WCoDooKJ7XEZthgWJQemErEN7D7g6WEF8LZUNlOy3amb9pRZdipBpXl8ns9ky4JikRFWgem_VHSQM8ouQSah5YslbI8oko4xVXPFHtf-JGKWH0uai8-zrLyK5Mr2SpJZI7aS6JIDEkkbOX4KyOI0edm_mzKobm6ZilzP4IK6r1v-AGTose0_IUCWYbOfW8-BaT62JN3s6OwBnepvc3rgFZpaZs7Vn7loloU04fxZtwjjJURZYy6A'
    #return id_token

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
