# Copyright 2019 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#            http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import sys
print(sys.path)
from cloud_sql_delete_backups import main
from datetime import datetime
import unittest
import mock


class TestDeleteCoudSQLBackups(unittest.TestCase):

    @mock.patch('cloud_sql_delete_backups.main.get_cloudsql_backups')
    @mock.patch('cloud_sql_delete_backups.main.delete_backup')
    @mock.patch('cloud_sql_delete_backups.main.current_time')
    def test_delete_old_backups(self, current_time, delete_backup,
                                get_cloudsql_backups):
        """Tests that we keep 1 and delete the other as it's old."""
        current_time.return_value = datetime.fromisoformat('2019-01-03T00:00')
        get_cloudsql_backups.return_value = [
            {'endTime': '2019-01-02T00:00:00.00Z'},
            {'endTime': '2019-01-01T00:00:00.00Z'},
            {'endTime': '2018-12-20T00:00:00.00Z'}]
        instance = {'project': 'my-project', 'name': 'my-instance'}
        main.delete_old_backups(instance, 1, 1, True, False)
        self.assertEqual(delete_backup.call_count, 2)
        self.assertEqual(get_cloudsql_backups.call_count, 1)

    @mock.patch('cloud_sql_delete_backups.main.get_cloudsql_backups')
    @mock.patch('cloud_sql_delete_backups.main.delete_backup')
    @mock.patch('cloud_sql_delete_backups.main.current_time')
    def test_keep_backups(self, current_time, delete_backup,
                                get_cloudsql_backups):
        """Tests that we keep the one."""
        current_time.return_value = datetime.fromisoformat('2019-01-03T00:00')
        get_cloudsql_backups.return_value = [
            {'endTime': '2019-01-02T00:00:00.00Z'}]
        instance = {'project': 'my-project', 'name': 'my-instance'}
        main.delete_old_backups(instance, 1, 1, True, False)
        self.assertEqual(delete_backup.call_count, 0)

    @mock.patch('cloud_sql_delete_backups.main.get_cloudsql_backups')
    @mock.patch('cloud_sql_delete_backups.main.delete_backup')
    @mock.patch('cloud_sql_delete_backups.main.current_time')
    def test_delete_all_backups(self, current_time, delete_backup,
                                get_cloudsql_backups):
        """Tests that we delete 1 if we are keeping none."""
        current_time.return_value = datetime.fromisoformat('2019-01-03T00:00')
        get_cloudsql_backups.return_value = [
            {'endTime': '2019-01-03T00:00:00.00Z'}]
        instance = {'project': 'my-project', 'name': 'my-instance'}
        main.delete_old_backups(instance, -1, 0, True, False)
        self.assertEqual(delete_backup.call_count, 1)

    @mock.patch('cloud_sql_delete_backups.main.get_cloudsql_backups')
    @mock.patch('cloud_sql_delete_backups.main.delete_backup')
    @mock.patch('cloud_sql_delete_backups.main.current_time')
    def test_keep_all_backups(self, current_time, delete_backup,
                                get_cloudsql_backups):
        """Tests that we delete 1 if we are keeping none."""
        current_time.return_value = datetime.fromisoformat('2019-01-03T00:00')
        get_cloudsql_backups.return_value = [
            {'endTime': '2018-12-03T00:00:00.00Z'},
            {'endTime': '2018-12-04T00:00:00.00Z'},
            {'endTime': '2018-12-05T00:00:00.00Z'},
            {'endTime': '2018-12-06T00:00:00.00Z'}]
        instance = {'project': 'my-project', 'name': 'my-instance'}
        main.delete_old_backups(instance, -1, 5, True, False)
        self.assertEqual(delete_backup.call_count, 0)
