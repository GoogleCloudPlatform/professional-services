#!/usr/bin/env python

# Copyright 2017 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""

route-trace enables user to find out exactly how traffic to a specific destination will be routed

Written by Michael Zuo mzuo@google.com
Strategic Cloud Engineer
July 2017

"""

import argparse
import os
import time
import json
import ipaddress


import googleapiclient.discovery
from six.moves import input


# [START wait_for_operation]
def wait_for_operation(compute, project, zone, operation):
    print('Waiting for operation to finish...')
    while True:
        result = compute.zoneOperations().get(
            project=project,
            zone=zone,
            operation=operation).execute()

        if result['status'] == 'DONE':
            print("done.")
            if 'error' in result:
                raise Exception(result['error'])
            return result

        time.sleep(1)
# [END wait_for_operation]


# [START run]

def main(destination, project, network, tag, verbose, wait=True):
    compute = googleapiclient.discovery.build('compute', 'v1')
    cloudresourcemanager = googleapiclient.discovery.build('cloudresourcemanager', 'v1')

    print('--------------------------------')
    print('| Routing Rules Trace Tool      |')
    print('--------------------------------')
    print('Evaluating Routing destined to %s in project %s network %s' % (destination, project, network))
    
    if str(tag) <> "None" : print('with consideration of routes with tag "%s"' % (tag))
    if str(verbose) <> "None" : print('in verbose mode')
    
    print (' ')
    
# filter list of routes by network        
    filter = 'network eq .*%s' % (network)
    result = compute.routes().list(project=project, filter=filter).execute()


# sort routes by ascending priority
    result = {'items': sorted(result['items'], key=lambda x: x['priority'], reverse=False)}
    #print  json.dumps({'items': sorted(result['items'], key=lambda x: x['priority'], reverse=False)}, indent=4)
    #print json.dumps(result, indent=4)   



    found_route = False
    priority = 1000
# evaluate each route to see if the destination IP range matches the destination IP

    for item in result['items']:
    	#print ('tag match is %s', (tag in item['tags']))
        #print json.dumps(item, indent=4)
        
        
        if found_route and (item['priority'] > priority) :
            break
            
    	if ('tags' not in item ) or (tag in item['tags']) :
    	# either no tag parameter was specified (evaluate routes that apply to all) or tag matched the list of tags in the route
			if ipaddress.ip_address(destination) in ipaddress.ip_network(item['destRange']):
			
			    if str(verbose) <> "None" : 
			        print ('Route "%s" with destination range of %s matched the destination IP %s' % (item['name'],item['destRange'], destination))

			    if not found_route :
			        best_route = item
			        found_route = True
			        priority = item['priority']
			    else:
			        if (int(item['destRange'].rpartition('/')[2]) > int(best_route['destRange'].rpartition('/')[2]) ):
			            best_route = item
			            if str(verbose) <> "None" : 
			                print ('Route "%s" has longer mask than the previous matched route' % item['name'])


			else: 
				if str(verbose) <> "None" : print ('Route "%s" with destination range of %s did not match the destination IP %s' % (item['name'],item['destRange'], destination))
    	else:
			if str(verbose) <> "None" : 
			    if str(tag) <> "None" :
					print ('Route "%s" with destination range of %s and tag "%s" did not match the tag specified "%s"' % (item['name'],item['destRange'], item['tags'], tag))
			    else: 
					print ('Route "%s" with destination range of %s and tag "%s" skipped since no tag parameter was specified' % (item['name'],item['destRange'], item['tags']))

    print(' ')


    item = best_route
    if 'nextHopIp' in item:
        print 'Route "%s" will be used. Traffic will be sent to IP %s.' % (item['name'], item['nextHopIp'])
    if 'nextHopGateway' in item:
        print 'Route "%s" will be used. Traffic will be sent to "%s".' % (item['name'], item['nextHopGateway'].rpartition('/')[2])
    if 'nextHopNetwork' in item:
        print 'Route "%s" will be used. Traffic will be sent to Network "%s".' % (item['name'], item['nextHopNetwork'].rpartition('/')[2])
    if 'nextHopInstance' in item:
        print 'Route "%s" will be used. Traffic will be sent to instance "%s".' % (item['name'], item['nextHopInstance'].rpartition('/')[2])        		
    if 'nextHopVpnTunnel' in item:
        print 'Route "%s" will be used. Traffic will be sent to VPN Tunnel "%s".' % (item['name'], item['nextHopVpnTunnel'].rpartition('/')[2])        		
    

    

if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter)

    parser.add_argument('destination', help='Destination IP')
    parser.add_argument(
        '--project',
        default='',
        help='Your Google Cloud project name')
        
    parser.add_argument(
        '--network',
        default='default',
        help='Your Google Cloud network name')

    parser.add_argument(
        '--tag',
        help='Your Google Cloud route tag')
        
    parser.add_argument(
        '--verbose',
        help='Enable verbose evaluation of routes')

    args = parser.parse_args()

    main(args.destination, args.project, args.network, args.tag, args.verbose)
# [END run]
