// Copyright 2024 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//	http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
package dlpfunction

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"slices"
	"strings"
	"sync"
	"time"

	"github.com/GoogleCloudPlatform/functions-framework-go/functions"
	"google.golang.org/api/option"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
	"go.mongodb.org/mongo-driver/v2/mongo/readpref"

	dlp "cloud.google.com/go/dlp/apiv2"
	"cloud.google.com/go/dlp/apiv2/dlppb"
	"cloud.google.com/go/storage"

	"github.com/rs/zerolog/log"

	gocache "github.com/TwiN/gocache/v2"
)

type MongoSource struct {
	Collection string `json:"collection"`
	Database   string `json:"database"`
	Deployment string `json:"deployment"`
}

type MongoChangeSource struct {
	Source      MongoSource `json:"source"`
	ResumeToken string      `json:"resume_token"`
}

type MongoScanner struct {
	RunPeriod time.Duration `json:"-"`

	Collections []MongoChangeSource `json:"-"`
	Databases   []MongoChangeSource `json:"-"`
	Deployments []MongoChangeSource `json:"-"`

	ConnectionString string        `json:"-"`
	Username         string        `json:"-"`
	Password         string        `json:"-"`
	Client           *mongo.Client `json:"-"`

	GcpBillingProject  string `json:"-"`
	GcpDlpEndpoint     string `json:"-"`
	GcpDlpTriggerName  string `json:"-"`
	GcpDlpTriggerJobId string `json:"-"`

	StateFile *url.URL `json:"-"`

	DlpClient    *dlp.Client `json:"-"`
	DlpJobActive bool        `json:"-"`

	Cache *gocache.Cache `json:"-"`

	LastChanges map[MongoSource]MongoChangeSource `json:"last_changes"`
}

type MongoChange struct {
	Source MongoSource

	ConnectionString string `json:"-"`

	Document *bson.Raw `json:"-"`

	ResumeToken interface{}
}

var fieldsToRemove []string = []string{"_id"}
var mongoScanner MongoScanner

func (c MongoChange) DlpType() string {
	return "mongodb"
}

func (c MongoChange) DlpVersion() string {
	return "1.0"
}

func (c MongoChange) DlpFullPath() string {
	if strings.HasSuffix(c.ConnectionString, "/") {
		return c.ConnectionString + c.DlpRelativePath()
	}
	return c.ConnectionString + "/" + c.DlpRelativePath()
}

func (c MongoChange) DlpRelativePath() string {
	if c.Source.Collection != "" {
		return c.Source.Database + "/" + c.Source.Collection
	}
	if c.Source.Database != "" {
		return c.Source.Database
	}
	return c.Source.Deployment
}

func (c MongoChange) DlpRootPath() string {
	if c.Source.Collection != "" {
		return c.Source.Database
	}
	if c.Source.Database != "" {
		return c.Source.Database
	}
	return c.Source.Deployment
}

