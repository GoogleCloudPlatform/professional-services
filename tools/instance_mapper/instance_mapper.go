package instance_mapper

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
	"encoding/json"
	"fmt"
	"io/ioutil"
	"math"
	"net/http"
	"os"
	"reflect"
	"sort"
	"strconv"
	"strings"

	log "github.com/golang/glog"
	"github.com/google/cel-go/cel"
	"github.com/google/cel-go/common/types"
	"google.golang.org/api/iterator"
	"google.golang.org/api/option"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials/stscreds"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	"github.com/aws/aws-sdk-go-v2/service/rds"
	"github.com/aws/aws-sdk-go-v2/service/sts"

	"github.com/Azure/azure-sdk-for-go/sdk/azidentity"
	"github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/compute/armcompute"

	compute "cloud.google.com/go/compute/apiv1"
	sqladmin "google.golang.org/api/sqladmin/v1"
	htransport "google.golang.org/api/transport/http"
	computepb "google.golang.org/genproto/googleapis/cloud/compute/v1"
)

type InstanceType struct {
	InstanceTypeId       string              `yaml:"id"`
	InstanceFamily       string              `yaml:"family"`
	Region               string              `yaml:"region"`
	Description          string              `yaml:"description,omitempty"`
	BareMetal            bool                `yaml:"bare_metal,omitempty"`
	SharedTenancy        bool                `yaml:"shared_tenancy,omitempty"`
	GPUs                 int                 `yaml:"total_gpus,omitempty"`
	GPUType              string              `yaml:"gpu_type,omitempty"`
	GPUMemory            int                 `yaml:"total_gpu_memory,omitempty"`
	Memory               int                 `yaml:"total_memory"`
	VCPUs                int                 `yaml:"total_vcpus"`
	GHz                  float64             `yaml:"cpu_clockspeed"`
	Bandwidth            float64             `yaml:"network_bandwidth,omitempty"`
	DatabaseType         string              `yaml:"db_type,omitempty"`
	DatabaseMajorVersion string              `yaml:"db_version_major,omitempty"`
	DatabaseMinorVersion string              `yaml:"db_version_minor,omitempty"`
	DatabaseOriginal     string              `yaml:"db_original_type,omitempty"`
	PricingPerRegion     *map[string]float64 `yaml:"prices,omitempty"`
}

type DatabaseVersion struct {
	DatabaseType         string `yaml:"db_type,omitempty"`
	DatabaseMajorVersion string `yaml:"db_version_major,omitempty"`
	DatabaseMinorVersion string `yaml:"db_version_minor,omitempty"`
	DatabaseOriginal     string `yaml:"db_type,omit"`
}

type InstanceData struct {
	AwsInstances    map[string]map[string]InstanceType `yaml:"aws"`
	GcpInstances    map[string]map[string]InstanceType `yaml:"gcp"`
	AwsRdsInstances map[string]map[string]InstanceType `yaml:"aws_rds"`
	GcpSqlInstances map[string]map[string]InstanceType `yaml:"gcp_sql"`
	AzureInstances  map[string]map[string]InstanceType `yaml:"azure"`
}

type kv struct {
	Key   string
	Value float64
}

type GPUMap struct {
	Mapping map[string]string `yaml:"gpu_mapping"`
}

type SQLMap struct {
	Mapping map[string]SQLMapItem `yaml:"sql_mapping"`
}

type SQLMapItem struct {
	Engine string `yaml:"engine"`
	Major  string `yaml:"major"`
	Minor  string `yaml:"minor"`
}

type MapError struct {
	Msg string
	Err error
}

type InstanceMapper struct {
	InstanceData InstanceData
}

type AddUserAgent struct {
	inner http.RoundTripper
	Agent string
	Debug bool
}

type GcpPriceList struct {
	Comment   string                 `json:"comment"`
	Version   string                 `json:"version"`
	Updated   string                 `json:"updated"`
	PriceList map[string]interface{} `json:"gcp_price_list"`
}

func SetUserAgent(inner http.RoundTripper, userAgent string, debug bool) http.RoundTripper {
	return &AddUserAgent{
		inner: inner,
		Agent: userAgent,
		Debug: debug,
	}
}

