FROM centos:7
  
COPY yum.repo /etc/yum.repos.d/

RUN yum install -y kubectl

COPY resource_syncer.py /

CMD python -u /resource_syncer.py
