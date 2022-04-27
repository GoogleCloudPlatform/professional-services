package main

/*
   Copyright 2022 Google LLC

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

import (
	"context"
	"encoding/csv"
	"flag"
	"fmt"
	"io/ioutil"
	"os"

	log "github.com/golang/glog"

	yaml "gopkg.in/yaml.v3"

	instance_mapper "github.com/GoogleCloudPlatform/professional-services/tools/instance_mapper"
)

var DEFAULT_MATCHER string = `
(source.total_memory.within_percentage(target.total_memory, 10) ? 10.0 : 0.0) 	        +
(source.total_memory.within_percentage(target.total_memory, 20) ? 5.0 : 0.0) 	        +
(source.total_memory.within_percentage(target.total_memory, 40) ? 2.5 : 0.0) 	        +
(source.total_vcpus.within_percentage(target.total_vcpus, 10) ? 10.0 : 0.0) 	        +
(source.total_vcpus.within_percentage(target.total_vcpus, 20) ? 5.0 : 0.0) 		        +
(source.total_vcpus.within_percentage(target.total_vcpus, 40) ? 2.5 : 0.0)		        +
(source.total_gpus > 0 ? (source.total_gpus == target.total_gpus && gpu_map[source.gpu_type] == target.gpu_type ? 20.0 : -20.0) : 0.0) +
{ "e2" : 4.0, "n2d": 3.0, "n2": 2.0, "c2d": 1.0, "t2d": 1.0, "m2": 2.0, "m1": 1.0, "c2": 1.0, "a2" : 1.0, "n1": 0.0, "g1": 0.0, "f1": 0.0 }[target.family]
`

var DEFAULT_MATCHER_SQL string = `
(source.total_memory.within_percentage(target.total_memory, 10) ? 10.0 : 0.0) 	        +
(source.total_memory.within_percentage(target.total_memory, 20) ? 5.0 : 0.0) 	        +
(source.total_memory.within_percentage(target.total_memory, 40) ? 2.5 : 0.0) 	        +
(source.total_vcpus.within_percentage(target.total_vcpus, 10) ? 10.0 : 0.0) 	        +
(source.total_vcpus.within_percentage(target.total_vcpus, 20) ? 5.0 : 0.0) 		        +
(source.total_vcpus.within_percentage(target.total_vcpus, 40) ? 2.5 : 0.0)				+
(source.db_engine == target.db_engine ? 50.0 : -50.0)									+
(source.db_version_major == target.db_version_major ? 25.0 : 0.0)						+
(source.db_version_minor == target.db_version_major ? 5.0 : 0.0)
`

var RDSEngines []string = []string{"mysql", "postgres", "sqlserver-ee", "sqlserver-se", "sqlserver-ex", "sqlserver-web"}

func main() {
	processAwsEC2 := flag.Bool("aws-ec2", false, "process AWS EC2 instance types")
	processAwsRDS := flag.Bool("aws-rds", false, "process AWS RDS instance types")
	processAzureVM := flag.Bool("azure-vm", false, "process Azure VM instance types")
	processCloudSQL := flag.Bool("cloud-sql", false, "process Cloud SQL instance types")
	awsRole := flag.String("aws-role", "", "AWS role to assume via STS")
	azureSubscriptionId := flag.String("azure-subscription-id", "", "set Azure subscription ID")
	gcpProject := flag.String("gcp-project", os.Getenv("GOOGLE_PROJECT_ID"), "GCP project ID")
	gcpPriceListFile := flag.String("gcp-price-list", "", "load GCP price list JSON")
	gcpPriceListRegion := flag.String("gcp-price-list-region", "", "GCP price list region")
	customMatcher := flag.String("custom-matcher", "", "use a custom instance CEL matcher (file)")
	customMatcherSql := flag.String("custom-matcher-sql", "", "use a custom SQL CEL matcher (file)")
	gpuMapping := flag.String("gpu-mapping", "gpu-mapping.yaml", "use GPU mapping file")
	sqlMapping := flag.String("sql-mapping", "sql-mapping.yaml", "use SQL version mapping file")
	cache := flag.String("cache-file", "instance-data.yaml", "file for saving/loading cache data")
	debug := flag.Bool("debug", false, "enable debugging")
	numberOfResults := flag.Int("num-results", 3, "amount of matches to return")
	showDefaultMatcher := flag.Bool("show-cel", false, "show default built-in CEL matchers")
	flag.Parse()

	if *showDefaultMatcher {
		fmt.Printf("Default matcher for compute instances is:\n%s\nDefault matcher for SQL instances is: %s\n", DEFAULT_MATCHER, DEFAULT_MATCHER_SQL)
		return
	}

	instanceMapper := instance_mapper.InstanceMapper{}

	log.Infoln("Cloud Instance Mapper 1.0, by Google Professional Services")
	if !*processAwsEC2 && !*processAzureVM && !*processAwsRDS {
		log.Errorln("Specify AWS EC2, RDS and/or Azure VM processing with command line flags.")
		os.Exit(1)
	}

	ctx := context.TODO()

	if *cache != "" {
		if _, err := os.Stat(*cache); err == nil {
			log.Infof("Loading instance data from: %s", *cache)
			yamlFile, err := ioutil.ReadFile(*cache)
			if err != nil {
				log.Fatal(err)
			}

			err = yaml.Unmarshal(yamlFile, &instanceMapper.InstanceData)
			if err != nil {
				log.Fatal(err)
			}
		} else {
			log.Infof("No cached data file found: %s", *cache)
		}
	}

	gpuMap := instance_mapper.GPUMap{}
	if *gpuMapping != "" {
		log.Infof("Loading GPU mapping data from: %s", *gpuMapping)
		yamlFile, err := ioutil.ReadFile(*gpuMapping)
		if err != nil {
			log.Fatal(err)
		}

		err = yaml.Unmarshal(yamlFile, &gpuMap)
		if err != nil {
			log.Fatal(err)
		}
	}

	sqlMap := instance_mapper.SQLMap{}
	if *sqlMapping != "" {
		log.Infof("Loading SQL mapping data from: %s", *sqlMapping)
		yamlFile, err := ioutil.ReadFile(*sqlMapping)
		if err != nil {
			log.Fatal(err)
		}

		err = yaml.Unmarshal(yamlFile, &sqlMap)
		if err != nil {
			log.Fatal(err)
		}
	}

	var gcpPriceList *instance_mapper.GcpPriceList
	if *gcpPriceListFile != "" {
		var err error
		gcpPriceList, err = instanceMapper.LoadGCPPriceList(*gcpPriceListFile)
		if err != nil {
			log.Fatal(err)
		}
	}

	var err error
	if *processAzureVM {
		if len(instanceMapper.InstanceData.AzureInstances) == 0 {
			log.Infoln("Fetching Azure instance types...")
			err = instanceMapper.LoadAzureInstanceTypes(ctx, *azureSubscriptionId, *debug)
			if err != nil {
				log.Fatalln(err.Error())
			}
		} else {
			log.Infoln("Using cached Azure instance type data...")
		}
	}
	if len(instanceMapper.InstanceData.GcpInstances) == 0 {
		log.Infoln("Fetching GCP instance types...")
		err = instanceMapper.LoadGCPInstanceTypes(ctx, *gcpProject, gcpPriceList, *debug)
		if err != nil {
			log.Fatal(err)
		}
	} else {
		log.Infoln("Using cached GCP instance type data...")
	}
	if *processCloudSQL {
		if len(instanceMapper.InstanceData.GcpSqlInstances) == 0 {
			log.Infoln("Fetching GCP Cloud SQL instance types...")
			err = instanceMapper.LoadGCPCloudSQLInstanceTypes(ctx, *gcpProject, &sqlMap, *debug)
			if err != nil {
				log.Fatal(err)
			}
		} else {
			log.Infoln("Using cached GCP Cloud SQL instance type data...")
		}
	}
	if *processAwsEC2 || *processAwsRDS {
		if *awsRole == "" {
			log.Fatalln("AWS role must be defined!")
		}
		if *processAwsEC2 {
			if len(instanceMapper.InstanceData.AwsInstances) == 0 {
				log.Infoln("Fetching AWS EC2 instance types...")
				err = instanceMapper.LoadAWSInstanceTypes(ctx, *awsRole, *debug)
				if err != nil {
					log.Fatalln(err.Error())
				}
			} else {
				log.Infoln("Using cached AWS EC2 instance type data...")
			}
		}
		if *processAwsRDS {
			if len(instanceMapper.InstanceData.AwsRdsInstances) == 0 {
				if len(instanceMapper.InstanceData.AwsInstances) == 0 {
					log.Fatalln("AWS EC2 instance types must be retrieved also, please specify -aws-ec2.")
				}
				log.Infoln("Fetching AWS RDS instance types...")
				err = instanceMapper.LoadAWSRDSInstanceTypes(ctx, *awsRole, RDSEngines, *debug)
				if err != nil {
					log.Fatalln(err.Error())
				}
			} else {
				log.Infoln("Using cached AWS RDS instance type data...")
			}
		}
	}

	env, err := instance_mapper.GetEnv()
	if err != nil {
		log.Fatal(err)
	}

	// Instance CEL
	instanceMatcher := DEFAULT_MATCHER
	if *customMatcher != "" {
		b, err := ioutil.ReadFile(*customMatcher)
		if err != nil {
			log.Fatalln(err)
		}
		instanceMatcher = string(b)
	}
	instanceAst, instanceIss := env.Compile(instanceMatcher)
	if instanceIss.Err() != nil {
		log.Fatalf("Encountered error when compiling instance CEL: %s\n", instanceIss.Err())
	}
	instancePrg, err := env.Program(instanceAst)
	if err != nil {
		log.Fatalf("Encountered error when processing instance CEL: %s\n", err.Error())
	}

	// SQL CEL
	sqlMatcher := DEFAULT_MATCHER_SQL
	if *customMatcherSql != "" {
		b, err := ioutil.ReadFile(*customMatcherSql)
		if err != nil {
			log.Fatalln(err)
		}
		sqlMatcher = string(b)
	}
	sqlAst, sqlIss := env.Compile(sqlMatcher)
	if sqlIss.Err() != nil {
		log.Fatalf("Encountered error when compiling SQL CEL: %s\n", sqlIss.Err())
	}
	sqlPrg, err := env.Program(sqlAst)
	if err != nil {
		log.Fatalf("Encountered error when processing SQL CEL: %s\n", err.Error())
	}

	csvWriter := csv.NewWriter(os.Stdout)
	if *processAwsEC2 {
		log.Infof("Mapping AWS EC2 instances to GCP instances...")
		err := instanceMapper.MapInstances(csvWriter, &instanceMapper.InstanceData.AwsInstances, &instanceMapper.InstanceData.GcpInstances, instancePrg, gpuMap, *gcpPriceListRegion, *numberOfResults)
		if err != nil {
			log.Fatalln(err)
		}
	}
	if *processAwsRDS {
		log.Infof("Mapping AWS RDS instances to GCP Cloud SQL instances...")
		err := instanceMapper.MapInstances(csvWriter, &instanceMapper.InstanceData.AwsRdsInstances, &instanceMapper.InstanceData.GcpSqlInstances, sqlPrg, gpuMap, *gcpPriceListRegion, *numberOfResults)
		if err != nil {
			log.Fatalln(err)
		}
	}
	if *processAzureVM {
		log.Infof("Mapping Azure instances to GCP instances...")
		err := instanceMapper.MapInstances(csvWriter, &instanceMapper.InstanceData.AzureInstances, &instanceMapper.InstanceData.GcpInstances, instancePrg, gpuMap, *gcpPriceListRegion, *numberOfResults)
		if err != nil {
			log.Fatalln(err)
		}
	}
	csvWriter.Flush()

	if *cache != "" {
		yamlData, err := yaml.Marshal(&instanceMapper.InstanceData)
		if err != nil {
			log.Fatal(err)
		}

		err = ioutil.WriteFile(*cache, yamlData, 0644)
		if err != nil {
			log.Fatal(err)
		}
		log.Infof("Instance data saved to: %s\n", *cache)
	}

}
