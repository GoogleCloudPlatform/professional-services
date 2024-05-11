package cancelot

import (
	"context"
	"fmt"
	"log"

	"github.com/avast/retry-go"
	cloudbuild "google.golang.org/api/cloudbuild/v1"
)

// CancelPreviousBuild checks for previous running builds on the same branch, in order to cancel them
func CancelPreviousBuild(ctx context.Context, currentBuildID string, branchName string, sameTriggerOnly bool) {
	err := retry.Do(
		func() error {
			err := cancelPreviousBuild(ctx, currentBuildID, branchName, sameTriggerOnly)
			if err != nil {
				log.Printf("Will retry -- %v", err)
			}
			return err
		},
	)
	if err != nil {
		log.Fatalf("Failed even after retries")
	}
}

func cancelPreviousBuild(ctx context.Context, currentBuildID string, branchName string, sameTriggerOnly bool) error {
	svc := gcbClient(ctx)
	project, err := getProject()
	if err != nil {
		return fmt.Errorf("cancelPreviousBuild: Failed to get project: %v", err)
	}

	log.Printf("Going to fetch current build details for: %s", currentBuildID)

	currentBuildResponse, currentBuildError := svc.Projects.Builds.Get(project, currentBuildID).Do()
	if currentBuildError != nil {
		return fmt.Errorf("cancelPreviousBuild: Failed to get build details from Cloud Build: %v", currentBuildError)
	}

	log.Printf("Going to check ongoing jobs for branch: %s", branchName)

	onGoingJobFilter := fmt.Sprintf(`
		build_id != "%s" AND 
		source.repo_source.branch_name = "%s" AND 
		status = "WORKING" AND 
		start_time<"%s"`,
		currentBuildID,
		branchName,
		currentBuildResponse.StartTime)

	if sameTriggerOnly {
		onGoingJobFilter = fmt.Sprintf(`
		%s AND
		trigger_id = "%s"`,
			onGoingJobFilter,
			currentBuildResponse.BuildTriggerId)
	}

	log.Printf("Builds filter created: %s", onGoingJobFilter)

	onGoingBuildsResponse, onGoingBuildsError := svc.Projects.Builds.List(project).Filter(onGoingJobFilter).Do()

	if onGoingBuildsError != nil {
		return fmt.Errorf("cancelPreviousBuild: Failed to get builds from Cloud Build: %v", onGoingBuildsError)
	}

	onGoingBuilds := onGoingBuildsResponse.Builds
	numOfOnGoingBuilds := len(onGoingBuilds)

	if sameTriggerOnly {
		log.Printf("Ongoing builds triggered by %s for %s has size of: %d", currentBuildResponse.BuildTriggerId, branchName, numOfOnGoingBuilds)
	} else {
		log.Printf("Ongoing builds for %s has size of: %d", branchName, numOfOnGoingBuilds)
	}

	if numOfOnGoingBuilds == 0 {
		return nil
	}

	for _, build := range onGoingBuilds {
		log.Printf("Going to cancel build with id: %s", build.Id)

		cancelBuildCall := svc.Projects.Builds.Cancel(project, build.Id, &cloudbuild.CancelBuildRequest{})
		buildCancelResponse, buildCancelError := cancelBuildCall.Do()

		if buildCancelError != nil {
			return fmt.Errorf("cancelPreviousBuild: Failed to cancel build with id:%s - %v", build.Id, buildCancelError)
		}

		log.Printf("Cancelled build with id:%s", buildCancelResponse.Id)
	}

	return nil
}
