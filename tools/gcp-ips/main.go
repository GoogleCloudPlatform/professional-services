// Copyright 2018 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//            http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Retrieves a list of IP addresses used by each subnet in a shared VPC
// Writes results to Markdown files
//
// See https://godoc.org/google.golang.org/api/compute/v1 and
// https://github.com/googleapis/google-api-go-client/tree/master/compute/v1/compute-gen.go
// for details on the Compute Engine API

package main

import (
	"bytes"
	"log"
	"net"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/olekukonko/tablewriter"
	"golang.org/x/net/context"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/compute/v1"
)

// projectResources stores the slices of addresses and instances for one project
// AddressAggregatedList and InstanceAggregatedList are the aggregated lists of
// addresses and instances respectively. See
// https://godoc.org/google.golang.org/api/compute/v1#AddressAggregatedList
// and
// https://godoc.org/google.golang.org/api/compute/v1#InstanceAggregatedList
// for struct details
//
// Making the assumption that addresses together with instances will give us all
// of the internal IPs used in a network. If this is not the case, projectResources
// should be expanded to include whatever resources that use IPs, and then make
// the appropriate API call in getResources to get the aggregated list
type projectResources struct {
	Project                string
	AddressAggregatedList  *compute.AddressAggregatedList
	InstanceAggregatedList *compute.InstanceAggregatedList
}

// addressInfo holds the fields that we care about in our output table
type addressInfo struct {
	Project string
	IP      string
	Status  string
	Subnet  string
	User    string
}

// Initialize the Compute API client
func initClient() *compute.Service {
	ctx := context.Background()

	client, err := google.DefaultClient(ctx, compute.ComputeScope)
	if err != nil {
		log.Fatal(err)
	}

	computeService, err := compute.New(client)
	if err != nil {
		log.Fatal(err)
	}

	return computeService
}

// Get a list of service projects for a given host project
func getServiceProjects(hostProject string, service *compute.Service) (*compute.ProjectsGetXpnResources, error) {
	log.Printf("Looking for service projects in %s\n", hostProject)

	res, err := service.Projects.GetXpnResources(hostProject).Do()

	if err != nil {
		log.Printf("Error getting service projects for %s: %s", hostProject, err)
	}

	return res, err
}

// Get the addresses and instances for a project
func getResources(project string, service *compute.Service) *projectResources {
	log.Printf("Looking for addresses and instances in %s\n", project)

	// Get aggregated list of addresses
	addressAggregatedList, err := service.Addresses.AggregatedList(project).Do()

	if err != nil {
		log.Printf("Error getting addresses for %s: %s", project, err)
	}

	// Get aggregated list of instances
	instanceAggregatedList, err := service.Instances.AggregatedList(project).Do()
	if err != nil {
		log.Printf("Error getting instances for %s: %s", project, err)
	}

	output := &projectResources{
		Project:                project,
		AddressAggregatedList:  addressAggregatedList,
		InstanceAggregatedList: instanceAggregatedList,
	}

	return output
}

// Get addresses and instances for all service projects attached to host project
func getAllResources(hostProject string, service *compute.Service) []*projectResources {
	ch := make(chan *projectResources)
	var wg sync.WaitGroup

	// Get list of service projects
	res, err := getServiceProjects(hostProject, service)
	if err != nil {
		log.Fatal(err)
	}

	// For each project, use a goroutine to get the resources for that project
	for _, resource := range res.Resources {
		projectID := resource.Id
		wg.Add(1)
		go func(projectID string) {
			defer wg.Done()
			ch <- getResources(projectID, service)
		}(projectID)
	}

	// Wait for all goroutines to finish and close the channel
	go func() {
		wg.Wait()
		close(ch)
	}()

	// Gather all responses in the output slice
	var output []*projectResources
	for s := range ch {
		if s != nil {
			output = append(output, s)
		}
	}

	return output
}

// Append information in an addressInfo struct into a map (addressInfoMap) keyed
// by IP address.
//
// If an IP already exists in the map, merge the information together.
// Existing entries has precedence. This means that if, for some reason, the
// addressInfo struct has different values than the existing entry, it will be
// ignored.
//
// Bottom line: this should work fine assuming the address and instance resources
// don't have contradicting information, which is pretty unlikely. A scenario
// where this might happen is if the address resource represents its subnet one way,
// and the instance using that same address represents its subnet a different way
func insertAddressInfo(addressInfoMap map[string]*addressInfo, addressInfo *addressInfo) {
	ip := addressInfo.IP

	if existingInfo, ok := addressInfoMap[ip]; ok {
		if existingInfo.Status == "" {
			existingInfo.Status = addressInfo.Status
		}
		if existingInfo.Subnet == "" {
			existingInfo.Subnet = addressInfo.Subnet
		}
		if existingInfo.User == "" {
			existingInfo.User = addressInfo.User
		}
	} else {
		addressInfoMap[ip] = addressInfo
	}
}

// Parse self-links to get just the resource name at the end
func getName(selfLink string) string {
	split := strings.Split(selfLink, "/")
	return split[len(split)-1]
}

