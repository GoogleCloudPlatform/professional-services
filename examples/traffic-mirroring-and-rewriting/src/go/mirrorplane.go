// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
package main

import (
	"context"
	"io"
	"log"
	"net"
	"net/http"
	"net/url"
	"os"
	"runtime"
	"time"
)

var backend *url.URL

func pre(r *http.Request) {
	log.Printf("incoming request: %+v", r)

	r.Header.Add("injected-header", "I injected this header!")
	r.URL.Scheme = "http"
	r.URL.Host = backend.Host

	log.Printf("transformed request: %+v", r)
}

func post(r *http.Response) {
	log.Printf("mirror backend response: %+v", r)
}

func main() {
	port := ""
	if r := os.Getenv("PORT"); r == "" {
		log.Fatal("no PORT environment variable found (eg. :8000)")
	} else {
		port = r
	}
	if r := os.Getenv("MIRROR_BACKEND"); r == "" {
		log.Fatal("no MIRROR_BACKEND environment variable found (eg. http://backend:9000)")
	} else {
		parsed, err := url.Parse(r)
		if err != nil {
			log.Fatal("backend url could not be parsed")
		}
		backend = parsed
	}

	http.DefaultTransport.(*http.Transport).MaxIdleConns = 1000000
	http.DefaultTransport.(*http.Transport).MaxIdleConnsPerHost = 1000000
	http.DefaultTransport.(*http.Transport).MaxConnsPerHost = 0
	runtime.GOMAXPROCS(runtime.NumCPU())

	http.HandleFunc("/healthz", Health)
	http.HandleFunc("/", ServeHTTP)
	log.Fatal(http.ListenAndServe(port, nil))
}

func Health(rw http.ResponseWriter, req *http.Request) {
	io.WriteString(rw, "OK")
}

func ServeHTTP(rw http.ResponseWriter, req *http.Request) {
	// based on https://golang.org/src/net/http/httputil/reverseproxy.go
	transport := &http.Transport{
		DialContext: (&net.Dialer{
			Timeout:   2 * time.Second,
			KeepAlive: 2 * time.Second,
			DualStack: true,
		}).DialContext,
		ForceAttemptHTTP2:     true,
		MaxIdleConns:          1000000,
		IdleConnTimeout:       1 * time.Second,
		TLSHandshakeTimeout:   1 * time.Second,
		ExpectContinueTimeout: 1 * time.Second,
	}

	outreq := req.Clone(context.Background())
	io.WriteString(rw, "OK")

	if req.ContentLength == 0 {
		outreq.Body = nil // Issue 16036: nil Body for http.Transport retries
	}

	go func() {
		pre(outreq)
		outreq.Close = false
		res, err := transport.RoundTrip(outreq)
		if err != nil {
			log.Print(err)
			return
		}
		post(res)
	}()

}
