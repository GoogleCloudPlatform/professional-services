# Creative Studio Backend

[![linting: pylint](https://img.shields.io/badge/linting-pylint-yellowgreen)](https://github.com/pylint-dev/pylint)
[![Code Style: Google](https://img.shields.io/badge/code%20style-google-blueviolet.svg)](https://github.com/google/gts)

Creative Studio is a set of templates that can be deployed out of the box into Cloud Run and work independently. Each one can be run independently connected to the user default google cloud auth credentials, and based on the complexity of each template, may require to deploy more or less resources into our Google Cloud Project.
The architecture always follows the following structure: a folder for the frontend which consists in an Angular app, and a backend folder which consists of a FastAPI Python app.

## 🚀 Backend Setup
Before running the application, you must initialize the Google Cloud project with a Firestore database and the necessary indexes.

### Step 0: Setup gcp dependencies

Two environment variables are required to run this application:

`PROJECT_ID`
Provide an environment variable for your Google Cloud Project ID

```
export PROJECT_ID=$(gcloud config get project)
```

`GENMEDIA_BUCKET`
You'll need Google Cloud Storage bucket for the generative media. Note that this has to exist prior to running the application.

If an existing Google Cloud Storage bucket is available, please provide its name without the `"gs://"` prefix.

```
export GENMEDIA_BUCKET=$PROJECT_ID-genmedia
```

Otherwise, follow the next steps to create a storage bucket.

#### Create Storage Bucket (Optional)

Please run the following command to obtain new credentials.

```
gcloud auth login
or
gcloud auth application-default login
```

If you have already logged in with a different account, run:

```
gcloud config set project $PROJECT_ID

gcloud config set account <your gcp email account>
```

You may need to set the default quota project for your ADC Credentials
```
gcloud auth application-default set-quota-project $PROJECT_ID
```

Create the storage bucket and make the url images accessible to the frontend.

```
gcloud storage buckets create gs://$GENMEDIA_BUCKET --location=US --default-storage-class=STANDARD

gcloud storage buckets add-iam-policy-binding gs://$GENMEDIA_BUCKET \
    --member=allUsers \
    --role=roles/storage.objectViewer
```

If you can't make the images accessible to anyone with the previous command, due to an error like the following:
```
ERROR: (gcloud.storage.buckets.add-iam-policy-binding) HTTPError 412: One or more users named in the policy do not belong to a permitted customer.
```

Probably is due to organizational restrictions, and the images/videos won't appear on the UI.
In that case, you can configure Creative Studio to generate presigned url, and access them by setting up a separated service account.
```
export SA_NAME=sa-genmedia-creative-studio

gcloud iam service-accounts create $SA_NAME \
  --display-name="Image Signing Service Account" \
  --project=$PROJECT_ID

gcloud storage buckets add-iam-policy-binding gs://$GENMEDIA_BUCKET \
  --member="serviceAccount:$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.objectViewer"

# You can change the USER_EMAIL accordingly to your case
export USER_EMAIL=$(gcloud config get account)
gcloud iam service-accounts add-iam-policy-binding $SA_NAME@$PROJECT_ID.iam.gserviceaccount.com --member="user:$USER_EMAIL" --role="roles/iam.serviceAccountTokenCreator"
```

### Enable the GCP Services
#### 2. Enable required Google Cloud APIs
```
gcloud services enable \
    run.googleapis.com \
    compute.googleapis.com \
    cloudfunctions.googleapis.com \
    cloudbuild.googleapis.com \
    artifactregistry.googleapis.com \
    iamcredentials.googleapis.com \
    aiplatform.googleapis.com \
    firestore.googleapis.com \
    gmail.googleapis.com \
```
### Step 1.1: Configure Service Account for Sending Emails (Gmail API)
To allow the application to send workspace invitation emails via the Gmail API, you must authorize a service account to act on behalf of a user within your Google Workspace organization. This is done using **Domain-Wide Delegation**.

> **Note:** This requires administrator access to your organization's Google Workspace Admin Console (`admin.google.com`).

1.  **Choose or Create a Service Account:**
    You can use an existing service account or create a new one for this purpose. Let's assume you use the same one for signing URLs for simplicity:
    ```bash
    export SA_NAME=sa-genmedia-creative-studio
    export SA_EMAIL=$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com
    ```

2.  **Find the Service Account's Unique Client ID:**
    Every service account has a unique numeric ID. Find it by running this command:
    ```bash
    gcloud iam service-accounts describe $SA_EMAIL --format='value(oauth2ClientId)'
    ```
    Copy the long number that is output. This is your **Client ID**.

3.  **Delegate Domain-Wide Authority in Google Workspace:**
    - Go to your Google Workspace Admin Console: admin.google.com.
    - Navigate to **Security > Access and data control > API controls**.
    - In the "Domain-wide Delegation" pane, click **Manage Domain-Wide Delegation**.
    - Click **Add new**.
    - In the **Client ID** field, paste the numeric Client ID you copied earlier.
    - In the **OAuth scopes (comma-delimited)** field, add the following scope:
      `https://www.googleapis.com/auth/gmail.send`
    - Click **Authorize**.

4.  **Set the Sender Email Environment Variable:**
    In your `.env` file or Cloud Run environment variables, set `SENDER_EMAIL` to the email address you want the service account to send emails as (e.g., `export SENDER_EMAIL="no-reply@your-domain.com"`). This user must be part of your Google Workspace organization.

    > **IMPORTANT:** The `SENDER_EMAIL` **cannot** be the service account's own email address (e.g., `...gserviceaccount.com`). It must be a real user account within your Google Workspace.

#### A Note for GCP Project Owners without Workspace Admin Access

It is common in larger organizations for the GCP Project Owner and the Google Workspace Administrator to be different people.

- **Your Role (as GCP Project Owner):** Your responsibility is to create the service account and get its **Client ID** (Step 2 in the guide above).
- **The Workspace Admin's Role:** You must provide the **Client ID** and the required **OAuth scope** (`https://www.googleapis.com/auth/gmail.send`) to your organization's Google Workspace administrator. They are the only ones who can perform the authorization steps in the Google Workspace Admin Console.

You will need to coordinate with them to complete this setup.

#### Can I Use My Own Email Address?

Yes. If you cannot create a `no-reply@your-domain.com` user, you can use your own Google Workspace email address as the `SENDER_EMAIL`. The process is the same:

1.  Set the `SENDER_EMAIL` environment variable to your own email address.
2.  Provide the **Client ID** of your service account to your Workspace Admin and ask them to delegate domain-wide authority to it for your specific email address (e.g., `your-name@your-domain.com`).

This is a common and perfectly valid approach for development or when you don't have permissions to create new users.


### Step 1.2: Create a "Sender" User Account in Google Workspace (if needed)
If you don't have a generic email address like `no-reply@your-domain.com` to use as the `SENDER_EMAIL`, you can create one. This requires administrator access to your Google Workspace.

1.  **Log in to the Google Workspace Admin Console:**
    Go to admin.google.com.

2.  **Navigate to Users:**
    From the Admin console Home page, go to **Directory > Users**.

3.  **Add a New User:**
    - At the top of the page, click **Add new user**.
    - Fill in the user information:
        - **First name:** `No-Reply`
        - **Last name:** `System` (or your application's name)
        - **Primary email:** `no-reply` (the domain will be automatically added)
    - It's recommended to auto-generate a password, as you won't need to log in as this user directly.
    - Click **Add New User**.

Once this user is created, you can use `no-reply@your-domain.com` as the value for the `SENDER_EMAIL` environment variable. The service account you configured in the previous step will then be able to send emails on behalf of this new user.

### Step 1: Create the Firestore Database
A Firestore database must be created for your project. This is a one-time operation.

> **IMPORTANT!** The choice of location is permanent. Choose a location that is close to your users and other Google Cloud services (e.g., us-central1, europe-west1).

Run the following gcloud command, replacing YOUR_LOCATION with your desired region:

```bash
# Replace YOUR_LOCATION with your desired region (e.g., us-central1)
gcloud firestore databases create --location=YOUR_LOCATION
```

This will create a new Firestore database in Native Mode.

### Step 2: Create Required Indexes
Our application uses specific queries that require custom composite indexes to function correctly.

```bash
# For MediaItems
# Command for Index 1: user_email and created_at
# This index allows you to query for a specific user's media and sort it by the most recent.
gcloud firestore indexes composite create \
  --collection-group=media_library \
  --query-scope=COLLECTION \
  --field-config=field-path=user_email,order=ASCENDING \
  --field-config=field-path=created_at,order=DESCENDING \

# Command for Index 2: mime_type and created_at
# This index allows you to filter all media by its type (e.g., image/png) and sort it by the most recent.
gcloud firestore indexes composite create \
  --collection-group=media_library \
  --query-scope=COLLECTION \
  --field-config=field-path=mime_type,order=ASCENDING \
  --field-config=field-path=created_at,order=DESCENDING \

# Command for Index 3: model and created_at
# This index allows you to filter all media by the generation model used (e.g., imagen-4.0) and sort it by the most recent.
gcloud firestore indexes composite create \
  --collection-group=media_library \
  --query-scope=COLLECTION \
  --field-config=field-path=model,order=ASCENDING \
  --field-config=field-path=created_at,order=DESCENDING \

# Command for Index 4: status and created_at
# This index allows you to filter all media by its status (e.g., completed, failed) and sort it by the most recent.
gcloud firestore indexes composite create \
  --collection-group=media_library \
  --query-scope=COLLECTION \
  --field-config=field-path=status,order=ASCENDING \
  --field-config=field-path=created_at,order=DESCENDING \

# Command for Index 5: workspace_id, user_email and created_at
# This index allows you to query for a specific user's media within a workspace and sort it by the most recent.
gcloud firestore indexes composite create \
  --collection-group=media_library \
  --query-scope=COLLECTION \
  --field-config=field-path=workspace_id,order=ASCENDING \
  --field-config=field-path=user_email,order=ASCENDING \
  --field-config=field-path=created_at,order=DESCENDING \

# Command for Index 6: workspace_id, mime_type and created_at
# This index allows you to filter all media within a workspace by its type and sort it by the most recent.
gcloud firestore indexes composite create \
  --collection-group=media_library \
  --query-scope=COLLECTION \
  --field-config=field-path=workspace_id,order=ASCENDING \
  --field-config=field-path=mime_type,order=ASCENDING \
  --field-config=field-path=created_at,order=DESCENDING \

# Command for Index 7: workspace_id, model and created_at
# This index allows you to filter all media within a workspace by the generation model used and sort it by the most recent.
gcloud firestore indexes composite create \
  --collection-group=media_library \
  --query-scope=COLLECTION \
  --field-config=field-path=workspace_id,order=ASCENDING \
  --field-config=field-path=model,order=ASCENDING \
  --field-config=field-path=created_at,order=DESCENDING \

# Command for Index 8: workspace_id, status and created_at
# This index allows you to filter all media within a workspace by its status and sort it by the most recent.
gcloud firestore indexes composite create \
  --collection-group=media_library \
  --query-scope=COLLECTION \
  --field-config=field-path=workspace_id,order=ASCENDING \
  --field-config=field-path=status,order=ASCENDING \
  --field-config=field-path=created_at,order=DESCENDING \

# Command for Index 9: workspace_id, created_at and __name__
# This index allows you to query for a specific user's media within a workspace and sort it by the most recent, with document ID as a tie-breaker.
gcloud firestore indexes composite create \
  --collection-group=media_library \
  --query-scope=COLLECTION \
  --field-config=field-path=workspace_id,order=ASCENDING \
  --field-config=field-path=created_at,order=DESCENDING \
  --field-config=field-path=__name__,order=DESCENDING \

# For Users
gcloud firestore indexes composite create \
  --collection-group=users \
  --query-scope=COLLECTION \
  --field-config=field-path=role,order=ASCENDING \
  --field-config=field-path=created_at,order=DESCENDING \

gcloud firestore indexes composite create \
  --collection-group=users \
  --query-scope=COLLECTION \
  --field-config=field-path=email,order=ASCENDING \
  --field-config=field-path=created_at,order=DESCENDING \


# For Source Assets
# For de-duplication (user_id == AND file_hash ==)
gcloud firestore indexes composite create \
  --collection-group=source_assets \
  --query-scope=COLLECTION \
  --field-config=field-path=user_id,order=ASCENDING \
  --field-config=field-path=file_hash,order=ASCENDING

# For paginated search of a user's assets (user_id == ORDER BY created_at DESC)
gcloud firestore indexes composite create \
  --collection-group=source_assets \
  --query-scope=COLLECTION \
  --field-config=field-path=user_id,order=ASCENDING \
  --field-config=field-path=created_at,order=DESCENDING

# For paginated search of a source's assets filtered by mime_type
# (user_id == AND mime_type == ORDER BY created_at DESC)
gcloud firestore indexes composite create \
  --collection-group=source_assets \
  --query-scope=COLLECTION \
  --field-config=field-path=user_id,order=ASCENDING \
  --field-config=field-path=mime_type,order=ASCENDING \
  --field-config=field-path=created_at,order=DESCENDING \

# For queries that filter by mime_type and order by creation date
gcloud firestore indexes composite create \
  --collection-group=source_assets \
  --query-scope=COLLECTION \
  --field-config=field-path=mime_type,order=ASCENDING \
  --field-config=field-path=created_at,order=DESCENDING \

# For querying system-level assets by their type (e.g., for VTO dashboard)
gcloud firestore indexes composite create \
  --collection-group=source_assets \
  --query-scope=COLLECTION \
  --field-config=field-path=scope,order=ASCENDING \
  --field-config=field-path=asset_type,order=ASCENDING \

# For queries that filter by scope and order by creation date
gcloud firestore indexes composite create \
  --collection-group=source_assets \
  --query-scope=COLLECTION \
  --field-config=field-path=scope,order=ASCENDING \
  --field-config=field-path=created_at,order=DESCENDING \

gcloud firestore indexes composite create \
  --collection-group=source_assets \
  --query-scope=COLLECTION \
  --field-config=field-path=created_at,order=DESCENDING \
  --field-config=field-path=original_filename,order=DESCENDING \

gcloud firestore indexes composite create \
  --collection-group=source_assets \
  --query-scope=COLLECTION \
  --field-config=field-path=asset_type,order=ASCENDING \
  --field-config=field-path=created_at,order=DESCENDING \

# For querying a user's private VTO assets by type
gcloud firestore indexes composite create \
  --collection-group=source_assets \
  --query-scope=COLLECTION \
  --field-config=field-path=user_id,order=ASCENDING \
  --field-config=field-path=scope,order=ASCENDING \
  --field-config=field-path=asset_type,order=ASCENDING \

# For Brand Guidelines
gcloud firestore indexes composite create \
  --collection-group=brand_guidelines \
  --query-scope=COLLECTION \
  --field-config=field-path=workspace_id,order=ASCENDING \
  --field-config=field-path=created_at,order=DESCENDING \
  --field-config=field-path=__name__,order=DESCENDING \


# For Source Assets
gcloud firestore indexes composite create \
  --collection-group=source_assets \
  --query-scope=COLLECTION \
  --field-config=field-path=asset_type,order=ASCENDING \
  --field-config=field-path=user_id,order=ASCENDING \
  --field-config=field-path=created_at,order=DESCENDING \
  --field-config=field-path=__name__,order=DESCENDING \

gcloud firestore indexes composite create \
  --collection-group=source_assets \
  --query-scope=COLLECTION \
  --field-config=field-path=user_id,order=ASCENDING \
  --field-config=field-path=mime_type,order=ASCENDING \
  --field-config=field-path=__name__,order=ASCENDING \

gcloud firestore indexes composite create \
  --collection-group=source_assets \
  --query-scope=COLLECTION \
  --field-config=field-path=user_id,order=ASCENDING \
  --field-config=field-path=created_at,order=DESCENDING \
  --field-config=field-path=mime_type,order=DESCENDING \
  --field-config=field-path=__name__,order=DESCENDING \

# After a while you can check with
gcloud beta firestore indexes composite list
```

> **Note:** After running the command, index creation can take several minutes. You can monitor the status of your indexes in the Google Cloud Console under Firestore > Indexes. Your queries will fail until the index status is "Ready".

### Step 3: Full-Text Search (The "Search Bar")

This is the most important part: **Firestore is not a text search engine.**

You cannot create an index that allows you to efficiently search for parts of a string within the `prompt` field (like a `LIKE` query in SQL). Queries on string fields in Firestore are mostly limited to exact matches.

To implement a proper search bar, you must integrate a dedicated third-party search service. This is the standard and recommended approach.

**OpenSearch:** This is a more powerful and customizable solution, but also more complex to manage. You would set up an Elasticsearch cluster and use a Cloud Function that triggers whenever a `MediaItem` is created or updated in Firestore. This function would then send the text fields (`prompt`, `critique`, etc.) to Elasticsearch for indexing.


## Deploying to CloudRun
## Create Image Repository if not created yet
```bash
  # 1. Define image repository and name
  export PROJECT_ID=creative-studio-arena && \
  export REGION="us-central1" && \
  export REPO_NAME="creative-studio-repo" && \
  export IMAGE_NAME="creative-studio-backend"

  # 2. Create an Artifact Registry repository
  gcloud artifacts repositories create $REPO_NAME \
      --repository-format=docker \
      --location=$REGION \
      --description="Docker repository for Creative Studio application"
```

## Build/Rebuild and Push the Container
```bash
  export PROJECT_ID=creative-studio-arena && \
  export REGION="us-central1" && \
  export REPO_NAME="creative-studio-repo" && \
  export SERVICE_NAME="creative-studio-backend" && \

  # 3. Build the container image and push it to Artifact Registry
  gcloud builds submit . \
  --config backend/cloudbuild.yaml \
  --substitutions=_REGION="${REGION}",_REPO_NAME="${REPO_NAME}",_SERVICE_NAME="${SERVICE_NAME}"
```

## Deploy the Cloud Function

```bash
  # 1. Define your function name and frontend URL
  export PROJECT_ID=creative-studio-arena && \
  export REGION="us-central1" && \
  export REPO_NAME="creative-studio-repo" && \
  export GENMEDIA_BUCKET=$PROJECT_ID-genmedia && \
  export FUNCTION_NAME=creative-studio-api && \
  export FRONTEND_PROD_URL="https://your-frontend-app-url.com" && \
  export SIGNING_SA_EMAIL=sa-genmedia-creative-studio@$PROJECT_ID.iam.gserviceaccount.com && \
  export IMAGE_NAME="creative-studio-backend" && \
  export GOOGLE_TOKEN_AUDIENCE="your-token-audience.apps.googleusercontent.com" && \
  export IDENTITY_PLATFORM_ALLOWED_ORGS="your-company" && \

  # 2. Deploy the function
  gcloud run deploy $FUNCTION_NAME \
    --region=$REGION \
    --image="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${IMAGE_NAME}:latest" \
    --platform=managed \
    --allow-unauthenticated \
    --no-invoker-iam-check \
    --memory="2Gi" \
    --set-env-vars="ENVIRONMENT=development,FRONTEND_URL=${FRONTEND_PROD_URL},SIGNING_SA_EMAIL=${SIGNING_SA_EMAIL},GENMEDIA_BUCKET=${GENMEDIA_BUCKET}" \
    --timeout=300s # Set a reasonable timeout (e.g., 5 minutes)
```

## Running Locally
### 1. Create virtualenv inside the backend folder and install dependencies
Create a virtual environment with uv on the root of the application, activate it and install the requirements
```
# Check if you are already in the virtual env
uv python find

# If not then
uv venv
source .venv/bin/activate
uv sync --all-extras
```

> **IMPORTANT!** VS Code may not recognize your env, in that case type "ctrl + shift + P", then select "Python: Select Interpreter" and then select "Enter interpreter path..." and then select your .venv python interpreter, in this case .backend/.venv/bin/python

### 1.1 Installing ffmpeg
If you want to use the video capabilities, you will need to install ffmpeg. Meanwhile this is done automatically on Docker, if you are trying this on local you will need to install it. You can see [the official FFMPEG documentation here](https://ffmpeg.org/download.html), but overall:
```
# On Debian/Ubuntu
sudo apt install ffmpeg

# On Windows, OS X, etc
brew install ffmpeg
```

### 2. Setup gcloud credentials
```
gcloud auth list
gcloud config list

gcloud config set account <your account email>
gcloud auth login
gcloud config set project <your project id>
gcloud auth application-default set-quota-project <your project id>

gcloud auth list
gcloud config list
```

### 3. Add environment variables (an example you can copy in .local.env)
```
# Copy the file .local.env and paste it as '.env'
export $(grep -v '^#' .env | xargs)
```

Check that the env variables has been taken into account, running:
```
env
```
You should see the new env variables set there


### 4. Run the application
Finally run using uvicorn
```
uvicorn main:app --reload --port 8080
```

## Code Styling & Commit Guidelines

To maintain code quality and consistency:

* **TypeScript (Frontend):** We follow [Angular Coding Style Guide](https://angular.dev/style-guide) by leveraging the use of [Google's TypeScript Style Guide](https://github.com/google/gts) using `gts`. This includes a formatter, linter, and automatic code fixer.
* **Python (Backend):** We adhere to the [Google Python Style Guide](https://google.github.io/styleguide/pyguide.html), using tools like `pylint` and `black` for linting and formatting.
* **Commit Messages:** We suggest following [Angular's Commit Message Guidelines](https://github.com/angular/angular/blob/main/contributing-docs/commit-message-guidelines.md) to create clear and descriptive commit messages.

#### Frontend (TypeScript with `gts`)

1.  **Initialize `gts` (if not already done in the project):**
    Navigate to the `frontend/` directory and run:
    ```bash
    npx gts init
    ```
    This will set up `gts` and create necessary configuration files (like `tsconfig.json`). Ensure your `tsconfig.json` (or a related gts config file like `.gtsrc`) includes an extension for `gts` defaults, typically:
    ```json
    {
      "extends": "./node_modules/gts/tsconfig-google.json",
      // ... other configurations
    }
    ```
2.  **Check for linting issues:**
    ```bash
    npm run lint
    ```
    (This assumes a `lint` script is defined in `package.json`, e.g., `"lint": "gts lint"`)
3.  **Fix linting issues automatically (where possible):**
    ```bash
    npm run fix
    ```
    (This assumes a `fix` script is defined in `package.json`, e.g., `"fix": "gts fix"`)

#### Backend (Python with `pylint` and `black`)

1.  **Ensure Dependencies are Installed:**
    Add `pylint` and `black` to your `backend/requirements.txt` file:
    ```
    pylint
    black
    ```
    Then install them within your virtual environment:
    ```bash
    pip install pylint black
    # or pip install -r requirements.txt
    ```
2.  **Configure `pylint`:**
    It's recommended to have a `.pylintrc` file in your `backend/` directory to configure `pylint` rules. You might need to copy a standard one or generate one (`pylint --generate-rcfile > .pylintrc`).
3.  **Check for linting issues with `pylint`:**
    Navigate to the `backend/` directory and run:
    ```bash
    pylint .
    ```
    (Or specify modules/packages: `pylint your_module_name`)
4.  **Format code with `black`:**
    To automatically format all Python files in the current directory and subdirectories:
    ```bash
    python -m black . --line-length=80
    ```

===
