#!/usr/bin/env python

# Copyright 2019 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""
REST API with Bigtable storage
"""


from google.cloud import bigtable
from google.cloud.bigtable import row_filters
from google.cloud.bigtable.row_set import RowSet,RowRange
from proto.instancemetric_pb2 import Metrics
from google.protobuf.json_format import MessageToDict
import json
import time
from flask import Flask
from flask import request
from flask import Response


def rowkey(host, dc, region, t):
    if t is not None:
        return "".join([host, "#", dc, "#", region, "#", str(t)])
    else:
        return "".join([host, "#", dc, "#", region, "$"])


class QueryHandler(object):
    def __init__(self, project, instance_id, table_id):
        self.project = project
        self.instance_id = instance_id
        self.table_id = table_id
        self.client = bigtable.Client(project=self.project, admin=False)
        self.instance = self.client.instance(self.instance_id)
        self.table = self.instance.table(self.table_id)

    def query(self, host, dc, region, t, limit=1, window=60):
        t0 = int(t) - window
        t1 = int(t)
        start_key = rowkey(host, dc, region, t0)
        end_key = rowkey(host, dc, region, t1)
        row_set = RowSet()
        row_set.add_row_range(RowRange(start_key, end_key))
        return self.table.read_rows(
            limit=limit,
            filter_=row_filters.CellsColumnLimitFilter(1),
            row_set=row_set
        )


app = Flask('MetricsApp')


@app.before_first_request
def init():
    import os
    project = os.environ.get('PROJECT', 'myproject')
    instance_id = os.environ.get('INSTANCE', 'metrics')
    table_id = os.environ.get('TABLE', 'metrics')
    app.QUERY_HANDLER = QueryHandler(project, instance_id, table_id)


def read_metrics(host, dc, region, limit, window):
    t = int(time.time())
    rows = app.QUERY_HANDLER.query(host, dc, region, t, limit, window)
    a = []
    for row in rows:
        for cf in row.cells:
            cell = row.cells[cf]
            for col in cell:
                for x in cell[col]:
                    m = Metrics()
                    m.ParseFromString(x.value)
                    a.append(m)
    return a


@app.route('/metrics')
def metrics():
    host = request.args.get('host')
    dc = request.args.get('dc')
    region = request.args.get('region')
    limit = request.args.get('limit')
    window = request.args.get('w')

    if limit is None:
        limit = 1
    else:
        limit = int(limit)

    if window is None:
        window = 60 * 60  # 1 hour
    else:
        window = int(window)

    rows = read_metrics(host, dc, region, limit, window)

    a = []
    for row in rows:
        d = MessageToDict(row, including_default_value_fields=True, preserving_proto_field_name=True)
        a.append(json.dumps(d))

    return Response(response='[' + ",".join(a) + ']',
                    status=200,
                    mimetype='application/json')


def get_cpu(vm):
    if 'cpu' in vm:
        if 'cpu_data_cputime_percent' in vm['cpu']:
            return vm['cpu']['cpu_data_cputime_percent']
    return None


def filter_vms_by_cpu(vm):
    utilization = get_cpu(vm)
    if utilization is not None:
        return utilization > 0.8
    return False


@app.route('/top')
def top():
    host = request.args.get('host')
    dc = request.args.get('dc')
    region = request.args.get('region')
    limit = request.args.get('limit')
    top_n = request.args.get('n')
    window = request.args.get('w')
    t = request.args.get('t')

    if t is None:
        t = int(time.time())
    else:
        t = int(t)

    if top_n is None:
        top_n = 3
    else:
        top_n = int(top_n)

    if limit is None:
        limit = 1
    else:
        limit = int(limit)

    if window is None:
        window = 3600
    else:
        window = int(window)

    rows = app.QUERY_HANDLER.query(host=host, dc=dc, region=region, t=t, limit=limit, window=window)
    msgs = []
    for row in rows:
        for cf in row.cells:
            cell = row.cells[cf]
            for col in cell:
                for x in cell[col]:
                    m = Metrics()
                    m.ParseFromString(x.value)
                    d = MessageToDict(m, including_default_value_fields=True, preserving_proto_field_name=True)
                    msgs.append(d)

    results = []
    for msg in msgs:
        ts = msg['timestamp']
        if 'vm' in msg:
            top_vms = []
            highcpu = filter(filter_vms_by_cpu, msg['vm'])
            highcpu.sort(key=get_cpu)
            vms = highcpu[:top_n]
            for vm in vms:
                top_vms.append({'vmid': vm['vmid'], 'cpu': get_cpu(vm)})
            results.append({'host': msg['host_info']['host'], 'ts': ts, 'vms': top_vms})

    result = [json.dumps(vm) for vm in results]
    return Response(response='[' + ",".join(result) + ']',
                    status=200,
                    mimetype='application/json')


if __name__ == '__main__':
    pass
