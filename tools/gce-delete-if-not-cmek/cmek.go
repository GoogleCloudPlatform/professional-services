// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
package cmek

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"time"

	"cloud.google.com/go/pubsub"
	"google.golang.org/api/compute/v1"
)

type creationEvent struct {
	Resource struct {
		Labels struct {
			InstanceID string `json:"instance_id"`
			ProjectID  string `json:"project_id"`
			Zone       string `json:"zone"`
		} `json:"labels"`
	} `json:"resource"`
}

var computeService *compute.Service

func init() {
	var err error

	computeService, err = compute.NewService(context.Background())
	if err != nil {
		log.Fatalf("Could not create compute service: %v\n", err)
	}
}

func RecieveMessage(ctx context.Context, msg *pubsub.Message) error {
	var event creationEvent
	json.Unmarshal([]byte(msg.Data), &event)
	labels := event.Resource.Labels
	fmt.Printf("Checking to see if VM instance has unencrypted disks %v\n", labels)
	encrypted, err := isEncrypted(labels.ProjectID, labels.Zone, labels.InstanceID)
	if err != nil {
		fmt.Printf("Error while trying to determine if VM is encrypted. Error: %v\n", err)
		return err
	}
	if !encrypted {
		fmt.Printf("Found VM instance with unencrypted disk %v\n", labels)
		fmt.Printf("Deleting VM instance %v\n", labels)
		err = deleteVM(labels.ProjectID, labels.Zone, labels.InstanceID)
		if err != nil {
			fmt.Printf("Error while trying to delete vm instance. Error: %v\n", err)
			return err
		}
		fmt.Printf("Successfully deleted VM instance %v\n", labels)
	} else {
		fmt.Printf("No unencrypted disks found on VM instance %v\n", labels)
	}
	return nil
}

func deleteVM(projectID string, zoneID string, instanceID string) error {
	operation, err := computeService.Instances.Delete(projectID, zoneID, instanceID).Do()
	if err != nil {
		return err
	}
	err = waitForOperation(computeService, projectID, zoneID, operation)
	return err
}

func waitForOperation(computeService *compute.Service, projectID string, zoneID string, operation *compute.Operation) error {
	for {
		operation, err := computeService.ZoneOperations.Get(projectID, zoneID, operation.Name).Do()
		if err != nil {
			return err
		}

		if operation.Status != "DONE" {
			time.Sleep(2 * time.Second)
		} else {
			if operation.Error != nil {
				fmt.Printf("%v", operation.Error)
				return errors.New("Operation error")
			}
			return nil
		}
	}
	return nil
}

func isEncrypted(projectID string, zoneID string, instanceID string) (bool, error) {
	ctx := context.Background()
	computeService, err := compute.NewService(ctx)
	if err != nil {
		return true, err
	}

	instance, err := computeService.Instances.Get(projectID, zoneID, instanceID).Do()
	if err != nil {
		return true, err
	}

	for _, disk := range instance.Disks {
		if disk.DiskEncryptionKey == nil {
			return false, nil
		}
	}

	return true, nil
}
