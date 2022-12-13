// Copyright 2022 Google LLC
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"html/template"
	"log"
	"os"
	"strings"
	"sync"
	"time"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"

	// Required for GKE client-go - https://github.com/kubernetes/client-go/issues/242#issuecomment-314642965
	_ "k8s.io/client-go/plugin/pkg/client/auth/gcp"

	// secret manager client
	secretmanager "cloud.google.com/go/secretmanager/apiv1"
	"cloud.google.com/go/secretmanager/apiv1/secretmanagerpb"
	"github.com/google/uuid"
)

var (
	namespace = flag.String("namespace", "default", "Name of the namespace to look for secrets, default: default")
	exclude   = flag.String("exclude", "", "Name of secrets to exclude, comma delimited, default: ''")
	project   = flag.String("project", "", "Name of GCP project to migrate secrets, default: ''")
	prefix    = flag.String("prefix", "", "A prefix, like cluster name, to append to all GCP secrets during creation (default: [OPTIONAL PREFIX]-[NAMESPACE]-[SECRET NAME]-[OBJECT KEY NAME])")
	delete    = flag.Bool("delete", false, "If set `--delete` or `--delete=True` the Google secrets are deleted. If the secrets exist, the program breaks - on purpose")
	debug     = flag.Bool("debug", false, "If set `--debug` or `--debug=True` more logging is enabled")
	dryrun    = flag.Bool("dry-run", false, "If set `--dry-run` or `--dry-run=True` no CREATE/DELETE actions are performed")
	condensed = flag.Bool("condensed", false, "If set `--condensed` or `--condensed=True` the JSON output is minified")
)

type Client struct {
	k8sClient *kubernetes.Clientset
	gsmClient *secretmanager.Client
}

// create top level migration details struct
type SecretsReportJSON struct {
	Action        string                    `json:"action"`
	MigrationDate string                    `json:"date"`
	K8sSecretsMap map[string][]SecretObject `json:"secrets"` // key here is k8s-secret-name, value is that SecretObject described below
}

// create an struct for each secret object
type SecretObject struct {
	K8sNamespace       string `json:"namespace"`
	GCPProject         string `json:"project"`
	GSMName            string `json:"googleSecret"`
	K8sObjectName      string `json:"secretObjectName"`
	ScriptGeneratedUID string `json:"uid"`
}

// newClient initializes connections with clients and returns combined client struct
func newClient() *Client {

	// check for in-cluster config, if not found then use the out-of-cluster (local) kubeconfig
	config, err := rest.InClusterConfig()
	if err != nil {
		kubeconfig :=
			clientcmd.NewDefaultClientConfigLoadingRules().GetDefaultFilename()
		config, err = clientcmd.BuildConfigFromFlags("", kubeconfig)
		if err != nil {
			log.Fatalf("failed to initialize Kubernetes API client: %s", err)
		}
	}

	// create the Kubernetes clientset (clients for multiple Kubernetes APIs)
	k8sClientSet, err := kubernetes.NewForConfig(config)
	if err != nil {
		log.Fatalf("failed to load Kubernetes clientset: %s", err)
	}
	log.Println("✅ Kubernetes client configured")

	// create the Google gcloud client
	gsmClient, err := secretmanager.NewClient(context.TODO())
	if err != nil {
		log.Fatalf("failed to setup client: %v", err)
	}
	log.Println("✅ Google client configured")

	return &Client{
		k8sClient: k8sClientSet, // returns clientset dynamically if IN/OUT of cluster
		gsmClient: gsmClient,
	}
}

