/*
Copyright 2023 Google LLC.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package controllers

import (
	"context"
	"time"

	"github.com/go-logr/logr"
	"google.golang.org/api/compute/v1"
	ctrl "sigs.k8s.io/controller-runtime"

	gatewayv1beta1 "sigs.k8s.io/gateway-api/apis/v1beta1"
)

func (r *ServiceReconciler) trackLopCreation(ctx context.Context, req ctrl.Request, gw *gatewayv1beta1.Gateway, lop *compute.Operation, logger logr.Logger) {
	var err error
	opService := compute.NewRegionOperationsService(r.s)
	for {
		if lop == nil {
			return
		}
		lop, err = opService.Get(r.project, r.region, lop.Name).Context(ctx).Do()
		if err != nil {
			logger.Error(err, "Unable to retrieve Operation")
		} else {
			switch lop.Status {
			case computeOperationStatusPending:
				logger.Info("operation pending")
			case computeOperationStatusRunning:
				logger.Info("operation running")
			case computeOperationStatusDone:
				if lop.Error != nil {
					logger.Info("Service attachment created failed", "error", lop.Error)
					r.Recorder.Eventf(gw, "Normal", "Sync",
						"Failed creating ServiceAttachment for gateway %v",
						lop.Error)
				} else {
					logger.Info("Service attachment created")
					r.Recorder.Eventf(gw, "Normal", "Sync",
						"Created ServiceAttachment for gateway")
					if err = r.addFinalizerToGateway(ctx, gw); err != nil {
						logger.Error(err, "Failed adding finalizer to gatway")
						r.Recorder.Eventf(gw, "Normal", "Sync",
							"Failed adding finalizer to gatway")
					}
				}
				return
			}
		}
		time.Sleep(1 * time.Second)
	}
}

func (r *ServiceReconciler) trackLopUpdate(ctx context.Context, req ctrl.Request, gw *gatewayv1beta1.Gateway, lop *compute.Operation, logger logr.Logger) {
	var err error
	opService := compute.NewRegionOperationsService(r.s)
	for {
		if lop == nil {
			return
		}
		lop, err = opService.Get(r.project, r.region, lop.Name).Context(ctx).Do()
		if err != nil {
			logger.Error(err, "Unable to retrieve Operation")
		} else {
			switch lop.Status {
			case computeOperationStatusPending:
				logger.Info("operation pending")
			case computeOperationStatusRunning:
				logger.Info("operation running")
			case computeOperationStatusDone:
				if lop.Error != nil {
					logger.Info("Service attachment update failed", "error", lop.Error)
					r.Recorder.Eventf(gw, "Normal", "Sync",
						"Failed updating ServiceAttachment for gateway %v",
						lop.Error)
				} else {
					logger.Info("Service attachment updated")
					r.Recorder.Eventf(gw, "Normal", "Sync",
						"Updated ServiceAttachment for gateway")
				}
				return
			}
		}
		time.Sleep(1 * time.Second)
	}
}

func (r *ServiceReconciler) trackLopDeletion(ctx context.Context, req ctrl.Request, gw *gatewayv1beta1.Gateway, lop *compute.Operation, logger logr.Logger) {
	var err error
	opService := compute.NewRegionOperationsService(r.s)
	for {
		if lop == nil {
			return
		}
		lop, err = opService.Get(r.project, r.region, lop.Name).Context(ctx).Do()
		if err != nil {
			logger.Error(err, "Unable to retrieve Operation")
		} else {
			switch lop.Status {
			case computeOperationStatusPending:
				logger.Info("operation pending")
			case computeOperationStatusRunning:
				logger.Info("operation running")
			case computeOperationStatusDone:
				if lop.Error != nil {
					logger.Info("Service attachment deletion failed", "error", lop.Error)
					r.Recorder.Eventf(gw, "Normal", "Sync",
						"Failed deleting ServiceAttachment for gateway %v",
						lop.Error)
				} else {
					logger.Info("Service attachment deleted")
					r.Recorder.Eventf(gw, "Normal", "Sync",
						"Deleted ServiceAttachment for gateway")
					if err = r.removeFinalizerFromGateway(ctx, gw); err != nil {
						logger.Error(err, "Failed removing finalizer from gatway")
						r.Recorder.Eventf(gw, "Normal", "Sync",
							"Failed removing finalizer from gatway")
					}
				}
				return
			}
		}
		time.Sleep(1 * time.Second)
	}
}
