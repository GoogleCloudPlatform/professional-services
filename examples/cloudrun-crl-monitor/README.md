# Cloud Run CRL Monitoring

This project deploys a serverless solution to monitor Certificate Revocation Lists (CRLs) using Google Cloud Run, Cloud Scheduler, and Cloud Monitoring.

It validates that CRLs are:
1.  **Accessible**: Can be downloaded via HTTP/HTTPS.
2.  **Valid**: Are in valid DER or PEM format.
3.  **Fresh**: Have not expired (based on `Next Update` field).

## Architecture

The solution consists of:
*   **Cloud Run Job**: Executes a script to download and validate the CRL.
*   **Cloud Scheduler**: Triggers the Cloud Run Job on a schedule (default: every minute).
*   **Uptime Check**: Monitors the CRL URL availability from the public internet.
*   **Cloud Monitoring**:
    *   **Custom Metric**: `custom.googleapis.com/crl_validation/success` (1 = Success, 0 = Failure).
    *   **Alert Policy**: Triggers if validation fails for a configurable duration.

## Usage

1.  **Configure Variables**: Update `terraform.tfvars` with your project details and CRL monitors.

    ```hcl
    project_id = "your-project-id"
    
    crl_monitors = [
      {
        name                     = "example-ca"
        region                   = "europe-west3"
        target_url               = "http://crl.example.com/ca.crl"
        schedule                 = "* * * * *"
        crl_expiration_buffer    = "3600s" # Alert 1 hour before actual expiration
      }
    ]
    
    alert_duration_threshold = "60s"
    ```

2.  **Deploy**:

    ```bash
    terraform init
    terraform apply
    ```

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| `project_id` | The Google Cloud project ID. | `string` | n/a | Yes |
| `crl_monitors` | List of CRL monitors to configure. | `list(object)` | n/a | Yes |
| `alert_duration_threshold` | Duration of failure before triggering an alert (e.g., "60s", "300s"). | `string` | n/a | Yes |
| `alert_autoclose` | Duration after which an open alert closes automatically. | `string` | `"1800s"` | No |

### `crl_monitors` Object

| Name | Description | Type | Default |
|------|-------------|------|---------|
| `name` | Unique name for the monitor resources. | `string` | n/a |
| `region` | Cloud Run region (e.g., "europe-west3"). | `string` | n/a |
| `target_url` | URL of the CRL to monitor. | `string` | n/a |
| `schedule` | Cron schedule for the job. | `string` | `"* * * * *"` |
| `crl_expiration_buffer` | Time buffer before expiration to consider as failure. | `string` | `"3600s"` |

## Requirements

*   Terraform >= 1.0
*   Google Cloud SDK (gcloud) installed and authenticated.
*   APIs enabled:
    *   `run.googleapis.com`
    *   `cloudscheduler.googleapis.com`
    *   `monitoring.googleapis.com`

## Files

*   `main.tf`: Root module configuration, iterates over `crl_monitors`.
*   `variables.tf`: Input variable definitions.
*   `alerts.tf`: Cloud Monitoring Alert Policy definition.
*   `crl-monitor/`: Reusable module for individual CRL monitors.