func main() {
	// check input flags and set variables accordingly
	flag.Parse()

	// use the default namespace if "" accidentally passed as --namespace="${UNSET VARIABLE}"
	if *namespace == "" {
		*namespace = "default"
	}

	// exit if project argument isn't set
	if *project == "" {
		log.Fatalf("❌ `--project=` is not defined in arguments")
	}

	// yell if dry-run is set
	if *dryrun {
		log.Println("🚨 WARNING: DRY RUN ONLY - NO ACTIONS PERFORMED")
		log.Println("===============================================")
	}

	// kick-off!
	log.Printf("📣 Starting migration script [namespace: '%s'] [project: '%s']:\n", *namespace, *project)

	// init the struct for client(s) re-use
	log.Println("Initializing clients:")
	c := newClient()

	// list secrets from a Kubernetes namespace (set by --namespace="" or defaults to "default")
	log.Printf("🔍 Listing all secrets from [namespace: '%s']", *namespace)
	secretsAll, err := c.listKubernetesSecrets(*namespace)
	if err != nil {
		log.Fatalf("Issue interacting with Kubernetes in [namespace: '%s': %v]", *namespace, err)
	}

	// fail and exit if results are empty
	if len(secretsAll.Items) == 0 {
		log.Printf("Error: Issue acquiring list of Kubernetes secrets in [namespace: '%s']", *namespace)
		log.Fatalf("❌ No secrets found to copy, no action taken")
	}

	// log the filtering taking place
	log.Printf("🪚 Filtering secret list to skip secrets of type 'kubernetes.io/service-account-token'")

	// create a "originalList" of secret names only - no data
	originalList := []string{}

	// start of clean-up, get a list of only the secrets we care to migrate
	for index, secret := range secretsAll.Items {

		// dump what is found if --debug is enabled
		if *debug {
			fmt.Printf("Found [%d]: %s\n", index+1, secret.Name)
		}

		// SKIP if the secret is a k8s service account token
		if secret.Type == "kubernetes.io/service-account-token" {
			if *debug {
				log.Printf("SKIPPED: ['%s'] is of type service-account-token", secret.Name)
			}
			continue
		}

		// build the array
		originalList = append(originalList, secret.Name)
	}

	// further list parsing to remove excludes
	log.Printf("🪚 Removing `--exclude` items ['%s']", *exclude)

	// separate the "--exclude" list and remove any found values from the originalList
	for _, excludeName := range strings.Split(*exclude, ",") {
		// remove item if found in originalList and excludeList by comparison
		originalList = remove(originalList, excludeName)
	}

	// fail if we have no objects to migrate
	if len(originalList) == 0 {
		log.Fatalf("❌ No secrets found to copy, no action taken")
	}

	// list after skipping / excluding any strings
	log.Printf("📋 List: %s\n", originalList)

	// define action for JSON data out
	var statusAction string

	// set if we are creating or deleting for list output
	if *delete {
		statusAction = "deleted"
	} else {
		statusAction = "created"
	}

	report := SecretsReportJSON{
		Action:        statusAction,
		MigrationDate: time.Now().UTC().Format("2006-01-02"),
		K8sSecretsMap: make(map[string][]SecretObject),
	}

	// range through the list of k8s secrets to migrate
	for _, secretName := range originalList {

		// get a k8s secretContent based on namespace and name
		secretContent, _ := c.getKubernetesSecret(*namespace, secretName)

		// copy k8s secret names to our reporting JSON object (for future nested secret objects)
		report.K8sSecretsMap[secretName] = make([]SecretObject, 0)

		// this returns a map of the secret object which can contain multiple files, as a result, let's parse through each one and create as needed
		for objName, objData := range secretContent.Data {

			// announce what's happening (either creating or deleting)
			if *delete {
				log.Printf("🚫 Deleting secret object(s) for ['%s']\n", secretContent.ObjectMeta.Name)
			} else {
				log.Printf("✅ Migrating secret object(s) for ['%s']\n", secretContent.ObjectMeta.Name)
			}

			// replace periods with dashes and create a new safe name [OPTIONAL PREFIX]-[NAMESPACE]-[SECRET NAME]-[OBJECT KEY NAME]
			safeSecretName := strings.ToLower(fmt.Sprintf(strings.Replace(*namespace, ".", "-", -1) + "-" + strings.Replace(secretName, ".", "-", -1) + "-" + strings.Replace(objName, ".", "-", -1)))

			// if there's a prefix passed, prepend it!
			safeSecretName = strings.Replace(*prefix, ".", "-", -1) + "-" + safeSecretName

			// create a random UUID to be used if needed to identify/track
			id := uuid.New()

			// append the k8s secret object to the secret name
			// this allows a single k8s secret to contain multiple (sub)objects
			report.K8sSecretsMap[secretName] = append(report.K8sSecretsMap[secretName], SecretObject{
				K8sNamespace:       *namespace,
				GCPProject:         *project,
				GSMName:            safeSecretName,
				K8sObjectName:      objName,
				ScriptGeneratedUID: id.String(),
			})

			// output what's being deleted
			if *delete {
				// don't actually delete anything if `--dry-run` is set
				if !*dryrun {

					// DELETION OF THE SECRET IN GOOGLE SECRET MANAGER
					c.deleteSecret(safeSecretName)
				}
				log.Printf("  - Deleted secret named ['%s'] in GCP project: ['%s'] \n", safeSecretName, *project)
				continue
			}

			// output more information on things being created, if --debug is set
			if *debug {
				log.Printf("Running createGoogleSecret() for Kubernetes secret ['%s'], from ['%s'] namespace, named ['%s'] in Google project ['%s'], using ['%v'] from the ['%s'] object key.\n", secretContent.ObjectMeta.Name, *namespace, safeSecretName, *project, string(objData), objName)
			}

			// if --dry-run is NOT set, create the secret
			if !*dryrun {

				// empty secrets shouldn't be created
				if string(objData) == "" {
					log.Printf("ERROR: ['%s'] in Kubernetes secret ['%s'] has an object value that is EMPTY... SKIPPING...\n", objName, secretContent.ObjectMeta.Name)
					continue
				}

				// CREATION OF THE SECRET IN GOOGLE SECRET MANAGER
				c.createGoogleSecret(safeSecretName, strings.ToLower(objName), id, objData)
			}
			log.Printf("  - Created secret named ['%s'] in GCP project: ['%s']\n", safeSecretName, *project)
		}
	}

	// adding a waitgroup to avoid data races when printing to stdout
	// A WaitGroup waits for a collection of goroutines to finish. The main goroutine calls Add to set the number of goroutines to wait for. Then each of the goroutines runs and calls Done when finished. At the same time, Wait can be used to block until all goroutines have finished.
	wg := new(sync.WaitGroup)
	// Increment the WaitGroup counter.
	wg.Add(1)

	// generate JSON data dump from report
	jsonReport(report)

	// close the report
	wg.Done()
	// Increment the WaitGroup counter & wait for the template to be generated
	wg.Add(1)

	// generate k8s (YAML) output
	// keeping "templates/" is important to dir structure (only bc, if built with `ko` it will use the symlink)
	createTemplate(report, "templates/secret-provider-class.tmpl")

	// close the template and run the rest (not conflicting)!
	wg.Done()

	// generate README help for migration
	// keeping "templates/" is important to dir structure (only bc, if built with `ko` it will use the symlink)
	createTemplate(report, "templates/helper-doc.tmpl")

	// Wait blocks until the WaitGroup counter is zero.
	wg.Wait()

}