func (ug *AddUserAgent) RoundTrip(r *http.Request) (*http.Response, error) {
	r.Header.Set("User-Agent", ug.Agent)
	if ug.Debug {
		log.Infof("Request: %s /%s %s", r.Method, r.RequestURI, r.Proto)
		log.Infof("Host: %s", r.Host)
		for k, v := range r.Header {
			for _, vv := range v {
				log.Infof("%s: %s", k, vv)
			}
		}
	}
	resp, err := ug.inner.RoundTrip(r)
	if ug.Debug && resp != nil {
		log.Info("")
		log.Infof("Response: %s", resp.Status)
		for k, v := range resp.Header {
			for _, vv := range v {
				log.Infof("%s: %s", k, vv)
			}
		}
	}
	return resp, err
}

func (im *InstanceMapper) getHttpClient(ctx context.Context, debug bool) (*http.Client, error) {
	client := &http.Client{}
	transport, err := htransport.NewTransport(ctx, http.DefaultTransport)
	if err != nil {
		return nil, err
	}
	client.Transport = SetUserAgent(transport, "google-pso-tool/instance-mapper/1.0.0", debug)
	return client, nil
}

func (e *MapError) Error() string {
	return e.Msg + " (" + e.Err.Error() + ")"
}

func (it InstanceType) String() string {
	if it.DatabaseType != "" {
		return fmt.Sprintf("%s, %s %s.%s (%d VCPUs @ %.1f GHz, %.2f GB memory)", it.InstanceTypeId, it.DatabaseType, it.DatabaseMajorVersion, it.DatabaseMinorVersion, it.VCPUs, it.GHz, float64(it.Memory)/1024.0)
	}
	return fmt.Sprintf("%s (%d VCPUs @ %.1f GHz, %.2f GB memory, %d GPUs)", it.InstanceTypeId, it.VCPUs, it.GHz, float64(it.Memory)/1024.0, it.GPUs)
}

func (it InstanceType) ToCSV(showPrices bool, region string) []string {
	var csv []string = []string{
		it.InstanceTypeId,
		fmt.Sprintf("%.2f GB", float64(it.Memory)/1024.0),
		fmt.Sprintf("%d", it.VCPUs),
		fmt.Sprintf("%d", it.GPUs),
		it.GPUType,
		fmt.Sprintf("%d", it.GPUMemory),
		it.DatabaseOriginal,
	}
	if showPrices {
		priceStr := ""
		if it.PricingPerRegion != nil {
			if price, ok := (*it.PricingPerRegion)[region]; ok {
				priceStr = fmt.Sprintf("%.2f", price)
			}
		}
		csv = append(csv, priceStr)
	}
	return csv
}

func (it InstanceType) CSVHeaders(showPrices bool) []string {
	if showPrices {
		return []string{"Instance type", "Memory", "vCPUs", "GPUs", "GPU type", "Total GPU memory", "Database type", "Price"}
	}
	return []string{"Instance type", "Memory", "vCPUs", "GPUs", "GPU type", "Total GPU memory", "Database type"}
}

func (it InstanceType) GetHourlyPrice(priceList *GcpPriceList) (float64, error) {
	// Older machine types have instance type specific SKUs
	instanceSku := fmt.Sprintf("CP-COMPUTEENGINE-VMIMAGE-%s", strings.ToUpper(it.InstanceTypeId))
	if instancePrices, ok := priceList.PriceList[instanceSku]; ok {
		if instancePricePerHour, ok := instancePrices.(map[string]interface{})[it.Region].(float64); ok {
			return instancePricePerHour, nil
		}
	}

	// Newer machine types have per-core and per-GB pricing
	instanceCoreSku := fmt.Sprintf("CP-COMPUTEENGINE-%s-PREDEFINED-VM-CORE", strings.ToUpper(it.InstanceFamily))
	instanceRamSku := fmt.Sprintf("CP-COMPUTEENGINE-%s-PREDEFINED-VM-RAM", strings.ToUpper(it.InstanceFamily))
	if instanceCorePrices, ok := priceList.PriceList[instanceCoreSku]; ok {
		if instanceRamPrices, ok := priceList.PriceList[instanceRamSku]; ok {
			if instanceCorePricePerHour, ok := instanceCorePrices.(map[string]interface{})[it.Region].(float64); ok {
				if instanceRamPricePerHour, ok := instanceRamPrices.(map[string]interface{})[it.Region].(float64); ok {
					return (instanceCorePricePerHour * float64(it.VCPUs)) + (instanceRamPricePerHour * float64(it.Memory/1024.0)), nil
				}
			} else {
				// Try regional pricing
				regionParts := strings.Split(it.Region, "-")
				if instanceCorePricePerHour, ok := instanceCorePrices.(map[string]interface{})[regionParts[0]].(float64); ok {
					if instanceRamPricePerHour, ok := instanceRamPrices.(map[string]interface{})[regionParts[0]].(float64); ok {
						return (instanceCorePricePerHour * float64(it.VCPUs)) + (instanceRamPricePerHour * float64(it.Memory/1024.0)), nil
					}
				}
			}
		}
	}

	return 0.0, fmt.Errorf("could not find price for instance type: %s", it.InstanceTypeId)
}

