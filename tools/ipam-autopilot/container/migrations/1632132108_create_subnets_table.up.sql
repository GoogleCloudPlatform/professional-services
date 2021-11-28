CREATE TABLE subnets  (
  subnet_id INT NOT NULL AUTO_INCREMENT,
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