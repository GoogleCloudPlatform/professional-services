#Sample namespace for container
resource "kubernetes_namespace" "product" {
  metadata {
    name = var.product_name
  }
}