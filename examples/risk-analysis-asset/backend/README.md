# SRE Risk Analysis Tool - Backend

This Flask-based backend provides APIs to manage applications, critical user journeys (CUJs), and risks, storing data in a Firestore database.

## Features

*   **Application Management:** 
    *   Add new applications with names and descriptions.
    *   List all existing applications.

*   **Critical User Journey (CUJ) Management:**
    *   Add a new CUJ with name and description for a specific application.
    *   List CUJs for a specific application.
    *   Get details of a specific CUJ.
    *   Update a CUJ's information, including risk associations and accepted risk data.
    *   Remove a risk's association from a CUJ.

*   **Risk Management:**
    *   Add new risks with details like name, theme, associated CUJs, ETTD, ETTR, impact, frequency, etc.
    *   Update existing risks.
    *   Soft-delete risks by moving them to a "Deleted Risks" collection and removing associations from CUJs.
    *   Retrieve risks associated with a specific CUJ, sorted by "Bad Mins/Year".

*   **Risk Theme Management**
    *   Add new risk themes.
    *   Get a list of all risk themes.


## Setup

1.  **Clone the repository:**

    ```bash
    git clone <repository_url> 
    ```

2.  **Install dependencies:**

    ```bash
    pip install -r requirements.txt
    ```

3.  **Configuration:**   

    *   Update the `config.json` file with the relevant information:

    ```json
    {
      "project": "your-firebase-project-id", 
      "database": "your-database-name" 
    }
    ```

## API Endpoints

*   **`/api/apps` (POST):**  Creates a new application.
*   **`/api/apps` (GET):**  Lists all applications.
*   **`/api/cujs` (POST):** Creates a new CUJ.
*   **`/api/<app_id>/cujs` (GET):** Lists CUJs for a specific application.
*   **`/api/cujs/<cuj_id>` (GET):** Gets details of a specific CUJ.
*   **`/api/cujs/<cuj_id>` (PUT):** Updates a CUJ.
*   **`/api/cujs/<cuj_id>/remove_risk/<risk_id>` (PUT):**  Removes a risk association from a CUJ.
*   **`/api/riskThemes` (POST):**  Adds a new risk theme.
*   **`/api/riskThemes` (GET):** Gets all risk themes.
*   **`/api/risks` (POST):**  Creates a new risk.
*   **`/api/risks/<risk_id>` (PUT):**  Updates an existing risk.
*   **`/api/risks/<risk_id>` (DELETE):**  Soft-deletes a risk.
*   **`/api/cujs/<cuj_id>/risks` (GET):** Retrieves risks for a specific CUJ.
