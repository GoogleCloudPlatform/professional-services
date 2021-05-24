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
	"bufio"
	"context"
	"fmt"
	"log"
	"os"
	"testing"
	"time"

	"github.com/GoogleCloudPlatform/bqman/controller"
	"github.com/GoogleCloudPlatform/bqman/executionmode"
	"github.com/GoogleCloudPlatform/bqman/util"
	"github.com/magiconair/properties"
	props "github.com/magiconair/properties"
)

const (
	TestDataDir = "../testdata"
	Quiet       = false
)

var (
	Context    = context.Background()
	timeNow    = time.Now()
	timeString = fmt.Sprintf("%d%02d%02dT%02d%02d%02d",
		timeNow.Year(), timeNow.Month(), timeNow.Day(),
		timeNow.Hour(), timeNow.Minute(), timeNow.Second())
)

func setup() {
	log.Printf("setup() executing")
	executionmode.InitExecutionModes()
	log.Printf("setup() completed")
}

func teardown() {
	log.Printf("teardown() executing")
	log.Printf("teardown() completed")
}

func TestMain(m *testing.M) {
	setup()
	ret := m.Run()
	if ret == 0 {
		teardown()
	}
	os.Exit(ret)
}

func loadProperties(em executionmode.ExecutionMode, loadGlobal bool) *props.Properties {
	log.Printf("loadProperties(%s) executing", fmt.Sprint(em))
	var p *props.Properties
	if loadGlobal {
		propertyFiles := make([]string, 2)
		propertyFiles[0] = fmt.Sprintf("%s/GlobalTest.properties", TestDataDir)
		propertyFiles[1] = fmt.Sprintf("%s/%s", TestDataDir, executionmode.ExecutionModes[em].TestPropertiesFile)
		p = props.MustLoadFiles(propertyFiles, properties.UTF8, false)
	} else {
		propertyFile := fmt.Sprintf("%s/%s", TestDataDir, executionmode.ExecutionModes[em].TestPropertiesFile)
		p = props.MustLoadFile(propertyFile, properties.UTF8)
	}
	log.Printf("loadProperties(%s) completed", fmt.Sprint(em))
	return p
}

func writePropertiesToFile(t *testing.T, p *props.Properties, fname string) {
	log.Printf("writeProperties(%s) executing", fname)
	f, err := os.Create(fname)
	if err != nil {
		t.Errorf("writePropertiesToFile(%s) failed", fname)
	}
	defer f.Close()
	w := bufio.NewWriter(f)
	n, err := p.Write(w, properties.UTF8)
	if err != nil {
		t.Errorf("writePropertiesToFile(%s) failed", fname)
	}
	w.Flush()
	log.Printf("writeProperties(%s) completed; (%d) bytes written", fname, n)
}

func TestProcessPull(t *testing.T) {
	log.Printf("TestProcessPull() executing")
	pullProps := loadProperties(executionmode.PullMode, true)
	projectID, _ := pullProps.Get("project")
	dataset, _ := pullProps.Get("dataset")
	cacheDir, _ := pullProps.Get("cache_dir")
	location, _ := pullProps.Get("location")
	trotter := controller.NewPullTrotter(projectID, dataset, cacheDir, location, Quiet)
	ProcessPull(trotter)
	files, err := util.FindFile(trotter.Parameters.LogDirPath, []string{".schema"})
	if len(files) == 0 || err != nil {
		t.Errorf("TestProcessPull(%s, %s) failed! No schema files in %s", projectID, dataset, trotter.Parameters.LogDirPath)
	}
	tableCount := len(trotter.Assets.Datasets[0].Tables)
	fileCount := len(files)
	if tableCount != fileCount {
		t.Errorf("TestProcessPull(%s, %s) failed! tableCount(%d) != filecount(%d)", projectID, dataset, tableCount, fileCount)
	}
	log.Printf("Pulled %d tables from %s.%s and generated %d BQ JSON schema files\n", tableCount, projectID, dataset, fileCount)
	pushProps := props.NewProperties()
	pushProps.SetValue("dataset", dataset)
	pushProps.SetValue("schema_dir", trotter.Parameters.LogDirPath)
	pushPropsFilePath := fmt.Sprintf("%s/%s", TestDataDir, executionmode.ExecutionModes[executionmode.PushMode].TestPropertiesFile)
	writePropertiesToFile(t, pushProps, pushPropsFilePath)
	log.Printf("TestProcessPull() completed")
}

