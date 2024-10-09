# SRE Risk Analysis Tool

This project is a tool designed to help SREs (Site Reliability Engineers) assess and manage risks associated with critical user journeys in their applications. It consists of a React frontend and a Flask backend that interacts with a Firestore database.

## Features

* **Application Management**
    * Add new applications.
    * List existing applications.

* **Critical User Journey (CUJ) Management**
    * Add new CUJs with details.
    * List CUJs for a selected application.
    * View and update CUJ details.

* **Risk Management**
    * Add new risks associated with CUJs.
    * Update existing risks.
    * Delete risks (soft delete).
    * View and analyze risks in a risk catalog.
    * Visualize and interact with risks in a risk stack rank matrix.


## Frontend (React)

* **Technology Stack:** React
* **Key Components:**
    * `App.js`: Main application component, handles routing and top-level state.
    * `UserJourneys.jsx`: Component for adding and managing CUJs.
    * `NewRisk.jsx`: Component for adding and updating risks.
    * `NewApplication.jsx`: Component for adding new applications.
    * `RiskCatalog.jsx`: Component to view, manage the risk catalog and interact with the risk stack rank matrix.
    * `DeleteRisk.jsx`: Component to handle risk deletion.

## Backend (Flask)

* **Technology Stack:** Flask, Firebase Admin SDK, Firestore, Flask-CORS.
* **Key Endpoints:**
    * `/api/apps` (POST, GET): Manages applications.
    * `/api/<app_id>/cujs` (GET): Lists CUJs for a specific application.
    * `/api/cujs` (POST): Creates a new CUJ.
    * `/api/cujs/<cuj_id>` (GET, PUT): Gets/updates CUJ details.
    * `/api/cujs/<cuj_id>/remove_risk/<risk_id>` (PUT): Removes a risk from a CUJ.
    * `/api/riskThemes` (POST, GET): Manages risk themes
    * `/api/risks` (POST): Creates a new risk.
    * `/api/risks/<risk_id>` (PUT, DELETE): Updates/deletes a risk.
    * `/api/cujs/<cuj_id>/risks` (GET): Retrieves risks for a specific CUJ.

## Setup

### Prerequisites

* **Node.js and npm:** Install Node.js and npm 
* **Python 3.x:** Make sure you have Python 3 installed. 
* **Firebase Project:** Create a Firebase project and set up a Firestore database.