func (it InstanceType) ToMap() *map[string]interface{} {
	return &map[string]interface{}{
		"id":                it.InstanceTypeId,
		"family":            it.InstanceFamily,
		"region":            it.Region,
		"description":       it.Description,
		"bare_metal":        it.BareMetal,
		"shared_tenancy":    it.SharedTenancy,
		"total_gpus":        it.GPUs,
		"gpu_type":          it.GPUType,
		"total_gpu_memory":  it.GPUMemory,
		"total_memory":      it.Memory,
		"total_vcpus":       it.VCPUs,
		"cpu_clockspeed":    it.GHz,
		"network_bandwidth": it.Bandwidth,
		"db_engine":         it.DatabaseType,
		"db_version_major":  it.DatabaseMajorVersion,
		"db_version_minor":  it.DatabaseMinorVersion,
	}
}

func (im *InstanceMapper) LoadGCPPriceList(fileName string) (*GcpPriceList, error) {
	pricelistFile, err := os.Open(fileName)
	if err != nil {
		return nil, err
	}
	defer pricelistFile.Close()

	pricelistBytes, err := ioutil.ReadAll(pricelistFile)
	if err != nil {
		return nil, err
	}

	var priceList GcpPriceList
	err = json.Unmarshal(pricelistBytes, &priceList)
	if err != nil {
		return nil, err
	}

	log.Infof("Loaded GCP price list, version: %s, updated: %s", priceList.Version, priceList.Updated)
	if priceList.Comment != "" {
		log.Warningf("About the price list: %s", priceList.Comment)
	}
	return &priceList, nil
}

