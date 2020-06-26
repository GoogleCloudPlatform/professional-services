# ==============================================================================
# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# ==============================================================================

"""Library for building bot."""

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import hashlib
import json
import os
import re
import time

import six


def GetId(some_str):
  return hashlib.md5(six.ensure_binary(some_str)).hexdigest()


class DFBot(object):
  """Builder for a dialogflow bot."""

  def __init__(self, project_name, version=None):
    self._project_name = project_name
    self._version = version or "1.0.0"
    self._intents = {}

  def Build(self, output_dir):
    """Output the bot with output_dir as root."""
    with open(os.path.join(output_dir, "agent.json"), "w") as f:
      f.write(json.dumps(self._AgentMap(), indent=4))
    with open(os.path.join(output_dir, "package.json"), "w") as f:
      f.write(json.dumps(self._PackageMap(), indent=4))
    intent_dir = os.path.join(output_dir, "intents")
    os.mkdir(intent_dir)
    for name in self._intents:
      mangled = re.sub("[^a-zA-Z0-9]", "_", six.ensure_str(name))
      with open(os.path.join(intent_dir, mangled + ".json"), "w") as f:
        f.write(json.dumps(self._IntentMap(name), indent=4))
      with open(os.path.join(intent_dir, mangled + "_usersays_en.json"),
                "w") as f:
        f.write(json.dumps(self._IntentUsersaysList(name), indent=4))

  def AddIntent(self, name, training_phrases):
    """Add an intent to the bot with the provided training phrases."""
    self._intents[name] = training_phrases

  def _AgentMap(self):
    return {
        "description": "",
        "language": "en",
        "disableInteractionLogs": False,
        "disableStackdriverLogs": True,
        "googleAssistant": {
            "googleAssistantCompatible": False,
            "project": self._project_name,
            "welcomeIntentSignInRequired": False,
            "startIntents": [],
            "systemIntents": [],
            "endIntentIds": [],
            "oAuthLinking": {
                "required": False,
                "grantType": "AUTH_CODE_GRANT"
            },
            "voiceType": "MALE_1",
            "capabilities": [],
            "protocolVersion": "V2",
            "isDeviceAgent": False
        },
        "defaultTimezone": "America/Denver",
        "webhook": {
            "available": False,
            "useForDomains": False,
            "cloudFunctionsEnabled": False,
            "cloudFunctionsInitialized": False
        },
        "isPrivate": True,
        "customClassifierMode": "use.after",
        "mlMinConfidence": 0.0,
        "supportedLanguages": [],
        "onePlatformApiVersion": "v2",
        "analyzeQueryTextSentiment": False,
        "enabledKnowledgeBaseNames": [],
        "knowledgeServiceConfidenceAdjustment": -0.4,
        "dialogBuilderMode": False
    }

  def _PackageMap(self):
    return {"version": "1.0.0"}

  def _IntentMap(self, intent_name):
    return {
        "id":
            GetId(intent_name),
        "name":
            intent_name,
        "auto":
            True,
        "contexts": [],
        "responses": [{
            "resetContexts": False,
            "affectedContexts": [],
            "parameters": [],
            "messages": [{
                "type": 0,
                "lang": "en",
                "speech": intent_name,
            }],
            "defaultResponsePlatforms": {},
            "speech": []
        }],
        "priority":
            500000,
        "webhookUsed":
            False,
        "webhookForSlotFilling":
            False,
        "lastUpdate":
            int(time.time()),
        "fallbackIntent":
            False,
        "events": []
    }

  def _IntentUsersaysList(self, intent_name):
    """Constructs list of utterances for agent."""
    result = []
    for example in self._intents[intent_name]:
      result.append({
          "id": GetId(example),
          "data": [{
              "text": example,
              "userDefined": False,
          }],
          "isTemplate": False,
          "count": 0,
          "updated": int(time.time()),
      })
    return result
