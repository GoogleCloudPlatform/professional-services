/*
Copyright 2020-2022 Google LLC

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
package main

import (
	"bufio"
	"context"
	"embed"
	"encoding/hex"
	"fmt"
	"os"
	"runtime"
	"sync"

	"cloud.google.com/go/storage"
	"google.golang.org/api/cloudresourcemanager/v1"
	"google.golang.org/api/iterator"
	"google.golang.org/api/option"

	"flag"

	"github.com/golang/glog"
	"gopkg.in/avro.v0"

	_ "embed"
)

var (
	outputFile      *string
	includeVersions *bool
	VERSION         string = "0.2.0"
	BUFFER_SIZE     *int
	GOMAXPROCS      *int
	EXIT_STATUS     int = 0
	AVRO_SCHEMA     *string
	USER_AGENT      string = "google-pso-tool/gcs2bq/0.2.0"

	//go:embed gcs2bq.avsc
	f embed.FS
)

type GcsFile struct {
	ProjectId  string
	BucketName string
	Object     storage.ObjectAttrs
}

type AvroAcl struct {
	Entity            string `avro:"entity"`
	EntityID          string `avro:"entity_id"`
	Role              string `avro:"role"`
	Domain            string `avro:"domain"`
	Email             string `avro:"email"`
	TeamProjectNumber string `avro:"team_project_number"`
	TeamProjectTeam   string `avro:"team_project_team"`
}

type AvroFile struct {
	ProjectId               string              `avro:"project_id"`
	Bucket                  string              `avro:"bucket"`
	Name                    string              `avro:"name"`
	ContentType             string              `avro:"content_type"`
	ContentLanguage         string              `avro:"content_language"`
	CacheControl            string              `avro:"cache_control"`
	EventBasedHold          bool                `avro:"event_based_hold"`
	TemporaryHold           bool                `avro:"temporary_hold"`
	RetentionExpirationTime int64               `avro:"retention_expiration_time"`
	ACL                     []map[string]string `avro:"acl"`
	PredefinedACL           string              `avro:"predefined_acl"`
	Owner                   string              `avro:"owner"`
	Size                    int64               `avro:"size"`
	ContentEncoding         string              `avro:"content_encoding"`
	ContentDisposition      string              `avro:"content_disposition"`
	MD5                     string              `avro:"md5"`
	CRC32C                  int32               `avro:"crc32c"`
	MediaLink               string              `avro:"media_link"`
	//Metadata           map[string]string `avro:"metadata"`
	Generation        int64  `avro:"generation"`
	Metageneration    int64  `avro:"metageneration"`
	StorageClass      string `avro:"storage_class"`
	Created           int64  `avro:"created"`
	Deleted           int64  `avro:"deleted"`
	Updated           int64  `avro:"updated"`
	CustomerKeySHA256 string `avro:"customer_key_sha256"`
	KMSKeyName        string `avro:"kms_key_name"`
	Etag              string `avro:"etag"`
}

func objectToAvro(ProjectId string, file storage.ObjectAttrs) (*AvroFile, error) {

	avroFile := new(AvroFile)
	avroFile.ProjectId = ProjectId
	avroFile.Bucket = file.Bucket
	avroFile.Name = file.Name
	avroFile.ContentType = file.ContentType
	avroFile.ContentLanguage = file.ContentLanguage

	avroFile.CacheControl = file.CacheControl
	avroFile.EventBasedHold = file.EventBasedHold
	avroFile.TemporaryHold = file.TemporaryHold
	avroFile.RetentionExpirationTime = file.RetentionExpirationTime.UnixNano() / 1000000

	ACLs := make([]map[string]string, 0)
	for _, acl := range file.ACL {
		_acl := make(map[string]string)
		_acl["entity"] = string(acl.Entity)
		_acl["entity_id"] = acl.EntityID
		_acl["role"] = string(acl.Role)
		_acl["domain"] = acl.Domain
		_acl["email"] = acl.Email
		if acl.ProjectTeam != nil {
			_acl["team_project_number"] = acl.ProjectTeam.ProjectNumber
			_acl["team_project_team"] = acl.ProjectTeam.Team
		}
		ACLs = append(ACLs, _acl)
	}
	avroFile.ACL = ACLs

	avroFile.PredefinedACL = file.PredefinedACL
	avroFile.Owner = file.Owner
	avroFile.Size = file.Size
	avroFile.MD5 = hex.EncodeToString(file.MD5)
	avroFile.CRC32C = int32(file.CRC32C)
	avroFile.MediaLink = file.MediaLink
	// Metadata is not returned with the query
	//avroFile.Metadata = file.Metadata
	avroFile.Generation = file.Generation
	avroFile.Metageneration = file.Metageneration
	avroFile.StorageClass = file.StorageClass
	if !file.Created.IsZero() {
		avroFile.Created = file.Created.UnixNano() / 1000
	} else {
		avroFile.Created = 0
	}
	if !file.Deleted.IsZero() {
		avroFile.Deleted = file.Deleted.UnixNano() / 1000
	} else {
		avroFile.Deleted = 0
	}
	if !file.Updated.IsZero() {
		avroFile.Updated = file.Updated.UnixNano() / 1000
	} else {
		avroFile.Updated = 0
	}
	avroFile.CustomerKeySHA256 = file.CustomerKeySHA256
	avroFile.KMSKeyName = file.KMSKeyName
	avroFile.Etag = file.Etag
	return avroFile, nil
}

func processProject(wg *sync.WaitGroup, ctx *context.Context, objectCh chan GcsFile, project cloudresourcemanager.Project) {
	defer wg.Done()

	glog.Warningf("Processing project %s.", project.ProjectId)

	client, err := storage.NewClient(*ctx, option.WithUserAgent(USER_AGENT))
	if err != nil {
		panic(err)
	}

	buckets := client.Buckets(*ctx, project.ProjectId)

	for bucketAttrs, err := buckets.Next(); err != iterator.Done; bucketAttrs, err = buckets.Next() {
		if err != nil {
			glog.Errorf("Failed to list buckets in project %s: %s", project.ProjectId, err.Error())
			EXIT_STATUS = 2
			break
		}
		bucket := client.Bucket(bucketAttrs.Name)
		var query *storage.Query = nil
		if *includeVersions {
			query = &storage.Query{Versions: true}
		}
		objects := bucket.Objects(*ctx, query)
		for objectAttrs, err := objects.Next(); err != iterator.Done; objectAttrs, err = objects.Next() {
			if err != nil {
				glog.Errorf("Error processing files in bucket %s (project %s): %s", bucketAttrs.Name, project.ProjectId, err.Error())
				EXIT_STATUS = 3
				break
			}
			glog.Infof("Processing file %s (bucket %s, project %s).", objectAttrs.Name, bucketAttrs.Name, project.ProjectId)
			item := GcsFile{ProjectId: project.ProjectId, BucketName: bucketAttrs.Name, Object: *objectAttrs}
			objectCh <- item
		}
	}
}

func main() {
	os.Stderr.WriteString(fmt.Sprintf("Google Cloud Storage object metadata to BigQuery, version %s\n", VERSION))

	outputFile = flag.String("file", "gcs.avro", "output file name")
	includeVersions = flag.Bool("versions", false, "include GCS object versions")
	GOMAXPROCS = flag.Int("concurrency", 4, "concurrency (GOMAXPROCS)")
	BUFFER_SIZE = flag.Int("buffer_size", 1000, "file buffer")
	AVRO_SCHEMA = flag.String("avro_schema", "embedded", "Avro schema (default: use embedded)")
	flag.Set("logtostderr", "true")
	flag.Parse()

	glog.Infof("Performance settings: GOMAXPROCS=%d, buffer size=%d", *GOMAXPROCS, *BUFFER_SIZE)
	runtime.GOMAXPROCS(*GOMAXPROCS)
	ctx := context.Background()

	crmService, err := cloudresourcemanager.NewService(ctx, option.WithUserAgent(USER_AGENT))
	if err != nil {
		panic(err)
	}

	glog.Warning("Retrieving a list of all projects...")
	projectsService := crmService.Projects
	projectsList := make([]cloudresourcemanager.Project, 0)
	pageToken := ""
	for {
		response, err := projectsService.List().Filter("lifecycleState:ACTIVE").PageToken(pageToken).Do()
		if err != nil {
			panic(err)
		}

		for _, project := range response.Projects {
			glog.Infof("Found project: %s (%d)", project.ProjectId, project.ProjectNumber)
			projectsList = append(projectsList, *project)
		}

		pageToken = response.NextPageToken
		if pageToken == "" {
			break
		}
	}

	var wg sync.WaitGroup

	objectCh := make(chan GcsFile, *BUFFER_SIZE)
	wg.Add(1)
	go func() {
		defer wg.Done()

		var wgProject sync.WaitGroup
		wgProject.Add(len(projectsList))
		for _, project := range projectsList {
			go processProject(&wgProject, &ctx, objectCh, project)
		}
		wgProject.Wait()
		close(objectCh)
	}()

	var schema avro.Schema
	if (*AVRO_SCHEMA) != "embedded" {
		_, err = os.Stat(*AVRO_SCHEMA)
		if os.IsNotExist(err) {
			glog.Fatalf("Could not read Avro schema file: %s", *AVRO_SCHEMA)
			os.Exit(1)
		}

		glog.Infof("Using custom Avro schema: %s", *AVRO_SCHEMA)
		schema, err = avro.ParseSchemaFile(*AVRO_SCHEMA)
		if err != nil {
			panic(err)
		}
	} else {
		glog.Infof("Using embedded Avro schema")
		schemaData, _ := f.ReadFile("gcs2bq.avsc")
		schema, err = avro.ParseSchema(string(schemaData))
		if err != nil {
			panic(err)
		}
	}

	writer := avro.NewSpecificDatumWriter()
	writer.SetSchema(schema)

	f, err := os.Create(*outputFile)
	if err != nil {
		panic(err)
	}
	defer f.Close()

	w := bufio.NewWriter(f)
	dfw, err := avro.NewDataFileWriter(w, schema, writer)
	if err != nil {
		panic(err)
	}

	wg.Add(1)
	go func() {
		defer wg.Done()
		for i := range objectCh {
			avroObject, err := objectToAvro(i.ProjectId, i.Object)
			if err == nil {
				err = dfw.Write(avroObject)
				if err != nil {
					panic(err)
				}
				dfw.Flush()
			}
		}
	}()
	wg.Wait()

	w.Flush()
	dfw.Close()
	f.Sync()
	glog.Warningf("Processing complete, output in: %s", *outputFile)
	os.Exit(EXIT_STATUS)
}
