# Copyright 2022 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""
A module defining wrapper class for Postgres psycopg2 for managing connection,
cursor and executing queries.
"""
from sqlite3 import OperationalError
from psycopg2 import pool


class Database(object):
    """
    Postgres database psycopg2 wrapper class
    """

    def __init__(self,
                 host: str,
                 database: str,
                 user: str,
                 password: str,
                 port=5432,
                 min_connection=1,
                 max_connection=20):
        self.host = host
        self.database = database
        self.user = user
        self.password = password
        self.port = port
        self.min_connection = min_connection
        self.max_connection = max_connection
        self._create_connection_pool()

    def _create_connection_pool(self):
        self.connection_pool = pool.ThreadedConnectionPool(
            self.min_connection,
            self.max_connection,
            user=self.user,
            password=self.password,
            host=self.host,
            port=self.port,
            database=self.database)

    def _get_connection(self):
        try:
            connection = self.connection_pool.getconn()
            if connection.closed != 0:
                return self._get_connection()
            return connection
        except pool.PoolError:
            return self._get_connection()
        except OperationalError:
            return self._get_connection()

    def _put_connection(self, con):
        self.connection_pool.putconn(con)

    def _create_cursor(self, con):
        if con.closed != 0:
            con = self._get_connection()
        return con.cursor()

    def _close_cursor(self, crs):
        crs.close()

    def execute_query(self, query, params=None):
        connection = self._get_connection()
        cursor = self._create_cursor(connection)
        cursor.execute(query, params)
        connection.commit()
        if cursor.description:
            all_data = cursor.fetchall()
            self._close_cursor_connection(cursor, connection)
            return all_data
        self._close_cursor_connection(cursor, connection)
        return True

    def _close_cursor_connection(self, cursor, connection):
        self._close_cursor(cursor)
        self._put_connection(connection)
