istio_version: ${istio_version}
clusters:
%{ for cluster in clusters ~}
  - ${cluster}    
%{ endfor ~}  
region: ${region}  
service_account_email: ${service_account_email}
project_id: ${project_id}