// Copyright 2019 Google Inc.
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

package function

import (
	"context"
	"errors"
	"fmt"
	"image"
	"image/gif"
	"image/jpeg"
	"image/png"
	"log"

	"cloud.google.com/go/storage"
	vision "cloud.google.com/go/vision/apiv1"
	"golang.org/x/xerrors"
	pb "google.golang.org/genproto/googleapis/cloud/vision/v1"
)

type GCSEvent struct {
	Bucket string `json:"bucket"`
	Name   string `json:"name"`
}

var retryableError = xerrors.New("upload: retryable error")

func validate(ctx context.Context, obj *storage.ObjectHandle) error {
	attrs, err := obj.Attrs(ctx)
	if err != nil {
		return xerrors.Errorf("upload: failed to get object attributes %q : %w",
			obj.ObjectName(), retryableError)
	}
	if attrs.Size >= 1024*100 {
		return fmt.Errorf("upload: image file is too large, got = %d", attrs.Size)
	}
	// Validates obj and returns true if it conforms supported image formats.
	if err := validateMIMEType(ctx, attrs, obj); err != nil {
		return err
	}
	// Validates obj by calling Vision API.
	return validateByVisionAPI(ctx, obj)
}

func validateMIMEType(ctx context.Context, attrs *storage.ObjectAttrs, obj *storage.ObjectHandle) error {
	r, err := obj.NewReader(ctx)
	if err != nil {
		return xerrors.Errorf("upload: failed to open new file %q : %w",
			obj.ObjectName(), retryableError)
	}
	defer r.Close()
	if _, err := func(ct string) (image.Image, error) {
		switch ct {
		case "image/png":
			return png.Decode(r)
		case "image/jpeg", "image/jpg":
			return jpeg.Decode(r)
		case "image/gif":
			return gif.Decode(r)
		default:
			return nil, fmt.Errorf("upload: unsupported MIME type, got = %q", ct)
		}
	}(attrs.ContentType); err != nil {
		return err
	}
	return nil
}

// validateByVisionAPI uses Safe Search Detection provided by Cloud Vision API.
// See more details: https://cloud.google.com/vision/docs/detecting-safe-search
func validateByVisionAPI(ctx context.Context, obj *storage.ObjectHandle) error {
	client, err := vision.NewImageAnnotatorClient(ctx)
	if err != nil {
		return xerrors.Errorf(
			"upload: failed to create a ImageAnnotator client, error = %v : %w",
			err,
			retryableError,
		)
	}
	ssa, err := client.DetectSafeSearch(
		ctx,
		vision.NewImageFromURI(fmt.Sprintf("gs://%s/%s", obj.BucketName(), obj.ObjectName())),
		nil,
	)
	if err != nil {
		return xerrors.Errorf(
			"upload: failed to detect safe search, error = %v : %w",
			err,
			retryableError,
		)
	}
	// Returns an unretryable error if there is any possibility of inappropriate image.
	// Likelihood has been defined in the following:
	// https://github.com/google/go-genproto/blob/5fe7a883aa19554f42890211544aa549836af7b7/googleapis/cloud/vision/v1/image_annotator.pb.go#L37-L50
	if ssa.Adult >= pb.Likelihood_POSSIBLE ||
		ssa.Medical >= pb.Likelihood_POSSIBLE ||
		ssa.Violence >= pb.Likelihood_POSSIBLE ||
		ssa.Racy >= pb.Likelihood_POSSIBLE {
		return errors.New("upload: exceeds the prescribed likelihood")
	}
	return nil
}

// distributionBucket is the distribution bucket.
// It's used for distributing all of passed files.
// TODO: This value MUST be updated before deploying this function.
const distributionBucket = "DISTRIBUTION_BUCKET"

// UplaodImage validates the object and copy it into the distribution bucket.
func UploadImage(ctx context.Context, e GCSEvent) error {
	client, err := storage.NewClient(ctx)
	if err != nil {
		return fmt.Errorf("upload: failed to construct a client, error = %v", err)
	}
	defer client.Close()

	dst := client.Bucket(distributionBucket).Object(e.Name)
	_, err = dst.Attrs(ctx)
	// Avoid proceeding if the object has been copied to destination.
	if err == nil {
		log.Printf("upload: %s has already been copied to destination\n", e.Name)
		return nil
	}
	// Return retryable error as there is a possibility that object does not temporarily exist.
	if err != storage.ErrObjectNotExist {
		return err
	}
	src := client.Bucket(e.Bucket).Object(e.Name)
	if err := validate(ctx, src); err != nil {
		if xerrors.Is(err, retryableError) {
			return err
		}
		log.Println(err)
		return nil
	}
	// Returns an error if the copy operation failed.
	// Will retry the same processing later.
	if _, err := dst.CopierFrom(src).Run(ctx); err != nil {
		return err
	}

	return nil
}
