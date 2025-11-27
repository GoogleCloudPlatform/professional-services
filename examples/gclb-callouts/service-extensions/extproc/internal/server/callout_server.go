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

package server

import (
	"crypto/tls"
	"log"
	"net"
	"net/http"

	extproc "github.com/envoyproxy/go-control-plane/envoy/service/ext_proc/v3"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/reflection"
)

// Config holds the server configuration parameters.
type Config struct {
	Address              string
	InsecureAddress      string
	HealthCheckAddress   string
	CertFile             string
	KeyFile              string
	EnableInsecureServer bool
}

// loadConfig loads the server configuration from environment variables or uses defaults.
func loadConfig() Config {
	return Config{
		Address:              "0.0.0.0:8443",
		InsecureAddress:      "0.0.0.0:8181",
		HealthCheckAddress:   "0.0.0.0:8000",
		CertFile:             "extproc/ssl_creds/localhost.crt",
		KeyFile:              "extproc/ssl_creds/localhost.key",
		EnableInsecureServer: true,
	}
}

// CalloutServer represents a server that handles callouts.
type CalloutServer struct {
	Config Config
	Cert   tls.Certificate
}

// NewCalloutServer creates a new CalloutServer with the given configuration.
func NewCalloutServer(config Config) *CalloutServer {
	var cert tls.Certificate
	var err error

	if config.CertFile != "" && config.KeyFile != "" {
		cert, err = tls.LoadX509KeyPair(config.CertFile, config.KeyFile)
		if err != nil {
			log.Fatalf("Failed to load server certificate: %v", err)
		}
	}

	return &CalloutServer{
		Config: config,
		Cert:   cert,
	}
}

// StartGRPC starts the gRPC server with the specified service.
func (s *CalloutServer) StartGRPC(service extproc.ExternalProcessorServer) {
	lis, err := net.Listen("tcp", s.Config.Address)
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}
	creds := credentials.NewServerTLSFromCert(&s.Cert)
	grpcServer := grpc.NewServer(grpc.Creds(creds))
	extproc.RegisterExternalProcessorServer(grpcServer, service)
	reflection.Register(grpcServer)
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("Failed to serve gRPC: %v", err)
	}
}

// StartHealthCheck starts a health check server.
func (s *CalloutServer) StartHealthCheck() {
	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	server := &http.Server{
		Addr:    s.Config.HealthCheckAddress,
		Handler: mux,
	}

	log.Fatal(server.ListenAndServe())
}

// StartInsecureGRPC starts the gRPC server without TLS.
func (s *CalloutServer) StartInsecureGRPC(service extproc.ExternalProcessorServer) {
	if !s.Config.EnableInsecureServer {
		return
	}
	lis, err := net.Listen("tcp", s.Config.InsecureAddress)
	if err != nil {
		log.Fatalf("Failed to listen on insecure port: %v", err)
	}
	grpcServer := grpc.NewServer()
	extproc.RegisterExternalProcessorServer(grpcServer, service)
	reflection.Register(grpcServer)
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("Failed to serve gRPC on insecure port: %v", err)
	}
}

// RequestHeadersHandler handles request headers.
type RequestHeadersHandler func(*extproc.HttpHeaders) (*extproc.ProcessingResponse, error)

// ResponseHeadersHandler handles response headers.
type ResponseHeadersHandler func(*extproc.HttpHeaders) (*extproc.ProcessingResponse, error)

// RequestBodyHandler handles request bodies.
type RequestBodyHandler func(*extproc.HttpBody) (*extproc.ProcessingResponse, error)

// ResponseBodyHandler handles response bodies.
type ResponseBodyHandler func(*extproc.HttpBody) (*extproc.ProcessingResponse, error)

// RequestTrailersHandler handles request trailers.
type RequestTrailersHandler func(*extproc.HttpTrailers) (*extproc.ProcessingResponse, error)

// ResponseTrailersHandler handles response trailers.
type ResponseTrailersHandler func(*extproc.HttpTrailers) (*extproc.ProcessingResponse, error)

// HandlerRegistry registers various handlers.
type HandlerRegistry struct {
	RequestHeadersHandler   RequestHeadersHandler
	ResponseHeadersHandler  ResponseHeadersHandler
	RequestBodyHandler      RequestBodyHandler
	ResponseBodyHandler     ResponseBodyHandler
	RequestTrailersHandler  RequestTrailersHandler
	ResponseTrailersHandler ResponseTrailersHandler
}

