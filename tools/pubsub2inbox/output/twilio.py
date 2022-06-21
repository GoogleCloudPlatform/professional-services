#   Copyright 2022 Google LLC
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
from twilio.rest import Client


class TwilioOutput(Output):

    def output(self):
        if 'vars' in self.output_config:
            additional_vars = self._jinja_expand_dict(
                self.output_config['vars'], 'vars')
            self.jinja_environment.globals = {
                **additional_vars,
                **self.jinja_environment.globals
            }

        if 'auth' not in self.output_config or 'sid' not in self.output_config[
                'auth'] or 'token' not in self.output_config['auth']:
            raise NotConfiguredException('No Twilio authentication specified!')
        account_sid = self._jinja_expand_string(
            self.output_config['auth']['sid'], 'account_sid')
        auth_token = self._jinja_expand_string(
            self.output_config['auth']['token'], 'auth_token')

        if 'messages' not in self.output_config:
            raise NotConfiguredException(
                'The list of messages is missing from the configuration!')

        self.output_config['messages'] = self._jinja_var_to_list(
            self.output_config['messages'])

        client = Client(account_sid, auth_token)
        for message in self.output_config['messages']:
            if 'from' not in message:
                raise NotConfiguredException('No "from" number specified!')
            from_number = self._jinja_expand_string(str(message['from']),
                                                    'from')

            if 'to' not in message:
                raise NotConfiguredException('No "to" number specified!.')

            to_number = self._jinja_expand_string(str(message['to']), 'to')

            if 'body' not in message:
                raise NotConfiguredException(
                    'No message bodyh defined in configuration.')
            message_body = self._jinja_expand_string(message['body'], 'body')

            client.messages.create(
                body=message_body,
                from_=from_number,
                to=to_number,
            )

            self.logger.info('SMS message sent via Twilio API!',
                             extra={
                                 'from': from_number,
                                 'to': to_number,
                             })
