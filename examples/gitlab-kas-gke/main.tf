locals {
  namespace_name       = var.gitlab_agent
  service_account_name = var.gitlab_agent
  role_name_prefix     = var.gitlab_agent
  agent_name           = var.gitlab_agent
  gitlab_repo          = var.gitlab_repo_name
}

#####################################
#######   KUBERNETES CONFIG  ########
#####################################

// Create namespace
resource "kubernetes_namespace_v1" "gitlab" {
  metadata {
    annotations = {
      name = local.namespace_name
    }
    labels = {
      name = local.namespace_name
    }
    name = local.namespace_name
  }
}

// Create service account for Gitlab agent to use
resource "kubernetes_service_account_v1" "gitlab" {
  metadata {
    name      = local.service_account_name
    namespace = kubernetes_namespace_v1.gitlab.metadata.0.name
  }
}

// Create roles for Gitlab service account
resource "kubernetes_role_v1" "gitlab_agent-write_cm" {
  metadata {
    name      = format("%s-%s", local.role_name_prefix, "write-cm")
    namespace = kubernetes_namespace_v1.gitlab.metadata.0.name
  }

  rule {
    api_groups = [""]
    resources  = ["configmaps"]
    verbs      = ["create", "update", "delete", "patch"]
  }
}


resource "kubernetes_cluster_role_v1" "gitlab-kubernetes-agent-write-cm" {
  metadata {
    name = format("%s-%s", local.role_name_prefix, "write-cm")
  }
  rule {
    api_groups = [""]
    resources  = ["configmaps", ]
    verbs      = ["get", "list", "watch", "create"]
  }
}


resource "kubernetes_cluster_role_binding_v1" "gitlab-kubernetes-agent-write-cm" {
  metadata {
    name = format("%s-%s", kubernetes_role_v1.gitlab_agent-write_cm.metadata.0.name, "binding")
  }

  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind      = "ClusterRole"
    name      = kubernetes_cluster_role_v1.gitlab-kubernetes-agent-write-cm.metadata.0.name
  }
  subject {
    kind      = "ServiceAccount"
    name      = kubernetes_service_account_v1.gitlab.metadata.0.name
    namespace = kubernetes_namespace_v1.gitlab.metadata.0.name
  }
}



resource "kubernetes_role_v1" "gitlab_agent-read_cm" {
  metadata {
    name      = format("%s-%s", local.role_name_prefix, "read-cm")
    namespace = kubernetes_namespace_v1.gitlab.metadata.0.name
  }

  rule {
    api_groups = [""]
    resources  = ["configmaps"]
    verbs      = ["get", "list", "watch"]
  }
}

resource "kubernetes_role_binding_v1" "gitlab_agent-write_cm" {
  metadata {
    name      = format("%s-%s", kubernetes_role_v1.gitlab_agent-write_cm.metadata.0.name, "binding")
    namespace = kubernetes_namespace_v1.gitlab.metadata.0.name
  }
  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind      = "Role"
    name      = kubernetes_role_v1.gitlab_agent-write_cm.metadata.0.name
  }
  subject {
    kind      = "ServiceAccount"
    name      = kubernetes_service_account_v1.gitlab.metadata.0.name
    namespace = kubernetes_namespace_v1.gitlab.metadata.0.name
  }
}

resource "kubernetes_role_binding_v1" "gitlab_agent-read_cm" {
  metadata {
    name      = format("%s-%s", kubernetes_role_v1.gitlab_agent-read_cm.metadata.0.name, "binding")
    namespace = kubernetes_namespace_v1.gitlab.metadata.0.name
  }
  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind      = "Role"
    name      = kubernetes_role_v1.gitlab_agent-read_cm.metadata.0.name
  }
  subject {
    kind      = "ServiceAccount"
    name      = kubernetes_service_account_v1.gitlab.metadata.0.name
    namespace = kubernetes_namespace_v1.gitlab.metadata.0.name
  }
}

resource "kubernetes_role_v1" "gitlab_agent-write" {
  metadata {
    name      = format("%s-%s", local.role_name_prefix, "write")
    namespace = kubernetes_namespace_v1.gitlab.metadata.0.name
  }

  rule {
    api_groups = ["*"]
    resources  = ["*"]
    verbs      = ["create", "update", "delete", "patch", "write"]
  }
}

resource "kubernetes_role_binding_v1" "gitlab_agent-write" {
  metadata {
    name      = format("%s-%s", kubernetes_role_v1.gitlab_agent-write.metadata.0.name, "binding")
    namespace = kubernetes_namespace_v1.gitlab.metadata.0.name
  }
  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind      = "Role"
    name      = kubernetes_role_v1.gitlab_agent-write.metadata.0.name
  }
  subject {
    kind      = "ServiceAccount"
    name      = kubernetes_service_account_v1.gitlab.metadata.0.name
    namespace = kubernetes_namespace_v1.gitlab.metadata.0.name
  }
}

resource "kubernetes_role_v1" "gitlab_agent-read" {
  metadata {
    name      = format("%s-%s", local.role_name_prefix, "read")
    namespace = kubernetes_namespace_v1.gitlab.metadata.0.name
  }

  rule {
    api_groups = ["*"]
    resources  = ["*"]
    verbs      = ["get", "list", "watch"]
  }
}

