# ASOP Studio

**ASOP Studio** is a visual browser, interactive editor, and agent compiler for **Agentic Standard Operating Procedures (ASOPs)**.

---

## What is an ASOP?

When building enterprise customer support agents, business stakeholders think in **Standard Operating Procedures (SOPs)**—flowcharts, policies, and escalation paths—while engineers think in **prompts, tools, state machines, and evaluations**.

An **Agentic SOP (ASOP)** bridges both worlds: it is a declarative YAML specification of a support workflow that is **high-level enough to be understood and edited by business stakeholders**, yet **structured enough to compile programmatically into runnable agents** for **Google Cloud CX Agent Studio (CXAS)** and **Google Agent Development Kit (ADK)**.

```yaml
flow:
  id: pizza-order-main-flow
  version: 2
  name: Pizza Order Main Flow
  root_node_id: welcome-node
  global_instructions: |
    You are the virtual assistant for Luigi's Pizza. Be polite, concise, and helpful.
  nodes:
    - id: welcome-node
      agent_instructions: |
        Greet the customer and ask if they want to order a pizza or check an order status.
      actions:
        - tool: get_pizza_menu
          store_result_in: menu_data
      intent_routes:
        - intent: Customer wants to customize and order a pizza
          target_flow: customize-pizza-flow.yml
        - intent: Customer wants to check an existing order status
          target_node_id: check-order-status-node
```

With **ASOP Studio**, teams can visually inspect multi-flow SOPs, simulate end-to-end customer journeys, collaborate via inline review requests, and export production-ready agent packages or standalone single-file HTML visualizers.

---

## Quickstart: Try It Locally in 60 Seconds

### Prerequisites
- **Node.js** `v20+` and **npm**

### 1. Install and Start

```bash
npm install
npm run dev
```

Open **`http://localhost:5173`** in your browser.

> **Ready out of the box:** On first launch, ASOP Studio automatically loads the bundled **`pizza-order-flow`** example SOP (`example_sops/pizza-order-flow`). You can also reload it at any time via **Load SOP → Example: Pizza Order Flow** in the top bar.

### 2. What to Try (5-Minute Guided Tour)

1. **Explore the Multi-Flow Graph**
   - In the left **SOP Navigator**, switch between `main.yml`, `customize-pizza-flow.yml`, and `payment-delivery-flow.yml`.
   - Click any node (e.g., `welcome-node`) or route edge to inspect its **Agent Instructions**, **Tool Calls & Mock Responses**, **Input/Output Variables**, and **Routing Conditions** in the right **Inspector** panel.
2. **Play an Interactive Customer Journey**
   - In the left sidebar, expand **Example Journeys** and click **Full Order Customization and Delivery**.
   - Use the **Next / Previous** controls at the bottom of the canvas to step through the simulated customer-agent conversation and watch the active node highlight across sub-flows.
3. **Edit Instructions & Track History**
   - Select any node and click the pencil icon on **Agent Instructions** in the right Inspector (or expand **Global Instructions** / **Prompt Guard** in the left sidebar) to edit the YAML specification in place.
   - Use **Undo / Redo** (`Cmd/Ctrl+Z`) or open **History** in the top bar to compare snapshots and see visual diffs of modified nodes.
4. **Collaborate with Review Requests**
   - In the left sidebar, expand **Review Requests** to jump directly to nodes or routes flagged with `DESIGN` or `TECHNICAL` review items, or add a new review request from the Inspector.
5. **Export a Runnable Agent or Offline Visualizer**
   - Click **Export** in the top-right header:
     - **SOP → Visualizer**: Downloads a single, self-contained `.html` file that renders the interactive SOP viewer completely offline (ideal for sharing with stakeholders).
     - **Agent → ADK / CX Agent Studio**: Compiles the SOP into a runnable **Google ADK** or **CX Agent Studio** agent package using your choice of execution engine (**Fully Agentic**, **Graph-Guided**, or **Fully Deterministic**), complete with Python tool mocks and evaluation test cases generated from `example_journeys`.
     - **Reports → Tools Signatures**: Generates a PDF specification of all tools, parameters, and mocked responses across the SOP.

---

## Command-Line Interface (`asopcli`)

ASOP Studio includes a headless CLI (`asopcli`) for CI/CD pipelines and local agent development workflows.

Build the CLI and server bundle first:

```bash
npm run build
```

Then run `asopcli` against the bundled `example_sops/pizza-order-flow` project:

```bash
# Export a Google ADK agent package (Graph-Guided execution mode)
node dist-server/cli.js export agent \
  --source example_sops/pizza-order-flow \
  --format adk \
  --engine graph-guided \
  --output ./pizza-adk-agent.zip

# Export a CX Agent Studio (CXAS) package (Fully Agentic mode)
node dist-server/cli.js export agent \
  --source example_sops/pizza-order-flow \
  --format cxas \
  --engine fully-agentic \
  --output ./pizza-cxas-agent.zip

# Export a self-contained offline HTML Visualizer
node dist-server/cli.js export sop \
  --source example_sops/pizza-order-flow \
  --format visualizer \
  --output ./pizza-order-visualizer.html

# Export a Unified YAML specification
node dist-server/cli.js export sop \
  --source example_sops/pizza-order-flow \
  --format yaml \
  --output ./pizza-order-unified.yaml
```

