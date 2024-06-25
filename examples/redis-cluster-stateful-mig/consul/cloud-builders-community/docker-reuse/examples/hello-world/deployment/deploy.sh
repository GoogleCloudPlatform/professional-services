#!/bin/sh

echo "Applying hello-world deployment configuration:"

cat <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hello-world-deployment
  labels:
    app: hello-world
spec:
  replicas: 3
  selector:
    matchLabels:
      app: hello-world
  template:
    metadata:
      labels:
        app: hello-world
    spec:
      containers:
      - name: hello-world
        image: IMAGE_PLACEHOLDER
        ports:
        - containerPort: 8080
EOF
