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

	"github.com/GoogleCloudPlatform/bqman/bqhandler"
	"github.com/GoogleCloudPlatform/bqman/connector"
	"github.com/GoogleCloudPlatform/bqman/controller"
	"github.com/GoogleCloudPlatform/bqman/executionmode"
	"github.com/GoogleCloudPlatform/bqman/util"
	"gopkg.in/alecthomas/kingpin.v2"
)

var (
	app       = kingpin.New("bqman", "A command-line BigQuery schema forward/reverse engineering tool.")
	cacheDir  = app.Flag("cache_dir", "Cache file location").Default(".bqman").String()
	quiet     = app.Flag("quiet", "Do not write messages to consoles").Default("false").Bool()
	projectID = app.Flag("project", "GCP Project ID").Required().String()
	datasetID = app.Flag("dataset", "BigQuery Dataset").String()
	location  = app.Flag("location", "BigQuery dataset location").Default("australia-southeast1").String()
	schemaDir = app.Flag("schema_dir", "BigQuery schema directory").String()

	pull              = app.Command("pull", "Extract BigQuery table JSON schema files; Needs --project=PROJECT_ID --dataset=DATASET")
	push              = app.Command("push", "Create BigQuery tables with JSON schema files; Needs --project=PROJECT_ID --dataset=DATASET --schema_dir=SCHEMA_DIR <--config=CONFIG.json>")
	update            = app.Command("update", "Update BigQuery schema with JSON schema files; Needs --project=PROJECT_ID --dataset=DATASET --schema_dir=SCHEMA_DIR")
	patch             = app.Command("patch", "Patch BigQuery schema with JSON schema files; Needs --project=PROJECT_ID --dataset=DATASET --schema_dir=SCHEMA_DIR")
	backup            = app.Command("backup", "Backup BigQuery dataset to GCS as CSV; Needs --project=PROJECT_ID --dataset=DATASET --gcs_bucket=GCS_BUCKET")
	restore           = app.Command("restore", "Restore BigQuery dataset from GCS; Needs --project=PROJECT_ID --dataset=DATASET --gcs_path=GCS_PATH  --schema_dir=SCHEMA_DIR")
	delete            = app.Command("delete", "Delete EMPTY BigQuery dataset or table; Needs --project=PROJECT_ID --dataset=DATASET [--table=TABLE]")
	importSpreadsheet = app.Command("import_spreadsheet", "Generate Bigquery schema from a Google spreadsheet; Needs --project=PROJECT_ID --dataset=DATASET [--spreadsheet=SPREADSHEET_ID] [--sheet=SHEET_NAME] [--range=SHEET_RANGE]")
	importSQLServer   = app.Command("import_sqlserver", "Generate Bigquery schema from a live Microsoft SQL Server database; Needs --project=PROJECT_ID --dataset=DATASET --server=SERVER --port=PORT --user=USER --password=PASSWORD --database=DATABASE")
	spreadsheetID     = importSpreadsheet.Flag("spreadsheet", "Google Spreadsheet ID").String()
	sheetTitle        = importSpreadsheet.Flag("sheet", "Google sheet title").String()
	sheetRange        = importSpreadsheet.Flag("range", "Google sheet range").String()
	sqlServerServer   = importSQLServer.Flag("server", "Microsoft SQL Server Name").Required().String()
	sqlServerPort     = importSQLServer.Flag("port", "Microsoft SQL Server Name").Default("1433").Int()
	sqlServerUser     = importSQLServer.Flag("user", "Microsoft SQL Server User").Required().String()
	sqlServerPassword = importSQLServer.Flag("password", "Microsoft SQL Server Password").Required().String()
	sqlServerDatabase = importSQLServer.Flag("database", "Microsoft SQL Server Database").Required().String()
	config            = push.Flag("config", "Partition / Cluster config JSON file").String()
	gcsBucket         = backup.Flag("gcs_bucket", "Google Cloud Storage bucket for backup").Required().String()
	gcsPath           = restore.Flag("gcs_path", "Google Cloud Storage path for restore eg: gs://bqman/project/dataset/timestamp").Required().String()
)

