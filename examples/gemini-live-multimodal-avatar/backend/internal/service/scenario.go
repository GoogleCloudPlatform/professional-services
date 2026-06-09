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

package service

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"math/rand"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"cloud.google.com/go/firestore"
	"google.golang.org/api/iterator"
	"live-api-rewrite-backend/internal/domain"
)

type ScenarioService interface {
	GetScenario(ctx context.Context, scenarioID string, sessionID string) (domain.Scenario, error)
	GetAvailableScenarios(ctx context.Context, sessionID string) ([]domain.Scenario, error)
	UpdateScenario(ctx context.Context, scenarioID string, sessionID string, content map[string]interface{}) error
	GetAdvisorDynamicForm(ctx context.Context, scenarioID string, sessionID string) (map[string]interface{}, error)
	Close() error
	domain.AccountRepository
}

// scenarioStore is an internal interface for the data source to allow mocking
type scenarioStore interface {
	GetScenario(ctx context.Context, collection, id string) (map[string]interface{}, error)
	GetAllScenarios(ctx context.Context, collection string) ([]map[string]interface{}, error)
	GetScenariosBySession(ctx context.Context, collection, sessionID string) ([]map[string]interface{}, error)
	UpdateScenario(ctx context.Context, collection, id string, scenario map[string]interface{}) error
	Close() error
}

type firestoreStore struct {
	client *firestore.Client
}

func (f *firestoreStore) Close() error {
	if f.client != nil {
		return f.client.Close()
	}
	return nil
}

func (f *firestoreStore) GetScenario(ctx context.Context, collection, id string) (map[string]interface{}, error) {
	doc, err := f.client.Collection(collection).Doc(id).Get(ctx)
	if err != nil {
		return nil, err
	}
	var data map[string]interface{}
	if err := doc.DataTo(&data); err != nil {
		return nil, err
	}
	return data, nil
}

func (f *firestoreStore) GetAllScenarios(ctx context.Context, collection string) ([]map[string]interface{}, error) {
	iter := f.client.Collection(collection).Documents(ctx)
	return f.iteratorToList(iter)
}

func (f *firestoreStore) GetScenariosBySession(ctx context.Context, collection, sessionID string) ([]map[string]interface{}, error) {
	iter := f.client.Collection(collection).Where("session_id", "==", sessionID).Documents(ctx)
	return f.iteratorToList(iter)
}

func (f *firestoreStore) iteratorToList(iter *firestore.DocumentIterator) ([]map[string]interface{}, error) {
	var list []map[string]interface{}
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, err
		}
		var data map[string]interface{}
		if err := doc.DataTo(&data); err != nil {
			continue
		}
		if _, ok := data["id"]; !ok {
			data["id"] = doc.Ref.ID
		}
		list = append(list, data)
	}
	return list, nil
}

func (f *firestoreStore) UpdateScenario(ctx context.Context, collection, id string, scenario map[string]interface{}) error {
	_, err := f.client.Collection(collection).Doc(id).Set(ctx, scenario)
	return err
}

type scenarioServiceImpl struct {
	store scenarioStore

	// In-memory cache for base scenarios
	cache               map[string]domain.Scenario
	cacheTime           time.Time
	cacheTTL            time.Duration
	cacheMutex          sync.RWMutex
	disableLocalOverlay bool
}

func NewScenarioService(projectID string) (ScenarioService, error) {
	ctx := context.Background()
	client, err := firestore.NewClient(ctx, projectID)
	if err != nil {
		return nil, fmt.Errorf("failed to create firestore client: %w", err)
	}

	ttl := 5 * time.Minute
	if ttlStr := os.Getenv("SCENARIO_CACHE_TTL_MINUTES"); ttlStr != "" {
		if val, err := strconv.Atoi(ttlStr); err == nil {
			ttl = time.Duration(val) * time.Minute
		}
	}

	return &scenarioServiceImpl{
		store:               &firestoreStore{client: client},
		cache:               make(map[string]domain.Scenario),
		cacheTTL:            ttl,
		disableLocalOverlay: false,
	}, nil
}

