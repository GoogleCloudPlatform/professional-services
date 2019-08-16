# Copyright 2019 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License"); you may not
# use this file except in compliance with the License.  You may obtain a copy
# of the License at http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
# License for the specific language governing permissions and limitations under
# the License.

import base64
import json
import logging
import pytest
import requests
import main
from googleapiclient.http import HttpMockSequence
from helpers import readfile
from unittest import mock


class HttpMockSequenceRecorder(HttpMockSequence):
    """Records requests for later use in assertions"""
    def __init__(self, iterable):
        super().__init__(iterable)
        self.saved_requests = []

    def append(self, response):
        """Appends a response to the sequence of responses."""
        self._iterable.append(response)

    def request(self, uri, method='GET', body=None, headers=None,
                redirections=1, connection_type=None):
        req = {'uri': uri, 'method': method, 'body': body, 'headers': headers}
        self.saved_requests.append(req)
        return super().request(uri, method, body, headers, redirections,
                               connection_type)


@pytest.fixture
def mock_http():
    """Mocks an http instance suitable for use with discovery based API's."""
    http = HttpMockSequenceRecorder([
        # Get IP address path
        ({'status': '200'}, readfile('compute-v1.json')),
        ({'status': '200'}, readfile('dns-v1.json')),
    ])
    return http


@pytest.fixture
def mock_instance_resource():
    """Mocks a compute.instances.get Resource."""
    return json.loads(readfile('instance.json'))


@pytest.fixture
def mock_instance_resource_no_network():
    """Mocks a compute.instances.get Resource with no network interface."""
    return json.loads(readfile('instance-no-network.json'))


@pytest.fixture
def mock_env(monkeypatch):
    """Sets required environment variables."""
    monkeypatch.setenv("DNS_VM_GC_DNS_PROJECT", "my-vpc-host")
    monkeypatch.setenv("DNS_VM_GC_DNS_ZONES",
                       "my-nonprod-private-zone,my-prod-private-zone")
    monkeypatch.setenv("GCP_PROJECT", "logging")
    monkeypatch.setenv("FUNCTION_REGION", "us-west1")
    monkeypatch.setenv("FUNCTION_NAME", "dns_vm_gc")
    monkeypatch.delenv("DNS_VM_GC_REPORTING_LOG_STREAM", False)


@pytest.fixture
def mock_env_log_stream(monkeypatch, mock_env):
    monkeypatch.setenv("DNS_VM_GC_REPORTING_LOG_STREAM",
                       "organizations/000000000000/logs/dns-vm-gc-report")


@pytest.fixture
def mock_env_no_debug(monkeypatch, mock_env):
    monkeypatch.delenv("DEBUG", False)


@pytest.fixture
def mock_env_no_proj(monkeypatch, mock_env):
    monkeypatch.delenv("DNS_VM_GC_DNS_PROJECT", False)


@pytest.fixture
def mock_env_no_zones(monkeypatch, mock_env):
    monkeypatch.delenv("DNS_VM_GC_DNS_ZONES", False)


@pytest.fixture
def mock_env_debug(monkeypatch, mock_env):
    monkeypatch.setenv("DEBUG", "1")


@pytest.fixture
def trigger_empty():
    """Empty dict representing the minimal data in a pubsub message."""
    return {}


@pytest.fixture
def trigger_event():
    """Input data from a Pub/Sub GCE_API_CALL trigger event"""
    data = base64.b64encode(readfile('trigger-event.json').encode())
    return {'data': data.decode()}


@pytest.fixture
def trigger_event_done():
    """Input data from a Pub/Sub GCE_OPERATION_DONE trigger event"""
    data = base64.b64encode(readfile('trigger-event-done.json').encode())
    return {'data': data.decode()}


@pytest.fixture
def vm_uri():
    return 'projects/user-dev-242122/zones/us-west1-a/instances/test-w2'


@pytest.fixture
def event_id():
    return '598859837914523'


@pytest.fixture
def no_ip_log():
    """Example of a structured log message when the IP is not available

    This structure is intended to provide an convenient way to report on A
    records which were not automatically cleaned up.
    """
    return {
        'reason': 'IP_NOT_AVAILABLE',
        'project': 'user-dev-242122',
        'zone': 'us-west1-a',
        'instance': 'test',
    }


@pytest.fixture
def mock_session():
    """Mock out Stackdriver writes"""
    http = mock.create_autospec(requests.Session, instance=True)
    response = requests.Response()
    response.status_code = 200
    http.request.return_value = response
    return http


@pytest.fixture
def app(mock_env, mock_http, mock_session):
    return main.DnsVmGcApp(http=mock_http, session=mock_session)


@pytest.fixture
def app_debug(mock_env_debug, mock_http, mock_session):
    return main.DnsVmGcApp(http=mock_http, session=mock_session)


@pytest.fixture
def app_warm(app, monkeypatch):
    """When the function is warmed up from previous events"""
    monkeypatch.setattr(main.RuntimeState, 'app', app)
    return app


@pytest.fixture
def app_cold(monkeypatch, mock_env, mock_session, mock_http):
    """When the function executes from a cold start"""
    monkeypatch.setattr(main.RuntimeState, 'app', None)
    return None


