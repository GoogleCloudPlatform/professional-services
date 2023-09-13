# ============================================================================
# Copyright 2023 Google. This software is provided as-is, without warranty or
# representation for any use or purpose. Your use of it is subject to your
# agreement with Google.
# ============================================================================

"""Module to fetch responses from Gen AI agent."""


import configparser
from google.cloud.dialogflowcx_v3beta1.services.agents import AgentsClient
from google.cloud.dialogflowcx_v3beta1.services.sessions import SessionsClient
from google.cloud.dialogflowcx_v3beta1.types import session


class DetectIntent:
  """A class to provide LLM reponse.

  Attributes:
          config: A configparser having dialogflow configurations loaded from
            config.ini file.
  """

  config: configparser.ConfigParser()

  def __init__(self, config) -> None:
    self.config = config

  def get_llm_response(self, query: str, session_id: str) -> str:
    """Get the reponse from Gen AI agent.

    Args:
            query (str): User's query.
            session_id: Unique session id.

    Returns:
            str: LLM reponse.
    """
    project_id = self.config["project-id"]
    location_id = self.config["location-id"]
    agent_id = self.config["agent-id"]
    agent = f"projects/{project_id}/locations/{location_id}/agents/{agent_id}"
    texts = [query]
    language_code = self.config["language-code"]

    return self.detect_intent(agent, session_id, texts, language_code)

  def detect_intent(self, agent, session_id, texts, language_code) -> str:
    """Detects intent and get the reponse from LLM.

    Args:
            agent (str): Dialogflow agent to connect.
            session_id: Unique session id.
            texts: list of user queries.
            language_code: the langaue code to be used to communicate with
              agent.

    Returns:
            ModelResponse: LLM reponse.
    """
    session_path = f"{agent}/sessions/{session_id}"
    client_options = None
    agent_components = AgentsClient.parse_agent_path(agent)
    location_id = agent_components["location"]
    if location_id != "global":
      api_endpoint = f"{location_id}-dialogflow.googleapis.com:443"
      client_options = {"api_endpoint": api_endpoint}
    session_client = SessionsClient(client_options=client_options)

    output = ""
    links = ""
    for text in texts:
      text_input = session.TextInput(text=text)
      query_input = session.QueryInput(
          text=text_input, language_code=language_code
      )
      request = session.DetectIntentRequest(
          session=session_path, query_input=query_input
      )
      response = session_client.detect_intent(request=request)
      for msg in response.query_result.response_messages:
        if msg.text and msg.text.text:
          output = output.join(msg.text.text)
        if msg.payload is not None and msg.payload["richContent"] is not None:
          for rc in msg.payload["richContent"]:
            links = links.join(rc[0]["actionLink"]) + "\n"

    return output, links