func NewTestScenarioService(store scenarioStore) ScenarioService {
	return &scenarioServiceImpl{
		store:               store,
		cache:               make(map[string]domain.Scenario),
		cacheTTL:            5 * time.Minute,
		disableLocalOverlay: true,
	}
}

func (s *scenarioServiceImpl) Close() error {
	return s.store.Close()
}

func (s *scenarioServiceImpl) refreshCacheIfNeeded(ctx context.Context) error {
	s.cacheMutex.RLock()
	cacheValid := time.Since(s.cacheTime) < s.cacheTTL && len(s.cache) > 0
	s.cacheMutex.RUnlock()

	if cacheValid {
		return nil
	}

	s.cacheMutex.Lock()
	defer s.cacheMutex.Unlock()

	if time.Since(s.cacheTime) < s.cacheTTL && len(s.cache) > 0 {
		return nil
	}

	slog.Info("Refreshing scenarios cache from data store")
	rawScenarios, err := s.store.GetAllScenarios(ctx, "base_scenarios")
	if err != nil || len(rawScenarios) == 0 {
		if err != nil {
			slog.Warn("Failed to fetch scenarios from Firestore, falling back to local JSON files", slog.String("error", err.Error()))
		} else {
			slog.Info("Firestore returned no scenarios, falling back to local JSON files")
		}

		// Fallback to local files
		fallbackScenarios, fallbackErr := s.loadLocalScenarios()
		if fallbackErr != nil {
			if err != nil {
				return fmt.Errorf("failed to fetch from Firestore and local fallback failed: %w", err)
			}
			return fmt.Errorf("firestore returned no scenarios and local fallback failed: %w", fallbackErr)
		}

		s.cache = fallbackScenarios
		s.cacheTime = time.Now()
		return nil
	}

	newCache := make(map[string]domain.Scenario)
	for _, raw := range rawScenarios {
		data, _ := json.Marshal(raw)
		var scenario domain.Scenario
		if err := json.Unmarshal(data, &scenario); err != nil {
			slog.Error("Failed to unmarshal scenario from store", slog.String("error", err.Error()))
			continue
		}
		newCache[scenario.ID] = scenario
	}

	// Dynamic Local Integration Overlay: Merge local JSON configuration files on top of Firestore records.
	// This ensures that new scenario configurations (such as wealth-advisor.json) are instantly
	// active and configurable in local development, even if database sync/seeding steps are blocked.
	// We skip this dynamic merge during hermetic unit testing to avoid overlay conflicts on mocked data.
	if !s.disableLocalOverlay {
		localScenarios, localErr := s.loadLocalScenarios()
		if localErr == nil {
			for id, sc := range localScenarios {
				newCache[id] = sc
				slog.Info("Successfully overlayed local scenario config into active cache", slog.String("id", id))
			}
		} else {
			slog.Warn("Failed to locate local scenario fallback folder for overlay", slog.String("error", localErr.Error()))
		}
	}

	s.cache = newCache
	s.cacheTime = time.Now()
	return nil
}

func (s *scenarioServiceImpl) loadLocalScenarios() (map[string]domain.Scenario, error) {
	localCache := make(map[string]domain.Scenario)

	// Try multiple relative paths depending on where the executable/test is running from
	dirsToTry := []string{
		"data/scenarios",          // Docker container run from /app OR local run from /backend
		"./data/scenarios",        // Explicit local run
		"../../data/scenarios",    // From internal/service (tests)
		"../../../data/scenarios", // Deep test execution
	}

	var dir string
	var files []os.DirEntry
	var err error

	for _, d := range dirsToTry {
		files, err = os.ReadDir(d)
		if err == nil {
			dir = d
			break
		}
	}

	if err != nil {
		return nil, fmt.Errorf("could not read scenarios directory in any known path. Tried %v: %w", dirsToTry, err)
	}

	for _, file := range files {
		if filepath.Ext(file.Name()) == ".json" {
			path := filepath.Join(dir, file.Name())
			data, readErr := os.ReadFile(path)
			if readErr != nil {
				slog.Error("Error reading local scenario file", slog.String("file", path), slog.String("error", readErr.Error()))
				continue
			}

			var scenario domain.Scenario
			if parseErr := json.Unmarshal(data, &scenario); parseErr != nil {
				slog.Error("Error parsing local scenario JSON", slog.String("file", path), slog.String("error", parseErr.Error()))
				continue
			}

			if scenario.ID == "" {
				scenario.ID = strings.TrimSuffix(file.Name(), filepath.Ext(file.Name()))
			}

			localCache[scenario.ID] = scenario
			slog.Info("Loaded local scenario fallback", slog.String("id", scenario.ID), slog.String("file", file.Name()))
		}
	}

	if len(localCache) == 0 {
		return nil, fmt.Errorf("no valid JSON scenarios found in %s", dir)
	}

	return localCache, nil
}

