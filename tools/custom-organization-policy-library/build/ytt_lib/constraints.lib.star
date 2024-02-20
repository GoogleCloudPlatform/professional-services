load("@ytt:data", "data")
load("@ytt:struct", "struct")
load("/config.lib.star", "include", "get_service")

def _constraint_name(self):
   return "organizations/" + data.values.organization + "/customConstraints/custom." + self.constraint
end


def _to_generate(self):
  return include(data.values[self.service][self.constraint], data.values.bundles)
end

def _params(self):
  return data.values[self.service][self.constraint].params
end


def build_constraint(constraint):
  service = get_service(constraint)
  constraint = struct.make(service=service, constraint=constraint)
  constraint = struct.make_and_bind(constraint, to_generate= _to_generate, constraint_name=_constraint_name, params=_params)
  return constraint
end


