# Project Structure & Codebase Geography

This document maps out the high-level structure of the project repository to help you quickly find where specific logic and assets live.

## Root Directory Overview

*   `backend/`: Contains the Go (ADK) server implementation.
*   `frontend/`: Contains the React/Vite web application.
*   `infra/`: Contains Terraform definitions for deploying the application to Google Cloud.
*   `conductor/`: Contains the project's internal task management and design specifications.
*   `scripts/`: Contains utility scripts, such as `seed_data.sh` for local data population.
*   `data/`: Contains source files (e.g., PDFs) used to seed the Vertex AI Search data store.

---

## Backend Structure (`backend/`)

The Go backend follows a standard, clean architecture layout designed for scalability and testability.

*   `cmd/server/`: The entry point of the application. `main.go` wires up dependencies and starts the HTTP server.
*   `internal/`: Contains all private application code.
    *   **`domain/`**: Defines core business models, custom error types, and repository interfaces.
        *   **Key File:** `prompt.md` – The master system prompt governing the AI's behavior and personas.
    *   **`handler/`**: The HTTP transport layer. Maps JSON-RPC and REST requests to service logic.
        *   **Key File:** `mcp.go` – The Model Context Protocol implementation and tool registry (e.g., `get_account_balance`).
    *   **`service/`**: The business logic layer. Implements the domain interfaces and manages external API integrations.
        *   **Key File:** `scenario.go` – Manages the logic for dynamic banking scenarios and Firestore state.

> [!TIP]
> **Testing Convention:** Backend tests are **colocated** with the implementation (e.g., `bank_test.go` lives next to `bank.go`).

---

## Frontend Structure (`frontend/`)

The React frontend is a high-performance SPA built with Vite and strictly typed with TypeScript.

*   **`src/api/`**: Centralized API clients (Axios) for backend communication.
*   **`src/components/`**: Modular React components organized by feature.
    *   **Key File:** `GlobalModals.tsx` – Orchestrates dynamic UI overlays triggered by AI tools.
*   **`src/context/`**: React Context providers for global state management (e.g., `TelemetryContext`, `DemoConfigContext`).
*   **`src/hooks/`**: Custom React hooks for shared logic and hardware interaction.
    *   **Key Hook:** `useGeminiLive.ts` – Orchestrates the top-level Gemini session and state machine.
*   **`src/routes/`**: Type-safe routing managed by TanStack Router.
*   **`src/workers/`**: Off-main-thread processing logic.
    *   **Key File:** `networkWorker.ts` – Handles the Gemini WebSocket, audio encoding, and token telemetry.
    *   **Key File:** `recorderWorklet.ts` – Runs the RMS-based energy detection for instant barge-in filtering.

> [!TIP]
> **Testing Convention:** Frontend tests are colocated with their components using the `.test.tsx` or `.test.ts` extension.

---

## Infrastructure & Management

*   **`infra/`**: Terraform configuration for provisioning Cloud Run, Firestore, and Vertex AI Search. 
*   **`conductor/`**: Internal development management folder. It contains the project registry (`tracks.md`), implementation plans, and code style guides.