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

package projecthandler

import (
	"context"
	"fmt"
	"net/http"

	"log"

	"encoding/json"

	"github.com/gorilla/mux"
	"google.golang.org/api/cloudresourcemanager/v1"
	"google.golang.org/appengine"
)

// GetProjects returns a list of GCS projects using string match
func GetProjects(ctx context.Context, str string) ([]string, error) {
	svc, err := cloudresourcemanager.NewService(ctx)
	if err != nil {
		log.Printf("getProjects(): Unable to create NewService(): %v", err)
		return nil, err
	}
	filter := fmt.Sprintf("id:%s*", str)
	if str == "" {
		filter = str
	}
	res, err := svc.Projects.List().Filter(filter).Do()
	if err != nil {
		log.Printf("getProjects(): Unable to create NewService(): %v", err)
		return nil, err
	}
	projects := make([]string, 0)
	for _, project := range res.Projects {
		log.Printf("id: %-50s name: %-20s\n", project.ProjectId, project.Name)
		projects = append(projects, project.ProjectId)
	}
	return projects, nil
}

// ProjectHandler invokes GetProjects and displays the result
// using http.ResponseWriter
func ProjectHandler(w http.ResponseWriter, r *http.Request) {
	log.Printf("projectHandler() executing...")
	vars := mux.Vars(r)
	filter := vars["projectid"]
	log.Printf("projectHandler().filter: %s", filter)
	ctx := appengine.NewContext(r)
	projects, err := GetProjects(ctx, filter)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		log.Printf("GetProjects() failed: %v", err)
	}
	b, err := json.Marshal(projects)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		fmt.Println(err)
	}
	//log.Printf("projectHandler().json: %s", string(b))
	w.Header().Set("Content-Type", "application/json")
	w.Write(b)
	log.Printf("projectHandler() completed")
}
