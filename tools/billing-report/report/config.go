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
	"io/ioutil"
)

// Config for billing report tool
type Config struct {
	Reports            []Report `json:"reports"`
	ControlProject     string   `json:"control_project"`
	BillingExportTable BqTable  `json:"billing_export_table"`
	OutputPath         string   `json:"output_path"`
}

// BqTable holding the billing export data
type BqTable struct {
	Project string `json:"project"`
	Dataset string `json:"dataset"`
	Table   string `json:"table"`
}

// Report configurations
type Report struct {
	Name    string    `json:"name"`
	Columns []Columns `json:"columns"`
}

// Columns of report
type Columns struct {
	RawColumnName  string `json:"raw_name"`
	NewColumnName  string `json:"name"`
	IsProjectLabel bool   `json:"is_project_label"`
	Value          string `json:"value"`
}

// Load report config
func loadReportConfig(configFile string) (*Config, error) {

	fileContent, err := ioutil.ReadFile(configFile)
	if err != nil {
		return nil, err
	}

	config := &Config{}
	err = json.Unmarshal([]byte(fileContent), config)
	if err != nil {
		return nil, err
	}

	Log.Debug("Config", "ControlProject", config.ControlProject)
	Log.Debug("Config", "BillingExportTable", config.BillingExportTable)
	Log.Debug("Config", "OutputPath", config.OutputPath)
	for _, r := range config.Reports {
		Log.Debug("Config Report", "Report name", r.Name)
		Log.Debug("Config Report", "Report Columns", r.Columns)
	}
	return config, nil
}