func init() {
	mongoScanner = MongoScanner{
		LastChanges: make(map[MongoSource]MongoChangeSource, 0),
	}
	if os.Getenv("RUN_PERIOD") != "" {
		runPeriod, err := time.ParseDuration(os.Getenv("RUN_PERIOD"))
		if err != nil {
			log.Fatal().Err(err).Msgf("Failed to parse RUN_PERIOD: %s", os.Getenv("RUN_PERIOD"))
		}
		mongoScanner.RunPeriod = runPeriod
	} else {
		mongoScanner.RunPeriod, _ = time.ParseDuration("10m")
	}
	if os.Getenv("MONGO_CONNECTION_STRING") != "" {
		mongoScanner.ConnectionString = os.Getenv("MONGO_CONNECTION_STRING")
	} else {
		log.Fatal().Msg("No MONGO_CONNECTION_STRING specified!")
	}

	if os.Getenv("MONGO_USERNAME") != "" {
		mongoScanner.Username = os.Getenv("MONGO_USERNAME")
	}
	if os.Getenv("MONGO_PASSWORD") != "" {
		mongoScanner.Password = os.Getenv("MONGO_PASSWORD")
	}

	if os.Getenv("MONGO_DEPLOYMENTS") != "" {
		deployments := strings.Split(os.Getenv("MONGO_DEPLOYMENTS"), ",")
		for _, d := range deployments {
			mongoScanner.Deployments = append(mongoScanner.Deployments, MongoChangeSource{Source: MongoSource{Deployment: strings.TrimSpace(d)}})
		}
	}
	if os.Getenv("MONGO_DATABASES") != "" {
		databases := strings.Split(os.Getenv("MONGO_DATABASES"), ",")
		for _, d := range databases {
			mongoScanner.Databases = append(mongoScanner.Databases, MongoChangeSource{Source: MongoSource{Database: strings.TrimSpace(d)}})
		}
	}
	if os.Getenv("MONGO_COLLECTIONS") != "" {
		collections := strings.Split(os.Getenv("MONGO_COLLECTIONS"), ",")
		for _, d := range collections {
			c := strings.SplitN(d, ".", 2)
			mongoScanner.Collections = append(mongoScanner.Collections, MongoChangeSource{Source: MongoSource{Database: strings.TrimSpace(c[0]), Collection: strings.TrimSpace(c[1])}})
		}
	}

	if len(mongoScanner.Deployments) == 0 && len(mongoScanner.Databases) == 0 && len(mongoScanner.Deployments) == 0 {
		log.Fatal().Msg("No sources for change streams specified, set at least one of: MONGO_COLLECTIONS, MONGO_DATABASES, MONGO_DEPLOYMENTS")
	}

	if os.Getenv("DLP_TRIGGER_NAME") != "" {
		mongoScanner.GcpDlpTriggerName = os.Getenv("DLP_TRIGGER_NAME")
	} else {
		log.Fatal().Msg("No DLP_TRIGGER_NAME specified!")
	}

	if os.Getenv("PROJECT_ID") != "" {
		mongoScanner.GcpBillingProject = os.Getenv("PROJECT_ID")
	} else {
		log.Fatal().Msg("No PROJECT_ID specified!")
	}

	if os.Getenv("DLP_ENDPOINT") != "" {
		mongoScanner.GcpDlpEndpoint = os.Getenv("DLP_ENDPOINT")
	}

	if os.Getenv("STATE_FILE") != "" {
		if !strings.HasPrefix(os.Getenv("STATE_FILE"), "gs://") {
			log.Fatal().Msg("State file should start with gs://!")
		}
		url, err := url.Parse(os.Getenv("STATE_FILE"))
		if err != nil {
			log.Fatal().Err(err).Msg("Failed to parse STATE_FILE location!")
		}
		mongoScanner.StateFile = url
	} else {
		log.Fatal().Msg("No STATE_FILE specified!")
	}

	functions.HTTP("DLPFunctionHTTP", DLPFunctionHTTP)
}

func (s *MongoScanner) connect(ctx context.Context) error {
	clientOptions := options.Client()
	clientOptions.ApplyURI(s.ConnectionString)
	if s.Username != "" {
		clientOptions.SetAuth(options.Credential{Username: s.Username, Password: s.Password})
	}
	s.Client, _ = mongo.Connect(clientOptions)
	return nil
}

func (s *MongoScanner) disconnect(ctx context.Context) {
	if s.Client != nil {
		if err := s.Client.Disconnect(ctx); err != nil {
			panic(err)
		}
	}
}

