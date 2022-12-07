// Copyright 2022 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package healthchecker

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

// Configuration
type Configuration struct {
	filter           string
	grace_period     time.Duration
	max_parallelism  int
	port             int
	project          string
	pubsub_topic     string
	recheck_interval time.Duration
	timeout          time.Duration
}

// getEnv - get ENV variable or use default value.
func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

// GetConfiguration generates configration by reading ENV variables.
func GetConfiguration() (*Configuration, error) {
	timeout, err := time.ParseDuration(getEnv("TIMEOUT", "1000ms"))
	if err != nil {
		fmt.Errorf("Failed to parse TIMEOUT env variable: %v", err)
		return nil, err
	}

	recheck_interval, err := time.ParseDuration(getEnv("RECHECK_INTERVAL", "10s"))
	if err != nil {
		fmt.Errorf("Failed to parse RECHECK_INTERVAL env variable: %v", err)
		return nil, err
	}

	max_parallelism, err := strconv.Atoi(getEnv("MAX_PARALLELISM", "100"))
	if err != nil {
		fmt.Errorf("Failed to parse MAX_PARALLELISM env variable: %v", err)
		return nil, err
	}

	grace_period, err := time.ParseDuration(getEnv("GRACE_PERIOD", "180s"))
	if err != nil {
		fmt.Errorf("Failed to parse GRACE_PERIOD env variable: %v", err)
		return nil, err
	}

	port, err := strconv.Atoi(getEnv("TCP_PORT", "80"))
	if err != nil {
		fmt.Errorf("Failed to parse TCP_PORT env variable: %v", err)
		return nil, err
	}

	filter := getEnv("FILTER", "")
	if filter == "" {
		filter = "status = RUNNING"
	} else {
		filter = fmt.Sprintf("(status = RUNNING) AND (%s)", filter)
	}

	project := getEnv("PROJECT", "")
	if project == "" {
		fmt.Errorf("Failed to get PROJECT env variable: %v", err)
		return nil, err
	}

	pubsub_topic := getEnv("PUBSUB_TOPIC", "")
	if pubsub_topic == "" {
		fmt.Errorf("Failed to get PUBSUB_TOPIC env variable: %v", err)
		return nil, err
	}

	return &Configuration{
		filter:           filter,
		grace_period:     grace_period,
		max_parallelism:  max_parallelism,
		port:             port,
		project:          project,
		pubsub_topic:     pubsub_topic,
		recheck_interval: recheck_interval,
		timeout:          timeout,
	}, nil
}