func (s *scenarioServiceImpl) GetAvailableScenarios(ctx context.Context, sessionID string) ([]domain.Scenario, error) {
	if err := s.refreshCacheIfNeeded(ctx); err != nil {
		return nil, err
	}

	s.cacheMutex.RLock()
	defer s.cacheMutex.RUnlock()

	var list []domain.Scenario

	// Add base scenarios
	for _, sc := range s.cache {
		list = append(list, sc)
	}

	// Add custom scenarios for this session
	if sessionID != "" {
		customRaw, err := s.store.GetScenariosBySession(ctx, "custom_scenarios", sessionID)
		if err == nil {
			for _, raw := range customRaw {
				data, _ := json.Marshal(raw)
				var scenario domain.Scenario
				if err := json.Unmarshal(data, &scenario); err == nil {
					// Mark as custom/forked
					scenario.Name = scenario.Name + " (Custom)"
					list = append(list, scenario)
				}
			}
		}
	}

	return list, nil
}

func (s *scenarioServiceImpl) resolveRawScenario(ctx context.Context, scenarioID string, sessionID string) (map[string]interface{}, error) {
	if sessionID != "" {
		scenario, err := s.store.GetScenario(ctx, "custom_scenarios", sessionID+"_"+scenarioID)
		if err == nil {
			return scenario, nil
		}
		// If custom is not found, fall through to base scenario
	}
	return s.store.GetScenario(ctx, "base_scenarios", scenarioID)
}

func (s *scenarioServiceImpl) UpdateScenario(ctx context.Context, scenarioID string, sessionID string, content map[string]interface{}) error {
	// 1. Resolve existing scenario
	scenario, err := s.resolveRawScenario(ctx, scenarioID, sessionID)
	if err != nil {
		return fmt.Errorf("failed to get scenario %s for update: %w", scenarioID, err)
	}

	// 2. Apply updates dynamically
	applyPathUpdates(scenario, content)

	// 3. Strict Validation: Round-trip through JSON to validate against domain structure
	marshaled, err := json.Marshal(scenario)
	if err != nil {
		return fmt.Errorf("validation failed: failed to marshal scenario: %w", err)
	}
	var validatedScenario domain.Scenario
	if err := json.Unmarshal(marshaled, &validatedScenario); err != nil {
		return fmt.Errorf("validation failed: malformed scenario structure: %w", err)
	}

	// 4. Determine destination and apply defensive guard rails
	collection := "base_scenarios"
	targetID := scenarioID

	if sessionID != "" {
		collection = "custom_scenarios"
		targetID = sessionID + "_" + scenarioID

		scenario["session_id"] = sessionID
		scenario["id"] = targetID
		scenario["base_scenario_id"] = scenarioID
		scenario["expiresAt"] = time.Now().Add(24 * time.Hour).Unix()
	} else {
		// DEFENSIVE GUARD: Log a strong warning if a base scenario is modified directly
		slog.Warn("Updating base scenario. This modifies the template for ALL users.", slog.String("scenarioID", scenarioID))
	}

	// 5. Save back to store
	err = s.store.UpdateScenario(ctx, collection, targetID, scenario)
	if err != nil {
		return fmt.Errorf("failed to save scenario %s: %w", targetID, err)
	}

	// 6. Invalidate cache if base scenario was updated
	if sessionID == "" {
		s.cacheMutex.Lock()
		s.cacheTime = time.Time{}
		s.cacheMutex.Unlock()
	}

	return nil
}

