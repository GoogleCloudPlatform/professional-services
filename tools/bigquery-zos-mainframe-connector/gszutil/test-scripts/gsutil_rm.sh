clear
export PROJECT_ID=$(gcloud config get-value project)
export BUCKET=$PROJECT_ID-test-storage
export INDSN=somefile

export SBT_OPTS=" -Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=5005"

cd ..
sbt "runMain com.google.cloud.bqsh.Bqsh" << EOF
gsutil rm gs://$BUCKET/EXPORT/$INDSN --recursive=true
EOF