func checkArgs(command, flagKey, flagVal, flagDesc string) {
	if len(flagVal) == 0 {
		fmt.Printf("Please specify the %s via --%s= with the \"%s\" command\n", flagDesc, flagKey, command)
		os.Exit(2)
	}
}

// ProcessPull generates BigQuery JSON schema files for a given dataset
func ProcessPull(trotter *controller.Trotter) {
	log.Printf("ProcessPull() executing")
	trotter.ShowCriteria()
	trotter.SetProjects()
	trotter.SetDatasets()
	trotter.WriteJSON()
	trotter.ShowFileLocations()
	trotter.GenerateBigQueryJSON()
	trotter.Parameters.LogFileHandle.Close()
	log.Printf("ProcessPull() completed")
}

// ProcessPush creates a new dataset and tables using BigQuery JSON schema files
func ProcessPush(trotter *controller.Trotter) {
	log.Printf("ProcessPush() executing")
	trotter.ShowCriteria()
	checkArgs("push", "dataset", trotter.Criteria.DatasetID, "Bigquery Dataset")
	checkArgs("push", "schema_dir", trotter.Parameters.SchemaDirPath, "schema directory")
	util.CheckDir(trotter.Parameters.SchemaDirPath, util.CheckDirAndQuit)
	trotter.ProcessBigQueryTables(executionmode.PushMode)
	log.Printf("ProcessPush() completed")
}

// ProcessBackup creates sharded CSV files for each table within a dataset in GCS
func ProcessBackup(trotter *controller.Trotter) {
	log.Printf("ProcessBackup() executing")
	trotter.ShowCriteria()
	checkArgs("backup", "dataset", trotter.Criteria.DatasetID, "Bigquery Dataset")
	trotter.BackupDataset()
	log.Printf("ProcessBackup() completed")
}

// ProcessRestore is used to restore BigQuery tables from a GCS backup
func ProcessRestore(trotter *controller.Trotter) {
	log.Printf("ProcessRestore() executing")
	trotter.ShowCriteria()
	checkArgs("restore", "dataset", trotter.Criteria.DatasetID, "Bigquery Dataset")
	trotter.ProcessBigQueryTables(executionmode.RestoreMode)
	log.Printf("ProcessRestore() completed")
}

// ProcessUpdate is used to add new NULLABLE columns at the end of a table
func ProcessUpdate(trotter *controller.Trotter) {
	log.Printf("ProcessUpdate() executing")
	trotter.ShowCriteria()
	checkArgs("update", "dataset", trotter.Criteria.DatasetID, "Bigquery Dataset")
	checkArgs("update", "schema_dir", trotter.Parameters.SchemaDirPath, "schema directory")
	util.CheckDir(trotter.Parameters.SchemaDirPath, util.CheckDirAndQuit)
	trotter.ProcessBigQueryTables(executionmode.UpdateMode)
	log.Printf("ProcessUpdate() completed")
}

// ProcessPatch is used to modify column descriptions
func ProcessPatch(trotter *controller.Trotter) {
	log.Printf("ProcessPatch() executing")
	trotter.ShowCriteria()
	checkArgs("patch", "dataset", trotter.Criteria.DatasetID, "Bigquery Dataset")
	checkArgs("patch", "schema_dir", trotter.Parameters.SchemaDirPath, "schema directory")
	util.CheckDir(trotter.Parameters.SchemaDirPath, util.CheckDirAndQuit)
	trotter.ProcessBigQueryTables(executionmode.PatchMode)
	log.Printf("ProcessPatch() completed")
}

// ProcessDelete is used to delete a non-empty dataset from BigQuery
func ProcessDelete(trotter *controller.Trotter) {
	log.Printf("ProcessDelete() executing")
	trotter.ShowCriteria()
	checkArgs("delete", "dataset", trotter.Criteria.DatasetID, "Bigquery Dataset")
	trotter.SetProjects()
	trotter.SetDatasets()
	trotter.DeleteDataset()
	log.Printf("ProcessDelete() completed")
}

