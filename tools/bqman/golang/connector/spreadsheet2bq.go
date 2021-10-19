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

package connector

import (
	"fmt"
	"log"
	"strings"

	bqhandler "github.com/GoogleCloudPlatform/bqman/bqhandler"
)

// SpreadsheetToBq is a data structure to convert 2-dimensional
// spreadsheet data to an array of Bqschema objects
type SpreadsheetToBq struct {
	BigqueryFields  []bqhandler.BqSchema
	SpreadsheetData [][]interface{}
	EndOfRecord     bool
}

// NewSpreadsheetToBq returns a pointer to a new instance
// of SpreadsheetToBq
func NewSpreadsheetToBq() *SpreadsheetToBq {
	log.Printf("NewSpreadsheetBq() executing")
	spreadsheetToBq := new(SpreadsheetToBq)
	log.Printf("NewSpreadsheetBq() completed")
	return spreadsheetToBq
}

func (sb *SpreadsheetToBq) getBqSchema(data []interface{}) *bqhandler.BqSchema {
	log.Printf("getBqSchema(%s) executing", fmt.Sprintf("%v", data[0]))
	bqSchema := &bqhandler.BqSchema{}
	for col := 0; col < len(data); col++ {
		val := data[col]
		switch col {
		case 0:
			bqSchema.Name = fmt.Sprintf("%v", val)
		case 1:
			bqSchema.Type = fmt.Sprintf("%v", val)
		case 2:
			bqSchema.Mode = fmt.Sprintf("%v", val)
		case 3:
			bqSchema.Description = fmt.Sprintf("%v", val)
		default:
		}
	}
	log.Printf("getBqSchema(%s) completed", bqSchema.Name)
	return bqSchema
}

func (sb *SpreadsheetToBq) removeItemAtIndex(s [][]interface{}, index int) [][]interface{} {
	log.Printf("removeItemAtIndex(%d) executing", index)
	if len(sb.SpreadsheetData) > 0 {
		itemAtIndex := s[:index]
		itemsAfterIndex := s[index+1:]
		returnVal := append(itemAtIndex, itemsAfterIndex...)
		log.Printf("removeItemAtIndex().itemsAfterIndex: %v", itemsAfterIndex)
		log.Printf("removeItemAtIndex().returnVal: %v", returnVal)
		return returnVal
		//return append(itemAtIndex, itemsAfterIndex...)
		//return append(s[:index], s[index+1:]...)
	}
	data := make([][]interface{}, 0)
	log.Printf("removeItemAtIndex(%d) completed", index)
	return data
}

func (sb *SpreadsheetToBq) fixFieldName(fieldName string) string {
	log.Printf("fixFieldName(%s) executing", fieldName)
	fieldName = strings.ReplaceAll(fieldName, " ", "")
	fieldName = strings.ReplaceAll(fieldName, "*", "")
	log.Printf("fixFieldName(%s) completed", fieldName)
	return fieldName
}

func (sb *SpreadsheetToBq) nextFieldInCurrentRecord(recordName string, data [][]interface{}) bool {
	log.Printf("nextFieldInCurrentRecord(%s) executing", recordName)
	if len(data) < 1 {
		log.Printf("nextFieldInCurrentRecord(): No more elements in data")
		log.Printf("nextFieldInCurrentRecord().sb.SpreadsheetData: %v", data)
		return false
	}
	nextField := sb.getBqSchema(data[0]).Name
	nextField = sb.fixFieldName(nextField)
	log.Printf("nextFieldInCurrentRecord().nextField: %v", nextField)
	if strings.HasPrefix(nextField, recordName+".") {
		log.Printf("nextFieldInCurrentRecord().recordName: %s; nextField: %s", recordName, nextField)
		return true
	}
	log.Printf("nextFieldInCurrentRecord(%s) completed", recordName)
	return false
}

func (sb *SpreadsheetToBq) fixNestedFieldNames(nestedSchema []bqhandler.BqSchema) []bqhandler.BqSchema {
	log.Printf("fixNestedFieldNames() executing")
	for idx := 0; idx < len(nestedSchema); idx++ {
		fieldNameParts := strings.Split(nestedSchema[idx].Name, ".")
		if len(fieldNameParts) > 0 {
			shortName := fieldNameParts[len(fieldNameParts)-1]
			nestedSchema[idx].Name = shortName
		}
		if nestedSchema[idx].Fields != nil {
			nestedSchema[idx].Fields = sb.fixNestedFieldNames(nestedSchema[idx].Fields)
		}
	}
	log.Printf("fixNestedFieldNames() completed")
	return nestedSchema
}

// Convert transforms a 2-dimensional array of nested fields into
// a list of structs (BqSchema) using recursion
func (sb *SpreadsheetToBq) Convert(data [][]interface{}) []bqhandler.BqSchema {
	log.Printf("%d: Convert() executing", len(data))
	fields := make([]bqhandler.BqSchema, 0)
	if len(data) == 0 {
		log.Printf("Convert(): No more elements in data")
		return fields
	}
	if fmt.Sprintf("%v", sb.getBqSchema(data[0]).Name) == "Field name" {
		data = sb.removeItemAtIndex(data, 0)
	}
	for len(data) > 0 {
		currentField := sb.getBqSchema(data[0])
		currentField.Name = sb.fixFieldName(currentField.Name)
		log.Printf("Convert().CurrentField: %s", currentField.Name)
		data = sb.removeItemAtIndex(data, 0)
		if currentField.Type == "RECORD" {
			var recordFields [][]interface{}
			currentField.Mode = ""
			for sb.nextFieldInCurrentRecord(currentField.Name, data) {
				recordFields = append(recordFields, data[0])
				data = sb.removeItemAtIndex(data, 0)
			}
			currentField.Fields = sb.Convert(recordFields)
		}
		fields = append(fields, *currentField)
	}
	// BQ does not allow dots in field name
	fields = sb.fixNestedFieldNames(fields)
	log.Printf("Convert() completed")
	return fields
}
