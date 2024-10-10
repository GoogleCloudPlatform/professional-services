#    Copyright 2023 Google LLC

#    Licensed under the Apache License, Version 2.0 (the "License");
#    you may not use this file except in compliance with the License.
#    You may obtain a copy of the License at

#        http://www.apache.org/licenses/LICENSE-2.0

#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS,
#    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#    See the License for the specific language governing permissions and
#    limitations under the License.


"""
This is a Flask application for managing applications, 
critical user journeys (CUJs), and risks. It provides API endpoints 
for creating, listing, updating, and deleting these entities. 

The application uses Google Cloud Firestore for data storage and 
requires authentication using Google OAuth2.
"""


import os
import logging
from datetime import datetime
from functools import wraps

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from google.cloud import firestore
from google.oauth2 import id_token
from google.auth.transport import requests

app = Flask(__name__)
load_dotenv()
frontend_url = os.environ.get("FRONTEND_SERVICE_URL")
logging.basicConfig(level=logging.INFO)
app.logger.info("FRONTEND_SERVICE_URL : %s", frontend_url)
CORS(app)
# CORS(app, resources={r"/*": {"origins": frontend_url}})


if os.environ.get("ENV") == "local":
    project_id = os.getenv("FIRESTORE_PROJECT_ID")
    database_id = os.getenv("FIRESTORE_DATABASE_ID")
else:
    project_id = os.environ.get("FIRESTORE_PROJECT_ID")
    database_id = os.environ.get("FIRESTORE_DATABASE_ID")

try:
    db = firestore.Client(project=project_id, database=database_id)
    app.logger.info(
        "Successfully connected to firestore, project_id = %s, database_id = %s",
        project_id,
        database_id,
    )
except Exception as e:
    app.logger.error(
        "Failed to connect to firestore, project_id = %s, database_id = %s",
        project_id,
        database_id,
    )


def token_required(f):
    """Validates the bearer token receieved from frontend"""

    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == "OPTIONS":
            return "", 204
        token = request.headers.get("Authorization")
        if token and token.startswith("Bearer "):
            token = token.split(" ")[1]
        else:
            return jsonify({"message": "Token is missing!"}), 403

        try:
            id_token.verify_oauth2_token(token, requests.Request())
        except ValueError as e:
            app.logger.error("Invalid token: %s", e)
            return jsonify({"message": "Invalid token!"}), 401
        except Exception as e:
            app.logger.error("Error verifying token: %s", e)
            return jsonify({"message": "Error verifying token!"}), 500

        return f(*args, **kwargs)

    return decorated


## uncomment for CORS support,
# Cloud Run doesn't support CORS if unauthenticated requests are disallowed
@app.route("/api/apps", methods=["OPTIONS"])
@token_required
def handle_preflight():
    """Handle CORS Header for Preflight check"""
    response = app.make_response("")
    response.headers.add("Access-Control-Allow-Origin", frontend_url)
    response.headers.add(
        "Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS"
    )
    response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
    return response


# Add a new Application
@app.route("/api/apps", methods=["POST"])
@token_required
def create_application():
    """Add a new application"""
    try:
        data = request.get_json()
        app_name = data.get("applicationName")
        app_description = data.get("applicationDescription")

        # Data validation (add more as needed)
        if not app_name or not app_description:
            return jsonify({"error": "Missing required fields"}), 400

        # Create a new document with auto-generated ID
        app_ref = db.collection("Applications").document()
        app_ref.set(
            {
                "applicationName": app_name,
                "applicationDescription": app_description,
                "CUJIds": [],
            }
        )
        return (
            jsonify(
                {"message": "Application created successfully", "appId": app_ref.id}
            ),
            201,
        )

    except Exception as e:
        app.logger.error("Error creating application: %s", e)
        return jsonify({"error": f"Error creating Application: {e}"}), 500


