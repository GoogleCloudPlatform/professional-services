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
	"database/sql"
	"fmt"
	"log"
	"net"
	"strings"

	"github.com/apparentlymart/go-cidr/cidr"
	"github.com/jackc/pgtype"

	_ "github.com/golang-migrate/migrate/v4/source/file"
)

type RoutingDomain struct {
	Id   int    `db:"routing_domain_id"`
	Name string `db:"name"`
	Vpcs string `db:"vpcs"` // associated VPCs that should be tracked for subnet creation
}

type Range struct {
	Subnet_id         int    `db:"subnet_id"`
	Parent_id         int    `db:"parent_id"`
	Routing_domain_id int    `db:"routing_domain_id"`
	Name              string `db:"name"`
	Cidr              string `db:"cidr"`
}

func GetRangesFromDB() ([]Range, error) {
	var ranges []Range

	rows, err := db.Query("SELECT subnet_id, parent_id, routing_domain_id, name, cidr FROM subnets")
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var subnet_id int
		var routing_domain_id int
		tmp := pgtype.Int4{}
		var name string
		var cidr string
		err := rows.Scan(&subnet_id, &tmp, &routing_domain_id, &name, &cidr)
		if err != nil {
			return nil, err
		}
		parent_id := -1
		if tmp.Status == pgtype.Present {
			tmp.AssignTo(&parent_id)
		}

		ranges = append(ranges, Range{
			Subnet_id:         subnet_id,
			Parent_id:         parent_id,
			Routing_domain_id: routing_domain_id,
			Name:              name,
			Cidr:              cidr,
		})
	}
	return ranges, nil
}

func GetRangesForParentFromDB(tx *sql.Tx, parent_id int64) ([]Range, error) {
	var ranges []Range
	rows, err := tx.Query("SELECT subnet_id, parent_id, routing_domain_id, name, cidr FROM subnets WHERE parent_id = ? FOR UPDATE", parent_id)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var subnet_id int
		var routing_domain_id int
		tmp := pgtype.Int4{}
		var name string
		var cidr string
		err := rows.Scan(&subnet_id, &tmp, &routing_domain_id, &name, &cidr)
		if err != nil {
			return nil, err
		}
		parent_id := -1
		if tmp.Status == pgtype.Present {
			tmp.AssignTo(&parent_id)
		}

		ranges = append(ranges, Range{
			Subnet_id:         subnet_id,
			Parent_id:         parent_id,
			Routing_domain_id: routing_domain_id,
			Name:              name,
			Cidr:              cidr,
		})
	}
	return ranges, nil
}

func GetRangeFromDB(id int64) (*Range, error) {
	var subnet_id int
	var routing_domain_id int
	tmp := pgtype.Int4{}
	var name string
	var cidr string

	err := db.QueryRow("SELECT subnet_id, parent_id, routing_domain_id, name, cidr FROM subnets WHERE subnet_id = ?", id).Scan(&subnet_id, &tmp, &routing_domain_id, &name, &cidr)

	if err != nil {
		return nil, err
	}
	parent_id := -1
	if tmp.Status == pgtype.Present {
		tmp.AssignTo(&parent_id)
	}

	return &Range{
		Subnet_id:         subnet_id,
		Parent_id:         parent_id,
		Routing_domain_id: routing_domain_id,
		Name:              name,
		Cidr:              cidr,
	}, nil
}

func GetRangeFromDBWithTx(tx *sql.Tx, id int64) (*Range, error) {
	var subnet_id int
	var routing_domain_id int
	tmp := pgtype.Int4{}
	var name string
	var cidr string

	err := tx.QueryRow("SELECT subnet_id, parent_id, routing_domain_id, name, cidr FROM subnets WHERE subnet_id = ? FOR UPDATE", id).Scan(&subnet_id, &tmp, &routing_domain_id, &name, &cidr)

	if err != nil {
		return nil, err
	}
	parent_id := -1
	if tmp.Status == pgtype.Present {
		tmp.AssignTo(&parent_id)
	}

	return &Range{
		Subnet_id:         subnet_id,
		Parent_id:         parent_id,
		Routing_domain_id: routing_domain_id,
		Name:              name,
		Cidr:              cidr,
	}, nil
}

