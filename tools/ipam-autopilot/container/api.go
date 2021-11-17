package main

import (
	"fmt"
	"log"
	"strconv"
	"strings"

	"github.com/apparentlymart/go-cidr/cidr"
	"github.com/gofiber/fiber/v2"
)

type UpdateRoutingDomainRequest struct {
	Vpcs string
}

type RangeRequest struct {
	Parent     string
	Name       string
	Range_size int
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
	routingDomain, err := GetDefaultRoutingDomainFromDB()
	if err != nil {
		fmt.Printf("Error %v", err)
		return c.Status(503).JSON(&fiber.Map{
			"success": false,
			"message": "Couldn't retrieve default routing domain",
		})
	}

	// Instantiate new RangeRequest struct
	p := new(RangeRequest)
	//  Parse body into RangeRequest struct
	if err := c.BodyParser(p); err != nil {
		return c.Status(400).JSON(&fiber.Map{
			"success": false,
			"message": fmt.Sprintf("Bad format %v", err),
		})
	}
	range_size := p.Range_size
	var parent_range string
	if p.Parent != "" {
		parent_range = p.Parent
	} else {
		// Default to 10.0.0.0/8 if no parent is provided
		parent_range = "10.0.0.0/8"
	}

	parent, err := GetRangeByCidrFromDB(parent_range)
	if err != nil {
		return c.Status(503).JSON(&fiber.Map{
			"success": false,
			"message": fmt.Sprintf("Unable to create new Subnet Lease  %v", err),
		})
	}
	subnet_ranges, err := GetRangesForParentFromDB(int64(parent.Subnet_id))
	if err != nil {
		return c.Status(503).JSON(&fiber.Map{
			"success": false,
			"message": fmt.Sprintf("Unable to create new Subnet Lease  %v", err),
		})
	}

	// Integrating ranges from the VPC -- start
	vpcs := strings.Split(routingDomain.Vpcs, ",")
	for i := 0; i < len(vpcs); i++ {
		vpc := vpcs[i]
		ranges, err := GetRangesForNetwork(fmt.Sprintf("organizations/%s", "203384149598"), vpc) // TODO orgId needs to be extranlized
		if err != nil {
			return c.Status(503).JSON(&fiber.Map{
				"success": false,
				"message": fmt.Sprintf("error %v", err),
			})
		}

		for j := 0; j < len(ranges); j++ {
			vpc_range := ranges[j]
			if !ContainsRange(subnet_ranges, vpc_range.cidr) {
				subnet_ranges = append(subnet_ranges, Range{
					Cidr: vpc_range.cidr,
				})
			}

			for k := 0; k < len(vpc_range.secondaryRanges); k++ {
				secondaryRange := vpc_range.secondaryRanges[k]
				if !ContainsRange(subnet_ranges, secondaryRange.cidr) {
					subnet_ranges = append(subnet_ranges, Range{
						Cidr: secondaryRange.cidr,
					})
				}
			}
		}
	}
	// Integrating ranges from the VPC -- end

	// TODO loop verifyNoOverlap until lastSubnet is true
	subnet, subnetOnes, err := createNewSubnetLease(parent.Cidr, int(range_size), 0)
	if err != nil {
		return c.Status(503).JSON(&fiber.Map{
			"success": false,
			"message": fmt.Sprintf("Unable to create new Subnet Lease %v", err),
		})
	}
	log.Printf("new subnet lease %s/%d", subnet.IP.String(), subnetOnes)

	var lastSubnet = false
	for {
		err = verifyNoOverlap(parent.Cidr, subnet_ranges, subnet)
		if err == nil {
			break
		} else if !lastSubnet {
			subnet, lastSubnet = cidr.NextSubnet(subnet, int(range_size))
		} else {
			return c.Status(503).JSON(&fiber.Map{
				"success": false,
				"message": "Can't allocate subnet",
			})
		}
	}

	nextSubnet, _ := cidr.NextSubnet(subnet, int(range_size))
	log.Printf("next subnet will be starting with %s", nextSubnet.IP.String())

	id, err := CreateRangeInDb(int64(parent.Subnet_id), routingDomain.Id, p.Name, fmt.Sprintf("%s/%d", subnet.IP.To4().String(), subnetOnes))

	if err != nil {
		return c.Status(503).JSON(&fiber.Map{
			"success": false,
			"message": fmt.Sprintf("Unable to create new Subnet Lease %v", err),
		})
	}

	return c.Status(200).JSON(&fiber.Map{
		"id":   id,
		"cidr": fmt.Sprintf("%s/%d", subnet.IP.To4().String(), subnetOnes),
	})
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
	UpdateRoutingDomainOnDb(id, p.Vpcs)
	return nil
}

func SubnetChanged(c *fiber.Ctx) error {
	//ctx := context.Background()
	log.Printf("Received Subnet %v", string(c.Body()))
	return nil
}

func RefreshSubnetsFromCai(c *fiber.Ctx) error {
	//ctx := context.Background()
	//log.Printf("Received Subnet %v", string(c.Body()))
	GetRangesForNetwork(fmt.Sprintf("organizations/%s", "203384149598"), "https://www.googleapis.com/compute/v1/projects/gjx-p-shared-base-c44d/global/networks/vpc-p-shared-base-spoke")

	return nil
}

func ContainsRange(array []Range, cidr string) bool {
	for i := 0; i < len(array); i++ {
		if cidr == array[i].Cidr {
			return true
		}
	}
	return false
}
