# Customize variables as needed

# Terraform debug logging. 
# Comment these two variables out if not running on local
export TF_LOG="TRACE"
export TF_LOG_PATH=~/terraform.log

export TF_VAR_project_id="your-project-id" # Replace with your project ID

# The directory of this project
export SRC_PATH=~/asm-private-multiclusters-intranet
export TF_VAR_source_path=~/asm-private-multiclusters-intranet

# The work directory for installation
export WORK_DIR=~/

# Bastion server information
export BASTION_IP="10.0.0.3"

# Leave this version number as it is for now
export ASM_MAJOR_VER=1
export ASM_MINOR_VER=7
export ASM_POINT_NUM=3
export ASM_REV_NUM=6

export ASM_VERSION="istio-${ASM_MAJOR_VER}.${ASM_MINOR_VER}.${ASM_POINT_NUM}-asm.${ASM_REV_NUM}"
export ASM_REVISION="asm-${ASM_MAJOR_VER}${ASM_MINOR_VER}${ASM_POINT_NUM}-${ASM_REV_NUM}"
export ASM_PKG_TYPE="linux-amd64"

# Cluster information
export PREFIX="asm"

export CLUSTER1_LOCATION="us-west2"
export CLUSTER2_LOCATION="us-west2"

export CLUSTER1_CLUSTER_NAME=cluster3
export CLUSTER1_CLUSTER_CTX=cluster3

export CLUSTER2_CLUSTER_NAME=cluster4
export CLUSTER2_CLUSTER_CTX=cluster4

