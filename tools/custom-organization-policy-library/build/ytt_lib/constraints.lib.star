load("@ytt:data", "data")
load("@ytt:struct", "struct")
load("/config.lib.star", "include")

def _constraint_name(self):
   return "organizations/" + data.values.organization + "/customConstraints/custom." + self.constraint
end


def _is_enabled(self):
  return include(data.values[self.service][self.constraint], data.values.bundles)
end

def _params(self):
  return data.values[self.service][self.constraint].params
end


def build_constraint(service, constraint):
  constraint = struct.make(service=service, constraint=constraint)
  constraint = struct.make_and_bind(constraint, is_enabled= _is_enabled, constraint_name=_constraint_name, params=_params)
  return constraint
end


