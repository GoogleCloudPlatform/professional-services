import subprocess
import time
import os
import argparse


def deploy_vector_search_index(
    index_resource_address: str,
    tf_vars: dict,
):
    """
    Deploys a specific Vertex AI Vector Search index using Terraform and times the deployment.
    Assumes the script is run from within the Terraform directory.
    Does NOT destroy the index after deployment.

    Args:
        index_resource_address: The Terraform resource address of the index.
        tf_vars: A dictionary of Terraform variables.

    Returns:
        The deployment time in seconds, or None if an error occurred.
    """

    try:
        # 1. Terraform Init
        print(f"Initializing Terraform...")
        result = subprocess.run(
            ["terraform", "init"], capture_output=True, text=True, check=True
        )
        print(result.stdout)

        # 2. Terraform Apply (targeted)
        print(f"Deploying index...")

        tf_var_args = []
        for key, value in tf_vars.items():
            tf_var_args.append("-var")
            tf_var_args.append(f"{key}={value}")

        start_time = time.time()
        result = subprocess.run(
            [
                "terraform",
                "apply",
                "-auto-approve",
                "-target=" + index_resource_address,  # Correct resource address
            ]
            + tf_var_args,  # Correctly pass variables
            capture_output=True,
            text=True,
            check=True,
        )
        end_time = time.time()
        print(result.stdout)
        deployment_time = end_time - start_time
        print(f"Index deployment time: {deployment_time:.2f} seconds")

        return deployment_time

    except subprocess.CalledProcessError as e:
        print(f"Error during Terraform execution:\n{e.stderr}")
        print(f"Terraform command failed: {e.cmd}")  # Print the exact command
        return None


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Deploy a Vertex AI Vector Search index using Terraform."
    )
    parser.add_argument(
        "index_resource_address",
        type=str,
        help="The Terraform resource address of the index.",
    )

    parser.add_argument(
        "--var",
        action="append",
        help="Terraform variables (e.g., --var index_name=my-index-1 --var region=us-central1).",
    )

    args = parser.parse_args()

    # Parse the --var arguments into a dictionary
    tf_vars = {}
    if args.var:
        for var_str in args.var:
            key, value = var_str.split("=", 1)  # Split on the first '=' only
            tf_vars[key] = value

    deployment_duration = deploy_vector_search_index(
        args.index_resource_address, tf_vars
    )

    if deployment_duration is not None:
        print(f"Deployment time: {deployment_duration:.2f} seconds")