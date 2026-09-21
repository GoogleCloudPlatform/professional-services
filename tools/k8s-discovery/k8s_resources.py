import base64
import logging
import os
import tempfile
import re
import json
from contextlib import contextmanager
from kubernetes import client, config
from kubernetes.client.rest import ApiException
import google.auth
import google.auth.transport.requests
from eks_token import get_token

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)


def parse_k8s_quantity(quantity_str):
    """
    Parses a Kubernetes quantity string (e.g., '100m', '512Mi', '1Gi') into a numeric value.
    Returns the value in base units (cores for CPU, bytes for memory).
    """
    if not isinstance(quantity_str, str):
        return 0

    quantity_str = quantity_str.strip()
    match = re.match(
        r"^(\d+(\.\d+)?) (E|P|T|G|M|k|Ei|Pi|Ti|Gi|Mi|Ki|m)?$", quantity_str
    )
    if not match:
        return 0  # Cannot parse

    value, _, suffix = match.groups()
    value = float(value)

    multipliers = {
        "E": 10**18,
        "P": 10**15,
        "T": 10**12,
        "G": 10**9,
        "M": 10**6,
        "k": 10**3,
        "Ei": 2**60,
        "Pi": 2**50,
        "Ti": 2**40,
        "Gi": 2**30,
        "Mi": 2**20,
        "Ki": 2**10,
        "m": 10**-3,
    }

    if suffix in multipliers:
        value *= multipliers[suffix]
    return value


@contextmanager
def _get_api_clients_from_kubeconfig_content(kubeconfig_content):
    """Creates Kubernetes API clients from kubeconfig content."""
    with tempfile.NamedTemporaryFile(mode="w", delete=False) as kubeconfig_file:
        kubeconfig_file.write(kubeconfig_content)
        kubeconfig_path = kubeconfig_file.name
    try:
        api_client = config.new_client_from_config(config_file=kubeconfig_path)
        yield (
            client.CoreV1Api(api_client),
            client.AppsV1Api(api_client),
            client.BatchV1Api(api_client),
            client.NetworkingV1Api(api_client),
            client.AutoscalingV2Api(api_client),
            client.RbacAuthorizationV1Api(api_client),
            client.PolicyV1Api(api_client),
            client.StorageV1Api(api_client),
            client.ApiextensionsV1Api(api_client),
            client.CustomObjectsApi(api_client),
        )
    finally:
        if os.path.exists(kubeconfig_path):
            os.remove(kubeconfig_path)


@contextmanager
def _get_api_clients_for_gke(cluster_details, credentials):
    """Creates Kubernetes API clients for a GKE cluster."""
    cluster_name = cluster_details.get("name")
    endpoint = cluster_details.get("endpoint")

    if not endpoint:
        raise ValueError(
            f"Cluster '{cluster_name}' is missing an endpoint. Cannot connect to Kubernetes API."
        )
    if (
        "master_auth" not in cluster_details
        or "cluster_ca_certificate" not in cluster_details["master_auth"]
    ):
        raise ValueError(
            f"Cluster '{cluster_name}' is missing 'masterAuth' details. This can happen if the cluster is still provisioning or in an error state."
        )

    ca_data = cluster_details["master_auth"]["cluster_ca_certificate"]

    logging.info("  - Generating GKE token for cluster '%s'", cluster_name)

    request = google.auth.transport.requests.Request()
    credentials.refresh(request)
    token = credentials.token

    configuration = client.Configuration()
    configuration.host = f"https://{endpoint}"
    configuration.api_key["authorization"] = token
    configuration.api_key_prefix["authorization"] = "Bearer"

    ca_cert_path = None
    try:
        with tempfile.NamedTemporaryFile(
            delete=False, mode="w", encoding="utf-8"
        ) as ca_cert:
            ca_cert.write(base64.b64decode(ca_data).decode("utf-8"))
            ca_cert_path = ca_cert.name
        configuration.ssl_ca_cert = ca_cert_path
        api_client = client.ApiClient(configuration)
        yield (
            client.CoreV1Api(api_client),
            client.AppsV1Api(api_client),
            client.BatchV1Api(api_client),
            client.NetworkingV1Api(api_client),
            client.AutoscalingV2Api(api_client),
            client.RbacAuthorizationV1Api(api_client),
            client.PolicyV1Api(api_client),
            client.StorageV1Api(api_client),
            client.ApiextensionsV1Api(api_client),
            client.CustomObjectsApi(api_client),
        )
    finally:
        if ca_cert_path and os.path.exists(ca_cert_path):
            os.remove(ca_cert_path)


