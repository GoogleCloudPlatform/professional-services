#!/usr/bin/env python
# Copyright 2017 Google Inc.
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
    gcp-vpn-buildconf.py reads AWS' customer gateway XML configuratoin and
    outputs a gcp-vpn.jinja Demployment Manager configuration file
"""

from __future__ import print_function

import sys
import argparse
import xml.etree.ElementTree as ET
from jinja2 import Environment

PATHS = {
    'address': 'customer_gateway/tunnel_outside_address/ip_address',
    'asn': 'customer_gateway/bgp/asn',
    'bgp_tunnel': {
        'peerIp': 'vpn_gateway/tunnel_outside_address/ip_address',
        'sharedSecret': 'ike/pre_shared_key',
        'peerAsn': 'vpn_gateway/bgp/asn',
        'bgpIpAddress': 'customer_gateway/tunnel_inside_address/ip_address',
        'peerBgpIpAddress': 'vpn_gateway/tunnel_inside_address/ip_address'
    },
    'static_tunnel': {
        'peerIp': 'vpn_gateway/tunnel_outside_address/ip_address',
        'sharedSecret': 'ike/pre_shared_key',
    }
}

BGP_CONFIG = """
imports:
  - path: gcp-vpn.jinja

resources:
  - name: vpn
    type: gcp-vpn.jinja
    properties:
      network: {{ network }}
      region: {{ region }}
      address: {{ address }}
      asn: {{ asn }}
      tunnels:
      {%- for i in tunnels %}
        - peerIp: {{ i['peerIp'] }}
          secret: {{ i['sharedSecret'] }}
          peerAsn: {{ i['peerAsn'] }}
          bgpIpAddress: {{ i['bgpIpAddress'] }}
          peerBgpIpAddress: {{ i['peerBgpIpAddress'] }}
      {%- endfor %}
"""

STATIC_CONFIG = """
imports:
  - path: gcp-vpn.jinja

resources:
  - name: vpn
    type: gcp-vpn.jinja
    properties:
      network: {{ network }}
      region: {{ region }}
      address: {{ address }}
      tunnels:
      {%- for i in tunnels %}
        - peerIp: {{ i['peerIp'] }}
          secret: {{ i['sharedSecret'] }}
          localTrafficSelector:
          {%- for j in i['local_traffic_selector'] %}
            - {{ j }}
          {%- endfor %}
          remoteTrafficSelector:
          {%- for j in i['remote_traffic_selector'] %}
            - {{ j }}
          {%- endfor %}
      {%- endfor %}
"""


def main():
    ''' main '''

    parser = argparse.ArgumentParser(description="""
        Reads a CustomerGatewayConfiguration(XML) from stdin, and outputs a yaml file to use with gcp-vpn.jinja.""", usage="""
        aws ec2 describe-vpn-connections --filter Name=vpn-connection-id,Values=vpn-67c00420 --query VpnConnections[0].CustomerGatewayConfiguration --output text | ./gcp-vpn-buildconf.py --network https://www.googleapis.com/compute/v1/projects/xpn-host/global/networks/vpc >> gcp-vpn.yaml""")

    parser.add_argument('--region', default='us-east1')
    parser.add_argument('--network', required=True,
                        help='Fully-qualified network url')
    parser.add_argument('--local-traffic-selector', nargs='+')
    parser.add_argument('--remote-traffic-selector', nargs='+')
    args = parser.parse_args()

    try:
        tree = ET.parse(sys.stdin)
    except ValueError:
        print("InValid xml input. Verify aws cli command includes \"--query \
            VpnConnections[0].CustomerGatewayConfiguration \
            --output text\"", file=sys.stderr)
        sys.exit(1)

    params = {
        'region': args.region,
        'network': args.network,
        'tunnels': []
    }

    for i in tree.getroot().findall('ipsec_tunnel'):
        params['address'] = i.find(PATHS['address']).text
        if i.find(PATHS['asn']) is None:
            config = STATIC_CONFIG
            tunnel = {k: i.find(v).text for k, v in
                      PATHS['static_tunnel'].items()}
            tunnel['local_traffic_selector'] = args.local_traffic_selector
            tunnel['remote_traffic_selector'] = args.remote_traffic_selector
            params['tunnels'].append(tunnel)
        else:
            config = BGP_CONFIG
            params['asn'] = i.find(PATHS['asn']).text
            params['tunnels'].append(
                {k: i.find(v).text for k, v in PATHS['bgp_tunnel'].items()}
            )

    print(Environment().from_string(config).render(params).rstrip())

if __name__ == '__main__':
    main()
