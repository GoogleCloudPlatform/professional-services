# Copyright 2022, Google LLC
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import json
from typing import Any, List, Dict, Optional, Union
from pydantic import BaseModel, validator

class FulfillmentInfo(BaseModel):
  tag: str


class SessionInfo(BaseModel):
  session: str = ""
  parameters: Dict[str, Any] = {}


class WebhookRequest(BaseModel):
  detectIntentResponseId: Optional[str]
  languageCode: Optional[str]
  fulfillmentInfo: Optional[FulfillmentInfo]
  intentInfo: Optional[Dict[str, Any]]
  pageInfo: Optional[Dict[str, Any]]
  sessionInfo: SessionInfo = SessionInfo()
  messages: Optional[List[Dict[str, Any]]]
  payload: Optional[Dict[str, Any]]
  sentimentAnalysisResult: Optional[Dict[str, Any]]
  text: Optional[str]
  triggerIntent: Optional[str]
  transcript: Optional[str]
  triggerEvent: Optional[str]

  def add_tag(self, tag):
    fulfillmentInfo = FulfillmentInfo(tag=str(tag))
    self.fulfillmentInfo = fulfillmentInfo   

  def add_text_request(self, text):
    self.text = text
    
  def to_dict(self):
    return self.dict(exclude_none=True)

  def to_json(self):
    return json.dumps(self.dict(exclude_none=True))      