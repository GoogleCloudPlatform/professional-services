#!/bin/bash

ART_USER=""
ART_PASSWD=""
ART_URL=""

IMAGES="gcr.io/gke-on-prem-release/kube-controller-manager-amd64:v1.22.8-gke.200 \
	gcr.io/gke-on-prem-release/cluster-autoscaler-amd64:v1.21.0-gke.5 \
	gcr.io/gke-on-prem-release/cilium/cilium:v1.11.1-anthos1.11-gke3.4.7 \
       	gcr.io/gke-on-prem-release/onprem-user-cluster-controller:1.11.1-gke.53 \
	gcr.io/gke-on-prem-release/node-firewall-controller:v0.0.20 \
	gcr.io/gke-on-prem-release/antrea-amd64:v1.2.0-gke.18 \
	gcr.io/gke-on-prem-release/k8s-gmsa-webhook:release-0.3.0-gke.0 \
	gcr.io/gke-on-prem-release/proxy-agent-amd64:v0.0.25-gke.0 \
	gcr.io/gke-on-prem-release/k8s-dns-kube-dns-amd64:1.22.2-gke.0 \
	gcr.io/gke-on-prem-release/snapshot-controller:v4.2.1-gke.0 \
	gcr.io/gke-on-prem-release/calico/cni:v3.19.1-gke.0 \
	gcr.io/gke-on-prem-release/clusterdns-controller:gke_clusterdns_controller_20210908.00_p0 \
	gcr.io/gke-on-prem-release/metallb/speaker:v0.9.6-gke.0 \
	gcr.io/gke-on-prem-release/windows-webhook:v0.1.0-gke.6 \
	gcr.io/gke-on-prem-release/ang/ang-daemon:1.0.7-gke.1 \
	gcr.io/gke-on-prem-release/whereabouts:v0.3.1-gke.9 \
	gcr.io/gke-on-prem-release/kube-proxy-amd64:v1.22.8-gke.200 \
	gcr.io/gke-on-prem-release/csi-node-driver-registrar:v2.3.0-gke.1 \
	gcr.io/gke-on-prem-release/cluster-metrics-webhook:v0.1.0-gke.5 \
	gcr.io/gke-on-prem-release/kube-scheduler-amd64:v1.22.8-gke.200 \
	gcr.io/gke-on-prem-release/csi-provisioner:v3.0.0-gke.1 \
	gcr.io/gke-on-prem-release/auto-resize-controller:1.11.1-gke.53 \
	gcr.io/gke-on-prem-release/gke-resource-tracker:v0.12.0 \
	gcr.io/gke-on-prem-release/cilium/operator:v1.11.1-anthos1.11-gke3.4.7 \
	gcr.io/gke-on-prem-release/ang/ang-manager:1.0.7-gke.1 \
	gcr.io/gke-on-prem-release/nad-admission-control:v1.1.1-gke.3 \
	gcr.io/gke-on-prem-release/seesaw-group-controller:1.11.1-gke.53 \
	gcr.io/gke-on-prem-release/kube-rbac-proxy:v0.6.0-gke.0 \
	gcr.io/gke-on-prem-release/cluster-proportional-autoscaler-amd64:1.8.1-gke.0 \
	gcr.io/gke-on-prem-release/seesaw-vserver-controller:1.11.1-gke.53 \
	gcr.io/gke-on-prem-release/calico/typha:v3.19.1-gke.0 \
	gcr.io/gke-on-prem-release/load-balancer-f5:1.11.1-gke.53 \
	gcr.io/gke-on-prem-release/vsphere-metrics-exporter:1.11.1-gke.53 \
	gcr.io/gke-on-prem-release/vsphere-csi-syncer:v2.4.0-gke.0 \
	gcr.io/gke-on-prem-release/k8s-dns-sidecar-amd64:1.22.2-gke.0 \
	gcr.io/gke-on-prem-release/controller-manager:1.11.1-gke.53 \
	gcr.io/gke-on-prem-release/k8s-bigip-ctlr:v1.14.0-gke.10 \
	gcr.io/gke-on-prem-release/etcddefrag:gke_master_etcddefrag_20210802.00_p0 \
	gcr.io/gke-on-prem-release/ais:hybrid_identity_charon_20220307_RC02 \
	gcr.io/gke-on-prem-release/etcd:v3.4.13-1-gke.3 \
	gcr.io/gke-on-prem-release/oidc_proxy:onprem_idp_proxy_20200601_RC00 \
	gcr.io/gke-on-prem-release/asm/pilot:1.13.2-asm.2-distroless \
	gcr.io/gke-on-prem-release/k8s-dns-dnsmasq-nanny-amd64:1.22.2-gke.0 \
	gcr.io/gke-on-prem-release/calico/node:v3.19.1-gke.7 \
	gcr.io/gke-on-prem-release/csi-snapshot-validation-webhook:v4.2.1-gke.0 \
	gcr.io/gke-on-prem-release/vsphere-controller-manager:1.11.1-gke.53 \
	gcr.io/gke-on-prem-release/preflight:1.11.1-gke.53 \
	gcr.io/gke-on-prem-release/calico-controller-manager:1.11.1-gke.53 \
	gcr.io/gke-on-prem-release/ang/vpn-daemon:1.0.7-gke.1 \
	gcr.io/gke-on-prem-release/asm/proxyv2:1.13.2-asm.2-distroless \
	gcr.io/gke-on-prem-release/cluster-proportional-autoscaler-amd64:1.8.4-gke.1 \
	gcr.io/gke-on-prem-release/coredns:v1.8.0-gke.1 \
	gcr.io/gke-on-prem-release/kube-apiserver-amd64:v1.22.8-gke.200 \
	gcr.io/gke-on-prem-release/csi-resizer:v1.3.0-gke.0 \
	gcr.io/gke-on-prem-release/vsphere-csi-driver:v2.4.0-gke.0 \
	gcr.io/gke-on-prem-release/auditproxy:gke_master_auditproxy_20201115_RC00 \
	gcr.io/gke-on-prem-release/cluster-health-controller:1.11.1-gke.53 \
	gcr.io/gke-on-prem-release/monitoring-operator:v1.11.1-gke.10 \
	gcr.io/gke-on-prem-release/metallb/controller:v0.9.6-gke.0 \
	gcr.io/gke-on-prem-release/multus-cni:v3.8.1-gke.6 \
	gcr.io/gke-on-prem-release/net-res-injector:v1.1.0-gke.6 \
	gcr.io/gke-on-prem-release/asm/proxyv2:1.13.2-asm.5 \
	gcr.io/gke-on-prem-release/metrics-server-operator:v1.11.1-gke.10 \
	gcr.io/gke-on-prem-release/csi-attacher:v3.3.0-gke.0 \
	gcr.io/gke-on-prem-release/ang/bgp-daemon:1.0.7-gke.1 \
	gcr.io/gke-on-prem-release/stackdriver-operator:v1.11.1-gke.10 \
	gcr.io/gke-on-prem-release/addon-resizer:1.8.14-gke.0 \
	gcr.io/gke-on-prem-release/k8s-prometheus-adapter-amd64:v0.7.0-gke.6 \
	gcr.io/gke-on-prem-release/etcd-amd64:v3.4.13-1-gke.3 \
	gcr.io/gke-on-prem-release/etcd-util:1.11.1-gke.53 \
	gcr.io/gke-on-prem-release/fluent-bit:v1.8.12-gke.3 \
	gcr.io/gke-on-prem-release/gkeconnect-gce:20220211-01-00 \
	gcr.io/gke-on-prem-release/grafana:5.4.5-distroless-gke.6 \
	gcr.io/gke-on-prem-release/cert-manager-cainjector:v1.5.4-gke.0 \
	gcr.io/gke-on-prem-release/cert-manager-controller:v1.5.4-gke.0 \
	gcr.io/gke-on-prem-release/cert-manager-webhook:v1.5.4-gke.0 \
	gcr.io/gke-on-prem-release/kindest/node:v0.11.1-gke.32-v1.22.6-gke.2100 \
	gcr.io/gke-on-prem-release/kube-state-metrics:2.4.1-gke.1 \
	gcr.io/gke-on-prem-release/anthos-metadata-agent:1.1.4-gke.0 \
	gcr.io/gke-on-prem-release/metadata-agent-go:1.2.0 \
	gcr.io/gke-on-prem-release/pause-amd64:3.1-gke.5 \
	gcr.io/gke-on-prem-release/prometheus-alertmanager:0.21.0-gke.3 \
	gcr.io/gke-on-prem-release/prometheus-nodeexporter:1.0.1-gke.4 \
	gcr.io/gke-on-prem-release/prometheus-reloader:v1.0.25 \
	gcr.io/gke-on-prem-release/prometheus:2.18.1-gke.8 \
	gcr.io/gke-on-prem-release/pushprox-client:v0.0.5 \
	gcr.io/gke-on-prem-release/pushprox-proxy:v0.0.5 \
	gcr.io/gke-on-prem-release/stackdriver-prometheus-sidecar:0.8.0-gke.0 \
	gcr.io/gke-on-prem-release/gke-metrics-agent:1.1.0-anthos.10 \
	gcr.io/gke-on-prem-release/metrics-server-amd64:v0.4.5-gke.0 \
	gcr.io/gke-on-prem-release/target-discovery:v1.0.23 \
	gcr.io/gke-on-prem-release/debug-toolbox:v0.0.23 \
	gcr.io/gke-on-prem-release/hsm-kms-plugin:v0.0.28-gke.0 \
	gcr.io/gke-on-prem-release/proxy-server-amd64:v0.0.24-gke.0"

# Pull images from public Google Container Registry 
for gcr_im in ${IMAGES}; do
  echo "Pulling ${gcr_im}"
  docker pull ${gcr_im}
done

# Login to private Artifactory
docker login -u ${ART_USER} -p ${ART_PASSWD}

# Tag GCR images and push them to private Artifactory
for im in ${IMAGES}; do
  im_name="${im##*/}"
  echo "${im_name}"
  art_name="${ART_URL}/${im_name}"
  echo "Tagging ${im} as ${art_name}"
  docker tag ${im} ${art_name}
  echo "Pushing image ${art_name}"
  docker push ${art_name}
done
