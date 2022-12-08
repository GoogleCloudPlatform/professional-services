# Storage API

This application it is a RESTful API that let's you manage the Google Cloud Storage buckets available is a project. In order to do so the application needs to authenticate with a service account that has been granted the Storage Admin (`roles/storage.admin`) role. 

Find below the operations that can be performed using it:

* Get buckets in project

        curl -v http://localhost:3000/buckets

* Get files in bucket

        curl -v http://localhost:3000/buckets/BUCKET_NAME

* Create a bucket

        curl -v http://localhost:3000/buckets \
        -H'Content-Type: application/json' \
        -d  @- <<EOF
        {
            "name": "BUCKET_NAME"
        }
        EOF

* Delete bucket

        curl -v -X DELETE http://localhost:3000/buckets/BUCKET_NAME