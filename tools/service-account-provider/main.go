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
	"bytes"
	"context"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	"encoding/json"

	"github.com/s12v/go-jwks"
	"github.com/square/go-jose"

	"cloud.google.com/go/storage"
	"github.com/form3tech-oss/jwt-go"
	"golang.org/x/oauth2"
	"google.golang.org/api/impersonate"
	"google.golang.org/api/iterator"
	"gopkg.in/yaml.v3"
)

type Branch struct {
	Ref             string   `yaml:"ref"`
	ServiceAccounts []string `yaml:"service_accounts"`
	AllowedScopes   []string `yaml:"allowed_scopes"`
}

type Pipeline struct {
	Name                  string   `yaml:"name"`
	DefaultServiceAccount string   `yaml:"default_sa"`
	Branches              []Branch `yaml:"branches"`
}

type Config struct {
	Issuers []struct {
		Name    string `yaml:"name"`
		JwksUrl string `yaml:"jwks_url"`
	} `yaml:"issuers"`
	Pipelines []Pipeline `yaml:"pipelines"`
}

var config *Config

func main() {
	var err error
	var port int64
	if os.Getenv("PORT") != "" {
		port, err = strconv.ParseInt(os.Getenv("PORT"), 10, 64)
		if err != nil {
			log.Panicf("Can't parse value of PORT env variable %s %v", os.Getenv("PORT"), err)
		}
	} else {
		port = 8080
	}

	err = getConfig()
	if err != nil {
		fmt.Printf("Unable to read config %v", err)
		log.Panicf("Unable to read config %v", err)
	}
	go scheduleConfigRefresh()

	http.HandleFunc("/access", handler)
	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%d", port), nil))
}

func handler(w http.ResponseWriter, r *http.Request) {
	sa := r.URL.Query().Get("sa")
	scopesString := r.URL.Query().Get("scopes")
	if scopesString == "" {
		scopesString = "https://www.googleapis.com/auth/cloud-platform"
	}
	scopes := strings.Split(scopesString, ",")
	var err error
	var lifetime float64
	lifetimeString := r.URL.Query().Get("lifetime")
	if lifetimeString == "" {
		lifetime = 60
	} else {
		lifetime, err = strconv.ParseFloat(lifetimeString, 32)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			fmt.Fprintf(w, "%v", err)
			return
		}

	}
	jwt := r.Header.Get("Gitlab-Token")
	if jwt != "" {
		claims, err := validateJwtAndExtractClaims(jwt)
		if err != nil {
			w.WriteHeader(http.StatusUnauthorized)
			fmt.Fprintf(w, "The provided jwt is invalid %v", err)
			return
		}
		if sa == "" {
			pipeline, err := retrievePipeline(claims)
			if err != nil {
				w.WriteHeader(http.StatusNotFound)
				fmt.Fprintf(w, "no default SA for the project path defined %s, provide one via sa query attribute", claims.ProjectPath)
				return
			}

			sa = pipeline.DefaultServiceAccount

			if sa == "" {
				w.WriteHeader(http.StatusNotFound)
				fmt.Fprintf(w, "no default SA for the project path defined %s, provide one via sa query attribute", claims.ProjectPath)
				return
			}
		}

		if hasAccess(sa, claims) {
			token, err := getAccesToken(sa,
				scopes,
				time.Duration(lifetime)*time.Minute)
			if err != nil {
				w.WriteHeader(http.StatusBadRequest)
				fmt.Fprintf(w, "%v", err)
			} else {
				fmt.Fprintf(w, "%s", token.AccessToken)
			}
		} else {
			w.WriteHeader(http.StatusForbidden)
			fmt.Fprintf(w, "JWT not allowed to access sa")
		}
	} else {
		w.WriteHeader(http.StatusUnauthorized)
		fmt.Fprintf(w, "No jwt provided")
	}
}

func retrievePipeline(claims *GitlabClaims) (*Pipeline, error) {
	current := -1
	var currentPipeline *Pipeline
	for i := 0; i < len(config.Pipelines); i++ {
		if strings.HasPrefix(claims.ProjectPath, config.Pipelines[i].Name) {
			if current < len(config.Pipelines[i].Name) {
				current = len(config.Pipelines[i].Name)
				currentPipeline = &config.Pipelines[i]
			}
		}
	}

	if current == -1 {
		return nil, fmt.Errorf("no pipeline for project path %s", claims.ProjectPath)
	} else {
		return currentPipeline, nil
	}
}

