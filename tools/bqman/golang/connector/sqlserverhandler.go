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
	"database/sql"
	"encoding/json"
	"fmt"
	"log"

	bqhandler "github.com/GoogleCloudPlatform/bqman/bqhandler"
	util "github.com/GoogleCloudPlatform/bqman/util"

	// The go-mssqldb driver is used to connect to SQL Server
	_ "github.com/denisenkom/go-mssqldb"
)

// https://docs.microsoft.com/en-us/azure/azure-sql/database/connect-query-go

// SQLServerHandler is used to hold connection information to SQL Server
type SQLServerHandler struct {
	Ctx      context.Context
	Db       *sql.DB
	Server   string
	Port     int
	User     string
	Password string
	Database string
}

// SQLServerColumnInfo is used to hold database table colum info
type SQLServerColumnInfo struct {
	ColumnName            sql.NullString
	ColumnDescription     sql.NullString
	OrdinalPosition       sql.NullInt32
	IsNullable            sql.NullString
	Datatype              sql.NullString
	NumericPrecision      sql.NullInt32
	NumericPrecisionRadix sql.NullInt32
	NumericScale          sql.NullInt32
	IsPrimaryKey          sql.NullInt32
}

// SQLServerBigQueryColumnMap is used to hold mapping
// between SQL Server and BigQuery datatypes
var SQLServerBigQueryColumnMap map[string]string

// NewSQLServerHandler is used to open a database connection
// It returns a pointer to NewSQLServerHandler
func NewSQLServerHandler(server, user, password, database string, port int) *SQLServerHandler {
	log.Printf("NewSQLServerHandler() executing")
	connString := fmt.Sprintf("server=%s;user id=%s;password=%s;port=%d;database=%s;",
		server, user, password, port, database)
	db, err := sql.Open("sqlserver", connString)
	util.CheckError(err, "NewSQLServerHandler().sql.Open() failed!")
	ctx := context.Background()
	handler := new(SQLServerHandler)
	err = db.PingContext(ctx)
	util.CheckError(err, "NewSQLServerHandler().db.PingContext() failed!")
	handler.Ctx = ctx
	handler.Db = db
	handler.Server = server
	handler.Port = port
	handler.User = user
	handler.Password = password
	handler.Database = database
	SQLServerBigQueryColumnMap = map[string]string{
		"bigint identity":  "INTEGER",
		"bigint":           "INTEGER",
		"int":              "INTEGER",
		"nvarchar":         "STRING",
		"varchar":          "STRING",
		"datetime":         "DATETIME",
		"datetime2":        "DATETIME",
		"bit":              "BOOLEAN",
		"timestamp":        "STRING",
		"sysname":          "STRING",
		"char":             "STRING",
		"float":            "FLOAT",
		"decimal":          "NUMERIC",
		"smallint":         "INTEGER",
		"money":            "NUMERIC",
		"date":             "DATE",
		"tinyint":          "INTEGER",
		"Enumeration":      "INTEGER",
		"LongName":         "STRING",
		"boolean":          "BOOLEAN",
		"double":           "FLOAT",
		"xml":              "STRING",
		"varbinary":        "STRING",
		"uniqueidentifier": "STRING",
		"nchar":            "STRING",
		"geography":        "GEOGRAPHY",
		"hierarchyid":      "STRING",
		"numeric":          "NUMERIC",
		"smallmoney":       "NUMERIC",
		"time":             "TIME",
	}
	log.Printf("NewSQLServerHandler() completed")
	return handler
}

