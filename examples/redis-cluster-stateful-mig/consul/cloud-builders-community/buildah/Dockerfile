FROM launcher.gcr.io/google/ubuntu16_04

RUN \
  # Install runc first, fail fast if something is wrong.
  apt-get -y -qq update && \
  apt-get -y install wget && \
  wget -O /bin/runc https://github.com/opencontainers/runc/releases/download/v1.0.0-rc5/runc.amd64 && \
  chmod +x /bin/runc && \
  PATH=/usr/local/bin/:$PATH && \
  runc --help && \
  # Install buildah dependencies.
  apt-get -y install software-properties-common && \
  add-apt-repository -y ppa:alexlarsson/flatpak && \
  add-apt-repository -y ppa:gophers/archive && \
  apt-add-repository -y ppa:projectatomic/ppa && \
  apt-get -y -qq update && \
  apt-get -y install bats btrfs-tools git libapparmor-dev libdevmapper-dev libglib2.0-dev libgpgme11-dev libostree-dev libseccomp-dev libselinux1-dev skopeo-containers go-md2man wget && \
  apt-get -y install golang-1.8 && \
  # Install buildah.
  mkdir -p /builder/buildah && \
  cd /builder/buildah && \
  export GOPATH=`pwd` && \
  git clone https://github.com/projectatomic/buildah ./src/github.com/projectatomic/buildah && \
  cd ./src/github.com/projectatomic/buildah && \
  PATH=/usr/lib/go-1.8/bin:$PATH make runc all TAGS="apparmor seccomp" && \
  cd /builder/buildah/src/github.com/projectatomic/buildah && \
  ls -lh && \
  make install install.runc && \
  buildah --help

ENTRYPOINT ["buildah"]