func (s *scenarioServiceImpl) GetAdvisorDynamicForm(ctx context.Context, scenarioID string, sessionID string) (map[string]interface{}, error) {
	scenario, err := s.resolveRawScenario(ctx, scenarioID, sessionID)
	if err != nil {
		return nil, err
	}

	schema := []map[string]interface{}{
		{
			"id":        "form-container",
			"component": "Column",
			"children":  []string{},
		},
	}
	formData := map[string]interface{}{}

	flattenAndGenerateSchema(scenario, "", &schema, &formData)

	var children []string
	for _, comp := range schema {
		if comp["id"] != "form-container" {
			children = append(children, comp["id"].(string))
		}
	}
	schema[0]["children"] = children

	return map[string]interface{}{
		"schema": schema,
		"data":   formData,
	}, nil
}

func flattenAndGenerateSchema(m map[string]interface{}, path string, schema *[]map[string]interface{}, data *map[string]interface{}) {
	for k, v := range m {
		currentPath := path + "/" + k
		switch val := v.(type) {
		case string:
			(*data)[currentPath] = val
			*schema = append(*schema, map[string]interface{}{
				"id":        currentPath,
				"component": "TextField",
				"label":     k,
				"value": map[string]interface{}{
					"path": currentPath,
				},
			})
		case map[string]interface{}:
			flattenAndGenerateSchema(val, currentPath, schema, data)
		case []interface{}:
			// Pass raw arrays to formData so the frontend can edit them using FieldArrays
			(*data)[currentPath] = val
			// We don't generate a dynamic Textfield schema for arrays, as they will be handled by bespoke React components
		}
	}
}

func applyPathUpdates(target map[string]interface{}, flatData map[string]interface{}) {
	for path, value := range flatData {
		parts := strings.Split(strings.TrimPrefix(path, "/"), "/")
		curr := target
		for i := 0; i < len(parts)-1; i++ {
			part := parts[i]
			if _, ok := curr[part]; !ok {
				curr[part] = make(map[string]interface{})
			}
			// Handle potential type mismatch if field was not a map before
			if _, ok := curr[part].(map[string]interface{}); !ok {
				curr[part] = make(map[string]interface{})
			}
			curr = curr[part].(map[string]interface{})
		}
		curr[parts[len(parts)-1]] = value
	}
}

func (s *scenarioServiceImpl) GetAccount(ctx context.Context, id domain.AccountID, sessionID string) (domain.Account, error) {
	if sessionID != "" {
		// STRONGLY CONSISTENT READ: Look up the base scenario ID first, then fetch the exact custom document
		baseID, _, err := s.getBaseScenarioForAccount(ctx, id)
		if err == nil {
			customRaw, err := s.store.GetScenario(ctx, "custom_scenarios", sessionID+"_"+baseID)
			if err == nil {
				data, _ := json.Marshal(customRaw)
				var scenario domain.Scenario
				if err := json.Unmarshal(data, &scenario); err == nil {
					for _, acc := range scenario.Accounts {
						if acc.ID == id {
							return acc, nil
						}
					}
				}
			}
		}

		// Fallback: If we only have session ID and the above failed, fetch all custom scenarios for this session
		customRaw, err := s.store.GetScenariosBySession(ctx, "custom_scenarios", sessionID)
		if err == nil {
			for _, raw := range customRaw {
				data, _ := json.Marshal(raw)
				var scenario domain.Scenario
				if err := json.Unmarshal(data, &scenario); err == nil {
					for _, acc := range scenario.Accounts {
						if acc.ID == id {
							return acc, nil
						}
					}
				}
			}
		}
	}

	if err := s.refreshCacheIfNeeded(ctx); err != nil {
		return domain.Account{}, err
	}

	s.cacheMutex.RLock()
	defer s.cacheMutex.RUnlock()

	for _, scenario := range s.cache {
		for _, acc := range scenario.Accounts {
			if acc.ID == id {
				return acc, nil
			}
		}
	}
	return domain.Account{}, domain.ErrAccountNotFound
}

