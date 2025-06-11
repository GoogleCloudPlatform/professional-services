# Conversational Hotel Booking Agent

The Conversational Hotel Booking Agent is a custom Generative AI (GenAI) agent specialized in handling hotel bookings through a conversational user experience (UX). This repository contains the agent's source code and deployment instructions.

The integrated solution features:
*   **Anthropic's Claude LLM:** Serves as the agent's "brain" for understanding and processing requests.
*   **Google Cloud Platform (GCP) Data Services:** Hotel data is stored in BigQuery and accessed via a ready to deploy MCP server implemented by [MCP Toolbox for Databases](https://googleapis.github.io/genai-toolbox/getting-started/introduction/).
*   **Slack Application:** Provides the conversational UX. Slack also stores conversation history, acting as the agent's memory (based on threaded conversations).
*   **Java and Spring Boot AI Starters:** The agent's service application is built using these technologies.

**Important Note:** All code in this project is for demonstration purposes only and is not intended for production environments. The permissions granted to underlying resources are intentionally broad for ease of demonstration. Deploy with caution and avoid using production infrastructure or sensitive data.

## Example User Interaction

Once all the solution's components are deployed to GCP and Slack application settings are completed and installed on a Slack Workspace, we can start interacting with our Agent.

First, let's examine the BigQuery table containing the hotel data that our conversational Agent will access.

![BigQuery table with Hotel's data before interaction](/images/bq1.png)

The table includes hotel entries with details like internal identifier, name, city, location, price tier, available check-in/check-out dates, and booking status.

The agent's access patterns are defined using an MCP Toolbox configuration template (`/infra/mcptoolbox/tools.yaml.tpl`). This template contains SQL statements enabling the agent to:
* Search for hotels by name or location.
* Book a hotel by its ID.
* Update check-in and check-out dates by ID (using ISO datetime format).
* Cancel a booking by ID.

Once the agent configures the LLM with this toolbox, the LLM can trigger these predefined actions using the appropriate parameters (ID, names, location, ISO datetimes).
LLMs excel at interpreting natural language, recognizing patterns, and formulating execution plans. This allows us to extend these interactions, as the LLM can adapt user requests to fit the available tools.

For example, we can test the agent by requesting hotels in multiple locations at once (even if the direct tool interface expects a single location) and by performing multiple cancellations, bookings, and check-in/check-out updates within a single conversational turn.

![Chat interaction with the Hotel Booking Agent](/images/chat1.png)
*Caption: A user interacts with the Slackbot, requesting to find hotels in Basel and Barcelona, cancel a booking, book a new hotel, and update check-in/check-out dates for another booking, all in one message.*

In this scenario, the Agent correctly identifies the user's intent and triggers multiple calls to the configured tools. This results in finding three hotels in Basel and none in Barcelona, as requested. The Agent also successfully completes the cancellation, booking, and update requests.

We can then verify that the requested changes have been correctly persisted in the BigQuery table.

![BigQuery table with Hotel's data after interaction](/images/bq2.png)

This example demonstrates the power of a conversational UX implemented through a specialized Agent, MCP, and a well-defined toolset to accomplish complex tasks within a specific domain.

The example data and functionalities are inspired by the MCP Toolbox [page](https://googleapis.github.io/genai-toolbox/samples/bigquery/mcp_quickstart/).

## Components

This solution integrates the following components:

* **Slack**: Provides the conversational interface via a Slackbot implemented with Bolt's SDK for Java.
* **GCP CloudRun**: Serves as the serverless runtime for our services.
* **BigQuery**: Acts as the data repository for hotel information, exposed to the Agent.
* **Anthropic's Claude LLM**: Orchestrates tool usage (which datasources to use) and triggers necessary queries or updates.
* **MCP Toolbox for Databases**: A framework (deployed here as a CloudRun service) that exposes access to GCP databases (like BigQuery) to LLMs through a standardized Multi-Cloud Platform (MCP) interface. See the [official documentation](https://googleapis.github.io/genai-toolbox/getting-started/introduction/) for more details.
* **Spring Boot Service**: The core application exposing the Slackbot functionality, built with Spring Boot AI starters which simplify the integration of AI capabilities.

The code in the repository is arranged in 2 main folders.

- **`src/`**: Contains the Java Spring Boot application source code for the Slackbot service.
- **`infra/`**: Includes Terraform scripts for deploying the GCP infrastructure.

Other key files in the repository.

- **`Dockerfile`**: This file contains the instructions to build a Docker image for the application, enabling containerization and consistent deployment.
- **`cloudbuild.yaml`**: This file defines the CI/CD pipeline configurations for Google Cloud Build, automating the build, test, and deployment processes.
- **`deploy.sh`**: This script automates the deployment of both the application and the underlying GCP infrastructure.
- **`cleanup.sh`**: This script is used to remove all resources deployed by the `deploy.sh` script, ensuring a clean environment post-testing or decommissioning.

## Setup and Deployment

This section guides you through setting up your environment and deploying the Slackbot service on GCP resources.

### Prerequisites

Before you begin, ensure you have the following tools installed and configured:

- **Google Cloud SDK**: Used to interact with your GCP account, manage project configurations, and deploy resources.
  - Installation Guide: [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)
- **Terraform**: Used to define and provision the necessary GCP infrastructure components (like Cloud Run and BigQuery) as code.
  - Installation Guide: [https://learn.hashicorp.com/tutorials/terraform/install-cli](https://learn.hashicorp.com/tutorials/terraform/install-cli)

#### Slack Application Setup

To integrate the bot with your Slack workspace, you need to create and configure a Slack App on the [Slack API website](https://api.slack.com/apps). The following steps guide you through this process:

1.  **Create a Slack App**:
    *   On the Slack API website, click "Create New App".
    *   Choose "From scratch", provide a name for your app, and select your development workspace.
2.  **Obtain Bot Token and Signing Secret**: These are found in your Slack app's settings pages.
    *   **Bot User OAuth Token (`SLACK_BOT_TOKEN`)**:
        *   Navigate to "OAuth & Permissions".
        *   Locate the "Bot User OAuth Token" (usually starts with `xoxb-`). This token will be used as the value for the `SLACK_BOT_TOKEN` environment variable.
    *   **Signing Secret (`SLACK_SIGNING_SECRET`)**:
        *   Navigate to "Basic Information".
        *   Scroll to "App Credentials" and find the "Signing Secret". This secret will be used as the value for the `SLACK_SIGNING_SECRET` environment variable.
3.  **Enable Socket Mode**:
    *   In your Slack app settings, go to "Settings" > "Socket Mode".
    *   Enable Socket Mode. You may be prompted to generate an App-Level Token; this token is typically handled by the Spring Boot Slack SDK and doesn't usually require manual configuration in this project's default setup.
4.  **Configure Bot Token Scopes**:
    *   Return to "OAuth & Permissions".
    *   Scroll to "Scopes" and under "Bot Token Scopes", add the following:
        *   `app_mentions:read`: Allows the bot to read messages that directly mention it.
        *   `chat:write`: Allows the bot to send messages.
        *   `commands`: Allows the bot to receive and respond to slash commands.
5.  **Subscribe to Bot Events**:
    *   Go to "Event Subscriptions".
    *   Enable Events. **Note**: This step should be done after the GCP infrastructure is deployed, as you will need the Slackbot service URL from Cloud Run.
    *   Under "Subscribe to bot events", add:
        *   `app_mention`: To receive an event when your bot is mentioned.
        *   `message.channels`: (Optional) To allow the bot to read messages in public channels it's a member of. If your bot only responds to direct mentions and slash commands, `app_mention` is likely sufficient.
6.  **Environment Variable Configuration for Deployment**:
    *   The `SLACK_BOT_TOKEN` and `SLACK_SIGNING_SECRET` are essential for the Spring Boot application to communicate with Slack.
    *   These must be set as environment variables for the Cloud Run service where the bot will be deployed.
    *   If using the provided Terraform scripts (`infra/` directory), these variables are typically configured in your Terraform environment (e.g., as OS environment variables when running `terraform apply`, or within a `terraform.tfvars` file). The Terraform scripts (like `infra/slackapp_service.tf`) will pass these to the Cloud Run instance.
7.  **Prepare for Application Deployment**:
    *   Once you have created your Slack App and obtained the `SLACK_BOT_TOKEN` and `SLACK_SIGNING_SECRET`, ensure these values are accessible to your deployment process.
    *   If you've set them as Terraform variables, you are ready for the next deployment steps.

**Important Note on Usage**: All the code included in this project is intended for demonstration purposes only. It is not intended for use in a production environment. Permissions granted to the underlying resources are too broad, so it is important to deploy this demo with caution and not use production infrastructure, datasources, etc.

### Deployment Steps

1.  **GCP Project Setup**:
    Ensure you have a Google Cloud Project with billing enabled. You also need to enable the necessary APIs for the services used (e.g., Cloud Run, Artifact Registry, BigQuery).

2.  **Terraform Configuration**:
    The GCP infrastructure is managed by Terraform.
    -   Navigate to the `infra/` directory.
    -   Refer to the `infra/README.md` for detailed instructions on:
        -   Configuring necessary Terraform variables (e.g., `project_id`, `region`, Slackbot tokens and Claude's API key).
        -   Understanding the GCP resources that will be created by the Terraform scripts.

3.  **Deploy the Application and Infrastructure**:
    -   The `deploy.sh` script located at the root of the repository automates the entire deployment process.
    -   Execute the script from the root directory:
        ```bash
        sh deploy.sh
        ```
    -   This script performs the following actions:
        -   Initializes Terraform and applies the configuration to provision the required GCP infrastructure (defined in the `infra/` directory).
            - BigQuery dataset and table, with dummy data
            - Cloud Build artifact registry (for storing Docker images).
            - Builds the Docker image for the Spring Boot application (using the `Dockerfile`) and pushes it to Google Artifact Registry.
            - Deploys the MCP Toolbox service to Cloud Run.
            - Deploys the Slackbot service to Google Cloud Run, configuring it with the MCP Toolbox URL for tool discovery.

    After the script completes successfully, the Slackbot will be deployed and running on Cloud Run.

Once these steps are completed and the application is deployed with the correct Slack tokens and Claude API key, your bot should connect to your Slack workspace and respond to user mentions.

Please be aware that some responses may take longer than others. A single user request can involve multiple roundtrips: Slackbot service to LLM, LLM back to Slackbot service, Slackbot service to MCP, MCP interaction with BigQuery, potential new LLM interaction, and finally, the response back to Slack.

## Cleanup

This section describes how to remove all Google Cloud Platform (GCP) resources that were deployed by this solution.

To remove all the deployed services and infrastructure:

1.  Navigate to the root directory of the repository.
2.  Execute the `cleanup.sh` script:
    ```bash
    sh cleanup.sh
    ```

This script automates the process of tearing down the resources. It primarily uses the `terraform destroy` command within the `infra/` directory to remove all resources managed by Terraform.

**Warning**: Running the `cleanup.sh` script is a destructive action. It will permanently delete all the deployed GCP services and infrastructure associated with this application, including any data stored within them. Ensure you no longer need the deployed instance before running this script.