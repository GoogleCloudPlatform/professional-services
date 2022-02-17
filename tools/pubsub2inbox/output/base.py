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
from google.cloud.functions.context import Context
import abc
from helpers.base import BaseHelper


class NotConfiguredException(Exception):
    pass


class Output(BaseHelper):
    config = None
    output_config = None
    data = None
    event = None
    context: Context

    def __init__(self, config, output_config, jinja_environment, data, event,
                 context: Context):
        self.config = config
        self.output_config = output_config
        self.data = data
        self.event = event
        self.context = context

        super().__init__(jinja_environment)

    @abc.abstractmethod
    def output(self):
        pass