func getRangeByCidrAndRoutingDomain(tx *sql.Tx, request_cidr string, routing_domain_id int) (*Range, error) {
	var subnet_id int
	tmp := pgtype.Int4{}
	var name string
	var cidr string

	err := tx.QueryRow("SELECT subnet_id, parent_id, name, cidr FROM subnets WHERE cidr = ? and routing_domain_id = ? FOR UPDATE", request_cidr, routing_domain_id).Scan(&subnet_id, &tmp, &name, &cidr)
	if err != nil {
		return nil, err
	}

	parent_id := -1
	if tmp.Status == pgtype.Present {
		tmp.AssignTo(&parent_id)
	}

	return &Range{
		Subnet_id:         subnet_id,
		Parent_id:         parent_id,
		Routing_domain_id: routing_domain_id,
		Name:              name,
		Cidr:              cidr,
	}, nil
}

func GetRangeByCidrFromDB(tx *sql.Tx, routing_domain_id int, cidr_request string) (*Range, error) {
	var subnet_id int
	tmp := pgtype.Int4{}
	var name string
	var cidr string

	if cidr_request != "" {
		err := tx.QueryRow("SELECT subnet_id, parent_id, name, cidr FROM subnets WHERE cidr = ? and routing_domain_id = ? FOR UPDATE", cidr_request, routing_domain_id).Scan(&subnet_id, &tmp, &name, &cidr)
		if err != nil {
			return nil, err
		}
	} else {
		err := tx.QueryRow("SELECT subnet_id, parent_id, name, cidr FROM subnets WHERE routing_domain_id = ? LIMIT 1 FOR UPDATE", routing_domain_id).Scan(&subnet_id, &tmp, &name, &cidr)
		if err != nil {
			return nil, err
		}
	}
	parent_id := -1
	if tmp.Status == pgtype.Present {
		tmp.AssignTo(&parent_id)
	}

	return &Range{
		Subnet_id:         subnet_id,
		Parent_id:         parent_id,
		Routing_domain_id: routing_domain_id,
		Name:              name,
		Cidr:              cidr,
	}, nil
}

func DeleteRangeFromDb(id int64) error {
	_, err := db.Query("DELETE FROM subnets WHERE subnet_id = ?", id)

	if err != nil {
		return err
	}
	return nil
}

func DeleteRoutingDomainFromDB(id int64) error {
	_, err := db.Query("DELETE FROM routing_domains WHERE routing_domain_id = ?", id)

	if err != nil {
		return err
	}
	return nil
}

func CreateRangeInDb(tx *sql.Tx, parent_id int64, routing_domain_id int, name string, cidr string) (int64, error) {
	if parent_id == -1 {
		res, err := tx.Exec("INSERT INTO subnets (routing_domain_id, name, cidr) VALUES (?,?,?);", routing_domain_id, name, cidr)
		if err != nil {
			return -1, err
		}
		subnet_id, err := res.LastInsertId()
		if err != nil {
			return -1, err
		}
		return subnet_id, nil
	} else {
		res, err := tx.Exec("INSERT INTO subnets (parent_id, routing_domain_id, name, cidr) VALUES (?,?,?,?);", parent_id, routing_domain_id, name, cidr)
		if err != nil {
			return -1, err
		}
		subnet_id, err := res.LastInsertId()
		if err != nil {
			return -1, err
		}
		return subnet_id, nil
	}
}

func createNewSubnetLease(prevCidr string, range_size int, subnetIndex int) (*net.IPNet, int, error) {
	_, network, err := net.ParseCIDR(prevCidr)
	if err != nil {
		return nil, -1, fmt.Errorf("unable to calculate subnet %v", err)
	}
	ones, size := network.Mask.Size()
	subnet, err := cidr.Subnet(network, int(range_size)-ones, subnetIndex)
	if err != nil {
		return nil, -1, fmt.Errorf("unable to calculate subnet %v", err)
	}
	subnet.Mask = net.CIDRMask(range_size, size)
	return subnet, range_size, nil
}

