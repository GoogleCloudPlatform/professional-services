# Cloud AgentSpace and Discovery API with Domain-Wide Delegation (DWD)

This project demonstrates how to authenticate and interact with Google Cloud's AgentSpace and Discovery Engine API using Domain-Wide Delegation (DWD) to impersonate a user. This approach is particularly useful when you need to perform actions on behalf of a specific user within your organization, leveraging the security and control provided by DWD.

## Overview

The `OauthApplication.java` class showcases the following key functionalities:

1.  **Generating a Signed JWT:** It uses the Google IAM Credentials API to create a signed JSON Web Token (JWT) that asserts the identity of a user.
2.  **Exchanging JWT for Access Token:** It exchanges the signed JWT for an OAuth 2.0 access token from Google's OAuth 2.0 token endpoint.
3.  **Authenticating with Discovery Engine:** It uses the obtained access token to authenticate with the Discovery Engine API.
4.  **Performing a Search:** It executes a sample search query against a configured Discovery Engine data store.

## Prerequisites

Before running this project, ensure you have the following:

*   **Google Cloud Project:** A Google Cloud project with the Discovery Engine API enabled.
*   **Service Account:** A service account with the necessary permissions to access the Discovery Engine API and the IAM Credentials API.
*   **Domain-Wide Delegation:** Domain-Wide Delegation configured for the service account.
*   **Discovery Engine Data Store:** A data store created in Discovery Engine.
*   **Java Development Kit (JDK):** JDK 11 or higher.
*   **Maven:** For building and managing project dependencies.
*   **Google Cloud SDK (gcloud):** For interacting with Google Cloud services from the command line.

## Configuration

You'll need to configure the following parameters in the `OauthApplication.java` file:

*   `projectId`: Your Google Cloud project ID.
*   `location`: The location of your Discovery Engine data store (e.g., "global", "us", "eu").
*   `collectionId`: The ID of the collection containing your data store (usually "default_collection").
*   `engineId`: The ID of your Discovery Engine search engine.
*   `servingConfigId`: The ID of the serving configuration (usually "default_search").
*   `searchUserEmail`: The email address of the user you want to impersonate.
*   `serviceAccountId`: The email address of the service account with DWD enabled.
*   `searchQuery`: The search query you want to execute.

```java
    String projectId = "your-project-id"; // Project ID .
    String location = "global"; // Location of data store. Options: "global", "us", "eu"
    String collectionId = "default_collection"; // Collection containing the data store.
    String engineId = "your-engine-id"; // Engine ID.
    String servingConfigId = "default_search"; // Serving configuration. Options: "default_search"
    String searchUserEmail = "user@your-domain.com"; // Email-id of the user to impersonate
    String serviceAccountId = "your-service-account@your-project-id.iam.gserviceaccount.com"; // Service account with the permission on the WIF

    String searchQuery = "Sample Search Query"; // Search Query for the data store.
```

## How It Works

This project utilizes a series of steps to authenticate and perform searches using Domain-Wide Delegation. Here's a breakdown of the process:

1.  **JWT Generation:** The `generateSingedJwt()` method is responsible for creating a JSON Web Token (JWT). This JWT includes claims that identify both the user to be impersonated (`sub` claim) and the service account performing the impersonation (`iss` claim).
2.  **Token Exchange:** The `getAccessToken()` method takes the signed JWT and exchanges it for an OAuth 2.0 access token. This exchange occurs by sending the JWT to Google's OAuth 2.0 token endpoint.
3.  **Credential Creation:** The `generateCredentials()` method then takes the newly acquired access token and constructs OAuth 2.0 credentials that can be used for authentication.
4.  **Search Execution:** Finally, the `search()` method uses these credentials to instantiate a `SearchServiceClient`. This client is then used to execute a search request against the configured Discovery Engine.


## Building and Running

These instructions will guide you through the process of building and running the application.

### Cloning the Repository

1.  Clone the repository to your local machine using Git:

    ```bash
    git clone <repository-url>
    ```

2.  Navigate to the project directory:

    ```bash
    cd <project-directory>
    ```

### Building the Project

1.  Build the project using Maven:

    ```bash
    mvn clean install
    ```

### Running the Application

1.  Execute the application using the Maven `exec` plugin:

    ```bash
    mvn exec:java -Dexec.mainClass="com.google.cloud.pso.OauthApplication"
    ```

## Testing
The OauthApplicationTest.java file contains unit tests to verify the functionality of the OauthApplication class. You can run the tests using Maven:

```bash
mvn test
```