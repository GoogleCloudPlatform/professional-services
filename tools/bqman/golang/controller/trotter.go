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

package controller

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	bigquery "cloud.google.com/go/bigquery"
	"github.com/GoogleCloudPlatform/bqman/bqhandler"
	"github.com/GoogleCloudPlatform/bqman/configparser"
	"github.com/GoogleCloudPlatform/bqman/executionmode"
	"github.com/GoogleCloudPlatform/bqman/gcshandler"
	"github.com/GoogleCloudPlatform/bqman/projecthandler"
	"github.com/GoogleCloudPlatform/bqman/util"
	"google.golang.org/api/iterator"
)

// FilterCriteria is used to hold BigQuery table and column filter criteria
type FilterCriteria struct {
	ProjectID string
	DatasetID string
	BqTable   string
	BqColumn  string
}

// RuntimeParameters is used to hold values that are used during program
// execution
type RuntimeParameters struct {
	Timestamp         string
	Mode              executionmode.ExecutionMode
	CacheDirPath      string
	RuntimePath       string
	LogDirPath        string
	SchemaDirPath     string
	LogFile           string
	JSONFile          string
	LogFileHandle     *os.File
	Ctx               context.Context
	BqHandler         *bqhandler.BigQueryHandler
	GcsHandler        *gcshandler.CloudStorageHandler
	ConfigFile        string
	CfgParser         *configparser.ConfigParser
	Location          string
	Quiet             bool
	SpreadsheetID     string
	SheetTitle        string
	SheetRange        string
	SQLServerName     string
	SQLServerPort     int
	SQLServerUser     string
	SQLServerPassword string
	SQLServerDatabase string
}

// GcpAssets is used to hold BigQuery dataset info
type GcpAssets struct {
	Projects []string
	Datasets []bqhandler.BqDataset
}

// Trotter is used to hold filter criteria and runtime parameters
type Trotter struct {
	Assets     *GcpAssets
	Criteria   *FilterCriteria
	Parameters *RuntimeParameters
}

const (
	gcpCallTimeout = 30 * time.Second
)

// Validate is used to confirm that all pre-conditions are met
func (t *Trotter) Validate() {
	log.Printf("Trotter.Validate() executing.")
	tm := time.Now()
	t.Parameters.Timestamp = fmt.Sprintf("%d%02d%02dT%02d%02d%02d",
		tm.Year(), tm.Month(), tm.Day(),
		tm.Hour(), tm.Minute(), tm.Second())
	operation := fmt.Sprint(t.Parameters.Mode)
	t.Parameters.RuntimePath = fmt.Sprintf("%s/%s/%s/%s", t.Parameters.CacheDirPath, t.Criteria.ProjectID, t.Criteria.DatasetID, operation)
	t.Parameters.LogDirPath = fmt.Sprintf("%s/history/%s", t.Parameters.RuntimePath, t.Parameters.Timestamp)
	t.Parameters.SchemaDirPath = fmt.Sprintf("%s/current", t.Parameters.RuntimePath)
	dirStatus := make(map[string]bool)
	dirStatus[t.Parameters.LogDirPath] = util.CheckDir(t.Parameters.LogDirPath, util.CheckDirAndCreate)
	if t.Parameters.Mode == executionmode.PullMode {
		dirStatus[t.Parameters.SchemaDirPath] = util.CheckDir(t.Parameters.SchemaDirPath, util.CheckDirAndCreate)
	}
	missingDirectories := make([]string, 0)
	for k, v := range dirStatus {
		if !v {
			missingDirectories = append(missingDirectories, k)
		}
	}
	if len(missingDirectories) > 0 {
		util.ShowStringArray(missingDirectories, "The following directories , err = bqHandler.GetBigqueryTables(t.Parameters.Ctx, t.Criteria.ProjectID, dataset.DatasetID)don't exist!")
		os.Exit(2)
	}
	log.Printf("Trotter.Validate() completed")
}

