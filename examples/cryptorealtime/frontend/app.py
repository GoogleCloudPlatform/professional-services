#!/usr/bin/python
#
# Copyright 2019 Google LLC
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



import os
import sys
import time
import numpy as np
import pandas as pd
from flask import Flask
from flask import render_template
from flask import json
from datetime import datetime
from datetime import timedelta
from google.cloud import bigtable
from google.cloud.bigtable.row_set import RowSet
from google.cloud.bigtable.row_set import RowRange
from collections import defaultdict

tmpl_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'templates')
app = Flask(__name__, template_folder=tmpl_dir)


def query_builder():
    all_pairs = ["LTC/USD", "BTC/GBP", "XLM/USD", "BTC/JPY", "BTC/EUR",
                 "XRP/USD", "XRP/BTC", "XMR/USD", "XLM/BTC", "BTC/USD",
                 "LTC/BTC", "XRP/EUR", "XMR/BTC", "XTZ/BTC"]
    pairs = ["BTC/USD"]
    exchanges = ["bitfinex", "bitStamp", "poloniex", "gemini", "hitBTC",
                 "okCoin"]

    rowset = RowSet()
    for pair in pairs:
        for exchange in exchanges:
            startkey = "{}#{}#{}".format(pair, exchange, int(time.mktime(
                (datetime.now() - timedelta(seconds=3)).timetuple())))
            endkey = "{}#{}#{}".format(pair, exchange, int(time.mktime(
                (datetime.now() + timedelta(seconds=1)).timetuple())))
            rowrange = RowRange(start_key=startkey, end_key=endkey)
            rowset.add_row_range(rowrange)
    return rowset


def callable_defaultdict_list():
    return defaultdict(list)


def query_data():
    starttime = time.time()
    trades_values = defaultdict(callable_defaultdict_list)
    trades_timestamps = defaultdict(callable_defaultdict_list)
    for row in table.read_rows(row_set=query_builder()):
        date_string = datetime.fromtimestamp(
            int(row.row_key.decode('utf-8').split("#")[-2][0:-3]))
        for column_family, cell in list(row.cells.items()):
            trades_values[column_family]["key"].append(
                row.row_key.decode('utf-8'))
            for column_name, cell_value in list(cell.items()):
                trades_values[column_family][column_name].append(
                    cell_value[0].value.decode('utf-8'))
                trades_timestamps[column_family][column_name].append(
                    date_string)

    trades_values_numpy = defaultdict(callable_defaultdict_list)
    trades_timestamp_values_numpy = defaultdict(callable_defaultdict_list)
    endbigtabletime = time.time()
    bigtablelatency = endbigtabletime - starttime
    print("Done retrieving from Bigtable in %.2f" % bigtablelatency)

    # SAMPLING
    sample_size = 5000
    for trades, columns in list(trades_values.items()):
        for column_name, values in list(columns.items()):
            trades_values_numpy[trades][column_name] = np.array(values)[::max(
                len(values) / sample_size, 1)]
    for trades, columns in list(trades_timestamps.items()):
        for column_name, values in list(columns.items()):
            trades_timestamp_values_numpy[trades][column_name] = np.array(
                values)[::max(len(values) / sample_size, 1)]
    endsamplingtime = time.time()
    samplinglatency = endsamplingtime - endbigtabletime
    print("Done Sampling in %.2f" % samplinglatency)

    return trades_values_numpy, trades_timestamp_values_numpy


@app.route("/stream")
def stream():
    return render_template('streamingvisjs.html', **locals())


@app.route("/getStreamingData")
def getStreamingData():
    trades_tuple = query_data()
    return json.dumps(pd.Series(trades_tuple).to_json(orient='index'))


def main(argv):
    project_name = argv[0]
    bigtable_instance = argv[1]
    bigtable_table = argv[2]
    bigtable_family = argv[3]
    global client
    global instance
    global table
    global family
    client = bigtable.Client(project=project_name, admin=True)
    instance = client.instance(bigtable_instance)
    table = instance.table(bigtable_table)
    family = bigtable_family


if __name__ == "__main__":
    main(sys.argv[1:])
    app.run(port=5000, debug=True, host="0.0.0.0")