// GetTableSchemas constructs and executes a prepared SQL query
// to extract a unique list of table schemas for a given
// SQL Server table catalog
func (ssh *SQLServerHandler) GetTableSchemas(tableCatalog string) []string {
	log.Printf("GetTableSchemas() executing")
	tsql := `SELECT DISTINCT TABLE_SCHEMA 
		FROM INFORMATION_SCHEMA.TABLES t 
		WHERE TABLE_CATALOG = @TableCatalog
		AND TABLE_SCHEMA <> 'dbo'
		ORDER BY TABLE_SCHEMA`
	stmt, err := ssh.Db.PrepareContext(ssh.Ctx, tsql)
	util.CheckError(err, "GetTableSchemas().db.PrepareContext() failed")
	defer stmt.Close()
	rows, err := stmt.QueryContext(ssh.Ctx, sql.Named("TableCatalog", tableCatalog))
	util.CheckError(err, "GetTableSchemas().stmt.QueryContext() failed")
	defer rows.Close()
	tableSchemas := make([]string, 0)
	for rows.Next() {
		var tableSchema string
		err := rows.Scan(&tableSchema)
		util.CheckError(err, "GetTableSchemas().rows.Scan() failed")
		tableSchemas = append(tableSchemas, tableSchema)
	}
	log.Printf("GetTableSchemas() completed")
	return tableSchemas
}

// GetTables constructs and executes a prepared SQL query to
// fetch a list of tables for a given combination of tableCatalog
// and tableSchema
func (ssh *SQLServerHandler) GetTables(tableCatalog, tableSchema string) []string {
	log.Printf("GetColumns() executing")
	tsql := `SELECT TABLE_NAME 
		FROM INFORMATION_SCHEMA.TABLES t 
		WHERE TABLE_TYPE = 'BASE TABLE'
		AND TABLE_CATALOG = @TableCatalog
		AND TABLE_SCHEMA = @TableSchema
		ORDER BY TABLE_NAME`
	stmt, err := ssh.Db.PrepareContext(ssh.Ctx, tsql)
	util.CheckError(err, "GetColumns().db.PrepareContext() failed")
	defer stmt.Close()
	rows, err := stmt.QueryContext(ssh.Ctx,
		sql.Named("TableCatalog", tableCatalog),
		sql.Named("TableSchema", tableSchema))
	util.CheckError(err, "GetColumns().stmt.QueryContext() failed")
	defer rows.Close()
	tables := make([]string, 0)
	for rows.Next() {
		var tableSchema string
		err := rows.Scan(&tableSchema)
		util.CheckError(err, "GetColumns().rows.Scan() failed")
		tables = append(tables, tableSchema)
	}
	log.Printf("GetColumns() completed")
	return tables
}

// GetColumns constructs and executes a prepared SQL query to fetch
// the column info for a given SQL server table
func (ssh *SQLServerHandler) GetColumns(tableCatalog, tableSchema, tableName string) []SQLServerColumnInfo {
	log.Printf("GetColumns() executing")
	tsql := `
	WITH primary_keys AS (
		SELECT cc.TABLE_CATALOG, cc.TABLE_SCHEMA, cc.TABLE_NAME, cc.COLUMN_NAME  
		FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
		JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE cc 
		ON cc.CONSTRAINT_CATALOG = tc.CONSTRAINT_CATALOG 
		AND cc.CONSTRAINT_SCHEMA = tc.CONSTRAINT_SCHEMA 
		AND cc.CONSTRAINT_NAME = tc.CONSTRAINT_NAME 
		WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY') 
	SELECT c.COLUMN_NAME, 
	prop.value AS COL_DESC,
	c.ORDINAL_POSITION, c.IS_NULLABLE, c.DATA_TYPE, c.NUMERIC_PRECISION, c.NUMERIC_PRECISION_RADIX, c.NUMERIC_SCALE, 
	(CASE WHEN pk.COLUMN_NAME IS NOT NULL THEN 1 ELSE 0 END) AS IS_PRIMARY_KEY
	FROM INFORMATION_SCHEMA.COLUMNS c 
	LEFT JOIN primary_keys pk 
		ON c.TABLE_CATALOG = pk.TABLE_CATALOG
		AND  c.TABLE_SCHEMA = pk.TABLE_SCHEMA
		AND  c.TABLE_NAME = pk.TABLE_NAME
		AND   c.COLUMN_NAME = pk.COLUMN_NAME
	INNER JOIN sys.columns AS sc ON sc.object_id = object_id(c.table_schema + '.' + c.table_name)
		AND sc.NAME = c.COLUMN_NAME
	LEFT JOIN sys.extended_properties prop ON prop.major_id = sc.object_id
		AND prop.minor_id = sc.column_id
		AND prop.NAME = 'MS_Description'  
		AND prop.class_desc = 'OBJECT_OR_COLUMN'
	WHERE c.TABLE_CATALOG = @TableCatalog
	AND c.TABLE_SCHEMA = @TableSchema
	AND c.TABLE_NAME = @TableName
	ORDER BY c.TABLE_CATALOG, c.TABLE_SCHEMA, c.TABLE_NAME, c.ORDINAL_POSITION, IS_PRIMARY_KEY`
	stmt, err := ssh.Db.PrepareContext(ssh.Ctx, tsql)
	util.CheckError(err, "GetColumns().db.PrepareContext() failed")
	defer stmt.Close()
	rows, err := stmt.QueryContext(ssh.Ctx,
		sql.Named("TableCatalog", tableCatalog),
		sql.Named("TableSchema", tableSchema),
		sql.Named("TableName", tableName))
	util.CheckError(err, "GetColumns().stmt.QueryContext() failed")
	defer rows.Close()
	columns := make([]SQLServerColumnInfo, 0)
	for rows.Next() {
		columnInfo := new(SQLServerColumnInfo)
		err := rows.Scan(
			&columnInfo.ColumnName,
			&columnInfo.ColumnDescription,
			&columnInfo.OrdinalPosition,
			&columnInfo.IsNullable,
			&columnInfo.Datatype,
			&columnInfo.NumericPrecision,
			&columnInfo.NumericPrecisionRadix,
			&columnInfo.NumericScale,
			&columnInfo.IsPrimaryKey,
		)
		util.CheckError(err, "GetColumns().rows.Scan() failed")
		columns = append(columns, *columnInfo)
	}
	log.Printf("GetColumns() completed")
	return columns
}

