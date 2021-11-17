package ipam

import (
	"fmt"
	"os"

	"github.com/cgrotz/terraform-provider-simple-ipam/ipam/config"
	"github.com/cgrotz/terraform-provider-simple-ipam/ipam/resources"

	"github.com/hashicorp/terraform-plugin-sdk/v2/helper/schema"
)

// Provider for Simple IPAM
func Provider() *schema.Provider {
	return &schema.Provider{
		Schema: map[string]*schema.Schema{
			"api_key": {
				Type:        schema.TypeString,
				Optional:    true,
				Default:     "",
				Description: "Apikey for accessing the API",
			},
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
	apiKey := d.Get("api_key").(string)
	if apiKey == "" {
		apiKey = os.Getenv("IPAM_API_KEY")
	}

	if apiKey == "" {
		return nil, fmt.Errorf("Api key needed to access Simple IPAM")
	}

	url := d.Get("url").(string)
	if url == "" {
		url = os.Getenv("IPAM_URL")
	}

	if url == "" {
		return nil, fmt.Errorf("URL needed to access Simple IPAM")
	}

	config := config.Config{
		ApiKey: apiKey,
		Url:    url,
	}

	return config, nil
}
