
data "aws_vpc" "aws_vpn_network" {
  id = var.aws_vpc_id
}

resource "aws_vpn_gateway" "vpn_gateway" {
  vpc_id = var.aws_vpc_id
}

resource "aws_customer_gateway" "customer_gateway_1" {
  bgp_asn    = google_compute_router.vpn_router.bgp[0].asn
  ip_address = google_compute_ha_vpn_gateway.target_gateway.vpn_interfaces[0].ip_address
  type       = "ipsec.1"
}

resource "aws_customer_gateway" "customer_gateway_2" {
  bgp_asn    = google_compute_router.vpn_router.bgp[0].asn
  ip_address = google_compute_ha_vpn_gateway.target_gateway.vpn_interfaces[1].ip_address
  type       = "ipsec.1"
}

resource "aws_vpn_connection" "cx_1" {
  vpn_gateway_id      = aws_vpn_gateway.vpn_gateway.id
  customer_gateway_id = aws_customer_gateway.customer_gateway_1.id
  type                = "ipsec.1"
}

resource "aws_vpn_connection" "cx_2" {
  vpn_gateway_id      = aws_vpn_gateway.vpn_gateway.id
  customer_gateway_id = aws_customer_gateway.customer_gateway_2.id
  type                = "ipsec.1"
}

resource "aws_vpn_gateway_route_propagation" "vpn_propagation" {
  count          = var.route_table_id != "" ? 1 : 0
  vpn_gateway_id = aws_vpn_gateway.vpn_gateway.id
  route_table_id = var.aws_route_table_id
}
