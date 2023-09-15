# ============================================================================
# Copyright 2023 Google. This software is provided as-is, without warranty or
# representation for any use or purpose. Your use of it is subject to your
# agreement with Google.
# ============================================================================

"""This module defines handlers(methods) to handle event's raised by UI components."""

import configparser
from google.cloud import speech
import gradio as gr
from middleware import MiddlewareService
from models.session_info import SessionInfo


class EventHandlers:
  """A class to define event handlers for chat bot UI components.

  Attributes:
        config: A configparser having gradio configurations loaded from
          config.ini file.
        middleware_service: A middleware service to get bot responses.
  """

  config: configparser.ConfigParser()
  middleware_service: MiddlewareService

  def __init__(self, config: configparser.ConfigParser):
    self.config = config
    self.middleware_service = MiddlewareService()

  def transcribe_file(self, speech_file: str) -> speech.RecognizeResponse:
    """Transcribe the audio file and returns converted text.

    Args:
            speech_file (str): Path to speech file.

    Returns:
            text (speech.RecognizeResponse): Generated string for the
            input speech.
    """
    text = ""
    client = speech.SpeechClient()

    with open(speech_file, "rb") as audio_file:
      content = audio_file.read()

    audio = speech.RecognitionAudio(content=content)
    config = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
        language_code="en-US",
    )

    response = client.recognize(config=config, audio=audio)

    # Each result is for a consecutive portion of the audio. Iterate through
    # them to get the transcripts for the entire audio file.
    for result in response.results:
      # The first alternative is the most likely one for this portion.
      text = result.alternatives[0].transcript

    return text

  def add_user_input(self, history, text):
    """Adds user input to chat history.

    Args:
            history (dict): A dictionary that stores user's chat.
            text (str): String input to chat bot.

    Returns:
            history (dict): A dictionary that stores user's chat.
    """
    if bool(text):
      history = history + [(text, None)]
    return history, gr.update(value="", interactive=False)

  def clear_history(self, history, session):
    """Clear chat history.

    Args:
            history (dict): A dictionary that stores user's chat.
            session: current session object.

    Returns:
            history (dict): A dictionary that stores user's chat.
            session: current session object.
            source_location(None): To clear source location textbox.
    """
    history = [(None, self.config["initial-message"])]
    session = []
    session.append(SessionInfo())
    return history, session, None

  def bot_response(self, history, session):
    """Returns session, source location and chat history with the updated Bot response.

    Args:
            history (dict): A dictionary that stores user's chat.
            session: current session object.

    Returns:
            history (dict): A dictionary that stores user's chat.
            session: current session object.
            source_location: string representing manual/spec location. Usually a
            gcs link.
    """
    if not session:
      session.append(SessionInfo())

    session_info: SessionInfo = session[0]
    response = ""
    source_location = ""
    if history[-1][0] is None:
      return history, session
    else:
      model_response = self.middleware_service.get_bot_response(
          history[-1][0], session_info
      )
      if model_response is None:
        response = self.config["error-response"]
      else:
        response = model_response.output_text
        source_location = model_response.gcs_link

    if not bool(response):
      response = self.config["error-response"]

    history[-1][1] = response
    return (history, session, source_location)