func verifyNoOverlap(parentCidr string, subnetRanges []Range, newSubnet *net.IPNet) error {
	_, parentNetwork, err := net.ParseCIDR(parentCidr)
	if err != nil {
		return fmt.Errorf("can't parse CIDR %v", err)
	}
	log.Printf("Checking Overlap\nparentCidr:\t%s", parentCidr)
	log.Printf("newSubnet:\t%s/%d", newSubnet.IP.String(), netMask(newSubnet.Mask))
	for i := 0; i < len(subnetRanges); i++ {
		subnetRange := subnetRanges[i]
		netAddr, subnetCidr, err := net.ParseCIDR(subnetRange.Cidr)
		if err != nil {
			return fmt.Errorf("can't parse CIDR %v", err)
		}
		if parentNetwork.Contains(netAddr) {
			err = cidr.VerifyNoOverlap([]*net.IPNet{subnetCidr, newSubnet}, parentNetwork)

			if err != nil {
				return err
			}
		}
	}

	return nil
}

func netMask(mask net.IPMask) int {
	ones, _ := mask.Size()
	return ones
}

func GetDefaultRoutingDomainFromDB(tx *sql.Tx) (*RoutingDomain, error) {
	var routing_domain_id int
	var name string
	var vpcs sql.NullString

	err := tx.QueryRow("SELECT routing_domain_id, name, vpcs FROM routing_domains LIMIT 1 FOR UPDATE").Scan(&routing_domain_id, &name, &vpcs)
	if err != nil {
		return nil, err
	}

	return &RoutingDomain{
		Id:   routing_domain_id,
		Name: name,
		Vpcs: vpcs.String,
	}, nil
}

func GetRoutingDomainsFromDB() ([]RoutingDomain, error) {
	var domains []RoutingDomain
	rows, err := db.Query("SELECT routing_domain_id, name, vpcs FROM routing_domains")
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var routing_domain_id int
		var name string
		var vpcs sql.NullString
		err := rows.Scan(&routing_domain_id, &name, &vpcs)
		if err != nil {
			return nil, err
		}
		domains = append(domains, RoutingDomain{
			Id:   routing_domain_id,
			Name: name,
			Vpcs: vpcs.String,
		})
	}
	return domains, nil
}

func GetRoutingDomainFromDB(id int64) (*RoutingDomain, error) {
	var routing_domain_id int
	var name string
	var vpcs sql.NullString

	err := db.QueryRow("SELECT routing_domain_id, name, vpcs FROM routing_domains WHERE routing_domain_id = ?", id).Scan(&routing_domain_id, &name, &vpcs)
	if err != nil {
		return nil, err
	}

	return &RoutingDomain{
		Id:   routing_domain_id,
		Name: name,
		Vpcs: vpcs.String,
	}, nil
}

func UpdateRoutingDomainOnDb(id int64, name JSONString, vpcs JSONStringArray) error {
	if name.Set && vpcs.Set {
		_, err := db.Query("UPDATE routing_domains SET name = ?, vpcs = ? WHERE routing_domain_id = ?", name.Value, strings.Join(vpcs.Value, ","), id)
		if err != nil {
			return err
		}
	} else if vpcs.Set {
		_, err := db.Query("UPDATE routing_domains SET vpcs = ? WHERE routing_domain_id = ?", strings.Join(vpcs.Value, ","), id)
		if err != nil {
			return err
		}
	} else if name.Set {
		_, err := db.Query("UPDATE routing_domains SET name = ? WHERE routing_domain_id = ?", name.Value, id)
		if err != nil {
			return err
		}
	}
	return nil
}

func CreateRoutingDomainOnDb(name string, vpcs []string) (int64, error) {
	res, err := db.Exec("INSERT INTO routing_domains (name, vpcs) VALUES (?,?);", name, strings.Join(vpcs, ","))
	if err != nil {
		return -1, err
	}
	domain_id, err := res.LastInsertId()
	if err != nil {
		return -1, err
	}
	return domain_id, nil
}
