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
import main
import pytest
import logging
from googleapiclient.http import HttpMock
from googleapiclient.http import HttpMockSequence
from helpers import readfile
from main import IP_NOT_AVAILABLE_MSG
from main import LOGNAME


class HttpMockSequenceRecorder(HttpMockSequence):
    """Records requests for later use in assertions"""
    def __init__(self, iterable):
        super().__init__(iterable)
        self.saved_requests = []

    def request(self, uri, method='GET', body=None, headers=None,
                redirections=1, connection_type=None):
        req = {'uri': uri, 'method': method, 'body': body, 'headers': headers}
        self.saved_requests.append(req)
        return super().request(uri, method, body, headers, redirections,
                               connection_type)


@pytest.fixture
def mock_instance_resource():
    """Mocks a compute.instances.get instance resource when the VM exists."""
    return json.loads(readfile('instance.json'))


@pytest.fixture
def mock_instance_resource_no_network():
    """Mocks a compute.instances.get result when the VM has no network."""
    return json.loads(readfile('instance-no-network.json'))


@pytest.fixture
def mock_env(monkeypatch):
    """Sets required environment variables."""
    monkeypatch.setenv("DNS_VM_GC_DNS_PROJECT", "my-vpc-host")
    monkeypatch.setenv("DNS_VM_GC_DNS_ZONES",
                       "my-nonprod-private-zone,my-prod-private-zone")


@pytest.fixture
def mock_env_no_debug(monkeypatch, mock_env):
    monkeypatch.delenv("DEBUG", False)


@pytest.fixture
def mock_http():
    return HttpMock()


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
def mock_event_data():
    """Empty dict representing the minimal data in a pubsub message."""
    return {}


@pytest.fixture
def trigger_event():
    """Input data from a Pub/Sub GCE_API_CALL trigger event"""
    return {'data': base64.b64encode(readfile('trigger-event.json').encode())}


@pytest.fixture
def trigger_event_done():
    """Input data from a Pub/Sub GCE_OPERATION_DONE trigger event"""
    return {
        'data': base64.b64encode(readfile('trigger-event-done.json').encode())
    }


@pytest.fixture
def no_ip_log():
    """Example of a structured log message when the IP is not available

    This structure is intended to provide an convenient way to report on A
    records which were not automatically cleaned up.
    """
    return {
        'message': IP_NOT_AVAILABLE_MSG,
        'reason': 'IP_NOT_AVAILABLE',
        'project': 'user-dev-242122',
        'zone': 'us-west1-a',
        'instance': 'test',
    }

def test_print_error_no_data(capsys, mock_env, mock_event_data):
    with pytest.raises(KeyError) as err:
        main.main(mock_event_data, None)
    assert "Expected data dictionary contains key 'data'" in str(err.value)


def test_main_error_no_project(capsys, mock_env_no_proj, mock_event_data):
    with pytest.raises(EnvironmentError) as err:
        main.main(mock_event_data, None)
    assert "Env var DNS_VM_GC_DNS_PROJECT is required" in str(err.value)


def test_main_error_no_zones(capsys, mock_env_no_zones, mock_event_data):
    with pytest.raises(EnvironmentError) as err:
        main.main(mock_event_data, None)
    assert "Env var DNS_VM_GC_DNS_ZONES is required" in str(err.value)


def test_ip_address(capsys, mock_env, mock_instance_resource):
    ip = main.ip_address(mock_instance_resource)
    assert ip == "10.138.0.44"


def test_ip_address_no_network(capsys, mock_env,
                               mock_instance_resource_no_network):
    """ip_address should return None when the VM has no IP addresses"""
    ip = main.ip_address(mock_instance_resource_no_network)
    assert ip is None


def test_aborts_when_vm_has_been_deleted(capsys, caplog, mock_env,
                                         trigger_event):
    """Aborts when the race against the VM delete operation is lost.

    In this scenario, the API returns 404 not found for the instance."""
    http = HttpMockSequenceRecorder([
        ({'status': '200'}, readfile('compute-v1.json')),
        ({'status': '404'}, ''),
    ])
    main.dns_vm_gc(trigger_event, http=http)
    assert 'projects/user-dev-242122/zones/us-west1-a/instances/test' \
        in http.saved_requests[1]['uri']
    assert 'Could not get IP address' in caplog.text