You can also mount an SOP directly as a sub-agent inside an unpacked CX Agent Studio directory:

```bash
node dist-server/cli.js mount \
  --source example_sops/pizza-order-flow \
  --target ./path/to/unpacked-cxas-agent \
  --subagent-name pizza_order_subagent \
  --engine graph-guided \
  --prefix pizza_
```

---

## Deploy to Google Cloud (Cloud Run)

ASOP Studio includes a production `Dockerfile`, Terraform configuration (`terraform/`), and an automated deployment script (`deploy.sh`).

### Prerequisites
- [Google Cloud SDK (`gcloud`)](https://cloud.google.com/sdk/docs/install) authenticated (`gcloud auth login`)
- [Terraform](https://developer.hashicorp.com/terraform/downloads) `v1.5+`
- [Docker](https://docs.docker.com/get-docker/) running locally

### Option 1: Quick Cloud Run Deployment (1 Command)

By default, `./deploy.sh` deploys ASOP Studio directly to **Cloud Run** backed by **Artifact Registry** using your active `gcloud` project (or `PROJECT_ID` / `REGION` / `SERVICE_NAME` environment variables):

```bash
gcloud services enable run.googleapis.com artifactregistry.googleapis.com iam.googleapis.com

# Deploy using your active gcloud project (defaults to us-central1 and service name asop-studio)
./deploy.sh
```

You can also customize the target project, region, or service name via environment variables or `terraform/terraform.tfvars`:

```bash
PROJECT_ID="your-gcp-project-id" REGION="us-central1" SERVICE_NAME="asop-studio" ./deploy.sh
```

### Option 2: Enterprise Deployment with Identity-Aware Proxy (IAP)

To place an **External Application HTTPS Load Balancer** and **Identity-Aware Proxy (IAP)** in front of Cloud Run (restricting Cloud Run ingress to `INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER`):

1. Copy the example Terraform variables file:
   ```bash
   cp terraform/terraform.tfvars.example terraform/terraform.tfvars
   ```
2. Configure `enable_iap = true`, `iap_client_id`, `iap_client_secret`, and `allowed_identities` in `terraform/terraform.tfvars` (see [docs/06_gcp_deployment_and_iap.md](./docs/06_gcp_deployment_and_iap.md) for step-by-step OAuth setup).
3. Run `./deploy.sh`.

---

## Running Tests & Linting

```bash
# Run ESLint
npm run lint

# Run Vitest unit & integration test suite (SOP import/export, ADK/CXAS compilation, evaluations, mounting)
npm test

# Build production bundles and run Playwright E2E offline visualizer test
npm run build && npm run test:e2e
```

---

## Documentation

Detailed guides and specifications are available in the [`docs/`](./docs/) directory:

| Document | Description |
| :--- | :--- |
| [01. Overview & Architecture](./docs/01_overview_and_architecture.md) | System architecture, core concepts, and execution modes |
| [02. YAML Schema Specification](./docs/02_yaml_schema_specification.md) | Complete ASOP v2 YAML schema reference (flows, nodes, routes, tools, journeys) |
| [03. UI Feature Guide](./docs/03_ui_feature_guide.md) | Interactive canvas, SOP Navigator, Journey Player, inline editing, and Review Requests |
| [04. Development & Operations](./docs/04_development_and_operations.md) | Local development, production Express server, and Docker container usage |
| [05. Import & Export Capabilities](./docs/05_import_export_capabilities.md) | Formats (ZIP, Unified YAML, Offline Visualizer, ADK, CXAS, PDF Tool Reports) and REST API |
| [06. GCP Deployment & IAP Guide](./docs/06_gcp_deployment_and_iap.md) | Deploying to Cloud Run with Terraform and optional Identity-Aware Proxy (IAP) |
| [07. Agent Export Engine Modes](./docs/07_agent_export_engines.md) | Deep dive into Fully Agentic, Graph-Guided, and Fully Deterministic agent compilation |
| [08. CLI Reference (`asopcli`)](./docs/08_cli.md) | Full command-line reference for `export` and `mount` workflows |
| [09. Mounting SOPs into Existing Agents](./docs/09_mounting_sop_on_existing_agents.md) | How `asopcli mount` merges sub-agents, variables, tools, and evaluations |
| [10. Evaluations Export](./docs/10_evaluations_export.md) | How `example_journeys` compile into Golden and Scenario evaluation datasets |
| [AI Skill: Authoring ASOPs](./.gemini/skills/asop-studio-sop-authoring/SKILL.md) | Reusable AI coding agent skill for authoring and editing ASOP v2 YAML workflows |
