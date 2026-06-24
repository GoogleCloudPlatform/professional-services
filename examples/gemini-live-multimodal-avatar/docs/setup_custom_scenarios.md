# Scenario Architecture & Custom Model Context Protocol (MCP) Tools

## Executive Summary & Design Philosophy

The application features a data-driven scenario customization engine designed to support multiple concurrent, isolated client sessions. The platform decouples the advisor's guardrails, banking portfolios, and active tools from hardcoded logic, managing them as dynamic **Scenario Configurations**.

Our design enforces strict security and development convenience through two core mechanisms:
1.  **Gated Model Context Protocol (MCP) Sandboxing:** LLM tools are not globally exposed. The system filters and blocks tool executions dynamically based on the active scenario's whitelist configurations.
2.  **Dynamic Local Integration Overlays:** During development, the Go backend dynamically merges local scenario configurations directly over Firestore database records, allowing developers to add and edit advisors instantly with zero database operations.

---

## 1. Persona Sandboxing & Storage Architecture

Every conversational exchange is anchored within a specific user session. Concurrency isolation is managed through a multi-tiered repository layer:

```
                  ┌────────────────────────────────────────┐
                  │       Firestore 'base_scenarios'       │
                  │       (Global Master Templates)        │
                  └───────────────────┬────────────────────┘
                                      │
                                      ▼ (Loaded into Memory Cache)
┌──────────────────┐      ┌────────────────────────┐
│  React Client    │      │   Go Scenario Service  │
│  (session_id)   │◄────►│   (Cache + Local JSON) │
└────────┬─────────┘      └────────────────────────┘
         │                            ▲
         ▼                            │ Overlays
┌─────────────────────────────────────┴────────────────────┐
│         Firestore Ephemeral 'custom_scenarios'           │
│         - Scoped to unique Session UUID                  │
│         - Automatic 24h TTL Document Expiration          │
└──────────────────────────────────────────────────────────┘
```

*   **Base Scenarios:** Master templates stored in the Firestore `base_scenarios` collection. These define default configurations (e.g., CRE Lending, Strategic Treasury).
*   **Custom (Ephemeral) Sessions:** When a user modifies a scenario's guardrails or parameters in the UI, the frontend clones the template, stamps it with a unique browser-tab cryptographic UUID (`session_id`), and writes it to the `custom_scenarios` Firestore collection.
*   **Memory Caching & Resiliency Fallbacks:** To optimize lookup speeds, base scenarios are held in a high-efficiency server-side cache. If Firestore suffers from network anomalies or is unseeded, the system automatically falls back to local JSON profiles, ensuring continuous operations.
*   **Auto-Cleanup TTL:** User-customized scenario records are marked with an `expiresAt` timestamp, triggering Firestore's native Time-To-Live (TTL) engine to automatically prune custom documents after 24 hours.

---

## 2. Dynamic Local Integration Overlay

To eliminate development overhead, the Go backend implements a **Local Directory Overlay** pattern in `backend/internal/service/scenario.go`:

```go
// Dynamic Local Integration Overlay
if !s.disableLocalOverlay {
    localScenarios, localErr := s.loadLocalScenarios()
    if localErr == nil {
        for id, sc := range localScenarios {
            newCache[id] = sc
            slog.Info("Successfully overlayed local scenario config into active cache", slog.String("id", id))
        }
    }
}
```

At startup or cache expiry, the Go service:
1.  Fetches base scenarios from the cloud Firestore instance.
2.  Inspects local development directories (e.g., `data/scenarios/*.json`).
3.  Loads local JSON configs and **overlays** them directly on top of the in-memory cache, overriding database records.
4.  This allows developers to create, update, or tweak advisor assets on-the-fly simply by editing local JSON files—changes reflect instantly without database re-seeding.

### 2.1 The Scenario Configuration Schema

Every scenario profile (JSON or Firestore document) must conform to the Go `domain.Scenario` schema:

```json
{
  "id": "cre-advisor",
  "name": "Commercial Real Estate Advisor",
  "allowed_tools": [
    "get_account_balance",
    "get_recent_transactions",
    "initiate_transfer",
    "schedule_appointment",
    "show_appointment_slots"
  ],
  "persona": {
    "role": "MUI Commercial Real Estate Loan Officer",
    "target_audience": "Mid-market commercial property developers seeking capital.",
    "guardrails": "Do not provide specific interest rate guarantees. Keep conversation professional.",
    "client_profile": {
      "name": "Sarah Jenkins",
      "company_name": "Jenkins Developments LLC",
      "role": "CEO"
    }
  },
  "accounts": [
    {
      "id": "ACCT-CRE-101",
      "type": "Operating Account",
      "balance": {"amount": 250000.50, "currency": "USD"}
    }
  ]
}
```

