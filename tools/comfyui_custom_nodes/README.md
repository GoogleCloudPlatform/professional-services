# Google Cloud Vertex AI Custom node for ComfyUI

This repo is for developing a cloud-based visual AI workflow on Google Cloud Platform (GCP) by leveraging ComfyUI and Google Cloud's powerful foundation models.

## ComfyUI Vertex AI Nodes

This custom node pack for ComfyUI provides seamless integration with Google Cloud's Vertex AI services, allowing you to leverage powerful AI models directly within your ComfyUI workflows. This enables you to build sophisticated generative AI applications with the scalability and performance of Google Cloud.

### Nodes Included

This pack currently includes the following nodes:

| Node Name | Description|
| :---------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Gemini** | Interacts with Google's Gemini Flash, Pro model for fast and efficient text generation, ideal for real-time chat, summarization, and rapid content creation. |
| **Veo Video Generation** | Generates video content using the Google Veo 2,3 model, an advanced text-to-video diffusion model capable of producing high-quality, diverse video clips from text and image prompts. |
| **VideoPreviewNode** | Used to preview video stored in Google Cloud Storage (GCS) directly within your ComfyUI workflow, providing immediate visual feedback for video generation processes. |
| **Image to B64 Node** | Converts an input image into a Base64 encoded string, useful for embedding image data in text-based formats (e.g., JSON, HTML) or for API transmissions. |
| **Image Generation 3** | The primary node for generating high-quality images from text prompts using Google's Imagen 3 model, designed for diverse visual content creation. |
| **Inpaint Insert w Mask** | Inserts new content into a specified masked area of an image based on a text prompt, requiring an explicit mask to define the insertion region. |
| **Inpaint Insert w AutoMask** | Similar to "Inpaint Insert w Mask," but automatically generates the mask based on the prompt, streamlining the inpainting process. |
| **Inpaint Insert w SemanticMask** | Uses semantic understanding to intelligently generate a mask around specified objects (e.g., "the car") for precise content insertion based on a text prompt. |
| **Inpaint Remove w Mask** | Removes content from a specified masked area of an image and intelligently fills in the gap, requiring an explicit mask for removal. |
| **Inpaint Remove w AutoMask** | Similar to "Inpaint Remove w Mask," but automatically generates the mask for content removal based on the prompt. |
| **Inpaint Remove w SemanticMask** | Removes content based on semantic understanding, where the model automatically generates the mask around the specified object for removal (e.g., "remove the person"). |
| **Imagen Product Background Swap w Mask** | Replaces the background of a product image, requiring an explicit mask for the product to ensure clean separation from the original background. |
| **Imagen Product Background Swap w AutoMask** | Automatically detects the product and generates a mask for it, significantly speeding up the background swapping process for product images. |
| **Imagen Mask-Free Editing** | Enables image editing without the need for explicit masks. Users provide an image and a text prompt describing the desired change (e.g., "change the color"), and Imagen 3 intelligently applies the edits. |
| **Imagen Outpainting** | Extends the boundaries of an image beyond its original canvas, generating new content that seamlessly blends with the existing image based on a text prompt. |

# Pre-Requisite

---
### Step 1: Create a Google Cloud Project

Every Google Cloud resource belongs to a project. If you don't have one, create a new project:

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  In the top navigation bar, click the **project dropdown** (usually displaying "My First Project" or your current project name).
3.  Click **"New Project"**.
4.  Enter a **Project name** (e.g., `my-api-access-project`).
5.  (Optional) Choose an **Organization** and **Location** if applicable.
6.  Click **"Create"**.
7.  Once the project is created, ensure it is selected in the project dropdown in the Cloud Console. Note down your **Project ID** (e.g., `my-api-access-project-123456`) as you'll need it later.

---
### Step 2: Enable Required Google Cloud APIs

For your application to use a specific Google Cloud service (e.g., Cloud Storage, Vertex AI, Gemini for Google Cloud API), you must enable its corresponding API in your project.

1.  In the Google Cloud Console, navigate to the **Navigation menu (☰)** on the top left.
2.  Go to **APIs & Services > Dashboard**.
3.  Click **"+ ENABLE APIS AND SERVICES"** at the top.
4.  In the API Library, search for the API you need (e.g., "Vertex AI API", "Gemini for Google Cloud API", "Cloud Storage API").
5.  Click on the API you want to enable.
6.  Click the **"Enable"** button.