// GRPCCalloutService implements the gRPC ExternalProcessorServer.
type GRPCCalloutService struct {
	extproc.UnimplementedExternalProcessorServer
	Handlers HandlerRegistry
}

// Process processes incoming gRPC streams.
func (s *GRPCCalloutService) Process(stream extproc.ExternalProcessor_ProcessServer) error {
	for {
		req, err := stream.Recv()
		if err != nil {
			return err
		}

		var response *extproc.ProcessingResponse
		switch {
		case req.GetRequestHeaders() != nil:
			if s.Handlers.RequestHeadersHandler != nil {
				response, err = s.Handlers.RequestHeadersHandler(req.GetRequestHeaders())
			}
		case req.GetResponseHeaders() != nil:
			if s.Handlers.ResponseHeadersHandler != nil {
				response, err = s.Handlers.ResponseHeadersHandler(req.GetResponseHeaders())
			}
		case req.GetRequestBody() != nil:
			if s.Handlers.RequestBodyHandler != nil {
				response, err = s.Handlers.RequestBodyHandler(req.GetRequestBody())
			}
		case req.GetResponseBody() != nil:
			if s.Handlers.ResponseBodyHandler != nil {
				response, err = s.Handlers.ResponseBodyHandler(req.GetResponseBody())
			}
		case req.GetRequestTrailers() != nil:
			if s.Handlers.RequestTrailersHandler != nil {
				response, err = s.Handlers.RequestTrailersHandler(req.GetRequestTrailers())
			}
		case req.GetResponseTrailers() != nil:
			if s.Handlers.ResponseTrailersHandler != nil {
				response, err = s.Handlers.ResponseTrailersHandler(req.GetResponseTrailers())
			}
		}

		if err != nil {
			return err
		}

		if response != nil {
			if err := stream.Send(response); err != nil {
				return err
			}
		}
	}
}

// HandleRequestHeaders handles request headers.
func (s *GRPCCalloutService) HandleRequestHeaders(headers *extproc.HttpHeaders) (*extproc.ProcessingResponse, error) {
	return &extproc.ProcessingResponse{
		Response: &extproc.ProcessingResponse_RequestHeaders{
			RequestHeaders: &extproc.HeadersResponse{},
		},
	}, nil
}

// HandleResponseHeaders handles response headers.
func (s *GRPCCalloutService) HandleResponseHeaders(headers *extproc.HttpHeaders) (*extproc.ProcessingResponse, error) {
	return &extproc.ProcessingResponse{
		Response: &extproc.ProcessingResponse_ResponseHeaders{
			ResponseHeaders: &extproc.HeadersResponse{},
		},
	}, nil
}

// HandleRequestBody handles request bodies.
func (s *GRPCCalloutService) HandleRequestBody(body *extproc.HttpBody) (*extproc.ProcessingResponse, error) {
	return &extproc.ProcessingResponse{
		Response: &extproc.ProcessingResponse_RequestBody{
			RequestBody: &extproc.BodyResponse{},
		},
	}, nil
}

// HandleResponseBody handles response bodies.
func (s *GRPCCalloutService) HandleResponseBody(body *extproc.HttpBody) (*extproc.ProcessingResponse, error) {
	return &extproc.ProcessingResponse{
		Response: &extproc.ProcessingResponse_ResponseBody{
			ResponseBody: &extproc.BodyResponse{},
		},
	}, nil
}

// HandleRequestTrailers handles request trailers.
func (s *GRPCCalloutService) HandleRequestTrailers(trailers *extproc.HttpTrailers) (*extproc.ProcessingResponse, error) {
	return &extproc.ProcessingResponse{
		Response: &extproc.ProcessingResponse_RequestTrailers{
			RequestTrailers: &extproc.TrailersResponse{},
		},
	}, nil
}

// HandleResponseTrailers handles response trailers.
func (s *GRPCCalloutService) HandleResponseTrailers(trailers *extproc.HttpTrailers) (*extproc.ProcessingResponse, error) {
	return &extproc.ProcessingResponse{
		Response: &extproc.ProcessingResponse_ResponseTrailers{
			ResponseTrailers: &extproc.TrailersResponse{},
		},
	}, nil
}
