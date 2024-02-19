load("@ytt:data", "data")
load("@ytt:struct", "struct")

def _name(self):
  return "organizations/" + data.values.organization + "/policies/custom." + self.name
end

def build_policy(name):
  policy = struct.make(name=name)
  policy = struct.make_and_bind(policy, name=_name)
  return policy
end


