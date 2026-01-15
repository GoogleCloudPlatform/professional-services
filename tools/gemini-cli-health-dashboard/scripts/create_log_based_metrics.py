import json
import subprocess
import os
import sys

# Configuration
CONFIG_FILE = "metrics_config.json"


def get_project_id():
    """Fetches the current active Google Cloud Project ID."""
    try:
        result = subprocess.run(["gcloud", "config", "get-value", "project"],
                                capture_output=True,
                                text=True,
                                check=True)
        project_id = result.stdout.strip()
        if not project_id:
            raise ValueError(
                "No active project found. Run 'gcloud config set project <PROJECT_ID>' first."
            )
        return project_id
    except subprocess.CalledProcessError as e:
        print(f"❌ Error getting project ID: {e.stderr}")
        sys.exit(1)


def create_metric(metric_config, project_id):
    """Creates a single log-based metric using gcloud."""
    metric_name = metric_config.get("name")

    if not metric_name:
        print("⚠️  Skipping a metric entry missing a 'name' field.")
        return

    print(f"🔹 Processing metric: {metric_name}...")

    # Inject Project ID into the filter string
    if "filter" in metric_config:
        metric_config["filter"] = metric_config["filter"].replace(
            "PROJECT_ID_PLACEHOLDER", project_id)

    # Write this single metric config to a temporary file
    temp_filename = f"temp_{metric_name}.json"
    with open(temp_filename, "w") as f:
        json.dump(metric_config, f, indent=2)

    try:
        # Run gcloud logging metrics create
        cmd = [
            "gcloud", "logging", "metrics", "create", metric_name,
            f"--config-from-file={temp_filename}"
        ]

        # Capture output to check for "already exists" errors
        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode == 0:
            print(f"✅ Successfully created metric: {metric_name}")
        else:
            # If creation failed, check if it's because it already exists, then try update
            if "already exists" in result.stderr:
                print(
                    f"⚠️  Metric {metric_name} already exists. Attempting update..."
                )
                update_cmd = [
                    "gcloud", "logging", "metrics", "update", metric_name,
                    f"--config-from-file={temp_filename}"
                ]
                update_result = subprocess.run(update_cmd,
                                               capture_output=True,
                                               text=True)

                if update_result.returncode == 0:
                    print(f"✅ Successfully updated metric: {metric_name}")
                else:
                    print(f"❌ Failed to update metric: {metric_name}")
                    print(f"   Error: {update_result.stderr.strip()}")
            else:
                print(f"❌ Failed to create metric: {metric_name}")
                print(f"   Error: {result.stderr.strip()}")

    finally:
        # Cleanup temp file
        if os.path.exists(temp_filename):
            os.remove(temp_filename)


def main():
    if not os.path.exists(CONFIG_FILE):
        print(f"❌ Error: Configuration file '{CONFIG_FILE}' not found.")
        sys.exit(1)

    project_id = get_project_id()
    print(f"🚀 Starting metric creation for Project: {project_id}")

    try:
        with open(CONFIG_FILE, "r") as f:
            metrics_list = json.load(f)

        if not isinstance(metrics_list, list):
            print(
                f"❌ Error: '{CONFIG_FILE}' must contain a JSON array (list) of metrics."
            )
            sys.exit(1)

        for metric in metrics_list:
            create_metric(metric, project_id)

        print("🎉 All metrics processed.")

    except json.JSONDecodeError as e:
        print(f"❌ Error parsing JSON file: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
