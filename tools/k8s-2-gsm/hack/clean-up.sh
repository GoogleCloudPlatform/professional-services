#!/usr/bin/env bash

# Run from repository root: ./hack/clean-up.sh
kubectl delete job migrate-secrets
kubectl delete pod secret-demo
kubectl delete pod secret-demo-2

# from README
kubectl delete -n "${K8S_NAMESPACE}" job/migrate-secrets