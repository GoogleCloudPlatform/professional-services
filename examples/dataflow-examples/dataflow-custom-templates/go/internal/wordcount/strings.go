// Copyright 2022 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package wordcount

import (
	"strings"

	"github.com/apache/beam/sdks/v2/go/pkg/beam"
	"github.com/apache/beam/sdks/v2/go/pkg/beam/register"
)

const (
	splitDelimiter = " "
)

func init() {
	// Register functions to optimize execution at runtime:

	// strings.ToLower takes 1 input and returns 1 output.
	register.Function1x1(strings.ToLower)

	// splitFn takes 2 inputs, whereas the last is an emitter func
	register.Function2x0(splitFn)

	// register the string emitter func used by splitFn
	register.Emitter1[string]()
}

// ToLower converts PCollection<String> elements to lower case strings.
func ToLower(s beam.Scope, input beam.PCollection) beam.PCollection {
	return beam.ParDo(s.Scope("ToLower"), strings.ToLower, input)
}

// Split strings delimited by " " in a PCollection<String> emitting each
// resulting token.
func Split(s beam.Scope, input beam.PCollection) beam.PCollection {
	return beam.ParDo(s.Scope("Split"), splitFn, input)
}

func isEmptyFn(s string) bool {
	return s == ""
}

func splitFn(s string, emit func(string)) {
	for _, k := range strings.Split(s, splitDelimiter) {
		emit(k)
	}
}