func (s *scenarioServiceImpl) getBaseScenarioForAccount(ctx context.Context, accountID domain.AccountID) (string, domain.Scenario, error) {
	if err := s.refreshCacheIfNeeded(ctx); err != nil {
		return "", domain.Scenario{}, err
	}

	s.cacheMutex.RLock()
	defer s.cacheMutex.RUnlock()

	for baseID, scenario := range s.cache {
		for _, acc := range scenario.Accounts {
			if acc.ID == accountID {
				return baseID, scenario, nil
			}
		}
	}
	return "", domain.Scenario{}, domain.ErrAccountNotFound
}

func (s *scenarioServiceImpl) mutateAndSaveScenario(ctx context.Context, sessionID string, baseID string, baseScenario domain.Scenario, mutator func(*domain.Scenario) bool) error {
	if sessionID == "" {
		return fmt.Errorf("cannot mutate a base scenario without a session ID")
	}

	targetID := sessionID + "_" + baseID

	// 1. STRONGLY CONSISTENT READ: Fetch the exact custom scenario document directly.
	customRaw, err := s.store.GetScenario(ctx, "custom_scenarios", targetID)

	var scenario domain.Scenario
	if err == nil {
		// Document exists, use it
		data, _ := json.Marshal(customRaw)
		if err := json.Unmarshal(data, &scenario); err != nil {
			return err
		}
	} else {
		// Document doesn't exist yet, fork the base scenario
		marshaled, err := json.Marshal(baseScenario)
		if err != nil {
			return err
		}
		json.Unmarshal(marshaled, &scenario)
	}

	// 2. Apply the mutation
	modified := mutator(&scenario)
	if !modified {
		return nil // Nothing changed
	}

	// 3. Save it back
	scenario.ID = targetID
	updatedRaw, err := json.Marshal(scenario)
	if err != nil {
		return err
	}
	var updatedMap map[string]interface{}
	json.Unmarshal(updatedRaw, &updatedMap)

	updatedMap["session_id"] = sessionID
	updatedMap["base_scenario_id"] = baseID
	updatedMap["expiresAt"] = time.Now().Add(24 * time.Hour).Unix()

	return s.store.UpdateScenario(ctx, "custom_scenarios", targetID, updatedMap)
}

func (s *scenarioServiceImpl) UpdateAccount(ctx context.Context, account domain.Account, sessionID string) error {
	baseID, baseScenario, err := s.getBaseScenarioForAccount(ctx, account.ID)
	if err != nil {
		return err
	}

	return s.mutateAndSaveScenario(ctx, sessionID, baseID, baseScenario, func(scen *domain.Scenario) bool {
		for i, acc := range scen.Accounts {
			if acc.ID == account.ID {
				scen.Accounts[i] = account
				return true
			}
		}
		return false
	})
}

func (s *scenarioServiceImpl) AddTransaction(ctx context.Context, transaction domain.Transaction, sessionID string) error {
	baseID, baseScenario, err := s.getBaseScenarioForAccount(ctx, domain.AccountID(transaction.AccountID))
	if err != nil {
		return err
	}

	return s.mutateAndSaveScenario(ctx, sessionID, baseID, baseScenario, func(scen *domain.Scenario) bool {
		// Prepend transaction so it appears at the top of recent transactions
		scen.Transactions = append([]domain.Transaction{transaction}, scen.Transactions...)
		return true
	})
}

