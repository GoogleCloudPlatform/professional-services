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

fw-trace is a Google Cloud Platform troubleshooting tool that determines 
which firewall rules applies given the source and destination of the traffic



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

def main(src,dst,protocol,port,project,network,src_tag,dst_tag,verbose, wait=True):
    compute = googleapiclient.discovery.build('compute', 'beta')
    cloudresourcemanager = googleapiclient.discovery.build('cloudresourcemanager', 'v1')


    if (protocol <> "tcp") and (protocol <> "udp"):
		port = ""
		
		
    print('--------------------------------')
    print('| Firewall Rule Trace Tool     |')
    print('--------------------------------')		
    print('Evaluating firewall rules for %s:%s traffic from %s to %s in project %s network %s' % (protocol,port,src,dst,project,network))

    
    if str(src_tag) <> "None" : print('with consideration of source tag "%s"' % (src_tag))
    if str(dst_tag) <> "None" : print('and destination tag "%s"' % (dst_tag))
    if str(verbose) <> "None" : print('in verbose mode')
    
    print (' ')
    

    #print json.dumps(result, indent=4) 

    egress_check = False
    ingress_check = False
	
    response = compute.subnetworks().aggregatedList(project=project).execute()
	
	#if source ip is part of the network, egress firewall rules need to be checked
	#if destination ip is part of the network, ingress firewall rules need to be checked
	#if source and destination are both part of the network, bot ingress and egress rules will be checked
    for region in response['items']: 
		for subnetwork in response['items'][region]['subnetworks']:
			if network == subnetwork['network'].rpartition('/')[2]: 
				if ipaddress.ip_address(src) in ipaddress.ip_network(subnetwork['ipCidrRange']):
					egress_check = True
					if str(verbose) <> "None" : print ('Source IP %s is part of subnet "%s", will evaluate egress firewall rules' % (src,subnetwork['name']))
				if ipaddress.ip_address(dst) in ipaddress.ip_network(subnetwork['ipCidrRange']):
					ingress_check = True
					if str(verbose) <> "None" : print ('Destination IP %s is part of subnet "%s", will evaluate ingress firewall rules' % (dst,subnetwork['name']))

    if (not egress_check) and (not ingress_check):
		print('Neither source or destination IP belongs to network "%s", firewall rules for this network are not applicable' % network) 	
		exit()
    if str(verbose) <> "None":
    	print(' ')
		
		
    #create list of ingress and egress firewall rules, sorted by ascending priority
    ingress_filter = '(network eq .*%s)(direction eq INGRESS)' % (network)
    egress_filter = '(network eq .*%s)(direction eq EGRESS)' % (network)
        
    ingress = compute.firewalls().list(project=project, filter=ingress_filter).execute()
    egress = compute.firewalls().list(project=project, filter=egress_filter).execute()

    if 'items' in ingress:
    	ingress= {'items': sorted(ingress['items'], key=lambda x: x['priority'], reverse=False)}
    else:
    	if ingress_check: 
    		print ('--->No ingress firewall rules specified. Traffic ingress to %s is implicitly blocked' % dst)	
    	ingress_check = False


    if 'items' in egress:   
		egress = {'items': sorted(egress['items'], key=lambda x: x['priority'], reverse=False)}
    else:
		if egress_check: 
			print ('--->No egress firewall rules specified. Traffic egress to %s is implicitly allowed' % dst)
		egress_check = False	

	

    #print json.dumps(egress, indent=4)	
    #check egress firewall rules
    if egress_check:
    
    	implicit_allow = True
    	for item in egress['items']:	
			if str(verbose) <> "None" : 
				print ('Evaluating egress firewall rule "%s" ' % (item['name']))

			if 'targetTags' in item:
				if (str(verbose) <> "None") and (src_tag in item['targetTags']) : 
					print ('  Egress firewall rule "%s" has target tags "%s" match the source tag of "%s"' % (item['name'], item['targetTags'],src_tag))
			if ('targetTags' in item ) and (src_tag not in item['targetTags']):
				if str(verbose) <> "None" : 
					print ('  Egress firewall rule "%s" with target tags "%s" does not matches the source tag of "%s". Skipping to next rule' % (item['name'], item['targetTags'],src_tag))
				continue



			#search through the list of destination ranges to see if there is a match
			#note that egress firewall rule destination filter of ranges an subnets are both stored as 'destinationRanges'
			matched_range = False
			for range in item['destinationRanges']:
				if ipaddress.ip_address(dst) not in ipaddress.ip_network(range):
					if str(verbose) <> "None" : 
						print ('  Egress firewall rule "%s" with destination range of %s does not match the destination IP %s' % (item['name'],range, dst))
				else:
					if str(verbose) <> "None" : 
						print ('  Egress firewall rule "%s" with destination range of %s matches the destination IP %s' % (item['name'],range, dst))
					matched_range = True
					break
			if not matched_range:
				if str(verbose) <> "None" : print ('  Egress firewall rule "%s" has no destination range that matches the destination IP %s. Skipping to next firewall rule' % (item['name'], dst))
				continue
				
			#check to see if protocol/port match allow list
			if 'allowed' in item:
				allow_matched = False

				for prot in item['allowed']:
					if prot['IPProtocol'] == "all":
						if str(verbose) <> "None" : print ('  Egress firewall rule "%s" allows all protocols and ports' % (item['name']))
						allow_matched  = True
						break
				
					matched_port = True
					if ((prot['IPProtocol'] == "tcp") or (prot['IPProtocol'] == "udp")) and (prot['IPProtocol']  == protocol):
						#checking to see if port matches any item is port list
						matched_port = False
						for p in prot['ports']:	
							if p == port: 
								matched_port = True
								break
							if '-' in p:				
								if (int(port) >= int(p.partition('-')[0])) and (int(port) <= int(p.partition('-')[2])):
									matched_port = True
									break							
														
					if (protocol == prot['IPProtocol']) and matched_port :
						if str(verbose) <> "None" : print ('  Egress firewall rule "%s" with allowed protocols %s matches the protocol %s:%s  ' % (item['name'], item['allowed'],protocol,port))
						allow_matched  = True
						break   

			
				if not allow_matched :
					if str(verbose) <> "None" : print ('  Egress firewall rule "%s" does not allow or deny traffic on protocol %s:%s. Skipping to next firewall rule' % (item['name'], protocol, port))
					continue
				else:
					print ('--->Egress firewall rule "%s" matched.  Traffic is allowed to egress to %s' % (item['name'],dst))
					implicit_allow = False
					break
		
			#check to see if protocol/port match denied list
			if 'denied' in item:
				denied_matched = False

				for prot in item['denied']:
					if prot['IPProtocol'] == "all":
						if str(verbose) <> "None" : print ('  Egress firewall rule "%s" allows all protocols and ports' % (item['name']))
						denied_matched  = True
						break

					matched_port = True
					if ((prot['IPProtocol'] == "tcp") or (prot['IPProtocol'] == "udp")) and (prot['IPProtocol']  == protocol):
						#checking to see if port matches any item is port list
						matched_port = False
						for p in prot['ports']:	
							if p == port: 
								matched_port = True
								break
							if '-' in p:				
								if (int(port) >= int(p.partition('-')[0])) and (int(port) <= int(p.partition('-')[2])):
									matched_port = True
									break							
														
					if (protocol == prot['IPProtocol']) and matched_port :
						if str(verbose) <> "None" : print ('  Egress firewall rule "%s" with allowed protocols %s matches the protocol %s:%s  ' % (item['name'], item['allowed'],protocol,port))
						denied_matched  = True
						break   

			
				if not denied_matched :
					if str(verbose) <> "None" : print ('  Egress firewall rule "%s" does not allow or deny traffic on protocol %s:%s. Skipping to next firewall rule' % (item['name'], protocol, port))
					continue
				else:
					print ('--->Egress firewall rule "%s" matched.  Traffic egress to %s is blocked' % (item['name'],dst))	
					implicit_allow = False	
					break
					
					
					
					
        if implicit_allow: print ('--->Reached end of egress firewall rules. Traffic egress to %s is implicitly allowed' % dst)
        							


    #check ingress firewall rules
    if ingress_check:
        print (' ')	
        implicit_deny = True
    	for item in ingress['items']:	
			if str(verbose) <> "None" : 
				print ('Evaluating ingress firewall rule "%s" ' % (item['name']))

			if 'targetTags' in item:
				if (str(verbose) <> "None") and (dst_tag in item['targetTags']) : 
					print ('  Ingress firewall rule "%s" has target tags "%s" match the destination tag of "%s"' % (item['name'], item['targetTags'],dst_tag))
			if ('targetTags' in item ) and (dst_tag not in item['targetTags']):
				if str(verbose) <> "None" : 
					print ('  Ingress firewall rule "%s" with target tags "%s" does not matches the destination tag of "%s". Skipping to next rule' % (item['name'], item['targetTags'],dst_tag))
				continue


			if 'sourceRanges' in item:
				#search through the list of source ranges to see if there is a match
				#note that ingress firewall rule destination filter of ranges an subnets are both stored as 'sourceRanges'
				matched_range = False
				for range in item['sourceRanges']:
					if ipaddress.ip_address(src) not in ipaddress.ip_network(range):
						if str(verbose) <> "None" : 
							print ('  Ingress firewall rule "%s" with source range of %s does not match the source IP %s' % (item['name'],range, src))
					else:
						if str(verbose) <> "None" : 
							print ('  Ingress firewall rule "%s" with source range of %s matches the source IP %s' % (item['name'],range, src))
						matched_range = True
						break
				if not matched_range:
					if str(verbose) <> "None" : print ('  Ingress firewall rule "%s" has no source range that matches the source IP %s. Skipping to next firewall rule' % (item['name'], src))
					continue
			
			if 'sourceTags' in item:
				#search through the list of source tags to see if there is a match
				if src_tag in item['sourceTags']:
					if str(verbose) <> "None" : 
						print ('  Ingress firewall rule "%s" with source tags "%s" match the source tag "%s"' % (item['name'],item['sourceTags'], src_tag))
				else:
					if str(verbose) <> "None" : print ('  Ingress firewall rule "%s" has no source tag "%s" that matches the source tag "%s". Skipping to next firewall rule' % (item['name'], item['sourceTags'], src_tag))
					continue			
			
			#check to see if protocol/port match allow list
			if 'allowed' in item:
				allow_matched = False

				for prot in item['allowed']:
					if prot['IPProtocol'] == "all":
						if str(verbose) <> "None" : print ('  Ingress firewall rule "%s" allows all protocols and ports' % (item['name']))
						allow_matched  = True
						break
				
					matched_port = True
					if ((prot['IPProtocol'] == "tcp") or (prot['IPProtocol'] == "udp")) and (prot['IPProtocol']  == protocol):
						#checking to see if port matches any item is port list
						matched_port = False
						for p in prot['ports']:	
							if p == port: 
								matched_port = True
								break
							if '-' in p:				
								if (int(port) >= int(p.partition('-')[0])) and (int(port) <= int(p.partition('-')[2])):
									matched_port = True
									break							
														
					if (protocol == prot['IPProtocol']) and matched_port :
						if str(verbose) <> "None" : print ('  Ingress firewall rule "%s" with allowed protocols %s matches the protocol %s:%s  ' % (item['name'], item['allowed'],protocol,port))
						allow_matched  = True
						break   

			
				if not allow_matched :
					if str(verbose) <> "None" : print ('  Ingress firewall rule "%s" does not allow or deny traffic on protocol %s:%s. Skipping to next firewall rule' % (item['name'], protocol, port))
					continue
				else:
					print ('--->Ingress firewall rule "%s" matched.  Traffic is allowed to ingress to %s' % (item['name'],dst))
					implicit_deny = False
					break
		
			#check to see if protocol/port match denied list
			if 'denied' in item:
				denied_matched = False

				for prot in item['denied']:
					if prot['IPProtocol'] == "all":
						if str(verbose) <> "None" : print ('  Ingress firewall rule "%s" allows all protocols and ports' % (item['name']))
						denied_matched  = True
						break
				
					matched_port = True
					if ((prot['IPProtocol'] == "tcp") or (prot['IPProtocol'] == "udp")) and (prot['IPProtocol']  == protocol):
						#checking to see if port matches any item is port list
						matched_port = False
						for p in prot['ports']:	
							if p == port: 
								matched_port = True
								break
							if '-' in p:				
								if (int(port) >= int(p.partition('-')[0])) and (int(port) <= int(p.partition('-')[2])):
									matched_port = True
									break							
														
					if (protocol == prot['IPProtocol']) and matched_port :
						if str(verbose) <> "None" : print ('  Ingress firewall rule "%s" with allowed protocols %s matches the protocol %s:%s  ' % (item['name'], item['allowed'],protocol,port))
						denied_matched  = True
						break   

			
				if not denied_matched :
					if str(verbose) <> "None" : print ('  Ingress firewall rule "%s" does not allow or deny traffic on protocol %s:%s. Skipping to next firewall rule' % (item['name'], protocol, port))
					continue
				else:
					print ('--->Ingress firewall rule "%s" matched.  Traffic ingress to %s is blocked' % (item['name'],dst))	
					implicit_deny = False	
					break
					
        if implicit_deny: print ('--->Reached end of ingress firewall rules. Traffic ingress to %s is implicitly blocked' % dst)	
        print (' ')	       
	

if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter)

    parser.add_argument('src', help='Source IP')
    parser.add_argument('dst', help='Destination IP')
    parser.add_argument('protocol', help='Protocol')
    parser.add_argument('port', help='Port')
    
    parser.add_argument(
        '--project',
        default='',
        help='Your Google Cloud project name')
        
    parser.add_argument(
        '--network',
        default='default',
        help='Your Google Cloud network name')

    parser.add_argument(
        '--src_tag',
        help='Your Google Cloud firewall tag for the source of the traffic within GCP')

    parser.add_argument(
        '--dst_tag',
        help='Your Google Cloud firewall tag for the destination of the traffic within GCP')
        
    parser.add_argument(
        '--verbose',
        help='Enable verbose evaluation of routes')

    args = parser.parse_args()

    main(args.src,args.dst,args.protocol,args.port,args.project,args.network,args.src_tag,args.dst_tag,args.verbose)
# [END run]