func hasAccess(serviceAccount string, claims *GitlabClaims) bool {
	for i := 0; i < len(config.Pipelines); i++ {
		if strings.HasPrefix(claims.ProjectPath, config.Pipelines[i].Name) {
			for j := 0; j < len(config.Pipelines[i].Branches); j++ {
				if config.Pipelines[i].Branches[j].Ref == "*" || config.Pipelines[i].Branches[j].Ref == claims.Ref {
					if arrayContains(config.Pipelines[i].Branches[j].ServiceAccounts, serviceAccount) {
						return true
					}
				}
			}
		}
	}

	return false
}

func arrayContains(array []string, element string) bool {
	for _, ele := range array {
		if ele == element {
			return true
		}
	}
	return false
}

type GitlabClaims struct {
	NamespaceId   string `json:"namespace_id"`
	NamespacePath string `json:"namespace_path"`
	ProjectId     string `json:"project_id"`
	ProjectPath   string `json:"project_path"`
	UserId        string `json:"user_id"`
	UserLogin     string `json:"user_login"`
	UserEmail     string `json:"user_email"`
	PipelineId    string `json:"pipeline_id"`
	JobId         string `json:"job_id"`
	Ref           string `json:"ref"`
	RefType       string `json:"ref_type"`
	RefProtected  string `json:"ref_protected"`
	jwt.StandardClaims
}

func validateJwtAndExtractClaims(tokenString string) (*GitlabClaims, error) {
	log.Printf("token %v", tokenString)
	var claims jwt.Claims = &GitlabClaims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		claims, ok := token.Claims.(*GitlabClaims)
		if claims.RefProtected != "true" {
			return nil, fmt.Errorf("unprotected refs are not allowed to access service accounts ref=%s", claims.Ref)
		}

		if ok {
			for i := 0; len(config.Issuers) > i; i++ {
				if claims.Issuer == config.Issuers[i].Name {
					var jwksClient jwks.JWKSClient
					if strings.HasPrefix(config.Issuers[i].JwksUrl, "http") {
						jwksSource := jwks.NewWebSource(config.Issuers[i].JwksUrl)
						jwksClient = jwks.NewDefaultClient(
							jwksSource,
							time.Hour,    // Refresh keys every 1 hour
							12*time.Hour, // Expire keys after 12 hours
						)
					} else {
						jwksSource := NewFileSource(config.Issuers[i].JwksUrl)
						jwksClient = jwks.NewDefaultClient(
							jwksSource,
							time.Hour,    // Refresh keys every 1 hour
							12*time.Hour, // Expire keys after 12 hours
						)
					}

					var jwk *jose.JSONWebKey
					kid := token.Header["kid"]
					kidString := fmt.Sprintf("%v", kid)
					jwk, err := jwksClient.GetEncryptionKey(kidString)
					if err != nil {
						log.Fatal(err)
					}

					return jwk.Public().Key, nil
				}
			}
			return nil, fmt.Errorf("issuer not configured %s", claims.Issuer)

		}
		return nil, fmt.Errorf("token not okay %s", tokenString)
	})

	if claims, ok := token.Claims.(*GitlabClaims); ok && token.Valid {
		return claims, nil
	} else {
		return nil, err
	}
}

func getAccesToken(sa string, scopes []string, lifetime time.Duration) (*oauth2.Token, error) {
	ctx := context.Background()
	ts, err := impersonate.CredentialsTokenSource(ctx, impersonate.CredentialsConfig{
		TargetPrincipal: sa,
		Scopes:          scopes,
		Lifetime:        lifetime,
	})
	if err != nil {
		return nil, err
	}
	var token *oauth2.Token
	token, err = ts.Token()
	if err != nil {
		return nil, err
	}
	return token, nil
}