@contextmanager
def _get_api_clients_for_eks(cluster_details):
    """Creates Kubernetes API clients for an EKS cluster."""
    cluster_name = cluster_details["name"]
    endpoint = cluster_details["endpoint"]
    ca_data = cluster_details["certificateAuthority"]["data"]

    logging.info("  - Generating EKS token for cluster '%s'", cluster_name)
    token = get_token(cluster_name=cluster_name)["status"]["token"]

    configuration = client.Configuration()
    configuration.host = endpoint
    configuration.api_key["authorization"] = token
    configuration.api_key_prefix["authorization"] = "Bearer"

    ca_cert_path = None
    try:
        with tempfile.NamedTemporaryFile(
            delete=False, mode="w", encoding="utf-8"
        ) as ca_cert:
            ca_cert.write(base64.b64decode(ca_data).decode("utf-8"))
            ca_cert_path = ca_cert.name
        configuration.ssl_ca_cert = ca_cert_path
        api_client = client.ApiClient(configuration)
        yield (
            client.CoreV1Api(api_client),
            client.AppsV1Api(api_client),
            client.BatchV1Api(api_client),
            client.NetworkingV1Api(api_client),
            client.AutoscalingV2Api(api_client),
            client.RbacAuthorizationV1Api(api_client),
            client.PolicyV1Api(api_client),
            client.StorageV1Api(api_client),
            client.ApiextensionsV1Api(api_client),
            client.CustomObjectsApi(api_client),
        )
    finally:
        if ca_cert_path and os.path.exists(ca_cert_path):
            os.remove(ca_cert_path)


def get_node_details(api_client):
    nodes = []
    try:
        response = api_client.list_node()
        for node in response.items:
            mem_bytes = parse_k8s_quantity(node.status.allocatable.get("memory", "0"))
            mem_gib = round(mem_bytes / (1024**3), 2) if mem_bytes > 0 else 0
            nodes.append(
                {
                    "name": node.metadata.name,
                    "status": (
                        node.status.conditions[-1].type
                        if node.status.conditions
                        else "Unknown"
                    ),
                    "instance_type": node.metadata.labels.get(
                        "beta.kubernetes.io/instance-type",
                        node.metadata.labels.get("node.kubernetes.io/instance-type", "N/A"),
                    ),
                    "zone": node.metadata.labels.get(
                        "topology.kubernetes.io/zone",
                        node.metadata.labels.get("failure-domain.beta.kubernetes.io/zone", "N/A"),
                    ),
                    "os_image": node.status.node_info.os_image,
                    "kernel_version": node.status.node_info.kernel_version,
                    "kubelet_version": node.status.node_info.kubelet_version,
                    "allocatable_cpu": node.status.allocatable.get("cpu", "0"),
                    "allocatable_memory_gib": f"{mem_gib} GiB",
                    "creation_timestamp": node.metadata.creation_timestamp,
                    "labels": json.dumps(node.metadata.labels or {}),
                    "annotations": json.dumps(node.metadata.annotations or {}),
                }
            )
    except ApiException as e:
        logging.error("Error fetching nodes: %s", e)
    return nodes


def get_pod_details(api_client):
    pods = []
    try:
        response = api_client.list_pod_for_all_namespaces()
        for pod in response.items:
            containers_info = []
            for container in pod.spec.containers:
                sec_context = container.security_context
                containers_info.append(
                    {
                        "name": container.name,
                        "image": container.image,
                        "resources": (
                            container.resources.to_dict()
                            if container.resources
                            else {}
                        ),
                        "privileged": sec_context.privileged if sec_context else False,
                    }
                )

            owner_refs = []
            if pod.metadata.owner_references:
                for ref in pod.metadata.owner_references:
                    owner_refs.append(f"{ref.kind}/{ref.name}")

            pods.append(
                {
                    "namespace": pod.metadata.namespace,
                    "name": pod.metadata.name,
                    "status": pod.status.phase,
                    "node_name": pod.spec.node_name,
                    "containers": containers_info,
                    "creation_timestamp": pod.metadata.creation_timestamp,
                    "service_account_name": pod.spec.service_account_name,
                    "host_network": pod.spec.host_network or False,
                    "owner_references": ", ".join(owner_refs),
                    "labels": json.dumps(pod.metadata.labels or {}),
                    "annotations": json.dumps(pod.metadata.annotations or {}),
                }
            )
    except ApiException as e:
        logging.error("Error fetching pods: %s", e)
    return pods


