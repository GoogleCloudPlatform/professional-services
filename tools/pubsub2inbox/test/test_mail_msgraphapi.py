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

import unittest
import mock
import responses
import urllib
import json
from output.mail import MailOutput

class TestMailMsGraphAPI(unittest.TestCase):

    @responses.activate
    def test_fetch_ms_access_token(self):
        output = MailOutput(config = None,output_config = None, data = None,event = None, jinja_environment = None, context= None)

        client_id = 'test_client_id'
        client_secret = 'test_client_secret'
        tenant_id = 'test_tenant_id'
        exp_access_token = 'test_access_token'

        responses.add(responses.GET,
            'https://login.microsoftonline.com/%s/v2.0/'
            '.well-known/openid-configuration' % tenant_id,
            json={'token_endpoint':'https://login.microsoftonline.com/%s/oauth2/v2.0/token' % tenant_id,
                'authorization_endpoint':'https://login.microsoftonline.com/%s/oauth2/v2.0/authorize' % tenant_id})

        responses.add(responses.POST,
            'https://login.microsoftonline.com/%s/oauth2/v2.0/token' % tenant_id,
            json={'access_token': exp_access_token, 'expires_in': 3599, 'ext_expires_in':359, 'token_type': 'Bearer'})

        access_token = output._fetch_ms_access_token(client_id,client_secret,tenant_id)

        self.assertEqual(2, len(responses.calls), "Number of MS API calls is 2")
        self.assertTrue('client_id=%s' % client_id in responses.calls[1].request.body, "Token request contains valid client_id")
        self.assertTrue('client_secret=%s' % client_secret in responses.calls[1].request.body, "Token request contains valid client_id")
        self.assertEqual(exp_access_token, access_token, "access_token matches")


    @responses.activate
    @mock.patch('output.mail.MailOutput._fetch_ms_access_token')
    def test_send(self, fetch_access_token):
        expected_token = "sometoken"
        fetch_access_token.return_value = expected_token
        output = MailOutput(config = None,output_config = None, data = None,event = None, jinja_environment = None, context= None)
        token = output._fetch_ms_access_token("a","b","c")
        self.assertEqual("sometoken", token)

        transport = {
            'client_id': 'test_client_id',
            'client_secret': 'test_client_secret',
            'tenant_id': 'test_tenant_id'
        }
        mail = {
            'mail_to': "recipientOne@gmail.com,recipientTwo@gmail.com",
            'mail_from': 'sender@gmail.com',
            'mail_subject': 'test email',
            'text_body': 'test email body',
            'html_body': '<p>test email body</p>'
        }

        responses.add(responses.POST,
            'https://graph.microsoft.com/v1.0/users/%s/sendMail' % urllib.parse.quote_plus(mail['mail_from']))

        output.send_via_msgraphapi(transport, mail, None, None)

        self.assertEqual(1, len(responses.calls), "Number of valid MS API calls is 1")
        self.assertEqual('Bearer %s' % expected_token, responses.calls[0].request.headers['Authorization'], "sendMail request has valid Authorization header")
        self.assertEqual('application/json', responses.calls[0].request.headers['Content-type'], "sendMail request has valid Content-type header")
        request = json.loads(responses.calls[0].request.body)
        self.assertEqual(2, len(request['message']['toRecipients']), "sendMail request has valid number of recipients")
        self.assertEqual(mail['mail_to'].split(',')[0], request['message']['toRecipients'][0]['emailAddress']['address'], "sendMail request has valid email address for first recipient")
        self.assertEqual(mail['mail_to'].split(',')[1], request['message']['toRecipients'][1]['emailAddress']['address'], "sendMail request has valid email address for first recipient")
        self.assertEqual(mail['mail_subject'], request['message']['subject'], "sendMail request has valid message subject")
        self.assertEqual('html', request['message']['body']['contentType'], "sendMail request has valid message content type")
        self.assertEqual(mail['html_body'], request['message']['body']['content'], "sendMail request has valid HTML message body")
