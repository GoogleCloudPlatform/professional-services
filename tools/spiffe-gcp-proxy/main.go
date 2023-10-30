// Copyright 2022 Google LLC
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
	"bytes"
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/spiffe/go-spiffe/v2/svid/jwtsvid"
	"github.com/spiffe/go-spiffe/v2/workloadapi"
)

var (
	spiffeServerUrl  *string
	spiffeSocketPath *string
	audience         string
	serviceAccount   *string
	projectId        *string
	projectNumber    *string
	providerId       *string
	poolId           *string
	scope            *string
)

type AccessTokenRequest struct {
	GrantType          string `json:"grantType,omitempty"`
	Audience           string `json:"audience,omitempty"`
	Scope              string `json:"scope,omitempty"`
	RequestedTokenType string `json:"requestedTokenType,omitempty"`
	SubjectToken       string `json:"subjectToken,omitempty"`
	SubjectTokenType   string `json:"subjectTokenType,omitempty"`
	Options            string `json:"options,omitempty"`
}

type AccessTokenResponse struct {
	AccessToken     string `json:"access_token,omitempty"`
	ExpiresIn       int    `json:"expires_in,omitempty"`
	TokenType       string `json:"token_type,omitempty"`
	IssuedTokenType string `json:"issued_token_type,omitempty"`
}

type ServiceAccountTokenResponse struct {
	AccessToken string `json:"accessToken,omitempty"`
	ExpireTime  string `json:"expireTime,omitempty"`
}

func getToken(w http.ResponseWriter, req *http.Request) {
	spiffe_jwt, err := getSpiffeJwt()
	if err != nil {
		w.Write([]byte(fmt.Sprintf("Unable to obtain SPIFFE JWT token %v", err)))
		return
	}

	token := AccessTokenResponse{}
	err = getWorkloadIdentityFederationToken(spiffe_jwt, &token)
	if err != nil {
		w.Write([]byte(fmt.Sprintf("Unable to obtain GCP WIF token %v", err)))
		return
	}

	saToken := ServiceAccountTokenResponse{}
	err = impersonateIamServiceAccount(token.AccessToken, &saToken)
	if err != nil {
		w.Write([]byte(fmt.Sprintf("Unable to impersonate Service Accoun %v", err)))
		return
	}

	response := AccessTokenResponse{
		AccessToken: saToken.AccessToken,
		ExpiresIn:   getExpiresIn(saToken.ExpireTime),
		TokenType:   "Bearer"}
	responseBytes, err := json.Marshal(response)
	if err != nil {
		w.Write([]byte(fmt.Sprintf("Unable to marshal response body %v", err)))
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(responseBytes)
}

func getExpiresIn(expireTime string) int {
	layout := "2006-01-02T15:04:05Z"
	t, err := time.Parse(layout, expireTime)
	if err != nil {
		log.Printf("Couldn't parse expireTime %s\n", expireTime)
		return 0
	}
	start := time.Now()
	elapsed := t.Sub(start)
	return int(elapsed.Seconds())
}

func getSpiffeJwt() (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	clientOptions := workloadapi.WithClientOptions(workloadapi.WithAddr(*spiffeSocketPath))

	x509Source, err := workloadapi.NewX509Source(ctx, clientOptions)
	if err != nil {
		log.Printf("Unable to create X509 Source %v", err)
		return "", fmt.Errorf("unable_to_create_X509Source %v", err)
	}
	defer x509Source.Close()

	jwtSource, err := workloadapi.NewJWTSource(ctx, clientOptions)
	if err != nil {
		log.Printf("Unable to create JWT Source %v", err)
		return "", fmt.Errorf("unable_to_create_JWTSource: %v", err)
	}
	defer jwtSource.Close()

	svid, err := jwtSource.FetchJWTSVID(ctx, jwtsvid.Params{
		Audience: audience,
	})
	if err != nil {
		log.Printf("Failed fetchting JWT %v", err)
		return "", fmt.Errorf("unable_to_fetch_jwt")
	}
	return svid.Marshal(), nil
}

func getWorkloadIdentityFederationToken(spiffe_jwt string, token *AccessTokenResponse) error {
	tokenRequest := AccessTokenRequest{
		GrantType:          "urn:ietf:params:oauth:grant-type:token-exchange",
		Audience:           audience,
		Scope:              *scope,
		RequestedTokenType: "urn:ietf:params:oauth:token-type:access_token",
		SubjectToken:       spiffe_jwt,
		SubjectTokenType:   "urn:ietf:params:oauth:token-type:jwt",
	}
	body, err := json.Marshal(tokenRequest)
	if err != nil {
		log.Printf("Unable to marshal token request %v\n", err)
		return fmt.Errorf("unable_to_marshal_token_request")
	}
	resp, err := http.Post("https://sts.googleapis.com/v1/token", "application/json", bytes.NewBuffer(body))
	if err != nil {
		log.Printf("Unable to create token via API %v\n", err)
		return fmt.Errorf("post_to_sts_error")
	}
	if resp.StatusCode != 200 {
		buf := new(strings.Builder)
		_, err = io.Copy(buf, resp.Body)
		if err != nil {
			log.Println("Failed retrieving token from IAM, unable to read response body")
			return fmt.Errorf("failed_retrieving_token")
		}
		log.Printf("Unable to create token via API %s\n", buf)
		return fmt.Errorf("failed_retrieving_token")
	} else {
		defer resp.Body.Close()
		err = json.NewDecoder(resp.Body).Decode(token)
		if err != nil {
			log.Printf("Unable to unmarshal token response %v\n", err)
			return fmt.Errorf("failed_unmarshaling_token")
		}
		return nil
	}
}

func impersonateIamServiceAccount(wifToken string, token *ServiceAccountTokenResponse) error {
	body := []byte(fmt.Sprintf(`{
        "scope": [ "%s" ]
    }`, *scope))
	req, err := http.NewRequest("POST",
		fmt.Sprintf("https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/%s:generateAccessToken", *serviceAccount),
		bytes.NewBuffer(body))
	if err != nil {
		log.Printf("Unable to create request %v\n", err)
		return fmt.Errorf("failed_creating_token")
	}
	req.Header.Set("Content-Type", "text/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", wifToken))
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Printf("Unable to send request %v\n", err)
		return fmt.Errorf("failed_creating_token")
	}
	if resp.StatusCode != 200 {
		buf := new(strings.Builder)
		_, err = io.Copy(buf, resp.Body)
		if err != nil {
			log.Printf("Failed retrieving token from IAM, unable to read response body %v\n", err)
			return fmt.Errorf("failed_retrieving_token")
		}
		log.Printf("Failed retrieving token from IAM, %v\n", buf.String())
		return fmt.Errorf("failed_retrieving_token")
	} else {
		defer resp.Body.Close()
		err = json.NewDecoder(resp.Body).Decode(token)
		if err != nil {
			log.Printf("Unable to unmarshal token response %v\n", err)
			return fmt.Errorf("failed_marshaling_token")
		}
		return nil
	}
}

