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

import "log"

// ShowStringArray logs each item in a string array
func ShowStringArray(strArray []string, desc string) {
	log.Printf("%s\n", desc)
	for _, v := range strArray {
		log.Printf("  %s\n", v)
	}
	log.Printf("\n")
}

// ShowMapOfStrings logs each item in a map[string]string
func ShowMapOfStrings(m map[string]string, desc string) {
	log.Printf("%s\n", desc)
	for k, v := range m {
		log.Printf("  %s: %s\n", k, v)
	}
	log.Printf("\n")
}

// ShowMapOfStringArray logs each item in a map[string][]string
func ShowMapOfStringArray(m map[string][]string, desc string) {
	log.Printf("%s\n", desc)
	for k, v := range m {
		ShowStringArray(v, k)
	}
	log.Printf("\n")
}