def get_deployment_details(api_client):
    deployments = []
    try:
        response = api_client.list_deployment_for_all_namespaces()
        for dep in response.items:
            containers = []
            for container in dep.spec.template.spec.containers:
                sec_context = container.security_context
                containers.append(
                    {
                        "name": container.name,
                        "image": container.image,
                        "resources": (
                            container.resources.to_dict()
                            if container.resources
                            else {}
                        ),
                        "privileged": sec_context.privileged if sec_context else False,
                    }
                )

            deployments.append(
                {
                    "namespace": dep.metadata.namespace,
                    "name": dep.metadata.name,
                    "replicas": dep.spec.replicas,
                    "containers": containers,
                    "creation_timestamp": dep.metadata.creation_timestamp,
                    "service_account_name": dep.spec.template.spec.service_account_name,
                    "host_network": dep.spec.template.spec.host_network or False,
                    "labels": json.dumps(dep.metadata.labels or {}),
                    "annotations": json.dumps(dep.metadata.annotations or {}),
                }
            )
    except ApiException as e:
        logging.error("Error fetching deployments: %s", e)
    return deployments


def get_service_details(api_client):
    services = []
    try:
        response = api_client.list_service_account_for_all_namespaces()
    except Exception:
        pass
    try:
        response = api_client.list_service_for_all_namespaces()
        for svc in response.items:
            ports = [
                f"{p.port}:{p.target_port}/{p.protocol}"
                for p in (svc.spec.ports or [])
            ]
            services.append(
                {
                    "namespace": svc.metadata.namespace,
                    "name": svc.metadata.name,
                    "type": svc.spec.type,
                    "cluster_ip": svc.spec.cluster_ip,
                    "ports": ", ".join(ports),
                    "external_traffic_policy": svc.spec.external_traffic_policy,
                    "session_affinity": svc.spec.session_affinity,
                    "load_balancer_class": svc.spec.load_balancer_class,
                    "creation_timestamp": svc.metadata.creation_timestamp,
                    "annotations": json.dumps(svc.metadata.annotations or {}),
                    "labels": json.dumps(svc.metadata.labels or {}),
                }
            )
    except ApiException as e:
        logging.error("Error fetching services: %s", e)
    return services


def get_statefulset_details(api_client):
    statefulsets = []
    try:
        response = api_client.list_stateful_set_for_all_namespaces()
        for ss in response.items:
            containers = []
            for container in ss.spec.template.spec.containers:
                sec_context = container.security_context
                containers.append(
                    {
                        "name": container.name,
                        "image": container.image,
                        "resources": (
                            container.resources.to_dict()
                            if container.resources
                            else {}
                        ),
                        "privileged": sec_context.privileged if sec_context else False,
                    }
                )
            statefulsets.append(
                {
                    "namespace": ss.metadata.namespace,
                    "name": ss.metadata.name,
                    "replicas": ss.spec.replicas,
                    "containers": containers,
                    "creation_timestamp": ss.metadata.creation_timestamp,
                    "service_account_name": ss.spec.template.spec.service_account_name,
                    "host_network": ss.spec.template.spec.host_network or False,
                    "labels": json.dumps(ss.metadata.labels or {}),
                    "annotations": json.dumps(ss.metadata.annotations or {}),
                }
            )
    except ApiException as e:
        logging.error("Error fetching statefulsets: %s", e)
    return statefulsets


def get_daemonset_details(api_client):
    daemonsets = []
    try:
        response = api_client.list_daemon_set_for_all_namespaces()
        for ds in response.items:
            containers = []
            for container in ds.spec.template.spec.containers:
                sec_context = container.security_context
                containers.append(
                    {
                        "name": container.name,
                        "image": container.image,
                        "resources": (
                            container.resources.to_dict()
                            if container.resources
                            else {}
                        ),
                        "privileged": sec_context.privileged if sec_context else False,
                    }
                )
            daemonsets.append(
                {
                    "namespace": ds.metadata.namespace,
                    "name": ds.metadata.name,
                    "desired_scheduled": ds.status.desired_number_scheduled,
                    "current_scheduled": ds.status.current_number_scheduled,
                    "containers": containers,
                    "creation_timestamp": ds.metadata.creation_timestamp,
                    "service_account_name": ds.spec.template.spec.service_account_name,
                    "host_network": ds.spec.template.spec.host_network or False,
                    "labels": json.dumps(ds.metadata.labels or {}),
                    "annotations": json.dumps(ds.metadata.annotations or {}),
                }
            )
    except ApiException as e:
        logging.error("Error fetching daemonsets: %s", e)
    return daemonsets


