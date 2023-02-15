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

package restarter

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"cloud.google.com/go/pubsub"
	compute "google.golang.org/api/compute/v1"
)

type InstanceRestarter struct {
	ctx context.Context
	m   pubsub.Message
}

// NewInstanceRestarter creates new InstanceRestarter
func NewInstanceRestarter(context context.Context, message pubsub.Message) *InstanceRestarter {
	return &InstanceRestarter{
		ctx: context,
		m:   message,
	}
}

// RestartInstance consumes a Pub/Sub message with an instance metadata and resets the instance.
func RestartInstance(ctx context.Context, m pubsub.Message) error {
	return NewInstanceRestarter(ctx, m).restart()
}

// restartInstance sends a reset instance request to the Compute Engine API and waits for it to complete.
func (r *InstanceRestarter) restart() error {
	var instance compute.Instance

	computeService, err := compute.NewService(r.ctx)
	if err != nil {
		fmt.Errorf("NewInstancesRESTClient: %v", err)
		return err
	}

	err = json.Unmarshal(r.m.Data, &instance)
	if err != nil {
		fmt.Errorf("JsonUnmarshalInstance: %v", err)
		return err
	}

	zone := instance.Zone[strings.LastIndex(instance.Zone, "/")+1:]
	project := strings.Split(instance.SelfLink, "/")[6]

	_, err = computeService.Instances.Reset(project, zone, instance.Name).Do()
	if err != nil {
		fmt.Errorf("ResetInstanceRequest: %v:", err)
		return err
	}

	fmt.Printf("Instance %s has been reset.", instance.Name)

	return nil
}
