FROM centos:7
  
COPY yum.repo /etc/yum.repos.d/

RUN yum install -y kubectl

COPY resource-syncer.py /

CMD python -u /resource-syncer.py
