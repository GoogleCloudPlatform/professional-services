package report

import (
	"regexp"
	"testing"
)

const (
	testRoot = "../testdata"
)

func TestConstructReportQuery(t *testing.T) {
	config, err := loadReportConfig(testRoot + "/config.json")
	if err != nil {
		t.Fatal("unexpected error", err)
	}

	t.Run("Load Config - Number of Reports", func(t *testing.T) {
		if len(config.Reports) != 2 {
			t.Errorf("wanted 2, got %d", len(config.Reports))
		}
	})

	table := config.BillingExportTable.Project + "." + config.BillingExportTable.Dataset + "." + config.BillingExportTable.Table
	query, err := constructReportQuery(&config.Reports[0], table, "202001")
	if err != nil {
		t.Fatal("unexpected error", err)
	}

	t.Run("Construct Query - SELECT", func(t *testing.T) {
		matched, err := regexp.MatchString("SELECT", query)
		if err != nil {
			t.Fatal("unexpected error", err)
		}
		if !matched {
			t.Errorf("wanted SELECT clause, got %v", query)
		}
	})
	t.Run("Construct Query - GROUP BY", func(t *testing.T) {
		matched, err := regexp.MatchString("GROUP BY", query)
		if err != nil {
			t.Fatal("unexpected error", err)
		}
		if !matched {
			t.Errorf("wanted GROUP BY clause, got %v", query)
		}
	})

}
