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
	"context"
	"encoding/json"
	"fmt"
	"log"

	sheets "google.golang.org/api/sheets/v4"
)

// SpreadsheetHandler is used to interface with
// Google Spreadsheets using Google Sheets API
type SpreadsheetHandler struct {
	Ctx              context.Context
	SheetsService    *sheets.Service
	SpreadsheetID    string
	SheetSummary     []SpreadsheetInfo
	SheetSummaryJSON []byte
}

// SpreadsheetInfo is used to select a range of
// cells from a Google Spreadsheet
type SpreadsheetInfo struct {
	SheetID    int64
	SheetTitle string
	SheetRange string
}

// NewSpreadsheetHandler accepts a Google Spreadsheet ID
// as an argument and returns a pointer to the
// SpreadsheetHandler struct
func NewSpreadsheetHandler(ssID string) *SpreadsheetHandler {
	log.Printf("NewSpreadsheetHandler() executing")
	ctx := context.Background()
	var err error
	handler := new(SpreadsheetHandler)
	handler.Ctx = ctx
	handler.SheetsService, err = sheets.NewService(ctx)
	handler.SpreadsheetID = ssID
	//handler.SheetsService, err = sheets.NewSpreadsheetsService(ctx)
	if err != nil {
		log.Printf("NewDriveHandler().drive3.NewService() failed")
		return nil
	}
	log.Printf("NewSpreadsheetHandler() completed")
	return handler
}

// GetSheets uses the Google Spreadsheet service to
// fetch the worksheets and store the worksheet ID
// and worksheet title in the SheetInfo struct.
// The SheetSummary struct holds a list of SheetInfo
// structs and the serialized byte array is stored
// in SheetSummaryJSON
func (sh *SpreadsheetHandler) GetSheets() {
	log.Printf("GetSheets() executing")
	ssService := sheets.NewSpreadsheetsService(sh.SheetsService)
	ssGetCall := ssService.Get(sh.SpreadsheetID)
	spreadsheet, err := ssGetCall.Do()
	if err != nil {
		log.Fatalf("GetSheets().ssGetCall() failed: %v", err.Error())
	}
	sheetSummary := make([]SpreadsheetInfo, 0)
	sheets := spreadsheet.Sheets
	for _, sheet := range sheets {
		sheetProperties := sheet.Properties
		sheetInfo := &SpreadsheetInfo{
			SheetID:    sheetProperties.SheetId,
			SheetTitle: sheetProperties.Title,
		}
		sheetSummary = append(sheetSummary, *sheetInfo)
		fmt.Printf("sheetId: %d; sheetTitle: %s\n", sheetInfo.SheetID, sheetInfo.SheetTitle)
	}
	sh.SheetSummary = sheetSummary
	bytes, err := json.Marshal(sheetSummary)
	if err != nil {
		log.Fatalf("GetSheets(): json.Marshal() failed")
	}
	sh.SheetSummaryJSON = bytes
	log.Printf("GetSheets() completed")
}

// GetIndex accepts a Google Spreadsheet range
// as an argument and returns a map[string]string
// where the key is column 1 (tabname)
// and the value is column 4 (range)
// tabname	rangestart	rangeend	range
// ds_activities	F1	I37	ds_activities!F1:I37
func (sh *SpreadsheetHandler) GetIndex(ssRange string) map[string]string {
	log.Printf("GetIndex() executing")
	m := make(map[string]string)
	data := sh.GetData(ssRange)
	for r, row := range data {
		if r == 0 {
			continue
		}
		key := fmt.Sprintf("%s", row[0])
		val := fmt.Sprintf("%s", row[3])
		m[key] = val
	}
	log.Printf("GetIndex() completed")
	return m
}

// GetData accepts a Google Spreadsheet range as an argument
// and returns a 2-dimensional array of interfaces holding
// the values contained in the range
func (sh *SpreadsheetHandler) GetData(ssRange string) [][]interface{} {
	log.Printf("GetData() executing")
	ssService, err := sheets.NewService(sh.Ctx)
	if err != nil {
		log.Fatalf("GetData().NewService() failed")
	}
	ssValuesService := sheets.NewSpreadsheetsValuesService(ssService)
	ssValuesGetCall := ssValuesService.Get(sh.SpreadsheetID, ssRange)
	valueRange, err := ssValuesGetCall.Do()
	if err != nil {
		log.Fatalf("GetData().ssValuesGetCall().Do() failed (%s)", err.Error())
	}
	log.Printf("GetData() completed")
	return valueRange.Values
}

// ShowSheets is a convenience method to display the
// contents of a worksheet in JSON format
func (sh *SpreadsheetHandler) ShowSheets() {
	fmt.Printf("%s\n", string(sh.SheetSummaryJSON))
}

// ConvertInterfaceArrayToJSON converts a 2-dimensional array
// of interfaces holding the values of a range within a
// spreadsheet and returns the JSON as byte array
func (sh *SpreadsheetHandler) ConvertInterfaceArrayToJSON(values [][]interface{}) []byte {
	log.Printf("ConvertInterfaceArrayToJSON() executing")
	bytes, err := json.Marshal(values)
	if err != nil {
		log.Fatalf("executing(): json.Marshal() failed")
	}
	log.Printf("ConvertInterfaceArrayToJSON() completed")
	return bytes
}

// ConvertMapToJSON converts a map[string] string to JSON byte array
func (sh *SpreadsheetHandler) ConvertMapToJSON(m map[string]string) []byte {
	log.Printf("ConvertMapToJSON() executing")
	bytes, err := json.Marshal(m)
	if err != nil {
		log.Fatalf("ConvertMapToJSON(): json.Marshal() failed")
	}
	log.Printf("ConvertMapToJSON() completed")
	return bytes
}
