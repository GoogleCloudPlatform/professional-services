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

package bqhandler

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"cloud.google.com/go/bigquery"
	util "github.com/GoogleCloudPlatform/bqman/util"
	bqv2 "google.golang.org/api/bigquery/v2"
	"google.golang.org/api/iterator"
)

// BigQueryHandler is used to interface with BigQuery
// via the API
type BigQueryHandler struct {
	Ctx       context.Context
	Client    *bigquery.Client
	ProjectID string
}

// BqColumn is used to hold the BigQuery column name
type BqColumn struct {
	Name string
}

// BqTable is used to hold the BigQuery table metadata
type BqTable struct {
	TableID       string
	Columns       []BqColumn
	TableMetadata *bigquery.TableMetadata
}

// BqDataset is used to hold BigQuery dataset metadata
type BqDataset struct {
	Name            string
	DatasetID       string
	Tables          []BqTable
	DatasetMetadata *bigquery.DatasetMetadata
}

// BqSchema is used to forward / revese engineer BigQuery
// JSON schema files
type BqSchema struct {
	Description string     `json:"description"`
	Name        string     `json:"name"`
	Type        string     `json:"type"`
	Mode        string     `json:"mode,omitempty"`
	Fields      []BqSchema `json:"fields,omitempty"`
}

// NewBigQueryHandler returns a pointer to a new instance of
// BigQueryHandler
func NewBigQueryHandler(ctx context.Context, projectID string) *BigQueryHandler {
	var err error
	bqHandler := new(BigQueryHandler)
	bqHandler.Ctx = ctx
	bqHandler.Client, err = bigquery.NewClient(ctx, projectID)
	bqHandler.ProjectID = projectID
	util.CheckError(err, "Unable to create BigQuery service!")
	return bqHandler
}

// GetBigQueryDatasets returs an array of BqDataset objects
// using the datasetID provide or an error
func (bh BigQueryHandler) GetBigQueryDatasets(datasetID string) ([]BqDataset, error) {
	log.Printf("GetBigQueryDatasets(%s) executing...", bh.ProjectID)
	it := bh.Client.Datasets(bh.Ctx)
	it.ProjectID = bh.ProjectID
	datasets := make([]BqDataset, 0)
	dataset, err := it.Next()
	util.CheckError(err, "GetBigQueryDatasets() failed!")
	for dataset != nil {
		fmt.Printf("datasetID: %s; dataset.DatasetID: %s\n", datasetID, dataset.DatasetID)
		if datasetID == "" || dataset.DatasetID == datasetID {
			bqDataset := new(BqDataset)
			bqDataset.DatasetID = dataset.DatasetID
			bqDataset.DatasetMetadata, err = dataset.Metadata(bh.Ctx)
			util.CheckError(err, "GetBigQueryDatasets().Metadata error")
			datasets = append(datasets, *bqDataset)
		}
		dataset, err = it.Next()
		if err == iterator.Done {
			log.Printf("GetBigQueryDatasets().iterator.Done")
			return datasets, nil
		}
	}
	util.CheckError(err, "GetBigQueryDatasets() failed!")
	log.Printf("GetBigQueryDatasets() completed.")
	return datasets, err
}

// GetBigQueryTables returns an array of BqTable objects
// for a given dataset or an error
func (bh BigQueryHandler) GetBigQueryTables(datasetID string) ([]BqTable, error) {
	log.Printf("GetBigQueryTables(%s, %s) executing...", bh.ProjectID, datasetID)
	tables := make([]BqTable, 0)
	it := bh.Client.Dataset(datasetID).Tables(bh.Ctx)
	table, err := it.Next()
	if err != nil && err != iterator.Done {
		util.CheckError(err, "GetBigQueryTables() failed!")
	}
	for table != nil {
		log.Printf("GetBigQueryTables().table.TableID: %s", table.TableID)
		bqTable := new(BqTable)
		bqTable.TableID = table.TableID
		bqTable.TableMetadata, err = table.Metadata(bh.Ctx)
		util.CheckError(err, "GetBigQueryTables().Metadata() failed")
		bqTable.Columns, err = bh.GetBigQueryColumns(bh.Ctx, table)
		util.CheckError(err, "GetBigQueryTables().GetBigQueryColumns() failed")
		tables = append(tables, *bqTable)
		table, err = it.Next()
		if err == iterator.Done {
			log.Printf("GetBigQueryTables().iterator.Done")
			return tables, nil
		}
	}
	if err != nil && err != iterator.Done {
		fmt.Printf("GetBigQueryTables().err != iterator.Done : %s", err.Error())
		util.CheckError(err, "GetBigQueryTables() failed!")
	}
	log.Printf("GetBigQueryTables() completed.")
	return tables, err
}