func (t *Trotter) initLogging() {
	//log.Printf("Trotter.initLogging() starting.")

	t.Parameters.LogFile = fmt.Sprintf("%s/bqman-%s.log", t.Parameters.LogDirPath, t.Parameters.Timestamp)
	t.Parameters.JSONFile = fmt.Sprintf("%s/bqman-%s.json", t.Parameters.LogDirPath, t.Parameters.Timestamp)
	var err error
	t.Parameters.LogFileHandle, err = os.Create(t.Parameters.LogFile)
	util.CheckError(err, fmt.Sprintf("%s: Unable to initialise logfile!", t.Parameters.LogFile))
	if t.Parameters.Quiet {
		log.SetOutput(t.Parameters.LogFileHandle)
	}
	//log.Printf("Trotter.initLogging() completed")
}

// NewPullTrotter constructs and initialises the Trotter object
// used to generate BigQuery JSON schema files from a BigQuery dataset
func NewPullTrotter(projectID, bqDataset, cacheDir, location string, quiet bool) *Trotter {
	ctx := context.Background()
	trotter := &Trotter{
		Criteria: &FilterCriteria{
			ProjectID: projectID,
			DatasetID: bqDataset,
		},
		Parameters: &RuntimeParameters{
			CacheDirPath: cacheDir,
			Ctx:          ctx,
			BqHandler:    bqhandler.NewBigQueryHandler(ctx, projectID),
			Location:     location,
			Quiet:        quiet,
		},
	}
	trotter.Parameters.Mode = executionmode.PullMode
	trotter.Assets = new(GcpAssets)
	trotter.Validate()
	trotter.initLogging()
	return trotter
}

// NewImportSpreadsheetTrotter is used to construct and initialise
// a Trotter object for generating BigQuery JSON schema files from
// Google Sheets
func NewImportSpreadsheetTrotter(projectID, bqDataset, cacheDir, location, spreadsheetID, sheetTitle, sheetRange string, quiet bool) *Trotter {
	trotter := NewPullTrotter(projectID, bqDataset, cacheDir, location, quiet)
	trotter.Parameters.Mode = executionmode.ImportSpreadsheetMode
	trotter.Parameters.SpreadsheetID = spreadsheetID
	trotter.Parameters.SheetTitle = sheetTitle
	trotter.Parameters.SheetRange = sheetRange
	trotter.Validate()
	trotter.initLogging()
	return trotter
}

// NewImportSQLServerTrotter is used to construct and initialise
// a Trotter object for generating BigQuery JSON schema files
// from a SQL server database
func NewImportSQLServerTrotter(projectID, bqDataset, cacheDir, location, server, user, password, database string, port int, quiet bool) *Trotter {
	trotter := NewPullTrotter(projectID, bqDataset, cacheDir, location, quiet)
	trotter.Parameters.Mode = executionmode.ImportSqlserverMode
	trotter.Parameters.SQLServerName = server
	trotter.Parameters.SQLServerUser = user
	trotter.Parameters.SQLServerPassword = password
	trotter.Parameters.SQLServerDatabase = database
	trotter.Parameters.SQLServerPort = port
	trotter.Validate()
	trotter.initLogging()
	return trotter
}

// NewPushTrotter is used to construct and initialise a Trotter
// object for creating a new dataset and tables in BigQuery
// using BigQuery JSON schema files
func NewPushTrotter(projectID, bqDataset, cacheDir, schemaDir, location, config string, quiet bool) *Trotter {
	trotter := NewPullTrotter(projectID, bqDataset, cacheDir, location, quiet)
	trotter.Parameters.Mode = executionmode.PushMode
	trotter.Parameters.SchemaDirPath = schemaDir
	trotter.Parameters.ConfigFile = config
	if len(config) > 0 {
		trotter.Parameters.CfgParser = configparser.NewConfigParser(config)
	}
	return trotter
}

