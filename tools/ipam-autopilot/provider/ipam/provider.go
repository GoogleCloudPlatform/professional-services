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
	"os"

	"github.com/GoogleCloudPlatform/professional-services/terraform-provider-ipam-autopilot/ipam/config"
	"github.com/GoogleCloudPlatform/professional-services/terraform-provider-ipam-autopilot/ipam/resources"

	"github.com/hashicorp/terraform-plugin-sdk/v2/helper/schema"
)

// Provider for Simple IPAM
func Provider() *schema.Provider {
	return &schema.Provider{
		Schema: map[string]*schema.Schema{
			"url": {
				Type:        schema.TypeString,
				Optional:    true,
				Default:     "",
				Description: "URL where to connect with the IPAM Autopilot backend",
			},
		},
		ResourcesMap: map[string]*schema.Resource{
			"ipam_ip_range":       resources.ResourceIpRange(),
			"ipam_routing_domain": resources.ResourceRoutingDomain(),
		},
		DataSourcesMap: map[string]*schema.Resource{},
		ConfigureFunc:  providerConfigure,
	}
}

func providerConfigure(d *schema.ResourceData) (interface{}, error) {
	url := d.Get("url").(string)
	if url == "" {
		url = os.Getenv("IPAM_URL")
	}

	if url == "" {
		return nil, fmt.Errorf("URL needed to access IPAM Autopilot")
	}

	config := config.Config{
		Url: url,
	}

	return config, nil
}