@pytest.fixture
def handler(app, trigger_event):
    return main.EventHandler(app=app, data=trigger_event)


def test_no_data_key(app, trigger_empty):
    with pytest.raises(KeyError) as err:
        app.handle_event(trigger_empty, None)
    assert "Expected data dictionary contains key 'data'" in str(err.value)


def test_config_no_project(mock_env_no_proj, app, trigger_event):
    with pytest.raises(EnvironmentError) as err:
        main.EventHandler(app=app, data=trigger_event)
    assert "Env var DNS_VM_GC_DNS_PROJECT is required" in str(err.value)


def test_config_no_zones(mock_env_no_zones, app, trigger_event):
    with pytest.raises(EnvironmentError) as err:
        main.EventHandler(app=app, data=trigger_event)
    assert "Env var DNS_VM_GC_DNS_ZONES is required" in str(err.value)


def test_ip_address(handler, mock_instance_resource, caplog):
    ip = handler.ip_address(mock_instance_resource)
    assert ip == "10.138.0.44"


def test_ip_address_no_network(
        handler,
        mock_instance_resource_no_network,
        caplog):
    ip = handler.ip_address(mock_instance_resource_no_network)
    assert ip is None


def test_main_when_vm_not_found(app, mock_http, trigger_event, caplog):
    """Integration test when VM delete operation is lost."""
    mock_http.append(({'status': '404'}, ''))
    num_deleted = app.handle_event(trigger_event)
    assert 'LOST_RACE' in caplog.text
    assert 0 == num_deleted


def test_managed_zone_not_found(app, trigger_event, mock_http, caplog):
    """Handles a 404 not found and suggests checking configuration"""
    mock_http.append(({'status': '200'}, readfile('instance.json')))
    # These are the API calls to get the managed zones.
    mock_http.append(({'status': '404'}, ''))
    mock_http.append(({'status': '404'}, ''))
    num_deleted = app.handle_event(trigger_event)
    expected = ('Check managed zones specified in DNS_VM_GC_DNS_ZONES '
                'exist in DNS_VM_GC_DNS_PROJECT')
    assert 0 == num_deleted
    assert expected in caplog.text


def test_delete_happens_one_vm_matches(app, trigger_event, mock_http, caplog):
    """Deletes the A record matching the IP address of the VM."""
    mock_http.append(({'status': '200'}, readfile('instance.json')))
    mock_http.append(({'status': '200'}, readfile('rrsets.json')))
    mock_http.append(({'status': '200'}, readfile('dns-change.json')))
    mock_http.append(({'status': '200'}, readfile('rrsets-empty.json')))

    num_deleted = app.handle_event(trigger_event)
    assert 1 == num_deleted
    assert 'my-vpc-host/managedZones/my-nonprod-private-zone/changes' \
        in mock_http.saved_requests[4]['uri']


def test_debug_env_log_level(mock_env_debug, mock_http):
    """Log level is DEBUG when DEBUG=1"""
    app = main.DnsVmGcApp(mock_http)
    assert app.log.level == logging.DEBUG


def test_default_log_level(app):
    assert app.log.level == logging.INFO


def test_when_warm(app_warm, mock_http, mock_session, trigger_event_done):
    assert main.RuntimeState.app is app_warm
    main.main(trigger_event_done, context=None, http=mock_http,
              session=mock_session)
    assert main.RuntimeState.app is app_warm


def test_when_cold(app_cold, mock_http, mock_session, trigger_event_done):
    assert main.RuntimeState.app is None
    main.main(trigger_event_done, context=None, http=mock_http,
              session=mock_session)
    assert main.RuntimeState.app is not None


def test_multiple_calls(app_cold, mock_http, mock_session, trigger_event_done):
    assert main.RuntimeState.app is None
    main.main(trigger_event_done, context=None, http=mock_http,
              session=mock_session)
    assert main.RuntimeState.app is not None
    app_memo = main.RuntimeState.app
    main.main(trigger_event_done, context=None, http=mock_http,
              session=mock_session)
    assert main.RuntimeState.app is app_memo
    main.main(trigger_event_done, context=None, http=mock_http,
              session=mock_session)
    assert main.RuntimeState.app is app_memo


def test_gce_op_done_event(trigger_event_done, app, caplog):
    """The GCE_OPERATION_DONE event produces no log spam"""
    app.handle_event(trigger_event_done)
    assert '' == caplog.text


def test_gce_op_done_event_debug(trigger_event_done, app_debug, caplog):
    """The GCE_OPERATION_DONE event logs when debug"""
    app_debug.handle_event(trigger_event_done)
    assert 'No action taken' in caplog.text


def test_reports_to_project_logs_by_default(mock_env, vm_uri, event_id):
    log_entry = main.StructuredLog(vm_uri=vm_uri, event_id=event_id)
    assert 'projects/logging/logs/dns_vm_gc' == log_entry.log_name


def test_reports_stream_is_user_configurable(mock_env_log_stream, vm_uri,
                                             event_id):
    log_entry = main.StructuredLog(vm_uri=vm_uri, event_id=event_id)
    expected = 'organizations/000000000000/logs/dns-vm-gc-report'
    assert expected == log_entry.log_name
