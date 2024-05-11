package builder

import (
	"archive/zip"
	"context"
	"fmt"
	"io/ioutil"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"cloud.google.com/go/storage"
)

func TestCreateZip(t *testing.T) {
	t.Parallel()

	abs, err := filepath.Abs("testdata")
	if err != nil {
		t.Fatal(err)
	}

	for name, path := range map[string]string{
		"relative": "testdata",
		"absolute": abs,
	} {
		t.Run(name, func(t *testing.T) {
			zf, err := createZip(context.Background(), path)
			if err != nil {
				t.Fatal(err)
			}

			zr, err := zip.OpenReader(zf)
			if err != nil {
				t.Fatal(err)
			}
			defer zr.Close()

			expected := map[string]string{
				"file-a.txt":                          "hello world",
				"file-b.txt":                          "foo bar",
				filepath.Join("subdir", "file-d.txt"): "bar baz",
			}

			for _, f := range zr.File {
				expectedData, ok := expected[f.Name]
				if !ok {
					t.Fatalf("unexpected file %q found in archive", f.Name)
				}

				r, err := f.Open()
				if err != nil {
					t.Fatal(err)
				}

				ad, err := ioutil.ReadAll(r)
				if err != nil {
					t.Fatal(err)
				}
				actualData := string(ad)
				// We'll trim space to make testing simpler
				actualData = strings.TrimSpace(actualData)

				if actualData != expectedData {
					t.Fatalf("expected data from %s to be %q, got %q", f.Name, expectedData, actualData)
				}
			}

			if len(expected) != len(zr.File) {
				t.Fatalf("expected archive to have %d files, had %d", len(expected), len(zr.File))
			}
		})
	}
}

func TestCreateZip_cancelled_context(t *testing.T) {
	t.Parallel()

	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	if _, err := createZip(ctx, "testdata"); err == nil {
		t.Fatal("expected an error")
	}
}

func bucketTestsInfo(t *testing.T) (
	bucket string,
	object string,
) {
	// This test assumes information has been passed in. If ANY of it is
	// missing, skip it.
	bucket = os.Getenv("GCP_BUCKET")

	if bucket == "" {
		t.Skipf("Missing environment variable GCP_BUCKET, skipping...")
	}

	return bucket, fmt.Sprintf("test-write-to-bucket-%d", time.Now().UnixNano())
}

func TestWriteToBucket(t *testing.T) {
	t.Parallel()

	bucket, object := bucketTestsInfo(t)

	gsURL, err := writeToBucket(
		context.Background(),
		bucket,
		object,
		"testdata/file-a.txt",
	)
	if err != nil {
		t.Fatal(err)
	}

	expected := "hello world"
	actual := readBucket(t, gsURL)
	if actual != expected {
		t.Fatalf("expected %q to equal %q", actual, expected)
	}
}

func readBucket(t *testing.T, gsURL string) string {
	t.Helper()

	u, err := url.Parse(gsURL)
	if err != nil {
		t.Fatal(err)
	}

	if u.Scheme != "gs" {
		t.Fatalf(`expected scheme to be "gs", got %q`, u.Scheme)
	}

	bucket := u.Host
	object := u.Path
	if strings.HasPrefix(object, "/") {
		object = object[1:]
	}

	ctx := context.Background()
	client, err := storage.NewClient(ctx)
	if err != nil {
		t.Fatal(err)
	}
	reader, err := client.Bucket(bucket).Object(object).NewReader(ctx)
	if err != nil {
		t.Fatal(err)
	}

	data, err := ioutil.ReadAll(reader)
	if err != nil {
		t.Fatal(err)
	}

	// We'll trim space to make testing simpler
	return strings.TrimSpace(string(data))
}
