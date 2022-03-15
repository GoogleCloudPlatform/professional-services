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
'''Dialogflow CX response structure.'''

from typing import Any, List, Dict, Optional
from pydantic import BaseModel

class Text(BaseModel):
    '''Text data structure.'''
    text: List[str]
    allowPlaybackInterruption: Optional[bool]


class ConversationSuccess(BaseModel):
    '''Conversation Success data structure.'''
    metadata: Dict[Any, str]


class OutputAudioText(BaseModel):
    '''Output Audio Text data structure.'''
    # conversation_success
    allowPlaybackInterruption: Optional[bool]
    text: Optional[str]
    ssml: Optional[str]


class LiveAgentHandoff(BaseModel):
    '''Live Agent Handoff data structure.'''
    metadata: Dict[Any, str]


class PlayAudio(BaseModel):
    '''Play audio data structure.'''
    allowPlaybackInterruption: Optional[bool]
    audioUri: str


class Segment(BaseModel):
    '''Segment data structure.'''
    allowPlaybackInterruption: Optional[bool]
    audio: Optional[bytes]
    uri: Optional[str]


class MixedAudio(BaseModel):
    '''Mixed Audio data structure.'''
    segments: List[Segment]


class ResponseMessage(BaseModel):
    '''Response Message data structure.'''
    text: Optional[Text]
    payload: Optional[Dict[Any, str]]
    conversationSuccess: Optional[ConversationSuccess]
    outputAudioText: Optional[OutputAudioText]
    liveAgentHandoff: Optional[LiveAgentHandoff]
    playAudio: Optional[PlayAudio]
    mixedAudio: Optional[MixedAudio]


class FulfillmentResponse(BaseModel):
    '''Fulfillment Response data structure.'''
    messages: List[ResponseMessage] = []
    #mergeBehavior: Optional[str]

    def add_messages(self, *messages):
        '''Add message.'''
        for message in messages:
            if isinstance(message, Text):
                self.messages.append(ResponseMessage(text=message))
            elif isinstance(message, OutputAudioText):
                self.messages.append(ResponseMessage(outputAudioText=message))


class SessionInfo(BaseModel):
    '''Session Info data structure.'''
    session: str = ""
    parameters: Dict[str, Any] = {}


class WebhookResponse(BaseModel):
    '''Webhook Response data structure.'''
    fulfillment_response: FulfillmentResponse = FulfillmentResponse()
    pageInfo: Optional[Dict[str, Any]]
    sessionInfo: Optional[SessionInfo]

    def add_param(self, param_key, param_value):
        '''Add param.'''
        if self.sessionInfo is not None :
            self.sessionInfo.parameters[param_key] = param_value
        else:
            session_info = SessionInfo()
            session_info.parameters[param_key] = param_value
            self.sessionInfo = session_info

    def add_text_response(self, *texts, allowPlaybackInterruption=None):
        '''Add text response.'''
        text = Text(text=list(texts), allowPlaybackInterruption=allowPlaybackInterruption)
        message = ResponseMessage(text=text)
        self.fulfillment_response.messages.append(message)

    def add_responses(self, *responses):
        '''Add response.'''
        self.fulfillment_response.add_messages(*responses)
