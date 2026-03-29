# Copyright 2026 Google LLC
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

import unittest.mock as mock
from fastapi.testclient import TestClient
from main import app, common_parameters
import json
import os
from google.cloud import compute_v1

client = TestClient(app)


def compare_advertised_ip_ranges(
        a: list[compute_v1.types.RouterAdvertisedIpRange],
        b: list[compute_v1.types.RouterAdvertisedIpRange]) -> bool:
    for item_a in a:
        match = False
        for item_b in b:
            if item_b.range == item_a.range_ and item_b.description == item_a.description:
                match = True
                break
        if not match:
            return False
    return True


def test_reconcile_basic():
    reconciler_config = {
        "project_ids": ["my-project-id"],
        "regions": ["europe-west4"],
        "filter": "addressType=INTERNAL",
        "cloud_routers": [{
            "name": "my-cr",
            "region": "europe-west4",
            "project_id": "my-project-id",
            "cidrs": ["10.42.42.0/24"],
            "summarize": False
        }],
        "include_descriptions": False
    }
    os.environ["RECONCILER_CONFIG"] = json.dumps(reconciler_config)

    addresses_client_mock = mock.MagicMock()
    addresses = [
        compute_v1.types.Address(address="10.42.42.123",
                                 address_type="INTERNAL",
                                 labels={"hybridroute": "true"}),
        compute_v1.types.Address(address="10.42.42.124",
                                 address_type="INTERNAL",
                                 labels={"hybridroute": "true"}),
        compute_v1.types.Address(address="10.42.42.125",
                                 address_type="INTERNAL",
                                 labels={"hybridroute": "true"})
    ]
    addresses_client_mock.list.return_value = addresses

    routers_client_mock = mock.MagicMock()
    advertised_ip_ranges = [
        compute_v1.types.RouterAdvertisedIpRange(
            range_="192.168.1.0/24", description="Not to be filtered"),
        compute_v1.types.RouterAdvertisedIpRange(range_="10.42.42.126/32",
                                                 description="To be filtered"),
    ]
    router_bgp_peer = compute_v1.types.RouterBgpPeer(
        ip_address="169.254.10.4",
        peer_ip_address="169.254.10.5",
        advertised_ip_ranges=advertised_ip_ranges,
    )
    router_bgp = compute_v1.types.RouterBgp(
        advertised_ip_ranges=advertised_ip_ranges)
    router = compute_v1.types.Router(bgp=router_bgp,
                                     bgp_peers=[
                                         router_bgp_peer,
                                     ])
    routers_client_mock.get.return_value = router

    extended_operation_mock = mock.MagicMock()
    operation_result_mock = mock.MagicMock()
    operation_result_mock.warning = False
    operation_result_mock.error_code = None
    extended_operation_mock.result.return_value = operation_result_mock
    routers_client_mock.patch.return_value = extended_operation_mock

    app.dependency_overrides[common_parameters] = lambda: {
        "addresses_client": addresses_client_mock,
        "routers_client": routers_client_mock,
    }

    response = client.post("/reconcile")
    assert response.status_code == 200
    routers_client_mock.get.assert_called_once_with(
        project=reconciler_config["cloud_routers"][0]["project_id"],
        region=reconciler_config["cloud_routers"][0]["region"],
        router=reconciler_config["cloud_routers"][0]["name"])
    routers_client_mock.patch.assert_called_once_with(
        project=reconciler_config["cloud_routers"][0]["project_id"],
        region=reconciler_config["cloud_routers"][0]["region"],
        router=reconciler_config["cloud_routers"][0]["name"],
        router_resource=mock.ANY)

    args, kwargs = routers_client_mock.patch.call_args
    correct_advertised_ip_ranges = [
        compute_v1.types.RouterAdvertisedIpRange(
            range_="192.168.1.0/24", description="Not to be filtered"),
        compute_v1.types.RouterAdvertisedIpRange(range_="10.42.42.123/32",
                                                 description=""),
        compute_v1.types.RouterAdvertisedIpRange(range_="10.42.42.124/32",
                                                 description=""),
        compute_v1.types.RouterAdvertisedIpRange(range_="10.42.42.125/32",
                                                 description=""),
    ]
    assert compare_advertised_ip_ranges(
        kwargs["router_resource"].bgp_peers[0].advertised_ip_ranges,
        correct_advertised_ip_ranges)


