import argparse
import logging
import boto3
from botocore.exceptions import ClientError
from concurrent.futures import ThreadPoolExecutor, as_completed
from k8s_resources import get_k8s_details_for_eks
from common import save_to_json

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)


def get_available_regions(session, service_name):
    return session.get_available_regions(service_name)


def _get_nodegroups(eks_client, cluster_name):
    """Get all nodegroups for a given cluster."""
    nodegroups = []
    try:
        paginator = eks_client.get_paginator("list_nodegroups")
        for page in paginator.paginate(clusterName=cluster_name):
            for nodegroup_name in page["nodegroups"]:
                logging.info(
                    "  - Found nodegroup '%s' in cluster '%s'. Getting details...",
                    nodegroup_name,
                    cluster_name,
                )
                details = eks_client.describe_nodegroup(
                    clusterName=cluster_name, nodegroupName=nodegroup_name
                )["nodegroup"]
                nodegroups.append(details)
    except ClientError as e:
        logging.error(
            "Could not describe nodegroups for %s: %s",
            cluster_name,
            e,
        )
    return nodegroups


def _get_fargate_profiles(eks_client, cluster_name):
    """Get all fargate profiles for a given cluster."""
    fargate_profiles = []
    try:
        paginator = eks_client.get_paginator("list_fargate_profiles")
        for page in paginator.paginate(clusterName=cluster_name):
            for profile_name in page.get("fargateProfileNames", []):
                logging.info(
                    "  - Found fargate profile '%s' in cluster '%s'. Getting details...",
                    profile_name,
                    cluster_name,
                )
                details = eks_client.describe_fargate_profile(
                    clusterName=cluster_name, fargateProfileName=profile_name
                )["fargateProfile"]
                fargate_profiles.append(details)
    except ClientError as e:
        logging.error(
            "Could not describe fargate profiles for %s: %s",
            cluster_name,
            e,
        )
    return fargate_profiles


def get_eks_data_for_region(session, region):
    logging.info("Scanning EKS clusters in region: %s", region)
    try:
        eks_client = session.client("eks", region_name=region)
        clusters_data = []

        # Paginate through all clusters in the region
        paginator = eks_client.get_paginator("list_clusters")
        for page in paginator.paginate():
            for cluster_name in page["clusters"]:
                logging.info(
                    "Found cluster '%s' in region %s. Getting details...",
                    cluster_name,
                    region,
                )
                cluster_details = eks_client.describe_cluster(name=cluster_name)[
                    "cluster"
                ]
                cluster_details["region"] = region

                nodegroups = _get_nodegroups(eks_client, cluster_name)
                fargate_profiles = _get_fargate_profiles(eks_client, cluster_name)

                launch_types = []
                if nodegroups:
                    launch_types.append("ec2")
                if fargate_profiles:
                    launch_types.append("fargate")
                cluster_details["cluster_launch_types"] = launch_types

                cluster_details["nodegroups"] = nodegroups
                cluster_details["fargate_profiles"] = fargate_profiles

                # Only attempt to get Kubernetes details if the cluster is in an ACTIVE state.
                if cluster_details.get("status") == "ACTIVE":
                    kubernetes_details = get_k8s_details_for_eks(cluster_details)
                else:
                    status = cluster_details.get("status", "UNKNOWN")
                    logging.warning(
                        "  - Skipping Kubernetes resource discovery for cluster '%s' because its status is '%s'.",
                        cluster_name,
                        status,
                    )
                    kubernetes_details = {
                        "error": f"Cluster is not in ACTIVE state (status: {status})."
                    }

                # Structure the final output
                final_cluster_data = {
                    "hosting_provider_details": cluster_details,
                    "kubernetes_details": kubernetes_details,
                }
                clusters_data.append(final_cluster_data)
        return clusters_data
    except ClientError as e:
        # Handles regions where EKS might not be enabled or accessible.
        logging.warning(
            "Could not access EKS in region %s. Skipping. Error: %s", region, e
        )
        return []


def run_eks_discovery(session, regions_to_scan):
    """Runs EKS discovery across multiple regions in parallel."""
    all_eks_data = []
    with ThreadPoolExecutor(max_workers=10) as executor:
        future_to_region = {
            executor.submit(get_eks_data_for_region, session, region): region
            for region in regions_to_scan
        }
        for future in as_completed(future_to_region):
            region = future_to_region[future]
            try:
                data = future.result()
                all_eks_data.extend(data)
            except Exception as exc:
                logging.error("Region %r generated an exception: %s", region, exc)
    return all_eks_data


def main():
    parser = argparse.ArgumentParser(description="Fetch EKS cluster data from AWS.")
    parser.add_argument(
        "--regions",
        nargs="*",
        help="Specific AWS regions to scan. If not provided, all available EKS regions will be scanned.",
    )
    parser.add_argument(
        "--output-file",
        default="eks_data.json",
        help="The file to write the JSON output to.",
    )
    args = parser.parse_args()

    session = boto3.Session()

    regions_to_scan = args.regions or get_available_regions(session, "eks")
    logging.info("Starting EKS discovery for regions: %s", regions_to_scan)

    all_eks_data = run_eks_discovery(session, regions_to_scan)
    save_to_json(all_eks_data, args.output_file)


if __name__ == "__main__":
    main()
