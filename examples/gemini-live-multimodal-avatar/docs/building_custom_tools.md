# Building Custom Backend Tools (MCP)

This guide details how engineers can extend the AI's capabilities by building and registering custom tools using the Model Context Protocol (MCP).

## 1. The Architecture (Why MCP?)

The Cymbal Bank application relies on a decoupled architecture where the React frontend handles the WebSocket connection to Google Vertex AI, but all actual business logic and tool execution happens securely on the Go backend.

To achieve this safely, we implement a subset of the **Model Context Protocol (JSON-RPC 2.0)**. 
- When the AI decides to use a tool, it sends a JSON payload to the frontend.
- The frontend proxies this payload to our backend via the `/api/mcp` or `/api/tools/execute` endpoints.
- The Go backend verifies the request, executes the actual code (e.g., querying a database or an external API), and returns the result.

This means **no business logic or API keys are ever exposed to the browser**, and tools can be written entirely in Go.

---

## 2. Step-by-Step Implementation Guide

To add a new capability (e.g., `freeze_credit_card`), follow these four steps.

### Step 1: The Service Layer (The Business Logic)
First, implement the core functionality in your service layer (e.g., `backend/internal/service/bank.go`).

```go
// In BankService interface
FreezeCreditCard(ctx context.Context, accountID domain.AccountID, cardNumber string, sessionID string) error

// Implementation
func (s *bankServiceImpl) FreezeCreditCard(ctx context.Context, accountID domain.AccountID, cardNumber string, sessionID string) error {
    if cardNumber == "" {
        return errors.New("card number cannot be empty")
    }
    // TODO: Actually call the mainframe to freeze the card scoped to the sessionID.
    slog.Info("Successfully froze credit card", slog.String("card", cardNumber))
    return nil
}
```

### Step 2: The MCP Schema Definition (Teaching the AI)
You must define the tool's JSON schema so Vertex AI knows exactly what parameters to extract from the user's speech.
Open `backend/internal/handler/mcp.go` and add your tool to the `handleMCPToolsList` function.

**CRITICAL:** Always begin your tool description with `SILENT EXECUTION.` to prevent the AI from talking over the tool execution.

```go
{
    Name:        "freeze_credit_card",
    Description: "SILENT EXECUTION. Freeze a user's credit card if it is lost or stolen.",
    InputSchema: map[string]interface{}{
        "type": "object",
        "properties": map[string]interface{}{
            "account_id":  map[string]interface{}{"type": "string"},
            "card_number": map[string]interface{}{"type": "string", "description": "The last 4 digits of the card to freeze."},
            "session_id":  map[string]interface{}{"type": "string", "description": "The current session ID."},
        },
        "required": []string{"account_id", "card_number"},
    },
},
```

### Step 3: The Routing Logic (Executing the Tool)
Next, map the incoming JSON-RPC request to your new Go function. 
In `mcp.go`, update the `switch toolName` block inside the private `executeTool` method:

```go
case "freeze_credit_card":
    err = m.handleFreezeCreditCard(ctx, arguments)
    if err == nil {
        result = map[string]string{"status": "success", "message": "Card frozen securely."}
    }
```

Then, implement the handler method to parse the raw arguments. 

**PRO TIP:** Gemini sometimes passes numeric values as strings (e.g., `"1234"` instead of `1234`). Always use a type switch to handle both `float64` and `string` for numeric parameters to prevent silent tool failures.

```go
func (m *MCPServer) handleFreezeCreditCard(ctx context.Context, args map[string]interface{}) error {
    accountIDStr, ok := args["account_id"].(string)
    if !ok {
        return domain.ErrInvalidArguments("account_id must be a string")
    }
    
    cardNumberStr, ok := args["card_number"].(string)
    if !ok {
        return domain.ErrInvalidArguments("card_number must be a string")
    }

    sessionID := getStringArg(args, "session_id")

    return m.svc.FreezeCreditCard(ctx, domain.AccountID(accountIDStr), cardNumberStr, sessionID)
}
```

*Note: If your tool fails (returns an error), the MCP handler will automatically format an error response, and the AI will apologize to the user and explain that the system is down.*

### Step 4: The Prompt Injection (The Trigger)
Finally, tell the AI *when* it should use this tool. 
Open the core template `backend/internal/domain/prompt.md` and add your trigger condition inside the `{{range .AllowedTools}}` block:

```go
{{if eq . "freeze_credit_card"}}- Credit Cards: When a user reports a lost wallet or compromised card, UNMISTAKABLY trigger freeze_credit_card. Ask for the last 4 digits first if you don't have them.{{end}}
```

---

## 3. The "Conversational RAG" Pattern

Because this is a real-time voice application, latency and audio collision are major concerns. If the AI says "Let me look that up for you..." while simultaneously triggering a tool that takes 3 seconds, the resulting audio will overlap awkwardly or cause the avatar to freeze.

**Best Practices for Smooth Execution:**

1.  **The UNMISTAKABLY Rule**: In `prompt.md`, always use the phrasing `"UNMISTAKABLY trigger [tool_name]"`. This explicitly forbids the LLM from outputting conversational filler text *before* the JSON payload, ensuring the tool starts as fast as possible.
2.  **Explicit System Instructions**: Instruct the model to "remain silent while the tool executes" within the system prompt itself.
3.  **Conversational Summarization (Default Scheduling)**: 
    - *Note:* We intentionally **avoid** the SDK `FunctionResponseScheduling.SILENT` flag. 
    - *Why?* While `SILENT` prevents the model from speaking *before* a tool, it can also prevent it from generating a spoken response *after* the tool finishes. Since we rely on the model to read complex data (like Vertex AI Search results) and speak a helpful summary back to the user, we must allow it to speak by using the default scheduling.
4.  **Anti-Recursion**: The system prompt contains strict rules forcing the AI to wait for the tool's JSON response before speaking its final answer. Do not modify the `<ANTI_RECURSION_RULES>` block in `prompt.md`.

---

## 4. Session Isolation & Demo Security

A common concern during client demos is: *"What if two people use the demo at once? Will their bank balances get mixed up?"*

The answer is **No**, thanks to our **Cryptographic Session Isolation**:

1.  **Unique UUIDs:** Every browser tab generates a mathematically unique `session_id` upon launch.
2.  **Strict Argument Injection:** In the `useGeminiLive` hook, the frontend **intercepts every tool call** coming from Gemini. It then explicitly injects the `session_id` into the tool's arguments before sending it to the Go backend.
3.  **Backend Enforcement:** The Go MCP handlers *require* a `session_id`. All Firestore queries and memory operations are scoped strictly to this ID.
4.  **Security Result:** This creates a virtual "sandbox" for every user. Even if a hundred clients are testing the demo simultaneously on the same backend, their data and conversational states remain perfectly isolated.

---

## 5. Enabling the Tool for a Demo

Once an engineer has completed steps 1-4, the tool is permanently available to the backend infrastructure. 

To actually enable it for a live demo, a Customer Engineer simply opens the relevant scenario JSON file (e.g., `backend/data/scenarios/retail-advisor.json`) and adds the string `"freeze_credit_card"` to the `allowed_tools` array. 

The Go backend will dynamically inject the prompt instructions and schema definitions on the fly!