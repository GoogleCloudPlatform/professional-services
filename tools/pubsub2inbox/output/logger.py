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


class LoggerOutput(Output):

    def output(self):
        if 'message' not in self.output_config:
            raise NotConfiguredException('No log message defined!')

        message_template = self.jinja_environment.from_string(
            self.output_config['message'])
        message_template.name = 'message'
        message_rendered = message_template.render()

        extra_vars = {}
        if 'variables' in self.output_config:
            for k, v in self.output_config['variables'].items():
                variable_template = self.jinja_environment.from_string(v)
                variable_template.name = 'variable'
                val = variable_template.render()
                extra_vars[k] = val

        log_level = 'info'
        if 'level' in self.output_config:
            loglevel_template = self.jinja_environment.from_string(
                self.output_config['level'])
            loglevel_template.name = 'loglevel'
            log_level = loglevel_template.render()
        if log_level == 'error' or log_level == 'err':
            self.logger.error(message_rendered, extra=extra_vars)
        elif log_level == 'warn' or log_level == 'warning':
            self.logger.warning(message_rendered, extra=extra_vars)
        else:
            self.logger.info(message_rendered, extra=extra_vars)
