FROM golang:1.16

WORKDIR /go/src/github.com/rosmo/gcs2bq
COPY go.mod .
COPY go.sum .
COPY main.go .

RUN go get -v ./
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o /gcs2bq .

FROM google/cloud-sdk:slim
WORKDIR /
RUN chown -R 1000 /home
COPY --from=0 /gcs2bq .
COPY gcs2bq.avsc .
COPY bigquery.schema .
COPY run.sh .
RUN chmod +x run.sh
CMD ["/run.sh"]

