package executionmode

import (
	"fmt"
	"log"

	"github.com/iancoleman/strcase"
)

// ExecutionMode is used to execute the various BiqQuery
// CI/CD operations
type ExecutionMode int

const (
	// PullMode is used to extract BigQuery JSON schema files for a given dataset
	PullMode ExecutionMode = iota
	// PushMode is used to create a new dataset and tables in BigQuery
	PushMode
	// BackupMode is used to backup an entire BigQuery dataset to GCS
	BackupMode
	// RestoreMode is used to restore a BigQuery dataset from GCS backup CSV files
	RestoreMode
	// UpdateMode is used to add new NULLABLE columns at the end of a table
	UpdateMode
	// PatchMode is used to modify column descriptions
	PatchMode
	// DeleteMode is used to delete an empty BigQuery dataset
	DeleteMode
	// DestroyMode is used to delete a non-empty BigQuery dataset
	DestroyMode
	// ImportSpreadsheetMode is used to import BigQuery schema from Google Sheets
	ImportSpreadsheetMode
	// ImportSqlserverMode is used to import BigQuery schema from SQL Server
	ImportSqlserverMode
)

func (e ExecutionMode) String() string {
	return [...]string{"pull", "push",
		"backup", "restore",
		"update", "patch",
		"delete", "destroy",
		"import_spreadsheet", "import_sqlserver"}[e]
}

// ExecutionModeInfo is used to hold configuration data for
// program control flow
type ExecutionModeInfo struct {
	ModeDir            string
	TestPropertiesFile string
	TestDataDir        string
}

// ExecutionModes is a global map of ExecutionModeInfo objects
var (
	ExecutionModes map[ExecutionMode]*ExecutionModeInfo
)

// InitExecutionModes is invoked once ONLY at program start to load
// configuration data for program execution
func InitExecutionModes() {
	log.Printf("InitExecutionModes() executing")
	ExecutionModes = make(map[ExecutionMode]*ExecutionModeInfo)
	ExecutionModes[PullMode] = &ExecutionModeInfo{ModeDir: fmt.Sprint(PullMode)}
	ExecutionModes[PushMode] = &ExecutionModeInfo{ModeDir: fmt.Sprint(PushMode)}
	ExecutionModes[BackupMode] = &ExecutionModeInfo{ModeDir: fmt.Sprint(BackupMode)}
	ExecutionModes[RestoreMode] = &ExecutionModeInfo{ModeDir: fmt.Sprint(RestoreMode)}
	ExecutionModes[UpdateMode] = &ExecutionModeInfo{ModeDir: fmt.Sprint(UpdateMode)}
	ExecutionModes[PatchMode] = &ExecutionModeInfo{ModeDir: fmt.Sprint(PatchMode)}
	ExecutionModes[DeleteMode] = &ExecutionModeInfo{ModeDir: fmt.Sprint(DeleteMode)}
	ExecutionModes[DestroyMode] = &ExecutionModeInfo{ModeDir: fmt.Sprint(DestroyMode)}
	ExecutionModes[ImportSqlserverMode] = &ExecutionModeInfo{ModeDir: fmt.Sprint(ImportSqlserverMode)}
	ExecutionModes[ImportSpreadsheetMode] = &ExecutionModeInfo{ModeDir: fmt.Sprint(ImportSpreadsheetMode)}
	for _, v := range ExecutionModes {
		v.TestDataDir = fmt.Sprintf("TestProcess%s", strcase.ToCamel(v.ModeDir))
		v.TestPropertiesFile = fmt.Sprintf("%s.properties", v.TestDataDir)
	}
	log.Printf("InitExecutionModes() completed")
}