def test_reconcile_label_filter():
    reconciler_config = {
        "project_ids": ["my-project-id"],
        "regions": ["europe-west4"],
        "filter": "addressType=INTERNAL",
        "label": "hybridroute",
        "label_regexp_filter": "^true$",
        "cloud_routers": [{
            "name": "my-cr",
            "region": "europe-west4",
            "project_id": "my-project-id",
            "cidrs": ["10.42.42.0/24"],
            "summarize": True
        }],
        "include_descriptions": False
    }
    os.environ["RECONCILER_CONFIG"] = json.dumps(reconciler_config)

    addresses_client_mock = mock.MagicMock()
    addresses = [
        compute_v1.types.Address(address="10.42.42.123",
                                 address_type="INTERNAL",
                                 labels={"hybridroute": "true"}),
        compute_v1.types.Address(address="10.42.42.124",
                                 address_type="INTERNAL",
                                 labels={}),
        compute_v1.types.Address(address="10.42.42.125",
                                 address_type="INTERNAL",
                                 labels={"hybridroute": "true"})
    ]
    addresses_client_mock.list.return_value = addresses

    routers_client_mock = mock.MagicMock()
    advertised_ip_ranges = [
        compute_v1.types.RouterAdvertisedIpRange(
            range_="192.168.1.0/24", description="Not to be filtered"),
        compute_v1.types.RouterAdvertisedIpRange(range_="10.42.42.126/32",
                                                 description="To be filtered"),
    ]
    router_bgp_peer = compute_v1.types.RouterBgpPeer(
        ip_address="169.254.10.4",
        peer_ip_address="169.254.10.5",
        advertised_ip_ranges=advertised_ip_ranges,
    )
    router_bgp = compute_v1.types.RouterBgp(
        advertised_ip_ranges=advertised_ip_ranges)
    router = compute_v1.types.Router(bgp=router_bgp,
                                     bgp_peers=[
                                         router_bgp_peer,
                                     ])
    routers_client_mock.get.return_value = router

    extended_operation_mock = mock.MagicMock()
    operation_result_mock = mock.MagicMock()
    operation_result_mock.warning = False
    operation_result_mock.error_code = None
    extended_operation_mock.result.return_value = operation_result_mock
    routers_client_mock.patch.return_value = extended_operation_mock

    app.dependency_overrides[common_parameters] = lambda: {
        "addresses_client": addresses_client_mock,
        "routers_client": routers_client_mock,
    }

    response = client.post("/reconcile")
    assert response.status_code == 200
    routers_client_mock.get.assert_called_once_with(
        project=reconciler_config["cloud_routers"][0]["project_id"],
        region=reconciler_config["cloud_routers"][0]["region"],
        router=reconciler_config["cloud_routers"][0]["name"])
    routers_client_mock.patch.assert_called_once_with(
        project=reconciler_config["cloud_routers"][0]["project_id"],
        region=reconciler_config["cloud_routers"][0]["region"],
        router=reconciler_config["cloud_routers"][0]["name"],
        router_resource=mock.ANY)

    args, kwargs = routers_client_mock.patch.call_args
    correct_advertised_ip_ranges = [
        compute_v1.types.RouterAdvertisedIpRange(
            range_="192.168.1.0/24", description="Not to be filtered"),
        compute_v1.types.RouterAdvertisedIpRange(range_="10.42.42.123/32",
                                                 description=""),
        compute_v1.types.RouterAdvertisedIpRange(range_="10.42.42.125/32",
                                                 description=""),
    ]
    assert compare_advertised_ip_ranges(
        kwargs["router_resource"].bgp_peers[0].advertised_ip_ranges,
        correct_advertised_ip_ranges)


