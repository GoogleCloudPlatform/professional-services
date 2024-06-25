package main

import (
	"fmt"
	"net/http"

	"google.golang.org/appengine"
	"google.golang.org/appengine/datastore"
	"google.golang.org/appengine/log"
	"google.golang.org/appengine/urlfetch"
	"gopkg.in/yaml.v2"

	"golang.org/x/net/context"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/cloudbuild/v1"
)

// YAMLWrapper stores build info.  Cannot store cloudbuild.Build directly.
type YAMLWrapper struct {
	Value string
}

func main() {
	http.HandleFunc("/", handle)
	appengine.Main()
}

func handle(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.NewContext(r)
	str, err := submitBuild(ctx)
	if err != nil {
		message := fmt.Sprintf("Error submitting build: %s\n", err)
		log.Errorf(ctx, message)
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(message))
	} else {
		message := fmt.Sprintf("Successfully submitted build: %s\n", str)
		log.Infof(ctx, message)
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(message))
	}
	return
}

func submitBuild(ctx context.Context) (string, error) {
	// Get build YAML from Datastore
	k := datastore.NewKey(ctx, "YAMLWrapper", "ID", 0, nil)
	y := new(YAMLWrapper)
	if err := datastore.Get(ctx, k, y); err != nil {
		log.Errorf(ctx, "Cannot get YAML from Datastore: %q", err)
		return "", err
	}

	b := new(cloudbuild.Build)
	err := yaml.Unmarshal([]byte(y.Value), &b)
	if err != nil {
		log.Errorf(ctx, "Value from Datastore is not valid YAML: %q", err)
		return "", err
	}
	log.Infof(ctx, "Got build config from Datastore: %q", b)
	b.Tags = []string{"cron-helper"}

	//
	transport := &oauth2.Transport{
		Source: google.AppEngineTokenSource(ctx, cloudbuild.CloudPlatformScope),
		Base:   &urlfetch.Transport{Context: ctx},
	}
	client := &http.Client{Transport: transport}

	svc, err := cloudbuild.New(client)
	if err != nil {
		log.Errorf(ctx, "Cannot initiate cloudbuild client: %q", err)
		return "", err
	}

	projectID := appengine.AppID(ctx)
	cr := svc.Projects.Builds.Create(projectID, b)
	results, err := cr.Do()
	if err != nil {
		log.Errorf(ctx, "Create build failed: %q", err)
		return "", err
	}
	resultString, err := results.MarshalJSON()
	if err != nil {
		log.Errorf(ctx, "Results Marshal JSON failed: %q", err)
		return "", err
	}

	return fmt.Sprintf("Build results: %q", resultString), nil
}
