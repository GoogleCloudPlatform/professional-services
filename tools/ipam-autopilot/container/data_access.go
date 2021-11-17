package main

import (
	"context"
	"fmt"
	"log"
	"net"
	"os"

	"cloud.google.com/go/firestore"
	"github.com/apparentlymart/go-cidr/cidr"
	"github.com/golang-migrate/migrate/v4"
	"github.com/jackc/pgtype"
	"github.com/jackc/pgx/v4/pgxpool"

	_ "github.com/golang-migrate/migrate/v4/database/postgres"
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

func InitDatabase() error {
	var err error
	db_url := os.Getenv("DB_URL")
	if len(db_url) == 0 {
		db_url = "postgres://postgres:postgres@localhost:5432/ipam?sslmode=disable"
	}
	m, err := migrate.New(
		"file://migrations",
		db_url)
	if err != nil {
		log.Printf("%v", err)
		return err
	}
	if err := m.Up(); err != nil {
		log.Printf("%v", err)
		return err
	}
	return nil
}

var dbpool *pgxpool.Pool

func GetRangesFromDB() ([]Range, error) {
	ctx := context.Background()
	var ranges []Range
	rows, err := dbpool.Query(ctx, "SELECT subnet_id, parent_id, routing_domain_id, name, cidr FROM subnets")
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

func GetRangesForParentFromDB(parent_id int64) ([]Range, error) {
	ctx := context.Background()
	var ranges []Range
	rows, err := dbpool.Query(ctx, "SELECT subnet_id, parent_id, routing_domain_id, name, cidr FROM subnets WHERE parent_id = $1", parent_id)
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
	ctx := context.Background()

	var subnet_id int
	var routing_domain_id int
	tmp := pgtype.Int4{}
	var name string
	var cidr string

	err := dbpool.QueryRow(ctx, "SELECT subnet_id, parent_id, routing_domain_id, name, cidr FROM subnets WHERE subnet_id = $1", id).Scan(&subnet_id, &tmp, &routing_domain_id, &name, &cidr)

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

func GetRangeByCidrFromDB(cidr_request string) (*Range, error) {
	ctx := context.Background()

	var subnet_id int
	var routing_domain_id int
	tmp := pgtype.Int4{}
	var name string
	var cidr string

	err := dbpool.QueryRow(ctx, "SELECT subnet_id, parent_id, routing_domain_id, name, cidr FROM subnets WHERE cidr = $1", cidr_request).Scan(&subnet_id, &tmp, &routing_domain_id, &name, &cidr)

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

func DeleteRangeFromDb(id int64) error {
	ctx := context.Background()

	_, err := dbpool.Query(ctx, "DELETE FROM subnets WHERE subnet_id = $1", id)

	if err != nil {
		return err
	}
	return nil
}

func CreateRangeInDb(parent_id int64, routing_domain_id int, name string, cidr string) (int64, error) {
	ctx := context.Background()
	if parent_id == -1 {
		row, err := dbpool.Query(ctx, "INSERT INTO subnets(subnet_id, routing_domain_id, name, cidr) VALUES (DEFAULT,$1,$2,$3) RETURNING subnet_id;", routing_domain_id, name, cidr)
		if err != nil {
			return -1, err
		}
		var subnet_id int64
		row.Scan(&subnet_id)
		return subnet_id, nil
	} else {
		row := dbpool.QueryRow(ctx, "INSERT INTO subnets(subnet_id, parent_id, routing_domain_id, name, cidr) VALUES (DEFAULT,$1,$2,$3,$4) RETURNING subnet_id;", parent_id, routing_domain_id, name, cidr)
		var subnet_id int64
		row.Scan(&subnet_id)
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

func getParentSnapshot(collection *firestore.CollectionRef, parentCidr string) (*firestore.DocumentRef, string, error) {
	ctx := context.Background()
	_, parentNetwork, err := net.ParseCIDR(parentCidr)
	if err != nil {
		return nil, "", fmt.Errorf("can't parse parent cidr range %s %v", parentCidr, err)
	}
	ones, _ := parentNetwork.Mask.Size()
	id := fmt.Sprintf("%s_%d", parentNetwork.IP.To4().String(), ones)

	ref := collection.Doc(id)
	snapshot, err := ref.Get(ctx)
	if err != nil {
		return nil, "", fmt.Errorf("can't get parent document for %s %v", parentCidr, err)
	}
	return ref, snapshot.Data()["Cidr"].(string), nil
}

func verifyNoOverlap(parentCidr string, subnetRanges []Range, newSubnet *net.IPNet) error {
	_, parentNetwork, err := net.ParseCIDR(parentCidr)
	if err != nil {
		return fmt.Errorf("can't parse CIDR %v", err)
	}
	log.Printf("Checking Overlap\nparentCidr:\t%s", parentCidr)
	var subnets []*net.IPNet
	subnets = append(subnets, newSubnet)
	log.Printf("newSubnet:\t%s/%d", newSubnet.IP.String(), netMask(newSubnet.Mask))
	for i := 0; i < len(subnetRanges); i++ {
		subnetRange := subnetRanges[i]
		netAddr, subnetCidr, err := net.ParseCIDR(subnetRange.Cidr)
		log.Printf("subnet:\t%s", subnetCidr)
		if err != nil {
			return fmt.Errorf("can't parse CIDR %v", err)
		}
		if parentNetwork.Contains(netAddr) {
			subnets = append(subnets, subnetCidr)
		}
	}

	return cidr.VerifyNoOverlap(subnets, parentNetwork)
}

func netMask(mask net.IPMask) int {
	ones, _ := mask.Size()
	return ones
}

func GetDefaultRoutingDomainFromDB() (*RoutingDomain, error) {
	ctx := context.Background()
	var routing_domain_id int
	var name string
	var vpcs string

	err := dbpool.QueryRow(ctx, "SELECT routing_domain_id, name, vpcs FROM routing_domains LIMIT 1").Scan(&routing_domain_id, &name, &vpcs)
	if err != nil {
		return nil, err
	}

	return &RoutingDomain{
		Id:   routing_domain_id,
		Name: name,
		Vpcs: vpcs,
	}, nil
}

func GetRoutingDomainsFromDB() ([]RoutingDomain, error) {
	ctx := context.Background()
	var domains []RoutingDomain
	rows, err := dbpool.Query(ctx, "SELECT routing_domain_id, name FROM routing_domains")
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var routing_domain_id int
		var name string
		err := rows.Scan(&routing_domain_id, &name)
		if err != nil {
			return nil, err
		}
		domains = append(domains, RoutingDomain{
			Id:   routing_domain_id,
			Name: name,
		})
	}
	return domains, nil
}

func GetRoutingDomainFromDB(id int64) (*RoutingDomain, error) {
	ctx := context.Background()

	var routing_domain_id int
	var name string

	err := dbpool.QueryRow(ctx, "SELECT routing_domain_id, name FROM routing_domains WHERE routing_domain_id = $1", id).Scan(&routing_domain_id, &name)
	if err != nil {
		return nil, err
	}

	return &RoutingDomain{
		Id:   routing_domain_id,
		Name: name,
	}, nil
}

func UpdateRoutingDomainOnDb(id int64, vpcs string) error {
	ctx := context.Background()

	_, err := dbpool.Query(ctx, "UPDATE routing_domains SET vpcs = $2 WHERE routing_domain_id = $1", id, vpcs)
	if err != nil {
		return err
	}
	return nil
}