func (im *InstanceMapper) LoadGCPInstanceTypes(ctx context.Context, projectId string, priceList *GcpPriceList, debug bool) error {
	im.InstanceData.GcpInstances = make(map[string]map[string]InstanceType, 0)
	im.InstanceData.GcpInstances["all"] = make(map[string]InstanceType, 0)

	httpClient, err := im.getHttpClient(ctx, debug)
	if err != nil {
		return err
	}

	c, err := compute.NewMachineTypesRESTClient(ctx, option.WithHTTPClient(httpClient))
	if err != nil {
		return err
	}
	defer c.Close()

	req := &computepb.AggregatedListMachineTypesRequest{
		Project: projectId,
	}

	var pricingHoursPerMonth float64 = 730.0
	var allRegions []string
	var allInstanceTypes []string
	it := c.AggregatedList(ctx, req)
	for {
		resp, err := it.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return err
		}
		region := strings.TrimPrefix(resp.Key[0:len(resp.Key)-2], "zones/")
		if _, found := im.InstanceData.GcpInstances[region]; !found {
			im.InstanceData.GcpInstances[region] = make(map[string]InstanceType, 0)
		}
		if !im.stringInSlice(region, allRegions) {
			allRegions = append(allRegions, region)
		}

		for _, mt := range resp.Value.MachineTypes {
			gpus := 0
			gpuType := ""
			if len(mt.GetAccelerators()) > 0 {
				for _, accl := range mt.GetAccelerators() {
					gpus = gpus + int(*accl.GuestAcceleratorCount)
					if gpuType == "" {
						gpuType = *accl.GuestAcceleratorType
					}
				}
			}

			family := strings.SplitN(mt.GetName(), "-", 2)
			it := InstanceType{
				InstanceTypeId: mt.GetName(),
				InstanceFamily: family[0],
				Region:         region,
				Description:    mt.GetDescription(),
				BareMetal:      false,
				SharedTenancy:  strings.HasPrefix(mt.GetName(), "e2-"), // to be un-hardcoded
				GPUs:           gpus,
				GPUMemory:      0,
				GPUType:        gpuType,
				Memory:         int(mt.GetMemoryMb()),
				VCPUs:          int(mt.GetGuestCpus()),
				GHz:            3.0,
				Bandwidth:      0,
			}
			if !im.stringInSlice(it.InstanceTypeId, allInstanceTypes) {
				allInstanceTypes = append(allInstanceTypes, it.InstanceTypeId)
			}

			if priceList != nil {
				instancePricePerHour, err := it.GetHourlyPrice(priceList)
				if err == nil {
					if _sustainedUseTiers, ok := priceList.PriceList["sustained_use_tiers_new"]; ok {
						sustainedUseTiers := _sustainedUseTiers.(map[string]interface{})
						if sustainedUseTier, ok := sustainedUseTiers[strings.ToLower(it.InstanceFamily)]; ok {
							price := make(map[string]float64, 1)
							// Total 730 hours per month, calculate per sustained use tier
							price[region] = 0.0
							var pricingHoursPerTier float64 = pricingHoursPerMonth / float64(len(sustainedUseTier.(map[string]interface{})))
							for _, tierMultiplier := range sustainedUseTier.(map[string]interface{}) {
								var multiplier float64
								if k := reflect.TypeOf(tierMultiplier).Kind(); k == reflect.Float64 {
									multiplier = tierMultiplier.(float64)
								} else if k == reflect.Float32 {
									multiplier = float64(tierMultiplier.(float32))
								} else if k == reflect.Int {
									multiplier = float64(tierMultiplier.(int))
								} else {
									panic("unknown data type in tiers")
								}
								price[region] += instancePricePerHour * multiplier * pricingHoursPerTier
							}
							it.PricingPerRegion = &price
						} else {
							price := make(map[string]float64, 1)
							// Total 730 hours per month, no SUDs
							price[region] += instancePricePerHour * 730.0
							it.PricingPerRegion = &price
						}
					} else {
						log.Warningf("Could not find sustained use tiers configuration in price list")
					}
				} else {
					log.Warningf("Could not find pricing in region %s for: %s", it.Region, it.InstanceTypeId)

				}
			}
			im.InstanceData.GcpInstances[it.Region][it.InstanceTypeId] = it
			log.Infof("GCP instance type (region: %s): %s\n", it.Region, it.String())
		}
	}

	for _, instanceType := range allInstanceTypes {
		var instance *InstanceType
		for _, region := range allRegions {
			if regionInstance, ok := im.InstanceData.GcpInstances[region][instanceType]; ok {
				if instance == nil {
					instance = &regionInstance
				}
				if regionInstance.PricingPerRegion != nil {
					var ppr *map[string]float64 = instance.PricingPerRegion
					for r, price := range *regionInstance.PricingPerRegion {
						(*ppr)[r] = price
					}
				}
			}
		}
		if instance != nil {
			im.InstanceData.GcpInstances["all"][instance.InstanceTypeId] = *instance
		}
	}

	return nil
}

func (im *InstanceMapper) stringInSlice(a string, list []string) bool {
	for _, b := range list {
		if b == a {
			return true
		}
	}
	return false
}

func (im *InstanceMapper) databaseVersionInSlice(a DatabaseVersion, list []DatabaseVersion) bool {
	for _, b := range list {
		if b == a {
			return true
		}
	}
	return false
}

