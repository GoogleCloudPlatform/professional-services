// Copyright 2025 Google LLC.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//	http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package main

import (
	"github.com/GoogleCloudPlatform/examples/gclb-callouts/service-extensions/extproc/internal/server"
	update_header "github.com/GoogleCloudPlatform/examples/gclb-callouts/service-extensions/extproc/update_header"
	extproc "github.com/envoyproxy/go-control-plane/envoy/service/ext_proc/v3"
)

// ExampleService defines the interface that all example services must implement.
type ExampleService interface {
	extproc.ExternalProcessorServer
}

func main() {

	var customService ExampleService

	customService = update_header.NewExampleCalloutService()

	config := server.Config{
		Address:            "0.0.0.0:8443",
		InsecureAddress:    "0.0.0.0:8181",
		HealthCheckAddress: "0.0.0.0:8000",
		CertFile:           "extproc/ssl_creds/localhost.crt",
		KeyFile:            "extproc/ssl_creds/localhost.key",
	}

	calloutServer := server.NewCalloutServer(config)
	go calloutServer.StartGRPC(customService)
	go calloutServer.StartInsecureGRPC(customService)
	go calloutServer.StartHealthCheck()

	// Block forever or handle signals as needed
	select {}
}
