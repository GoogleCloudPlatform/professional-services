#!/usr/bin/env python3
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
import logging
import os
import re
from pythonjsonlogger.json import JsonFormatter
import json
import traceback
from collections.abc import Iterable
from fastapi import FastAPI
from google.cloud import compute_v1
from google.api_core.gapic_v1.client_info import ClientInfo
from netaddr import IPNetwork, cidr_merge
import uvicorn

RECONCILER_VERSION = "1.0.0"
logHandler = logging.StreamHandler()
logHandler.setFormatter(JsonFormatter())
logging.basicConfig(
    level=logging.INFO,
    handlers=[logHandler]
)
logging.getLogger("google").propagate = True
logger = logging.getLogger(__name__)

class ConfigCloudRouter:
    name: str
    region: str
    project_id: str
    cidrs: list[str]
    summarize: bool
    update_peers: bool

    def __init__(self, config: dict):
        self.name = config["name"]
        self.region = config["region"]
        self.project_id = config["project_id"]
        self.cidrs = [IPNetwork(c) for c in config["cidrs"]] if "cidrs" in config else [IPNetwork("0.0.0.0/0")]
        self.summarize = bool(config["summarize"]) if "summarize" in config else False
        self.update_peers = bool(config["update_peers"]) if "update_peers" in config else True

    def to_dict(self):
        return {
            "name": self.name,
            "region": self.region,
            "project_id": self.project_id,
            "cidrs": [str(c) for c in self.cidrs],
            "summarize": self.summarize,
            "update_peers": self.update_peers,
        }

class Config:
    project_ids: list[str]
    regions: list[str]
    filter_: str | None
    cloud_routers: list[ConfigCloudRouter]
    include_descriptions: bool
    timeout: float
    dry_run: bool
    description_regexp_filter: str | None

    def __init__(self, config: dict):
        self.project_ids = config["project_ids"]
        self.regions = config["regions"]
        self.filter_ = config["filter"]
        self.cloud_routers = []
        for router in config["cloud_routers"]:
            self.cloud_routers.append(ConfigCloudRouter(router))
        self.include_descriptions = bool(config["include_descriptions"]) if "include_descriptions" in config else False
        self.timeout = float(config["timeout"]) if "timeout" in config else 60.0
        self.dry_run = bool(config["dry_run"]) if "dry_run" in config else False
        self.description_regexp_filter = config["description_regexp_filter"] if "description_regexp_filter" in config else None

    def to_dict(self):
        return {
            "project_ids": self.project_ids,
            "regions": self.regions,
            "filter": self.filter_,
            "description_regexp_filter": self.description_regexp_filter,
            "cloud_routers": [c.to_dict() for c in self.cloud_routers],
            "include_descriptions": self.include_descriptions,
            "timeout": self.timeout,
            "dry_run": self.dry_run
        }


config_str = os.getenv("RECONCILER_CONFIG")
if not config_str:
    logger.fatal("No configuration found in RECONCILER_CONFIG environment variable!")
    quit()

try:
    config = Config(json.loads(config_str))
except json.decoder.JSONDecodeError as e:
    logger.fatal(f"Failed to parse configuration: {e}", extra={"backtrace": traceback.format_exception(e)})
    quit()

if config.dry_run:
    logger.info("Dry-run mode.", extra={"config": config.to_dict()})

app = FastAPI()

def get_branded_client_info() -> ClientInfo: 
    user_agent = "google-pso-tool/cloud-router-hybrid-reconciler/%s" % (RECONCILER_VERSION)
    return ClientInfo(user_agent=user_agent)

def filter_cidrs(filter_cidrs: list[IPNetwork], cidrs_for_router: dict[str, str], current_router_advertisements: dict[str, str], cidr_descriptions: dict[str, str], include_descriptions: bool) -> dict[str, str]:
    new_router_advertisements = {}
    for range_, desc in current_router_advertisements.items():
        range_cidr = IPNetwork(range_)
        outside_ours = False
        for cidr_filter in filter_cidrs:
            if range_cidr not in cidr_filter:
                outside_ours = True
                break
        if outside_ours:
            new_router_advertisements[range_] = desc

    for cidr in cidrs_for_router:
        new_router_advertisements[str(cidr)] = cidr_descriptions[str(cidr)] if include_descriptions else ""

    return new_router_advertisements

@app.get("/")
async def root() -> dict:
    return {"ok": True}