// ProcessImportSpreadsheet is used to generate BigQuery JSON schema files
// from Google Sheets
func ProcessImportSpreadsheet(trotter *controller.Trotter) {
	log.Printf("ProcessImportSpreadsheet() executing")
	trotter.ShowCriteria()
	spreadsheetID := trotter.Parameters.SpreadsheetID
	sheetTitle := trotter.Parameters.SheetTitle
	sheetRange := trotter.Parameters.SheetRange
	projectID := trotter.Criteria.ProjectID
	datasetID := trotter.Criteria.DatasetID
	checkArgs("import_spreadsheet", "spreadsheet", spreadsheetID, "Spreadsheet ID")
	checkArgs("import_spreadsheet", "sheet", sheetTitle, "Sheet Title")
	checkArgs("import_spreadsheet", "range", sheetRange, "Sheet Range")
	checkArgs("import_spreadsheet", "dataset", datasetID, "DatasetID")
	spreadsheetHandler := connector.NewSpreadsheetHandler(trotter.Parameters.SpreadsheetID)
	if sheetTitle == "index" {
		ssRange := fmt.Sprintf("%s!%s", sheetTitle, sheetRange)
		sheetIndexMap := spreadsheetHandler.GetIndex(ssRange)
		fmt.Printf("sheetIndexMap: %v\n", sheetIndexMap)
	} else {
		ssRange := fmt.Sprintf("%s!%s", sheetTitle, sheetRange)
		values := spreadsheetHandler.GetData(ssRange)
		ss2bq := connector.NewSpreadsheetToBq()
		ss2bq.SpreadsheetData = values
		bqSchemaArray := ss2bq.Convert(ss2bq.SpreadsheetData)
		bqHandler := bqhandler.NewBigQueryHandler(context.Background(), projectID)
		bqSchemaArrayJSON := bqHandler.ConvertToJSON(bqSchemaArray)
		fmt.Printf("sheetIndexMap: %s\n", string(bqSchemaArrayJSON))
		bqJSONFile := fmt.Sprintf("%s/%s:%s.%s.schema", trotter.Parameters.LogDirPath, projectID, trotter.Criteria.DatasetID, sheetTitle)
		util.WriteByteArrayToFile(bqJSONFile, bqSchemaArrayJSON)
	}
	trotter.ShowFileLocations()
	log.Printf("ProcessImportSpreadsheet() completed")
}

// ProcessImportSqlserver is used to generate BigQuery JSON schema
// files from a SQL server database
func ProcessImportSqlserver(trotter *controller.Trotter) {
	log.Printf("ProcessImportSqlserver() executing")
	trotter.ShowCriteria()
	projectID := trotter.Criteria.ProjectID
	server := trotter.Parameters.SQLServerName
	user := trotter.Parameters.SQLServerUser
	password := trotter.Parameters.SQLServerPassword
	database := trotter.Parameters.SQLServerDatabase
	port := trotter.Parameters.SQLServerPort
	checkArgs("import_sqlserver", "server", server, "Microsoft SQL Server Server")
	checkArgs("import_sqlserver", "user", user, "Microsoft SQL Server User")
	checkArgs("import_sqlserver", "password", password, "Microsoft SQL Server Password")
	checkArgs("import_sqlserver", "database", database, "Microsoft SQL Server Database")
	sqlServerHandler := connector.NewSQLServerHandler(server, user, password, database, port)
	tableSchemas := sqlServerHandler.GetTableSchemas(database)
	for _, schema := range tableSchemas {
		tables := sqlServerHandler.GetTables(database, schema)
		//fmt.Printf("Schema: [%s]; Tables: %v\n", schema, tables)
		for _, table := range tables {
			columns := sqlServerHandler.GetColumns(database, schema, table)
			for _, column := range columns {
				fmt.Printf("Schema: [%s]; Table: %s; column: %v\n", schema, table, column)
			}
			bqSchemaArray := sqlServerHandler.ConvertColumnInfoToBqSchema(columns)
			bqHandler := bqhandler.NewBigQueryHandler(context.Background(), projectID)
			bqSchemaArrayJSON := bqHandler.ConvertToJSON(bqSchemaArray)
			fmt.Printf("sqlServerMap: %s\n", string(bqSchemaArrayJSON))
			bqJSONFile := fmt.Sprintf("%s/%s:%s.%s_%s.schema", trotter.Parameters.LogDirPath, projectID, trotter.Criteria.DatasetID, schema, table)
			util.WriteByteArrayToFile(bqJSONFile, bqSchemaArrayJSON)
		}
	}
	log.Printf("ProcessImportSqlserver() completed")
}