func (s *scenarioServiceImpl) GetTransactions(ctx context.Context, id domain.AccountID, sessionID string, limit int) ([]domain.Transaction, error) {
	var txs []domain.Transaction

	if sessionID != "" {
		// STRONGLY CONSISTENT READ: Look up baseID first
		baseID, _, err := s.getBaseScenarioForAccount(ctx, id)
		if err == nil {
			customRaw, err := s.store.GetScenario(ctx, "custom_scenarios", sessionID+"_"+baseID)
			if err == nil {
				data, _ := json.Marshal(customRaw)
				var scenario domain.Scenario
				if err := json.Unmarshal(data, &scenario); err == nil {
					for _, tx := range scenario.Transactions {
						if string(id) == tx.AccountID {
							txs = append(txs, tx)
						}
						if len(txs) == limit {
							return txs, nil
						}
					}
					if len(txs) > 0 {
						return txs, nil
					}
				}
			}
		}

		// Fallback query
		customRaw, err := s.store.GetScenariosBySession(ctx, "custom_scenarios", sessionID)
		if err == nil {
			for _, raw := range customRaw {
				data, _ := json.Marshal(raw)
				var scenario domain.Scenario
				if err := json.Unmarshal(data, &scenario); err == nil {
					for _, tx := range scenario.Transactions {
						if string(id) == tx.AccountID {
							txs = append(txs, tx)
						}
						if len(txs) == limit {
							return txs, nil
						}
					}
				}
			}
			if len(txs) > 0 {
				return txs, nil
			}
		}
	}

	if err := s.refreshCacheIfNeeded(ctx); err != nil {
		return nil, err
	}

	s.cacheMutex.RLock()
	defer s.cacheMutex.RUnlock()

	for _, scenario := range s.cache {
		for _, tx := range scenario.Transactions {
			if string(id) == tx.AccountID {
				txs = append(txs, tx)
			}
			if len(txs) == limit {
				return txs, nil
			}
		}
	}
	return txs, nil
}

func (s *scenarioServiceImpl) GetScenario(ctx context.Context, scenarioID string, sessionID string) (domain.Scenario, error) {
	// Try custom scenario first
	if sessionID != "" {
		customRaw, err := s.store.GetScenario(ctx, "custom_scenarios", sessionID+"_"+scenarioID)
		if err == nil {
			data, _ := json.Marshal(customRaw)
			var scenario domain.Scenario
			if err := json.Unmarshal(data, &scenario); err == nil {
				return s.applyScenarioDefaults(scenario, scenarioID), nil
			}
		}
	}

	if err := s.refreshCacheIfNeeded(ctx); err != nil {
		return domain.Scenario{}, err
	}

	s.cacheMutex.RLock()
	scenario, exists := s.cache[scenarioID]
	s.cacheMutex.RUnlock()

	if !exists {
		s.cacheMutex.RLock()
		if len(s.cache) > 0 {
			if cre, ok := s.cache["cre-advisor"]; ok {
				scenario = cre
			} else {
				for _, v := range s.cache {
					scenario = v
					break
				}
			}
		} else {
			s.cacheMutex.RUnlock()
			return domain.Scenario{}, fmt.Errorf("scenario not found: %s", scenarioID)
		}
		s.cacheMutex.RUnlock()
	}

	return s.applyScenarioDefaults(scenario, scenarioID), nil
}

func (s *scenarioServiceImpl) applyScenarioDefaults(scenario domain.Scenario, scenarioID string) domain.Scenario {
	if scenario.Persona.Role == "" {
		scenario.Persona.Role = "Financial Advisor"
	}
	if scenario.Persona.ClientProfile.Name == "" {
		scenario.Persona.ClientProfile.Name = "Valued Client"
	}
	if scenario.Name == "" {
		scenario.Name = scenarioID
	}

	scenario.CurrentDate = time.Now().Format("Monday, January 2, 2006")
	if len(scenario.AvailableAppointments) == 0 {
		scenario.AvailableAppointments = generateAvailableAppointments()
	}
	return scenario
}

func generateAvailableAppointments() []domain.AppointmentSlot {
	var slots []domain.AppointmentSlot
	curr := time.Now()
	added := 0
	for added < 3 {
		if curr.Weekday() != time.Saturday && curr.Weekday() != time.Sunday {
			hour := rand.Intn(8) + 9      // 9 AM to 4 PM
			minute := (rand.Intn(4) * 15) // 0, 15, 30, 45

			timeStr := ""
			if hour > 12 {
				timeStr = fmt.Sprintf("%d:%02d PM", hour-12, minute)
			} else if hour == 12 {
				timeStr = fmt.Sprintf("12:%02d PM", minute)
			} else {
				timeStr = fmt.Sprintf("%d:%02d AM", hour, minute)
			}

			label := fmt.Sprintf("%s at %s", curr.Format("Monday, January 2, 2006"), timeStr)
			id := fmt.Sprintf("SLOT-%d", added+1)
			slots = append(slots, domain.AppointmentSlot{ID: id, Label: label})
			added++
		}
		curr = curr.AddDate(0, 0, 1)
	}
	return slots
}
