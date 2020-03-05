// Copyright 2020 Google LLC
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

package report

import (
	"os"

	log "github.com/inconshreveable/log15"
	"github.com/pkg/errors"
	"github.com/spf13/cobra"
)

// Log handler
var Log = log.New()

var rootCmd = &cobra.Command{
	Use:   "billing-report",
	Short: "Generate GCP Billing Report by month",
	Args:  cobra.NoArgs,
	Run: func(cmd *cobra.Command, args []string) {
		if args == nil || len(args) == 0 {
			cmd.HelpFunc()(cmd, args)
		}
	},
	PreRun: func(cmd *cobra.Command, args []string) {
		if !flags.verbose {
			// discard logs
			Log.SetHandler(log.DiscardHandler())
		}
	},
	RunE: func(cmd *cobra.Command, args []string) error {
		cmd.Println("Generating billing report")
		config, err := loadReportConfig(flags.configFile)
		if err != nil {
			return errors.Wrap(err, "Loading config file")
		}
		err = generateReports(config, flags.invoiceMonth)
		if err != nil {
			return errors.Wrap(err, "Generate reports")
		}
		cmd.Println("Report generation completed")
		return nil
	},
}

var flags struct {
	verbose      bool
	configFile   string
	invoiceMonth string
}

func init() {
	if os.Args == nil {
		rootCmd.SetArgs([]string{"-h"})
	}

	rootCmd.Flags().StringVar(&flags.configFile, "config", "config.json", "Path to a .json file containing billing report config")

	rootCmd.Flags().StringVar(&flags.invoiceMonth, "month", "", "Invoice month to generate report, in the format of YYYYMM")
	rootCmd.MarkFlagRequired("month")

	rootCmd.Flags().BoolVar(&flags.verbose, "verbose", false, "Verbose output")

}

// Execute command
func Execute() {
	if err := rootCmd.Execute(); err != nil {
		os.Exit(1)
	}
}