resource "kubernetes_role_binding_v1" "gitlab_agent-read" {
  metadata {
    name      = format("%s-%s", kubernetes_role_v1.gitlab_agent-read.metadata.0.name, "binding")
    namespace = kubernetes_namespace_v1.gitlab.metadata.0.name
  }
  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind      = "Role"
    name      = kubernetes_role_v1.gitlab_agent-read.metadata.0.name
  }
  subject {
    kind      = "ServiceAccount"
    name      = kubernetes_service_account_v1.gitlab.metadata.0.name
    namespace = kubernetes_namespace_v1.gitlab.metadata.0.name
  }
}

resource "kubernetes_role_v1" "gitlab_agent-write-product_namespace" {
  metadata {
    name      = format("%s-%s-%s", local.role_name_prefix, var.product_name, "write")
    namespace = var.product_name
  }

  rule {
    api_groups = ["*"]
    resources  = ["*"]
    verbs      = ["create", "update", "delete", "patch"]
  }

  depends_on = [
    kubernetes_namespace.product
  ]
}

resource "kubernetes_role_binding_v1" "gitlab_agent-write-product_namespace" {
  metadata {
    name      = format("%s-%s", var.product_name, "binding")
    namespace = var.product_name
  }
  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind      = "Role"
    name      = kubernetes_role_v1.gitlab_agent-write-product_namespace.metadata.0.name
  }
  subject {
    kind      = "ServiceAccount"
    name      = kubernetes_service_account_v1.gitlab.metadata.0.name
    namespace = kubernetes_namespace_v1.gitlab.metadata.0.name
  }

  depends_on = [
    kubernetes_namespace.product
  ]
}

resource "kubernetes_role_v1" "gitlab_agent-read-product_namespace" {
  metadata {
    name      = format("%s-%s-%s", local.role_name_prefix, var.product_name, "read")
    namespace = var.product_name
  }

  rule {
    api_groups = ["*"]
    resources  = ["*"]
    verbs      = ["get", "list", "watch"]
  }
  depends_on = [
    kubernetes_namespace.product
  ]
}

resource "kubernetes_role_binding_v1" "gitlab_agent-read-product_namespace" {
  metadata {
    name      = format("%s-%s", kubernetes_role_v1.gitlab_agent-read-product_namespace.metadata.0.name, "binding")
    namespace = var.product_name
  }
  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind      = "Role"
    name      = kubernetes_role_v1.gitlab_agent-read-product_namespace.metadata.0.name
  }
  subject {
    kind      = "ServiceAccount"
    name      = kubernetes_service_account_v1.gitlab.metadata.0.name
    namespace = kubernetes_namespace_v1.gitlab.metadata.0.name
  }
  depends_on = [
    kubernetes_namespace.product
  ]
}

#####################################
#######     GITLAB CONFIG    ########
#####################################

// Create cluster agent in Gitlab
resource "gitlab_cluster_agent" "this" {
  project = local.gitlab_repo
  name    = local.agent_name
}

// Create a config file in Gitlab project that agent will use
resource "gitlab_repository_file" "agent_config" {
  project   = gitlab_cluster_agent.this.project
  branch    = "main"
  file_path = ".gitlab/agents/${local.agent_name}/config.yaml"
  content = templatefile(
    "${path.module}/templates/agent-config.yaml.tpl", {
      gitlab_project = local.gitlab_repo
    }
  )
  author_email   = var.config_author_email
  author_name    = var.config_author_name
  commit_message = "feature: add agent config for ${gitlab_cluster_agent.this.name}"
}

// Create token to be passed to Helm chart for install
resource "gitlab_cluster_agent_token" "this" {
  project     = gitlab_cluster_agent.this.project
  agent_id    = gitlab_cluster_agent.this.agent_id
  name        = "GitLab Token"
  description = "GitLab Token created by Terraform"
}

locals {
  gitlab_agent_chart_values = {
    "image.repository"      = var.agentk_image_url
    "image.tag"             = var.agentk_image_tag
    "config.token"          = gitlab_cluster_agent_token.this.token
    "config.kasAddress"     = var.kas_address
    "serviceAccount.create" = false
    "rbac.create"           = false
    "serviceAccount.name"   = kubernetes_service_account_v1.gitlab.metadata.0.name
    # HTTP Proxy settings, if there is proxy between the cluster hosting the agent and accessing the Gitlab server
    # https://docs.gitlab.com/ee/user/clusters/agent/install/#use-the-agent-behind-an-http-proxy
    # "extraEnv[0].name" = "HTTPS_PROXY"
    # "extraEnv[0].value" = http://<IP of Proxy>:<Port>
    # "extraEnv[1].name" = "NO_PROXY"
    # "extraEnv[1].value" = "<cluster non_masq_cidr1>\\,<cluster non_masq_cidr2>\\,.cluster.local\\,.svc"
  }
}

// Install Gitlab agent Helm chart
resource "helm_release" "gitlab_agent" {
  name       = var.product_name
  repository = var.gitlab_agent_chart_repo
  chart      = var.gitlab_agent_chart_name
  namespace  = kubernetes_namespace_v1.gitlab.metadata.0.name

  dynamic "set" {
    for_each = local.gitlab_agent_chart_values
    content {
      name  = set.key
      value = set.value
    }
  }

  depends_on = [
    kubernetes_namespace.product
  ]
}
