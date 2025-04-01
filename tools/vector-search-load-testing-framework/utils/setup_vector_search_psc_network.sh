#!/bin/bash
# setup_vector_search_psc_network.sh
# Script to set up VPC, subnet, and PSC for Vector Search load testing

# Exit on error
set -e

# Configuration - REPLACE THESE VALUES
PROJECT_ID="your-project-id" # Replace with your GCP project I
REGION="us-central1"
VPC_NAME="vertex-psc-network"
SUBNET_NAME="vertex-psc-subnet"
SUBNET_RANGE="10.0.0.0/24"
PSC_POLICY_NAME="vertex-psc-policy"

# Print configuration
echo "Setting up PSC for Vector Search with the following configuration:"
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "VPC Name: $VPC_NAME"
echo "Subnet Name: $SUBNET_NAME"
echo "Subnet Range: $SUBNET_RANGE"
echo "PSC Policy Name: $PSC_POLICY_NAME"
echo ""

# Create VPC Network if it doesn't exist
if ! gcloud compute networks describe $VPC_NAME --project=$PROJECT_ID &>/dev/null; then
  echo "Creating VPC network..."
  gcloud compute networks create $VPC_NAME \
      --project=$PROJECT_ID \
      --subnet-mode=custom
else
  echo "VPC network $VPC_NAME already exists"
fi

# Create Subnet if it doesn't exist
if ! gcloud compute networks subnets describe $SUBNET_NAME --region=$REGION --project=$PROJECT_ID &>/dev/null; then
  echo "Creating subnet..."
  gcloud compute networks subnets create $SUBNET_NAME \
      --project=$PROJECT_ID \
      --network=$VPC_NAME \
      --region=$REGION \
      --range=$SUBNET_RANGE \
      --enable-private-ip-google-access \
      --purpose=PRIVATE
else
  echo "Subnet $SUBNET_NAME already exists"
fi

# Create Firewall Rules
echo "Creating firewall rules..."

# Allow internal communication within the VPC
if ! gcloud compute firewall-rules describe allow-internal-$VPC_NAME --project=$PROJECT_ID &>/dev/null; then
  echo "Creating allow-internal-$VPC_NAME firewall rule..."
  gcloud compute firewall-rules create allow-internal-$VPC_NAME \
      --project=$PROJECT_ID \
      --network=$VPC_NAME \
      --action=ALLOW \
      --rules=tcp,udp,icmp \
      --source-ranges=$SUBNET_RANGE
else
  echo "Firewall rule allow-internal-$VPC_NAME already exists"
fi

# Allow traffic from GKE to Vertex AI (HTTP/HTTPS)
if ! gcloud compute firewall-rules describe allow-gke-to-vertex-$VPC_NAME --project=$PROJECT_ID &>/dev/null; then
  echo "Creating allow-gke-to-vertex-$VPC_NAME firewall rule..."
  gcloud compute firewall-rules create allow-gke-to-vertex-$VPC_NAME \
      --project=$PROJECT_ID \
      --network=$VPC_NAME \
      --action=ALLOW \
      --rules=tcp:443,tcp:8080-8090,tcp:8443 \
      --priority=1000 \
      --source-tags=gke-cluster \
      --target-tags=vertex-endpoint
else
  echo "Firewall rule allow-gke-to-vertex-$VPC_NAME already exists"
fi

# Allow health checks (required for some GCP services)
if ! gcloud compute firewall-rules describe allow-health-checks-$VPC_NAME --project=$PROJECT_ID &>/dev/null; then
  echo "Creating allow-health-checks-$VPC_NAME firewall rule..."
  gcloud compute firewall-rules create allow-health-checks-$VPC_NAME \
      --project=$PROJECT_ID \
      --network=$VPC_NAME \
      --action=ALLOW \
      --rules=tcp \
      --source-ranges=35.191.0.0/16,130.211.0.0/22 \
      --target-tags=vertex-endpoint
else
  echo "Firewall rule allow-health-checks-$VPC_NAME already exists"
fi

# Note about the PSC firewall rule being managed by Terraform
echo "NOTE: The 'allow-psc-for-vector-search' firewall rule will be created by Terraform."
echo "If you need to create it manually, please uncomment the code below."

# PSC firewall rule commented out since it will be managed by Terraform
: << "END_COMMENT"
if ! gcloud compute firewall-rules describe allow-psc-for-vector-search --project=$PROJECT_ID &>/dev/null; then
  echo "Creating allow-psc-for-vector-search firewall rule..."
  gcloud compute firewall-rules create allow-psc-for-vector-search \
      --project=$PROJECT_ID \
      --network=$VPC_NAME \
      --action=ALLOW \
      --rules=tcp:443,tcp:8080-8090,tcp:8443,tcp:10000 \
      --priority=1000 \
      --source-ranges=$SUBNET_RANGE \
      --destination-ranges=0.0.0.0/0
else
  echo "Firewall rule allow-psc-for-vector-search already exists"
fi
END_COMMENT

echo ""
echo "Setup complete!"
echo "VPC: $VPC_NAME"
echo "Subnet: $SUBNET_NAME"
echo "PSC Policy: $PSC_POLICY_NAME"
echo ""
echo "You can now deploy your Vector Search index with PSC support."