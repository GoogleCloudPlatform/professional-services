FROM gcr.io/cloud-builders/go:debian

# Set GOPATH and install go dep
RUN GOPATH=/go && go get -u github.com/golang/dep/cmd/dep

# Install the dep bash script
COPY dep.bash /builder/bin/
RUN chmod +x /builder/bin/dep.bash
ENV PATH=/builder/bin:$PATH

# Build the go_workspace for detecting the workspace
RUN go build -o /builder/go_workspace /builder/go_workspace.go

ENTRYPOINT ["dep.bash"]