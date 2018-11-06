# Installing Istio on GKE

## Installation Steps  

1. Create a GKE Cluster via this TerraForm project [https://github.com/acme/gke-k8s-terraform](https://www.google.com/url?q=https://github.com/acme/gke-k8s-terraform&sa=D&ust=1537920345228000)
1. Download a release of istio ```curl-L https://git.io/getLatestIstio | sh -```
1. ```$ cd istio-1.0.2```
1. Add the istioctl client to your PATH environment variable, on a macOS or Linux system ```$ export PATH\=$PWD/bin:$PATH```
1. Install with Helm and Tiller via helm install. This option allows Helm and [Tiller](https://www.google.com/url?q=https://github.com/kubernetes/helm/blob/master/docs/architecture.md%23components&sa=D&ust=1537920345230000) to manage the lifecycle of Istio.  
1. If a service account has not already been installed for Tiller, install one ```$ kubectl apply -f install/kubernetes/helm/helm-service-account.yaml```
1. Install Tiller on your cluster with the service account `$ helm init --service-account tiller`  
1. Install Istio `$ helminstall install/kubernetes/helm/istio --name istio --namespace istio-system`

//todo: build in TLS MA  https://docs.helm.sh/using\_helm/#securing-your-helm-installation