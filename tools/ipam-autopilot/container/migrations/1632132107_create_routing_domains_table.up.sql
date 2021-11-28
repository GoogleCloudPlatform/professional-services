CREATE TABLE routing_domains (
  routing_domain_id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  vpcs VARCHAR(255),
  PRIMARY KEY(routing_domain_id)
);
