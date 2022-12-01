#!/usr/bin/env bash

# Run from repository root: ./hack/update-third-party-yaml.sh

# CSI Driver YAML
curl -L https://raw.githubusercontent.com/kubernetes-sigs/secrets-store-csi-driver/main/deploy/rbac-secretproviderclass.yaml > demo/csi/rbac-secretproviderclass.yaml
curl -L https://raw.githubusercontent.com/kubernetes-sigs/secrets-store-csi-driver/main/deploy/csidriver.yaml > demo/csi/csidriver.yaml
curl -L https://raw.githubusercontent.com/kubernetes-sigs/secrets-store-csi-driver/main/deploy/secrets-store.csi.x-k8s.io_secretproviderclasses.yaml > demo/csi/secrets-store.csi.x-k8s.io_secretproviderclasses.yaml
curl -L https://raw.githubusercontent.com/kubernetes-sigs/secrets-store-csi-driver/main/deploy/secrets-store.csi.x-k8s.io_secretproviderclasspodstatuses.yaml > demo/csi/secrets-store.csi.x-k8s.io_secretproviderclasspodstatuses.yaml
curl -L https://raw.githubusercontent.com/kubernetes-sigs/secrets-store-csi-driver/main/deploy/secrets-store-csi-driver.yaml > demo/csi/secrets-store-csi-driver.yaml

# Google Secret Manager YAML
curl -L https://raw.githubusercontent.com/GoogleCloudPlatform/secrets-store-csi-driver-provider-gcp/main/deploy/provider-gcp-plugin.yaml > demo/google-secret-provider/provider-gcp-plugin.yaml