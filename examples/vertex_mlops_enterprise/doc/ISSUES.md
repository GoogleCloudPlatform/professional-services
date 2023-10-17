
# Issues when running Github actions:
``` 
ERROR: (gcloud.builds.submit) There was a problem refreshing your current auth tokens: ('Unable to acquire impersonated credentials', '{\n  "error": {\n    "code": 403,\n    "message": "Permission \'iam.serviceAccounts.getAccessToken\' denied on resource (or it may not exist).",\n    "status": "PERMISSION_DENIED",\n    "details": [\n      {\n        "@type": "type.googleapis.com/google.rpc.ErrorInfo",\n        "reason": "IAM_PERMISSION_DENIED",\n        "domain": "iam.googleapis.com",\n        "metadata": {\n          "permission": "iam.serviceAccounts.getAccessToken"\n        }\n      }\n    ]\n  }\n}\n')
```

Make sure that the `github` variable has been setup correctly: `organization` or `repo` should match the Github user/organization and repo name.



# Issues when running Vertex Pipeline:
`Failed to create pipeline job. Error: Vertex AI Service Agent service-nnnnn@gcp-sa-aiplatform-cc.iam.gserviceaccount.com does not have permission to access Artifact Registry repository projects/PROJECT_ID/locations/europe-west4/repositories/docker-repo`

This happens the first time runing a Vertex Pipeline job since the Vertex SA is not still enabled. Re-run again the trigger to launch the job.

