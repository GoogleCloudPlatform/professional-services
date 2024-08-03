package policy

# deny VMs that are not in US
deny{
    data.resources[_].type = "compute.v1.instance"
    re_match("^us-", data.resources[_].properties.zone) == false
}
