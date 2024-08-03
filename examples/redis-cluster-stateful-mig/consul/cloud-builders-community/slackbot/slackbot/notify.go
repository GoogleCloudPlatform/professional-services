package slackbot

import (
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"strings"
	"time"

	cloudbuild "google.golang.org/api/cloudbuild/v1"
)

// Notify posts a notification to Slack that the build is complete.
func Notify(b *cloudbuild.Build, webhook string, project string) {
	url := fmt.Sprintf("https://console.cloud.google.com/cloud-build/builds/%s", b.Id)
	var i string
	switch b.Status {
	case "WORKING":
		i = ":hammer:"
	case "SUCCESS":
		i = ":white_check_mark:"
	case "FAILURE":
		i = ":x:"
	case "CANCELLED":
		i = ":wastebasket:"
	case "TIMEOUT":
		i = ":hourglass:"
	case "STATUS_UNKNOWN", "INTERNAL_ERROR":
		i = ":interrobang:"
	default:
		i = ":question:"
	}

	// Ensure messages remain the same as before
	if project == "unknown" {
		project = ""
	}

	var msg string
	if b.Status == "WORKING" {
		msgFmt := `{
			"text": "%s *%s* build started",
			"attachments": [{
				"fallback": "Open build details at %s",
				"actions": [{
					"type": "button",
					"text": "Open details",
					"url": "%s"
				}]
			}]
		}`
		msg = fmt.Sprintf(msgFmt, i, project, url, url)
	} else {
		startTime, err := time.Parse(time.RFC3339, b.StartTime)
		if err != nil {
			log.Fatalf("Failed to parse Build.StartTime: %v", err)
		}
		finishTime, err := time.Parse(time.RFC3339, b.FinishTime)
		if err != nil {
			log.Fatalf("Failed to parse Build.FinishTime: %v", err)
		}
		buildDuration := finishTime.Sub(startTime).Truncate(time.Second)

		msgFmt := `{
			"text": "%s *%s* build _%s_ after _%s_",
			"attachments": [{
				"fallback": "Open build details at %s",
				"actions": [{
					"type": "button",
					"text": "Open details",
					"url": "%s"
				}]
			}]
		}`
		msg = fmt.Sprintf(msgFmt, i, project, b.Status, buildDuration, url, url)
	}

	r := strings.NewReader(msg)
	resp, err := http.Post(webhook, "application/json", r)
	if err != nil {
		log.Fatalf("Failed to post to Slack: %v", err)
	}
	defer resp.Body.Close()
	body, _ := ioutil.ReadAll(resp.Body)
	log.Printf("Posted message to Slack: [%v], got response [%s]", msg, body)
}
