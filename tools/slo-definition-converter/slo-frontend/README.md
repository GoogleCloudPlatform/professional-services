# SLO Tools - JSON Definition to TF Converter - Frontend

![Architecture](./images/architecture.png)

# Description

As per the  above architecture diagram, the resource marked as frontend will serve as the frontend for the slo tooling project.

This frontend currently converts GCP SLO definition to Terraform blocks for the same. Following are the possible SLO definitions one can encounter while creating SLOs in GCP:

1. Request based SLI
- Good Total Ratio
- Distribution cut

2. Window Based SLI
- Metrics Mean
- Metrics Sum
- Good Total Ratio Threshold

# Prerequisite

- A Google Cloud Project.
- Ensure gcloud is installed
- Ensure the one who do the work has the following project-level IAM role assigned:
  - `Editor`
  - `Project IAM Admin`
  - `Service Account Admin`
- Ensure latest Node and npm versions are installed.
  - Node should be > 21 & npm version  > 10
- Ensure git is installed

# Steps to run the Service

1. Clone the repository using the following command

```
git clone <repo_url>
```


2. First of all install and build the project using the following command

```
npm install
```
2. Then run the app using the following command:

```
npm run start
```

- Make sure you set the env variable  REACT_APP_API_URL=<Backend_url>

# Testing the service

1. Open the swagger page on the internet browser by the following url

```
http://localhost:3000
```

1. In the Enter Json add the following:


```javascript
{
  "name": "projects/628923456731/services/jobs-service-poc/serviceLevelObjectives/gdYycqjITAeVVuIS3zWNNQ",
  "displayName": "38 percent of Good request in the current calendar day",
  "goal": 0.38,
  "calendarPeriod": "DAY",
  "serviceLevelIndicator": {
    "requestBased": {
      "goodTotalRatio": {
        "goodServiceFilter": "metric.type=\"loadbalancing.googleapis.com/https/request_count\" resource.type=\"https_lb_rule\" metric.labels.response_code=\"200\" resource.labels.url_map_name=\"sldbxlb\"",
        "badServiceFilter": "metric.type=\"loadbalancing.googleapis.com/https/request_count\" resource.type=\"https_lb_rule\" resource.labels.url_map_name=\"sldbxlb\""
      }
    }
  }
}

```

3. You should get a response like this

```
resource "google_monitoring_slo" "slo" {
 # the basics
 service = ""
 slo_id = "38 percent of Good request in the current calendar day"
 display_name = "38 percent of Good request in the current calendar day"


 # the SLI
 request_based_sli {
   good_total_ratio {
     good_service_filter = join(" AND ", ["metric.type=\"loadbalancing.googleapis.com/https/request_count\"", "resource.type=\"https_lb_rule\"", "metric.labels.response_code=\"200\"", "resource.labels.url_map_name=\"sldbxlb\""])
     bad_service_filter = join(" AND ", ["metric.type=\"loadbalancing.googleapis.com/https/request_count\"", "resource.type=\"https_lb_rule\"", "resource.labels.url_map_name=\"sldbxlb\""])
   }
 }
  # the goal
 goal = 0.38
 calendar_period= "DAY"
}
```

# Deploying the service on cloud run

1. You need to run the following command from the cli to initialize the gcloud project locally:

```
gcloud init
```

2. Create a repository(artifact) so that you can deploy the docker image on GCP:

Here's the gcloud command to create an Artifact Registry repository, along with explanations and options:

Basic Command:

```Bash
gcloud artifacts repositories create REPOSITORY_NAME \
  --repository-format=FORMAT \
  --location=LOCATION 
```

Replace:

- REPOSITORY_NAME: The name you want to give your repository (e.g., my-maven-repo).
- FORMAT: The format of the artifacts you'll store (e.g., docker, maven, npm.
- LOCATION: The region where you want to create the repository (e.g., us-central1

3. Run the following command to deploy the docker image

```
gcloud builds submit -t <country>-docker.pkg.dev/<project_id>/<repo_dir> ./
```

For example:

```
gcloud builds submit -t us-docker.pkg.dev/arjun-demo-123/slotools/frontend ./
```
replace the placeholders appropriiately

4. Deploy the service from the docker image on cloud run using the following command

```
gcloud run deploy SERVICE_NAME \
  --image=<DOCKER_IMAGE_URL> \
  --platform=managed \
  --region=REGION \
  --allow-unauthenticated
```
- DOCKER_IMAGE_URL you can get from step 3










