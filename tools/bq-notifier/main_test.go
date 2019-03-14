// Copyright 2019 Google Inc.
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
	"io/ioutil"
	"log"
	"testing"
)

func TestJson(*testing.T) {
	b, err := ioutil.ReadFile("testdata_entry.json")
	if err != nil {
		log.Fatal(err)
	}
	ctx := context.Background()
	msg := PubSubMessage{Data: b}
	err = HandleJobComplete(ctx, msg)
	if err != nil {
		log.Fatal(err)
	}
}