def test_suggestion_when_managed_zone_not_found(capsys, mock_env,
                                                trigger_event, caplog):
    """Handles a 404 not found and suggests checking configuration"""
    http = HttpMockSequenceRecorder([
        # Get IP address path
        ({'status': '200'}, readfile('compute-v1.json')),
        ({'status': '200'}, readfile('instance.json')),
        # my-nonprod-private-zone
        ({'status': '200'}, readfile('dns-v1.json')),
        ({'status': '404'}, ''),
        # my-prod-private-zone
        ({'status': '200'}, readfile('dns-v1.json')),
        ({'status': '404'}, ''),
    ])
    num_deleted = main.dns_vm_gc(trigger_event, http=http)
    out, err = capsys.readouterr()
    assert 0 == num_deleted
    expected = ('Check managed zones specified in DNS_VM_GC_DNS_ZONES '
                'exist in DNS_VM_GC_DNS_PROJECT')
    assert expected in caplog.text


def test_delete_happens_one_vm_matches(capsys, mock_env, trigger_event):
    """Deletes the A record matching the IP address of the VM."""
    http = HttpMockSequenceRecorder([
        # Get IP address path
        ({'status': '200'}, readfile('compute-v1.json')),
        ({'status': '200'}, readfile('instance.json')),
        # my-nonprod-private-zone
        ({'status': '200'}, readfile('dns-v1.json')),
        ({'status': '200'}, readfile('rrsets.json')),
        # This is the deletion request and response
        ({'status': '200'}, readfile('dns-v1.json')),
        ({'status': '200'}, readfile('dns-change.json')),
        # my-prod-private-zone
        ({'status': '200'}, readfile('dns-v1.json')),
        ({'status': '200'}, readfile('rrsets-empty.json')),
    ])
    num_deleted = main.dns_vm_gc(trigger_event, http=http)
    out, err = capsys.readouterr()
    assert 1 == num_deleted
    assert 'my-vpc-host/managedZones/my-nonprod-private-zone/changes' \
        in http.saved_requests[5]['uri']


def test_debug_env_log_level(capsys, mock_env_debug, mock_event_data, caplog,
                             mock_http):
    """Log level is DEBUG when DEBUG=1"""
    with pytest.raises(KeyError):
        main.dns_vm_gc(mock_event_data, http=mock_http)
    log = logging.getLogger(LOGNAME)
    assert log.level == logging.DEBUG


def test_default_log_level_error(capsys, mock_env_no_debug, mock_event_data,
                                 caplog, mock_http):
    """Log level is ERROR by default"""
    with pytest.raises(KeyError):
        main.dns_vm_gc(mock_event_data, http=mock_http)
    log = logging.getLogger(LOGNAME)
    assert log.level == logging.INFO


def test_fails_when_no_ip(mock_env, caplog, trigger_event, mock_http):
    num_deleted = main.dns_vm_gc(trigger_event, ip_provided=False,
                                 http=mock_http)
    assert 'Could not get IP address' in caplog.text
    assert 0 == num_deleted


def test_no_action_on_gce_operation_done(mock_env_debug, caplog,
                                         trigger_event_done, mock_http):
    """The GCE_OPERATION_DONE event triggers no action taken"""
    num_deleted = main.dns_vm_gc(trigger_event_done, ip_provided=False,
                                 http=mock_http)
    assert 'No action taken' in caplog.text
    assert 0 == num_deleted



def test_structured_event_when_cannot_delete(
        mock_env, caplog, trigger_event, mock_http, no_ip_log):
    """Logs a structured message for reporting purposes

    The user should be able to answer the question, "What DNS records were not
    automatically deleted, which I need to pay attention to?"
    """
    main.dns_vm_gc(trigger_event, ip_provided=False, http=mock_http)
    logs = [r for r in caplog.records if 'IP_NOT_AVAILABLE' in r.message]
    assert 1 == len(logs)
    structured_logs = [json.loads(r.message) for r in logs]
    assert [no_ip_log] == structured_logs


def run(fname='trigger-event.json', ip='10.138.0.45'):
    """Runs using the provided fixture event and ip address.

    The default arguments execute as if the "test" VM were deleted and this
    function is able to obtain the IP of the VM.  This works by providing the
    same event recorded when the VM was actually deleted.

    This function is intended for interactive development and testing.
    Injecting the IP is useful when the VM has already been deleted but the DNS
    record has not, the IP lookup API call may be skipped when the IP is known
    and provided, e.g.  using interactive python on a local development
    workstation.

    This function calls the entry point in the same way the Google Cloud
    Function will be called by Pub/Sub.
    """
    # Configure logging for interactive repl
    log = logging.getLogger(LOGNAME)
    console_handler = logging.StreamHandler()
    log.addHandler(console_handler)

    data = {'data': base64.b64encode(readfile(fname).encode())}
    # Simulate a VM deletion event from Pub/Sub
    main.dns_vm_gc(data, None, ip)