func (im *InstanceMapper) LoadGCPCloudSQLInstanceTypes(ctx context.Context, projectId string, sqlMap *SQLMap, debug bool) error {
	im.InstanceData.GcpSqlInstances = make(map[string]map[string]InstanceType, 0)
	im.InstanceData.GcpSqlInstances["all"] = make(map[string]InstanceType, 0)

	httpClient, err := im.getHttpClient(ctx, debug)
	if err != nil {
		return err
	}

	c, err := compute.NewRegionsRESTClient(ctx, option.WithHTTPClient(httpClient))
	if err != nil {
		return err
	}
	defer c.Close()

	regions := make([]string, 0)
	req := &computepb.ListRegionsRequest{
		Project: projectId,
	}
	it := c.List(ctx, req)
	for {
		resp, err := it.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return err
		}
		regions = append(regions, *resp.Name)
	}

	sqladminService, err := sqladmin.NewService(ctx, option.WithHTTPClient(httpClient))
	if err != nil {
		return err
	}

	databaseVersions := make([]DatabaseVersion, 0)
	flagsService := sqladmin.NewFlagsService(sqladminService)
	flagsListCall := flagsService.List()
	flagsResponse, err := flagsListCall.Do()
	if err != nil {
		return err
	}
	for _, flag := range flagsResponse.Items {
		for _, dbVersion := range flag.AppliesTo {
			var engine, majorVersion, minorVersion string
			dbVersionLower := strings.ToLower(dbVersion)
			if mapped, found := sqlMap.Mapping[dbVersionLower]; found {
				engine = mapped.Engine
				majorVersion = mapped.Major
				minorVersion = mapped.Minor
			} else {
				log.Infof("No SQL mapping for for type: %s, parsing manually...", dbVersionLower)
				dbVersionA := strings.SplitN(dbVersion, "_", 3)
				engine = strings.ToLower(dbVersionA[0])
				majorVersion = dbVersionA[1]
				minorVersion = "0"
				if len(dbVersionA) > 2 {
					minorVersion = dbVersionA[2]
				}
			}
			v := DatabaseVersion{
				DatabaseType:         engine,
				DatabaseMajorVersion: majorVersion,
				DatabaseMinorVersion: minorVersion,
				DatabaseOriginal:     dbVersion,
			}
			if !im.databaseVersionInSlice(v, databaseVersions) {
				log.Infof("Discovered database type %s (version %s.%s)\n", v.DatabaseType, v.DatabaseMajorVersion, v.DatabaseMinorVersion)
				databaseVersions = append(databaseVersions, v)
			}
		}
	}

	tiersService := sqladmin.NewTiersService(sqladminService)
	tiersListCall := tiersService.List(projectId)
	tiersResponse, err := tiersListCall.Do()
	if err != nil {
		return err
	}

	for _, tier := range tiersResponse.Items {
		realInstanceType := strings.TrimPrefix(tier.Tier, "db-")
		if _, found := im.InstanceData.GcpInstances["all"][realInstanceType]; !found {
			log.Warningf("No matching GCP instance type found for Cloud SQL instance type: %s, skipping...", tier.Tier)
			continue
		}
		for _, dbVersion := range databaseVersions {
			it := im.InstanceData.GcpInstances["all"][realInstanceType]
			it.InstanceTypeId = tier.Tier
			it.DatabaseType = dbVersion.DatabaseType
			it.DatabaseMajorVersion = dbVersion.DatabaseMajorVersion
			it.DatabaseMinorVersion = dbVersion.DatabaseMinorVersion
			it.DatabaseOriginal = dbVersion.DatabaseOriginal

			instanceKey := fmt.Sprintf("%s-%s", it.InstanceTypeId, it.DatabaseOriginal)

			for _, RegionName := range regions {
				if _, found := im.InstanceData.GcpSqlInstances[RegionName]; !found {
					im.InstanceData.GcpSqlInstances[RegionName] = make(map[string]InstanceType, 0)
				}
				it.Region = RegionName
				im.InstanceData.GcpSqlInstances[it.Region][instanceKey] = it
			}
			im.InstanceData.GcpSqlInstances["all"][instanceKey] = it
			log.Infof("GCP Cloud SQL instance type: %s\n", it.String())
		}
	}
	return nil
}