---
### Step 3: Authenticate Your Local Environment

Google Cloud APIs require authentication to verify your application's identity and permissions. There are two primary methods for local development:

#### Method 1: Google Cloud CLI (Recommended for Development)

This method uses your personal Google account credentials to authenticate your `gcloud` CLI, which then automatically provides **Application Default Credentials (ADC)** to your local applications. This is the simplest and most secure method for individual development.

1.  **Ensure `gcloud` CLI is installed:** If not, follow the [installation guide](https://cloud.google.com/sdk/docs/install).
2.  **Log in to your Google Account via `gcloud`:** Open your terminal or command prompt and run:

    ```bash
    gcloud auth login
    ```

    This command will open a browser window, prompting you to log in with your Google account. After successful login, you can close the browser.

3.  **Set your Google Cloud Project:** Tell `gcloud` which project to use for subsequent commands and for ADC:

    ```bash
    gcloud config set project YOUR_PROJECT_ID
    ```

    Replace `YOUR_PROJECT_ID` with the actual ID of the project you created (e.g., `my-api-access-project-123456`).

4.  **Verify Authentication:** You can verify your active account and project:

    ```bash
    gcloud auth list
    gcloud config list project
    ```

Now, any Google Cloud client library or application running in your local environment that uses Application Default Credentials will automatically use the authenticated `gcloud` credentials.

#### Method 2: Service Account Key File (Recommended for Production/CI/CD)

For production environments, CI/CD pipelines, or situations where you don't want to use a personal account, **service accounts** are the secure and recommended method. A service account is a special type of Google account that represents your application rather than an individual user.

**Caution:** Service account key files grant powerful access. Keep them secure and never commit them to version control.

**Create a Service Account:**

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Navigate to the **Navigation menu (☰) > IAM & Admin > Service Accounts**.
3.  Click **"+ CREATE SERVICE ACCOUNT"**.
4.  Enter a **Service account name** (e.g., `my-local-api-sa`) and an optional description.
5.  Click **"CREATE AND CONTINUE"**.

**Grant Permissions (Roles):**

1.  In the "Grant this service account access to project" section, select the roles necessary for your application to interact with the required APIs. Grant the **principle of least privilege**: only give the permissions absolutely needed.
    * For example, if you're using Cloud Storage, you might grant `Storage Object Admin` or `Storage Object Viewer`. If using Vertex AI, you might grant `Vertex AI User` or `Vertex AI Administrator`.
2.  Click **"CONTINUE"**.

**Create a Key (JSON File):**

1.  In the "Grant users access to this service account" section (optional, skip if not needed), click **"DONE"**.
2.  On the Service Accounts page, find your newly created service account.
3.  Click on the **three dots (⋮)** under the "Actions" column for your service account.
4.  Select **"Manage keys"**.
5.  Click **"ADD KEY" > "Create new key"**.
6.  Choose **"JSON"** as the key type.
7.  Click **"Create"**.
8.  Your browser will download a JSON key file (e.g., `your-service-account-name-xxxx.json`). **Save this file in a secure location on your local machine.**

**Set the `GOOGLE_APPLICATION_CREDENTIALS` Environment Variable:**

Most Google Cloud client libraries automatically detect credentials if the `GOOGLE_APPLICATION_CREDENTIALS` environment variable is set to the path of your service account JSON key file.

* **Linux/macOS:**

    ```bash
    export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your-service-account-key.json"
    ```
**Important:** This environment variable is usually session-specific. For persistent access, you might add this line to your shell's profile file (e.g., `.bashrc`, `.zshrc`, `~/.profile` for Linux/macOS, or configure it in your IDE/system environment variables). However, for development, setting it per-session or through your IDE's run configurations is often safer.


### Installation
1.  Navigate to your ComfyUI `custom_nodes` directory.
2.  Add the contents of this repository to the `custom_nodes` directory.
3.  Set configurations in `config.yaml` file. You can find these values in your Google Cloud Console.
4.  Install the dependencies present in the `requirements.txt` file. You can do this by running the following command in your terminal:

    ```bash
    pip install -r requirements.txt
    ```
5.  **Restart the ComfyUI server.**

### Installation from git
1.  Navigate to your ComfyUI `custom_nodes` directory.
2.  Clone the git repo under `custom_nodes` directory.
3.  **Restart the ComfyUI server.**

### Usage
After installing and restarting ComfyUI, you will find the "VertexAI" category added to the node menu.