# List Applications
@app.route("/api/apps", methods=["GET"])
@token_required
def list_application():
    """List applications"""
    try:
        # Reference to the 'Applications' collection
        apps_ref = db.collection("Applications")
        # Fetch all documents in the collection
        apps = apps_ref.stream()

        # Convert each document to a dictionary and store in a list
        app_list = []
        for risk_app in apps:
            app_data = risk_app.to_dict()
            app_data["id"] = risk_app.id
            app_list.append(app_data)

        # Return the list of Applications as JSON
        return jsonify(app_list), 200

    except Exception as e:
        app.logger.error("Error fetching Applications: %s", e)
        return jsonify({"error": f"Error fetching Applications: {e}"}), 500


# Add a new journey
@app.route("/api/cujs", methods=["POST"])
@token_required
def create_critical_user_journey():
    """Add a new User Journey"""
    try:
        data = request.get_json()
        journey_name = data.get("journeyName")
        journey_description = data.get("journeyDescription")
        application_id = data.get("applicationId")

        # Data validation (add more as needed)
        if not journey_name or not journey_description:
            return jsonify({"error": "Missing required fields"}), 400

        # Create a new document with auto-generated ID
        cuj_ref = db.collection("Critical User Journeys").document()
        cuj_ref.set(
            {
                "CUJName": journey_name,
                "CUJDescription": journey_description,
                "RiskIDs": [],
                "accepted0": 0,
                "accepted1": 0,
                "accepted2": 0,
                "individualThreshold": 25,
                "targetAvailability0": 95,
                "targetAvailability1": 99,
                "targetAvailability2": 99.9,
            }
        )

        if cuj_ref.id:
            app_ref = db.collection("Applications").document(application_id)
            cuj_ids_snapshot = app_ref.get(["CUJIds"])
            if cuj_ids_snapshot.exists:
                cuj_ids_data = cuj_ids_snapshot.to_dict()
                current_cuj_ids = cuj_ids_data.get("CUJIds", [])
                if (
                    cuj_ref.id not in current_cuj_ids
                ):  # Check if the CUJ ID is already present
                    current_cuj_ids.append(cuj_ref.id)
                    app_ref.update({"CUJIds": current_cuj_ids})

        return (
            jsonify(
                {
                    "message": "Critical User Journey created successfully",
                    "cujId": cuj_ref.id,
                }
            ),
            201,
        )

    except Exception as e:
        app.logger.error("Error creating Critical User Journey: %s", e)
        return jsonify({"error": f"Error creating Critical User Journey: {e}"}), 500


# List CUJs
@app.route("/api/<string:app_id>/cujs", methods=["GET"])
@token_required
def list_cujs(app_id):
    """List User Journeys"""
    try:
        # Get the Application document
        app_ref = db.collection("Applications").document(app_id)
        app_doc = app_ref.get()

        if not app_doc.exists:
            return jsonify({"error": "Application not found"}), 404

        cuj_ids = app_doc.to_dict().get("CUJIds", [])

        if not cuj_ids:
            return jsonify([]), 200

        # Reference to the 'Critical User Journeys' collection
        cujs_ref = db.collection("Critical User Journeys")
        query = cujs_ref.where("__name__", "in", cuj_ids)  # Query for specific CUJs
        cuj_docs = query.stream()

        # Convert each document to a dictionary and store in a list
        cuj_list = []
        for cuj_doc in cuj_docs:
            cuj_data = cuj_doc.to_dict()
            cuj_data["id"] = cuj_doc.id
            cuj_list.append(cuj_data)

        # Return the list of CUJs as JSON
        return jsonify(cuj_list), 200

    except Exception as e:
        return jsonify({"error": f"Error fetching Critical User Journeys: {e}"}), 500


# List CUJ data
@app.route("/api/cujs/<string:cuj_id>", methods=["GET"])
@token_required
def get_cuj_details(cuj_id):
    """List User Journey data"""
    try:
        # Reference to the specific CUJ document
        cuj_ref = db.collection("Critical User Journeys").document(cuj_id)

        # Fetch the CUJ document
        cuj_doc = cuj_ref.get()

        if not cuj_doc.exists:
            return jsonify({"error": "Critical User Journey not found"}), 404

        # Convert the document to a dictionary and include the ID
        cuj_data = cuj_doc.to_dict()
        cuj_data["id"] = cuj_id  # Add the document ID to the response

        return jsonify(cuj_data), 200
    except Exception as e:
        return (
            jsonify({"error": f"Error fetching Critical User Journey details: {e}"}),
            500,
        )


