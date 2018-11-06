output external_ip {
  description = "The external IP assigned to the global fowarding rule."
  value       = "${google_compute_global_address.default.address}"
}