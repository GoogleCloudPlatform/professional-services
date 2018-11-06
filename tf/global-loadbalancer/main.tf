# Create a public ip for service
resource "google_compute_global_address" "default" {
  project    = "${var.project}"
  name       = "glb-${var.name}"
  ip_version = "IPV4"

  provisioner "local-exec" {
    interpreter = ["/bin/bash", "-c"]
    command = <<EOF
list=${join(",", var.instance_groups)};
for i in $${list//,/ }; do
  NAMEDPORTS=$(gcloud compute instance-groups get-named-ports $${i%%:*} \
    --zone $${i#*:} | grep -v PORT | awk '{printf "%s:%s",$1,$2}')
  [[ "$NAMEDPORTS" != "" ]] && NAMEDPORTS=",$${NAMEDPORTS}"
  gcloud compute instance-groups set-named-ports $${i%%:*} \
    --named-ports ${var.details["name"]}:${var.details["port"]}$${NAMEDPORTS} \
    --zone $${i#*:};
done
EOF
  }

  provisioner "local-exec" {
    when = "destroy"
    interpreter = ["/bin/bash", "-c"]
    command = <<EOF
list=${join(",", var.instance_groups)};
for i in $${list//,/ }; do
  NAMEDPORTS=$(gcloud compute instance-groups get-named-ports $${i%%:*} \
    --zone $${i#*:} | grep -v PORT | grep -v ${var.details["name"]} | \
    awk '{printf "%s:%s",$1,$2}')
  gcloud compute instance-groups set-named-ports $${i%%:*} \
    --named-ports=$${NAMEDPORTS} \
    --zone $${i#*:};
done
EOF
  }
}

# Configure HTTP healthcheck for service
resource "google_compute_http_health_check" "default" {
  project      = "${var.project}"
  name         = "glb-${var.name}-http"
  request_path = "${var.details["health_path"]}"
  port         = "${var.details["port"]}"
}

# Configure TCP healthcheck
resource "google_compute_health_check" "default" {
  project            = "${var.project}"
  name               = "glb-${var.name}-tcp"
  timeout_sec        = "${var.details["timeout"]}"
  check_interval_sec = "${var.details["timeout"]}"

  tcp_health_check {
    port = "${var.details["port"]}"
  }
}

# Configure service backend for LB
resource "google_compute_backend_service" "default" {
  project         = "${var.project}"
  name            = "glb-${var.name}"
  port_name       = "${var.details["name"]}"
  protocol        = "${lookup(var.details, "protocol")}"
  timeout_sec     = "${var.details["timeout"]}"
  backend         = "${var.backends}"
  health_checks   = ["${lookup(var.details, "protocol") == "HTTP" ? google_compute_http_health_check.default.self_link : google_compute_health_check.default.self_link}"]
  enable_cdn      = "false"
}

# Create url map between backend service and http/https proxy
resource "google_compute_url_map" "default" {
  project         = "${var.project}"
  count           = "${lookup(var.details, "protocol") == "HTTP" ? 1 : 0}"
  name            = "glb-${var.name}"
  default_service = "${google_compute_backend_service.default.self_link}"
}

# Create http proxy if certificates are not defined and protocol is HTTP
resource "google_compute_target_http_proxy" "default" {
  project = "${var.project}"
  count   = "${(length(var.certificates) == 0 && lookup(var.details, "protocol") == "HTTP") || lookup(var.details, "http_both") ? 1 : 0}"
  name    = "glb-http-${var.name}"
  url_map = "${google_compute_url_map.default.self_link}"
}

# Create https proxy if certificates are defined and protocol is HTTP
resource "google_compute_target_https_proxy" "default" {
  project          = "${var.project}"
  count            = "${(length(var.certificates) > 0 && lookup(var.details, "protocol") == "HTTP") || lookup(var.details, "http_both") ? 1 : 0}"
  name             = "glb-https-${var.name}"
  url_map          = "${google_compute_url_map.default.self_link}"
  ssl_certificates = "${var.certificates}"
}
# Create TCP proxy if protocol is TCP
resource "google_compute_target_tcp_proxy" "default" {
  project         = "${var.project}"
  count           = "${lookup(var.details, "protocol") == "TCP" ? 1 : 0}"
  name            = "glb-tcp-${var.name}"
  backend_service = "${google_compute_backend_service.default.self_link}"
}

# Create HTTP/HTTPS LB
resource "google_compute_global_forwarding_rule" "http-lb-rule" {
  project    = "${var.project}"
  count      = "${(length(var.certificates) == 0 && lookup(var.details, "protocol") == "HTTP") || lookup(var.details, "http_both") ? 1 : 0}"
  name       = "glb-http-${var.name}"
  target     = "${google_compute_target_http_proxy.default.self_link}"
  ip_address = "${google_compute_global_address.default.address}"
  port_range = "${element(split(",", lookup(var.details, "public_port")), 0)}"
  depends_on = ["google_compute_global_address.default"]
}

# Create HTTP LB if certificates are defined and protocol is HTTP
resource "google_compute_global_forwarding_rule" "https-lb-rule" {
  project    = "${var.project}"
  count      = "${(length(var.certificates) > 0 && lookup(var.details, "protocol") == "HTTP") || lookup(var.details, "http_both") ? 1 : 0}"
  name       = "glb-https-${var.name}"
  target     = "${google_compute_target_https_proxy.default.self_link}"
  ip_address = "${google_compute_global_address.default.address}"
  port_range = "${element(split(",", lookup(var.details, "public_port")), 1)}"
  depends_on = ["google_compute_global_address.default"]
}

# Create TCP LB if protocol is TCP
resource "google_compute_global_forwarding_rule" "tcp-lb-rule" {
  project    = "${var.project}"
  count      = "${lookup(var.details, "protocol") == "TCP" ? 1 : 0}"
  ip_protocol = "TCP"
  name       = "glb-tcp-${var.name}"
  target     = "${google_compute_target_tcp_proxy.default.self_link}"
  ip_address = "${google_compute_global_address.default.address}"
  port_range = "${element(split(",", lookup(var.details, "public_port")), 0)}"
  depends_on = ["google_compute_global_address.default"]
}