# Update CUJ
@app.route("/api/cujs/<string:cuj_id>", methods=["PUT"])
@token_required
def update_cuj(cuj_id):
    """Update a User Journey"""
    try:
        # Get the updated data from the request
        try:
            data = request.get_json()
        except Exception as e:
            app.logger.error("failed to get request json %s", e)
        updated_keys = list(data.keys())
        # Reference to the specific CUJ document
        cuj_ref = db.collection("Critical User Journeys").document(cuj_id)

        # Get the current CUJ data
        cuj_doc = cuj_ref.get()
        if not cuj_doc.exists:
            return jsonify({"error": "Critical User Journey not found"}), 404

        # Combine existing RiskIDs with new ones (avoiding duplicates)
        update_data = {}
        for updated_key_name in updated_keys:
            # Handle RiskIDs as a list
            if updated_key_name == "RiskIDs":
                current_risk_ids = cuj_doc.to_dict().get("RiskIDs", [])
                if current_risk_ids != [None]:
                    if data["RiskIDs"] not in current_risk_ids:
                        current_risk_ids.append(data["RiskIDs"])
                else:
                    current_risk_ids = [data["RiskIDs"]]
                update_data[updated_key_name] = current_risk_ids
            else:
                update_data[updated_key_name] = data[updated_key_name]
        # Update the document in Firestore
        cuj_ref.update(update_data)

        return jsonify({"message": "Critical User Journey updated successfully"}), 200

    except Exception as e:
        return jsonify({"error": f"Error updating Critical User Journey: {e}"}), 500


# Delete CUJ/Risk Mapping at CUJ level
@app.route("/api/cujs/<string:cuj_id>/remove_risk/<string:risk_id>", methods=["PUT"])
@token_required
def remove_risk_from_cuj(cuj_id, risk_id, bad_mins):
    """Delete CUJ/Risk mapping"""
    try:
        # Reference to the specific CUJ document
        cuj_ref = db.collection("Critical User Journeys").document(cuj_id)
        cuj_doc = cuj_ref.get()
        # Update the CUJ document
        if cuj_doc.exists:
            cuj_data = cuj_doc.to_dict()
            current_risk_ids = cuj_data.get("RiskIDs", [])
            if risk_id in current_risk_ids:
                current_risk_ids.remove(risk_id)
                cuj_data["RiskIDs"] = current_risk_ids
                for i in range(3):
                    accepted_risk_id_field = f"acceptedRisks{i}"
                    accepted_bad_mins_field = f"accepted{i}"
                    accepted_risk_ids = cuj_data.get(accepted_risk_id_field, [])
                    old_accepted_bad_mins = cuj_data.get(accepted_bad_mins_field, 0)
                    if risk_id in accepted_risk_ids:
                        accepted_risk_ids.remove(risk_id)
                        cuj_data[accepted_risk_id_field] = accepted_risk_ids
                        new_bad_min = old_accepted_bad_mins - bad_mins
                        cuj_data[accepted_bad_mins_field] = new_bad_min
                cuj_ref.update(cuj_data)

        return (
            jsonify(
                {
                    "message": f"Risk {risk_id} removed from Critical User Journey successfully"
                }
            ),
            200,
        )

    except Exception as e:
        app.logger.error("Error removing risk from CUJ %s", e)
        return jsonify({"error": f"Error removing risk from CUJ: {e}"}), 500


# Add Risk Themes
@app.route("/api/riskThemes", methods=["POST"])
@token_required
def add_risk_theme():
    """Add a Risk Theme"""
    try:
        data = request.get_json()
        theme_name = data.get("ThemeName")

        # Data validation (you can add more checks as needed)
        if not theme_name:
            return jsonify({"error": "Missing Risk Theme Name"}), 400

        # Create a new document with auto-generated ID
        theme_ref = db.collection("Risk Themes").document()
        theme_ref.set(
            {
                "ThemeName": theme_name,
            }
        )

        return (
            jsonify(
                {
                    "message": "Risk theme added successfully",
                    "riskThemeId": theme_ref.id,
                }
            ),
            201,
        )

    except Exception as e:
        return jsonify({"error": f"Error adding risk theme: {e}"}), 500