// ReadDatabaseSchema fetches the table schema from SQL Server
func (ssh *SQLServerHandler) ReadDatabaseSchema() {
	log.Printf("ReadDatabaseSchema() executing")
	sql := "select table_schema, table_name, table_type from information_schema.tables"
	rows, err := ssh.Db.QueryContext(ssh.Ctx, sql)
	defer rows.Close()
	util.CheckError(err, "ReadDatabaseSchema().db.QueryContext() failed")
	var count int
	for rows.Next() {
		var tableSchema, tableName, tableType string
		err := rows.Scan(&tableSchema, &tableName, &tableType)
		util.CheckError(err, "ReadDatabaseSchema().rows.Scan() failed")
		fmt.Printf("table_schema: %s; table_name: %s; table_type: %s\n", tableSchema, tableName, tableType)
		count++
	}
	fmt.Printf("Record Count: %d\n", count)
	log.Printf("ReadDatabaseSchema() completed")
}

// ConvertColumnInfoToBqSchema accepts an slice of SQLServerColumnInfo
// and returns a slice of BqSchema (BigQuery JSON schema)
func (ssh *SQLServerHandler) ConvertColumnInfoToBqSchema(columnInfos []SQLServerColumnInfo) []bqhandler.BqSchema {
	log.Printf("ConvertColumnInfoToBqSchema() executing")
	bqSchemas := make([]bqhandler.BqSchema, 0)
	for _, ci := range columnInfos {
		bqSchema := &bqhandler.BqSchema{
			Name:        ci.ColumnName.String,
			Description: ci.ColumnDescription.String,
			Type:        SQLServerBigQueryColumnMap[ci.Datatype.String],
		}
		if ci.IsNullable.String == "NO" || ci.IsPrimaryKey.Int32 == 1 {
			bqSchema.Mode = "Required"
		} else {
			bqSchema.Mode = "Nullable"
		}
		bqSchemas = append(bqSchemas, *bqSchema)
	}
	log.Printf("ConvertColumnInfoToBqSchema() completed")
	return bqSchemas
}

// ConvertToJSON converts a slice of BqSchema objects to a JSON byte array
func (ssh *SQLServerHandler) ConvertToJSON(records []bqhandler.BqSchema) []byte {
	log.Printf("ConvertToJSON() executing")
	bytes, err := json.Marshal(records)
	if err != nil {
		log.Fatalf("ConvertToJSON(): json.Marshal() failed")
	}
	log.Printf("ConvertToJSON() completed")
	return bytes
}
