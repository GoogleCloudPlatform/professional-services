FROM gcr.io/cloud-builders/go:debian

RUN GOPATH=/go && curl https://glide.sh/get | sh

COPY glide.bash /builder/bin/
ENV PATH=/builder/bin:$PATH

ENTRYPOINT ["glide.bash"]
