FROM golang:1.16 AS kosource
ARG KO_GIT_TAG

RUN git clone --depth=1 -b "${KO_GIT_TAG}" https://github.com/google/ko
WORKDIR ko
RUN GOOS=linux go build -mod=vendor -o /bin/ko ./cmd/ko

FROM gcr.io/cloud-builders/kubectl

COPY --from=kosource /bin/ko /
COPY ko.bash /builder/ko.bash

# Install Go
COPY --from=0 /usr/local/go /usr/local/go
ENV PATH="/go/bin:${PATH}:/usr/local/go/bin"
RUN mkdir -p /go/src
ENV GOPATH=/go

RUN gcloud auth configure-docker --quiet

ENTRYPOINT ["/builder/ko.bash"]