// Process a slice of projectResources (each projectResource includes a
// slice of all Address and Instance resources in the project)
//
// This function traverses the responses from API and pulls out the IPs and
// information about those IPs that we are interested in (as defined in addressInfo)
//
// Returns a map of addressInfo objects, where the keys are IP addresses
func flatten(projectResourceList []*projectResources) map[string]*addressInfo {
	// output map
	addressInfoMap := make(map[string]*addressInfo)

	for _, p := range projectResourceList {

		// there may not be any addresses in this project
		if p.AddressAggregatedList == nil {
			log.Printf(p.Project + " has no reserved addresses")
		} else {
			for _, addressScopedList := range p.AddressAggregatedList.Items {
				if addressScopedList.Addresses != nil {
					for _, address := range addressScopedList.Addresses {
						// make sure user is not nil, which happens when reserved IP
						// is RESERVED but not IN_USE
						var user string
						if address.Users != nil {
							user = getName(address.Users[0])
						}
						// For each address, append the information into the output map
						insertAddressInfo(addressInfoMap, &addressInfo{
							Project: p.Project,
							IP:      address.Address,
							Status:  address.Status,
							Subnet:  getName(address.Subnetwork),
							User:    user,
						})
					}
				}
			}
		}

		// there may not be any instances in this project
		if p.InstanceAggregatedList == nil {
			log.Printf(p.Project + " has no instances")
		} else {
			for _, instanceScopedList := range p.InstanceAggregatedList.Items {
				if instanceScopedList.Instances != nil {
					for _, instance := range instanceScopedList.Instances {
						// For each instance, append the information into the output map
						insertAddressInfo(addressInfoMap, &addressInfo{
							Project: p.Project,
							IP:      instance.NetworkInterfaces[0].NetworkIP,
							Subnet:  getName(instance.NetworkInterfaces[0].Subnetwork),
							User:    instance.Name,
						})
					}
				}
			}
		}
	}

	return addressInfoMap
}

// Process a list of projectResources and re-organize it by subnet
func extractFields(projectResourceList []*projectResources) map[string][]*addressInfo {
	addressInfoBySubnet := make(map[string][]*addressInfo)

	// Organize by IP
	addressInfoByIP := flatten(projectResourceList)

	// Re-organize by subnet
	for _, addressInfo := range addressInfoByIP {
		subnet := addressInfo.Subnet
		addressInfoBySubnet[subnet] = append(addressInfoBySubnet[subnet], addressInfo)
	}
	return addressInfoBySubnet
}

// Given a subnet and its list of addressInfo objects,
// Sort by IP address and then to a Markdown table
func writeToFile(subnet string, addressInfoList []*addressInfo) {
	var data [][]string
	outputPath := "output"

	// Create output directory if it does not exist
	if _, err := os.Stat(outputPath); os.IsNotExist(err) {
		os.Mkdir(outputPath, 0755)
	}

	// Create file
	f, err := os.Create(filepath.Join(outputPath, subnet+".md"))
	defer f.Close()
	if err != nil {
		log.Fatal(err)
	}

	// Write header
	_, err = f.WriteString("# Reserved IPs for " + subnet + "\n")
	if err != nil {
		log.Fatal(err)
	}

	// Sort IPs in ascending order (properly, so that 192.168.0.10 comes after
	// 192.168.0.2)
	sort.Slice(addressInfoList, func(i, j int) bool {
		a := net.ParseIP(addressInfoList[i].IP)
		b := net.ParseIP(addressInfoList[j].IP)
		return bytes.Compare(a, b) < 0
	})

	for _, addressInfo := range addressInfoList {
		// Append data to be written to file
		data = append(data, []string{
			addressInfo.IP,
			addressInfo.Project,
			addressInfo.Status,
			addressInfo.User,
		})
	}

	// Write data to file
	table := tablewriter.NewWriter(f)
	table.SetHeader([]string{"IP", "GCP Project", "Status", "User"})
	table.SetBorders(tablewriter.Border{Left: true, Top: false, Right: true, Bottom: false})
	table.SetCenterSeparator("|")
	table.AppendBulk(data)
	table.Render()

	log.Printf("Writing to " + subnet + ".md\n")
}

// Loop through addressBySubnet map
// Write each subnet to a different file
func writeAllToFile(addressesBySubnet map[string][]*addressInfo) {
	for subnet, addressInfoList := range addressesBySubnet {
		if subnet != "" {
			writeToFile(subnet, addressInfoList)
		}
	}
}

func main() {
	start := time.Now()

	// Host project (shared VPC project) is a required parameter
	if len(os.Args) < 2 {
		log.Fatalln("Missing required parameter: host-project")
	}
	hostProject := os.Args[1]

	// Initialize the client
	computeService := initClient()

	// Get resources (addresses, instances) for each service project
	resources := getAllResources(hostProject, computeService)

	// Re-organize IPs by subnet
	addressInfoBySubnet := extractFields(resources)

	// Write to file
	writeAllToFile(addressInfoBySubnet)

	elapsed := time.Since(start)
	log.Printf("Took %.2f seconds", elapsed.Seconds())
}