def get_job_details(api_client):
    jobs = []
    try:
        response = api_client.list_job_for_all_namespaces()
        for job in response.items:
            jobs.append(
                {
                    "namespace": job.metadata.namespace,
                    "name": job.metadata.name,
                    "completions": job.spec.completions,
                    "parallelism": job.spec.parallelism,
                    "succeeded": job.status.succeeded,
                    "failed": job.status.failed,
                    "creation_timestamp": job.metadata.creation_timestamp,
                }
            )
    except ApiException as e:
        logging.error("Error fetching jobs: %s", e)
    return jobs


def get_cronjob_details(api_client):
    cronjobs = []
    try:
        response = api_client.list_cron_job_for_all_namespaces()
        for cj in response.items:
            cronjobs.append(
                {
                    "namespace": cj.metadata.namespace,
                    "name": cj.metadata.name,
                    "schedule": cj.spec.schedule,
                    "suspend": cj.spec.suspend,
                    "active": len(cj.status.active) if cj.status.active else 0,
                    "last_schedule_time": cj.status.last_schedule_time,
                    "creation_timestamp": cj.metadata.creation_timestamp,
                }
            )
    except ApiException as e:
        logging.error("Error fetching cronjobs: %s", e)
    return cronjobs


def get_pv_details(api_client):
    pvs = []
    try:
        response = api_client.list_persistent_volume()
        for pv in response.items:
            csi_info = pv.spec.csi
            ebs_info = pv.spec.aws_elastic_block_store
            volume_handle = csi_info.volume_handle if csi_info else (ebs_info.volume_id if ebs_info else None)
            csi_driver = csi_info.driver if csi_info else ("kubernetes.io/aws-ebs" if ebs_info else None)

            pvs.append(
                {
                    "name": pv.metadata.name,
                    "capacity": (
                        pv.spec.capacity.get("storage")
                        if pv.spec.capacity
                        else None
                    ),
                    "access_modes": ", ".join(pv.spec.access_modes or []),
                    "reclaim_policy": pv.spec.persistent_volume_reclaim_policy,
                    "storage_class": pv.spec.storage_class_name,
                    "status": pv.status.phase,
                    "volume_mode": pv.spec.volume_mode,
                    "volume_handle": volume_handle,
                    "ebs_volume_id": ebs_info.volume_id if ebs_info else None,
                    "csi_driver": csi_driver,
                    "node_affinity": json.dumps(pv.spec.node_affinity.to_dict() if pv.spec.node_affinity else {}),
                    "creation_timestamp": pv.metadata.creation_timestamp,
                }
            )
    except ApiException as e:
        logging.error("Error fetching persistent volumes: %s", e)
    return pvs


def get_pvc_details(api_client):
    pvcs = []
    try:
        response = api_client.list_persistent_volume_claim_for_all_namespaces()
        for pvc in response.items:
            pvcs.append(
                {
                    "namespace": pvc.metadata.namespace,
                    "name": pvc.metadata.name,
                    "status": pvc.status.phase,
                    "volume_name": pvc.spec.volume_name,
                    "storage_class": pvc.spec.storage_class_name,
                    "requested_storage": (
                        pvc.spec.resources.requests.get("storage")
                        if pvc.spec.resources and pvc.spec.resources.requests
                        else None
                    ),
                    "creation_timestamp": pvc.metadata.creation_timestamp,
                }
            )
    except ApiException as e:
        logging.error("Error fetching PVCs: %s", e)
    return pvcs


def get_namespace_details(api_client):
    namespaces = []
    try:
        response = api_client.list_namespace()
        for ns in response.items:
            namespaces.append(
                {
                    "name": ns.metadata.name,
                    "status": ns.status.phase,
                    "creation_timestamp": ns.metadata.creation_timestamp,
                    "labels": json.dumps(ns.metadata.labels or {}),
                    "annotations": json.dumps(ns.metadata.annotations or {}),
                }
            )
    except ApiException as e:
        logging.error("Error fetching namespaces: %s", e)
    return namespaces


def get_secret_details(api_client):
    secrets = []
    try:
        response = api_client.list_secret_for_all_namespaces()
        for secret in response.items:
            secrets.append(
                {
                    "namespace": secret.metadata.namespace,
                    "name": secret.metadata.name,
                    "type": secret.type,
                    "data_keys": (
                        ", ".join(secret.data.keys()) if secret.data else ""
                    ),
                    "creation_timestamp": secret.metadata.creation_timestamp,
                }
            )
    except ApiException as e:
        logging.error("Error fetching secrets: %s", e)
    return secrets


