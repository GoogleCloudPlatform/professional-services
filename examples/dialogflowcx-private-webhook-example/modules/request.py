# Copyright 2022, Google LLC
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#        http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
'''Dialogflow CX request data model.'''

# pylint: disable=no-name-in-module, too-few-public-methods, invalid-name

from typing import Any, List, Dict, Optional
from pydantic import BaseModel

class FulfillmentInfo(BaseModel):
    '''Fulfillment Info data structure.'''
    tag: str


class SessionInfo(BaseModel):
    '''Session Info data structure.'''
    session: str = ""
    parameters: Dict[str, Any] = {}


class WebhookRequest(BaseModel):
    '''Webhook Request data structure.'''
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
        '''Add tag.'''
        fulfillment_info = FulfillmentInfo(tag=str(tag))
        self.fulfillmentInfo = fulfillment_info

    def add_text_request(self, text):
        '''Add text request'''
        self.text = text
