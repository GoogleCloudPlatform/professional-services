package bqnotifier

// This code is a prototype and not engineered for production use.
// Error handling is incomplete or inappropriate for usage beyond
// a development sample.

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

