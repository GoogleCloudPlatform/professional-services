import json
import logging
import os
import pandas as pd


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
    """Helper to flatten workload data for CSV export."""
    workloads_list = []
    workload_types = ["deployments", "statefulsets", "daemonsets"]

    for workload_type in workload_types:
        if k8s_details and workload_type in k8s_details:
            for item in k8s_details[workload_type]:
                # Basic info
                workload_info = {
                    "cluster_id": cluster_id,
                    "namespace": item.get("namespace"),
                    "workload_name": item.get("name"),
                    "workload_type": workload_type.rstrip("s"),
                    "replicas": item.get("replicas"),
                    "creation_timestamp": item.get("creation_timestamp"),
                }

                # Extract container info (simplified for CSV)
                containers = item.get("containers", [])
                if containers:
                    workload_info["image"] = containers[0].get("image")
                    resources = containers[0].get("resources", {})
                    workload_info["cpu_request"] = resources.get("requests", {}).get(
                        "cpu"
                    )
                    workload_info["memory_request"] = resources.get("requests", {}).get(
                        "memory"
                    )
                    workload_info["cpu_limit"] = resources.get("limits", {}).get("cpu")
                    workload_info["memory_limit"] = resources.get("limits", {}).get(
                        "memory"
                    )

                workloads_list.append(workload_info)
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
    resource_quotas_list = []
    limit_ranges_list = []
    pdbs_list = []
    service_accounts_list = []

    for cluster_data in all_cluster_data:
        provider_details = cluster_data.get("hosting_provider_details", {})
        k8s_details = cluster_data.get("kubernetes_details", {})

        # --- Cluster Info ---
        cluster_name = provider_details.get("name")
        region = provider_details.get("region") or provider_details.get("location")
        cluster_id = f"{provider}-{region}-{cluster_name}"

        # Dump all provider details into a single record.
        # Complex types (dicts, lists) are converted to JSON strings.
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

        # --- Nodepool Info (Provider-specific) ---
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

        # --- Node Info ---
        if k8s_details and "nodes" in k8s_details:
            for node in k8s_details["nodes"]:
                nodes_list.append(
                    {
                        "cluster_id": cluster_id,
                        "node_name": node.get("name"),
                        "instance_type": node.get("instance_type"),
                        "zone": node.get("zone"),
                        "is_ready": node.get("is_ready"),
                        "status_message": node.get("status_message"),
                        "cpu_capacity": node.get("cpu_capacity"),
                        "memory_capacity": node.get("memory_capacity"),
                        "os_image": node.get("os_image"),
                        "kernel_version": node.get("kernel_version"),
                        "kubelet_version": node.get("kubelet_version"),
                        "creation_timestamp": node.get("creation_timestamp"),
                    }
                )

        # --- Workload Info ---
        workloads_list.extend(_flatten_workloads(cluster_id, k8s_details))

        # --- Other K8s Resources ---
        pods_list.extend(_flatten_and_add_cluster_id(cluster_id, k8s_details, "pods"))
        services_list.extend(
            _flatten_and_add_cluster_id(cluster_id, k8s_details, "services")
        )
        ingresses_list.extend(
            _flatten_and_add_cluster_id(cluster_id, k8s_details, "ingresses")
        )
        pvcs_list.extend(
            _flatten_and_add_cluster_id(
                cluster_id, k8s_details, "persistent_volume_claims"
            )
        )
        pvs_list.extend(
            _flatten_and_add_cluster_id(cluster_id, k8s_details, "persistent_volumes")
        )
        namespaces_list.extend(
            _flatten_and_add_cluster_id(cluster_id, k8s_details, "namespaces")
        )
        configmaps_list.extend(
            _flatten_and_add_cluster_id(cluster_id, k8s_details, "configmaps")
        )
        secrets_list.extend(
            _flatten_and_add_cluster_id(cluster_id, k8s_details, "secrets")
        )
        hpas_list.extend(_flatten_and_add_cluster_id(cluster_id, k8s_details, "hpas"))
        jobs_list.extend(_flatten_and_add_cluster_id(cluster_id, k8s_details, "jobs"))
        cronjobs_list.extend(
            _flatten_and_add_cluster_id(cluster_id, k8s_details, "cronjobs")
        )
        network_policies_list.extend(
            _flatten_and_add_cluster_id(cluster_id, k8s_details, "network_policies")
        )
        roles_list.extend(_flatten_and_add_cluster_id(cluster_id, k8s_details, "roles"))
        role_bindings_list.extend(
            _flatten_and_add_cluster_id(cluster_id, k8s_details, "role_bindings")
        )
        resource_quotas_list.extend(
            _flatten_and_add_cluster_id(cluster_id, k8s_details, "resource_quotas")
        )
        limit_ranges_list.extend(
            _flatten_and_add_cluster_id(cluster_id, k8s_details, "limit_ranges")
        )
        pdbs_list.extend(
            _flatten_and_add_cluster_id(
                cluster_id, k8s_details, "pod_disruption_budgets"
            )
        )
        service_accounts_list.extend(
            _flatten_and_add_cluster_id(cluster_id, k8s_details, "service_accounts")
        )

    # --- Save to CSV ---
    def to_csv(data, filename):
        if data:
            df = pd.DataFrame(data)
            filepath = os.path.join(output_dir, filename)
            df.to_csv(filepath, index=False)
            logging.info(f"Successfully saved data to {filepath}")

    provider_name_map = {"aws": "eks", "azure": "aks", "gke": "gke"}
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
    to_csv(resource_quotas_list, "resource_quotas.csv")
    to_csv(limit_ranges_list, "limit_ranges.csv")
    to_csv(pdbs_list, "pod_disruption_budgets.csv")
    to_csv(service_accounts_list, "service_accounts.csv")