def get_configmap_details(api_client):
    configmaps = []
    try:
        response = api_client.list_config_map_for_all_namespaces()
        for cm in response.items:
            configmaps.append(
                {
                    "namespace": cm.metadata.namespace,
                    "name": cm.metadata.name,
                    "data_keys": (
                        ", ".join(cm.data.keys()) if cm.data else ""
                    ),
                    "creation_timestamp": cm.metadata.creation_timestamp,
                }
            )
    except ApiException as e:
        logging.error("Error fetching configmaps: %s", e)
    return configmaps


def get_ingress_details(api_client):
    ingresses = []
    try:
        response = api_client.list_ingress_for_all_namespaces()
        for ing in response.items:
            rules_summary = []
            if ing.spec.rules:
                for rule in ing.spec.rules:
                    host = rule.host or "*"
                    paths = [
                        p.path or "/"
                        for p in (rule.http.paths if rule.http else [])
                    ]
                    rules_summary.append(f"{host}: [{', '.join(paths)}]")
            ingresses.append(
                {
                    "namespace": ing.metadata.namespace,
                    "name": ing.metadata.name,
                    "ingress_class_name": ing.spec.ingress_class_name,
                    "rules": "; ".join(rules_summary),
                    "creation_timestamp": ing.metadata.creation_timestamp,
                }
            )
    except ApiException as e:
        logging.error("Error fetching ingresses: %s", e)
    return ingresses


def get_networkpolicy_details(api_client):
    network_policies = []
    try:
        response = api_client.list_network_policy_for_all_namespaces()
        for np in response.items:
            network_policies.append(
                {
                    "namespace": np.metadata.namespace,
                    "name": np.metadata.name,
                    "policy_types": ", ".join(np.spec.policy_types or []),
                    "creation_timestamp": np.metadata.creation_timestamp,
                }
            )
    except ApiException as e:
        logging.error("Error fetching network policies: %s", e)
    return network_policies


def get_hpa_details(api_client):
    hpas = []
    try:
        response = api_client.list_horizontal_pod_autoscaler_for_all_namespaces()
        for hpa in response.items:
            hpas.append(
                {
                    "namespace": hpa.metadata.namespace,
                    "name": hpa.metadata.name,
                    "scale_target_ref": f"{hpa.spec.scale_target_ref.kind}/{hpa.spec.scale_target_ref.name}",
                    "min_replicas": hpa.spec.min_replicas,
                    "max_replicas": hpa.spec.max_replicas,
                    "current_replicas": hpa.status.current_replicas,
                    "desired_replicas": hpa.status.desired_replicas,
                    "creation_timestamp": hpa.metadata.creation_timestamp,
                }
            )
    except ApiException as e:
        logging.error("Error fetching HPAs: %s", e)
    return hpas


def get_role_details(api_client):
    roles = []
    try:
        response = api_client.list_role_for_all_namespaces()
        for role in response.items:
            rules_summary = [
                f"APIGroups:{r.api_groups}/Resources:{r.resources}/Verbs:{r.verbs}"
                for r in role.rules
            ]
            roles.append(
                {
                    "namespace": role.metadata.namespace,
                    "name": role.metadata.name,
                    "rules": json.dumps(rules_summary),
                    "creation_timestamp": role.metadata.creation_timestamp,
                    "annotations": json.dumps(role.metadata.annotations or {}),
                }
            )
    except ApiException as e:
        logging.error("Error fetching roles: %s", e)
    return roles


def get_rolebinding_details(api_client):
    role_bindings = []
    try:
        response = api_client.list_role_binding_for_all_namespaces()
        for rb in response.items:
            subjects = [
                f"{s.kind}:{s.name}" for s in (rb.subjects or [])
            ]
            role_bindings.append(
                {
                    "namespace": rb.metadata.namespace,
                    "name": rb.metadata.name,
                    "role_ref": f"{rb.role_ref.kind}/{rb.role_ref.name}",
                    "subjects": ", ".join(subjects),
                    "creation_timestamp": rb.metadata.creation_timestamp,
                    "annotations": json.dumps(rb.metadata.annotations or {}),
                }
            )
    except ApiException as e:
        logging.error("Error fetching role bindings: %s", e)
    return role_bindings


