# Considerations with VPC SC
## Cloud Build
Use Cloud Build [private pools](https://cloud.google.com/build/docs/private-pools/using-vpc-service-controls) or create a VPC SC ingress rule or [access level](https://cloud.google.com/access-context-manager/docs/create-basic-access-level#members-example) adding the Cloud Build Service Account (PROJECT_NUMBER@cloudbuild.gserviceaccount.com)




## Github
Create a VPC SC ingress rule adding Github service account (sa-github@PROJECT_ID.iam.gserviceaccount.com)  or [access level](https://cloud.google.com/access-context-manager/docs/create-basic-access-level#members-example)



