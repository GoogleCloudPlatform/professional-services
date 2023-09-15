# ============================================================================
# Copyright 2023 Google. This software is provided as-is, without warranty or
# representation for any use or purpose. Your use of it is subject to your
# agreement with Google.
# ============================================================================

"""This module is an entry point for the application to launch user interface."""

import configparser
import os
import sys
from bot_interface import BotInterface as bot
from secret_manager import SecretManager


class BotAgent:
  """A class to launch Bot agent.

  Attributes:
        gradio_config: A configparser having gradio configurations loaded from
          config.ini file.
        secret_config: A configparser having secret configurations loaded from
          config.ini file.
  """

  gradio_config: configparser.SectionProxy
  secret_config: configparser.SectionProxy

  def __init__(self):
    """Initialize Bot Agent and loads application configurations."""

    configuration = configparser.ConfigParser()
    current_dir = os.path.dirname(os.path.abspath(sys.argv[0]))
    configuration.read(os.path.join(current_dir, "config.ini"))
    self.gradio_config = configuration["gradio"]
    self.secret_config = configuration["secret"]

  def init_bot(self):
    """An entry point of application to launch Bot."""

    interface = bot().initialize(self.gradio_config)
    interface.title = self.gradio_config["title"]
    return interface


if __name__ == "__main__":
  bot_agent = BotAgent()
  bot_app = bot_agent.init_bot()
  user = bot_agent.secret_config["gradio-user"]
  password = SecretManager(bot_agent.secret_config).access_secret_version(
      bot_agent.secret_config["password-secret-id"]
  )
  bot_app.launch(server_name="0.0.0.0", server_port=8080, auth=(user, password))
