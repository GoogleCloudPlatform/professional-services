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

package configparser

import (
	"encoding/json"
	"log"
	"strings"

	util "github.com/GoogleCloudPlatform/bqman/util"
)

// Config is used to hold BQ table clustering / partitioning info
type Config struct {
	TimePartitioningField  string   `json:timePartitioningField`
	TimePartitioningPeriod string   `json:timePartitioningPeriod`
	ClusteringFields       []string `json:clusteringFields`
}

// ConfigParser holds a map of Config data as key/value pairs
type ConfigParser struct {
	ConfigFile  string
	ConfigMap   map[string]Config
	ConfigBytes []byte
}

// NewConfigParser loads a config JSON file and returns a
// pointer to ConfigParser
func NewConfigParser(file string) *ConfigParser {
	log.Printf("NewConfigParser(%s) executing", file)
	configParser := new(ConfigParser)
	util.CheckFile(file)
	configParser.ConfigFile = file
	configParser.LoadConfig()
	configParser.Parse()
	configParser.Show()
	log.Printf("NewConfigParser(%s) completed", file)
	return configParser
}

// LoadConfig reads a JSON config file
func (cp *ConfigParser) LoadConfig() {
	log.Printf("LoadConfig(%s) executing", cp.ConfigFile)
	configLines, err := util.ReadFileToStringArray(cp.ConfigFile)
	util.CheckError(err, "ProcessBigQueryTables().ReadFile() failed")
	configSchema := strings.Join(configLines[:], " ")
	cp.ConfigBytes = []byte(configSchema)
	log.Printf("LoadConfig() completed")
}

// Parse unmarshals the byte array contain JSON config data
func (cp *ConfigParser) Parse() {
	log.Printf("Parse() executing")
	cp.ConfigMap = make(map[string]Config)
	err := json.Unmarshal(cp.ConfigBytes, &cp.ConfigMap)
	util.CheckError(err, "json.Unmarshal() failed")
	log.Printf("Parse() completed")
}

// Show is a convenience method to log the clustering / partitioning data
func (cp *ConfigParser) Show() {
	for table, config := range cp.ConfigMap {
		log.Printf("table: %s", table)
		log.Printf("TimePartitioningField: %s", config.TimePartitioningField)
		log.Printf("TimePartitioningPeriod: %v", config.TimePartitioningPeriod)
		log.Printf("ClusteringFields: %v", config.ClusteringFields)
	}
}