def get_cluster_role_details(api_client):
    cluster_roles = []
    try:
        response = api_client.list_cluster_role()
        for cr in response.items:
            rules_summary = [
                f"APIGroups:{r.api_groups}/Resources:{r.resources}/Verbs:{r.verbs}"
                for r in (cr.rules or [])
            ]
            cluster_roles.append(
                {
                    "name": cr.metadata.name,
                    "rules": json.dumps(rules_summary),
                    "creation_timestamp": cr.metadata.creation_timestamp,
                    "annotations": json.dumps(cr.metadata.annotations or {}),
                }
            )
    except ApiException as e:
        logging.error("Error fetching cluster roles: %s", e)
    return cluster_roles


def get_cluster_role_binding_details(api_client):
    cluster_role_bindings = []
    try:
        response = api_client.list_cluster_role_binding()
        for crb in response.items:
            subjects = [
                f"{s.kind}:{s.name}" for s in (crb.subjects or [])
            ]
            cluster_role_bindings.append(
                {
                    "name": crb.metadata.name,
                    "role_ref": f"{crb.role_ref.kind}/{crb.role_ref.name}",
                    "subjects": ", ".join(subjects),
                    "creation_timestamp": crb.metadata.creation_timestamp,
                    "annotations": json.dumps(crb.metadata.annotations or {}),
                }
            )
    except ApiException as e:
        logging.error("Error fetching cluster role bindings: %s", e)
    return cluster_role_bindings


def get_storageclass_details(api_client):
    storage_classes = []
    try:
        response = api_client.list_storage_class()
        for sc in response.items:
            storage_classes.append(
                {
                    "name": sc.metadata.name,
                    "provisioner": sc.provisioner,
                    "reclaim_policy": sc.reclaim_policy,
                    "volume_binding_mode": sc.volume_binding_mode,
                    "allow_volume_expansion": sc.allow_volume_expansion,
                    "parameters": json.dumps(sc.parameters or {}),
                    "creation_timestamp": sc.metadata.creation_timestamp,
                    "annotations": json.dumps(sc.metadata.annotations or {}),
                }
            )
    except ApiException as e:
        logging.error("Error fetching storage classes: %s", e)
    return storage_classes


def get_crd_details(api_client):
    crds = []
    try:
        response = api_client.list_custom_resource_definition()
        for crd in response.items:
            versions = [v.name for v in (crd.spec.versions or [])]
            crds.append(
                {
                    "name": crd.metadata.name,
                    "group": crd.spec.group,
                    "scope": crd.spec.scope,
                    "kind": crd.spec.names.kind,
                    "plural": crd.spec.names.plural,
                    "versions": ", ".join(versions),
                    "creation_timestamp": crd.metadata.creation_timestamp,
                }
            )
    except ApiException as e:
        logging.error("Error fetching CRDs: %s", e)
    return crds


def get_custom_resource_details(custom_objects_api, crds):
    custom_resources = []
    if not crds:
        return custom_resources
    for crd in crds:
        group = crd.get("group")
        plural = crd.get("plural")
        version = crd.get("versions", "").split(", ")[0] if crd.get("versions") else None
        scope = crd.get("scope")
        if not (group and plural and version):
            continue
        try:
            if scope == "Namespaced":
                res = custom_objects_api.list_custom_object_for_all_namespaces(group, version, plural)
            else:
                res = custom_objects_api.list_cluster_custom_object(group, version, plural)
            for item in res.get("items", []):
                metadata = item.get("metadata", {})
                custom_resources.append(
                    {
                        "crd_name": crd.get("name"),
                        "group": group,
                        "version": version,
                        "kind": item.get("kind", crd.get("kind")),
                        "namespace": metadata.get("namespace", "cluster-scoped"),
                        "name": metadata.get("name"),
                        "creation_timestamp": metadata.get("creationTimestamp"),
                        "labels": json.dumps(metadata.get("labels", {})),
                        "annotations": json.dumps(metadata.get("annotations", {})),
                    }
                )
        except ApiException as e:
            logging.debug("Could not fetch instances for CRD %s: %s", crd.get("name"), e)
        except Exception as e:
            logging.debug("Unexpected error fetching CRD %s instances: %s", crd.get("name"), e)
    return custom_resources


def get_resourcequota_details(api_client):
    resource_quotas = []
    try:
        response = api_client.list_resource_quota_for_all_namespaces()
        for rq in response.items:
            resource_quotas.append(
                {
                    "namespace": rq.metadata.namespace,
                    "name": rq.metadata.name,
                    "hard": json.dumps(rq.spec.hard or {}),
                    "used": json.dumps(rq.status.used if rq.status else {}),
                    "creation_timestamp": rq.metadata.creation_timestamp,
                }
            )
    except ApiException as e:
        logging.error("Error fetching resource quotas: %s", e)
    return resource_quotas