// GetBigQueryColumns returns a list of BqColumn objects
// for a given BigQuery table or an error
func (bh BigQueryHandler) GetBigQueryColumns(ctx context.Context, table *bigquery.Table) ([]BqColumn, error) {
	log.Printf("GetBigQueryColumns(%s) executing...", table.TableID)
	metadata, err := table.Metadata(ctx)
	util.CheckError(err, "GetBigQueryColumns().table.Metadata() failed!")
	bqColumns := make([]BqColumn, 0)
	for _, fs := range metadata.Schema {
		bqColumns = append(bqColumns, BqColumn{Name: fs.Name})
	}
	log.Printf("GetBigQueryColumns() completed.")
	return bqColumns, nil
}

// CheckDatasetExists is used to determine the existence
// of a BigQuery dataset
func (bh *BigQueryHandler) CheckDatasetExists(datasetID string) (bool, error) {
	log.Printf("CheckDatasetExists(%s) executing", datasetID)
	_, err := bh.Client.Dataset(datasetID).Metadata(bh.Ctx)
	if err != nil {
		//log.Printf("CheckDatasetExists() error: %s", err)
		return false, err
	}
	log.Printf("%s: Dataset exists", datasetID)
	log.Printf("CheckDatasetExists(%s) completed", datasetID)
	return true, nil
}

// FieldSchemaToBQ convers a FieldSchema (BigQuery API V1)
// to TableFieldSchema (BigQuery API V2)
// Please refer to
// https://github.com/googleapis/google-cloud-go/blob/096c584342beb49d9653a670d7813b9dbaca72b8/bigquery/schema.go#L75
func (bh *BigQueryHandler) FieldSchemaToBQ(fs *bigquery.FieldSchema) *bqv2.TableFieldSchema {
	tfs := &bqv2.TableFieldSchema{
		Description: fs.Description,
		Name:        fs.Name,
		Type:        string(fs.Type),
		//PolicyTags:  fs.PolicyTags.toBQ(),
	}

	if fs.Repeated {
		tfs.Mode = "REPEATED"
	} else if fs.Required {
		tfs.Mode = "REQUIRED"
	} // else leave as default, which is interpreted as NULLABLE.

	for _, f := range fs.Schema {
		//tfs.Fields = append(tfs.Fields, f.toBQ())
		tfs.Fields = append(tfs.Fields, bh.FieldSchemaToBQ(f))
	}

	return tfs
}

// SchemaToBQ converts BigQuery.Schema object (API V1)
// to TableSchema object (API V2)
func (bh *BigQueryHandler) SchemaToBQ(s bigquery.Schema) *bqv2.TableSchema {
	var fields []*bqv2.TableFieldSchema
	for _, f := range s {
		//fields = append(fields, f.toBQ())
		fields = append(fields, bh.FieldSchemaToBQ(f))
	}
	return &bqv2.TableSchema{Fields: fields}
}

// PatchBigQueryTable is used to modify column descriptions
func (bh *BigQueryHandler) PatchBigQueryTable(projectID, datasetID string, bqSchema bigquery.Schema, tableRef *bigquery.Table) error {
	log.Printf("PatchBigQueryTable() executing")
	meta, err := tableRef.Metadata(bh.Ctx)
	util.CheckError(err, "PatchBigQueryTable metadata get failed")
	fmt.Printf("PatchBigQueryTable(%s).meta: %v\n", tableRef.TableID, meta)
	for _, fs := range meta.Schema {
		fmt.Printf("meta.Schema: %s: %s\n", fs.Name, fs.Description)
	}
	for _, fs := range bqSchema {
		fmt.Printf("bqSchema: %s: %s\n", fs.Name, fs.Description)
	}
	bqv2Service, err := bqv2.NewService(bh.Ctx)
	util.CheckError(err, "PatchBigQueryTable().NewService() failed")
	bqv2TablesService := bqv2.NewTablesService(bqv2Service)
	tablesGetCall := bqv2TablesService.Get(projectID, datasetID, tableRef.TableID)
	bqv2Table, err := tablesGetCall.Do()
	bqv2Table.Schema = bh.SchemaToBQ(bqSchema)
	util.CheckError(err, "PatchBigQueryTable().TablesGetCall().Do() failed")
	bqv2TablesPatchCall := bqv2TablesService.Patch(projectID, datasetID, tableRef.TableID, bqv2Table)
	_, err = bqv2TablesPatchCall.Do()
	util.CheckError(err, "PatchBigQueryTable().bqv2TablesPatchCall().Do() failed")
	log.Printf("PatchBigQueryTable() completed")
	return nil
}

// ConvertToJSON converts an array of BqSchema structs to JSON byte array
func (bh *BigQueryHandler) ConvertToJSON(records []BqSchema) []byte {
	log.Printf("ConvertToJSON() executing")
	bytes, err := json.Marshal(records)
	if err != nil {
		log.Fatalf("ConvertToJSON(): json.Marshal() failed")
	}
	log.Printf("ConvertToJSON() completed")
	return bytes
}

