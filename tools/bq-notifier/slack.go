// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// This code is a prototype and not engineered for production use.
// Error handling is incomplete or inappropriate for usage beyond
// a development sample.

package bqnotifier

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

// Please note: this is an example and hasn't been fully tested.
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
