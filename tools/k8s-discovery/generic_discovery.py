import logging
import os
from kubernetes import client, config
from kubernetes.client.rest import ApiException
from common import save_to_json

# Map standard K8s objects to the simplified format expected by common.py
def _extract_metadata(obj):
    """Helper to extract basic metadata (name, namespace, creation_timestamp)."""
    # obj is a dict resulting from to_dict()
    metadata = obj.get("metadata", {})
    return {
        "name": metadata.get("name"),
        "namespace": metadata.get("namespace"),
        "creation_timestamp": metadata.get("creation_timestamp"),
        "labels": metadata.get("labels", {}),
        "annotations": metadata.get("annotations", {}),
    }

def _simplify_node(node_obj):
    """Simplifies node object for common.py consumption."""
    meta = _extract_metadata(node_obj)
    status = node_obj.get("status", {})
    
    # Extract addresses
    addresses = status.get("addresses", [])
    hostname = next((a["address"] for a in addresses if a["type"] == "Hostname"), meta["name"])
    
    # Check readiness
    conditions = status.get("conditions", [])
    is_ready = any(c["type"] == "Ready" and c["status"] == "True" for c in conditions)
    status_msg = next((c["message"] for c in conditions if c["type"] == "Ready"), "")

    return {
        "name": meta["name"],
        "instance_type": meta["labels"].get("node.kubernetes.io/instance-type", "unknown"),
        "zone": meta["labels"].get("topology.kubernetes.io/zone", "unknown"),
        "is_ready": is_ready,
        "status_message": status_msg,
        "cpu_capacity": status.get("capacity", {}).get("cpu"),
        "memory_capacity": status.get("capacity", {}).get("memory"),
        "os_image": status.get("node_info", {}).get("os_image"),
        "kernel_version": status.get("node_info", {}).get("kernel_version"),
        "kubelet_version": status.get("node_info", {}).get("kubelet_version"),
        "creation_timestamp": meta["creation_timestamp"]
    }

def _simplify_workload(obj, kind):
    """Simplifies workloads (Deployments, etc.) for common.py."""
    meta = _extract_metadata(obj)
    spec = obj.get("spec", {})
    status = obj.get("status", {})
    
    # Pod template containers
    containers = []
    template_spec = spec.get("template", {}).get("spec", {})
    for c in template_spec.get("containers", []):
        containers.append({
            "image": c.get("image"),
            "resources": c.get("resources", {})
        })

    return {
        "name": meta["name"],
        "namespace": meta["namespace"],
        "replicas": spec.get("replicas"),
        "creation_timestamp": meta["creation_timestamp"],
        "containers": containers
    }

