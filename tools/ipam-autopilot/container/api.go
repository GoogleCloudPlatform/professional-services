// Copyright 2021 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"os"
	"strconv"
	"strings"

	"github.com/apparentlymart/go-cidr/cidr"
	"github.com/gofiber/fiber/v2"
)

type CreateRoutingDomainRequest struct {
	Name string   `json:"name"`
	Vpcs []string `json:"vpcs"`
}

type UpdateRoutingDomainRequest struct {
	Name JSONString      `json:"name"`
	Vpcs JSONStringArray `json:"vpcs"`
}

type RangeRequest struct {
	Parent     string `json:"parent"`
	Name       string `json:"name"`
	Range_size int    `json:"range_size"`
	Domain     string `json:"domain"`
	Cidr       string `json:"cidr"`
}

func GetRanges(c *fiber.Ctx) error {
	var results []*fiber.Map
	ranges, err := GetRangesFromDB()
	if err != nil {
		return c.Status(503).JSON(&fiber.Map{
			"success": false,
			"message": fmt.Sprintf("%v", err),
		})
	}

	for i := 0; i < len(ranges); i++ {
		results = append(results, &fiber.Map{
			"id":     ranges[i].Subnet_id,
			"parent": ranges[i].Parent_id,
			"name":   ranges[i].Name,
			"cidr":   ranges[i].Cidr,
		})
	}
	return c.Status(200).JSON(results)
}

func GetRange(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(&fiber.Map{
			"success": false,
			"message": fmt.Sprintf("%v", err),
		})
	}
	rang, err := GetRangeFromDB(id)
	if err != nil {
		return c.Status(503).JSON(&fiber.Map{
			"success": false,
			"message": fmt.Sprintf("%v", err),
		})
	}

	return c.Status(200).JSON(&fiber.Map{
		"id":     rang.Subnet_id,
		"parent": rang.Parent_id,
		"name":   rang.Name,
		"cidr":   rang.Cidr,
	})
}

func DeleteRange(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(&fiber.Map{
			"success": false,
			"message": fmt.Sprintf("%v", err),
		})
	}
	err = DeleteRangeFromDb(id)
	if err != nil {
		return c.Status(503).JSON(&fiber.Map{
			"success": false,
			"message": fmt.Sprintf("%v", err),
		})
	}

	return c.Status(200).JSON(&fiber.Map{
		"success": true,
	})
}

func CreateNewRange(c *fiber.Ctx) error {
	ctx := context.Background()
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		log.Fatal(err)
	}

	// Instantiate new RangeRequest struct
	p := RangeRequest{}
	//  Parse body into RangeRequest struct
	if err := c.BodyParser(&p); err != nil {
		fmt.Printf("Failed parsing body. %s Bad format %v", string(c.Body()), err)
		tx.Rollback()
		return c.Status(400).JSON(&fiber.Map{
			"success": false,
			"message": fmt.Sprintf("Bad format %v", err),
		})
	}

	var routingDomain *RoutingDomain
	if p.Domain == "" {
		routingDomain, err = GetDefaultRoutingDomainFromDB(tx)
		if err != nil {
			fmt.Printf("Error %v", err)
			tx.Rollback()
			return c.Status(503).JSON(&fiber.Map{
				"success": false,
				"message": "Couldn't retrieve default routing domain",
			})
		}
	} else {
		domain_id, err := strconv.ParseInt(p.Domain, 10, 64)
		if err != nil {
			return c.Status(400).JSON(&fiber.Map{
				"success": false,
				"message": fmt.Sprintf("%v", err),
			})
		}
		routingDomain, err = GetRoutingDomainFromDB(domain_id)
		if err != nil {
			fmt.Printf("Error %v", err)
			tx.Rollback()
			return c.Status(503).JSON(&fiber.Map{
				"success": false,
				"message": "Couldn't retrieve default routing domain",
			})
		}
	}

	if p.Cidr != "" {
		return directInsert(c, tx, p, routingDomain)
	} else {
		return findNewLeaseAndInsert(c, tx, p, routingDomain)
	}
}

func directInsert(c *fiber.Ctx, tx *sql.Tx, p RangeRequest, routingDomain *RoutingDomain) error {
	var err error
	domain_id, err := strconv.ParseInt(p.Domain, 10, 64)
	if err != nil {
		return c.Status(400).JSON(&fiber.Map{
			"success": false,
			"message": fmt.Sprintf("Domain needs to be an integer %v", err),
		})
	}

	parent_id := int64(-1)
	if p.Parent != "" {
		parent_id, err = strconv.ParseInt(p.Parent, 10, 64)
		if err != nil {
			rangeFromDb, err := getRangeByCidrAndRoutingDomain(tx, p.Parent, int(domain_id))
			if err != nil {
				return c.Status(400).JSON(&fiber.Map{
					"success": false,
					"message": fmt.Sprintf("Parent needs to be either a cidr range within the routing domain or the id of a valid range %v", err),
				})
			}
			parent_id = int64(rangeFromDb.Subnet_id)
		}
	}

	id, err := CreateRangeInDb(tx, parent_id,
		int(domain_id),
		p.Name,
		p.Cidr)

	if err != nil {
		tx.Rollback()
		return c.Status(503).JSON(&fiber.Map{
			"success": false,
			"message": fmt.Sprintf("Unable to create new Subnet Lease %v", err),
		})
	}

	err = tx.Commit()
	if err != nil {
		log.Fatal(err)
	}

	return c.Status(200).JSON(&fiber.Map{
		"id":   id,
		"cidr": p.Cidr,
	})
}

