// Copyright 2017 Google Inc.

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

// http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// This program is a web application that accepts a large POST request
// and returns a large response to demonstrate and test streaming
// data in a microservice. The web application optionally sets the
// X-Accel-Buffering header to no to avoid buffering to disk in the
// NGINX server used in Flex. For detai
package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
)

func main() {
	http.HandleFunc("/", home)
	http.HandleFunc("/_ah/health", healthCheckHandler)
	http.HandleFunc("/receiveandsend", receiveandsend)
	http.HandleFunc("/nobuffer", nobuffer)
	http.Handle("/static/", http.FileServer(http.Dir(".")))
	log.Print("Listening on port 8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func healthCheckHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "ok")
}

func home(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}
	fmt.Fprintf(w, "<h1>URLFetch Test Server</h1>"+
		"<p>Test wtih buffering:</p>"+
		"<form action='/receiveandsend' method='POST'>"+
		"<textarea name='somedata'>Some data</textarea><br>"+
		"<input type='submit' value='Send'>"+
		"</form>"+
		"<p>Test wtih no buffering:</p>"+
		"<form action='/nobuffer' method='POST'>"+
		"<textarea name='somedata'>Some data</textarea><br>"+
		"<input type='submit' value='Send'>"+
		"</form>")
}
// The web application optionally sets the X-Accel-Buffering header
// to 'no' to avoid buffering to disk in the NGINX server used in Flex.
// For details see
// https://cloud.google.com/appengine/docs/flexible/python/how-requests-are-handled#x-accel-buffering
func nobuffer(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("X-Accel-Buffering", "no")
	receiveandsend(w, r)
}

func receiveandsend(w http.ResponseWriter, r *http.Request) {
	// Read the data from request
	somedata := r.FormValue("somedata")
	log.Printf("Got : %d bytes", len(somedata))

	// Write some data to response
	file, err := os.Open("static/zeros700k.dat")
	if err != nil {
		log.Print("Error opeing file: %v", err)
	}
	data, err := ioutil.ReadAll(file)
	if err != nil {
		log.Print("Error reading file: %v", err)
	}

	if err != nil {
		log.Print("Error reading file: %v", err)
	}
	fmt.Fprintf(w, string(data))
	log.Print("Sent response")
}
