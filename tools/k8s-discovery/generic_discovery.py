import logging
import os
from kubernetes import client, config
from kubernetes.client.rest import ApiException
import k8s_resources


def get_k8s_details_generic(api_client):
    """
    Connects to the cluster using the provided api_client and fetches all resources.
    """
    logging.info("  - Fetching Kubernetes resource details...")
    try:
        v1 = client.CoreV1Api(api_client)
        apps_v1 = client.AppsV1Api(api_client)
        batch_v1 = client.BatchV1Api(api_client)
        net_v1 = client.NetworkingV1Api(api_client)
        autoscaling_v2 = client.AutoscalingV2Api(api_client)
        rbac_v1 = client.RbacAuthorizationV1Api(api_client)
        policy_v1 = client.PolicyV1Api(api_client)
        storage_v1 = client.StorageV1Api(api_client)
        apiextensions_v1 = client.ApiextensionsV1Api(api_client)
        custom_objects_api = client.CustomObjectsApi(api_client)

        return k8s_resources.get_kubernetes_resources(
            v1,
            apps_v1,
            batch_v1,
            net_v1,
            autoscaling_v2,
            rbac_v1,
            policy_v1,
            storage_v1,
            apiextensions_v1,
            custom_objects_api,
        )
    except Exception as e:
        logging.error("  - Could not connect to Kubernetes API: %s", e)
        return {"error": f"Could not connect to Kubernetes API: {e}"}


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

    if context_names:
        contexts = [c for c in contexts if c['name'] in context_names]

    all_cluster_data = []

    for ctx in contexts:
        context_name = ctx['name']
        cluster_name = ctx['context']['cluster']
        user_name = ctx['context']['user']

        logging.info(f"--- Discovering context: {context_name} (Cluster: {cluster_name}) ---")

        try:
            api_client = config.new_client_from_config(config_file=kubeconfig_path, context=context_name)

            kubernetes_details = get_k8s_details_generic(api_client)

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
