BINARY=billing-report

.PHONY: build
build:
	go build -o ${BINARY} main.go

.PHONY: clean
clean:
	rm -f ${BINARY}

.PHONY: test
test:
	go test ./...