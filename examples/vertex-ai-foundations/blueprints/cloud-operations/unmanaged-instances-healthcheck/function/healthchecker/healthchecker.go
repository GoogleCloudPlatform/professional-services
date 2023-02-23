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

package healthchecker

import (
	"context"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"sync"
	"time"

	pubsub "cloud.google.com/go/pubsub"
	compute "google.golang.org/api/compute/v1"
)

// HealthChecker
type HealthChecker struct {
	ctx            context.Context
	config         *Configuration
	computeService *compute.Service
	pubsubTopic    *pubsub.Topic
}

// NewHealthChecker creates new HealthChecker
func NewHealthChecker(context context.Context, config *Configuration, computeService *compute.Service, pubsubTopic *pubsub.Topic) *HealthChecker {
	return &HealthChecker{
		ctx:            context,
		config:         config,
		computeService: computeService,
		pubsubTopic:    pubsubTopic,
	}
}

// checkTcpPort returns nil when TCP port is open or error when connection failed.
func checkTcpPort(ip string, port int, timeout time.Duration) error {
	target := fmt.Sprintf("%s:%d", ip, port)

	conn, err := net.DialTimeout("tcp", target, timeout)
	if err != nil {
		return err
	}
	defer conn.Close()

	return nil
}

// Start - Start Healthchecker
func (hc *HealthChecker) Start() error {

	wg := sync.WaitGroup{}

	// Limit max parallel goroutines to prevent exhausting socket connections limit
	guard := make(chan struct{}, hc.config.max_parallelism)

	instances, err := hc.getInstances()
	if err != nil {
		fmt.Printf("GettingInstances: %v", err)
		return err
	}

	for _, instance := range instances {
		guard <- struct{}{}
		wg.Add(1)
		go func(instance compute.Instance) {
			defer wg.Done()
			ip := instance.NetworkInterfaces[0].NetworkIP
			err := checkTcpPort(ip, hc.config.port, hc.config.timeout)
			if err != nil {
				fmt.Printf("Instance %s is not responding, will recheck.\n", instance.Name)
				time.Sleep(hc.config.recheck_interval)

				err := checkTcpPort(ip, hc.config.port, hc.config.timeout)
				if err != nil {
					fmt.Printf("Healthcheck failed for instance %s\n", instance.Name)

					err = hc.sendRestartTask(instance)

					if err != nil {
						fmt.Printf("SendRecreateMessage %v:", err)
						return
					}

					fmt.Printf("Instance restart task has been sent for instance %s\n", instance.Name)
				}
			}
			<-guard
		}(instance)
		wg.Wait()
	}

	return nil
}

// sendRestartTask sends a PubSub message with compute instance metadata as message data.
func (hc *HealthChecker) sendRestartTask(instance compute.Instance) error {

	instanceData, err := json.Marshal(instance)
	if err != nil {
		fmt.Printf("MarshalInstanceObject: %v", err)
		return err
	}

	message := &pubsub.Message{
		Data:       instanceData,
		Attributes: map[string]string{},
	}

	id, err := hc.pubsubTopic.Publish(hc.ctx, message).Get(hc.ctx)
	if err != nil {
		fmt.Printf("PublishPubsubMessage: %v", err)
		return err
	}

	fmt.Printf("Restart message published with id=%s\n", id)

	return nil
}

// getInstances returns list of Compute Engine Instances based on hc configuration.
func (hc *HealthChecker) getInstances() ([]compute.Instance, error) {
	var result []compute.Instance

	instanceAggregatedList, err := hc.computeService.Instances.AggregatedList(hc.config.project).Filter(hc.config.filter).Context(hc.ctx).Do()
	if err != nil {
		fmt.Printf("Instances.AggregatedList(%s) got error: %v", hc.config.project, err)
	}

	for _, instanceList := range instanceAggregatedList.Items {
		for _, instance := range instanceList.Instances {
			instanceStartTimestamp, _ := time.Parse(time.RFC3339, instance.LastStartTimestamp)
			if instanceStartTimestamp.Before(time.Now().Add(-hc.config.grace_period)) {
				result = append(result, *instance)
			}
		}
	}
	fmt.Printf("%d  instances found to be health checked.\n", len(result))

	return result, nil
}

//HealthCheck is an HTTP Cloud function handler to to execute compute instances TCP healthcheck.
func HealthCheck(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	config, err := GetConfiguration()
	if err != nil {
		http.Error(w, "Error reading configuration.", http.StatusInternalServerError)
		fmt.Printf("GettingConfiguration: %v", err)
	}

	pubsubClient, err := pubsub.NewClient(ctx, config.project)
	if err != nil {
		http.Error(w, "Error setting up PubSub client.", http.StatusInternalServerError)
		fmt.Printf("PubsubClient: %v", err)

	}
	pubsubTopic := pubsubClient.Topic(config.pubsub_topic)

	computeService, err := compute.NewService(ctx)
	if err != nil {
		http.Error(w, "Error setting up Compute service.", http.StatusInternalServerError)
		fmt.Printf("CreateComputeService: %v", err)
	}

	NewHealthChecker(ctx, config, computeService, pubsubTopic).Start()
}
