# Twistlock Deployment Notes

Because GCP ASM is built upon Istio service mesh for Kubernetes, Twistlock deployment on GCP ASM follows Twistlock's instruction of installation for Istio environment in general. 

**NOTE:** Installing Prisma Cloud (Twistlock) SaaS on Kubernetes requires the use of a bearer token. This can be seen in the installation script [twistlock/install_defender.sh](install_defender.sh). Please see the [installation instructions](https://docs.paloaltonetworks.com/prisma/prisma-cloud/prisma-cloud-admin-compute/install/install_kubernetes.html) for more details.

### 1. Twistlock architecture for Kubernetes

Twistlock includes components: 
- __Twistlock Console__, Twistlock Console serves as the user interface within Twistlock. The graphical user interface (GUI) lets you define policy, configure and control your Twistlock deployment, and view the overall health (from a security perspective) of your container environment.
- __Twistlock Defender__, Twistlock Defenders enforce the policies defined in Console and send event data up to the Console for correlation. 

Please refer to page #12 of [Twistlock Reference Architecture](https://cdn.twistlock.com/docs/downloads/Twistlock-Reference-Architecture.pdf) for the high level Twistlock architecture for Kubernetes.

### 2. Twistlock license types

Currently, Twistlock provides **on-prem** license and **SaaS** license. The on-prem license will enable user to install the full balloon of Twistlock system, which includes other Console and Defenders. The SaaS license provides a pre-deployed Twistlock Console in Prisma's cloud environment. User only needs to deploy Defenders to user's network environment, and the Defender will automatically connect to Cloud-based Console via SSL connectoin (port 443). Since we only have SaaS license for our PoC, we only deployed Defenders to our Anthos GKE clusters. 

### 3. Twistlock Deployment

Before our deployment, please refer to [Twistlock Istio Configuration Instruction](https://docs.twistlock.com/docs/compute_edition/howto/configure_istio_ingress.html#overview) to get familiar with how Twistlock system (Console and Defenders) is deployed with Istio. It will be very helpful for understanding our deployment steps below. 

#### 3.1 Create twistlock namespace

Create twistlock namespace on your target cluster(s)

```
kubectl create namespace twistlock
```

#### 3.2 Label twistlock namespace for Istio injection

This step is the same as with using Open Source Istio. However, we will add Anthos ASM revision when we label the namespace. 

```
# Find out Anthos ASM revision. In the output, under the LABELS column, 
# note the value of the istiod revision label, which follows the prefix istio.io/rev=. 
# In this example, the value is asm-173-6. Use the revision value in the steps in the next section.

kubectl -n istio-system get pods -l app=istiod --show-labels

# Please note "istio.io/rev=asm-173-6" in the command

kubectl label namespace twistlock istio-injection- istio.io/rev=asm-173-6 --overwrite
```

#### 3.3 Deploy Twistlock Console

In this step, we should deploy Twistlock Console if we use on-prem license. In our PoC, we skip this step because we are using SaaS license. We will just need to log into Twistlock Console in Prisma Cloud. 

#### 3.4 Set up the "twistcli" tool

In Twislock Console, navigate to __Compute__ -> __Manage__ -> __System__, then click __Download__ tab to download twistcli tool for the right OS system. Put this tool to the bastion server which we can run your "kubectl" to deploy services to your target cluster. 

#### 3.5 Install Twistlock Defender

In Twistlock Console, navigate to __Compute__-> __Manage__ -> __Defenders__, then click __Deploy__ tab -> __DaemonSet__ subtab, and copy the install command for the correct OS system in section 11. 

Run the copied command from the location where you set up "**twistcli**" tool in last section. 

#### 3.6 Verify that Defenders have been successfully deployed

1. Check that there is one daemon pod on each node of your cluster. 
```
kubectl get pods -n twistlock
```

2. Navigate back in Twistlock Cloud, and go to __Compute__ -> __Radars__ -> __Hosts__, you should see your cluster nodes are monitored there. 

3. Still in Twistlock Cloud, go to __Compute__ -> __Radars__ -> __Containers__, you should see containers on your clusters are monitored there. 

You have successfully deployed Twistlock with Google Anthos.  
