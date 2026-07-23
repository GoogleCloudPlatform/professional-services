// Copyright 2026 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package handler

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"strconv"
	"time"

	"live-api-rewrite-backend/internal/domain"
	"live-api-rewrite-backend/internal/service"
)

type MCPServer struct {
	svc         service.BankService
	scenarioSvc service.ScenarioService
	searchSvc   domain.DocumentSearcher
}

func NewMCPServer(svc service.BankService, scenarioSvc service.ScenarioService, searchSvc domain.DocumentSearcher) *MCPServer {
	return &MCPServer{
		svc:         svc,
		scenarioSvc: scenarioSvc,
		searchSvc:   searchSvc,
	}
}

type contextKey string

const personaContextKey contextKey = "persona"

// HandleMCP handles the incoming JSON-RPC 2.0 requests for the Model Context Protocol (MCP).
func (m *MCPServer) HandleMCP(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	personaID := req.URL.Query().Get("persona")
	if personaID == "" {
		personaID = "cre-advisor" // Default
	}
	ctx := context.WithValue(req.Context(), personaContextKey, personaID)
	req = req.WithContext(ctx)

	var rpcReq domain.JSONRPCRequest
	if err := json.NewDecoder(req.Body).Decode(&rpcReq); err != nil {
		slog.Error("Failed to decode JSON-RPC request", slog.String("error", err.Error()))
		sendRPCError(w, nil, -32700, "Parse error")
		return
	}

	if rpcReq.JSONRPC != "2.0" {
		sendRPCError(w, rpcReq.ID, -32600, "Invalid Request: unsupported JSON-RPC version")
		return
	}

	ctx = req.Context()

	switch rpcReq.Method {
	case "tools/list":
		m.handleMCPToolsList(ctx, w, &rpcReq)
	case "tools/call":
		m.handleMCPToolsCall(ctx, w, &rpcReq)
	default:
		sendRPCError(w, rpcReq.ID, -32601, "Method not found")
	}
}

