package bqnotifier

import (
	"context"
	"io/ioutil"
	"log"
	"testing"
)

func TestJson(*testing.T) {
	b, err := ioutil.ReadFile("testdata_entry.json")
	if err != nil {
		log.Fatal(err)
	}
	ctx := context.Background()
	msg := PubSubMessage{Data: b}
	err = HandleJobComplete(ctx, msg)
	if err != nil {
		log.Fatal(err)
	}
}

