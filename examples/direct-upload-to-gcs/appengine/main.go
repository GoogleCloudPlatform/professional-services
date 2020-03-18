// Copyright 2019 Google Inc.
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
	"context"
	"encoding/base64"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"cloud.google.com/go/storage"
	"github.com/google/uuid"
	"golang.org/x/oauth2/google"
	iam "google.golang.org/api/iam/v1"
)

var (
	// iamService is a client for calling the signBlob API.
	iamService *iam.Service

	// serviceAccountName represents Service Account Name.
	// See more details: https://cloud.google.com/iam/docs/service-accounts
	serviceAccountName string

	// serviceAccountID follows the below format.
	// "projects/%s/serviceAccounts/%s"
	serviceAccountID string

	// uploadableBucket is the destination bucket.
	// All users will upload files directly to this bucket by using generated Signed URL.
	uploadableBucket string
)

func signHandler(w http.ResponseWriter, r *http.Request) {
	// Accepts only POST method.
	// Otherwise, this handler returns 405.
	if r.Method != "POST" {
		w.Header().Set("Allow", "POST")
		http.Error(w, "Only POST is supported", http.StatusMethodNotAllowed)
		return
	}

	ct := r.FormValue("content_type")
	if ct == "" {
		http.Error(w, "content_type must be set", http.StatusBadRequest)
		return
	}

	// Generates an object key for use in new Cloud Storage Object.
	// It's not duplicate with any object keys because of UUID.
	key := uuid.New().String()
	if ext := r.FormValue("ext"); ext != "" {
		key += fmt.Sprintf(".%s", ext)
	}

	// Generates a signed URL for use in the PUT request to GCS.
	// Generated URL should be expired after 15 mins.
	url, err := storage.SignedURL(uploadableBucket, key, &storage.SignedURLOptions{
		GoogleAccessID: serviceAccountName,
		Method:         "PUT",
		Expires:        time.Now().Add(15 * time.Minute),
		ContentType:    ct,
		// To avoid management for private key, use SignBytes instead of PrivateKey.
		// In this example, we are using the `iam.serviceAccounts.signBlob` API for signing bytes.
		// If you hope to avoid API call for signing bytes every time,
		// you can use self hosted private key and pass it in Privatekey.
		SignBytes: func(b []byte) ([]byte, error) {
			resp, err := iamService.Projects.ServiceAccounts.SignBlob(
				serviceAccountID,
				&iam.SignBlobRequest{BytesToSign: base64.StdEncoding.EncodeToString(b)},
			).Context(r.Context()).Do()
			if err != nil {
				return nil, err
			}
			return base64.StdEncoding.DecodeString(resp.Signature)
		},
	})
	if err != nil {
		log.Printf("sign: failed to sign, err = %v\n", err)
		http.Error(w, "failed to sign by internal server error", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
	fmt.Fprintln(w, url)
}

func main() {
	cred, err := google.DefaultClient(context.Background(), iam.CloudPlatformScope)
	if err != nil {
		log.Fatal(err)
	}
	iamService, err = iam.New(cred)
	if err != nil {
		log.Fatal(err)
	}

	uploadableBucket = os.Getenv("UPLOADABLE_BUCKET")
	serviceAccountName = os.Getenv("SERVICE_ACCOUNT")
	serviceAccountID = fmt.Sprintf(
		"projects/%s/serviceAccounts/%s",
		os.Getenv("GOOGLE_CLOUD_PROJECT"),
		serviceAccountName,
	)

	http.HandleFunc("/sign", signHandler)
	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%s", os.Getenv("PORT")), nil))
}