def get_limitrange_details(api_client):
    limit_ranges = []
    try:
        response = api_client.list_limit_range_for_all_namespaces()
        for lr in response.items:
            limits = []
            for limit in lr.spec.limits:
                limits.append(
                    {
                        "type": limit.type,
                        "max": limit.max,
                        "min": limit.min,
                        "default": limit.default,
                        "defaultRequest": limit.default_request,
                    }
                )
            limit_ranges.append(
                {
                    "namespace": lr.metadata.namespace,
                    "name": lr.metadata.name,
                    "limits": json.dumps(limits),
                    "creation_timestamp": lr.metadata.creation_timestamp,
                }
            )
    except ApiException as e:
        logging.error("Error fetching limit ranges: %s", e)
    return limit_ranges


def get_pdb_details(policy_v1_api, core_v1_api):
    pdbs = []
    items = []
    try:
        items = policy_v1_api.list_pod_disruption_budget_for_all_namespaces().items
    except ApiException as e:
        if e.status not in [401, 403]:
            logging.error("Error fetching PDBs: %s", e)
            return []

        logging.warning(
            "Could not list PDBs cluster-wide (reason: %s). Falling back to per-namespace requests.",
            e.reason,
        )
        try:
            namespaces = core_v1_api.list_namespace().items
        except ApiException as ns_list_e:
            logging.error(
                "Could not list namespaces to fall back for PDBs: %s", ns_list_e
            )
            return []

        for ns in namespaces:
            try:
                namespace_pdbs = policy_v1_api.list_namespaced_pod_disruption_budget(
                    ns.metadata.name
                )
                items.extend(namespace_pdbs.items)
            except ApiException as ns_e:
                if ns_e.status in [401, 403]:
                    logging.warning(
                        "Cannot list PDBs in namespace '%s': %s",
                        ns.metadata.name,
                        ns_e.reason,
                    )
                else:
                    logging.error(
                        "Error fetching PDBs in namespace '%s': %s",
                        ns.metadata.name,
                        ns_e,
                    )

    for pdb in items:
        pdbs.append(
            {
                "namespace": pdb.metadata.namespace,
                "name": pdb.metadata.name,
                "min_available": pdb.spec.min_available,
                "max_unavailable": pdb.spec.max_unavailable,
                "selector": (
                    str(pdb.spec.selector.match_labels) if pdb.spec.selector else "{}"
                ),
                "current_healthy": pdb.status.current_healthy,
                "desired_healthy": pdb.status.desired_healthy,
            }
        )
    return pdbs


def get_serviceaccount_details(api_client):
    service_accounts = []
    try:
        response = api_client.list_service_account_for_all_namespaces()
        for sa in response.items:
            annotations = (
                json.dumps(sa.metadata.annotations)
                if sa.metadata.annotations
                else "{}"
            )
            service_accounts.append(
                {
                    "namespace": sa.metadata.namespace,
                    "name": sa.metadata.name,
                    "automount_token": sa.automount_service_account_token,
                    "creation_timestamp": sa.metadata.creation_timestamp,
                    "annotations": annotations,
                }
            )
    except ApiException as e:
        logging.error("Error fetching service accounts: %s", e)
    return service_accounts


def get_kubernetes_resources(
    core_v1,
    apps_v1,
    batch_v1,
    networking_v1,
    autoscaling_v2,
    rbac_v1,
    policy_v1,
    storage_v1,
    apiextensions_v1,
    custom_objects_api,
):
    """Fetches various resources from a Kubernetes cluster."""
    logging.info("  - Fetching Kubernetes resource details...")
    crds = get_crd_details(apiextensions_v1)
    all_resources = {
        "nodes": get_node_details(core_v1),
        "pods": get_pod_details(core_v1),
        "deployments": get_deployment_details(apps_v1),
        "services": get_service_details(core_v1),
        "statefulsets": get_statefulset_details(apps_v1),
        "daemonsets": get_daemonset_details(apps_v1),
        "jobs": get_job_details(batch_v1),
        "cronjobs": get_cronjob_details(batch_v1),
        "persistent_volumes": get_pv_details(core_v1),
        "namespaces": get_namespace_details(core_v1),
        "secrets": get_secret_details(core_v1),
        "configmaps": get_configmap_details(core_v1),
        "persistent_volume_claims": get_pvc_details(core_v1),
        "ingresses": get_ingress_details(networking_v1),
        "network_policies": get_networkpolicy_details(networking_v1),
        "hpas": get_hpa_details(autoscaling_v2),
        "roles": get_role_details(rbac_v1),
        "role_bindings": get_rolebinding_details(rbac_v1),
        "cluster_roles": get_cluster_role_details(rbac_v1),
        "cluster_role_bindings": get_cluster_role_binding_details(rbac_v1),
        "storage_classes": get_storageclass_details(storage_v1),
        "crds": crds,
        "custom_resources": get_custom_resource_details(custom_objects_api, crds),
        "resource_quotas": get_resourcequota_details(core_v1),
        "limit_ranges": get_limitrange_details(core_v1),
        "pod_disruption_budgets": get_pdb_details(policy_v1, core_v1),
        "service_accounts": get_serviceaccount_details(core_v1),
    }
    return all_resources


