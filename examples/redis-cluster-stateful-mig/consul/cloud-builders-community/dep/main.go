package main

import (
	"fmt"
	"github.com/google/uuid"
)

func main() {
	uuid := uuid.New()
	fmt.Printf("Hello, %s\n", uuid)
}
