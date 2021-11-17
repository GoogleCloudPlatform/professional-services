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
import mock
import main
import io
from contextlib import redirect_stdout
from .helpers import fixture_to_pubsub, load_config
import unittest
import logging
from datetime import datetime
from google.cloud.billing.budgets_v1beta1.types import Budget, Filter, BudgetAmount, AllUpdatesRule
from google.type import money_pb2 as money
from unittest.mock import MagicMock


class TestPubsub(unittest.TestCase):
    message_sent = False
    message = {}

    def test_message_too_old(self):
        logger = logging.getLogger('test')
        logger.setLevel(logging.DEBUG)
        config = load_config('budget')
        data, context = fixture_to_pubsub('budget')

        buf = io.StringIO()
        with redirect_stdout(buf):
            with self.assertRaises(main.MessageTooOldException):
                main.decode_and_process(logger, config, data, context)

    def _sendmail(self, msg_from, msg_to, msg):
        self.message_sent = True
        self.message = {'from': msg_from, 'to': msg_to, 'body': msg}
        return True

    @mock.patch("processors.budget.BudgetProcessor._get_budget_service_client")
    @mock.patch("output.mail.smtplib.SMTP", autospec=True)
    @mock.patch("output.mail.smtplib.SMTP_SSL", autospec=True)
    @mock.patch("processors.budget.BudgetProcessor.expand_projects")
    def test_message_is_not_too_old(self, expand_projects, smtp_ssl, smtp,
                                    client):
        expand_projects.return_value = [('example-project', '1234567890',
                                         'Example Project', {
                                             'label': 'test'
                                         })]
        mock_client = MagicMock()
        mock_client.get_budget.return_value = Budget(
            name=
            'billingAccounts/123456-AABBCC-DDEEFF/budgets/40b3572a-3490-42aa-8d2f-f58f290cf05c',
            display_name='Sample budget',
            budget_filter=Filter(projects=['projects/806988760884']),
            amount=BudgetAmount(
                specified_amount=money.Money(units=3000, currency_code='USD')),
            all_updates_rule=AllUpdatesRule(
                pubsub_topic='projects/example-project/topics/billing-alerts',
                schema_version='1.0'),
            etag='1601042090660220')
        client.return_value = mock_client

        mock_smtp = MagicMock()
        mock_smtp.sendmail = self._sendmail
        smtp.return_value = mock_smtp
        smtp_ssl.return_value = mock_smtp

        logger = logging.getLogger('test')
        logger.setLevel(logging.DEBUG)
        config = load_config('budget')
        data, context = fixture_to_pubsub('budget')
        context.timestamp = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.%fZ')

        buf = io.StringIO()
        with redirect_stdout(buf):
            main.decode_and_process(logger, config, data, context)
        self.assertTrue(self.message_sent)
        self.assertIn('example-project', self.message['body'])
        self.assertEqual('notifications@your.domain', self.message['from'])
        self.assertEqual('owners-example-project@your.domain, cfo@your.domain',
                         ', '.join(self.message['to']))


if __name__ == '__main__':
    unittest.main()
