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
import httplib2
import urllib
from oauth2client.client import GoogleCredentials


class WebhookOutput(Output):

    def output(self):
        if 'url' not in self.output_config:
            raise NotConfiguredException('No URL defined in webhook.')

        url_template = self.jinja_environment.from_string(
            self.output_config['url'])
        url_template.name = 'url'
        url = url_template.render()

        method = 'GET'
        if 'method' in self.output_config:
            method = self.output_config['method']

        body = None
        if 'body' in self.output_config:
            body_template = self.jinja_environment.from_string(
                self.output_config['body'])
            body_template.name = 'body'
            body = body_template.render()

        http = httplib2.Http()
        if 'addBearerToken' in self.output_config and self.output_config[
                'addBearerToken']:
            credentials = GoogleCredentials.get_application_default()
            http = credentials.authorize(http)

        headers = {'User-agent': self._get_user_agent()}
        if body:
            headers['Content-type'] = 'application/x-www-form-urlencoded'
        if 'headers' in self.output_config:
            for header in self.output_config['headers']:
                header_template = self.jinja_environment.from_string(
                    header['value'])
                header_template.name = 'header'
                header_value = header_template.render()
                headers[header['name']] = header_value

        response, content = http.request(
            url,
            method,
            headers=headers,
            body=urllib.parse.quote(body) if body else None)
        if int(response['status']) >= 200 and int(response['status']) <= 399:
            self.logger.info('Webhook sent!',
                             extra={
                                 'status': response['status'],
                                 'content': content,
                                 'url': url,
                                 'method': method
                             })
        else:
            self.logger.error('Invalid status code from webhook.',
                              extra={
                                  'status': response['status'],
                                  'content': content,
                                  'url': url,
                                  'method': method
                              })