func TestProcessPush(t *testing.T) {
	log.Printf("TestProcessPush() executing")
	p := loadProperties(executionmode.PushMode, true)
	projectID, _ := p.Get("project")
	dataset, _ := p.Get("dataset")
	cacheDir, _ := p.Get("cache_dir")
	location, _ := p.Get("location")
	schemaDir, _ := p.Get("schema_dir")
	newPushDataset := fmt.Sprintf("bqman_push_%s_%s", dataset, timeString)
	newRestoreDataset := fmt.Sprintf("bqman_restore_%s_%s", dataset, timeString)
	trotter := controller.NewPushTrotter(projectID, newPushDataset, cacheDir, schemaDir, location, "", Quiet)
	ProcessPush(trotter)
	files, err := util.FindFile(schemaDir, []string{".schema"})
	if len(files) == 0 || err != nil {
		t.Errorf("TestProcessPush(%s, %s) failed! No schema files in %s", projectID, newPushDataset, schemaDir)
	}
	fileCount := len(files)
	log.Printf("Pushed %d tables to %s.%s\n", fileCount, projectID, newPushDataset)
	pushProps := props.NewProperties()
	pushProps.SetValue("dataset", newPushDataset)
	pushProps.SetValue("schema_dir", trotter.Parameters.SchemaDirPath)
	pushPropsFilePath := fmt.Sprintf("%s/%s", TestDataDir, executionmode.ExecutionModes[executionmode.PushMode].TestPropertiesFile)
	writePropertiesToFile(t, pushProps, pushPropsFilePath)
	updateProps := props.NewProperties()
	updateProps.SetValue("dataset", newPushDataset)
	updatePropsFilePath := fmt.Sprintf("%s/%s", TestDataDir, executionmode.ExecutionModes[executionmode.UpdateMode].TestPropertiesFile)
	writePropertiesToFile(t, updateProps, updatePropsFilePath)
	patchProps := props.NewProperties()
	patchProps.SetValue("dataset", newPushDataset)
	patchPropsFilePath := fmt.Sprintf("%s/%s", TestDataDir, executionmode.ExecutionModes[executionmode.PatchMode].TestPropertiesFile)
	writePropertiesToFile(t, patchProps, patchPropsFilePath)
	backupProps := loadProperties(executionmode.BackupMode, false)
	backupProps.SetValue("dataset", newPushDataset) // empty dataset
	//backupProps.SetValue("dataset", dataset) // contains data
	backupPropsFilePath := fmt.Sprintf("%s/%s", TestDataDir, executionmode.ExecutionModes[executionmode.BackupMode].TestPropertiesFile)
	writePropertiesToFile(t, backupProps, backupPropsFilePath)
	restoreProps := props.NewProperties()
	restoreProps.SetValue("dataset", newRestoreDataset)
	restoreProps.SetValue("schema_dir", trotter.Parameters.SchemaDirPath)
	restorePropsFilePath := fmt.Sprintf("%s/%s", TestDataDir, executionmode.ExecutionModes[executionmode.RestoreMode].TestPropertiesFile)
	writePropertiesToFile(t, restoreProps, restorePropsFilePath)
	log.Printf("TestProcessPush() completed")
}

func TestProcessUpdate(t *testing.T) {
	log.Printf("TestProcessUpdate() executing")
	schemaDirForUpdate := fmt.Sprintf("../testdata/%s", t.Name())
	log.Printf("TestProcessUpdate().schemaDirForUpdate: %s", schemaDirForUpdate)
	p := loadProperties(executionmode.UpdateMode, true)
	projectID, _ := p.Get("project")
	dataset, _ := p.Get("dataset")
	cacheDir, _ := p.Get("cache_dir")
	location, _ := p.Get("location")
	trotter := controller.NewUpdateTrotter(projectID, dataset, cacheDir, schemaDirForUpdate, location, Quiet)
	ProcessUpdate(trotter)
	updateProps := props.NewProperties()
	updateProps.SetValue("dataset", dataset)
	updateProps.SetValue("schema_dir", schemaDirForUpdate)
	updatePropsFilePath := fmt.Sprintf("%s/%s", TestDataDir, executionmode.ExecutionModes[executionmode.UpdateMode].TestPropertiesFile)
	writePropertiesToFile(t, updateProps, updatePropsFilePath)
	log.Printf("TestProcessUpdate() completed")
}

func TestProcessPatch(t *testing.T) {
	log.Printf("TestProcessPatch() executing")
	schemaDirForPatch := fmt.Sprintf("../testdata/%s", t.Name())
	log.Printf("TestProcessUpdate().schemaDirForPatch: %s", schemaDirForPatch)
	p := loadProperties(executionmode.PatchMode, true)
	projectID, _ := p.Get("project")
	dataset, _ := p.Get("dataset")
	cacheDir, _ := p.Get("cache_dir")
	location, _ := p.Get("location")
	log.Printf("SchemaDirForPatch: %s", schemaDirForPatch)
	trotter := controller.NewUpdateTrotter(projectID, dataset, cacheDir, schemaDirForPatch, location, Quiet)
	ProcessPatch(trotter)
	patchProps := props.NewProperties()
	patchProps.SetValue("dataset", dataset)
	patchProps.SetValue("schema_dir", schemaDirForPatch)
	patchPropsFilePath := fmt.Sprintf("%s/%s", TestDataDir, executionmode.ExecutionModes[executionmode.PatchMode].TestPropertiesFile)
	writePropertiesToFile(t, patchProps, patchPropsFilePath)
	log.Printf("TestProcessPatch() completed")
}

