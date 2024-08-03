FROM centos

ARG VERSION=v3.1.1
ENV GOPATH=/go
ENV PATH=${PATH}:/usr/local/go/bin:/go/bin

# https://www.sylabs.io/guides/3.0/user-guide/installation.html
RUN \
    yum update -y && \
    yum groupinstall -y 'Development Tools' && \
    yum install -y \
    openssl-devel \
    libuuid-devel \
    libseccomp-devel \
    wget \
    git \
    squashfs-tools

RUN \
    mkdir ${GOPATH} && \
    wget https://dl.google.com/go/go1.11.linux-amd64.tar.gz && \
    tar -C /usr/local -xzvf go1.11.linux-amd64.tar.gz && \
    rm go1.11.linux-amd64.tar.gz && \
    /usr/local/go/bin/go get -u github.com/golang/dep/cmd/dep

RUN \
    export GOPATH=/go && \
    mkdir -p $GOPATH/src/github.com/sylabs/singularity && \
    git clone https://github.com/sylabs/singularity ${GOPATH}/src/github.com/sylabs/singularity && \
    cd $GOPATH/src/github.com/sylabs/singularity && \
    git fetch && \
    git checkout $VERSION && \
    ./mconfig && \
    make -C ./builddir && \
    make -C ./builddir install


ENTRYPOINT ["/usr/local/bin/singularity"]