// NewDeleteTrotter is used to construct and initialise a Trotter
// object for deleting an empty BigQuery dataset
func NewDeleteTrotter(projectID, bqDataset, cacheDir, location string, quiet bool) *Trotter {
	trotter := NewPullTrotter(projectID, bqDataset, cacheDir, location, quiet)
	trotter.Parameters.Mode = executionmode.DeleteMode
	return trotter
}

// NewDestroyTrotter is used to construct and initialise a Trotter object
// for deleting a non-empty BigQuery dataset
func NewDestroyTrotter(projectID, bqDataset, cacheDir, location string, quiet bool) *Trotter {
	trotter := NewPullTrotter(projectID, bqDataset, cacheDir, location, quiet)
	trotter.Parameters.Mode = executionmode.DestroyMode
	return trotter
}

// NewBackupTrotter is used to construct and initialise a Trotter object
// for generating sharded CSV files in a Google Cloud Storage bucket
// for each table within a dataset
func NewBackupTrotter(projectID, bqDataset, cacheDir, gcsBucket, location string, quiet bool) *Trotter {
	trotter := NewPullTrotter(projectID, bqDataset, cacheDir, location, quiet)
	trotter.Parameters.Mode = executionmode.BackupMode
	trotter.Parameters.GcsHandler = gcshandler.NewCloudStorageHandler(trotter.Parameters.Ctx, gcsBucket)
	trotter.Parameters.GcsHandler.GcsPath = fmt.Sprintf("gs://%s/%s/%s/%s", trotter.Parameters.GcsHandler.GcsBucket, projectID, bqDataset, trotter.Parameters.Timestamp)
	return trotter
}

// NewRestoreTrotter is used to restore all tables within a BigQuery dataset
// using sharded CSV files stored in a Google Cloud Storage bucket
func NewRestoreTrotter(projectID, bqDataset, cacheDir, schemaDir, gcsPath, location string, quiet bool) *Trotter {
	trotter := NewPullTrotter(projectID, bqDataset, cacheDir, location, quiet)
	trotter.Parameters.Mode = executionmode.RestoreMode
	trotter.Parameters.SchemaDirPath = schemaDir
	gcsBucket := strings.Replace(gcsPath, "gs://", "", -1)
	gcsBucket = strings.Split(gcsBucket, "/")[0]
	trotter.Parameters.GcsHandler = gcshandler.NewCloudStorageHandler(trotter.Parameters.Ctx, gcsBucket)
	trotter.Parameters.GcsHandler.GcsPath = gcsPath
	return trotter
}

// NewUpdateTrotter is used to construct and initialise a Trotter
// object for adding new NULLABLE columns at the end of a BigQuery
// table
func NewUpdateTrotter(projectID, bqDataset, cacheDir, schemaDir, location string, quiet bool) *Trotter {
	trotter := NewPullTrotter(projectID, bqDataset, cacheDir, location, quiet)
	trotter.Parameters.SchemaDirPath = schemaDir
	trotter.Parameters.Mode = executionmode.UpdateMode
	return trotter
}

// NewPatchTrotter is used to construct and initialise a Trotter object
// for modifying the column description within BigQuery tables
func NewPatchTrotter(projectID, bqDataset, cacheDir, schemaDir, location string, quiet bool) *Trotter {
	trotter := NewPullTrotter(projectID, bqDataset, cacheDir, location, quiet)
	trotter.Parameters.SchemaDirPath = schemaDir
	trotter.Parameters.Mode = executionmode.PatchMode
	return trotter
}

// SetProjects is used to fetch project details from GCP
func (t *Trotter) SetProjects() {
	log.Printf("Trotter.SetProjects() executing...")
	var err error
	t.Assets.Projects, err = projecthandler.GetProjects(t.Parameters.Ctx, t.Criteria.ProjectID)
	util.CheckError(err, "SetProjects() failed!")
	log.Printf("Trotter.SetProjects() completed")
}

