// Post build status results to Slack.

package main

import (
	"context"
	"flag"
	"log"

	"./cancelot"
)

var (
	currentBuildID  = flag.String("current_build_id", "", "The current build id, in order to be excluded")
	branchName      = flag.String("branch_name", "", "BranchName to cancel previous ongoing jobs on")
	sameTriggerOnly = flag.Bool("same_trigger_only", false, "Only cancel ongoing builds triggered by the same trigger as current_build_id")
)

func main() {
	log.Print("Starting cancelot")
	flag.Parse()
	ctx := context.Background()

	if *currentBuildID == "" {
		log.Fatalf("currentBuildID must be provided.")
	}

	if *branchName == "" {
		log.Fatalf("BranchName must be provided.")
	}

	cancelot.CancelPreviousBuild(ctx, *currentBuildID, *branchName, *sameTriggerOnly)
	return
}
