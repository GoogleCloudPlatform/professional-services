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
'''Dialogflow CX webhook tests.'''

from fastapi.testclient import TestClient
from webhook import app

from modules.request import WebhookRequest

client = TestClient(app)

def test_main():
    '''Test root entrypoint.'''
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"msg": "Hello World"}

def test_tag_default():
    '''Test `default` tag.'''
    webhook_request = WebhookRequest(detectIntentResponseId="1234")
    webhook_request.add_tag("Default Welcome Intent")
    webhook_request.add_text_request("Hello")

    response = client.post("/webhook/", webhook_request.json())
    assert response.status_code == 200
    response_text = response.json()['fulfillment_response']['messages'][0]['text']['text'][0]
    assert response_text == "Hi from a Python Webhook!"

def test_tag_echo():
    '''Test `echo` tag.'''
    webhook_request = WebhookRequest(detectIntentResponseId="1234")
    webhook_request.add_tag("echo")
    webhook_request.add_text_request("Hello")

    response = client.post("/webhook/", webhook_request.json())
    assert response.status_code == 200
    response_text = response.json()['fulfillment_response']['messages'][0]['text']['text'][0]
    assert response_text == "You said: Hello"