func (m *MCPServer) handleMCPToolsList(ctx context.Context, w http.ResponseWriter, req *domain.JSONRPCRequest) {
	// Define the tools available
	tools := []domain.MCPTool{
		{
			Name:        "get_account_balance",
			Description: "SILENT EXECUTION. Get the balance of a bank account. If account_id is not provided, returns balances for all accounts.",
			InputSchema: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"account_id": map[string]interface{}{"type": "string"},
					"session_id": map[string]interface{}{"type": "string"},
				},
			},
		},
		{
			Name:        "get_recent_transactions",
			Description: "SILENT EXECUTION. Get recent transactions for an account",
			InputSchema: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"account_id": map[string]interface{}{"type": "string"},
					"limit":      map[string]interface{}{"type": "number"},
					"session_id": map[string]interface{}{"type": "string"},
				},
				"required": []string{"account_id"},
			},
		},
		{
			Name:        "initiate_transfer",
			Description: "SILENT EXECUTION. Initiate a fund transfer between accounts",
			InputSchema: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"from_account": map[string]interface{}{"type": "string"},
					"to_account":   map[string]interface{}{"type": "string"},
					"amount":       map[string]interface{}{"type": "number"},
					"session_id":   map[string]interface{}{"type": "string"},
				},
				"required": []string{"from_account", "to_account", "amount"},
			},
		},
		{
			Name:        "vertex_ai_search",
			Description: "SILENT EXECUTION. Search for information in the company's knowledge base using Vertex AI Search",
			InputSchema: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"query": map[string]interface{}{
						"type":        "string",
						"description": "The search query to find relevant information",
					},
				},
				"required": []string{"query"},
			},
		},
		{
			Name:        "send_email",
			Description: "SILENT EXECUTION. UNMISTAKABLY trigger this when the user asks to send an email or receive documents via email.",
			InputSchema: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"recipient": map[string]interface{}{"type": "string", "description": "The email address of the recipient."},
					"subject":   map[string]interface{}{"type": "string", "description": "The subject line of the email."},
					"body":      map[string]interface{}{"type": "string", "description": "The content of the email."},
				},
				"required": []string{"recipient", "subject", "body"},
			},
		},
		{
			Name:        "schedule_appointment",
			Description: "SILENT EXECUTION. UNMISTAKABLY trigger this when the user wants to schedule an in-person meeting.",
			InputSchema: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"time":     map[string]interface{}{"type": "string", "description": "The date and time for the meeting (e.g., 'Thursday at 10 AM')."},
					"location": map[string]interface{}{"type": "string", "description": "The specific real estate location or neighborhood discussed in the conversation."},
					"topic":    map[string]interface{}{"type": "string", "description": "The primary purpose of the meeting."},
				},
				"required": []string{"time", "location", "topic"},
			},
		},
		{
			Name:        "show_appointment_slots",
			Description: "SILENT EXECUTION. Display the available appointment slots on the user's screen so they can pick one.",
			InputSchema: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"location":   map[string]interface{}{"type": "string", "description": "The inferred location for the meeting, if mentioned."},
					"topic":      map[string]interface{}{"type": "string", "description": "The inferred topic of the meeting, if mentioned."},
					"session_id": map[string]interface{}{"type": "string"},
				},
			},
		},
		{
			Name:        "get_market_insights_api",
			Description: "SILENT EXECUTION. Queries the bank's internal Research & Strategy API to retrieve structured macroeconomic metrics, historical time-series data, and market indices (e.g., Oil trends, FX rates, or demand forecasts).",
			InputSchema: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"query": map[string]interface{}{
						"type":        "string",
						"description": "The specific market metric or instrument to retrieve (e.g., 'Brent Crude Historical', 'EUR/USD Spot Trend').",
					},
				},
				"required": []string{"query"},
			},
		},
		{
			Name:        "list_advisors",
			Description: "SILENT EXECUTION. List available advisor scenarios.",
			InputSchema: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"session_id": map[string]interface{}{"type": "string", "description": "The current session ID to fetch custom scenarios."},
				},
			},
		},
		{
			Name:        "get_advisor",
			Description: "SILENT EXECUTION. Get the content of a specific advisor scenario.",
			InputSchema: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"id":         map[string]interface{}{"type": "string", "description": "The ID of the advisor scenario."},
					"session_id": map[string]interface{}{"type": "string", "description": "The current session ID."},
				},
				"required": []string{"id"},
			},
		},
		{
			Name:        "get_customer_profile",
			Description: "SILENT EXECUTION. Retrieve the full customer profile including address and employer.",
			InputSchema: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"session_id": map[string]interface{}{"type": "string"},
				},
			},
		},
		{
			Name:        "get_branch_details",
			Description: "SILENT EXECUTION. Retrieve details for a specific branch including address and services.",
			InputSchema: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"branch_id": map[string]interface{}{"type": "string", "description": "The unique ID of the branch (e.g., 'BR-1529')."},
				},
				"required": []string{"branch_id"},
			},
		},
		{
			Name:        "send_document_to_app",
			Description: "SILENT EXECUTION. UNMISTAKABLY trigger this when the user asks for an infographic or a document to be sent to their mobile app.",
			InputSchema: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"document_type": map[string]interface{}{"type": "string", "description": "The type of document (e.g., 'tax_form')."},
					"session_id":    map[string]interface{}{"type": "string"},
				},
				"required": []string{"document_type"},
			},
		},
		{
			Name:        "update_advisor",
			Description: "SILENT EXECUTION. Update the content of a specific advisor scenario.",
			InputSchema: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"id":         map[string]interface{}{"type": "string", "description": "The ID of the advisor scenario."},
					"content":    map[string]interface{}{"type": "object", "description": "The new content for the scenario."},
					"session_id": map[string]interface{}{"type": "string", "description": "The current session ID for ephemeral fork."},
				},
				"required": []string{"id", "content"},
			},
		},
	}

	personaID, _ := ctx.Value(personaContextKey).(string)
	scen, err := m.scenarioSvc.GetScenario(ctx, personaID, "")
	if err == nil && len(scen.AllowedTools) > 0 {
		allowedMap := make(map[string]bool)
		for _, name := range scen.AllowedTools {
			allowedMap[name] = true
		}

		var filteredTools []domain.MCPTool
		for _, t := range tools {
			if allowedMap[t.Name] {
				filteredTools = append(filteredTools, t)
			}
		}
		tools = filteredTools
	}

	result := domain.ToolListResult{Tools: tools}
	sendRPCResponse(w, req.ID, result)
}

