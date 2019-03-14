// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// This code is a prototype and not engineered for production use.
// Error handling is incomplete or inappropriate for usage beyond
// a development sample.

package bqnotifier

import "fmt"

const (
	consoleFmt = "https://console.cloud.google.com/bigquery?project=%s&j=bq:%s:%s&page=queryresults"
	nameFmt = "%s:%s.%s"
	bquiFmt = "https://bigquery.cloud.google.com/results/%s:%s.%s"
)

type Job struct {
	ProtoPayload struct {
		AuthenticationInfo struct {
			PrincipalEmail string
		}
		ServiceData struct {
			JobCompletedEvent struct {
				Job struct {
					JobConfiguration struct {
						Labels map[string]string
						Query struct {
							Query string
						}
					}
					JobName struct {
						JobId     string
						Location  string
						ProjectId string
					}
					JobStatus struct {
						State string
						Error struct {
							Code    int
							Message string
						}
						AdditionalErrors []struct {
							Code    int
							Message string
						}
					}
				}
			}
		}
	}
}

func (j *Job) FmtName(format string) string {
	name := j.ProtoPayload.ServiceData.JobCompletedEvent.Job.JobName
	return fmt.Sprintf(format, name.ProjectId, name.Location, name.JobId)
}

func (j *Job) String() string {
	return j.FmtName(nameFmt)
}

func (j *Job) ConsoleURL() string  {
	return j.FmtName(consoleFmt)
}

func (j *Job) BqUiURL() string {
	return j.FmtName(bquiFmt)
}

func (j *Job) UserEmail() string {
	return j.ProtoPayload.AuthenticationInfo.PrincipalEmail
}

func (j *Job) IsError() bool {
	status := j.ProtoPayload.ServiceData.JobCompletedEvent.Job.JobStatus
	if status.Error.Code != 0 {
		return true
	}
	if status.AdditionalErrors != nil {
		for _, err := range status.AdditionalErrors {
			if err.Code != 0 {
				return true
			}
		}
	}
	return false
}

func (j *Job) Labels() map[string]string {
	return j.ProtoPayload.ServiceData.JobCompletedEvent.Job.JobConfiguration.Labels
}

func (j *Job) IsQuery() bool {
	return j.ProtoPayload.ServiceData.JobCompletedEvent.Job.JobConfiguration.Query.Query != ""
}

func (j *Job) Query() string {
	return j.ProtoPayload.ServiceData.JobCompletedEvent.Job.JobConfiguration.Query.Query
}

func (j *Job) Error() string {
	status := j.ProtoPayload.ServiceData.JobCompletedEvent.Job.JobStatus
	resp := status.Error.Message
	if status.AdditionalErrors != nil {
		for _, err := range status.AdditionalErrors {
			resp += ", "
			resp += err.Message
		}
	}
	return resp
}

