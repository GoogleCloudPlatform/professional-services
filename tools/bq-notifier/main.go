// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// This code is a prototype and not engineered for production use.
// Error handling is incomplete or inappropriate for usage beyond
// a development sample.

package bqnotifier

import (
	"context"
	"encoding/json"
	"errors"
	"github.com/mitchellh/mapstructure"
	"log"
	"net/http"
	"os"
)

var bqn *BQNotifier
var errLog *log.Logger
var httpClient *http.Client

func init() {
	errLog = log.New(os.Stderr, "", 0)
	httpClient = &http.Client{}
	bqn = &BQNotifier{}
	// Example debug with some info
	bqn.AddHook(func(job Job, data interface{}) error {
		log.Printf("DEBUG: Found Job: %s from user %s with labels: %v\n", &job, job.UserEmail(), job.Labels())
		return nil
	})
	// Example of error handling (ERRORS ON EVERY JOB, TODO:CHANGE ME
	bqn.AddHook(func(_ Job, _ interface{}) error {
		return errors.New("Test")
	})
	// Example of slack notification webhook, read slack.go for usage
	bqn.AddHook(SlackNotify)
}

type PubSubMessage struct {
	Data []byte `json:"data"`
}

// HelloPubSub consumes a Pub/Sub message.
func HandleJobComplete(ctx context.Context, m PubSubMessage) error {
	var data interface{}
	if err := json.Unmarshal(m.Data, &data); err != nil {
		log.Fatalf("Unable to unmarshal Job Information: %v", err)
	}
	var job Job
	err := mapstructure.Decode(data, &job)
	if err != nil {
		return err
	}
	bqn.RunHooks(&job, &data)
	return nil
}
