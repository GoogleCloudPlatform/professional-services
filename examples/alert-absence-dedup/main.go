// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// A demo application to generate custom metrics time series. Invoke it from
// the command line with the number of shards as an argument:
//
// ./alert-absence-demo --labels "1,2,3"

package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"contrib.go.opencensus.io/exporter/stackdriver"
	"go.opencensus.io/stats"
	"go.opencensus.io/stats/view"
	"go.opencensus.io/tag"
	"golang.org/x/exp/rand"
)

var (
	latencyMs       = stats.Float64("task_latency", "The task latency", "ms")
	keyPartition, _ = tag.NewKey("partition")
)

func main() {
	var labels = flag.String("labels", "1,2,3",
		"A comma separated list of partition labels")
	flag.Usage = func() {
		fmt.Fprintf(os.Stderr,
			`Usage: ./alert-absence-demo [--labels LABELS]\n \
where LABELS is comma separate list of partition labels, eg "1,2,3"
`)
	}
	flag.Parse()

	partitions := strings.Split(*labels, ",")
	fmt.Printf("Creating %d partitions\n", len(partitions))

	// Register the view.
	v := &view.View{
		Name:        "task_latency_distribution",
		Measure:     latencyMs,
		Description: "The distribution of the task latencies",
		Aggregation: view.Distribution(0, 100, 200, 400, 1000, 2000, 4000),
		TagKeys:     []tag.Key{keyPartition},
	}
	if err := view.Register(v); err != nil {
		log.Fatalf("Failed to register the view: %v", err)
	}

	exporter, err := stackdriver.NewExporter(stackdriver.Options{})
	if err != nil {
		log.Fatal(err)
	}
	defer exporter.Flush()

	if err := exporter.StartMetricsExporter(); err != nil {
		log.Fatalf("Error starting metric exporter: %v", err)
	}
	defer exporter.StopMetricsExporter()

	for i := 0; ; i++ {
		for _, partition := range partitions {
			ctx, err := tag.New(context.Background(), tag.Insert(keyPartition, partition))
			if err != nil {
				fmt.Printf("Error adding tag to context: %v\n", err)
			}

			// Record fake latency values
			ms := float64(5*time.Second/time.Millisecond) * rand.Float64()
			fmt.Printf("Latency %d: %f, partition: %s\n", i, ms, partition)
			stats.Record(ctx, latencyMs.M(ms))
			time.Sleep(1 * time.Second)
		}
	}
}
