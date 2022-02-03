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