func (m *MCPServer) handleMCPToolsCall(ctx context.Context, w http.ResponseWriter, req *domain.JSONRPCRequest) {
	var params domain.ToolCallParams
	if len(req.Params) > 0 {
		if err := json.Unmarshal(req.Params, &params); err != nil {
			slog.Error("Failed to unmarshal tools/call params", slog.String("error", err.Error()))
			sendRPCError(w, req.ID, -32602, "Invalid params")
			return
		}
	} else {
		sendRPCError(w, req.ID, -32602, "Invalid params: missing params object")
		return
	}

	result, err := m.executeTool(ctx, params.Name, params.Arguments)
	if err != nil {
		// Logged in executeTool
		sendRPCToolCallResult(w, req.ID, "", err.Error(), true)
		return
	}

	resultJSON, _ := json.Marshal(result)
	sendRPCToolCallResult(w, req.ID, string(resultJSON), "", false)
}

func (m *MCPServer) HandleExecuteTool(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	personaID := req.URL.Query().Get("persona")
	if personaID == "" {
		personaID = "cre-advisor" // Default
	}
	ctx := context.WithValue(req.Context(), personaContextKey, personaID)
	req = req.WithContext(ctx)

	var toolReq domain.ToolRequest
	if err := json.NewDecoder(req.Body).Decode(&toolReq); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	result, err := m.executeTool(req.Context(), toolReq.ToolName, toolReq.Arguments)
	if err != nil {
		// Error logged in executeTool
		status := http.StatusInternalServerError
		var invalidArgsErr *domain.InvalidArgumentsError
		if errors.Is(err, domain.ErrUnknownTool) || errors.As(err, &invalidArgsErr) {
			status = http.StatusBadRequest
		}
		respondWithError(w, status, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, domain.ToolResponse{Result: result})
}

func (m *MCPServer) executeTool(ctx context.Context, toolName string, arguments map[string]interface{}) (interface{}, error) {
	personaID, _ := ctx.Value(personaContextKey).(string)
	scen, errScen := m.scenarioSvc.GetScenario(ctx, personaID, "")

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
			slog.Warn("Tool execution blocked by scenario config", slog.String("tool", toolName), slog.String("persona", personaID))
			return nil, domain.ErrInvalidArguments(fmt.Sprintf("tool not allowed by scenario: %s", toolName))
		}
	}

	start := time.Now()
	var result interface{}
	var err error

	switch toolName {
	case "get_account_balance":
		result, err = m.handleGetAccountBalance(ctx, arguments)
	case "get_recent_transactions":
		result, err = m.handleGetRecentTransactions(ctx, arguments)
	case "initiate_transfer":
		err = m.handleInitiateTransfer(ctx, arguments)
		if err == nil {
			result = map[string]interface{}{
				"title":   "Transfer Successful",
				"message": "Funds have been successfully transferred.",
				"details": map[string]string{
					"from_account": arguments["from_account"].(string),
					"to_account":   arguments["to_account"].(string),
				},
			}
		}
	case "vertex_ai_search":
		result, err = m.handleVertexAISearch(ctx, arguments)
	case "send_email":
		result, err = m.handleSendEmail(ctx, arguments)
	case "schedule_appointment":
		result, err = m.handleScheduleAppointment(ctx, arguments)
	case "show_appointment_slots":
		sessionID := getStringArg(arguments, "session_id")
		personaID, _ := ctx.Value(personaContextKey).(string)
		scen, scenErr := m.scenarioSvc.GetScenario(ctx, personaID, sessionID)

		location := getStringArg(arguments, "location")
		topic := getStringArg(arguments, "topic")

		if location == "" {
			if scenErr == nil && len(scen.Properties) > 0 {
				location = "Site Visit: " + scen.Properties[0].Address
			} else {
				location = "Primary Branch"
			}
		}

		if topic == "" {
			if scenErr == nil && scen.Persona.ClientProfile.CompanyName != "" {
				topic = "Portfolio Review for " + scen.Persona.ClientProfile.CompanyName
			} else {
				topic = "Portfolio Review"
			}
		}

		if scenErr != nil {
			result = map[string]interface{}{"slots": []string{}, "status": "No slots available", "location": location, "topic": topic}
		} else {
			result = map[string]interface{}{"slots": scen.AvailableAppointments, "status": "OK", "location": location, "topic": topic}
		}
	case "get_market_insights_api":
		result, err = m.handleGetMarketInsights(ctx, arguments)
	case "list_advisors":
		result, err = m.handleListAdvisors(ctx, arguments)
	case "get_branch_details":
		result, err = m.handleGetBranchDetails(ctx, arguments)
	case "get_customer_profile":
		result, err = m.handleGetCustomerProfile(ctx, arguments)
	case "send_document_to_app":
		result, err = m.handleSendDocumentToApp(ctx, arguments)
	case "get_advisor":
		result, err = m.handleGetAdvisor(ctx, arguments)
	case "update_advisor":
		err = m.handleUpdateAdvisor(ctx, arguments)
		if err == nil {
			result = map[string]string{"status": "success"}
		}
	default:
		slog.Warn("Unknown tool requested", slog.String("tool_name", toolName))
		return nil, domain.ErrUnknownTool
	}

	duration := time.Since(start)
	if err != nil {
		argsJSON, _ := json.Marshal(arguments)
		slog.Error("Tool execution failed",
			slog.String("tool", toolName),
			slog.String("persona", personaID),
			slog.Duration("duration", duration),
			slog.String("arguments", string(argsJSON)),
			slog.String("error", err.Error()))
		return nil, err
	}

	slog.Info("Tool executed successfully",
		slog.String("tool", toolName),
		slog.String("persona", personaID),
		slog.Duration("duration", duration))

	return result, nil
}

