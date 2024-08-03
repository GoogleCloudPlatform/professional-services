package cancelot

import (
	"bytes"
	"context"
	"log"
	"os/exec"
	"strings"

	"cloud.google.com/go/compute/metadata"
	"golang.org/x/oauth2/google"
	cloudbuild "google.golang.org/api/cloudbuild/v1"
)

// getProject gets the project ID.
func getProject() (string, error) {
	// Test if we're running on GCE.
	if metadata.OnGCE() {
		// Use the GCE Metadata service.
		projectID, err := metadata.ProjectID()
		if err != nil {
			log.Printf("Failed to get project ID from instance metadata")
			return "", err
		}
		return projectID, nil
	}
	// Shell out to gcloud.
	cmd := exec.Command("gcloud", "config", "get-value", "project")
	var out bytes.Buffer
	cmd.Stdout = &out
	err := cmd.Run()
	if err != nil {
		log.Printf("Failed to shell out to gcloud: %+v", err)
		return "", err
	}
	projectID := strings.TrimSuffix(out.String(), "\n")
	return projectID, nil
}

func gcbClient(ctx context.Context) *cloudbuild.Service {
	client, err := google.DefaultClient(ctx, cloudbuild.CloudPlatformScope)
	if err != nil {
		log.Fatalf("Caught error creating client: %v", err)
	}
	svc, err := cloudbuild.New(client)
	if err != nil {
		log.Fatalf("Caught error creating service: %v", err)
	}
	return svc
}
