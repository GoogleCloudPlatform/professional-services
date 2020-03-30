from google.cloud import dns
import time
import re

PROJECT_ID='storied-glazing-255921'
ZONE='fooey'
DOMAIN='sub.tallgoots.net.'
TTL=3600

client = dns.Client(project=PROJECT_ID)
zone = client.zone(ZONE, DOMAIN)

def find_by_name(name):
    records = zone.list_resource_record_sets()
    for record in records:
        if name in record.name:
            rs = zone.resource_record_set(record.name, record.record_type, record.ttl, record.rrdatas)
            return(rs)
    return False

def vmToDNS(event, context):
    import base64, json
    changes=zone.changes()
    valid_statuses = ['STAGING','DELETED']

    if 'data' in event:
        data = base64.b64decode(event['data']).decode('utf-8')
        data = json.loads(data)
        print(data)
        if 'deleted' in data and data['deleted'] == True:
            status = 'DELETED'
            print(data['asset']['name'])
            match = re.search(r"/instances\/(.+)", data['asset']['name'])
            print(match[1])
            if match:
                name = match[1]
        else:
            status = data['asset']['resource']['data']['status']

    # set vars for valid statuses
    if 'STAGING' in status:
        print(f'Handling status', status)
        name = data['asset']['resource']['data']['name']
        ip = data['asset']['resource']['data']['networkInterfaces'][0]['networkIP']
    elif 'DELETED' in status:
        pass
    else:
        print(f'Status {status} not handled!')
        return(True)

    # check for existing and mark for deletion
    del_record_set = find_by_name(name)
    if del_record_set is not False:
        print('Deleting existing record for', name)
        changes.delete_record_set(del_record_set)

    # add records for new VMs
    if 'STAGING' in status and name != '' and ip != '':
        print(f'Creating creation record set for VM: {name} with IP {ip}')
        hostname = f'{name}.{DOMAIN}'
        add_record_set = zone.resource_record_set(hostname, 'A', TTL, ip)
        changes.add_record_set(add_record_set)

    # execute changes for valid statuses
    if any(x in status for x in valid_statuses):
        changes.create()
        #print(changes.status)
        while changes.status != 'done':
            time.sleep(.1)
            changes.reload()
        #print('Changes status:', changes.status)
