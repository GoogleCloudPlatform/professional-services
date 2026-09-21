import json
import logging
import os
import pandas as pd


DEFAULT_CSV_HEADERS = {
    "nodepools.csv": ["cluster_id", "nodegroup_name", "instance_types", "ami_type", "disk_size_gb", "desired_size", "min_size", "max_size", "status", "taints", "labels"],
    "nodes.csv": ["cluster_id", "node_name", "instance_type", "zone", "status", "os_image", "kernel_version", "kubelet_version", "allocatable_cpu", "allocatable_memory_gib", "creation_timestamp", "labels", "annotations"],
    "workloads.csv": ["cluster_id", "namespace", "workload_name", "workload_type", "replicas", "container_name", "image", "cpu_request", "memory_request", "cpu_limit", "memory_limit", "privileged", "service_account_name", "host_network", "creation_timestamp"],
    "pods.csv": ["cluster_id", "namespace", "name", "status", "node_name", "containers", "creation_timestamp", "service_account_name", "host_network", "owner_references", "labels", "annotations"],
    "services.csv": ["cluster_id", "namespace", "name", "type", "cluster_ip", "ports", "external_traffic_policy", "session_affinity", "load_balancer_class", "creation_timestamp", "annotations", "labels"],
    "ingresses.csv": ["cluster_id", "namespace", "name", "ingress_class_name", "rules", "creation_timestamp"],
    "persistent_volume_claims.csv": ["cluster_id", "namespace", "name", "status", "volume_name", "storage_class", "requested_storage", "creation_timestamp"],
    "persistent_volumes.csv": ["cluster_id", "name", "capacity", "access_modes", "reclaim_policy", "storage_class", "status", "volume_mode", "volume_handle", "ebs_volume_id", "csi_driver", "node_affinity", "creation_timestamp"],
    "namespaces.csv": ["cluster_id", "name", "status", "creation_timestamp", "labels", "annotations"],
    "configmaps.csv": ["cluster_id", "namespace", "name", "data_keys", "creation_timestamp"],
    "secrets.csv": ["cluster_id", "namespace", "name", "type", "data_keys", "creation_timestamp"],
    "hpas.csv": ["cluster_id", "namespace", "name", "scale_target_ref", "min_replicas", "max_replicas", "current_replicas", "desired_replicas", "creation_timestamp"],
    "jobs.csv": ["cluster_id", "namespace", "name", "completions", "parallelism", "succeeded", "failed", "creation_timestamp"],
    "cronjobs.csv": ["cluster_id", "namespace", "name", "schedule", "suspend", "active", "last_schedule_time", "creation_timestamp"],
    "network_policies.csv": ["cluster_id", "namespace", "name", "policy_types", "creation_timestamp"],
    "roles.csv": ["cluster_id", "namespace", "name", "rules", "creation_timestamp", "annotations"],
    "role_bindings.csv": ["cluster_id", "namespace", "name", "role_ref", "subjects", "creation_timestamp", "annotations"],
    "cluster_roles.csv": ["cluster_id", "name", "rules", "creation_timestamp", "annotations"],
    "cluster_role_bindings.csv": ["cluster_id", "name", "role_ref", "subjects", "creation_timestamp", "annotations"],
    "storage_classes.csv": ["cluster_id", "name", "provisioner", "reclaim_policy", "volume_binding_mode", "allow_volume_expansion", "parameters", "creation_timestamp", "annotations"],
    "crds.csv": ["cluster_id", "name", "group", "scope", "kind", "plural", "versions", "creation_timestamp"],
    "custom_resources.csv": ["cluster_id", "crd_name", "group", "version", "kind", "namespace", "name", "creation_timestamp", "labels", "annotations"],
    "resource_quotas.csv": ["cluster_id", "namespace", "name", "hard", "used", "creation_timestamp"],
    "limit_ranges.csv": ["cluster_id", "namespace", "name", "limits", "creation_timestamp"],
    "pod_disruption_budgets.csv": ["cluster_id", "namespace", "name", "min_available", "max_unavailable", "selector", "current_healthy", "desired_healthy"],
    "service_accounts.csv": ["cluster_id", "namespace", "name", "automount_token", "creation_timestamp", "annotations"],
    "addons.csv": ["cluster_id", "addonName", "addonVersion", "status", "serviceAccountRoleArn", "health"],
}