# Get Risk Themes
@app.route("/api/riskThemes", methods=["GET"])
@token_required
def get_risk_themes():
    """List Risk Themes"""
    try:
        # Fetch risk themes (assuming a "Risk Themes" collection)
        themes_ref = db.collection("Risk Themes")
        themes = themes_ref.stream()
        theme_list = []
        for theme in themes:
            theme_data = theme.to_dict()
            theme_data["id"] = theme.id
            theme_list.append(theme_data)

        return jsonify(theme_list), 200
    except Exception as e:
        return jsonify({"error": f"Error fetching risk themes: {e}"}), 500


# Add Risk
@app.route("/api/risks", methods=["POST"])
@token_required
def save_risk():
    """Add a new Risk"""
    try:
        data = request.get_json()

        # Data validation (add more as needed)
        if not data.get("riskName"):
            return jsonify({"error": "Missing required fields"}), 400

        # Create a new risk document with auto-generated ID
        risk_ref = db.collection("Risks").document()
        risk_data = {
            "riskName": data.get("riskName"),
            "riskThemeID": data.get("riskThemeID"),
            "journeyID": data.get("journeyID"),  # Store the journeyName array
            "ettd": data.get("ettd"),
            "ettr": data.get("ettr"),
            "impact": data.get("impact"),
            "etbf": data.get("etbf"),
            "creationDate": datetime.now(),
            "badMinsData": data.get("badMinsData"),
        }
        risk_ref.set(risk_data)
        return (
            jsonify({"message": "Risk saved successfully", "riskId": risk_ref.id}),
            201,
        )

    except Exception as e:
        return jsonify({"error": f"Error saving risk: {e}"}), 500


# Update a risk
@app.route("/api/risks/<string:risk_id>", methods=["PUT"])
@token_required
def update_risk(risk_id):
    """Update a risk"""
    try:
        data = request.get_json()
        # Reference to the specific risk document
        risk_ref = db.collection("Risks").document(risk_id)
        # Check if the risk exists
        risk_doc = risk_ref.get()
        old_bad_mins = risk_doc.to_dict().get("badMinsData")
        new_bad_mins = data["badMinsData"]
        bad_min_delta = new_bad_mins - old_bad_mins

        if not risk_doc.exists:
            return jsonify({"error": "Risk not found"}), 404

        # Prepare update_data with fields that have changed
        update_data = {
            field: data[field] for field in data if field in risk_doc.to_dict()
        }

        # Update the risk document in Firestore
        risk_ref.update(update_data)

        if "badMinsData" in data:
            update_cujs_with_new_bad_mins(risk_doc, bad_min_delta, risk_id)

        return jsonify({"message": "Risk updated successfully"}), 200

    except Exception as e:
        app.logger.error("Error updating risk: %s", e)
        return jsonify({"error": f"Error updating risk: {e}"}), 500


def update_cujs_with_new_bad_mins(risk_doc, bad_min_delta, risk_id):
    """Helper function to update the 'accepted' fields in associated CUJs."""
    cuj_ids = risk_doc.to_dict().get("journeyID", [])
    for cuj_id in cuj_ids:
        cuj_data = {}
        new_accepted_bad_mins = []
        cuj_ref = db.collection("Critical User Journeys").document(cuj_id)
        cuj_doc = cuj_ref.get()
        if cuj_doc.exists:
            for i in range(3):
                accepted_risk_id_field = f"acceptedRisks{i}"
                accepted_bad_mins_field = f"accepted{i}"
                accepted_risk_ids = cuj_doc.to_dict().get(accepted_risk_id_field, [])
                old_accepted_bad_mins = cuj_doc.to_dict().get(
                    accepted_bad_mins_field, []
                )
                if risk_id in accepted_risk_ids:
                    new_bad_min = old_accepted_bad_mins + bad_min_delta
                    new_accepted_bad_mins.insert(i, new_bad_min)
                else:
                    new_accepted_bad_mins.insert(i, old_accepted_bad_mins)
        if new_accepted_bad_mins:
            for j, new_bad_min in enumerate(new_accepted_bad_mins):
                cuj_data[f"accepted{j}"] = new_bad_min
            cuj_ref.update(cuj_data)


