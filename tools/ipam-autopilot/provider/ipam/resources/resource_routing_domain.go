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

package resources

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"

	"github.com/GoogleCloudPlatform/professional-services/terraform-provider-ipam-autopilot/ipam/config"
	"github.com/hashicorp/terraform-plugin-sdk/v2/helper/schema"
)

func ResourceRoutingDomain() *schema.Resource {
	return &schema.Resource{
		Create: routingDomainCreate,
		Read:   routingDomainRead,
		Update: routingDomainUpdate,
		Delete: routingDomainDelete,

		Schema: map[string]*schema.Schema{
			"name": {
				Type:     schema.TypeString,
				Required: true,
				ForceNew: false,
			},
			"vpcs": {
				Type: schema.TypeList,
				Elem: &schema.Schema{
					Type: schema.TypeString,
				},
				Required: false,
				ForceNew: false,
				Optional: true,
			},
		},
	}
}

func routingDomainCreate(d *schema.ResourceData, meta interface{}) error {
	config := meta.(config.Config)
	vpcs := d.Get("vpcs").([]interface{})
	name := d.Get("name").(string)
	url := fmt.Sprintf("%s/domains", config.Url)
	var postBody []byte
	var err error
	postBody, err = json.Marshal(map[string]interface{}{
		"name": name,
		"vpcs": vpcs,
	})
	if err != nil {
		return fmt.Errorf("failed marshalling json: %v", err)
	}
	fmt.Printf("%s", string(postBody))
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
	req.Header.Set("Content-Type", "application/json")
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
		d.Set("name", name)
		d.Set("vpcs", vpcs)
		return nil
	} else {
		body, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			return fmt.Errorf("failed creating routing domain status_code=%d, status=%s", resp.StatusCode, resp.Status)
		}

		return fmt.Errorf("failed creating routing domain status_code=%d, status=%s,body=%s", resp.StatusCode, resp.Status, string(body))
	}
}

func routingDomainRead(d *schema.ResourceData, meta interface{}) error {
	config := meta.(config.Config)
	url := fmt.Sprintf("%s/domains/%s", config.Url, d.Id())

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
		d.Set("name", response["name"].(string))
		if response["vpcs"].(string) != "" {
			d.Set("vpcs", strings.Split(response["vpcs"].(string), ","))
		} else {
			d.Set("vpcs", []string{})
		}

		return nil
	} else {
		body, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			return fmt.Errorf("failed reading range status_code=%d, status=%s", resp.StatusCode, resp.Status)
		}

		return fmt.Errorf("failed reading range status_code=%d, status=%s,body=%s", resp.StatusCode, resp.Status, string(body))
	}
}

func routingDomainDelete(d *schema.ResourceData, meta interface{}) error {
	config := meta.(config.Config)

	url := fmt.Sprintf("%s/domains/%s", config.Url, d.Id())

	client := &http.Client{}
	req, err := http.NewRequest("DELETE", url, nil)
	if err != nil {
		return fmt.Errorf("failed deleting routing domain request: %v", err)
	}
	accessToken, err := getIdentityToken()
	if err != nil {
		return fmt.Errorf("unable to retrieve access token: %v", err)
	}
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", accessToken))
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed deleting routing domains: %v", err)
	}
	if resp.StatusCode == 200 {
		return nil
	} else {
		body, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			return fmt.Errorf("failed deleting routing domain status_code=%d, status=%s", resp.StatusCode, resp.Status)
		}

		return fmt.Errorf("failed deleting routing domain status_code=%d, status=%s,body=%s", resp.StatusCode, resp.Status, string(body))
	}
}

func routingDomainUpdate(d *schema.ResourceData, meta interface{}) error {
	config := meta.(config.Config)
	vpcs := d.Get("vpcs").([]interface{})
	name := d.Get("name").(string)
	url := fmt.Sprintf("%s/domains/%s", config.Url, d.Id())
	var postBody []byte
	var err error
	postBody, err = json.Marshal(map[string]interface{}{
		"name": name,
		"vpcs": vpcs,
	})
	if err != nil {
		return fmt.Errorf("failed marshalling json: %v", err)
	}
	fmt.Printf("%s", string(postBody))
	responseBody := bytes.NewBuffer(postBody)
	accessToken, err := getIdentityToken()
	if err != nil {
		return fmt.Errorf("unable to retrieve access token: %v", err)
	}
	req, err := http.NewRequest("PUT", url, responseBody)
	if err != nil {
		return fmt.Errorf("failed creating request: %v", err)
	}
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", accessToken))
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed creating range: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode == 200 {
		/*body, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			return fmt.Errorf("unable to read response: %v", err)
		}
		response := map[string]interface{}{}
		err = json.Unmarshal(body, &response)
		if err != nil {
			return fmt.Errorf("unable to unmarshal response body: %v", err)
		}*/
		//d.SetId(fmt.Sprintf("%d", int(response["id"].(float64))))
		d.Set("name", name)
		d.Set("vpcs", vpcs)
		return nil
	} else {
		body, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			return fmt.Errorf("failed creating routing domain status_code=%d, status=%s", resp.StatusCode, resp.Status)
		}

		return fmt.Errorf("failed creating routing domain status_code=%d, status=%s,body=%s", resp.StatusCode, resp.Status, string(body))
	}
}