func (s *MongoScanner) ProcessChangeStream(ctx context.Context, cs *mongo.ChangeStream, base MongoChange, change chan<- MongoChange, resumeToken chan<- string, errors chan<- error) {
	log.Info().Interface("source", base).Msg("Starting to process change stream (this happens for each change stream)...")
	for {
		select {
		case <-ctx.Done():
			cs.Close(ctx)
			return
		default:
		}
		ok := cs.Next(ctx)
		if ok {
			newChange := base
			newChange.Document = &cs.Current

			log.Debug().Interface("change", newChange).Msg("Received change from MongoDB")

			var resumeToken map[string]interface{}
			err := bson.Unmarshal(cs.ResumeToken(), &resumeToken)
			if err != nil {
				// Lets not some unmarshalling errors stop us entirely...
				log.Error().Err(err).Msg("Failed unmarshaling incoming resume token")
				errors <- err
			} else {
				newChange.ResumeToken = resumeToken
			}
			change <- newChange
			log.Info().Interface("change", newChange).Msg("Emitting changed document")
		} else {
			select {
			case <-ctx.Done():
				cs.Close(ctx)
				return
			default:
			}
			err := cs.Err()
			if err != nil {
				log.Error().Err(err).Msg("Received error from change stream iterator")
				errors <- err
				return
			}
		}
	}
}

func (s *MongoScanner) HybridInspect(ctx context.Context, change MongoChange, original map[string]interface{}, redacted bson.D) error {
	var err error
	if s.DlpClient == nil {
		options := []option.ClientOption{option.WithUserAgent("google-pso-tool/mongodb-hybrid-dlp/0.1.0")}
		if s.GcpDlpEndpoint != "" {
			options = append(options, option.WithEndpoint(s.GcpDlpEndpoint))
		}
		if s.GcpBillingProject != "" {
			options = append(options, option.WithQuotaProject(s.GcpBillingProject))
		}
		s.DlpClient, err = dlp.NewClient(ctx, options...)
		if err != nil {
			return err
		}
	}

	marshaledDoc, err := bson.MarshalExtJSON(redacted, true, false)
	if err != nil {
		log.Error().Err(err).Msg("Failed to marshal redacted document")
		return err
	}

	marshaledDocHash := sha256.New()
	marshaledDocHash.Write([]byte(marshaledDoc))
	hashSum := fmt.Sprintf("%x", marshaledDocHash.Sum(nil))
	if _, exists := s.Cache.Get(hashSum); exists {
		log.Info().Str("hash", hashSum).Msg("Document already processed")
		return nil
	}

	contentItem := &dlppb.ContentItem{
		DataItem: &dlppb.ContentItem_Value{
			Value: string(marshaledDoc),
		},
	}

	container := &dlppb.Container{
		Type:         change.DlpType(),
		FullPath:     change.DlpFullPath(),
		RelativePath: "/" + change.DlpRelativePath(),
		RootPath:     "/" + change.DlpRootPath(),
		Version:      change.DlpVersion(),
	}

	labels := map[string]string{}

	hybridFindingDetails := &dlppb.HybridFindingDetails{
		ContainerDetails: container,
		Labels:           labels,
	}

	hybridContentItem := &dlppb.HybridContentItem{
		Item:           contentItem,
		FindingDetails: hybridFindingDetails,
	}

	if !s.DlpJobActive {
		activateJobReq := &dlppb.ActivateJobTriggerRequest{
			Name: s.GcpDlpTriggerName,
		}

		log.Info().Str("triggerID", s.GcpDlpTriggerName).Msg("Activating DLP job...")
		activateRes, err := s.DlpClient.ActivateJobTrigger(ctx, activateJobReq)
		if err != nil {
			if !strings.Contains(err.Error(), "already running") {
				log.Error().Err(err).Msg("DLP job activation failed")
				return err
			}
			s.DlpJobActive = true
			log.Warn().Str("triggerID", s.GcpDlpTriggerName).Msg("Job is already running")

			listReq := &dlppb.ListDlpJobsRequest{
				Parent: fmt.Sprintf("projects/%s", s.GcpBillingProject),
			}
			for resp, err := range s.DlpClient.ListDlpJobs(ctx, listReq).All() {
				if err != nil {
					break
				}
				if resp.GetJobTriggerName() == s.GcpDlpTriggerName && resp.GetState() == dlppb.DlpJob_ACTIVE {
					s.GcpDlpTriggerJobId = resp.GetName()
					log.Warn().Str("jobID", s.GcpDlpTriggerJobId).Msg("Found existing active job in ACTIVE state")
				}
			}
		} else {
			s.GcpDlpTriggerJobId = activateRes.Name
			log.Info().Str("jobID", s.GcpDlpTriggerJobId).Msg("DLP trigger job activated")

			s.DlpJobActive = true
		}
	}

	req := &dlppb.HybridInspectJobTriggerRequest{
		Name:       s.GcpDlpTriggerName,
		HybridItem: hybridContentItem,
	}

	// Send the hybrid inspect request.
	_, err = s.DlpClient.HybridInspectJobTrigger(ctx, req)
	if err != nil {
		return err
	}

	s.Cache.Set(hashSum, true)

	return nil
}

