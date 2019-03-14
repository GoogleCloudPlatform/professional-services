package bqnotifier

// This code is a prototype and not engineered for production use.
// Error handling is incomplete or inappropriate for usage beyond
// a development sample.


import (
	"bytes"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"
)

const (
	successColor = "#7CD197"
	errorColor = "#F35A00"
	slackFmt = "https://hooks.slack.com/services/%s/%s/%s"
	tokenSplit = "-"

)

func SlackNotify(job Job, _ interface{}) error {
	labels := job.Labels()
	if token, ok := labels["bqnlabel"]; ok {
		tokens := strings.Split(token, tokenSplit)
		if len(tokens) != 3 {
			return errors.New(fmt.Sprintf("Invalid token format, recieved %s", token))
		}
		var color string
		if job.IsError() {
			color = errorColor
		} else {
			color = successColor
		}
		jsonStr := []byte(fmt.Sprintf(`
			{"attachments":[{"text": "<%s|%s> completed","color":"%s"}]}
		`,job.ConsoleURL(), job.String(), color))
		postUrl := fmt.Sprintf(slackFmt, tokens[0], tokens[1], tokens[2])
		req, err := http.NewRequest("POST", postUrl, bytes.NewBuffer(jsonStr))
		if err != nil {
			return err
		}
		req.Header.Set("Content-Type","application/json")
		resp, err := httpClient.Do(req)
		if err != nil {
			return err
		}
		if resp.StatusCode != 200 {
			b, _ := ioutil.ReadAll(resp.Body)
			return errors.New(fmt.Sprintf(
				"Error posting to slack url, non 200 code of %d found posting to url: %s, response: %s",
				resp.StatusCode, postUrl, b))
		}
		return nil
	}
	return nil
}