func findNewLeaseAndInsert(c *fiber.Ctx, tx *sql.Tx, p RangeRequest, routingDomain *RoutingDomain) error {
	var err error
	var parent *Range
	if p.Parent != "" {
		parent_id, err := strconv.ParseInt(p.Parent, 10, 64)
		if err != nil {
			parent, err = getRangeByCidrAndRoutingDomain(tx, p.Parent, routingDomain.Id)
			if err != nil {
				return c.Status(400).JSON(&fiber.Map{
					"success": false,
					"message": fmt.Sprintf("Parent needs to be either a cidr range within the routing domain or the id of a valid range %v", err),
				})
			}
		} else {
			parent, err = GetRangeFromDBWithTx(tx, parent_id)
			if err != nil {
				tx.Rollback()
				return c.Status(503).JSON(&fiber.Map{
					"success": false,
					"message": fmt.Sprintf("Unable to create new Subnet Lease  %v", err),
				})
			}
		}
	} else {
		return c.Status(400).JSON(&fiber.Map{
			"success": false,
			"message": "Please provide the ID of a parent range",
		})
	}
	range_size := p.Range_size
	subnet_ranges, err := GetRangesForParentFromDB(tx, int64(parent.Subnet_id))
	if err != nil {
		tx.Rollback()
		return c.Status(503).JSON(&fiber.Map{
			"success": false,
			"message": fmt.Sprintf("Unable to create new Subnet Lease  %v", err),
		})
	}
	if os.Getenv("CAI_ORG_ID") != "" {
		log.Printf("CAI for org %s enabled", os.Getenv("CAI_ORG_ID"))
		// Integrating ranges from the VPC -- start
		vpcs := strings.Split(routingDomain.Vpcs, ",")
		log.Printf("Looking for subnets in vpcs %v", vpcs)
		ranges, err := GetRangesForNetwork(fmt.Sprintf("organizations/%s", os.Getenv("CAI_ORG_ID")), vpcs)
		if err != nil {
			tx.Rollback()
			return c.Status(503).JSON(&fiber.Map{
				"success": false,
				"message": fmt.Sprintf("error %v", err),
			})
		}
		log.Printf("Found %d subnets in vpcs %v", len(ranges), vpcs)

		for j := 0; j < len(ranges); j++ {
			vpc_range := ranges[j]
			if !ContainsRange(subnet_ranges, vpc_range.cidr) {
				log.Printf("Adding range %s from CAI", vpc_range.cidr)
				subnet_ranges = append(subnet_ranges, Range{
					Cidr: vpc_range.cidr,
				})
			}

			for k := 0; k < len(vpc_range.secondaryRanges); k++ {
				secondaryRange := vpc_range.secondaryRanges[k]
				if !ContainsRange(subnet_ranges, secondaryRange.cidr) {
					log.Printf("Adding secondary range %s from CAI", vpc_range.cidr)
					subnet_ranges = append(subnet_ranges, Range{
						Cidr: secondaryRange.cidr,
					})
				}
			}
		}
		// Integrating ranges from the VPC -- end
	} else {
		log.Printf("Not checking CAI, env variable with Org ID not set")
	}

	subnet, subnetOnes, err := findNextSubnet(int(range_size), parent.Cidr, subnet_ranges)
	if err != nil {
		tx.Rollback()
		return c.Status(503).JSON(&fiber.Map{
			"success": false,
			"message": fmt.Sprintf("Unable to create new Subnet Lease %v", err),
		})
	}
	nextSubnet, _ := cidr.NextSubnet(subnet, int(range_size))
	log.Printf("next subnet will be starting with %s", nextSubnet.IP.String())

	id, err := CreateRangeInDb(tx, int64(parent.Subnet_id), routingDomain.Id, p.Name, fmt.Sprintf("%s/%d", subnet.IP.To4().String(), subnetOnes))

	if err != nil {
		tx.Rollback()
		return c.Status(503).JSON(&fiber.Map{
			"success": false,
			"message": fmt.Sprintf("Unable to create new Subnet Lease %v", err),
		})
	}

	err = tx.Commit()
	if err != nil {
		log.Fatal(err)
	}

	return c.Status(200).JSON(&fiber.Map{
		"id":   id,
		"cidr": fmt.Sprintf("%s/%d", subnet.IP.To4().String(), subnetOnes),
	})
}