func (s *MongoScanner) InspectChanges(ctx context.Context, changes <-chan MongoChange, errors chan<- error) {
	for {
		var gotChange bool = false
		select {
		case doc := (<-changes):
			var parsedDoc map[string]interface{}
			var longDocId interface{}
			var shortDocId string
			var fullDocument bson.D

			err := bson.Unmarshal(*doc.Document, &parsedDoc)
			if err == nil {
				resumeToken := doc.ResumeToken.(map[string]interface{})
				if _, ok := resumeToken["_data"]; ok {
					resumeTokenData := resumeToken["_data"].(string)
					s.LastChanges[doc.Source] = MongoChangeSource{
						Source:      doc.Source,
						ResumeToken: resumeTokenData,
					}
				}

				if _, ok := parsedDoc["_id"]; ok {
					longDocId = parsedDoc["_id"]
				}

				if _, ok := parsedDoc["fullDocument"]; ok {
					fullDocument = parsedDoc["fullDocument"].(bson.D)

					// Clean up the document to remove stuff that is different from every document even if
					// they are semantically equal, so we can cache hits
					redactedDocument := bson.D{}
					for _, v := range fullDocument {
						if !slices.Contains(fieldsToRemove, v.Key) {
							redactedDocument = append(redactedDocument, v)
						}
						if v.Key == "_id" {
							shortDocId = v.Value.(bson.ObjectID).Hex()
						}
					}
					log.Debug().Interface("docId", longDocId).Interface("objectID", shortDocId).Msg("Inspecting document")

					err := s.HybridInspect(ctx, doc, parsedDoc, redactedDocument)
					if err != nil {
						log.Error().Err(err).Msg("Hybrid inspection returned an error")
						errors <- err
					}
				} else {
					errors <- fmt.Errorf("Change was missing full document: %v", doc.Document)
				}
			} else {
				errors <- err
			}

			gotChange = true
		default:
		}
		if !gotChange {
			select {
			case <-ctx.Done():
				return
			default:
			}
		}
	}
}

func (s *MongoScanner) LoadState() error {
	ctx := context.Background()
	client, err := storage.NewClient(ctx)
	if err != nil {
		return err
	}
	defer client.Close()

	ctx, cancel := context.WithTimeout(ctx, time.Second*50)
	defer cancel()

	o := client.Bucket(s.StateFile.Host).Object(strings.TrimPrefix(s.StateFile.Path, "/"))
	rc, err := o.NewReader(ctx)
	if err != nil {
		return fmt.Errorf("Error reading file gs://%s/%s: %w", s.StateFile.Host, strings.TrimPrefix(s.StateFile.Path, "/"), err)
	}
	defer rc.Close()

	stateData, err := io.ReadAll(rc)
	if err != nil {
		return err
	}

	lastChangesList := make([]MongoChangeSource, 0)
	err = json.Unmarshal(stateData, &lastChangesList)
	if err != nil {
		return err
	}

	for _, lc := range lastChangesList {
		s.LastChanges[lc.Source] = lc
	}

	return nil
}