func jsonReport(report SecretsReportJSON) {
	// if --condensed flag is passed, flatten the JSON
	if *condensed {
		// list after cleaning
		jsonStr, err := json.Marshal(report)
		if err != nil {
			fmt.Printf("Error: %s", err.Error())
		} else {
			// JSON dump of data for future use migrating
			log.Printf("📋 List of GCP Secret Manager secrets:\n%v", string(jsonStr))
		}
	} else {
		// same but pretty
		jsonStr, err := json.MarshalIndent(report, "", "\t")
		if err != nil {
			fmt.Printf("Error: %s", err.Error())
		} else {
			// JSON dump of data for future use migrating - but pretty
			log.Printf("📋 List of GCP Secret Manager secrets:\n%v", string(jsonStr))
		}
	}
}

func createTemplate(secretListData SecretsReportJSON, templateFile string) {
	// parse the template
	tmpl, err := template.ParseFiles(templateFile)
	if err != nil {
		// if built with /ko the files are build in the app dir
		templateFile = os.Getenv("KO_DATA_PATH") + "/" + templateFile

		tmpl, err = template.ParseFiles(templateFile)
		if err != nil {
			log.Fatalf("Failed parsing template: %v", err)
		}
	}

	// apply the template to the vars map and write the result to file.
	if err := tmpl.Execute(os.Stdout, secretListData); err != nil {
		fmt.Println(err)
	}

}

