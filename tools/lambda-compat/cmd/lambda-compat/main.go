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
	"encoding/json"
	"os"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"

	"cloud.google.com/go/compute/metadata"
	lambdacompat "github.com/GoogleCloudPlatform/professional-services/tools/lambda-compat"
)

var regionMap map[string]string = map[string]string{
	"europe-north1":           "eu-north-1",     // Europe (Stockholm) -> Hamina, Finland
	"asia-south1":             "ap-south-1",     // Asia Pacific (Mumbai) -> Mumbai, India
	"asia-south2":             "ap-south-1",     // Asia Pacific (Mumbai) -> Delhi, India
	"asia-east1":              "ap-east-1",      // Asia Pacific (Mumbai) -> Changhua, Taiwan
	"asia-east2":              "ap-east-1",      // Asia Pacific (Mumbai) -> Hong Kong
	"europe-central2":         "eu-central-1",   // Europe (Frankfurt) -> Warsaw, Poland
	"europe-west1":            "eu-west-3",      // Europe (Paris) -> St. Ghislain, Belgium
	"europe-west2":            "eu-west-2",      // Europe (London) -> London, United Kingdom
	"europe-west3":            "eu-central-1",   // Europe (Frankfurt) -> Frankfurt, Germany
	"europe-west4":            "eu-central-1",   // Europe (Frankfurt) -> Eemshaven, Netherlands
	"asia-northeast2":         "ap-northeast-3", // Asia Pacific (Osaka) -> Osaka, Japan
	"asia-northeast3":         "ap-northeast-2", // Asia Pacific (Seoul) -> Seoul, South Korea
	"asia-northeast1":         "ap-northeast-1", // Asia Pacific (Tokyo) -> Tokyo, Japan
	"southamerica-east1":      "sa-east-1",      // South America (São Paolo) -> São Paolo, Brazil
	"southamerica-west1":      "sa-east-1",      // South America (São Paolo) -> Santiago, Chile
	"northamerica-northeast1": "ca-central-1",   // Canada (Central) -> Montreal, Canada
	"northamerica-northeast2": "ca-central-1",   // Canada (Central) -> Toronto, Canada
	"asia-southeast1":         "ap-southeast-1", // Asia Pacific (Singapore) -> Singapore
	"australia-southeast1":    "ap-southeast-2", // Asia Pacific (Sydney) -> Sydney, Australia
	"australia-southeast2":    "ap-southeast-2", // Asia Pacific (Sydney) -> Melbourne, Australia
	"us-east1":                "us-east-1",      // US East (N. Virginia) -> Virginia, United States
	"us-east4":                "us-east-1",      // US East (N. Virginia) -> Virginia, United States
	"us-central1":             "us-east-2",      // US East (Ohio) -> Iowa, United States
	"us-west1":                "us-west-2",      // US West (Oregon) -> Oregon, United Stated
	"us-west2":                "us-west-1",      // US West (N. California) -> California, United States
	"us-west3":                "us-west-1",      // US West (N. California) -> Utah, United States
	"us-west4":                "us-west-1",      // US West (N. California) -> Nevada, United States
}

func main() {
	if len(os.Args) < 2 {
		log.Fatal().Msg("No command specified!")
	}

	region := os.Getenv("REGION")
	projectNum := os.Getenv("PROJECT_NUMBER")
	service := os.Getenv("K_SERVICE")
	audience := os.Getenv("OIDC_AUDIENCE")
	roleArn := os.Getenv("AWS_ROLE_ARN")
	jsonTransform := os.Getenv("JSON_TRANSFORM")

	zerolog.SetGlobalLevel(zerolog.InfoLevel)
	if os.Getenv("DEBUG") != "" {
		zerolog.SetGlobalLevel(zerolog.DebugLevel)
	}

	var err error
	// Retrieve details from metadata endpoint if on GCP
	if metadata.OnGCE() {
		mc := metadata.NewClient(nil)
		region, err = mc.Get("region")
		if err != nil {
			log.Fatal().Err(err)
		}
		projectNum, err = mc.NumericProjectID()
		if err != nil {
			log.Fatal().Err(err)
		}
		region, err = mc.InstanceAttributeValue("region")
		if err != nil {
			log.Fatal().Err(err)
		}
	}

	// Just some reasonable defaults
	if projectNum == "" {
		projectNum = "1234567890"
	}
	if service == "" {
		service = "custom-function"
	}
	if region == "" {
		region = "europe-west4"
	}

	// Override regions
	overrideRegionMap := os.Getenv("REGION_MAP")
	if overrideRegionMap != "" {
		err := json.Unmarshal([]byte(overrideRegionMap), &regionMap)
		if err != nil {
			log.Fatal().Err(err)
		}
	}
	if overrideRegion, ok := regionMap[region]; ok {
		region = overrideRegion
	}

	log.Info().Str("service", service).Str("projectNumber", projectNum).Str("region", region).Str("audience", audience).Str("roleArn", roleArn).Msg("Starting Lambda server")

	server := lambdacompat.NewLambdaCompatServer(os.Args[1:len(os.Args)], 8080, region, projectNum, service, audience, roleArn, jsonTransform)
	err = server.Start()
	if err != nil {
		log.Fatal().Err(err)
	}
}
