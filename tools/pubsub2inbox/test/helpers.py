#   Copyright 2021 Google LLC
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.
import json
import yaml
from google.cloud.functions.context import Context


def load_config(config_name):
    with open('test/configs/%s.yaml' % config_name) as config_file:
        configuration = config_file.read()

    cfg = yaml.load(configuration, Loader=yaml.SafeLoader)
    return cfg


def fixture_to_pubsub(fixture):
    with open('test/fixtures/%s.json' % fixture, 'r') as file:
        data = json.loads(file.read())

        event = {
            'data': data[0]['message']['data'],
            'attributes': data[0]['message']['attributes']
        }
        context = Context(eventId=data[0]['message']['messageId'],
                          timestamp=data[0]['message']['publishTime'])
        return event, context
