#!/usr/bin/env python3

import json
import netaddr
import sys
import urllib.request
import yaml

GOOG_URL = "https://www.gstatic.com/ipranges/goog.json"
CLOUD_URL = "https://www.gstatic.com/ipranges/cloud.json"


def read_url(url):
    try:
        s = urllib.request.urlopen(url).read()
        return json.loads(s)
    except urllib.error.HTTPError:
        print("Invalid HTTP response from %s" % url)
        return {}
    except json.decoder.JSONDecodeError:
        print("Could not parse HTTP response from %s" % url)
        return {}


def main(custom_labels):
    goog_json = read_url(GOOG_URL)
    cloud_json = read_url(CLOUD_URL)

    if goog_json and cloud_json:

        print("# Please use update-ip-range-labels.sh to update this file.")
        print("# {} published: {}".format(GOOG_URL,
                                          goog_json.get('creationTime')))
        print("# {} published: {}".format(CLOUD_URL,
                                          cloud_json.get('creationTime')))

        goog_ipv4_cidrs = netaddr.IPSet()
        goog_ipv6_cidrs = netaddr.IPSet()
        for e in goog_json['prefixes']:
            if e.get('ipv4Prefix'):
                goog_ipv4_cidrs.add(e.get('ipv4Prefix'))
            if e.get('ipv6Prefix'):
                goog_ipv6_cidrs.add(e.get('ipv6Prefix'))
        cloud_ipv4_cidrs = netaddr.IPSet()
        cloud_ipv6_cidrs = netaddr.IPSet()
        for e in cloud_json['prefixes']:
            if e.get('ipv4Prefix'):
                cloud_ipv4_cidrs.add(e.get('ipv4Prefix'))
            if e.get('ipv6Prefix'):
                cloud_ipv6_cidrs.add(e.get('ipv6Prefix'))

        print("ipv4_range_labels:")
        ipv4_cidr_labels = custom_labels.get('ipv4_range_labels', {})
        if isinstance(ipv4_cidr_labels, dict):
            for ip, label in ipv4_cidr_labels.items():
                i = netaddr.IPNetwork(ip)
                print(' - ["{}", "{}", "{}"]'.format(label, i[0], i[-1]))
        for i in goog_ipv4_cidrs.difference(cloud_ipv4_cidrs).iter_cidrs():
            print(' - ["Google IPv4 CIDR", "{}", "{}"]'.format(i[0], i[-1]))

        print("ipv6_range_labels:")
        ipv6_cidr_labels = custom_labels.get('ipv6_range_labels', {})
        if isinstance(ipv6_cidr_labels, dict):
            for ip, label in ipv6_cidr_labels.items():
                i = netaddr.IPNetwork(ip)
                print(' - ["{}", "{}", "{}"]'.format(label, i[0], i[-1]))
        for i in goog_ipv6_cidrs.difference(cloud_ipv6_cidrs).iter_cidrs():
            print(' - ["Google IPv4 CIDR", "{}", "{}"]'.format(i[0], i[-1]))


if __name__ == '__main__':

    if 2 != len(sys.argv):
        print(
            'Expecting a single parameter which is the custom labels yaml'
            ' file path.',
            file=sys.stderr)
        sys.exit(1)

    try:
        with open(sys.argv[1], 'r') as stream:
            custom_labels = yaml.safe_load(stream)
    except Exception:
        print('Unable to read the custom labels file {}.'.format(sys.argv[1]),
              file=sys.stderr)
        sys.exit(1)

    main(custom_labels)
