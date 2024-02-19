load("@ytt:data", "data")
load("@ytt:struct", "struct")

def has_bundle(bundles):
  for bundle in bundles:
    if bundles[bundle] == True:
       return True
     end
   end
end

def include(constraint, bundles):
  if has_bundle(bundles) == False:
    return constraint.enabled == "" or constraint.enabled == "include" 
  end

  if constraint.enabled == "include":
    return True
  end
  if constraint.enabled == "skip":
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