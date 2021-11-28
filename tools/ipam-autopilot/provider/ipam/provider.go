package ipam

import (
	"fmt"
	"os"

	"github.com/cgrotz/terraform-provider-ipam/ipam/config"
	"github.com/cgrotz/terraform-provider-ipam/ipam/resources"

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
				Description: "URL where to connect with the simple IPAM backend",
			},
		},
		ResourcesMap: map[string]*schema.Resource{
			"ipam_ip_range": resources.ResourceIpRange(),
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
		return nil, fmt.Errorf("URL needed to access Simple IPAM")
	}

	config := config.Config{
		Url: url,
	}

	return config, nil
}