func (im *InstanceMapper) LoadAzureInstanceTypes(ctx context.Context, subscriptionId string, debug bool) error {
	im.InstanceData.AzureInstances = make(map[string]map[string]InstanceType, 0)
	im.InstanceData.AzureInstances["all"] = make(map[string]InstanceType, 0)

	cred, err := azidentity.NewDefaultAzureCredential(nil)
	if err != nil {
		return err
	}

	client := armcompute.NewResourceSKUsClient(subscriptionId, cred, nil)
	pager := client.List(&armcompute.ResourceSKUsListOptions{})
	for pager.NextPage(ctx) {
		for _, instance := range pager.PageResponse().ResourceSKUsResult.Value {
			it := InstanceType{
				InstanceTypeId: *instance.Name,
			}
			if instance.Family != nil {
				it.InstanceFamily = *instance.Family
			}

			supportsIaaS := false
			for _, cap := range instance.Capabilities {
				var err error
				switch name := *cap.Name; name {
				case "VMDeploymentTypes":
					if strings.Contains(*cap.Value, "IaaS") {
						supportsIaaS = true
					}
				case "vCPUs":
					it.VCPUs, err = strconv.Atoi(*cap.Value)
					it.GPUType = ""
				case "GPUs":
					it.GPUs, err = strconv.Atoi(*cap.Value)
				case "MemoryGB":
					memory, err := strconv.ParseFloat(*cap.Value, 64)
					if err == nil {
						it.Memory = int(math.Round(memory * 1024.0))
					}
				}
				if err != nil {
					return err
				}
			}
			if supportsIaaS {
				for _, loc := range instance.LocationInfo {
					if _, found := im.InstanceData.AzureInstances[*loc.Location]; !found {
						im.InstanceData.AzureInstances[*loc.Location] = make(map[string]InstanceType, 0)
					}
					if _, found := im.InstanceData.AzureInstances[*loc.Location][it.InstanceTypeId]; !found {
						im.InstanceData.AzureInstances[*loc.Location][it.InstanceTypeId] = it
					}
				}
				if _, found := im.InstanceData.AzureInstances["all"][it.InstanceTypeId]; !found {
					im.InstanceData.AzureInstances["all"][it.InstanceTypeId] = it
				}
				log.Infof("Azure instance type: %s\n", it.String())
			}
		}

		if pager.Err() != nil {
			return pager.Err()
		}
	}
	return nil
}

func (im *InstanceMapper) getEC2Client(ctx context.Context, role string, region string, debug bool) (*ec2.Client, error) {
	var configs = []func(*config.LoadOptions) error{}
	if debug {
		configs = append(configs, config.WithClientLogMode(aws.LogRetries|aws.LogRequestWithBody))
	}
	if region == "" {
		log.Info("Setting up AWS credentials...")
		cfg, err := config.LoadDefaultConfig(ctx, configs...)
		if err != nil {
			return nil, err
		}

		stsSvc := sts.NewFromConfig(cfg)
		creds := stscreds.NewAssumeRoleProvider(stsSvc, role)
		cfg.Credentials = aws.NewCredentialsCache(creds)

		svc := ec2.NewFromConfig(cfg)
		return svc, nil
	} else {
		log.Infof("Setting up AWS credentials for region %s...", region)
		regionCfg, err := config.LoadDefaultConfig(ctx, append(configs, config.WithRegion(region))...)
		if err != nil {
			return nil, err
		}
		regionStsSvc := sts.NewFromConfig(regionCfg)
		regionCreds := stscreds.NewAssumeRoleProvider(regionStsSvc, role)
		regionCfg.Credentials = regionCreds

		instanceSvc := ec2.NewFromConfig(regionCfg)
		return instanceSvc, nil
	}
}

func (im *InstanceMapper) getRDSClient(ctx context.Context, role string, region string, debug bool) (*rds.Client, error) {
	var configs = []func(*config.LoadOptions) error{}
	if debug {
		configs = append(configs, config.WithClientLogMode(aws.LogRetries|aws.LogRequestWithBody))
	}
	if region == "" {
		log.Info("Setting up AWS credentials...")
		cfg, err := config.LoadDefaultConfig(ctx, configs...)
		if err != nil {
			return nil, err
		}

		stsSvc := sts.NewFromConfig(cfg)
		creds := stscreds.NewAssumeRoleProvider(stsSvc, role)
		cfg.Credentials = aws.NewCredentialsCache(creds)

		svc := rds.NewFromConfig(cfg)
		return svc, nil
	} else {
		log.Infof("Setting up AWS credentials for region %s...", region)
		regionCfg, err := config.LoadDefaultConfig(ctx, append(configs, config.WithRegion(region))...)
		if err != nil {
			return nil, err
		}
		regionStsSvc := sts.NewFromConfig(regionCfg)
		regionCreds := stscreds.NewAssumeRoleProvider(regionStsSvc, role)
		regionCfg.Credentials = regionCreds

		instanceSvc := rds.NewFromConfig(regionCfg)
		return instanceSvc, nil
	}
}

