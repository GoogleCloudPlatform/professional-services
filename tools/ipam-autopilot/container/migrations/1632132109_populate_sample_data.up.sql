START TRANSACTION;
BEGIN;
INSERT INTO routing_domains (name) VALUES ("Default Routing Domain");

INSERT INTO subnets (name, cidr, routing_domain_id) VALUES ("10.0.0.0/8 range", "10.0.0.0/8", 1);
INSERT INTO subnets (name, cidr, routing_domain_id) VALUES ("172.16.0.0/12 range", "172.16.0.0/12", 1);
INSERT INTO subnets (name, cidr, routing_domain_id) VALUES ("192.168.0.0/16 range", "192.168.0.0/16", 1);
COMMIT;