// LoadDataFromGCS is used to restore BigQuery tables from
// sharded CSV files in Google Cloud Storage generated
// via a backup. Please refer to
// https://cloud.google.com/bigquery/docs/loading-data-cloud-storage-csv
func (bh *BigQueryHandler) LoadDataFromGCS(table, datasetID, gcsPath string, schema bigquery.Schema) {
	log.Printf("LoadDataFromGCS() executing")
	gcsURI := fmt.Sprintf("%s/%s/%s-*.csv", gcsPath, table, table)
	log.Printf("gcsURI: %s", gcsURI)
	gcsRef := bigquery.NewGCSReference(gcsURI)
	gcsRef.Schema = schema
	loader := bh.Client.Dataset(datasetID).Table(table).LoaderFrom(gcsRef)
	loader.WriteDisposition = bigquery.WriteEmpty
	job, err := loader.Run(bh.Ctx)
	util.CheckError(err, "LoadDataFromGCS().loader.Run() failed")
	status, err := job.Wait(bh.Ctx)
	util.CheckError(err, "LoadDataFromGCS().job.Wait() failed")
	util.CheckError(status.Err(), "job completed with error")
	log.Printf("LoadDataFromGCS() completed")
}

// ShowMissingColumns is a convenience method to display
// schema differences
func (bh *BigQueryHandler) ShowMissingColumns(prefix, tableID, datasetID string, missingColumns []bigquery.FieldSchema) {
	for i := 0; i < len(missingColumns); i++ {
		missingCol := missingColumns[i]
		log.Printf("Column [%s] is missing in table [%s.%s]", missingColumns[i].Name, datasetID, tableID)
		log.Printf("%s(%s).Schema:       %v", prefix, tableID, missingCol)
	}
}

// FindMissingColumnsInSchema is used to identify schema differences
// between BigQuery tables
func (bh *BigQueryHandler) FindMissingColumnsInSchema(tableID, datasetID string, schema bigquery.Schema) (*bigquery.Table, []bigquery.FieldSchema) {
	log.Printf("FindMissingColumnsInSchema() executing")
	// Store current (live) table schema in currentSchemaMap
	tableRef := bh.Client.Dataset(datasetID).Table(tableID)
	bqColumns, err := bh.GetBigQueryColumns(bh.Ctx, tableRef)
	util.CheckError(err, "AddColumnsToTable().GetBigQueryColumns() failed")
	currentSchemaMap := make(map[string]BqColumn, 0)
	for _, bqColumn := range bqColumns {
		currentSchemaMap[bqColumn.Name] = bqColumn
	}
	missingColumns := make([]bigquery.FieldSchema, 0)
	for i := 0; i < len(schema); i++ {
		if _, exists := currentSchemaMap[schema[i].Name]; !exists {
			missingColumns = append(missingColumns, *schema[i])
		}
	}
	//t.ShowMissingColumns("FindMissingColumnsInSchema", tableID, missingColumns)
	log.Printf("FindMissingColumnsInSchema() completed")
	return tableRef, missingColumns
}

// AddColumnsToTable is used to append NULLABLE columns at the end
// of a table and maintain database integrity
func (bh *BigQueryHandler) AddColumnsToTable(datasetID string, tableRef *bigquery.Table, missingColumns []bigquery.FieldSchema) error {
	log.Printf("AddColumnsToTable() executing")
	bh.ShowMissingColumns("AddColumnsToTable", tableRef.TableID, datasetID, missingColumns)
	meta, err := tableRef.Metadata(bh.Ctx)
	if err != nil {
		return fmt.Errorf("AddColumnsToTable metadata get failed: %v", err)
	}
	newSchemaPtr := make([]*bigquery.FieldSchema, 0)
	for i := 0; i < len(missingColumns); i++ {
		newSchemaPtr = append(newSchemaPtr, &missingColumns[i])
	}
	newSchema := append(meta.Schema, newSchemaPtr...)
	/*
		for i := 0; i < len(newSchema); i++ {
			ptr := newSchema[i]
			obj := *ptr
			log.Printf("AddColumnsToTable().*newSchema[%d].Name", i, obj.Name)
		}
	*/
	update := bigquery.TableMetadataToUpdate{Schema: newSchema}
	if _, err = tableRef.Update(bh.Ctx, update, meta.ETag); err != nil {
		return fmt.Errorf("AddColumnsToTable update failed: %v", err)
	}
	log.Printf("AddColumnsToTable() completed")
	return nil
}

// JsonifyBigquery is used to convert BigQuery TableSchema to
// JSON byte array
func (bh *BigQueryHandler) JsonifyBigquery(tableSchema *bqv2.TableSchema) []byte {
	log.Printf("JsonifyBigquery() executing.")
	b, err := json.Marshal(tableSchema.Fields)
	util.CheckError(err, "json.Marshal(c) failed!")
	log.Printf("JsonifyBigquery() completed")
	return b
}