def save_to_json(data, filename):
    """Saves data to a JSON file."""
    output_dir = os.path.dirname(filename)
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)

    try:
        with open(filename, "w") as f:
            json.dump(data, f, indent=4, default=str)
        logging.info(f"Successfully saved data to {filename}")
    except IOError as e:
        logging.error(f"Failed to save data to {filename}: {e}")


def _flatten_workloads(cluster_id, k8s_details):
    """Helper to flatten workload data for CSV export across all containers."""
    workloads_list = []
    workload_types = ["deployments", "statefulsets", "daemonsets"]

    for workload_type in workload_types:
        if k8s_details and workload_type in k8s_details:
            for item in k8s_details[workload_type]:
                replicas = item.get("replicas")
                if replicas is None and workload_type == "daemonsets":
                    replicas = item.get("desired_scheduled") or item.get("current_scheduled")

                base_workload_info = {
                    "cluster_id": cluster_id,
                    "namespace": item.get("namespace"),
                    "workload_name": item.get("name"),
                    "workload_type": workload_type.rstrip("s"),
                    "replicas": replicas,
                    "service_account_name": item.get("service_account_name"),
                    "host_network": item.get("host_network", False),
                    "creation_timestamp": item.get("creation_timestamp"),
                }

                containers = item.get("containers", [])
                if containers:
                    for container in containers:
                        workload_info = base_workload_info.copy()
                        workload_info["container_name"] = container.get("name")
                        workload_info["image"] = container.get("image")
                        workload_info["privileged"] = container.get("privileged", False)

                        resources = container.get("resources") or {}
                        requests = resources.get("requests") or {}
                        limits = resources.get("limits") or {}

                        workload_info["cpu_request"] = requests.get("cpu")
                        workload_info["memory_request"] = requests.get("memory")
                        workload_info["cpu_limit"] = limits.get("cpu")
                        workload_info["memory_limit"] = limits.get("memory")

                        workloads_list.append(workload_info)
                else:
                    workloads_list.append(base_workload_info)

    return workloads_list


def _flatten_and_add_cluster_id(cluster_id, k8s_details, resource_key):
    """Helper to flatten a list of resources and add cluster_id."""
    resource_list = []
    if k8s_details and resource_key in k8s_details:
        for item in k8s_details[resource_key]:
            item_info = item.copy()
            item_info["cluster_id"] = cluster_id
            resource_list.append(item_info)
    return resource_list