func (m *MCPServer) handleVertexAISearch(ctx context.Context, args map[string]interface{}) (interface{}, error) {
	query, ok := args["query"].(string)
	if !ok {
		return nil, domain.ErrInvalidArguments("query must be a string")
	}

	return m.searchSvc.Search(ctx, query)
}

func (m *MCPServer) handleGetAccountBalance(ctx context.Context, args map[string]interface{}) (interface{}, error) {
	accountIDStr := getStringArg(args, "account_id")
	sessionID := getStringArg(args, "session_id")

	// If no specific account is requested, return all account balances
	if accountIDStr == "" {
		personaID, _ := ctx.Value(personaContextKey).(string)
		scen, err := m.scenarioSvc.GetScenario(ctx, personaID, sessionID)
		if err != nil {
			return nil, err
		}
		var balances []map[string]interface{}
		for _, acc := range scen.Accounts {
			balances = append(balances, map[string]interface{}{
				"account_number": acc.ID,
				"account_type":   acc.Type,
				"balance":        acc.Balance.Amount,
				"currency":       acc.Balance.Currency,
			})
		}
		return balances, nil
	}

	acc, err := m.scenarioSvc.GetAccount(ctx, domain.AccountID(accountIDStr), sessionID)
	if err != nil {
		return nil, err
	}
	return map[string]interface{}{
		"account_number": accountIDStr,
		"account_type":   acc.Type,
		"balance":        acc.Balance.Amount,
		"currency":       acc.Balance.Currency,
	}, nil
}

func (m *MCPServer) handleGetRecentTransactions(ctx context.Context, args map[string]interface{}) (interface{}, error) {
	accountIDStr := getStringArg(args, "account_id")
	sessionID := getStringArg(args, "session_id")

	var limit int = 10
	if limitFloat, ok := args["limit"].(float64); ok {
		limit = int(limitFloat)
	}

	var txs []domain.Transaction
	var err error

	// If no specific account is requested, get transactions from all accounts
	if accountIDStr == "" {
		personaID, _ := ctx.Value(personaContextKey).(string)
		scen, errScen := m.scenarioSvc.GetScenario(ctx, personaID, sessionID)
		if errScen != nil {
			return nil, errScen
		}
		txs = scen.Transactions
		if len(txs) > limit {
			txs = txs[:limit]
		}
	} else {
		txs, err = m.svc.GetRecentTransactions(ctx, domain.AccountID(accountIDStr), sessionID, limit)
		if err != nil {
			return nil, err
		}
	}

	// Map to what the frontend RecentTransactionsModal expects
	mappedTxs := make([]map[string]interface{}, 0)
	for _, tx := range txs {
		mappedTxs = append(mappedTxs, map[string]interface{}{
			"id":             tx.ID,
			"account_number": tx.AccountID,
			"date":           tx.Date,
			"description":    tx.Type,
			"amount":         tx.Amount,
			"currency":       tx.Currency,
		})
	}

	return mappedTxs, nil
}