func getConfig() error {
	config = &Config{}
	configFileLocation := os.Getenv("GCS_CONFIG_LINK") // gs://bucketname/objectname
	if configFileLocation == "" {
		return fmt.Errorf("Environment Variable GCS_CONFIG_LINK not set")
	}
	u, err := url.Parse(configFileLocation)
	if err != nil {
		return fmt.Errorf("Environment Variable GCS_CONFIG_LINK not properly formated %v", err)
	}

	if u.Scheme == "gs" {
		ctx := context.Background()
		client, err := storage.NewClient(ctx)
		if err != nil {
			log.Fatal(err)
		}
		defer client.Close()

		query := &storage.Query{Prefix: u.Path[1:]}
		bucket := client.Bucket(u.Host)
		it := bucket.Objects(ctx, query)
		for {
			attrs, err := it.Next()
			if err == iterator.Done {
				break
			}
			if err != nil {
				log.Fatal(err)
			}
			log.Printf("Loading config %s", attrs.Name)
			rc, err := bucket.Object(attrs.Name).NewReader(ctx)
			if err != nil {
				return fmt.Errorf("Object(%q).NewReader: %v", attrs.Name, err)
			}
			defer rc.Close()
			dat, err := ioutil.ReadAll(rc)
			if err != nil {
				return fmt.Errorf("ioutil.ReadAll: %v", err)
			}
			var singleConfig Config
			err = yaml.Unmarshal(dat, &singleConfig)
			if err != nil {
				log.Fatalf("error parsing config file %s %v", attrs.Name, err)
			}

			mergeConfig(config, &singleConfig)

			//names = append(names, attrs.Name)
		}

		return nil
	} else {
		return fmt.Errorf("Schema of provided location unsupported (currently only gs://)")
	}

}

func mergeConfig(target *Config, source *Config) {
	target.Issuers = append(target.Issuers, source.Issuers...)

	for _, sourcePipeline := range source.Pipelines {
		merged := false
		for _, targetPipeline := range target.Pipelines {
			if targetPipeline.Name == sourcePipeline.Name {
				mergePipelines(&targetPipeline, &sourcePipeline)
				merged = true
			}
		}
		if !merged {
			target.Pipelines = append(target.Pipelines, sourcePipeline)
		}
	}
}

func mergePipelines(target *Pipeline, source *Pipeline) {
	target.DefaultServiceAccount = source.DefaultServiceAccount

	for _, sourceBranch := range source.Branches {
		merged := false
		for _, targetBranch := range target.Branches {
			if targetBranch.Ref == sourceBranch.Ref {
				mergeBranches(&targetBranch, &sourceBranch)
				merged = true
			}
		}
		if !merged {
			target.Branches = append(target.Branches, sourceBranch)
		}
	}
}

func mergeBranches(target *Branch, source *Branch) {
	target.AllowedScopes = append(target.AllowedScopes, source.AllowedScopes...)
	target.ServiceAccounts = append(target.ServiceAccounts, source.ServiceAccounts...)

}

/*
Refresh
*/
func scheduleConfigRefresh() {
	var err error
	configRefreshIntervalString := os.Getenv("CONFIG_REFRESH_INTERVAL")
	if configRefreshIntervalString == "0" || configRefreshIntervalString == "-1" {
		return
	} else {
		var configRefreshInterval int64 = 5
		if configRefreshIntervalString != "" {
			configRefreshInterval, err = strconv.ParseInt(configRefreshIntervalString, 0, 64)
			if err != nil {
				log.Panicf("Unable to parse config refresh interval %v", err)
			}
		}

		ticker := time.NewTicker(time.Duration(configRefreshInterval) * time.Minute)
		for {
			select {
			case <-ticker.C:
				getConfig()
			}
		}

	}
}

func NewFileSource(filePath string) *FileSource {
	return &FileSource{
		FilePath: filePath,
	}
}

type FileSource struct {
	FilePath string
}

func (s *FileSource) JSONWebKeySet() (*jose.JSONWebKeySet, error) {
	dat, err := ioutil.ReadFile(s.FilePath)
	if err != nil {
		return nil, err
	}

	jsonWebKeySet := new(jose.JSONWebKeySet)
	if err = json.NewDecoder(bytes.NewReader(dat)).Decode(jsonWebKeySet); err != nil {
		return nil, err
	}

	return jsonWebKeySet, err
}
