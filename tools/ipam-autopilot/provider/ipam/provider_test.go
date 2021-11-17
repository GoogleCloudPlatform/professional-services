package ipam

import (
	"fmt"
	"testing"

	"github.com/hashicorp/terraform-plugin-sdk/v2/helper/resource"
	"github.com/hashicorp/terraform-plugin-sdk/v2/helper/schema"
	"github.com/hashicorp/terraform-plugin-sdk/v2/terraform"
)

var testAccProviders map[string]*schema.Provider
var testAccProvider *schema.Provider

func init() {
	testAccProvider = Provider()
	testAccProviders = map[string]*schema.Provider{
		"ipam": testAccProvider,
	}
}

func testAccPreCheck(t *testing.T) {
	/*if os.Getenv("API_KEY") == "" {
		t.Fatal("API_KEY and CLIENT_SECRET must be set for acceptance tests")
	}*/
}

func TestAccIpRange(t *testing.T) {
	resource.ParallelTest(t, resource.TestCase{
		PreCheck:     func() { testAccPreCheck(t) },
		Providers:    testAccProviders,
		CheckDestroy: nil,
		Steps: []resource.TestStep{
			{
				Config: testAccIpRangeResource("24"),
				Check: resource.ComposeTestCheckFunc(
					testAccIpRangeExists("ipam_ip_range.test_range"),
				),
			},
		},
	})
}

func testAccIpRangeResource(range_size string) string {
	return fmt.Sprintf(`
	terraform {
	resource "ipam_ip_range" "test_range" {
		range_size = "%s"
	}
	`, range_size)
}

func testAccIpRangeExists(n string) resource.TestCheckFunc {
	return func(s *terraform.State) error {
		_, ok := s.RootModule().Resources[n]
		if !ok {
			return fmt.Errorf("Can't find Range: %s", n)
		}

		return nil
	}
}