func (m *MCPServer) handleInitiateTransfer(ctx context.Context, args map[string]interface{}) error {
	fromAccount, ok := args["from_account"].(string)
	if !ok {
		return domain.ErrInvalidArguments("from_account must be a string")
	}

	toAccount, ok := args["to_account"].(string)
	if !ok {
		return domain.ErrInvalidArguments("to_account must be a string")
	}

	var amountFloat float64
	switch v := args["amount"].(type) {
	case float64:
		amountFloat = v
	case string:
		var err error
		if amountFloat, err = strconv.ParseFloat(v, 64); err != nil {
			return domain.ErrInvalidArguments("amount must be a valid number")
		}
	default:
		return domain.ErrInvalidArguments("amount must be a number")
	}

	sessionID := getStringArg(args, "session_id")

	return m.svc.InitiateTransfer(ctx, domain.AccountID(fromAccount), domain.AccountID(toAccount), sessionID, int64(amountFloat))
}

func (m *MCPServer) handleSendEmail(ctx context.Context, args map[string]interface{}) (interface{}, error) {
	recipient := getStringArg(args, "recipient")
	subject := getStringArg(args, "subject")

	return map[string]interface{}{
		"title":   "Email Sent",
		"message": "Email sent successfully",
		"details": map[string]string{
			"recipient": recipient,
			"subject":   subject,
		},
	}, nil
}

func (m *MCPServer) handleScheduleAppointment(ctx context.Context, args map[string]interface{}) (interface{}, error) {
	timeStr := getStringArg(args, "time")
	location := getStringArg(args, "location")
	topic := getStringArg(args, "topic")
	sessionID := getStringArg(args, "session_id")

	advisorName := "Wealth Advisor"
	personaID, _ := ctx.Value(personaContextKey).(string)
	if scen, err := m.scenarioSvc.GetScenario(ctx, personaID, sessionID); err == nil && scen.Name != "" {
		advisorName = scen.Name
	}

	return map[string]string{
		"title":    "Appointment Confirmed",
		"status":   "success",
		"message":  "Appointment scheduled",
		"date":     timeStr, // AI passes the full string (e.g. "Monday, January 2, 2026 at 10:00 AM")
		"location": location,
		"topic":    topic,
		"advisor":  advisorName,
	}, nil
}

func sendRPCToolCallResult(w http.ResponseWriter, id interface{}, textResult string, errorMsg string, isError bool) {
	content := []domain.MCPContent{}
	if isError {
		content = append(content, domain.MCPContent{Type: "text", Text: "Error: " + errorMsg})
	} else {
		content = append(content, domain.MCPContent{Type: "text", Text: textResult})
	}

	toolResult := domain.ToolCallResult{
		Content: content,
		IsError: isError,
	}

	sendRPCResponse(w, id, toolResult)
}

func sendRPCResponse(w http.ResponseWriter, id interface{}, result interface{}) {
	resp := domain.JSONRPCResponse{
		JSONRPC: "2.0",
		ID:      id,
		Result:  result,
	}
	respondWithJSON(w, http.StatusOK, resp)
}

func sendRPCError(w http.ResponseWriter, id interface{}, code int, message string) {
	resp := domain.JSONRPCResponse{
		JSONRPC: "2.0",
		ID:      id,
		Error: &domain.RPCError{
			Code:    code,
			Message: message,
		},
	}
	respondWithJSON(w, http.StatusOK, resp)
}

func (m *MCPServer) handleListAdvisors(ctx context.Context, args map[string]interface{}) (interface{}, error) {
	sessionID := getStringArg(args, "session_id")
	scenarios, err := m.scenarioSvc.GetAvailableScenarios(ctx, sessionID)
	if err != nil {
		return nil, err
	}

	var advisors []map[string]string
	for _, s := range scenarios {
		advisors = append(advisors, map[string]string{
			"id":   s.ID,
			"name": s.Name,
		})
	}
	return advisors, nil
}

