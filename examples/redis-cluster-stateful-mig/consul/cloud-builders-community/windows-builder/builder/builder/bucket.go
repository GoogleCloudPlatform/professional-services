package builder

import (
	"archive/zip"
	"context"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"

	"cloud.google.com/go/storage"
)

func writeZipToBucket(
	ctx context.Context,
	bucket string,
	object string,
	inputPath string,
) (string, error) {
	zp, err := createZip(ctx, inputPath)
	if err != nil {
		return "", err
	}

	return writeToBucket(ctx, bucket, object, zp)
}

func writeToBucket(
	ctx context.Context,
	bucket string,
	object string,
	inputPath string,
) (string, error) {

	client, err := storage.NewClient(ctx)
	if err != nil {
		return "", err
	}
	defer client.Close()

	bkt := client.Bucket(bucket)

	f, err := os.Open(inputPath)
	if err != nil {
		return "", err
	}
	defer f.Close()

	obj := bkt.Object(object)
	w := obj.NewWriter(ctx)
	defer w.Close()

	if _, err := io.Copy(w, f); err != nil {
		return "", err
	}

	return fmt.Sprintf("gs://%s/%s", bucket, object), nil
}

func createZip(ctx context.Context, fullpath string) (string, error) {
	f, err := ioutil.TempFile("", "")
	if err != nil {
		return "", fmt.Errorf("failed to create temp file: %v", err)
	}
	defer f.Close()

	zipW := zip.NewWriter(f)
	defer zipW.Close()

	err = filepath.Walk(fullpath, func(path string, info os.FileInfo, err error) error {
		fi, err := os.Lstat(path)
		if err != nil {
			return err
		}

		if fi.IsDir() {
			// Skip
			return ctx.Err()
		}

		if fi.Mode()&os.ModeSymlink != 0 {
			log.Printf("Skipping symlink: %q", path)
			return ctx.Err()
		}

		trimmedPath := path
		if filepath.HasPrefix(trimmedPath, fullpath) {
			trimmedPath = trimmedPath[len(fullpath)+1:]
		}

		w, err := zipW.Create(trimmedPath)
		if err != nil {
			return err
		}
		if err := copyFile(w, path); err != nil {
			return err
		}

		return ctx.Err()
	})

	if err != nil {
		return "", fmt.Errorf("failed to walk directory: %v", err)
	}

	return f.Name(), ctx.Err()
}

func copyFile(w io.Writer, path string) error {
	f, err := os.Open(path)
	if err != nil {
		return err
	}
	defer f.Close()

	_, err = io.Copy(w, f)
	return err
}
