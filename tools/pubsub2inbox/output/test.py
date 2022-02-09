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
from .base import Output, NotConfiguredException


class TestFailedException(Exception):
    pass


class TestOutput(Output):

    def output(self):
        if 'result' not in self.output_config:
            raise NotConfiguredException('No test result defined!')
        if 'expected' not in self.output_config:
            raise NotConfiguredException('No expected test result defined!')

        result = self._jinja_expand_string(self.output_config['result'])
        expected = self.output_config['expected']
        if 'strip' in self.output_config and self.output_config['strip']:
            result = result.strip()
            expected = expected.strip()
        if result != expected:
            raise TestFailedException('Expected "%s", got "%s"' %
                                      (expected, result))