func (m *MCPServer) handleGetAdvisor(ctx context.Context, args map[string]interface{}) (interface{}, error) {
	id, ok := args["id"].(string)
	if !ok {
		return nil, domain.ErrInvalidArguments("id must be a string")
	}
	sessionID := getStringArg(args, "session_id")

	return m.scenarioSvc.GetAdvisorDynamicForm(ctx, id, sessionID)
}

func (m *MCPServer) handleUpdateAdvisor(ctx context.Context, args map[string]interface{}) error {
	id, ok := args["id"].(string)
	if !ok {
		return domain.ErrInvalidArguments("id must be a string")
	}

	content, ok := args["content"].(map[string]interface{})
	if !ok {
		return domain.ErrInvalidArguments("content must be a map")
	}
	sessionID := getStringArg(args, "session_id")

	return m.scenarioSvc.UpdateScenario(ctx, id, sessionID, content)
}

func (m *MCPServer) handleGetMarketInsights(ctx context.Context, args map[string]interface{}) (interface{}, error) {
	query, ok := args["query"].(string)
	if !ok {
		return nil, domain.ErrInvalidArguments("query must be a string")
	}

	// Mock returning time-series data from internal research data store
	return map[string]interface{}{
		"query": query,
		"insights": []map[string]interface{}{
			{
				"title":  "Global Oil Prices (Brent Crude) - 6 Month Trend",
				"source": "Global Research",
				"data": []map[string]interface{}{
					{"month": "Oct 2025", "price_per_barrel": 78.50},
					{"month": "Nov 2025", "price_per_barrel": 81.20},
					{"month": "Dec 2025", "price_per_barrel": 85.00},
					{"month": "Jan 2026", "price_per_barrel": 92.40},
					{"month": "Feb 2026", "price_per_barrel": 105.10},
					{"month": "Mar 2026", "price_per_barrel": 110.00},
				},
				"summary": "Oil prices have surged by over 40% in the last six months due to supply chain disruptions, impacting logistics costs globally.",
			},
			{
				"title":  "EUR/USD Exchange Rate",
				"source": "FX Strategy Desk",
				"data": []map[string]interface{}{
					{"month": "Oct 2025", "rate": 1.05},
					{"month": "Nov 2025", "rate": 1.06},
					{"month": "Dec 2025", "rate": 1.08},
					{"month": "Jan 2026", "rate": 1.10},
					{"month": "Feb 2026", "rate": 1.12},
					{"month": "Mar 2026", "rate": 1.14},
				},
				"summary": "The Euro has strengthened against the dollar steadily over the past 6 months.",
			},
		},
	}, nil
}

func (m *MCPServer) handleGetCustomerProfile(ctx context.Context, args map[string]interface{}) (interface{}, error) {
	sessionID := getStringArg(args, "session_id")
	personaID, _ := ctx.Value(personaContextKey).(string)
	scen, err := m.scenarioSvc.GetScenario(ctx, personaID, sessionID)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"name":           scen.Persona.ClientProfile.Name,
		"company":        scen.Persona.ClientProfile.CompanyName,
		"role":           scen.Persona.ClientProfile.Role,
		"address":        scen.Persona.ClientProfile.Address,
		"employer":       scen.Persona.ClientProfile.CompanyName,
		"nearest_branch": scen.Persona.ClientProfile.NearestBranchID,
	}, nil
}

func (m *MCPServer) handleGetBranchDetails(ctx context.Context, args map[string]interface{}) (interface{}, error) {
	branchID := getStringArg(args, "branch_id")
	personaID, _ := ctx.Value(personaContextKey).(string)
	scen, err := m.scenarioSvc.GetScenario(ctx, personaID, "")
	if err != nil {
		return nil, err
	}

	for _, b := range scen.Persona.Branches {
		if b.ID == branchID {
			return b, nil
		}
	}

	return nil, fmt.Errorf("branch %s not found", branchID)
}

func (m *MCPServer) handleSendDocumentToApp(ctx context.Context, args map[string]interface{}) (interface{}, error) {
	docType := getStringArg(args, "document_type")

	msg := fmt.Sprintf("The %s has been pushed to your Mobile Banking app.", docType)
	delivery := "mobile_app_push"

	return map[string]interface{}{
		"status":        "success",
		"document_type": docType,
		"delivery":      delivery,
		"message":       msg,
	}, nil
}
