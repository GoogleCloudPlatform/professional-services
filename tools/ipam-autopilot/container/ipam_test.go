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
	"fmt"
	"log"
	"net"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestRangeCreationWithEmptyExisting(t *testing.T) {
	subnet, subnet_zeros, err := findNextSubnet(20, "10.0.0.0/8", []Range{})

	assert.Nil(t, err)
	_, network, _ := net.ParseCIDR("10.0.0.0/20")
	assert.Equal(t, network, subnet)
	assert.Equal(t, 20, subnet_zeros)
}

func TestRangeCreationWithExisting1(t *testing.T) {
	existingRanges := []Range{
		Range{
			Cidr: "10.0.0.0/20",
		},
	}
	subnet, subnet_ones, err := findNextSubnet(22, "10.0.0.0/8", existingRanges)

	log.Printf("new subnet lease %s/%d", subnet.IP.String(), subnet_ones)
	assert.Nil(t, err)
	_, network, _ := net.ParseCIDR("10.0.16.0/22")
	assert.Equal(t, network, subnet)
	assert.Equal(t, 22, subnet_ones)
}

func TestRangeCreationWithExisting2(t *testing.T) {
	existingRanges := []Range{
		Range{
			Cidr: "10.0.0.0/20",
		},
		Range{
			Cidr: "10.0.16.0/22",
		},
	}
	subnet, subnet_ones, err := findNextSubnet(22, "10.0.0.0/8", existingRanges)

	log.Printf("new subnet lease %s/%d", subnet.IP.String(), subnet_ones)
	assert.Nil(t, err)
	_, network, _ := net.ParseCIDR("10.0.20.0/22")
	assert.Equal(t, network, subnet)
	assert.Equal(t, 22, subnet_ones)
}

func TestRangeCreationWithExisting3(t *testing.T) {
	existingRanges := []Range{
		Range{
			Cidr: "10.0.0.0/22",
		},
		Range{
			Cidr: "10.0.4.0/22",
		},
	}
	subnet, subnet_ones, err := findNextSubnet(24, "10.0.0.0/8", existingRanges)

	log.Printf("new subnet lease %s/%d", subnet.IP.String(), subnet_ones)
	assert.Nil(t, err)
	_, network, _ := net.ParseCIDR("10.0.8.0/24")
	assert.Equal(t, network, subnet)
	assert.Equal(t, 24, subnet_ones)
}

func TestRangeCreationWithExisting4(t *testing.T) {
	existingRanges := []Range{
		Range{
			Cidr: "10.128.0.0/20",
		},
	}
	_, _, err := findNextSubnet(22, "10.128.0.0/20", existingRanges)

	assert.NotNil(t, err)
	assert.Equal(t, err, fmt.Errorf("no_address_range_available_in_parent"))
}

func TestRangeCreationWithExisting5(t *testing.T) {
	existingRanges := []Range{
		Range{
			Cidr: "10.0.0.0/22",
		},
		Range{
			Cidr: "10.0.4.0/22",
		},
		Range{
			Cidr: "10.0.4.0/22",
		},
	}
	subnet, subnet_ones, err := findNextSubnet(24, "10.0.0.0/8", existingRanges)

	log.Printf("new subnet lease %s/%d", subnet.IP.String(), subnet_ones)
	assert.Nil(t, err)
	_, network, _ := net.ParseCIDR("10.0.8.0/24")
	assert.Equal(t, network, subnet)
	assert.Equal(t, 24, subnet_ones)
}