---

## 3. Model Context Protocol (MCP) Sandbox Governance

To guarantee security and enforce scenario constraints, LLM tool execution is subject to strict server-side sandboxing inside `backend/internal/handler/mcp.go`.

### 3.1 Whitelist Squelching (`tools/list`)
When Gemini queries the local MCP endpoint for available tools via `tools/list`, the request includes the active advisor's `persona` parameter in the query context. The Go server:
1.  Loads the active scenario configuration.
2.  Inspects the `allowed_tools` array.
3.  Filters out any backend tools not explicitly declared in the scenario's whitelist.
4.  Gemini only "sees" and receives schema definitions for the permitted tools.

### 3.2 Server-Side Execution Guardrails (`tools/call`)
Even if the model attempts to synthesize and invoke an unlisted tool, the Go execution block enforces a secondary defensive check in `executeTool`:

```go
// Check if tool is allowed for this scenario
if errScen == nil && len(scen.AllowedTools) > 0 {
    allowed := false
    for _, t := range scen.AllowedTools {
        if t == toolName {
            allowed = true
            break
        }
    }
    if !allowed {
        slog.Warn("Tool execution blocked by scenario config", slog.String("tool", toolName))
        return nil, domain.ErrInvalidArguments(fmt.Sprintf("tool not allowed by scenario: %s", toolName))
    }
}
```
If unauthorized, the server rejects the request with an RPC error, protecting downstream services from unauthorized actions.

---

## 4. Prompt Engineering & Multilingual Handshakes

At session initialization, the system constructs a highly structured, unified prompt using the template in `backend/internal/domain/prompt.md`.

*   **Dynamic Role Ingestion:** The persona role, client profiles, and guardrails from the scenario are compiled and injected directly into the Gemini system instructions.
*   **Dynamic Language Overrides:** When users toggle languages in the UI, the frontend requests a fresh config from `/api/config?lang=English,Spanish`. The backend parses this, constructs strict bilingual instruction templates, and forces a WebRTC/WebSocket reconnect. This anchors Gemini's language scope, allowing natural, real-time code-switching between selected tongues while strictly preventing self-translation echoes.

---

## 5. Developer Cookbook: Creating a Custom Persona and Tool

Follow this end-to-end recipe to add a custom advisor and a backend operational tool:

### Step 1: Author a New Local JSON Scenario
Create `backend/data/scenarios/wealth-advisor.json`:
```json
{
  "id": "wealth-advisor",
  "name": "Wealth Advisor",
  "allowed_tools": ["get_customer_profile", "execute_investment_buy"],
  "persona": {
    "role": "Private Wealth Advisor specializing in active equity portfolios",
    "target_audience": "High Net-Worth individuals.",
    "guardrails": "Always state that past performance is not indicative of future returns.",
    "client_profile": {
      "name": "Richard Sterling",
      "company_name": "Sterling Capital",
      "role": "Principal"
    }
  }
}
```

### Step 2: Register the Tool Schema inside Go MCP Handler
Open `backend/internal/handler/mcp.go`. Inside `handleMCPToolsList`, append your new tool's JSON schema definition to the `tools` collection:
```go
{
    Name:        "execute_investment_buy",
    Description: "SILENT EXECUTION. Executes an equity trade buy action on behalf of the client.",
    InputSchema: map[string]interface{}{
        "type": "object",
        "properties": map[string]interface{}{
            "ticker":      map[string]interface{}{"type": "string", "description": "The stock ticker (e.g., 'GOOG')."},
            "share_count": map[string]interface{}{"type": "number", "description": "The volume of shares to purchase."},
            "session_id":  map[string]interface{}{"type": "string"},
        },
        "required": []string{"ticker", "share_count"},
    },
}
```

### Step 3: Implement Tool Execution Logic
Scroll down to `executeTool` in `backend/internal/handler/mcp.go` and add your dispatch router case:
```go
case "execute_investment_buy":
    ticker, _ := arguments["ticker"].(string)
    shares, _ := arguments["share_count"].(float64)
    sessionID, _ := arguments["session_id"].(string)
    
    // Call downstream business ledger/services
    return m.svc.ExecuteTrade(ctx, sessionID, ticker, int(shares))
```

### Step 4: Map Client-Side Transitions & Compile
1.  Open the frontend and register your visual transition state (such as showing an investment confirmation modal) inside `useMCPExecution.ts` or `GlobalModals.tsx`.
2.  Run the tests to verify compilation and routing:
    ```bash
    cd frontend && npm run test
    cd ../backend && go test ./...
    ```
3.  Launch `make dev` and select **Wealth Advisor** from the dropdown menu to test your new persona and tool.