func findNextSubnet(range_size int, sourceRange string, existingRanges []Range) (*net.IPNet, int, error) {
	_, parentNet, err := net.ParseCIDR(sourceRange)
	if err != nil {
		return nil, -1, err
	}

	subnet, subnetOnes, err := createNewSubnetLease(sourceRange, range_size, 0)
	if err != nil {
		return nil, -1, err
	}
	log.Printf("new subnet lease %s/%d", subnet.IP.String(), subnetOnes)

	var lastSubnet = false
	for {
		err = verifyNoOverlap(sourceRange, existingRanges, subnet)
		if err == nil {
			break
		} else if !lastSubnet {
			subnet, lastSubnet = cidr.NextSubnet(subnet, int(range_size))
			if !parentNet.Contains(subnet.IP) {
				return nil, -1, fmt.Errorf("no_address_range_available_in_parent")
			}
		} else {
			return nil, -1, err
		}
	}

	return subnet, subnetOnes, nil
}

func GetRoutingDomain(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(&fiber.Map{
			"success": false,
			"message": fmt.Sprintf("%v", err),
		})
	}
	domain, err := GetRoutingDomainFromDB(id)
	if err != nil {
		return c.Status(503).JSON(&fiber.Map{
			"success": false,
			"message": fmt.Sprintf("%v", err),
		})
	}

	return c.Status(200).JSON(&fiber.Map{
		"id":   domain.Id,
		"name": domain.Name,
		"vpcs": domain.Vpcs,
	})
}

func DeleteRoutingDomain(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(&fiber.Map{
			"success": false,
			"message": fmt.Sprintf("%v", err),
		})
	}
	err = DeleteRoutingDomainFromDB(id)
	if err != nil {
		return c.Status(503).JSON(&fiber.Map{
			"success": false,
			"message": fmt.Sprintf("%v", err),
		})
	}

	return c.Status(200).JSON(&fiber.Map{})
}

func GetRoutingDomains(c *fiber.Ctx) error {
	var results []*fiber.Map
	domains, err := GetRoutingDomainsFromDB()
	if err != nil {
		return c.Status(503).JSON(&fiber.Map{
			"success": false,
			"message": fmt.Sprintf("%v", err),
		})
	}

	for i := 0; i < len(domains); i++ {
		results = append(results, &fiber.Map{
			"id":   domains[i].Id,
			"name": domains[i].Name,
			"vpcs": domains[i].Vpcs,
		})
	}

	return c.Status(200).JSON(results)
}

func UpdateRoutingDomain(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(&fiber.Map{
			"success": false,
			"message": fmt.Sprintf("%v", err),
		})
	}

	// Instantiate new UpdateRoutingDomainRequest struct
	p := new(UpdateRoutingDomainRequest)
	//  Parse body into UpdateRoutingDomainRequest struct
	if err := c.BodyParser(p); err != nil {
		return c.Status(400).JSON(&fiber.Map{
			"success": false,
			"message": fmt.Sprintf("Bad format %v", err),
		})
	}
	err = UpdateRoutingDomainOnDb(id, p.Name, p.Vpcs)
	if err != nil {
		return c.Status(503).JSON(&fiber.Map{
			"success": false,
			"message": fmt.Sprintf("Unable to update routing domain %v", err),
		})
	}
	return c.Status(200).JSON(&fiber.Map{})
}

func CreateRoutingDomain(c *fiber.Ctx) error {
	// Instantiate new UpdateRoutingDomainRequest struct
	p := new(CreateRoutingDomainRequest)
	//  Parse body into UpdateRoutingDomainRequest struct
	if err := c.BodyParser(p); err != nil {
		return c.Status(400).JSON(&fiber.Map{
			"success": false,
			"message": fmt.Sprintf("Bad format %v", err),
		})
	}
	id, err := CreateRoutingDomainOnDb(p.Name, p.Vpcs)
	if err != nil {
		return c.Status(503).JSON(&fiber.Map{
			"success": false,
			"message": fmt.Sprintf("Unable to create new routing domain %v", err),
		})
	}

	return c.Status(200).JSON(&fiber.Map{
		"id": id,
	})
}

func ContainsRange(array []Range, cidr string) bool {
	for i := 0; i < len(array); i++ {
		if cidr == array[i].Cidr {
			return true
		}
	}
	return false
}

type JSONString struct {
	Value string
	Set   bool
}

func (i *JSONString) UnmarshalJSON(data []byte) error {
	i.Set = true
	var val string
	if err := json.Unmarshal(data, &val); err != nil {
		return err
	}
	i.Value = val
	return nil
}

type JSONStringArray struct {
	Value []string
	Set   bool
}

func (i *JSONStringArray) UnmarshalJSON(data []byte) error {
	i.Set = true
	var val []string
	if err := json.Unmarshal(data, &val); err != nil {
		return err
	}
	i.Value = val
	return nil
}