func (s *MongoScanner) SaveState() error {
	ctx := context.Background()
	client, err := storage.NewClient(ctx)
	if err != nil {
		return err
	}
	defer client.Close()

	ctx, cancel := context.WithTimeout(ctx, time.Second*60)
	defer cancel()

	o := client.Bucket(s.StateFile.Host).Object(strings.TrimPrefix(s.StateFile.Path, "/"))
	fmt.Printf("host: %v, object: %v\n", s.StateFile.Host, strings.TrimPrefix(s.StateFile.Path, "/"))
	wc := o.NewWriter(ctx)

	lastChangesList := make([]MongoChangeSource, 0)
	for _, v := range s.LastChanges {

		lastChangesList = append(lastChangesList, v)
	}

	jsonData, err := json.Marshal(lastChangesList)
	if err != nil {
		return err
	}
	_, err = wc.Write(jsonData)
	if err != nil {
		return err
	}

	if err := wc.Close(); err != nil {
		return fmt.Errorf("Writer.Close: %w", err)
	}
	return nil
}

func (s *MongoScanner) Process(w http.ResponseWriter) error {
	connectCtx, connectCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer connectCancel()

	s.connect(connectCtx)
	defer s.disconnect(connectCtx)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err := s.Client.Ping(ctx, readpref.Primary())
	if err != nil {
		log.Error().Err(err).Msg("Great difficulties connecting to MongoDB server, probably you got no connectivity or bad connection string")
		return err
	}

	// 16MB cache with LRU eviction policy
	if s.Cache == nil {
		var cacheSize int = 16 * 1024 * 1024
		log.Info().Int("cacheSize", cacheSize).Msgf("Initialized cache: %d MB", cacheSize/(1024*1024))
		s.Cache = gocache.NewCache().WithMaxMemoryUsage(cacheSize).WithEvictionPolicy(gocache.LeastRecentlyUsed)
	}

	errors := make([]chan error, 0)
	documents := make(chan MongoChange, 10)
	resumeTokens := make([]chan string, 0)
	cancels := make([]context.CancelFunc, 0)
	ctxs := make([]context.Context, 0)
	var wg sync.WaitGroup
	var index int = 0

	// Load resume tokens
	err = s.LoadState()
	if err != nil {
		log.Warn().Err(err).Msg("Failed to load state from bucket, possibly no state yet.")
		err = nil
	}

	// There is really only one deployment, but we keep the parameters consistent
	for _, deployment := range s.Deployments {
		errors = append(errors, make(chan error, 1))
		resumeTokens = append(resumeTokens, make(chan string, 1))
		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()
		cancels = append(cancels, cancel)
		ctxs = append(ctxs, ctx)

		options := options.ChangeStream()
		if s.LastChanges[deployment.Source].ResumeToken != "" {
			log.Info().Str("resumeToken", s.LastChanges[deployment.Source].ResumeToken).Msg("Using resume token for deployment")
			options.SetResumeAfter(bson.M{"_data": s.LastChanges[deployment.Source].ResumeToken})
		}

		cs, err := s.Client.Watch(ctx, mongo.Pipeline{}, options)
		if err != nil {
			return err
		}

		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			base := MongoChange{
				Source:           deployment.Source,
				ConnectionString: s.ConnectionString,
			}
			s.ProcessChangeStream(ctxs[i], cs, base, documents, resumeTokens[i], errors[i])
		}(index)
		index += 1
	}

	// Watch entire databases
	for _, database := range s.Databases {
		db := s.Client.Database(database.Source.Database)
		if err != nil {
			return err
		}

		errors = append(errors, make(chan error, 1))
		resumeTokens = append(resumeTokens, make(chan string, 1))
		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()
		cancels = append(cancels, cancel)
		ctxs = append(ctxs, ctx)

		options := options.ChangeStream()
		if s.LastChanges[database.Source].ResumeToken != "" {
			log.Info().Str("resumeToken", s.LastChanges[database.Source].ResumeToken).Msg("Using resume token for database")
			options.SetResumeAfter(bson.M{"_data": s.LastChanges[database.Source].ResumeToken})
		}

		cs, err := db.Watch(ctx, mongo.Pipeline{}, options)
		if err != nil {
			return err
		}

		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			base := MongoChange{
				Source:           database.Source,
				ConnectionString: s.ConnectionString,
			}
			s.ProcessChangeStream(ctxs[i], cs, base, documents, resumeTokens[i], errors[i])
		}(index)
		index += 1
	}

	// Watch for specific collections
	for _, col := range s.Collections {
		db := s.Client.Database(col.Source.Database)
		if err != nil {
			return err
		}

		coll := db.Collection(col.Source.Collection)
		if err != nil {
			return err
		}

		errors = append(errors, make(chan error, 1))
		resumeTokens = append(resumeTokens, make(chan string, 1))
		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()
		cancels = append(cancels, cancel)
		ctxs = append(ctxs, ctx)

		options := options.ChangeStream()
		if s.LastChanges[col.Source].ResumeToken != "" {
			log.Info().Str("resumeToken", s.LastChanges[col.Source].ResumeToken).Msg("Using resume token for collection")
			options.SetResumeAfter(bson.M{"_data": s.LastChanges[col.Source].ResumeToken})
		}

		cs, err := coll.Watch(ctx, mongo.Pipeline{}, options)
		if err != nil {
			return err
		}

		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			base := MongoChange{
				Source:           col.Source,
				ConnectionString: s.ConnectionString,
			}
			s.ProcessChangeStream(ctxs[i], cs, base, documents, resumeTokens[i], errors[i])
		}(index)
		index += 1
	}

	inspectErrors := make(chan error, 1)
	inspectCtx, inspectCancel := context.WithCancel(context.Background())
	wg.Add(1)
	go func() {
		defer wg.Done()
		s.InspectChanges(inspectCtx, documents, inspectErrors)
	}()

	var sleepCycles int = int(s.RunPeriod / (time.Second * 10))
	// We take one 10 second cycle off to save stuff
	for i := 0; i < sleepCycles-1; i++ {
		time.Sleep(10 * time.Second)
		fmt.Fprintf(w, "Still processing, cycle=%d/%d ...\n", i+1, sleepCycles-1)
		if flush, ok := w.(http.Flusher); ok {
			flush.Flush()
		}
	}

	for i := 0; i < index; i++ {
		cancels[i]()
	}
	inspectCancel()
	wg.Wait()

	// Same resume tokens
	err = s.SaveState()
	if err != nil {
		log.Error().Err(err).Msg("Failed to save state to bucket!")
		return err
	}

	// We've done our bit here, finish the job and let the next run start another one
	if s.DlpClient != nil && s.DlpJobActive {
		if s.GcpDlpTriggerJobId != "" {
			finishJobReq := &dlppb.FinishDlpJobRequest{
				Name: s.GcpDlpTriggerJobId,
			}

			log.Info().Str("jobID", s.GcpDlpTriggerJobId).Msg("Finishing the DLP job...")

			finishCtx, _ := context.WithTimeout(context.Background(), 30*time.Second)
			err = s.DlpClient.FinishDlpJob(finishCtx, finishJobReq)
			if err != nil {
				log.Error().Err(err).Msg("Finishing the DLP job errored out")
				return err
			}
		}
		s.DlpClient.Close()
	}

	return nil
}

func DLPFunctionHTTP(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "Processing now.\n")
	err := mongoScanner.Process(w)
	if err != nil {
		fmt.Fprintf(w, "Processing failed: %v", err)
	}
}
