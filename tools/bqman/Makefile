# Copyright 2020 Google LLC

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

# http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

FILES		?= $(shell find . -type f -name '*.go' -not -path "./vendor/*")
all: build

clean:
	rm -rf dist/* 
	rm -f testdata/TestProcessPatch.properties
	rm -f testdata/TestProcessPush.properties
	rm -f testdata/TestProcessUpdate.properties
	rm -rf .bqman

dist/bqman: golang/*.go
	cd golang; env CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o ../$@ -v *.go

dist/bqadmin: golang/*.go
	cd golang/bqadmin; env CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o ../../$@ -v bqadmin.go

build: dist/bqman dist/bqadmin

test_list: build
	cd golang; env CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go test *.go -list Test

test_all: build
	cd golang; env CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go test -v *.go

test: build
	cd golang; env CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go test -v *.go -run $(TEST)

lint:
	cd golang; golint ./...