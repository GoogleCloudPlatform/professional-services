// Copyright 2021 Google LLC
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

package main

import (
	"flag"
	"log"
	"regexp"
	"testing"

	"github.com/getkin/kin-openapi/openapi3"
	"github.com/stretchr/testify/assert"
)

func TestPathwise(t *testing.T) {
	doc, err := openapi3.NewLoader().LoadFromData([]byte(`openapi: 3.0.0
info:
  title: test
  version: '1.0'
servers:
  - url: 'http://localhost:8080'
paths:
  '/users/{name}':
    parameters:
      - schema:
          type: string
        name: name
        in: path
        required: true
    get:
      summary: Get User
      tags: []
      responses: {}
      operationId: get-user
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties: {}
          text/plain:
            schema:
              type: object
              properties: {}
        description: ''
  '/pets/{name}':
    parameters:
      - schema:
          type: string
        name: name
        in: path
        required: true
    get:
      summary: Get Pet
      tags: []
      responses: {}
      operationId: get-pet
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties: {}
          text/plain:
            schema:
              type: object
              properties: {}
        description: ''
components:
  schemas: {}`))
	if err != nil {
		log.Fatal(err)
		t.FailNow()
		return
	}
	flag.Parse()
	rules := []Rule{}
	rules, err = GeneratePathwiseRules(rules, doc)
	if err != nil {
		log.Fatal(err)
		t.FailNow()
		return
	}

	assert.Equal(t, 2, len(rules))
}

func TestMethodwise(t *testing.T) {
	doc, err := openapi3.NewLoader().LoadFromData([]byte(`openapi: 3.0.0
info:
  title: test
  version: '1.0'
servers:
  - url: 'http://localhost:8080'
paths:
  '/users/{name}':
    parameters:
      - schema:
          type: string
        name: name
        in: path
        required: true
    get:
      summary: Get User
      tags: []
      responses: {}
      operationId: get-user
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties: {}
          text/plain:
            schema:
              type: object
              properties: {}
        description: ''
  '/pets/{name}':
    parameters:
      - schema:
          type: string
        name: name
        in: path
        required: true
    get:
      summary: Get Pet
      tags: []
      responses: {}
      operationId: get-pet
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties: {}
          text/plain:
            schema:
              type: object
              properties: {}
        description: ''
components:
  schemas: {}`))
	if err != nil {
		log.Fatal(err)
		t.FailNow()
		return
	}
	flag.Parse()
	rules := []Rule{}
	rules, err = GenerateMethodwiseRules(rules, doc)
	if err != nil {
		log.Fatal(err)
		t.FailNow()
		return
	}

	assert.Equal(t, 1, len(rules))
	assert.Contains(t, rules[0].Match.Expr.Expression, "request.method=='GET'")
	assert.Contains(t, rules[0].Match.Expr.Expression, "/users/[^/]*$")
	assert.Contains(t, rules[0].Match.Expr.Expression, "/pets/[^/]*$")
}

func TestCompressed(t *testing.T) {
	doc, err := openapi3.NewLoader().LoadFromData([]byte(`openapi: 3.0.0
info:
  title: test
  version: '1.0'
servers:
  - url: 'http://localhost:8080'
paths:
  '/users/{name}':
    parameters:
      - schema:
          type: string
        name: name
        in: path
        required: true
    get:
      summary: Get User
      tags: []
      responses: {}
      operationId: get-user
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties: {}
          text/plain:
            schema:
              type: object
              properties: {}
        description: ''
  '/pets/{name}':
    parameters:
      - schema:
          type: string
        name: name
        in: path
        required: true
    get:
      summary: Get Pet
      tags: []
      responses: {}
      operationId: get-pet
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties: {}
          text/plain:
            schema:
              type: object
              properties: {}
        description: ''
  '/pets/test':
    get:
      summary: Get Pet test
      tags: []
      responses: {}
      operationId: get-pet-test
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties: {}
          text/plain:
            schema:
              type: object
              properties: {}
        description: ''
components:
  schemas: {}`))
	if err != nil {
		log.Fatal(err)
		t.FailNow()
		return
	}
	flag.Parse()
	rules := []Rule{}
	rules, err = GeneratedCompressedRules(rules, doc)
	if err != nil {
		log.Fatal(err)
		t.FailNow()
		return
	}

	assert.Equal(t, 1, len(rules))
	assert.Contains(t, rules[0].Match.Expr.Expression, "(request.method=='GET')")
	assert.Contains(t, rules[0].Match.Expr.Expression, "/users/[^/]*$")
	assert.Contains(t, rules[0].Match.Expr.Expression, "/pets/[^/]*$")
}

func TestRegex(t *testing.T) {
	regex, err := regexp.Compile(ToRegEx(`/pets/{name}`))
	if err != nil {
		t.FailNow()
	}

	assert.Equal(t, true, regex.MatchString("/pets/test123"))
	assert.Equal(t, false, regex.MatchString("/pets/test123/asd"))
	assert.Equal(t, false, regex.MatchString("/users/test123"))
	assert.Equal(t, false, regex.MatchString("/users/test123/asd"))
}

func TestFilterPaths(t *testing.T) {
	paths := []string{
		"/pet/[^/]*$",
		"/user/login$",
		"/user/[^/]*$",
		"/pet/findByStatus$",
		"/pet/findByTags$",
		"/store/inventory$",
		"/store/order/[^/]*$",
		"/user/logout$",
	}
	filtered := FilterPaths(paths)
	assert.Equal(t, 4, len(filtered))
	assert.Contains(t, filtered, "/pet/[^/]*$")
	assert.Contains(t, filtered, "/user/[^/]*$")
	assert.Contains(t, filtered, "/store/inventory$")
	assert.Contains(t, filtered, "/store/order/[^/]*$")
}
