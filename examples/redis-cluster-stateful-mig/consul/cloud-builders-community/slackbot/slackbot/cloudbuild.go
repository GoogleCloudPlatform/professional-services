package slackbot

import (
	"bytes"
	"context"
	"log"
	"os/exec"
	"strings"
	"errors"

	"cloud.google.com/go/compute/metadata"
	"golang.org/x/oauth2/google"
	cloudbuild "google.golang.org/api/cloudbuild/v1"
)

// getProject gets the project ID.
func GetProject() (string, error) {
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

// hasRequiredSlackbotArgs tests a slice of strings (e.g., BuildStep.Args[]) for references to slackbot's required arguments: "--build", "--webhook"
func hasRequiredSlackbotArgs(args []string) bool {
	hasBuildArg := false
	hasWebhookArg := false

	log.Printf("%s", args)
	for _, arg := range args {
		if strings.Contains(arg, "--build") {
			hasBuildArg = true
			continue
		}

		if strings.Contains(arg, "--webhook") {
			hasWebhookArg = true
			continue
		}

		// end one iteration (worst case) after both flags have been found
		if hasBuildArg && hasWebhookArg {
			break
		}
	}

	if !hasBuildArg {
		return false
	}

	if !hasWebhookArg {
		return false
	}

	return true
}

// isSlackbotStep tests a given BuildStep to determine whether it appears to be executing slackbot
func isSlackbotStep(step *cloudbuild.BuildStep) bool {
	// Step.Name must contain "slackbot"
	if !strings.Contains(step.Name, "slackbot") {
		return false
	}

	// Step.Args must contain slackbot's required flags
	if !hasRequiredSlackbotArgs(step.Args) {
		return false
	}

	return true
}

// GetSlackbotBuildStep returns the BuildStep for the first slackbot step it finds; if none are found, it returns an error
func GetSlackbotBuildStep(build *cloudbuild.Build) (step *cloudbuild.BuildStep, err error){
	for _, s := range build.Steps {
		if isSlackbotStep(s) {
			step = s
			break
		}
	}

	if step == nil {
		err = errors.New("step not found: no slackbot related BuildStep found")
	}

	return step, err
}