func TestProcessBackup(t *testing.T) {
	log.Printf("TestProcessBackup() executing")
	p := loadProperties(executionmode.BackupMode, true)
	projectID, _ := p.Get("project")
	dataset, _ := p.Get("dataset")
	cacheDir, _ := p.Get("cache_dir")
	location, _ := p.Get("location")
	gcsBucketForBackup, _ := p.Get("gcs_bucket")
	trotter := controller.NewBackupTrotter(projectID, dataset, cacheDir, gcsBucketForBackup, location, Quiet)
	ProcessBackup(trotter)
	restoreProps := loadProperties(executionmode.RestoreMode, false)
	gcsPathForRestore := fmt.Sprintf("gs://%s/%s/%s/%s", gcsBucketForBackup, projectID, dataset, trotter.Parameters.Timestamp)
	restoreProps.SetValue("gcs_path", gcsPathForRestore)
	restorePropsFilePath := fmt.Sprintf("%s/%s", TestDataDir, executionmode.ExecutionModes[executionmode.RestoreMode].TestPropertiesFile)
	writePropertiesToFile(t, restoreProps, restorePropsFilePath)
	log.Printf("TestProcessBackup() completed")
}

func TestProcessRestore(t *testing.T) {
	log.Printf("TestProcessRestore() executing")
	p := loadProperties(executionmode.RestoreMode, true)
	projectID, _ := p.Get("project")
	dataset, _ := p.Get("dataset")
	cacheDir, _ := p.Get("cache_dir")
	location, _ := p.Get("location")
	schemaDirForRestore, _ := p.Get("schema_dir")
	gcsPathForRestore, _ := p.Get("gcs_path")
	log.Printf("TestProcessRestore().gcsPathForRestore: %s", gcsPathForRestore)
	trotter := controller.NewRestoreTrotter(projectID, dataset, cacheDir, schemaDirForRestore, gcsPathForRestore, location, Quiet)
	ProcessRestore(trotter)
	log.Printf("TestProcessRestore() completed")
}

func TestProcessImportSpreadsheet(t *testing.T) {
	log.Printf("TestProcessImportSpreadsheet() executing")
	p := loadProperties(executionmode.ImportSpreadsheetMode, true)
	projectID, _ := p.Get("project")
	cacheDir, _ := p.Get("cache_dir")
	location, _ := p.Get("location")
	spreadsheetID, _ := p.Get("spreadsheet")
	sheetTitle, _ := p.Get("sheet")
	sheetRange, _ := p.Get("range")
	dataset := fmt.Sprintf("bqman_import_sheet_%s", timeString)
	importTrotter := controller.NewImportSpreadsheetTrotter(projectID, dataset, cacheDir, location, spreadsheetID, sheetTitle, sheetRange, Quiet)
	ProcessImportSpreadsheet(importTrotter)
	schemaDir := importTrotter.Parameters.LogDirPath
	pushTrotter := controller.NewPushTrotter(projectID, dataset, cacheDir, schemaDir, location, "", Quiet)
	p.SetValue("schema_dir", schemaDir)
	ProcessPush(pushTrotter)
	spreadsheetPropsFilePath := fmt.Sprintf("%s/%s", TestDataDir, executionmode.ExecutionModes[executionmode.ImportSpreadsheetMode].TestPropertiesFile)
	writePropertiesToFile(t, p, spreadsheetPropsFilePath)
	log.Printf("TestProcessImportSpreadsheet() completed")
}

func TestProcessImportSqlserver(t *testing.T) {
	log.Printf("TestProcessImportSqlserver() executing")
	p := loadProperties(executionmode.ImportSqlserverMode, true)
	projectID, _ := p.Get("project")
	cacheDir, _ := p.Get("cache_dir")
	location, _ := p.Get("location")
	server, _ := p.Get("server")
	user, _ := p.Get("user")
	password, _ := p.Get("password")
	database, _ := p.Get("database")
	port := p.GetInt("port", 1433)
	dataset := fmt.Sprintf("bqman_import_sqlserver_%s", timeString)
	importTrotter := controller.NewImportSQLServerTrotter(projectID, dataset, cacheDir, location, server, user, password, database, port, Quiet)
	ProcessImportSqlserver(importTrotter)
	schemaDir := importTrotter.Parameters.LogDirPath
	pushTrotter := controller.NewPushTrotter(projectID, dataset, cacheDir, schemaDir, location, "", Quiet)
	p.SetValue("schema_dir", schemaDir)
	ProcessPush(pushTrotter)
	sqlserverPropsFilePath := fmt.Sprintf("%s/%s", TestDataDir, executionmode.ExecutionModes[executionmode.ImportSqlserverMode].TestPropertiesFile)
	writePropertiesToFile(t, p, sqlserverPropsFilePath)
	log.Printf("TestProcessImportSqlserver() completed")
}
