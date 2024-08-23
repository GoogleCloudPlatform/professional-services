# BigQuery + Claude Integration

This repository stores code samples for BigQuery and Claude integration, taking your data to the next level.

## Use Cases Examples

- Marketing departments can leverage user and product data to generate targeted social campaigns at scale.
- Security departments can decipher log data, convert it into a human-understandable format, and generate appropriate responses.
- Media companies can automate image captioning for vast libraries.
- International enterprises can translate text content seamlessly.

## Integration Methods

There are 3 methods you can use:

1. **SQL with BQML (Public Preview):** This method enables SQL developers to easily harness the power of Claude within BigQuery's familiar SQL environment. [Code example](/Python_Notebook_Sample/BQML+Claude.ipynb).

**Beyond SQL, you can also use the following methods to increase flexibility:**

2. **Python with BigQuery Studio (GA):** Python developers can use BQ notebook directly, connecting your BigQuery data with all Claude models. [Python in BQ Notebook Sample](/Python_Notebook_Sample/README.md)


3. **BQ Remote Functions (GA):** This method is ideal for development-heavy users, offering high flexibility and access to all Claude models, though it requires collaboration between app development and data science teams. Reference: * [BQ Remote Function with Claude](/BQ_RemoteFunction_Sample)
   - You can also use BigFrame to automatically create remote functions and batch inference directly using BigFrame to Claude model. [BigFrame+Remote Function with Claude](/Python_Notebook_Sample/BigFrames+Claude_Remote_Function.ipynb)

## Comparing the 3 Methods

| Feature | Native BQML Functions | Python with BQ Studio | BQ Remote Functions |
|---------|----------------------|----------------------|---------------------|
| Preferred by | SQL Developers | Python Developers | Development Power Houses |
| Ease of Use | Easy (SQL Skill Only) | Medium (Python) | Hard (App Development Skill + SQL Skill) |
| Flexibility | Low | High | High |
| Claude Model access | Limited (depends on releases) | All Models | All Models |
| Cost Model | [BQML Pricing](https://cloud.google.com/bigquery/pricing#bqml) | [External Services Pricing](https://cloud.google.com/bigquery/pricing#external_services) | [Cloud Function pricing](https://cloud.google.com/functions/pricing) + [BQ pricing](https://cloud.google.com/bigquery/pricing ) |
| Limitations | Subject to Preview Terms for BQML + Claude; Limited Model access; | Requires Python knowledge; | Learning curve is high; Separate services; |

## Comparing Claude on Vertex AI vs Direct API

For the last 2 methods, you can use a direct Claude API call or use Claude on Vertex AI. Here's a breakdown of the optimal use cases based on the pros and cons of each method:

### When to use Claude on Vertex AI

* **If you are already heavily invested in the Google Cloud ecosystem:** If you're already using other GCP services like BigQuery or Vertex AI, this option offers seamless integration and data co-location benefits.
* **If you need a managed solution with strong security and compliance:** Vertex AI handles security, privacy, and infrastructure management, freeing you to focus on application development.
* **If ease of setup is a priority:** It's easier to get started with Claude on Vertex AI if you're already familiar with GCP.

### When to use Direct Call Claude API

* **If you need flexibility in pricing and model access:** The direct API offers more granular control over costs and gives you early access to the newest Claude model releases.
* **If your infrastructure and data are not primarily on GCP:** This option might be better if you're using another cloud provider or have on-premises infrastructure.
* **If you have the resources to handle management overhead:** You'll need to manage security, privacy, and API keys yourself.