// SetDatasets is used to fetch dataset details from BigQuery
func (t *Trotter) SetDatasets() {
	log.Printf("Trotter.SetDatasets(%s) executing...", t.Criteria.ProjectID)
	var err error
	bqHandler := t.Parameters.BqHandler
	t.Assets.Datasets, err = bqHandler.GetBigQueryDatasets(t.Criteria.DatasetID)
	if t.Parameters.Mode != executionmode.DeleteMode && t.Parameters.Mode != executionmode.DestroyMode {
		for i := 0; i < len(t.Assets.Datasets); i++ {
			t.Assets.Datasets[i].Tables, err = bqHandler.GetBigQueryTables(t.Assets.Datasets[i].DatasetID)
		}
	}
	if err != iterator.Done {
		util.CheckError(err, "SetDatasets() failed")
	}
	log.Printf("Trotter.SetDatasets() completed")
}

// WriteJSON is used to dump the Trotter parameters object
// to a text file in JSON format
func (t *Trotter) WriteJSON() {
	f, err := os.Create(t.Parameters.JSONFile)
	util.CheckError(err, "WriteJSON failed: ")
	b := t.Jsonify()
	nbytes, err := f.WriteString(string(b))
	log.Printf("wrote %d bytes to: %s", nbytes, t.Parameters.JSONFile)
	f.Close()
}

// Jsonify is used to convert the Trotter object to a JSON byte array
func (t *Trotter) Jsonify() []byte {
	log.Printf("Trotter.Jsonify() executing.")
	b, err := json.Marshal(t)
	util.CheckError(err, "json.Marshal(c) failed!")
	log.Printf("Trotter.Validate() completed")
	return b
}

// ShowFileLocations is a convenience method used to display
// the location of the files generated during execution
func (t *Trotter) ShowFileLocations() {
	if t.Parameters.Quiet {
		fmt.Printf("Log:  %s\n", t.Parameters.LogFile)
		fmt.Printf("JSON: %s\n", t.Parameters.JSONFile)
	}
}

// DeleteDataset is used to delete an empty BigQuery dataset
func (t *Trotter) DeleteDataset() {
	client := t.Parameters.BqHandler.Client
	log.Printf("Trotter.DeleteDataset() executing")
	err := client.Dataset(t.Criteria.DatasetID).Delete(t.Parameters.Ctx)
	util.CheckError(err, fmt.Sprintf("%s: Dataset deletion failed", t.Criteria.DatasetID))
	log.Printf("Trotter.DeleteDataset() completed")
}

// DestroyDataset is used to delete a non-empty BigQuery dataset
func (t *Trotter) DestroyDataset() {
	client := t.Parameters.BqHandler.Client
	log.Printf("Trotter.DestroyDataset() executing")
	err := client.Dataset(t.Criteria.DatasetID).DeleteWithContents(t.Parameters.Ctx)
	util.CheckError(err, fmt.Sprintf("%s Dataset deletion with contents failed", t.Criteria.DatasetID))
	log.Printf("Trotter.DestroyDataset() completed")
}

// GenerateBigQueryJSON is used to generate BigQuery JSON
// schema files using information contained in the
// Trotter.Assets object
func (t *Trotter) GenerateBigQueryJSON() {
	log.Printf("Trotter.GenerateBigQueryJSON() executing.")
	for dIdx := 0; dIdx < len(t.Assets.Datasets); dIdx++ {
		dataset := t.Assets.Datasets[dIdx]
		tables := t.Assets.Datasets[dIdx].Tables
		for tIdx := 0; tIdx < len(tables); tIdx++ {
			tableID := tables[tIdx].TableID
			schema := tables[tIdx].TableMetadata.Schema
			tableSchema := t.Parameters.BqHandler.SchemaToBQ(schema)
			currentTableJSONFile := fmt.Sprintf("%s/%s:%s.%s.schema", t.Parameters.LogDirPath, t.Criteria.ProjectID, dataset.DatasetID, tableID)
			previousTableJSONFile := fmt.Sprintf("%s/%s:%s.%s.schema", t.Parameters.SchemaDirPath, t.Criteria.ProjectID, dataset.DatasetID, tableID)
			log.Printf("tableJsonFile: %s\n", currentTableJSONFile)
			schemaBytes := t.Parameters.BqHandler.JsonifyBigquery(tableSchema)
			util.WriteByteArrayToFile(currentTableJSONFile, schemaBytes)
			if util.FileExists(previousTableJSONFile) {
				filesAreEqual := util.FilesAreEqual(previousTableJSONFile, currentTableJSONFile, schemaBytes)
				if !filesAreEqual {
					util.WriteByteArrayToFile(previousTableJSONFile, schemaBytes)
				}
			} else {
				util.WriteByteArrayToFile(previousTableJSONFile, schemaBytes)
			}
		}
	}
	log.Printf("Trotter.GenerateBigQueryJSON() completed")
}