@app.post("/reconcile")
async def reconcile() -> dict:
    client_info = client_info=get_branded_client_info()
    
    logger.info(f"Starting to fetch IP addresses...")
    addresses_client = compute_v1.AddressesClient(client_info=client_info)

    all_addresses = {}
    for project in config.project_ids:
        for region in config.regions:
            logger.info(f"Fetching IP addresses from project {project}, region {region}...")
            request = compute_v1.ListAddressesRequest(
                project=project,
                region=region,
                filter=config.filter_,
            )   

            page_result = addresses_client.list(request=request)

            for response in page_result:
                description = response.name
                if response.description != "":
                    description = "%s (%s)" % (description, response.description)
                if config.description_regexp_filter:
                    if not re.match(config.description_regexp_filter, response.description):
                        logger.info(f"Skipping address {response.address} because its description ('{response.description}') does not match description filter.")
                        continue
                all_addresses[response.address] = (description)

    all_cidrs = {}
    for addr, desc in all_addresses.items():
        all_cidrs["%s/32" % (addr)] = (desc, IPNetwork("%s/32" % (addr)))

    logger.info(f"Fetched all IP addresses ({len(all_cidrs.keys())} addresses), starting to update Cloud Routers.")
    if config.dry_run:
        for route, desc in all_cidrs.items(): 
            logger.info(f"(dry-run) Route: {route}: {desc[0]}")

    routers_client = compute_v1.RoutersClient(client_info=client_info)
    for router in config.cloud_routers:
        cloud_router = routers_client.get(project=router.project_id, region=router.region, router=router.name)

        cidrs_for_router = []
        for addr, desc in all_cidrs.items():
            cidrs_for_router.append(IPNetwork(addr))
        all_cidrs_for_router = cidrs_for_router
        if router.summarize:
            cidrs_for_router = cidr_merge(cidrs_for_router)

        cidr_descriptions = {}
        for cidr in cidrs_for_router:
            if str(cidr.netmask) == "255.255.255.255":
                cidr_descriptions[str(cidr)] = all_cidrs[str(cidr)][0]
            else:
                descs = []
                for all_cidr, desc_cidr in all_cidrs.items():
                    if desc_cidr[1] in cidr:
                        descs.append(desc_cidr[0])
                cidr_descriptions[str(cidr)] = ", ".join(descs)

        current_router_advertisements = {}
        for range_ in cloud_router.bgp.advertised_ip_ranges:
            current_router_advertisements[range_.range_] = range_.description

        new_router_advertisements = filter_cidrs(router.cidrs, cidrs_for_router, current_router_advertisements, cidr_descriptions, config.include_descriptions)
        logger.info(f"Updating Cloud Router {router.name} in {router.region}: {len(current_router_advertisements.keys())} current routes, {len(new_router_advertisements.keys())-len(current_router_advertisements.keys())} new routes, {len(new_router_advertisements.keys())} in total.")

        cloud_router.bgp.advertised_ip_ranges = []
        for route, desc in new_router_advertisements.items():
            advertised_ip_range = compute_v1.types.RouterAdvertisedIpRange(range_=route, description=desc if config.include_descriptions else "")
            cloud_router.bgp.advertised_ip_ranges.append(advertised_ip_range)
        
        if router.update_peers:
            new_bgp_peers = []
            for bgp_peer in cloud_router.bgp_peers:
                current_peer_advertisements = {}
                for range_ in bgp_peer.advertised_ip_ranges:
                    current_peer_advertisements[range_.range_] = range_.description

                new_peer_advertisements = filter_cidrs(router.cidrs, cidrs_for_router, current_peer_advertisements, cidr_descriptions, config.include_descriptions)

                bgp_peer.advertised_ip_ranges = []
                for route, desc in new_router_advertisements.items():
                    advertised_ip_range = compute_v1.types.RouterAdvertisedIpRange(range_=route, description=desc)
                    bgp_peer.advertised_ip_ranges.append(advertised_ip_range)

                logger.info(f"Updating Cloud Router {router.name} peer {bgp_peer.peer_ip_address} ({bgp_peer.interface_name}) in {router.region}: {len(current_peer_advertisements.keys())} current routes, {len(new_peer_advertisements.keys())-len(current_peer_advertisements.keys())} new routes, {len(new_peer_advertisements.keys())} in total.")
                new_bgp_peers.append(bgp_peer)
            cloud_router.bgp_peers = new_bgp_peers
        else:
            logger.info(f"Skipping updating {len(cloud_router.bgp_peers)} BGP peers as per configuration.")

        if config.dry_run:
            logger.info(f"(dry-run) Cloud Router advertised ranges: ")
            for range_ in cloud_router.bgp.advertised_ip_ranges:
                logger.info(f"(dry-run)  IP range: {range_.range_.ljust(20)}  Description: {range_.description}")
            for bgp_peer in cloud_router.bgp_peers:
                logger.info(f"(dry-run)  - Cloud Router BGP peer {bgp_peer.peer_ip_address} ({bgp_peer.interface_name}) advertised ranges:")
                for range_ in bgp_peer.advertised_ip_ranges:
                    logger.info(f"(dry-run)      IP range: {range_.range_.ljust(20)}  Description: {range_.description}")

        else:
            patch_result = routers_client.patch(project=router.project_id, region=router.region, router=router.name, router_resource=cloud_router)
            operation_result = patch_result.result(timeout=config.timeout)
            if operation_result:
                if operation_result.error_code:
                    logger.error(f"Errors encountered during Cloud Router update: {operation_result.error_message}", extra={"operation_result": operation_result})
                if operation_result.warning:
                    logger.warn(f"Warnings encountered during Cloud Router update.", extra={"warnings": operation_result.warnings})

            logger.info(f"Updated Cloud Router {router.name} in {router.region}.")
    
    logger.info("Finished processing.")

    return {"ok": True}

if __name__ == '__main__':
    port = int(os.getenv("PORT")) if os.getenv("PORT") else 8080
    logger.info(f"Server is listening on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port, log_config={"version": 1, "disable_existing_loggers": False, "formatters": {"default": {"()":JsonFormatter}}})