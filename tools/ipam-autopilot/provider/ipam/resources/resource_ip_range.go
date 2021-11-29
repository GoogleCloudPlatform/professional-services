package resources

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"

	"github.com/cgrotz/terraform-provider-ipam/ipam/config"
	"github.com/hashicorp/terraform-plugin-sdk/v2/helper/schema"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/idtoken"
)

func ResourceIpRange() *schema.Resource {
	return &schema.Resource{
		Create: resourceCreate,
		Read:   resourceRead,
		//Update: resourceUpdate,
		Delete: resourceDelete,

		Schema: map[string]*schema.Schema{
			"name": {
				Type:     schema.TypeString,
				Required: true,
				ForceNew: true,
			},
			"range_size": {
				Type:     schema.TypeInt,
				Required: true,
				ForceNew: true,
			},
			"parent": {
				Type:     schema.TypeString,
				Optional: true,
				ForceNew: true,
			},
			"cidr": {
				Type:     schema.TypeString,
				Optional: false,
				Computed: true,
			},
		},
	}
}
func resourceCreate(d *schema.ResourceData, meta interface{}) error {
	config := meta.(config.Config)
	range_size := d.Get("range_size").(int)
	parent := d.Get("parent").(string)
	name := d.Get("name").(string)
	url := fmt.Sprintf("%s/ranges", config.Url)

	postBody, _ := json.Marshal(map[string]interface{}{
		"range_size": range_size,
		"name":       name,
		"parent":     parent,
	})
	responseBody := bytes.NewBuffer(postBody)
	accessToken, err := getIdentityToken()
	if err != nil {
		return fmt.Errorf("unable to retrieve access token: %v", err)
	}
	req, err := http.NewRequest("POST", url, responseBody)
	if err != nil {
		return fmt.Errorf("failed creating request: %v", err)
	}
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", accessToken))
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed creating range: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode == 200 {
		body, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			return fmt.Errorf("unable to read response: %v", err)
		}
		response := map[string]interface{}{}
		err = json.Unmarshal(body, &response)
		if err != nil {
			return fmt.Errorf("unable to unmarshal response body: %v", err)
		}
		d.SetId(fmt.Sprintf("%d", int(response["id"].(float64))))
		d.Set("cidr", response["cidr"].(string))
		return nil
	} else {
		return fmt.Errorf("failed creating range status_code=%d", resp.StatusCode)
	}
}

func resourceRead(d *schema.ResourceData, meta interface{}) error {
	config := meta.(config.Config)
	url := fmt.Sprintf("%s/ranges/%s", config.Url, d.Id())

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return fmt.Errorf("failed creating request: %v", err)
	}
	accessToken, err := getIdentityToken()
	if err != nil {
		return fmt.Errorf("unable to retrieve access token: %v", err)
	}
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", accessToken))
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed querying range: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode == 200 {
		body, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			return fmt.Errorf("unable to read response: %v", err)
		}
		response := map[string]interface{}{}
		err = json.Unmarshal(body, &response)
		if err != nil {
			return fmt.Errorf("unable to unmarshal response body: %v", err)
		}
		d.SetId(fmt.Sprintf("%d", int(response["id"].(float64))))
		d.Set("cidr", response["cidr"].(string))
		return nil
	} else {
		return fmt.Errorf("failed querying range status_code=%d url=%s", resp.StatusCode, url)
	}
}

func resourceDelete(d *schema.ResourceData, meta interface{}) error {
	config := meta.(config.Config)

	url := fmt.Sprintf("%s/ranges/%s", config.Url, d.Id())

	client := &http.Client{}
	req, err := http.NewRequest("DELETE", url, nil)
	if err != nil {
		return fmt.Errorf("failed creating release request: %v", err)
	}
	accessToken, err := getIdentityToken()
	if err != nil {
		return fmt.Errorf("unable to retrieve access token: %v", err)
	}
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", accessToken))
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed releasing range: %v", err)
	}
	if resp.StatusCode == 200 {
		return nil
	} else {
		return fmt.Errorf("failed releasing range status_code=%d", resp.StatusCode)
	}
}

func getIdentityToken() (string, error) {
	ctx := context.Background()
	audience := "http://example.com"
	ts, err := idtoken.NewTokenSource(ctx, audience)
	if err != nil {
		if err.Error() != `idtoken: credential must be service_account, found "authorized_user"` {
			return "", err
		}
		gts, err := google.DefaultTokenSource(ctx)
		if err != nil {
			return "", err
		}
		token, err := gts.Token()
		if err != nil {
			return "", err
		}
		identityToken := token.Extra("id_token").(string)
		return identityToken, nil
	}
	token, err := ts.Token()
	if err != nil {
		return "", err
	}
	return token.AccessToken, nil
}