# Delete a risk
@app.route("/api/risks/<string:risk_id>", methods=["DELETE"])  # Change method to DELETE
@token_required
def delete_risk(risk_id):
    """Delete a risk"""
    try:
        # Reference to the specific risk document
        risk_ref = db.collection("Risks").document(risk_id)

        # Check if the risk exists
        risk_doc = risk_ref.get()
        if not risk_doc.exists:
            return jsonify({"error": "Risk not found"}), 404

        # Get the journey IDs associated with this risk
        journey_ids = risk_doc.to_dict().get("journeyID", [])
        bad_mins = risk_doc.to_dict().get("badMinsData", [])
        # Remove risk mapping from all associated CUJs
        for cuj_id in journey_ids:
            remove_risk_from_cuj(cuj_id, risk_id, bad_mins)

        # Move the risk to the "Deleted Risks" collection
        deleted_risk_ref = db.collection("Deleted Risks").document(risk_id)
        deleted_risk_ref.set({"RiskId": risk_id, "DeletionDate": datetime.now()})

        return jsonify({"message": "Risk deleted successfully"}), 200

    except Exception as e:
        return jsonify({"error": f"Error deleting risk: {e}"}), 500


# View Risk Catalog (returns risks sorted by Bad Mins in descending order)
@app.route("/api/cujs/<string:cuj_id>/risks", methods=["GET"])
@token_required
def get_risks_for_cuj(cuj_id):
    """View Risk Catalog"""
    try:
        # Fetch all CUJs in one go
        cuj_ref = db.collection("Critical User Journeys")
        cuj_docs = cuj_ref.stream()
        cuj_map = {cuj_doc.id: cuj_doc.to_dict() for cuj_doc in cuj_docs}

        # Extract the list of RiskIDs
        risk_ids = cuj_map.get(cuj_id, {}).get("RiskIDs", [])
        if not risk_ids:
            return jsonify({"message": "No risks found for this CUJ"}), 200

        # Fetch risk documents using the RiskIDs
        risks_ref = db.collection("Risks")
        risk_docs = risks_ref.where(
            "__name__", "in", risk_ids
        ).stream()  # Batch query for efficiency

        # Fetch all risk themes in one go
        themes_ref = db.collection("Risk Themes")
        theme_docs = themes_ref.stream()
        theme_map = {
            theme_doc.id: theme_doc.to_dict()["ThemeName"] for theme_doc in theme_docs
        }

        # Fetch all CUJs in one go
        list_cujs_ref = db.collection("Critical User Journeys")
        list_cujs_docs = list_cujs_ref.stream()
        list_cujs_map = {
            list_cujs_doc.id: list_cujs_doc.to_dict()
            for list_cujs_doc in list_cujs_docs
        }

        # Convert to list and sort by badMinsData (descending)
        risk_list = []
        for risk_doc in risk_docs:
            risk_data = risk_doc.to_dict()
            risk_data["riskId"] = risk_doc.id

            # Replace RiskThemeIds with ThemeNames
            risk_theme_ids = risk_data.get("riskThemeID", [])
            risk_data["riskThemes"] = [
                {"riskThemeID": theme_id, "ThemeName": theme_map.get(theme_id)}
                for theme_id in risk_theme_ids
            ]
            del risk_data["riskThemeID"]

            # Replace journeyID with journey details
            journey_id = risk_data.get("journeyID", [])
            risk_data["journeyDetails"] = [
                {**list_cujs_map.get(cuj_id), "JourneyID": cuj_id}
                for cuj_id in journey_id
            ]
            del risk_data["journeyID"]

            risk_list.append(risk_data)

        # Extract the badMinsData value for each risk, then sort in descending order
        risk_list.sort(key=lambda risk: risk.get("badMinsData", 0), reverse=True)
        return jsonify(risk_list), 200

    except Exception as e:
        return jsonify({"error": f"Error fetching risks for CUJ: {e}"}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
