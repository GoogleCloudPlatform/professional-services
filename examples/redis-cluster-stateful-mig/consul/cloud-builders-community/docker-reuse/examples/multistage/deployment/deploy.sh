#!/bin/sh

echo "Applying server deployment configuration:"

cat <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: server-deployment
  labels:
    app: server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: server
  template:
    metadata:
      labels:
        app: server
    spec:
      containers:
      - name: server
        image: [server-image]
        ports:
        - containerPort: 8080
EOF