// ProcessBigQueryTables is used to perform various BigQuery CI/CD
// operations based on the ExecutionMode
func (t *Trotter) ProcessBigQueryTables(mode executionmode.ExecutionMode) {
	log.Printf("ProcessBigQueryTables() executing")
	datasetID := t.Criteria.DatasetID
	bqHandler := t.Parameters.BqHandler
	client := bqHandler.Client
	ctx := bqHandler.Ctx
	files, err := util.FindFile(t.Parameters.SchemaDirPath, []string{".schema"})
	util.CheckError(err, "ProcessBigQueryTables.util.FindFile() failed")
	datasetChecked := false
	for _, file := range files {
		bname := filepath.Base(file)
		parts := strings.Split(bname, ".")
		tableID := parts[1]
		log.Printf("Processing table %s\n", tableID)
		schemaLines, err := util.ReadFileToStringArray(file)
		util.CheckError(err, "ProcessBigQueryTables().ReadFile() failed")
		tableSchema := strings.Join(schemaLines[:], " ")
		if !datasetChecked {
			datasetExists, err := bqHandler.CheckDatasetExists(datasetID)
			if !datasetExists || err != nil {
				log.Printf("%s: Creating dataset...", datasetID)
				meta := &bigquery.DatasetMetadata{
					Location: t.Parameters.Location, // See https://cloud.google.com/bigquery/docs/locations
				}
				if err := client.Dataset(datasetID).Create(ctx, meta); err != nil {
					util.CheckError(err, fmt.Sprintf("ProcessBigQueryTables().Create().Dataset(%s).Create() failed", datasetID))
				}
				log.Printf("%s: Dataset created", datasetID)
			}
			datasetChecked = true
		}
		tableRef := client.Dataset(t.Criteria.DatasetID).Table(tableID)
		bigQueryTableSchema, err := bigquery.SchemaFromJSON([]byte(tableSchema))
		util.CheckError(err, "bigquery.SchemaFromJSON() failed")
		metaData := &bigquery.TableMetadata{
			Schema:         bigQueryTableSchema,
			ExpirationTime: time.Now().AddDate(100, 0, 0), // Table will be automatically deleted in 100 years.
		}
		if t.Parameters.CfgParser != nil {
			cfgMap := t.Parameters.CfgParser.ConfigMap
			metaData.TimePartitioning = &bigquery.TimePartitioning{
				//Type:                   TimePartitioningType(cfgMap[tableID].TimePartitioningPeriod),
				Expiration:             0,
				Field:                  cfgMap[tableID].TimePartitioningField,
				RequirePartitionFilter: false,
			}
			if len(cfgMap[tableID].ClusteringFields) > 0 {
				metaData.Clustering = &bigquery.Clustering{
					Fields: cfgMap[tableID].ClusteringFields,
				}
			}
		}
		switch mode {
		case executionmode.PushMode:
			err = tableRef.Create(ctx, metaData)
			util.CheckErrorAndReturn(err, "ProcessBigQueryTables().Create() failed")
		case executionmode.RestoreMode:
			bqHandler.LoadDataFromGCS(tableID, t.Criteria.DatasetID, t.Parameters.GcsHandler.GcsPath, bigQueryTableSchema)
		case executionmode.UpdateMode:
			_, missingColumns := bqHandler.FindMissingColumnsInSchema(tableID, t.Criteria.DatasetID, bigQueryTableSchema)
			//t.ShowMissingColumns("ProcessBigQueryTables", tableID, missingColumns)
			err := bqHandler.AddColumnsToTable(t.Criteria.DatasetID, tableRef, missingColumns)
			util.CheckError(err, "AddColumnsToTable() failed")
		case executionmode.PatchMode:
			err := t.Parameters.BqHandler.PatchBigQueryTable(t.Criteria.ProjectID, t.Criteria.DatasetID, bigQueryTableSchema, tableRef)
			util.CheckError(err, "PatchBigQueryTable() failed")
		}
	}
	log.Printf("ProcessBigQueryTables() completed")
}