func getProjectId(w http.ResponseWriter, req *http.Request) {
	w.Write([]byte("spiffe-test"))
}

func getNumericProjectId(w http.ResponseWriter, req *http.Request) {
	w.Write([]byte("171831364345"))
}

func getEmail(w http.ResponseWriter, req *http.Request) {
	w.Write([]byte(*serviceAccount))
}

func getServiceAccounts(w http.ResponseWriter, req *http.Request) {
	w.Write([]byte(fmt.Sprintf("default/\n%s/", *serviceAccount)))
}

func getServiceAccount(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(fmt.Sprintf(`
	{
		"aliases": ["default"],
		"email":"%s",
		"scopes": [ "%s" ]
	}`, *serviceAccount, *scope)))
}

func main() {
	bindAddress := flag.String("bind", ":8080", "Bind address, for a production scenario this would be :80")
	spiffeServerUrl = flag.String("spiffe_url", "http://localhost:8081", "SPIFFE Server URL")

	spiffeSocketPath = flag.String("spiffe_agent_socket_path", "unix:///tmp/spire-agent/public/api.sock", "SPIFFE Agent Socket Path")
	serviceAccount = flag.String("service_account", "", "GCP IAM Service Account to impersonate (required)")
	projectId = flag.String("projectId", "", "GCP Project ID of the project to use (required)")
	projectNumber = flag.String("projectNumber", "", "GCP Project Number of the project to use (required)")
	providerId = flag.String("providerId", "", "Provider ID of the Workload Identity provider to use (required)")
	poolId = flag.String("poolId", "", "Pool ID of the Workload Identity Pool to use (required)")
	scope = flag.String("scope", "https://www.googleapis.com/auth/cloud-platform", "Scope to request from GCP, e.g. https://www.googleapis.com/auth/cloud-platform")
	flag.Parse()
	if *bindAddress == "" || *serviceAccount == "" || *spiffeServerUrl == "" || *spiffeSocketPath == "" || *projectId == "" || *projectNumber == "" || *poolId == "" || *providerId == "" || *scope == "" {
		flag.PrintDefaults()
		os.Exit(1)
	}
	audience = fmt.Sprintf("//iam.googleapis.com/projects/%s/locations/global/workloadIdentityPools/%s/providers/%s", *projectNumber, *poolId, *providerId)

	http.HandleFunc("/computeMetadata/v1/instance/service-accounts/default/token", getToken)
	http.HandleFunc(fmt.Sprintf("/computeMetadata/v1/instance/service-accounts/%s/token", *serviceAccount), getToken)
	http.HandleFunc("/computeMetadata/v1/project/numeric-project-id", getNumericProjectId)
	http.HandleFunc("/computeMetadata/v1/project/project-id", getProjectId)
	http.HandleFunc("/computeMetadata/v1/instance/service-accounts/default/email", getEmail)
	http.HandleFunc("/computeMetadata/v1/instance/service-accounts/", getServiceAccounts)
	http.HandleFunc(fmt.Sprintf("/computeMetadata/v1/instance/service-accounts/%s/", *serviceAccount), getServiceAccount)

	log.Fatalln("Running Server", http.ListenAndServe(*bindAddress, logRequest(http.DefaultServeMux)))
}

func logRequest(handler http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("%s %s %s\n", r.RemoteAddr, r.Method, r.URL)
		handler.ServeHTTP(w, r)
	})
}
