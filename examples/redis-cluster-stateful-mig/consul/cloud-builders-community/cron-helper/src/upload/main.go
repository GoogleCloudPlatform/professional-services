package main

import (
	"fmt"
	"io/ioutil"

	"cloud.google.com/go/datastore"
	"golang.org/x/net/context"
)

// YAMLWrapper stores build info.  Cannot store cloudbuild.Build directly.
type YAMLWrapper struct {
	Value string
}

func main() {
	ctx := context.Background()

	// Set environment variable DATASTORE_PROJECT_ID.
	dsClient, err := datastore.NewClient(ctx, "")
	if err != nil {
		panic(fmt.Sprintf("Cannot initialize Datastore: %q", err))
	}

	// Load cloudbuild.yaml and save to Datastore.
	k := datastore.NameKey("YAMLWrapper", "ID", nil)
	y := new(YAMLWrapper)
	dat, err := ioutil.ReadFile("cloudbuild.yaml")
	if err != nil {
		panic(fmt.Sprintf("Cannot load cloudbuild.yaml: %q", err))
	}
	y.Value = string(dat)
	if _, err := dsClient.Put(ctx, k, y); err != nil {
		panic(fmt.Sprintf("Error persisting to Datastore: %q", err))
	}

	fmt.Printf("Uploaded YAML to Datastore successfully\n")
}
