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

// gcp-ips retrieves a list of IP addresses used by each subnet in a shared VPC
// and writes the resulting information to files in Markdown format.
//
// See https://godoc.org/google.golang.org/api/compute/v1 and
// https://github.com/googleapis/google-api-go-client/tree/master/compute/v1/compute-gen.go
// for details on the Compute Engine API

package main

import (
	"bytes"
	"fmt"
	"log"
	"net"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/olekukonko/tablewriter"
	"golang.org/x/net/context"
	"golang.org/x/oauth2/google"
	"golang.org/x/sync/semaphore"
	"google.golang.org/api/compute/v1"
)

const (
	// outputDir is the name of the directory where output files will be written.
	outputDir = "output"
	// maxWorkers is the max number of goroutines allowed to run in parallel
	maxWorkers = 32
)

// projectResources stores the slices of addresses and instances for one project.
// References:
// https://godoc.org/google.golang.org/api/compute/v1#AddressAggregatedList
// https://godoc.org/google.golang.org/api/compute/v1#InstanceAggregatedList
//
// Here we make the assumption that addresses and instances together will give
// us all of the internal IPs used in a network. If this is not true,
// projectResources should be expanded to include the missing resources, and
// then make the appropriate API call in getResources to get the aggregated list
type projectResources struct {
	Project                string
	AddressAggregatedList  *compute.AddressAggregatedList
	InstanceAggregatedList *compute.InstanceAggregatedList
}

// addressInfo holds the fields that we care about in our output table.
type addressInfo struct {
	Project string
	IP      string
	Status  string
	Subnet  string
	User    string
}

// initClient initialize the Compute API client.
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

// getServiceProjects returns a list of service projects for a given host project.
func getServiceProjects(hostProject string, service *compute.Service) (*compute.ProjectsGetXpnResources, error) {
	log.Printf("Looking for service projects in %s", hostProject)

	res, err := service.Projects.GetXpnResources(hostProject).Do()
	if err != nil {
		log.Printf("Error getting service projects for %s: %v", hostProject, err)
	}

	return res, err
}

// getResources returns the addresses and instances for a project.
func getResources(project string, service *compute.Service) *projectResources {
	log.Printf("Looking for addresses and instances in %s", project)

	addressAggregatedList, err := service.Addresses.AggregatedList(project).Do()

	if err != nil {
		log.Printf("Error getting addresses for %s: %v", project, err)
	}

	instanceAggregatedList, err := service.Instances.AggregatedList(project).Do()
	if err != nil {
		log.Printf("Error getting instances for %s: %v", project, err)
	}

	return &projectResources{
		Project:                project,
		AddressAggregatedList:  addressAggregatedList,
		InstanceAggregatedList: instanceAggregatedList,
	}
}

// getAllResources returns addresses and instances for all service projects
// attached to a host project.
func getAllResources(hostProject string, service *compute.Service) []*projectResources {
	res, err := getServiceProjects(hostProject, service)
	if err != nil {
		log.Fatal(err)
	}

	ctx := context.TODO()
	sem := semaphore.NewWeighted(maxWorkers)
	output := make([]*projectResources, len(res.Resources))

	// For each project, use a goroutine to get the resources for that project.
	for i := range res.Resources {
		if err := sem.Acquire(ctx, 1); err != nil {
			log.Printf("Failed to acquire semaphore: %v", err)
			break
		}

		go func(i int) {
			defer sem.Release(1)
			output[i] = getResources(res.Resources[i].Id, service)
		}(i)
	}

	if err := sem.Acquire(ctx, maxWorkers); err != nil {
		log.Printf("Failed to acquire semaphore: %v", err)
	}

	return output
}

// insertAddressInfo appends information from an addressInfo struct into a map
// (addressInfoMap) keyed by IP address.
//
// If an IP already exists in the map, merge the information together.
// Existing entries has precedence. This means that if, for some reason, the
// addressInfo struct has different values than the existing entry, it will be
// ignored.
//
// This should work fine assuming the address and instance resources
// don't have contradicting information, which is pretty unlikely. A scenario
// where this might happen is if the address resource represents its subnet one way,
// and the instance using that same address represents its subnet a different way
func insertAddressInfo(addressInfoMap map[string]*addressInfo, addressInfo *addressInfo) {
	i, ok := addressInfoMap[addressInfo.IP]
	if !ok {
		addressInfoMap[addressInfo.IP] = addressInfo
		return
	}

	if i.Status == "" {
		i.Status = addressInfo.Status
	}

	if i.Subnet == "" {
		i.Subnet = addressInfo.Subnet
	}

	if i.User == "" {
		i.User = addressInfo.User
	}
}

