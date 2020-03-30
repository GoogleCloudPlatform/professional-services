import json


def format_ret(return_set, as_json=False):
    """ decouple, allow for modifications to return type
        returns a list of ip addresses in object or json form """
    ret_list = list()
    for item in return_set:
        d = {"ip": item}
        ret_list.append(d)

    if as_json:
        return json.dumps(ret_list)

    return ret_list


def unassigned(data, as_json=False):
    """ https://sendgrid.com/docs/API_Reference/api_v3.html#ip-addresses
        The /ips rest endpoint returns information about the IP addresses
        and the usernames assigned to an IP

        unassigned returns a listing of the IP addresses that are allocated
        but have 0 users assigned


        data (response.body from sg.client.ips.get())
        as_json False -> get list of dicts
                True  -> get json object

        example:
        sg = sendgrid.SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))

        params = {
            'subuser': 'test_string',
            'ip': 'test_string',
            'limit': 1,
            'exclude_whitelabels':
            'true', 'offset': 1
        }
        response = sg.client.ips.get(query_params=params)
        if response.status_code == 201:
           data = response.body
           unused = unassigned(data)
    """

    no_subusers = set()

    if not isinstance(data, list):
        return format_ret(no_subusers, as_json=as_json)

    for current in data:
        num_subusers = len(current["subusers"])
        if num_subusers == 0:
            current_ip = current["ip"]
            no_subusers.add(current_ip)

    ret_val = format_ret(no_subusers, as_json=as_json)
    return ret_val
