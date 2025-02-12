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

package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"strings"

	"github.com/apache/beam/sdks/v2/go/pkg/beam"
	"github.com/apache/beam/sdks/v2/go/pkg/beam/io/textio"
	"github.com/apache/beam/sdks/v2/go/pkg/beam/transforms/stats"
	"github.com/apache/beam/sdks/v2/go/pkg/beam/x/beamx"
	"github.com/professional-services/examples/dataflow-custom-templates/go/internal/wordcount"
)

const (
	sourceFlagName = "source"
	outputFlagName = "output"
)

var (
	source = flag.String(sourceFlagName, "", "URI or path to source file(s)")
	output = flag.String(outputFlagName, "", "URI or path to output file(s)")
)

func main() {
	flag.Parse()
	beam.Init()

	if err := preRun(); err != nil {
		log.Fatalln(err)
	}
	if err := run(context.Background()); err != nil {
		log.Fatalf("failed to execute job: %v", err)
	}
}

func preRun() error {
	var missing []string
	for k, v := range map[string]string{
		sourceFlagName: *source,
		outputFlagName: *output,
	} {
		if v == "" {
			missing = append(missing, fmt.Sprintf("--%s", k))
		}
	}
	if len(missing) > 0 {
		return fmt.Errorf("missing required arguments: %s", strings.Join(missing, " | "))
	}
	return nil
}

func run(ctx context.Context) error {
	p, s := beam.NewPipelineWithRoot()

	lines := textio.Read(s.Scope("ReadFromSource"), *source)

	tokens := wordcount.Split(s, lines)

	nonEmptyTokens := wordcount.ExcludeEmpty(s, tokens)

	lowerCaseTokens := wordcount.ToLower(s, nonEmptyTokens)

	countPerToken := stats.Count(s.Scope("CountPerToken"), lowerCaseTokens)

	formatCounts := wordcount.FormatCounts(s, countPerToken)

	textio.Write(s.Scope("OutputResult"), *output, formatCounts)

	return beamx.Run(ctx, p)
}