func (im *InstanceMapper) LoadAWSRDSInstanceTypes(ctx context.Context, role string, rdsEngines []string, debug bool) error {
	im.InstanceData.AwsRdsInstances = make(map[string]map[string]InstanceType, 0)

	svc, err := im.getEC2Client(ctx, role, "", debug)
	if err != nil {
		return err
	}

	out, err := svc.DescribeRegions(ctx, &ec2.DescribeRegionsInput{
		AllRegions: aws.Bool(true),
	})
	if err != nil {
		return err
	}

	log.Info("Fetching all AWS regions...")
	im.InstanceData.AwsRdsInstances["all"] = make(map[string]InstanceType, 0)
processRegions:
	for _, region := range out.Regions {
		for _, engine := range rdsEngines {
			log.Infof("Loading %s RDS instance types from region: %s", engine, *region.RegionName)
			im.InstanceData.AwsRdsInstances[*region.RegionName] = make(map[string]InstanceType, 0)

			rdsSvc, err := im.getRDSClient(ctx, role, *region.RegionName, debug)
			if err != nil {
				return err
			}
			ditPaginator := rds.NewDescribeOrderableDBInstanceOptionsPaginator(rdsSvc, &rds.DescribeOrderableDBInstanceOptionsInput{
				Engine: &engine,
			})
			for ditPaginator.HasMorePages() {
				output, err := ditPaginator.NextPage(ctx)
				if err != nil {
					log.Warningf("Error fetching RDS instance types from %s: %s (skipping region...)", *region.RegionName, err.Error())
					continue processRegions
				}
				for _, instanceType := range output.OrderableDBInstanceOptions {
					realInstanceType := strings.TrimPrefix(*instanceType.DBInstanceClass, "db.")
					if _, found := im.InstanceData.AwsInstances["all"][realInstanceType]; !found {
						log.Warningf("No matching EC2 instance type found for RDS instance type: %s, skipping...", *instanceType.DBInstanceClass)
						continue
					}
					versionA := strings.SplitN(*instanceType.EngineVersion, ".", 3)

					it := im.InstanceData.AwsInstances["all"][realInstanceType]
					it.Region = *region.RegionName
					it.InstanceTypeId = *instanceType.DBInstanceClass
					it.DatabaseType = *instanceType.Engine
					it.DatabaseMajorVersion = versionA[0]
					it.DatabaseMinorVersion = versionA[1]
					it.DatabaseOriginal = fmt.Sprintf("%s-%s", *instanceType.Engine, *instanceType.EngineVersion)

					instanceKey := fmt.Sprintf("%s-%s", it.InstanceTypeId, it.DatabaseOriginal)

					im.InstanceData.AwsRdsInstances[it.Region][instanceKey] = it
					im.InstanceData.AwsRdsInstances["all"][instanceKey] = it
					log.Infof("AWS RDS instance type: %s\n", it.String())
				}
			}
		}
	}
	return nil
}

