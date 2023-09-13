# ============================================================================
# Copyright 2023 Google. This software is provided as-is, without warranty or
# representation for any use or purpose. Your use of it is subject to your
# agreement with Google.
# ============================================================================

"""A module to expose middleware api endpoints."""


import configparser
import logging
import os
from detect_intent import DetectIntent
from flask import Flask, jsonify, request
from requests import RequestException

config = configparser.ConfigParser()
config.read("config.ini")
dialogflow_config = config["dialogflow"]

app = Flask(__name__)


@app.route("/predict", methods=["POST"])
def predict():
  """Endpoint to get responses from s/LLM Model/Gen AI Agent."""
  try:
    data = request.get_json(force=True)
    user_input = data["user_input"]
    session_id = data["session_id"]
    output, gcs_link = DetectIntent(dialogflow_config).get_llm_response(
        user_input, session_id
    )
    return jsonify({"success": True, "output": output, "gcs_link": gcs_link})
  except RequestException as ex:
    logging.error(ex)


if __name__ == "__main__":
  port = int(os.environ.get("PORT", 8080))
  app.run(debug=True, host="0.0.0.0", port=port)
