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
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"

	"cloud.google.com/go/storage"
	"github.com/gofiber/fiber/v2"
)

func GetTerraformDiscovery(c *fiber.Ctx) error {
	return c.Status(200).JSON(&fiber.Map{
		"providers.v1": "/terraform/providers/v1/",
	})
}

func GetTerraformVersions(c *fiber.Ctx) error {
	dat, err := os.ReadFile("/terraform/ipam-autopilot/ipam/versions")
	if err != nil {
		return err
	}

	return c.Status(200).Send(dat)
}

// /ipam-autopilot/ipam/:version/download/:os/:arch
func GetTerraformVersionDownload(c *fiber.Ctx) error {
	version := c.Params("version")
	osVariable := c.Params("os")
	arch := c.Params("arch")

	dat, err := os.ReadFile(fmt.Sprintf("/terraform/ipam-autopilot/ipam/%s/download/%s/%s", version, osVariable, arch))
	if err != nil {
		return err
	}
	v := Version{}
	if err := json.Unmarshal(dat, &v); err != nil {
		return err
	}

	v.Download_url, err = getSigningUrl(v.Download_url)
	if err != nil {
		fmt.Printf("Failed signing urls %v", err)
		return c.Status(400).JSON(&fiber.Map{
			"success": false,
			"message": fmt.Sprintf("Bad format %v", err),
		})
	}

	v.Shasums_url, err = getSigningUrl(v.Shasums_url)
	if err != nil {
		fmt.Printf("Failed signing urls %v", err)
		return c.Status(400).JSON(&fiber.Map{
			"success": false,
			"message": fmt.Sprintf("Bad format %v", err),
		})
	}

	v.Shasums_signature_url, err = getSigningUrl(v.Shasums_signature_url)
	if err != nil {
		fmt.Printf("Failed signing urls %v", err)
		return c.Status(400).JSON(&fiber.Map{
			"success": false,
			"message": fmt.Sprintf("Bad format %v", err),
		})
	}

	dat, err = json.Marshal(v)
	if err != nil {
		return err
	}
	return c.Status(200).Send(dat)
}

func getSigningUrl(objectName string) (string, error) {
	expires := time.Now().Add(time.Hour * 24)
	ctx := context.Background()
	storageClient, err := storage.NewClient(ctx)
	if err != nil {
		return "", err
	}

	s, err := storageClient.Bucket(os.Getenv("STORAGE_BUCKET")).SignedURL(objectName, &storage.SignedURLOptions{
		Method:  http.MethodGet,
		Expires: expires,
	})
	if err != nil {
		return "", err
	}

	return s, nil
}

type GpgPublicKey struct {
	Key_id          string `json:"key_id"`
	Ascii_armor     string `json:"ascii_armor"`
	Trust_signature string `json:"trust_signature"`
	Source          string `json:"source"`
	Source_url      string `json:"source_url"`
}

type SigningKeys struct {
	GpgPublicKeys []GpgPublicKey `json:"gpg_public_keys"`
}

type Version struct {
	Protocols             []string    `json:"protocols"`
	Os                    string      `json:"os"`
	Arch                  string      `json:"arch"`
	Version               string      `json:"version"`
	Filename              string      `json:"filename"`
	Download_url          string      `json:"download_url"`          // convert
	Shasums_url           string      `json:"shasums_url"`           // convert
	Shasums_signature_url string      `json:"shasums_signature_url"` // convert
	Shasum                string      `json:"shasum"`
	Signing_keys          SigningKeys `json:"signing_keys"`
}
