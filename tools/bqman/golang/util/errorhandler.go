/*
Copyright 2020 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package util

import (
	"log"
	"os"
)

// CheckError logs the error and quits program
func CheckError(err error, str string) {
	if err != nil {
		log.Printf("Error Summary: %s\n", str)
		log.Printf("Error Detail: %s\n", err)
		os.Exit(2)
	}
}

// CheckErrorAndReturn logs the error and returns
func CheckErrorAndReturn(err error, str string) error {
	if err != nil {
		log.Printf("Error Summary: %s\n", str)
		log.Printf("Error Detail: %s\n", err)
	}
	return err
}