def test_reconcile_summarize():
    reconciler_config = {
        "project_ids": ["my-project-id"],
        "regions": ["europe-west4"],
        "filter": "addressType=INTERNAL",
        "cloud_routers": [{
            "name": "my-cr",
            "region": "europe-west4",
            "project_id": "my-project-id",
            "cidrs": ["10.42.42.0/24"],
            "summarize": True
        }],
        "include_descriptions": False
    }
    os.environ["RECONCILER_CONFIG"] = json.dumps(reconciler_config)

    addresses_client_mock = mock.MagicMock()
    addresses = [
        compute_v1.types.Address(address="10.42.42.123",
                                 address_type="INTERNAL",
                                 labels={"hybridroute": "true"}),
        compute_v1.types.Address(address="10.42.42.124",
                                 address_type="INTERNAL",
                                 labels={}),
        compute_v1.types.Address(address="10.42.42.125",
                                 address_type="INTERNAL",
                                 labels={"hybridroute": "true"})
    ]
    addresses_client_mock.list.return_value = addresses

    routers_client_mock = mock.MagicMock()
    advertised_ip_ranges = [
        compute_v1.types.RouterAdvertisedIpRange(
            range_="192.168.1.0/24", description="Not to be filtered"),
        compute_v1.types.RouterAdvertisedIpRange(range_="10.42.42.126/32",
                                                 description="To be filtered"),
    ]
    router_bgp_peer = compute_v1.types.RouterBgpPeer(
        ip_address="169.254.10.4",
        peer_ip_address="169.254.10.5",
        advertised_ip_ranges=advertised_ip_ranges,
    )
    router_bgp = compute_v1.types.RouterBgp(
        advertised_ip_ranges=advertised_ip_ranges)
    router = compute_v1.types.Router(bgp=router_bgp,
                                     bgp_peers=[
                                         router_bgp_peer,
                                     ])
    routers_client_mock.get.return_value = router

    extended_operation_mock = mock.MagicMock()
    operation_result_mock = mock.MagicMock()
    operation_result_mock.warning = False
    operation_result_mock.error_code = None
    extended_operation_mock.result.return_value = operation_result_mock
    routers_client_mock.patch.return_value = extended_operation_mock

    app.dependency_overrides[common_parameters] = lambda: {
        "addresses_client": addresses_client_mock,
        "routers_client": routers_client_mock,
    }

    response = client.post("/reconcile")
    assert response.status_code == 200
    routers_client_mock.get.assert_called_once_with(
        project=reconciler_config["cloud_routers"][0]["project_id"],
        region=reconciler_config["cloud_routers"][0]["region"],
        router=reconciler_config["cloud_routers"][0]["name"])
    routers_client_mock.patch.assert_called_once_with(
        project=reconciler_config["cloud_routers"][0]["project_id"],
        region=reconciler_config["cloud_routers"][0]["region"],
        router=reconciler_config["cloud_routers"][0]["name"],
        router_resource=mock.ANY)

    args, kwargs = routers_client_mock.patch.call_args
    correct_advertised_ip_ranges = [
        compute_v1.types.RouterAdvertisedIpRange(
            range_="192.168.1.0/24", description="Not to be filtered"),
        compute_v1.types.RouterAdvertisedIpRange(range_="10.42.42.123/32",
                                                 description=""),
        compute_v1.types.RouterAdvertisedIpRange(range_="10.42.42.124/31",
                                                 description=""),
    ]
    assert compare_advertised_ip_ranges(
        kwargs["router_resource"].bgp_peers[0].advertised_ip_ranges,
        correct_advertised_ip_ranges)


