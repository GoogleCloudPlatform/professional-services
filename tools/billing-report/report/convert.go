// Copyright 2020 Google LLC
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

package report

import (
	"encoding/json"
	"strconv"

	"cloud.google.com/go/bigquery"
	"github.com/pkg/errors"
)

// valueToMapStringInterface uses JSON as an intermediary serialization to convert a BigQuery Value
// into map[string]interface{} value
func valueToMapStringInterface(from bigquery.Value) (map[string]interface{}, error) {
	jsn, err := json.Marshal(from)
	if err != nil {
		return nil, err
	}
	var to map[string]interface{}
	if err = json.Unmarshal(jsn, &to); err != nil {
		return nil, err
	}
	return to, nil

}

// interfaceToString uses JSON as an intermediary serialization to convert a protobuf message
// into an string value
func interfaceToString(from interface{}) (string, error) {
	jsn, err := json.Marshal(from)
	if err != nil {
		return "", errors.Wrap(err, "marshaling to json")
	}
	str, err := strconv.Unquote(string(jsn))
	if err != nil {
		// return original json string if it's not a quoted string
		return string(jsn), nil
	}
	return str, nil
}