// getName parses self-links to get just the resource name at the end
func getName(selfLink string) string {
	split := strings.Split(selfLink, "/")
	return split[len(split)-1]
}

// flatten processes a slice of projectResources. It pulls out the IPs and
// information about those IPs that we are interested in, and returns a map of
// addressInfo objects, where its keys are IP addresses
func flatten(projectResourceList []*projectResources) map[string]*addressInfo {
	addressInfoMap := make(map[string]*addressInfo)

	for _, p := range projectResourceList {
		if p.AddressAggregatedList == nil {
			log.Printf("%s has no reserved addresses", p.Project)
			continue
		}

		for _, addressScopedList := range p.AddressAggregatedList.Items {
			if addressScopedList.Addresses == nil {
				continue
			}

			for _, address := range addressScopedList.Addresses {
				// make sure user is not nil, which happens when reserved IP
				// is RESERVED but not IN_USE
				var user string
				if address.Users != nil {
					user = getName(address.Users[0])
				}
				insertAddressInfo(addressInfoMap, &addressInfo{
					Project: p.Project,
					IP:      address.Address,
					Status:  address.Status,
					Subnet:  getName(address.Subnetwork),
					User:    user,
				})
			}
		}

		if p.InstanceAggregatedList == nil {
			log.Printf("%s has no instances", p.Project)
			continue
		}

		for _, instanceScopedList := range p.InstanceAggregatedList.Items {
			if instanceScopedList.Instances == nil {
				continue
			}

			for _, instance := range instanceScopedList.Instances {
				insertAddressInfo(addressInfoMap, &addressInfo{
					Project: p.Project,
					IP:      instance.NetworkInterfaces[0].NetworkIP,
					Subnet:  getName(instance.NetworkInterfaces[0].Subnetwork),
					User:    instance.Name,
				})
			}
		}
	}

	return addressInfoMap
}

// extractFields takes a list of projectResources and re-organize them by subnet.
func extractFields(projectResourceList []*projectResources) map[string][]*addressInfo {
	addressInfoBySubnet := make(map[string][]*addressInfo)

	// Re-organize by subnet
	for _, addressInfo := range flatten(projectResourceList) {
		addressInfoBySubnet[addressInfo.Subnet] = append(addressInfoBySubnet[addressInfo.Subnet], addressInfo)
	}

	return addressInfoBySubnet
}

// writeToFile takes a subnet and its list of addressInfo objects, sorts list by
// IP address, and then writes the result to a file in Markdown format.
func writeToFile(subnet string, addressInfoList []*addressInfo) {
	if _, err := os.Stat(outputDir); os.IsNotExist(err) {
		os.Mkdir(outputDir, 0755)
	}

	f, err := os.Create(filepath.Join(outputDir, subnet+".md"))
	if err != nil {
		log.Fatal(err)
	}
	defer f.Close()

	_, err = fmt.Fprintf(f, "# Reserved IPs for %s\n", subnet)
	if err != nil {
		log.Fatal(err)
	}

	sort.Slice(addressInfoList, func(i, j int) bool {
		a := net.ParseIP(addressInfoList[i].IP)
		b := net.ParseIP(addressInfoList[j].IP)
		return bytes.Compare(a, b) < 0
	})

	var data [][]string
	for _, addressInfo := range addressInfoList {
		data = append(data, []string{
			addressInfo.IP,
			addressInfo.Project,
			addressInfo.Status,
			addressInfo.User,
		})
	}

	table := tablewriter.NewWriter(f)
	table.SetHeader([]string{"IP", "GCP Project", "Status", "User"})
	table.SetBorders(tablewriter.Border{Left: true, Top: false, Right: true, Bottom: false})
	table.SetCenterSeparator("|")
	table.AppendBulk(data)
	table.Render()

	log.Printf("Writing to %s.md", subnet)
}

// writeAllToFile loops through addressBySubnet map and writes each subnet to a
// different file
func writeAllToFile(addressesBySubnet map[string][]*addressInfo) {
	for subnet, addressInfoList := range addressesBySubnet {
		if subnet != "" {
			writeToFile(subnet, addressInfoList)
		}
	}
}

func main() {
	// Host project (shared VPC project) is a required parameter
	if len(os.Args) < 2 {
		log.Fatalln("Missing required parameter: host-project")
	}
	hostProject := os.Args[1]

	computeService := initClient()
	resources := getAllResources(hostProject, computeService)
	addressInfoBySubnet := extractFields(resources)
	writeAllToFile(addressInfoBySubnet)
}
