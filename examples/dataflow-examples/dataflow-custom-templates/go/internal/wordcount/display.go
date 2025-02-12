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
	"fmt"

	"github.com/apache/beam/sdks/v2/go/pkg/beam"
	"github.com/apache/beam/sdks/v2/go/pkg/beam/register"
)

func init() {
	// Register functions to optimize execution at runtime:

	// Register displayCountsFn that takes 2 inputs and returns 1 output.
	register.Function2x1(displayCountsFn)
}

// FormatCounts of a PCollection<KV<string, int64>> to "key: value"
func FormatCounts(s beam.Scope, input beam.PCollection) beam.PCollection {
	return beam.ParDo(s.Scope("FormatCounts"), displayCountsFn, input)
}

func displayCountsFn(key string, value int) string {
	return fmt.Sprintf("%s: %v", key, value)
}
