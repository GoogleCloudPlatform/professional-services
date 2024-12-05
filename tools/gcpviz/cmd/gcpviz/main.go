/*
#   Copyright 2022 Google LLC
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.
#
*/
package main

import (
	"bufio"
	"bytes"
	"context"
	"flag"
	"io/ioutil"
	"log"
	"os"
	"runtime"
	"runtime/pprof"
	"strings"
	"sync"

	"github.com/GoogleCloudPlatform/professional-services/tools/gcpviz"
	"github.com/dimiro1/banner"
)

var modePtr string

type arrayFlags []string

func (i *arrayFlags) String() string {
	return "my string representation"
}

func (i *arrayFlags) Set(value string) error {
	*i = append(*i, value)
	return nil
}

func main() {
	modePtr := flag.String("mode", "", "mode of operation (generate, visualize, export)")
	relationsFilePtr := flag.String("relations-file", "relations.yaml", "location of relations file")
	styleFilePtr := flag.String("style-file", "style.yaml", "location of graph style file")
	labelsFilePtr := flag.String("labels-file", "labels.yaml", "location of node/edge labels file")
	queryFilePtr := flag.String("query-file", "query.js", "location of Gizmo query file")
	graphFilePtr := flag.String("graph-file", "graph.db", "location of Graph & Asset database file")
	exportFilePtr := flag.String("export-file", "graph.json", "location of JSON export file")
	resourceInventoryFilePtr := flag.String("resource-inventory-file", "resource_inventory.json", "location of resource inventory file from Cloud Asset Inventory")
	resourceDataPtr := flag.Bool("resource-data", false, "adds resource data to graph under `data` predicate")
	graphTitlePtr := flag.String("graph-title", "", "Title for the graph")
	noColorPtr := flag.Bool("no-color", false, "disables color in output")
	noBannerPtr := flag.Bool("no-banner", false, "disables banner")
	cpuprofile := flag.String("cpuprofile", "", "write cpu profile to `file`")
	memprofile := flag.String("memprofile", "", "write memory profile to `file`")
	var graphParameters arrayFlags
	var queryParameters arrayFlags
	flag.Var(&graphParameters, "graph-parameter", "override graph style parameters using SJSON (ie. \"options.overlap=vpsc\")")
	flag.Var(&queryParameters, "query-parameter", "additional parameter to pass to Gizmo query (param=value)")

	flag.Parse()

	banner.Init(os.Stderr, !*noBannerPtr, !*noColorPtr, bytes.NewBufferString(`
{{ .AnsiColor.BrightMagenta }}  ██████   ██████ ██████  ██    ██ ██ ███████ 
{{ .AnsiColor.Magenta }} ██       ██      ██   ██ ██    ██ ██    ███  
{{ .AnsiColor.Blue }} ██   ███ ██      ██████  ██    ██ ██   ███   
{{ .AnsiColor.Cyan }} ██    ██ ██      ██       ██  ██  ██  ███    
{{ .AnsiColor.BrightCyan }}  ██████   ██████ ██        ████   ██ ███████
{{ .AnsiColor.Default }}
`))

	if *modePtr == "" {
		flag.PrintDefaults()
		os.Exit(1)
	}

	if *cpuprofile != "" {
		f, err := os.Create(*cpuprofile)
		if err != nil {
			log.Fatal("Could not create CPU profile: ", err)
		}
		defer f.Close()
		if err := pprof.StartCPUProfile(f); err != nil {
			log.Fatal("Could not start CPU profile: ", err)
		}
		defer pprof.StopCPUProfile()
	}

	if *memprofile != "" {
		f, err := os.Create(*memprofile)
		if err != nil {
			log.Fatal("Could not create memory profile: ", err)
		}
		defer f.Close()
		runtime.GC() // get up-to-date statistics
		if err := pprof.WriteHeapProfile(f); err != nil {
			log.Fatal("Could not write memory profile: ", err)
		}
	}

	var overrideParams map[string]string = nil
	if len(graphParameters) > 0 {
		overrideParams = make(map[string]string, len(graphParameters))
		for _, ov := range graphParameters {
			param := strings.SplitN(ov, "=", 2)
			overrideParams[param[0]] = param[1]
		}
	}
	viz, err := gcpviz.NewGcpViz(*relationsFilePtr, *labelsFilePtr, *styleFilePtr, overrideParams)
	if err != nil {
		log.Fatalf("Failed to initialize graph engine: %v", err)
	}
	if *modePtr == "generate" {
		err = viz.Create(*graphFilePtr)
		if err != nil {
			log.Fatalf("Failed to create graph file: %v", err)
		}

		if *resourceDataPtr {
			log.Print("Including resource data in graph - this increases memory consumption for the graph.")
		}
		err = viz.ReadAssetsFromFile(*resourceInventoryFilePtr, *resourceDataPtr)
		if err != nil {
			log.Fatalf("Failed read assets from resource inventory: %v", err)
		}

		err = viz.EnrichAssets()
		if err != nil {
			log.Fatalf("Failed create references and enrich assets in resource inventory: %v", err)
		}

		err = viz.Save()
		if err != nil {
			log.Fatalf("Failed to save graph file: %v", err)
		}
	}
	if *modePtr == "visualize" {
		err = viz.Load(*graphFilePtr)
		if err != nil {
			log.Fatalf("Failed to load graph file: %v", err)
		}

		gizmoQuery, err := ioutil.ReadFile(*queryFilePtr)
		if err != nil {
			log.Fatalf("Failed to load query file: %v", err)
		}

		var parameters map[string]interface{}
		if len(queryParameters) > 0 {
			parameters = make(map[string]interface{}, len(queryParameters)+1)
			for _, p := range queryParameters {
				param := strings.SplitN(p, "=", 2)
				if len(param) == 2 {
					parameters[param[0]] = param[1]
				} else {
					log.Fatalf("Invalid query parameter (use param=value format): %s", p)
				}
			}
		} else {
			parameters = make(map[string]interface{}, 1)
		}
		parameters["Title"] = viz.EscapeLabel(*graphTitlePtr)
		f := bufio.NewWriter(os.Stdout)
		defer f.Flush()

		waitGroup := sync.WaitGroup{}

		ctx := context.Background()
		waitGroup.Add(1)
		err = viz.GenerateNodes(&waitGroup, ctx, string(gizmoQuery), parameters, f)
		if err != nil {
			log.Fatalf("Failed to create graph: %v", err)
		}
		waitGroup.Wait()
	}

	if *modePtr == "export" {
		err = viz.Load(*graphFilePtr)
		if err != nil {
			log.Fatalf("Failed to load graph file: %v", err)
		}

		f, err := os.Create(*exportFilePtr)
		if err != nil {
			log.Fatal("Could not create export file: ", err)
		}
		defer f.Close()

		waitGroup := sync.WaitGroup{}
		ctx := context.Background()
		waitGroup.Add(1)
		err = viz.ExportNodes(&waitGroup, ctx, f)
		if err != nil {
			log.Fatalf("Failed to export graph: %v", err)
		}
		waitGroup.Wait()
	}

	if *modePtr != "visualize" && *modePtr != "generate" && *modePtr != "export" {
		log.Fatal("invalid mode specified, specify either generate or visualize")
	}
}