func (c *Client) deleteSecret(mySecretName string) error {
	// create the request with secret name `projects/*/secrets/*`.
	req := &secretmanagerpb.DeleteSecretRequest{
		Name: fmt.Sprintf("projects/%s/secrets/%s", *project, mySecretName),
	}

	// delete it!
	if err := c.gsmClient.DeleteSecret(context.TODO(), req); err != nil {
		return fmt.Errorf("failed to delete secret: %v", err)
	}
	return nil
}

func (c *Client) createGoogleSecret(myGCPSecretName string, mySecretK8sName string, uuid uuid.UUID, mySecretDataValue []byte) {
	// build the the request to create the secret (--project for *project).
	createSecretReq := &secretmanagerpb.CreateSecretRequest{
		Parent:   fmt.Sprintf("projects/%s", *project),
		SecretId: myGCPSecretName,
		Secret:   &secretmanagerpb.Secret{Labels: map[string]string{"uuid": uuid.String(), "namespace": *namespace}, Replication: &secretmanagerpb.Replication{Replication: &secretmanagerpb.Replication_Automatic_{Automatic: &secretmanagerpb.Replication_Automatic{}}}},
	}

	// create the empty secret "template" using the defined request
	secret, err := c.gsmClient.CreateSecret(context.TODO(), createSecretReq)
	if err != nil {
		log.Fatalf("failed to create secret: %v", err)
	}

	// declare the payload to store (NEEDS TO BE BYTES)
	payload := mySecretDataValue

	// build the request
	addSecretVersionReq := &secretmanagerpb.AddSecretVersionRequest{
		Parent: secret.Name,
		Payload: &secretmanagerpb.SecretPayload{
			Data: payload,
		},
	}

	// AddSecretVersion creates a new SecretVersion containing secret data and attaches it to an existing Secret.
	resp, err := c.gsmClient.AddSecretVersion(context.TODO(), addSecretVersionReq)
	if err != nil {
		log.Fatalf("failed to add secret version: %v", err)
	}

	// TODO: Use resp
	_ = resp
}

// list secrets from a Kubernetes namespace
func (c *Client) listKubernetesSecrets(namespace string) (*corev1.SecretList, error) {
	sl, err := c.k8sClient.CoreV1().Secrets(namespace).List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("some context: %v", err)
	}
	return sl, err
}

// get data for a secret from a named string
func (c *Client) getKubernetesSecret(namespace string, name string) (*corev1.Secret, error) {
	s, err := c.k8sClient.CoreV1().Secrets(namespace).Get(context.TODO(), name, metav1.GetOptions{})
	if err != nil {
		return nil, fmt.Errorf("some context: %v", err)
	}
	return s, err
}

// takes a (secrets) list and a (exclude) string to remove items from a list
func remove[T comparable](l []T, item T) []T {
	out := make([]T, 0)
	for _, element := range l {
		// if the (secrets) list does not contain (exclude) item
		if element != item {
			// rebuild a new slice only containing non-excluded values
			out = append(out, element)
		}
	}
	return out
}
