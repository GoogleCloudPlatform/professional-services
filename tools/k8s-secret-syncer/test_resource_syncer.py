import atexit
import time
from resource_syncer import kube, kube_get, kube_delete, get_resources, sync_resources

def cleanup():
  assert 0 == kube('ns', 'foo', action='delete')
  assert 0 == kube('ns', 'foo2', action='delete')
  kube('', '', action='delete', options={'filename': 'test'})

atexit.register(cleanup)

def test_sync_resources():
  RESOURCE_KIND = 'secret'
  SOURCE_NS = 'secrets'
  kube('ns', SOURCE_NS)
  kube('ns', 'foo')
  kube('ns', 'foo2')

  source_secret_count = len(kube_get(RESOURCE_KIND, SOURCE_NS))
  foo_secret_count = len(kube_get(RESOURCE_KIND, 'foo'))
  foo2_secret_count = len(kube_get(RESOURCE_KIND, 'foo2'))

  # create 2 secrets in 'secrets' namespace
  assert 0 == kube('', '', options={'filename': 'test'})
  assert 2 == len(kube_get(RESOURCE_KIND, SOURCE_NS)) - source_secret_count
  
  # sync resources
  sync_resources(get_resources(RESOURCE_KIND, SOURCE_NS))
  time.sleep(3)  # wait for k8s API server to catch up

  # we should now have 1 secret synced to foo and foo2, and other to only foo
  assert 2 == len(kube_get(RESOURCE_KIND, 'foo')) - foo_secret_count
  assert 1 == len(kube_get(RESOURCE_KIND, 'foo2')) - foo2_secret_count

  # delete and re-sync
  assert 0 == kube('', '', action='delete', options={'filename': 'test'})
  sync_resources(get_resources(RESOURCE_KIND, SOURCE_NS))
  time.sleep(3)  # wait for k8s API server to catch up

  # make sure secret counts are back to original
  assert len(kube_get(RESOURCE_KIND, SOURCE_NS)) == source_secret_count
  assert len(kube_get(RESOURCE_KIND, 'foo')) == foo_secret_count
  assert len(kube_get(RESOURCE_KIND, 'foo2')) == foo2_secret_count

