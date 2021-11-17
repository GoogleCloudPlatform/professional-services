CREATE TABLE routing_domains (
  routing_domain_id INT GENERATED ALWAYS AS IDENTITY,
  name    VARCHAR(255) NOT NULL,
  vpcs   VARCHAR(255),
  PRIMARY KEY(routing_domain_id)
);

CREATE TABLE subnets (
  subnet_id INT GENERATED ALWAYS AS IDENTITY,
  parent_id INT,
  routing_domain_id INT,
  name    VARCHAR(255) NOT NULL,
  cidr   VARCHAR(255) NOT NULL,
  PRIMARY KEY(subnet_id),
  CONSTRAINT fk_parent
    FOREIGN KEY(parent_id) 
  REFERENCES subnets(subnet_id),
  CONSTRAINT fk_routing_domain
    FOREIGN KEY(routing_domain_id) 
  REFERENCES routing_domains(routing_domain_id)
);

INSERT INTO routing_domains("name") VALUES ('Default Routing Domain');

INSERT INTO subnets("name", "cidr", "routing_domain_id") VALUES ('10.0.0.0/8 range', '10.0.0.0/8', 1);
INSERT INTO subnets("name", "cidr", "routing_domain_id") VALUES ('172.16.0.0/12 range', '172.16.0.0/12', 1);
INSERT INTO subnets("name", "cidr", "routing_domain_id") VALUES ('192.168.0.0/16 range', '192.168.0.0/16', 1);