def get_k8s_details_for_eks(cluster_details):
    """Get Kubernetes details for an EKS cluster."""
    logging.info(
        "  - Getting Kubernetes resource details for EKS cluster '%s'",
        cluster_details["name"],
    )
    try:
        with _get_api_clients_for_eks(cluster_details) as (
            core_v1,
            apps_v1,
            batch_v1,
            networking_v1,
            autoscaling_v2,
            rbac_v1,
            policy_v1,
            storage_v1,
            apiextensions_v1,
            custom_objects_api,
        ):
            return get_kubernetes_resources(
                core_v1,
                apps_v1,
                batch_v1,
                networking_v1,
                autoscaling_v2,
                rbac_v1,
                policy_v1,
                storage_v1,
                apiextensions_v1,
                custom_objects_api,
            )
    except Exception as e:
        logging.error(
            "  - Could not connect to EKS cluster '%s' Kubernetes API: %s",
            cluster_details["name"],
            e,
        )
        return {"error": f"Could not connect to Kubernetes API: {e}"}


def get_k8s_details_for_aks(aks_client, resource_group, cluster_name):
    """Get Kubernetes details for an AKS cluster."""
    logging.info(
        "  - Getting Kubernetes resource details for AKS cluster '%s'", cluster_name
    )
    try:
        logging.info(
            "  - Fetching admin credentials for AKS cluster '%s'", cluster_name
        )
        creds = aks_client.managed_clusters.list_cluster_admin_credentials(
            resource_group, cluster_name
        ).kubeconfigs[0]
        kubeconfig_content: str = creds.value.decode("utf-8")
        with _get_api_clients_from_kubeconfig_content(kubeconfig_content) as (
            core_v1,
            apps_v1,
            batch_v1,
            networking_v1,
            autoscaling_v2,
            rbac_v1,
            policy_v1,
            storage_v1,
            apiextensions_v1,
            custom_objects_api,
        ):
            return get_kubernetes_resources(
                core_v1,
                apps_v1,
                batch_v1,
                networking_v1,
                autoscaling_v2,
                rbac_v1,
                policy_v1,
                storage_v1,
                apiextensions_v1,
                custom_objects_api,
            )
    except Exception as e:
        logging.error(
            "  - Could not connect to AKS cluster '%s' Kubernetes API: %s",
            cluster_name,
            e,
        )
        return {"error": f"Could not connect to Kubernetes API: {e}"}


def get_k8s_details_for_gke_cluster(cluster_details, credentials):
    """Get Kubernetes details for a specific GKE cluster."""
    cluster_name = cluster_details["name"]
    logging.info(
        "  - Getting Kubernetes resource details for GKE cluster '%s'", cluster_name
    )
    try:
        with _get_api_clients_for_gke(cluster_details, credentials) as (
            core_v1,
            apps_v1,
            batch_v1,
            networking_v1,
            autoscaling_v2,
            rbac_v1,
            policy_v1,
            storage_v1,
            apiextensions_v1,
            custom_objects_api,
        ):
            return get_kubernetes_resources(
                core_v1,
                apps_v1,
                batch_v1,
                networking_v1,
                autoscaling_v2,
                rbac_v1,
                policy_v1,
                storage_v1,
                apiextensions_v1,
                custom_objects_api,
            )
    except Exception as e:
        logging.error(
            "  - Could not connect to GKE cluster '%s' Kubernetes API: %s",
            cluster_name,
            e,
        )
        return {"error": f"Could not connect to Kubernetes API: {e}"}
