load("@ytt:data", "data")
load("@ytt:struct", "struct")
load("/config.lib.star", "include", "get_service")

def _name(self):
  return "organizations/" + data.values.organization + "/policies/custom." + self.name
end

def _filename(self):
  return "custom." + self.name + ".yaml"
end

def _service(self):
  return get_service(self.name)
end

def build_policy(name):
  policy = struct.make(name=name)
  policy = struct.make_and_bind(policy, name=_name, filename=_filename, service=_service)
  return policy
end