def get_k8s_details_generic(api_client):
    """
    Connects to the cluster using the provided api_client and fetches all resources.
    Returns a dictionary structure compatible with common.py.
    """
    k8s_details = {}
    
    try:
        v1 = client.CoreV1Api(api_client)
        apps_v1 = client.AppsV1Api(api_client)
        batch_v1 = client.BatchV1Api(api_client)
        net_v1 = client.NetworkingV1Api(api_client)
        
        # --- Nodes ---
        logging.info("    Fetching Nodes...")
        nodes = v1.list_node().to_dict()["items"]
        k8s_details["nodes"] = [_simplify_node(n) for n in nodes]

        # --- Namespaces ---
        logging.info("    Fetching Namespaces...")
        ns_list = v1.list_namespace().to_dict()["items"]
        k8s_details["namespaces"] = [_extract_metadata(n) for n in ns_list]

        # --- Workloads ---
        logging.info("    Fetching Deployments...")
        deps = apps_v1.list_deployment_for_all_namespaces().to_dict()["items"]
        k8s_details["deployments"] = [_simplify_workload(d, "Deployment") for d in deps]

        logging.info("    Fetching StatefulSets...")
        sts = apps_v1.list_stateful_set_for_all_namespaces().to_dict()["items"]
        k8s_details["statefulsets"] = [_simplify_workload(s, "StatefulSet") for s in sts]

        logging.info("    Fetching DaemonSets...")
        ds = apps_v1.list_daemon_set_for_all_namespaces().to_dict()["items"]
        k8s_details["daemonsets"] = [_simplify_workload(d, "DaemonSet") for d in ds]
        
        # --- Other Resources (Generic Flattening) ---
        
        logging.info("    Fetching Pods...")
        k8s_details["pods"] = [_extract_metadata(p) for p in v1.list_pod_for_all_namespaces().to_dict()["items"]]
        
        logging.info("    Fetching Services...")
        k8s_details["services"] = [_extract_metadata(s) for s in v1.list_service_for_all_namespaces().to_dict()["items"]]
        
        logging.info("    Fetching Ingresses...")
        k8s_details["ingresses"] = [_extract_metadata(i) for i in net_v1.list_ingress_for_all_namespaces().to_dict()["items"]]

        logging.info("    Fetching PVCs and PVs...")
        k8s_details["persistent_volume_claims"] = [_extract_metadata(p) for p in v1.list_persistent_volume_claim_for_all_namespaces().to_dict()["items"]]
        k8s_details["persistent_volumes"] = [_extract_metadata(p) for p in v1.list_persistent_volume().to_dict()["items"]]

        logging.info("    Fetching ConfigMaps and Secrets...")
        k8s_details["configmaps"] = [_extract_metadata(c) for c in v1.list_config_map_for_all_namespaces().to_dict()["items"]]
        k8s_details["secrets"] = [_extract_metadata(s) for s in v1.list_secret_for_all_namespaces().to_dict()["items"]]
        
        logging.info("    Fetching Jobs and CronJobs...")
        k8s_details["jobs"] = [_extract_metadata(j) for j in batch_v1.list_job_for_all_namespaces().to_dict()["items"]]
        k8s_details["cronjobs"] = [_extract_metadata(c) for c in batch_v1.list_cron_job_for_all_namespaces().to_dict()["items"]]

    except ApiException as e:
        logging.error(f"    Error communicating with Kubernetes API: {e}")
        k8s_details["error"] = str(e)
    except Exception as e:
        logging.error(f"    Unexpected error during generic discovery: {e}")
        k8s_details["error"] = str(e)

    return k8s_details

def run_generic_discovery(kubeconfig_path=None, context_names=None):
    """
    Scans contexts in kubeconfig.
    If context_names is provided, only scans those. Otherwise scans all.
    """
    if not kubeconfig_path:
        kubeconfig_path = os.path.expanduser("~/.kube/config")
    
    logging.info(f"Loading kubeconfig from: {kubeconfig_path}")
    try:
        contexts, active_context = config.list_kube_config_contexts(config_file=kubeconfig_path)
    except Exception as e:
        logging.error(f"Failed to list contexts from kubeconfig: {e}")
        return []

    if not contexts:
        logging.warning("No contexts found in kubeconfig.")
        return []

    # Filter contexts if user specified specific ones
    if context_names:
        contexts = [c for c in contexts if c['name'] in context_names]

    all_cluster_data = []

    for ctx in contexts:
        context_name = ctx['name']
        cluster_name = ctx['context']['cluster']
        user_name = ctx['context']['user']
        
        logging.info(f"--- Discovering context: {context_name} (Cluster: {cluster_name}) ---")
        
        try:
            # Create a client for this specific context
            api_client = config.new_client_from_config(config_file=kubeconfig_path, context=context_name)
            
            # Fetch generic K8s details
            kubernetes_details = get_k8s_details_generic(api_client)
            
            # Structure the 'provider' details to mimic cloud providers
            hosting_provider_details = {
                "name": cluster_name,
                "region": "local", 
                "location": "local",
                "context": context_name,
                "user": user_name,
                "status": "ACTIVE" if "error" not in kubernetes_details else "ERROR"
            }

            all_cluster_data.append({
                "hosting_provider_details": hosting_provider_details,
                "kubernetes_details": kubernetes_details
            })
            
        except Exception as e:
            logging.error(f"Failed to connect to context {context_name}: {e}")

    return all_cluster_data
