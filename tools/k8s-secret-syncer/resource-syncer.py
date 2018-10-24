import os
import sys
import json
import subprocess
import re
import time
import traceback

# configuration
RESOURCE_KIND = os.environ.get('RESOURCE_KIND', 'secret')  # cluster role must be granted accordingly
SYNC_INTERVAL_SECONDS = int(os.environ.get('SYNC_INTERVAL_SECONDS', 300))
SOURCE_NS = os.environ.get('SOURCE_NS', 'secrets')
SOURCE_ANNO = os.environ.get('SOURCE_ANNO', 'ns-propagate')
NS_BLACKLIST = os.environ.get('NS_BLACKLIST', 'kube-system,kube-public,default').split(',')
SKIP_DELETE = os.environ.get('SKIP_DELETE', 'no') == 'yes'
NS_BLACKLIST.append(SOURCE_NS)  # don't copy back to source

def kube_get(kind, namespace=None, name=None):
  cmd = 'kubectl get -o json ' + kind + (' -n ' + namespace if namespace else ' ') + (name if name else ' ')
  resp = subprocess.check_output(['/bin/sh', '-c', cmd])
  return json.loads(resp)['items']

def kube_apply(definition):
  return subprocess.call(["/bin/sh", "-c", "echo '" + json.dumps(definition) + "' | kubectl apply -f -"])

def kube_delete(kind, namespace, name):
  print 'deleting %s %s in namespace %s' % (kind, name, namespace)
  return subprocess.call(["/bin/sh", "-c", "kubectl delete %s %s -n %s" % (kind, name, namespace)])

# modify a resource to strip out unique fields and switch the namespace
def kube_switch_ns(definition, target_ns):
  definition['metadata']['namespace'] = target_ns
  for f in ('creationTimestamp', 'resourceVersion', 'uid'):
    if f in definition['metadata']:
      del definition['metadata'][f]

# get all namespaces
def kube_get_ns():
  return [ns for ns in kube_get('namespace') if ns['metadata']['name'] not in NS_BLACKLIST]

# get resources from source namespace
def get_resources(kind, ns):
  resources = kube_get(kind, ns)
  return [r for r in resources if SOURCE_ANNO in r['metadata'].get('annotations', {})]

# create resources in target namespaces
def sync_resources(source_resources):
  namespaces = kube_get_ns()
  # create/update
  for r in source_resources:
    target_ns_pattern = r['metadata']['annotations'][SOURCE_ANNO]
    target_ns_list = [ns for ns in namespaces if re.match('^' + target_ns_pattern + '$', ns['metadata']['name'])]
    for ns in target_ns_list:
      print 'copying %s %s to namespace %s' % (RESOURCE_KIND, r['metadata']['name'], ns['metadata']['name'])
      kube_switch_ns(r, ns['metadata']['name'])
      if kube_apply(r) != 0:
        raise ValueError('error in copying ' + RESOURCE_KIND)
  # delete
  if not SKIP_DELETE:
    source_resources_list = [r['metadata']['name'] for r in source_resources]
    for ns in namespaces:
      current_resources_list = [r['metadata']['name'] for r in get_resources(RESOURCE_KIND, ns['metadata']['name'])]
      [kube_delete(RESOURCE_KIND, ns['metadata']['name'], r_name) for r_name in current_resources_list if r_name not in source_resources_list]

# main
print '''
starting resource syncer with the following properties:
- syncing from source namespace "%s"
- syncing resources of kind "%s" that include the annotation "%s"
- omitting the following namespaces as sync destinations: "%s"
''' % (SOURCE_NS, RESOURCE_KIND, SOURCE_ANNO, NS_BLACKLIST)

while True:
  try:
    print '====== checking namespace %s for %ss to sync ======' % (SOURCE_NS, RESOURCE_KIND)
    resources = get_resources(RESOURCE_KIND, SOURCE_NS)
    sync_resources(resources)
  except Exception as e:
    traceback.print_exc()
  finally:
    time.sleep(SYNC_INTERVAL_SECONDS)
      