def test_reconcile_dont_skip_router():
    reconciler_config = {
        "project_ids": ["my-project-id"],
        "regions": ["europe-west4"],
        "filter": "addressType=INTERNAL",
        "cloud_routers": [{
            "name": "my-cr",
            "region": "europe-west4",
            "project_id": "my-project-id",
            "cidrs": ["10.42.42.0/24"],
            "summarize": True,
            "update_router": True,
        }],
        "include_descriptions": True
    }
    os.environ["RECONCILER_CONFIG"] = json.dumps(reconciler_config)

    addresses_client_mock = mock.MagicMock()
    addresses = [
        compute_v1.types.Address(address="10.42.42.123",
                                 name="test-1",
                                 address_type="INTERNAL",
                                 labels={"hybridroute": "true"}),
        compute_v1.types.Address(address="10.42.42.124",
                                 name="test-2",
                                 address_type="INTERNAL",
                                 labels={}),
        compute_v1.types.Address(address="10.42.42.125",
                                 name="test-3",
                                 address_type="INTERNAL",
                                 labels={"hybridroute": "true"})
    ]
    addresses_client_mock.list.return_value = addresses

    routers_client_mock = mock.MagicMock()
    advertised_ip_ranges = [
        compute_v1.types.RouterAdvertisedIpRange(
            range_="192.168.1.0/24", description="Not to be filtered"),
        compute_v1.types.RouterAdvertisedIpRange(range_="10.42.42.126/32",
                                                 description="To be filtered"),
    ]
    router_bgp_peer = compute_v1.types.RouterBgpPeer(
        ip_address="169.254.10.4",
        peer_ip_address="169.254.10.5",
        advertised_ip_ranges=advertised_ip_ranges,
    )
    router_bgp = compute_v1.types.RouterBgp(
        advertised_ip_ranges=advertised_ip_ranges)
    router = compute_v1.types.Router(bgp=router_bgp,
                                     bgp_peers=[
                                         router_bgp_peer,
                                     ])
    routers_client_mock.get.return_value = router

    extended_operation_mock = mock.MagicMock()
    operation_result_mock = mock.MagicMock()
    operation_result_mock.warning = False
    operation_result_mock.error_code = None
    extended_operation_mock.result.return_value = operation_result_mock
    routers_client_mock.patch.return_value = extended_operation_mock

    app.dependency_overrides[common_parameters] = lambda: {
        "addresses_client": addresses_client_mock,
        "routers_client": routers_client_mock,
    }

    response = client.post("/reconcile")
    assert response.status_code == 200
    routers_client_mock.get.assert_called_once_with(
        project=reconciler_config["cloud_routers"][0]["project_id"],
        region=reconciler_config["cloud_routers"][0]["region"],
        router=reconciler_config["cloud_routers"][0]["name"])
    routers_client_mock.patch.assert_called_once_with(
        project=reconciler_config["cloud_routers"][0]["project_id"],
        region=reconciler_config["cloud_routers"][0]["region"],
        router=reconciler_config["cloud_routers"][0]["name"],
        router_resource=mock.ANY)

    args, kwargs = routers_client_mock.patch.call_args
    correct_advertised_ip_ranges = [
        compute_v1.types.RouterAdvertisedIpRange(
            range_="192.168.1.0/24", description="Not to be filtered"),
        compute_v1.types.RouterAdvertisedIpRange(range_="10.42.42.123/32",
                                                 description="test-1"),
        compute_v1.types.RouterAdvertisedIpRange(range_="10.42.42.124/31",
                                                 description="test-2, test-3"),
    ]
    print(kwargs["router_resource"].bgp.advertised_ip_ranges)
    assert compare_advertised_ip_ranges(
        kwargs["router_resource"].bgp.advertised_ip_ranges,
        correct_advertised_ip_ranges)
    assert compare_advertised_ip_ranges(
        kwargs["router_resource"].bgp_peers[0].advertised_ip_ranges,
        correct_advertised_ip_ranges)
