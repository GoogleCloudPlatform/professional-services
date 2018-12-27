# Copyright 2018 Google LLC. All rights reserved. Licensed under the Apache
# License, Version 2.0 (the "License"); you may not use this file except in
# compliance with the License. You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations under
# the License.
#
# Any software provided by Google hereunder is distributed "AS IS", WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, and is not intended for production use.

"""Tests the api helpers functions."""

import unittest
import mock

import google.auth
from google.auth.compute_engine import credentials as service_account
import api_helpers
from api_helpers import CLOUD_SCOPES


FAKE_REQUIRED_SCOPES = frozenset([
    'https://www.googleapis.com/auth/admin.directory.group.readonly'
])

class ApiHelpersTest(unittest.TestCase):
    """Test the Base Repository methods."""

    @mock.patch.object(
        google.auth, 'default',
        return_value=(mock.Mock(spec_set=service_account.Credentials),
                      'test-project'))
    def test_get_delegated_credential(self, mock_credentials):
        test_delegate = 'user@forseti.testing'
        credentials = api_helpers.get_delegated_credential(
            test_delegate, FAKE_REQUIRED_SCOPES)
        self.assertEqual(credentials._subject, test_delegate)
        self.assertEqual(credentials._scopes, FAKE_REQUIRED_SCOPES)

    def test_required_scope_in_private_module_has_not_changed(self):
        required_scope = 'https://www.googleapis.com/auth/cloud-platform'
        self.assertTrue(required_scope in list(CLOUD_SCOPES))


if __name__ == '__main__':
    unittest.main()
