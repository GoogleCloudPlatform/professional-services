/*
Copyright 2020 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package gcshandler

import (
	"context"
	"fmt"
	"log"

	"cloud.google.com/go/storage"
	util "github.com/GoogleCloudPlatform/bqman/util"
	"google.golang.org/api/iterator"
)

// CloudStorageHandler is used to interact with Google Cloud Storage
type CloudStorageHandler struct {
	Ctx       context.Context
	Client    *storage.Client
	ProjectID string
	GcsBucket string
	GcsPath   string
}

// NewCloudStorageHandler returns a new instance of CloudStorageHandler
func NewCloudStorageHandler(ctx context.Context, bucket string) *CloudStorageHandler {
	var err error
	gcsHandler := new(CloudStorageHandler)
	gcsHandler.Ctx = ctx
	gcsHandler.Client, err = storage.NewClient(ctx)
	gcsHandler.GcsBucket = bucket
	util.CheckError(err, "Unable to create Cloud Storage service!")
	return gcsHandler
}

// GetObjects returns list of objects from a GCS bucket
func (gh *CloudStorageHandler) GetObjects(prefix, delim string) []string {
	log.Printf("GetObjects(%s, %s,%s) executing", gh.GcsBucket, prefix, delim)
	query := &storage.Query{
		Prefix: prefix,
		//Delimiter: delim,
	}
	//query = nil
	it := gh.Client.Bucket(gh.GcsBucket).Objects(gh.Ctx, query)
	items := make([]string, 0)
	for {
		attrs, err := it.Next()
		if err == iterator.Done {
			break
		}
		util.CheckError(err, "GhHandler.GetObjects()")
		items = append(items, attrs.Name)
		fmt.Printf("gcsObject: %s\n", attrs.Name)
	}
	log.Printf("GetObjects() completed")
	return items
}
