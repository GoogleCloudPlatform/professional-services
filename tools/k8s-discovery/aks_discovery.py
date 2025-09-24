import argparse
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from azure.core.exceptions import ClientAuthenticationError, HttpResponseError
from azure.identity import DefaultAzureCredential
from azure.mgmt.containerservice import ContainerServiceClient
from azure.mgmt.core.tools import parse_resource_id
from azure.mgmt.resource import SubscriptionClient
from k8s_resources import get_k8s_details_for_aks
from common import save_to_json

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)


def get_available_subscriptions(credential):
    """Lists all subscriptions the user has access to."""
    try:
        subscription_client = SubscriptionClient(credential)
        subscriptions = subscription_client.subscriptions.list()
        return [sub.subscription_id for sub in subscriptions]
    except (ClientAuthenticationError, HttpResponseError) as e:
        logging.error(
            "Azure authentication failed. Please run 'az login' or configure credentials. Error: %s",
            e,
        )
        return []


def get_aks_data_for_subscription(credential, subscription_id):
    """Fetches all AKS cluster data for a given subscription."""
    logging.info("Scanning AKS clusters in subscription: %s", subscription_id)
    try:
        aks_client = ContainerServiceClient(credential, subscription_id)
        clusters_data = []

        for cluster in aks_client.managed_clusters.list():
            logging.info(
                "Found cluster '%s' in subscription '%s'. Getting details...",
                cluster.name,
                subscription_id,
            )
            try:
                resource_group = parse_resource_id(cluster.id)["resource_group"]
            except KeyError:
                logging.error(
                    "Could not parse resource group from cluster ID: %s", cluster.id
                )
                continue

            cluster_details = cluster.as_dict()

            agent_pools = []
            try:
                pool_iterator = aks_client.agent_pools.list(
                    resource_group, cluster.name
                )
                for pool in pool_iterator:
                    logging.info("  - Found agent pool '%s'.", pool.name)
                    agent_pools.append(pool.as_dict())
            except HttpResponseError as e:
                logging.error(
                    "Could not describe agent pools for %s in %s: %s",
                    cluster.name,
                    resource_group,
                    e,
                )

            cluster_details["agentPools"] = agent_pools

            # Only attempt to get Kubernetes details if the cluster's provisioning state is 'Succeeded'.
            if cluster.provisioning_state == "Succeeded":
                kubernetes_details = get_k8s_details_for_aks(
                    aks_client, resource_group, cluster.name
                )
            else:
                logging.warning(
                    "  - Skipping Kubernetes resource discovery for cluster '%s' because its provisioning state is '%s'.",
                    cluster.name,
                    cluster.provisioning_state,
                )
                kubernetes_details = {
                    "error": f"Cluster provisioning state is not 'Succeeded' (state: {cluster.provisioning_state})."
                }

            final_cluster_data = {
                "hosting_provider_details": cluster_details,
                "kubernetes_details": kubernetes_details,
            }
            clusters_data.append(final_cluster_data)

        return clusters_data
    except HttpResponseError as e:
        logging.warning(
            "Could not access AKS in subscription %s. Skipping. Error: %s",
            subscription_id,
            e,
        )
        return []
    except Exception as e:
        logging.error(
            "An unexpected error occurred while scanning subscription %s: %s",
            subscription_id,
            e,
        )
        return []


def run_aks_discovery(credential, subscriptions_to_scan):
    """Runs AKS discovery across multiple subscriptions in parallel."""
    all_aks_data = []
    with ThreadPoolExecutor(max_workers=10) as executor:
        future_to_subscription = {
            executor.submit(get_aks_data_for_subscription, credential, sub_id): sub_id
            for sub_id in subscriptions_to_scan
        }
        for future in as_completed(future_to_subscription):
            sub_id = future_to_subscription[future]
            try:
                data = future.result()
                if data:
                    all_aks_data.extend(data)
            except Exception as exc:
                logging.error("Subscription %r generated an exception: %s", sub_id, exc)
    return all_aks_data


def main():
    parser = argparse.ArgumentParser(description="Fetch AKS cluster data from Azure.")
    parser.add_argument(
        "--subscription-ids",
        nargs="*",
        help="Specific Azure subscription IDs to scan. If not provided, all accessible subscriptions will be scanned.",
    )
    parser.add_argument(
        "--output-file",
        default="aks_data.json",
        help="The file to write the JSON output to.",
    )
    args = parser.parse_args()

    try:
        credential = DefaultAzureCredential()
        credential.get_token("https://management.azure.com/.default")
    except Exception as e:
        logging.error(
            "Failed to acquire a token. Please check your Azure authentication setup (e.g., 'az login'). Error: %s",
            e,
        )
        return

    subscriptions_to_scan = args.subscription_ids or get_available_subscriptions(
        credential
    )
    if not subscriptions_to_scan:
        logging.warning("No subscriptions found or specified to scan.")
        return

    logging.info("Starting AKS discovery for subscriptions: %s", subscriptions_to_scan)

    all_aks_data = run_aks_discovery(credential, subscriptions_to_scan)
    save_to_json(all_aks_data, args.output_file)


if __name__ == "__main__":
    main()
