access_policy_config = {
  access_policy_create = {
    parent = "organizations/863496320224"
    title  = "ShieldedFolder"
  }
}

enable_features = {
  encryption = true
}

folder_config = {
  folder_create = {
    display_name = "ShieldedFolder"
    parent       = "folders/443543909887" #Dev
  }
}


kms_keys = {
  compute = {
    locations = ["europe-west4"]
  },
  
}

organization = {
  domain = "pcorp.joonix.net"
  id     = "863496320224"
}
prefix = "pcorp"
project_config = {
  billing_account_id = "0189FA-E139FD-136A58"
}

vpc_sc_access_levels = {
  users = {
    conditions = [
      { members = ["user:jgpuga@google.com"] }
    ]
  }
}
