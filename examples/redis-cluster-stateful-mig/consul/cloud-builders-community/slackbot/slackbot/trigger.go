package slackbot

import (
	"context"
	"fmt"
	"log"
	"time"
	"strings"

	cloudbuild "google.golang.org/api/cloudbuild/v1"
)

// Trigger starts an independent watcher build.
func Trigger(ctx context.Context, projectId string, buildId string, webhook string, project string, copyName bool, copyTags bool, copyTimeout bool) {
	svc := gcbClient(ctx)
	watcherBuild := &cloudbuild.Build{
		Steps: []*cloudbuild.BuildStep{
			&cloudbuild.BuildStep{
				Name: "gcr.io/$PROJECT_ID/slackbot",
				Args: []string{
					fmt.Sprintf("--build=%s", buildId),
					fmt.Sprintf("--webhook=%s", webhook),
					fmt.Sprintf("--project=%s", project),
					"--mode=monitor",
				},
			},
		},
		Tags: []string{"slackbot"},
	}

	// the following options require loading the monitored build's details
	if copyName || copyTags || copyTimeout {
		getMonitoredBuild := svc.Projects.Builds.Get(projectId, buildId)
		monitoredBuild, err := getMonitoredBuild.Do()
		if err != nil {
			log.Fatalf("Failed to get monitored build: %v", err)
		}

		// replace watcher's BuildStep.Name with the value used by monitored build
		if copyName {
			log.Printf("copying monitored build slackbot step name")
			monitoredBuildSlackbotStep, err := GetSlackbotBuildStep(monitoredBuild)
			if err != nil {
				log.Fatalf("Failed to get slackbot step from monitored build: %v", err)
			}
			log.Printf("monitored build slackbot step name: %s", monitoredBuildSlackbotStep.Name)
			watcherBuild.Steps[0].Name = fmt.Sprintf("%s", monitoredBuildSlackbotStep.Name)
			log.Printf("watcher build slackbot step name: %s", watcherBuild.Steps[0].Name)
		}

		// append tags used by monitored build to watcher's BuildStep.Tags
		if copyTags {
			log.Printf("copying monitored build Tags")
			log.Printf("monitored build Tags: %s", strings.Join(monitoredBuild.Tags, ", "))
			watcherBuild.Tags = append(watcherBuild.Tags, monitoredBuild.Tags...)
			log.Printf("watcher build Tags: %s", strings.Join(watcherBuild.Tags, ", "))
		}

		// set watcher's BuildStep.Timeout to value used by monitored build + error margin
		if copyTimeout {
			log.Printf("copying monitored build Timeout")
			log.Printf("monitored build Timeout: %s", monitoredBuild.Timeout)
			monitoredBuildTimeoutDuration, err := time.ParseDuration(monitoredBuild.Timeout)
			if err != nil {
				log.Fatalf("Failed to parse duration from monitored build's Timeout: %v", err)
			}
			watcherBuildTimeoutDuration := monitorErrorMarginDuration + monitoredBuildTimeoutDuration
			watcherBuild.Timeout = fmt.Sprintf("%ds", int(watcherBuildTimeoutDuration.Seconds()))
			log.Printf("watcher build Timeout: %s", watcherBuild.Timeout)
		}
	}

	createWatcherBuild := svc.Projects.Builds.Create(projectId, watcherBuild)
	_, err := createWatcherBuild.Do()
	if err != nil {
		log.Fatalf("Failed to create watcher build: %v", err)
	} else {
		log.Printf("Triggered watcher build.")
	}
}