func (im *InstanceMapper) LoadAWSInstanceTypes(ctx context.Context, role string, debug bool) error {
	im.InstanceData.AwsInstances = make(map[string]map[string]InstanceType, 0)

	svc, err := im.getEC2Client(ctx, role, "", debug)
	if err != nil {
		return err
	}

	out, err := svc.DescribeRegions(ctx, &ec2.DescribeRegionsInput{
		AllRegions: aws.Bool(true),
	})
	if err != nil {
		return err
	}

	log.Info("Fetching all AWS regions...")
	im.InstanceData.AwsInstances["all"] = make(map[string]InstanceType, 0)
processRegions:
	for _, region := range out.Regions {
		log.Infof("Loading EC2 instance types from region: %s", *region.RegionName)
		im.InstanceData.AwsInstances[*region.RegionName] = make(map[string]InstanceType, 0)

		instanceSvc, err := im.getEC2Client(ctx, role, *region.RegionName, debug)
		if err != nil {
			return err
		}
		ditPaginator := ec2.NewDescribeInstanceTypesPaginator(instanceSvc, &ec2.DescribeInstanceTypesInput{})
		for ditPaginator.HasMorePages() {
			output, err := ditPaginator.NextPage(ctx)
			if err != nil {
				log.Warningf("Error fetching instance types from %s: %s (skipping region...)", *region.RegionName, err.Error())
				continue processRegions
			}
			for _, instanceType := range output.InstanceTypes {
				instanceTypeId := string(instanceType.InstanceType)
				gpus := 0
				gpuMem := 0
				gpuType := ""
				if instanceType.GpuInfo != nil && len(instanceType.GpuInfo.Gpus) > 0 {
					for _, gpu := range instanceType.GpuInfo.Gpus {
						gpus = gpus + int(*gpu.Count)
						if gpuType == "" {
							gpuType = *gpu.Name
						}
					}
					gpuMem = int(*instanceType.GpuInfo.TotalGpuMemoryInMiB)
				}
				architectures := make([]string, 0)
				for _, sa := range instanceType.ProcessorInfo.SupportedArchitectures {
					architectures = append(architectures, string(sa))
				}
				clockspeed := 0.0
				if instanceType.ProcessorInfo.SustainedClockSpeedInGhz != nil {
					clockspeed = *instanceType.ProcessorInfo.SustainedClockSpeedInGhz
				}

				family := strings.SplitN(instanceTypeId, ".", 2)
				it := InstanceType{
					InstanceTypeId: instanceTypeId,
					InstanceFamily: family[0],
					Region:         *region.RegionName,
					Description:    strings.Join(architectures, ", "),
					BareMetal:      *instanceType.BareMetal,
					SharedTenancy:  !*instanceType.DedicatedHostsSupported,
					GPUs:           gpus,
					GPUMemory:      gpuMem,
					GPUType:        gpuType,
					Memory:         int(*instanceType.MemoryInfo.SizeInMiB),
					VCPUs:          int(*instanceType.VCpuInfo.DefaultVCpus),
					GHz:            clockspeed,
					Bandwidth:      0,
				}
				im.InstanceData.AwsInstances[it.Region][it.InstanceTypeId] = it
				im.InstanceData.AwsInstances["all"][it.InstanceTypeId] = it
				log.Infof("AWS EC2 instance type: %s\n", it.String())
			}
		}
	}
	return nil
}

func (im *InstanceMapper) MapInstances(csvWriter *csv.Writer, source *map[string]map[string]InstanceType, target *map[string]map[string]InstanceType, matcher cel.Program, gpuMap GPUMap, priceListRegion string, numberOfResults int) error {

	showPrices := false
	if priceListRegion != "" {
		showPrices = true
	}

	firstResult := true
	for _, sourceInstance := range (*source)["all"] {
		var scores map[string]float64 = make(map[string]float64, 0)
		for targetInstanceType, targetInstance := range (*target)["all"] {
			out, _, err := matcher.Eval(map[string]interface{}{
				"source":  *sourceInstance.ToMap(),
				"target":  *targetInstance.ToMap(),
				"gpu_map": gpuMap.Mapping,
			})
			if err != nil {
				log.Infof("CEL evaluation error, source=%v, target=%v\n", sourceInstance.ToMap(), targetInstance.ToMap())
				return &MapError{Msg: fmt.Sprintf("Failed to evaluate CEL (source: %s, target: %s)", sourceInstance.InstanceTypeId, targetInstance.InstanceTypeId), Err: err}
			}
			score := out.ConvertToType(types.DoubleType).(types.Double)
			if score > 0.0 {
				scores[targetInstanceType] = float64(score)
			}
		}
		var ss []kv
		for k, v := range scores {
			ss = append(ss, kv{k, v})
		}
		sort.SliceStable(ss, func(i, j int) bool {
			return ss[i].Value > ss[j].Value
		})

		// Only take top scores
		if len(ss) > numberOfResults {
			ss = ss[0:numberOfResults]
		}

		if firstResult {
			csvHeader := make([]string, 0)
			for i := 0; i <= numberOfResults; i++ {
				if i != 0 {
					csvHeader = append(csvHeader, sourceInstance.CSVHeaders(showPrices)...)
				} else {
					csvHeader = append(csvHeader, sourceInstance.CSVHeaders(false)...)
				}
			}
			csvWriter.Write(csvHeader)
			firstResult = false
		}

		csvOutput := sourceInstance.ToCSV(false, "")
		for _, v := range ss {
			csvOutput = append(csvOutput, (*target)["all"][v.Key].ToCSV(showPrices, priceListRegion)...)
		}
		csvWriter.Write(csvOutput)
	}
	return nil
}
