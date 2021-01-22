# Copyright 2021 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Aiven MySQL client

This program will query all records in the "test" database and return the top query result as JSON string.
"""

from flask import Flask
import os
import pymysql

app = Flask(__name__)
@app.route('/query', methods=['GET'])
def query_mysql():
    timeout = 10

    connection = pymysql.connect(
        charset="utf8mb4",
        connect_timeout=timeout,
        cursorclass=pymysql.cursors.DictCursor,
        db=os.environ.get('MYSQL_DB'),
        host=os.environ.get('MYSQL_HOST'),
        password=os.environ.get('MYSQL_PASSWORD'),
        read_timeout=timeout,
        port=16651,
        ssl={"ca": "./ca.pem"},
        user="avnadmin",
        write_timeout=timeout,
    )  
    try:
        # query data
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            # pymysql.cursors.DictCursor:convert query data to dictionary
            # Read a single record
            sql = "SELECT TOP 1 * FROM test"
            cursor.execute(sql)
            result = cursor.fetchall()
            return str(result)
    finally:
        connection.close()
