import typer
import eks_discovery
import aks_discovery
import gke_discovery
import common
import boto3
import logging
import os
import google.auth
from azure.identity import DefaultAzureCredential

app = typer.Typer(no_args_is_help=True)

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)


@app.command()
def aws(
    regions: list[str] = typer.Option(
        [],
        "--region",
        help="Specific AWS regions to scan. Can be used multiple times. If empty, all available EKS regions will be scanned.",
    ),
    output_dir: str = typer.Option(
        "./discovery_output", help="The directory to save the output CSV files."
    ),
):
    """
    Discover EKS clusters in specific or all AWS regions with detailed information.
    """
    session = boto3.Session()
    regions_to_scan = regions or eks_discovery.get_available_regions(session, "eks")
    logging.info("Starting EKS discovery for regions: %s", regions_to_scan)

    all_eks_data = eks_discovery.run_eks_discovery(session, regions_to_scan)

    if all_eks_data:
        logging.info(
            f"Found a total of {len(all_eks_data)} EKS clusters across all scanned regions."
        )
        if output_dir:
            json_filepath = os.path.join(output_dir, "eks_data.json")
            common.save_to_json(all_eks_data, json_filepath)
            common.save_to_csvs(all_eks_data, output_dir, "aws")
    else:
        logging.info("No EKS data found across scanned regions.")


@app.command()
def azure(
    subscription_ids: list[str] = typer.Option(
        [],
        "--subscription-id",
        help="Specific Azure subscription IDs to scan. Can be used multiple times. If empty, all accessible subscriptions will be scanned.",
    ),
    output_dir: str = typer.Option(
        "./discovery_output", help="The directory to save the output CSV files."
    ),
):
    """
    Discover AKS clusters in specific or all Azure subscriptions with detailed information.
    """
    try:
        credential = DefaultAzureCredential()
        # Test credential
        credential.get_token("https://management.azure.com/.default")
    except Exception as e:
        logging.error(
            "Failed to acquire a token. Please check your Azure authentication setup (e.g., 'az login'). Error: %s",
            e,
        )
        return

    subscriptions_to_scan = (
        subscription_ids or aks_discovery.get_available_subscriptions(credential)
    )
    if not subscriptions_to_scan:
        logging.warning("No subscriptions found or specified to scan.")
        return

    logging.info("Starting AKS discovery for subscriptions: %s", subscriptions_to_scan)

    all_aks_data = aks_discovery.run_aks_discovery(credential, subscriptions_to_scan)

    if all_aks_data:
        logging.info(
            f"Found a total of {len(all_aks_data)} AKS clusters across all scanned subscriptions."
        )
        if output_dir:
            json_filepath = os.path.join(output_dir, "aks_data.json")
            common.save_to_json(all_aks_data, json_filepath)
            common.save_to_csvs(all_aks_data, output_dir, "azure")
    else:
        logging.info("No AKS data found across scanned subscriptions.")


@app.command()
def gke(
    project_ids: list[str] = typer.Option(
        [],
        "--project-id",
        help="Specific GCP project IDs to scan. Can be used multiple times.",
    ),
    gcp_organization_id: str = typer.Option(
        None,
        "--gcp-organization-id",
        help="The ID of the GCP organization to scan for projects (e.g., '123456789012'). This is ignored if --project-id is used.",
    ),
    output_dir: str = typer.Option(
        "./discovery_output", help="The directory to save the output CSV files."
    ),
):
    """
    Discover GKE clusters in specific or all accessible GCP projects.
    You must specify either --project-id or --gcp-organization-id to scope the discovery.
    """
    if not project_ids and not gcp_organization_id:
        logging.error(
            "Error: You must specify either --project-id or --gcp-organization-id."
        )
        raise typer.Exit(code=1)

    try:
        credentials, _ = google.auth.default(
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )
    except google.auth.exceptions.DefaultCredentialsError as e:
        logging.error(
            "Failed to acquire Google Cloud credentials. Please run 'gcloud auth application-default login'. Error: %s",
            e,
        )
        return

    projects_to_scan = project_ids or gke_discovery.get_available_projects(
        credentials, organization_id=gcp_organization_id
    )
    if not projects_to_scan:
        logging.warning("No GCP projects found or specified to scan.")
        return

    logging.info("Starting GKE discovery for projects: %s", projects_to_scan)

    all_gke_data = gke_discovery.run_gke_discovery(credentials, projects_to_scan)

    if all_gke_data:
        logging.info(
            f"Found a total of {len(all_gke_data)} GKE clusters across all scanned projects."
        )
        if output_dir:
            json_filepath = os.path.join(output_dir, "gke_data.json")
            common.save_to_json(all_gke_data, json_filepath)
            common.save_to_csvs(all_gke_data, output_dir, "gke")
    else:
        logging.info("No GKE data found across scanned projects.")


if __name__ == "__main__":
    app()
