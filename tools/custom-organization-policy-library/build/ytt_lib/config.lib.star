load("@ytt:data", "data")
load("@ytt:struct", "struct")

services = ["compute", "firewall", "gke", "network", "storage" , "dataproc"]

def get_service(constraint):
  for service in services:
      if constraint.startswith(service):
        return service
      end
  end
  return "not-found"
end

def generate_config():
  config = {}
  values = struct.decode(data.values)

  for service in services:
    if values.get(service) == None: 
      continue
    end

    service_config = {}
    for name in values[service]:
      constraint = values[service][name]
      
      if include(constraint, values["bundles"]):
        constraint.pop("generation")
        constraint.pop("bundles")
        service_config[name] = constraint  
      end
    end

    config[service] = service_config
  end
  return config
end


def has_bundle(bundles):
  for bundle in bundles:
    if bundles[bundle] == True:
       return True
     end
   end
end

def include(constraint, bundles):
  if has_bundle(bundles) == False:
    return constraint.generation == "" or constraint.generation == "include" 
  end

  if constraint.generation == "include":
    return True
  end
  if constraint.generation == "skip":
    return False
  end
  for bundle in bundles:
    if bundles[bundle] == False:
      continue
     end
     if constraint.bundles[bundle] == True:
       return True
     end
  end
  return False
end