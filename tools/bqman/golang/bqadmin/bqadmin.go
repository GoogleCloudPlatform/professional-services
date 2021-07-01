/*
Copyright 2020 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"cloud.google.com/go/bigquery"
	"github.com/alecthomas/kingpin"
)

var (
	app       = kingpin.New("bqadmin", "A command-line BigQuery schema forward/reverse engineering tool.")
	projectID = app.Flag("project", "GCP Project ID").Required().String()
	destroy   = app.Command("destroy", "Delete BigQuery dataset WITH CONTENTS; Needs --project=PROJECT_ID --dataset=DATASET")
	datasetID = destroy.Flag("dataset", "BigQuery Dataset").Required().String()
	ctx       = context.Background()
)

func showCommandInfo() {
	fmt.Printf("ProjectID: %s\n", *projectID)
	fmt.Printf("DatasetID: %s\n", *datasetID)
}

func checkError(err error, str string) {
	if err != nil {
		log.Printf("Error Summary: %s\n", str)
		log.Printf("Error Detail: %s\n", err)
		os.Exit(2)
	}
}

// CheckDatasetExists returns true if a given dataset exists
func CheckDatasetExists(client *bigquery.Client, datasetID string) (bool, error) {
	log.Printf("CheckDatasetExists(%s) executing", datasetID)
	_, err := client.Dataset(datasetID).Metadata(ctx)
	if err != nil {
		return false, err
	}
	log.Printf("%s: Dataset exists", datasetID)
	log.Printf("CheckDatasetExists(%s) completed", datasetID)
	return true, nil
}

// DestroyDataset is used to delete a non-empty dataset
func DestroyDataset(client *bigquery.Client, datasetID string) {
	log.Printf("DestroyDataset(%s) executing", datasetID)
	err := client.Dataset(datasetID).DeleteWithContents(ctx)
	checkError(err, fmt.Sprintf("%s Dataset deletion with contents failed", datasetID))
	log.Printf("DestroyDataset(%s) completed", datasetID)
}

func main() {
	switch kingpin.MustParse(app.Parse(os.Args[1:])) {
	case destroy.FullCommand():
		showCommandInfo()
		client, err := bigquery.NewClient(ctx, *projectID)
		checkError(err, "Unable to create BigQuery service!")
		datasetExists, err := CheckDatasetExists(client, *datasetID)
		checkError(err, fmt.Sprintf("CheckDatasetExists() failed", *&datasetID))
		if datasetExists {
			DestroyDataset(client, *datasetID)
		}
	}
}
