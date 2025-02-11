// Copyright 2025 Google LLC.
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

package add_header

import (
	"encoding/base64"
	"fmt"
	extproc "github.com/envoyproxy/go-control-plane/envoy/service/ext_proc/v3"

	"github.com/GoogleCloudPlatform/examples/gclb-callouts/service-extensions/extproc/internal/server"
	"github.com/GoogleCloudPlatform/service-extensions/callouts/go/extproc/pkg/utils"
)

// ExampleCalloutService is a gRPC service that handles header processing.
type ExampleCalloutService struct {
	server.GRPCCalloutService
}

// NewExampleCalloutService creates a new instance of ExampleCalloutService.
func NewExampleCalloutService() *ExampleCalloutService {
	service := &ExampleCalloutService{}
	service.Handlers.RequestHeadersHandler = service.HandleRequestHeaders
	service.Handlers.ResponseHeadersHandler = service.HandleResponseHeaders
	return service
}

// extractSecretHeader extracts the secret header from the request headers.
func extractSecretHeader(headers *extproc.HttpHeaders) (string, error) {
	for _, header := range headers.Headers.Headers {
		if header.Key == "secret" {
			return string(header.RawValue), nil
		}
	}
	return "", fmt.Errorf("no secret header found")
}

// HandleRequestHeaders handles incoming request headers and adds a custom header.
func (s *ExampleCalloutService) HandleRequestHeaders(headers *extproc.HttpHeaders) (*extproc.ProcessingResponse, error) {
	secretHeader, err := extractSecretHeader(headers)

	if err == nil {
		// Encode the secret string and send it to backend.
		secretHeader = base64.StdEncoding.EncodeToString([]byte(secretHeader))
	}

	return &extproc.ProcessingResponse{
		Response: &extproc.ProcessingResponse_RequestHeaders{
			RequestHeaders: utils.AddHeaderMutation([]struct{ Key, Value string }{{Key: "secret", Value: secretHeader}}, nil, false, nil),
		},
	}, nil
}