/*
 * bqman pull    --project=PROJECT_ID --dataset=DATASET
 * bqman push    --project=PROJECT_ID --dataset=DATASET --schema_dir=SCHEMA_DIR <--config=CONFIG.json>
 * bqman update  --project=PROJECT_ID --dataset=DATASET --schema_dir=SCHEMA_DIR
 * bqman patch   --project=PROJECT_ID --dataset=DATASET --schema_dir=SCHEMA_DIR
 * bqman delete  --project=PROJECT_ID --dataset=DATASET
 * bqman destroy --project=PROJECT_ID --dataset=DATASET // Use bqadmin instead
 * bqman backup  --project=PROJECT_ID --dataset=DATASET --gcs_bucket=GCS_BUCKET
 * bqman restore --project=PROJECT_ID --dataset=DATASET --gcs_path=GCS_PATH --schema_dir=SCHEMA_DIR
 * bqman import_spreadsheet  --project=PROJECT_ID --dataset=DATASET --spreadsheet=SPREADSHEET --SHEET=SHEET --range=RANGE
 * bqman import_sqlserver  --project=PROJECT_ID --dataset=DATASET --server=SERVER --port=PORT --user=USER --password=PASSWORD --database=DATABASE
 */
func main() {
	executionmode.InitExecutionModes()
	switch kingpin.MustParse(app.Parse(os.Args[1:])) {
	case pull.FullCommand():
		trotter := controller.NewPullTrotter(*projectID, *datasetID, *cacheDir, *location, *quiet)
		ProcessPull(trotter)
	case push.FullCommand():
		trotter := controller.NewPushTrotter(*projectID, *datasetID, *cacheDir, *schemaDir, *location, *config, *quiet)
		ProcessPush(trotter)
	case backup.FullCommand():
		trotter := controller.NewBackupTrotter(*projectID, *datasetID, *cacheDir, *gcsBucket, *location, *quiet)
		ProcessBackup(trotter)
	case restore.FullCommand():
		trotter := controller.NewRestoreTrotter(*projectID, *datasetID, *cacheDir, *schemaDir, *gcsPath, *location, *quiet)
		ProcessRestore(trotter)
	case update.FullCommand():
		trotter := controller.NewUpdateTrotter(*projectID, *datasetID, *cacheDir, *schemaDir, *location, *quiet)
		ProcessUpdate(trotter)
	case patch.FullCommand():
		trotter := controller.NewPatchTrotter(*projectID, *datasetID, *cacheDir, *schemaDir, *location, *quiet)
		ProcessPatch(trotter)
	case delete.FullCommand():
		trotter := controller.NewDeleteTrotter(*projectID, *datasetID, *cacheDir, *location, *quiet)
		ProcessDelete(trotter)
	case importSpreadsheet.FullCommand():
		trotter := controller.NewImportSpreadsheetTrotter(*projectID, *datasetID, *cacheDir, *location, *spreadsheetID, *sheetTitle, *sheetRange, *quiet)
		ProcessImportSpreadsheet(trotter)
	case importSQLServer.FullCommand():
		trotter := controller.NewImportSQLServerTrotter(*projectID, *datasetID, *cacheDir, *location, *sqlServerServer, *sqlServerUser, *sqlServerPassword, *sqlServerDatabase, *sqlServerPort, *quiet)
		ProcessImportSqlserver(trotter)
	}
}