def save_to_csvs(all_cluster_data, output_dir, provider):
    """
    Processes the collected cluster data and saves it into multiple relational CSV files.
    """
    if not all_cluster_data:
        logging.info("No data to save.")
        return

    os.makedirs(output_dir, exist_ok=True)

    provider_clusters_list = []
    nodepools_list = []
    nodes_list = []
    workloads_list = []
    pods_list = []
    services_list = []
    ingresses_list = []
    pvcs_list = []
    pvs_list = []
    namespaces_list = []
    configmaps_list = []
    secrets_list = []
    hpas_list = []
    jobs_list = []
    cronjobs_list = []
    network_policies_list = []
    roles_list = []
    role_bindings_list = []
    cluster_roles_list = []
    cluster_role_bindings_list = []
    storage_classes_list = []
    crds_list = []
    custom_resources_list = []
    resource_quotas_list = []
    limit_ranges_list = []
    pdbs_list = []
    service_accounts_list = []
    addons_list = []

    for cluster_data in all_cluster_data:
        provider_details = cluster_data.get("hosting_provider_details", {})
        k8s_details = cluster_data.get("kubernetes_details", {})

        cluster_name = provider_details.get("name")
        region = provider_details.get("region") or provider_details.get("location")
        cluster_id = f"{provider}-{region}-{cluster_name}"

        cluster_info = {
            "cluster_id": cluster_id,
            "provider": provider,
        }
        for key, value in provider_details.items():
            if isinstance(value, (dict, list)):
                cluster_info[key] = json.dumps(value, default=str)
            else:
                cluster_info[key] = value
        provider_clusters_list.append(cluster_info)

        # Add-ons
        for addon in provider_details.get("addons", []):
            addon_info = addon.copy()
            addon_info["cluster_id"] = cluster_id
            addons_list.append(addon_info)

        if provider == "aws":
            for np in provider_details.get("nodegroups", []):
                nodepools_list.append(
                    {
                        "cluster_id": cluster_id,
                        "nodegroup_name": np.get("nodegroupName"),
                        "instance_types": ", ".join(np.get("instanceTypes", [])),
                        "ami_type": np.get("amiType"),
                        "disk_size_gb": np.get("diskSize"),
                        "desired_size": np.get("scalingConfig", {}).get("desiredSize"),
                        "min_size": np.get("scalingConfig", {}).get("minSize"),
                        "max_size": np.get("scalingConfig", {}).get("maxSize"),
                        "status": np.get("status"),
                        "taints": json.dumps(np.get("taints", [])),
                        "labels": json.dumps(np.get("labels", {})),
                    }
                )
        elif provider == "azure":
            for ap in provider_details.get("agentPools", []):
                nodepools_list.append(
                    {
                        "cluster_id": cluster_id,
                        "agentpool_name": ap.get("name"),
                        "vm_size": ap.get("vmSize"),
                        "node_count": ap.get("count"),
                        "min_count": ap.get("minCount"),
                        "max_count": ap.get("maxCount"),
                        "os_type": ap.get("osType"),
                        "os_disk_size_gb": ap.get("osDiskSizeGB"),
                        "provisioning_state": ap.get("provisioningState"),
                        "mode": ap.get("mode"),
                        "taints": json.dumps(ap.get("nodeTaints", [])),
                        "labels": json.dumps(ap.get("nodeLabels", {})),
                    }
                )
        elif provider == "gke":
            for np in provider_details.get("nodePools", []):
                nodepools_list.append(
                    {
                        "cluster_id": cluster_id,
                        "nodepool_name": np.get("name"),
                        "machine_type": np.get("config", {}).get("machineType"),
                        "disk_size_gb": np.get("config", {}).get("diskSizeGb"),
                        "initial_node_count": np.get("initialNodeCount"),
                        "status": np.get("status"),
                        "version": np.get("version"),
                        "autoscaling_enabled": np.get("autoscaling", {}).get(
                            "enabled", False
                        ),
                        "min_node_count": np.get("autoscaling", {}).get("minNodeCount"),
                        "max_node_count": np.get("autoscaling", {}).get("maxNodeCount"),
                        "taints": json.dumps(np.get("config", {}).get("taints", [])),
                        "labels": json.dumps(np.get("config", {}).get("labels", {})),
                    }
                )

        if k8s_details and "nodes" in k8s_details:
            for node in k8s_details["nodes"]:
                nodes_list.append(
                    {
                        "cluster_id": cluster_id,
                        "node_name": node.get("name"),
                        "instance_type": node.get("instance_type"),
                        "zone": node.get("zone"),
                        "status": node.get("status"),
                        "os_image": node.get("os_image"),
                        "kernel_version": node.get("kernel_version"),
                        "kubelet_version": node.get("kubelet_version"),
                        "allocatable_cpu": node.get("allocatable_cpu"),
                        "allocatable_memory_gib": node.get("allocatable_memory_gib"),
                        "creation_timestamp": node.get("creation_timestamp"),
                        "labels": node.get("labels"),
                        "annotations": node.get("annotations"),
                    }
                )

        workloads_list.extend(_flatten_workloads(cluster_id, k8s_details))

        pods_list.extend(_flatten_and_add_cluster_id(cluster_id, k8s_details, "pods"))
        services_list.extend(_flatten_and_add_cluster_id(cluster_id, k8s_details, "services"))
        ingresses_list.extend(_flatten_and_add_cluster_id(cluster_id, k8s_details, "ingresses"))
        pvcs_list.extend(_flatten_and_add_cluster_id(cluster_id, k8s_details, "persistent_volume_claims"))
        pvs_list.extend(_flatten_and_add_cluster_id(cluster_id, k8s_details, "persistent_volumes"))
        namespaces_list.extend(_flatten_and_add_cluster_id(cluster_id, k8s_details, "namespaces"))
        configmaps_list.extend(_flatten_and_add_cluster_id(cluster_id, k8s_details, "configmaps"))
        secrets_list.extend(_flatten_and_add_cluster_id(cluster_id, k8s_details, "secrets"))
        hpas_list.extend(_flatten_and_add_cluster_id(cluster_id, k8s_details, "hpas"))
        jobs_list.extend(_flatten_and_add_cluster_id(cluster_id, k8s_details, "jobs"))
        cronjobs_list.extend(_flatten_and_add_cluster_id(cluster_id, k8s_details, "cronjobs"))
        network_policies_list.extend(_flatten_and_add_cluster_id(cluster_id, k8s_details, "network_policies"))
        roles_list.extend(_flatten_and_add_cluster_id(cluster_id, k8s_details, "roles"))
        role_bindings_list.extend(_flatten_and_add_cluster_id(cluster_id, k8s_details, "role_bindings"))
        cluster_roles_list.extend(_flatten_and_add_cluster_id(cluster_id, k8s_details, "cluster_roles"))
        cluster_role_bindings_list.extend(_flatten_and_add_cluster_id(cluster_id, k8s_details, "cluster_role_bindings"))
        storage_classes_list.extend(_flatten_and_add_cluster_id(cluster_id, k8s_details, "storage_classes"))
        crds_list.extend(_flatten_and_add_cluster_id(cluster_id, k8s_details, "crds"))
        custom_resources_list.extend(_flatten_and_add_cluster_id(cluster_id, k8s_details, "custom_resources"))
        resource_quotas_list.extend(_flatten_and_add_cluster_id(cluster_id, k8s_details, "resource_quotas"))
        limit_ranges_list.extend(_flatten_and_add_cluster_id(cluster_id, k8s_details, "limit_ranges"))
        pdbs_list.extend(_flatten_and_add_cluster_id(cluster_id, k8s_details, "pod_disruption_budgets"))
        service_accounts_list.extend(_flatten_and_add_cluster_id(cluster_id, k8s_details, "service_accounts"))

    def to_csv(data, filename):
        filepath = os.path.join(output_dir, filename)
        if data:
            df = pd.DataFrame(data)
        else:
            headers = DEFAULT_CSV_HEADERS.get(filename, [])
            df = pd.DataFrame(columns=headers)
        df.to_csv(filepath, index=False)
        logging.info(f"Successfully saved data to {filepath}")

    provider_name_map = {
        "aws": "eks",
        "azure": "aks",
        "gke": "gke",
        "generic": "generic",
    }
    cluster_csv_filename = f"{provider_name_map.get(provider, provider)}_clusters.csv"

    to_csv(provider_clusters_list, cluster_csv_filename)
    to_csv(nodepools_list, "nodepools.csv")
    to_csv(nodes_list, "nodes.csv")
    to_csv(workloads_list, "workloads.csv")
    to_csv(pods_list, "pods.csv")
    to_csv(services_list, "services.csv")
    to_csv(ingresses_list, "ingresses.csv")
    to_csv(pvcs_list, "persistent_volume_claims.csv")
    to_csv(pvs_list, "persistent_volumes.csv")
    to_csv(namespaces_list, "namespaces.csv")
    to_csv(configmaps_list, "configmaps.csv")
    to_csv(secrets_list, "secrets.csv")
    to_csv(hpas_list, "hpas.csv")
    to_csv(jobs_list, "jobs.csv")
    to_csv(cronjobs_list, "cronjobs.csv")
    to_csv(network_policies_list, "network_policies.csv")
    to_csv(roles_list, "roles.csv")
    to_csv(role_bindings_list, "role_bindings.csv")
    to_csv(cluster_roles_list, "cluster_roles.csv")
    to_csv(cluster_role_bindings_list, "cluster_role_bindings.csv")
    to_csv(storage_classes_list, "storage_classes.csv")
    to_csv(crds_list, "crds.csv")
    to_csv(custom_resources_list, "custom_resources.csv")
    to_csv(resource_quotas_list, "resource_quotas.csv")
    to_csv(limit_ranges_list, "limit_ranges.csv")
    to_csv(pdbs_list, "pod_disruption_budgets.csv")
    to_csv(service_accounts_list, "service_accounts.csv")
    to_csv(addons_list, "addons.csv")