// ExportTableToGCS is used to generate sharded CSV files in GCS
// for a given table
func (t *Trotter) ExportTableToGCS(table, gcsURI string) {
	bucketName := t.Parameters.GcsHandler.GcsBucket
	log.Printf("ExportTableToGcs(%s) executing", bucketName)
	client := t.Parameters.GcsHandler.Client
	bucket := client.Bucket(bucketName)
	_, err := bucket.Attrs(t.Parameters.Ctx)
	util.CheckError(err, "ExportTableToGCS().Bucket() failed")
	log.Printf("Generating %s\n", gcsURI)
	gcsRef := bigquery.NewGCSReference(gcsURI)
	gcsRef.FieldDelimiter = ","
	extractor := t.Parameters.BqHandler.Client.DatasetInProject(t.Criteria.ProjectID, t.Criteria.DatasetID).Table(table).ExtractorTo(gcsRef)
	extractor.DisableHeader = true
	extractor.Location = t.Parameters.Location
	job, err := extractor.Run(t.Parameters.Ctx)
	util.CheckError(err, "ExportTableToGCS().extractor.Run() failed")
	status, err := job.Wait(t.Parameters.Ctx)
	util.CheckError(err, "ExportTableToGCS().job.Wait() failed")
	util.CheckError(status.Err(), "ExportTableToGCS().job.Wait() failed")
	log.Printf("ExportTableToGcs(%s) completed", bucketName)
}

// BackupDataset is used to iterate through all the tables
// within a BigQuery dataset and generate sharded CSV backup
// schema files in a Google Cloud Storage bucket.
// Please refer to
// https://cloud.google.com/bigquery/docs/managing-table-schemas#go
func (t *Trotter) BackupDataset() {
	log.Printf("BackupDataset() executing")
	datasetID := t.Criteria.DatasetID
	bqHandler := t.Parameters.BqHandler
	tables, err := bqHandler.GetBigQueryTables(datasetID)
	util.CheckError(err, "BackupDataset().GetBigQueryTables() failed.")
	for _, bqTable := range tables {
		gcsURI := fmt.Sprintf("%s/%s/%s-*.csv", t.Parameters.GcsHandler.GcsPath, bqTable.TableID, bqTable.TableID)
		t.ExportTableToGCS(bqTable.TableID, gcsURI)
		//t.Parameters.GcsHandler.GetObjects(gcsPrefix, "/")
	}
	log.Printf("BackupDataset() completed")
}

// ShowCriteria is a convenience method used to display
// filter criteria and runtime parameters
func (t *Trotter) ShowCriteria() {
	log.Printf("showCriteria() executing")
	log.Printf("ProjectID: %s\n", t.Criteria.ProjectID)
	log.Printf("DatasetID: %s\n", t.Criteria.DatasetID)
	log.Printf("CacheDir: %s\n", t.Parameters.CacheDirPath)
	log.Printf("SchemaDir: %s\n", t.Parameters.SchemaDirPath)
	log.Printf("showCriteria() completed")
}
