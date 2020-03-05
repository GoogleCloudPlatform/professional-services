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
	"context"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"

	"cloud.google.com/go/bigquery"
	"github.com/pkg/errors"
	"google.golang.org/api/iterator"
)

// Row of report output
type Row struct {
	data map[string]interface{}
}

func constructReportQuery(report *Report, table string, month string) (string, error) {
	query := ""
	selectStr := "to_json_string(project.labels) as labels"
	groupByStr := "to_json_string(project.labels)"

	for _, c := range report.Columns {
		if c.RawColumnName == "cost" {
			if c.NewColumnName == "" {
				selectStr = fmt.Sprintf("%s, SUM(cost) + SUM(IFNULL((SELECT SUM(c.amount) FROM UNNEST(credits) c), 0)) AS cost", selectStr)
			} else {
				selectStr = fmt.Sprintf("%s, SUM(cost) + SUM(IFNULL((SELECT SUM(c.amount) FROM UNNEST(credits) c), 0)) AS `%s`", selectStr, c.NewColumnName)
			}
			continue
		}
		if c.IsProjectLabel == true {
			continue
		}
		if c.RawColumnName != "" && c.Value != "" {
			return "", fmt.Errorf("Error constructing query for report " + report.Name + ", raw_name and value cannot be defined at the same time for " + fmt.Sprint(c))
		}
		if c.Value != "" {
			selectStr = fmt.Sprintf("%s, \"%s\" as `%s`", selectStr, c.Value, c.NewColumnName)
		}
		if c.RawColumnName != "" {
			selectStr = fmt.Sprintf("%s, %s", selectStr, c.RawColumnName)
			if c.NewColumnName != "" {
				selectStr = fmt.Sprintf("%s as `%s`", selectStr, c.NewColumnName)
			}
			groupByStr = fmt.Sprintf("%s, %s", groupByStr, c.NewColumnName)

		}
	}
	query = fmt.Sprintf("SELECT %s FROM `%s` WHERE invoice.month = '%s' GROUP BY %s",
		selectStr, table, month, groupByStr)
	return query, nil
}

func outputReport(report *Report, rows []bigquery.Value, month string, outputPath string) error {
	var dest io.Writer
	dest, err := os.Create(filepath.Join(outputPath, report.Name+"-"+month+".csv"))
	if err != nil {
		return err
	}
	w := csv.NewWriter(dest)
	header := []string{}
	for _, c := range report.Columns {
		if c.NewColumnName != "" {
			header = append(header, c.NewColumnName)
		} else {
			header = append(header, c.RawColumnName)
		}
	}
	Log.Debug("Output", "header", header)
	w.Write(header)
	w.Flush()
	Log.Debug("Output", "length of rows", len(rows))
	for _, row := range rows {
		record := []string{}
		rawRecord, err := valueToMapStringInterface(row)
		if err != nil {
			return err
		}
		var rawLabels []map[string]interface{}
		err = json.Unmarshal([]byte(rawRecord["labels"].(string)), &rawLabels)
		if err != nil {
			return err
		}
		Log.Debug("Report", "project id", rawRecord, "labels", rawLabels)
		for _, c := range report.Columns {
			if !c.IsProjectLabel {
				str, _ := interfaceToString(rawRecord[c.NewColumnName])
				record = append(record, str)
			} else {
				found := false
				for _, l := range rawLabels {
					if l["key"] == c.RawColumnName {
						record = append(record, l["value"].(string))
						found = true
						continue
					}
				}
				if !found {
					record = append(record, "")
				}
			}
		}

		w.Write(record)
		w.Flush()
	}
	return nil
}

func getReportData(ctx context.Context, bq *bigquery.Client, query string) ([]bigquery.Value, error) {
	q := bq.Query(query)

	iter, err := q.Read(ctx)
	if err != nil {
		return nil, err
	}
	var rows []bigquery.Value
	for {
		var page map[string]bigquery.Value
		err := iter.Next(&page)
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, err
		}

		rows = append(rows, page)
	}
	return rows, nil
}
func generateReports(config *Config, month string) error {
	ctx := context.Background()
	bq, err := bigquery.NewClient(ctx, config.ControlProject)
	if err != nil {
		return errors.Wrap(err, "Initializing BigQuery client")
	}
	defer bq.Close()
	table := config.BillingExportTable.Project + "." + config.BillingExportTable.Dataset + "." + config.BillingExportTable.Table
	Log.Debug("Config", "BQ Export Table", table)
	for _, r := range config.Reports {
		query, err := constructReportQuery(&r, table, month)
		if err != nil {
			return errors.Wrap(err, "Construct report query")
		}
		Log.Debug("Report", "Name", r.Name, "BQ Query", query)

		rows, err := getReportData(ctx, bq, query)
		if err != nil {
			return errors.Wrap(err, "Get report data")
		}
		err = outputReport(&r, rows, month, config.OutputPath)
		if err != nil {
			return errors.Wrap(err, "Print output")
		}
	}
	return nil
}
