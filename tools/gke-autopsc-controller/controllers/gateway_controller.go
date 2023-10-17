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
	"fmt"
	"reflect"
	"strings"

	"github.com/go-logr/logr"
	"google.golang.org/api/compute/v1"
	"google.golang.org/api/googleapi"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/controller/controllerutil"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"

	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/client-go/tools/record"
	gatewayv1beta1 "sigs.k8s.io/gateway-api/apis/v1beta1"
)

// ServiceReconciler reconciles a Service object
type ServiceReconciler struct {
	client.Client
	*PscController
	Recorder record.EventRecorder
	Log      logr.Logger
}

const (
	computeOperationStatusDone    = "DONE"
	computeOperationStatusRunning = "RUNNING"
	computeOperationStatusPending = "PENDING"
	finalizerName                 = "controller.autonpsc.dev/finalizer"
)

func NewPscController(project string, region string, s *compute.Service) *PscController {
	return &PscController{
		project: project,
		region:  region,
		s:       s,
	}
}

// +kubebuilder:rbac:groups=gateway.networking.k8s.io,resources=gateways,verbs=get;list;watch;update;patch
// +kubebuilder:rbac:groups=gateway.networking.k8s.io,resources=gateways/status,verbs=get;update;patch
// +kubebuilder:rbac:groups="",resources=events,verbs=create;patch
// +kubebuilder:rbac:groups=coordination.k8s.io,resources=leases,verbs=get;list;create;update

func (r *ServiceReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	logger := r.Log.WithValues("gateway", req.NamespacedName)
	gw := &gatewayv1beta1.Gateway{}
	err := r.Get(ctx, req.NamespacedName, gw)
	if err != nil {
		if apierrors.IsNotFound(err) {
			// Object not found, return.
			return reconcile.Result{}, nil
		}
		// Error reading the object - requeue the request.
		return reconcile.Result{}, err
	}
	if gw.Annotations["controller.autonpsc.dev/psc-serviceattachment"] == "" {
		// TODO if only the annotation was removed, there might be a stale forwarding rule
		logger.Info("not reconciling, no 'controller.autonpsc.dev/psc-serviceattachment' label", "gateway", gw, "forwarding-rules", gw.Annotations["networking.gke.io/forwarding-rules"])
		return reconcile.Result{}, nil
	}
	if gw.Annotations["networking.gke.io/forwarding-rules"] == "" {
		logger.Info("not reconciling, no 'networking.k8s.io/forwarding-rules' label", "gateway", gw, "forwarding-rules", gw.Annotations["networking.gke.io/forwarding-rules"])
		return reconcile.Result{}, fmt.Errorf("no_forwarding_rule_yet")
	}

	logger.Info("reconciling", "gateway", gw, "forwarding-rules", gw.Annotations["networking.gke.io/forwarding-rules"])
	service := r.getServiceAttachmentService()

	name := gw.Annotations["controller.autonpsc.dev/psc-serviceattachment"]
	attachment, err := service.Get(r.project, r.region, name).Context(ctx).Do()
	if err != nil {
		switch errr := err.(type) {
		default:
			logger.Error(err, "Failed retrieving ServiceAttachment")
		case *googleapi.Error:
			if errr.Code == 404 {
				logger.Info("ServiceAttachment doesn't exist yet")
			} else {
				logger.Error(err, "Failed retrieving ServiceAttachment")
			}
		}
	}
	if gw.ObjectMeta.DeletionTimestamp.IsZero() {
		err := handleReconciliation(ctx, req, gw, attachment, name, service, r, logger)
		if err != nil {
			return reconcile.Result{}, err
		}
	} else {
		err := handleDeletion(ctx, req, attachment, service, r, name, logger, gw)
		if err != nil {
			return reconcile.Result{}, err
		}
	}
	return reconcile.Result{}, nil
}

func handleDeletion(ctx context.Context, req ctrl.Request, attachment *compute.ServiceAttachment, service *compute.ServiceAttachmentsService, r *ServiceReconciler, name string, logger logr.Logger, gw *gatewayv1beta1.Gateway) error {
	if attachment != nil {
		logger.Info("Deleting Service Attachment")
		lop, err := service.Delete(r.project, r.region, name).Context(ctx).Do()
		if err != nil {
			logger.Error(err, "Failed deleting ServiceAttachment")
			return fmt.Errorf("failed_deleting")
		} else {
			logger.Info("Waiting for ServiceAttachment deletion")
			go r.trackLopDeletion(ctx, req, gw, lop, logger)
		}
	}
	return nil
}

func handleReconciliation(ctx context.Context, req ctrl.Request, gw *gatewayv1beta1.Gateway, attachment *compute.ServiceAttachment, name string, service *compute.ServiceAttachmentsService, r *ServiceReconciler, logger logr.Logger) error {
	if attachment == nil {
		lop, err := service.Insert(r.project, r.region, createServieAttachmentFromGateway(gw)).Context(ctx).Do()
		if err != nil {
			logger.Error(err, "Failed creating ServiceAttachment")
			return fmt.Errorf("failed_creating")
		} else {
			logger.Info("Creating ServiceAttachment")
			go r.trackLopCreation(ctx, req, gw, lop, logger)
		}

	} else {
		change_detected := false
		newAttachment := createServieAttachmentFromGateway(gw)
		if attachment.TargetService != newAttachment.TargetService {
			r.Recorder.Eventf(gw, "Normal", "Sync",
				"Cannot change target service of ServiceAttachment, TODO implement ServiceAttachment recreation")
		}

		if attachment.ConnectionPreference != newAttachment.ConnectionPreference {
			logger.Info("change on `ConnectionPreference` detected")
			change_detected = true
		}

		if !NatSubnetIsEqual(attachment.NatSubnets, newAttachment.NatSubnets) {
			logger.Info("change on `NatSubnets` detected", "old", attachment.NatSubnets, "new", newAttachment.NatSubnets)
			change_detected = true
		}

		if !reflect.DeepEqual(attachment.DomainNames, newAttachment.DomainNames) {
			logger.Info("change on `DomainNames` detected", "old", attachment.DomainNames, "new", newAttachment.DomainNames)
			change_detected = true
		}

		if !reflect.DeepEqual(attachment.ConsumerAcceptLists, newAttachment.ConsumerAcceptLists) {
			logger.Info("change on `ConsumerAcceptLists` detected", "old", attachment.ConsumerAcceptLists, "new", newAttachment.ConsumerAcceptLists)
			change_detected = true
		}
		if change_detected {
			newAttachment.Fingerprint = attachment.Fingerprint
			newAttachment.TargetService = ""
			newAttachment.Name = ""
			lop, err := service.Patch(r.project, r.region, name, newAttachment).Context(ctx).Do()
			if err != nil {
				logger.Error(err, "Failed updating ServiceAttachment")
				return fmt.Errorf("failed_updating")
			} else {
				logger.Info("Updating ServiceAttachment")
				go r.trackLopUpdate(ctx, req, gw, lop, logger)
			}
		} else {
			logger.Info("No Change detected, no update necessary")
		}
	}
	return nil
}

func createServieAttachmentFromGateway(gw *gatewayv1beta1.Gateway) *compute.ServiceAttachment {
	var connectionPreference = "ACCEPT_AUTOMATIC"
	consumerAcceptLists, connectionPreference := extractConnectionPreferenceAndConsumerAcceptList(gw, connectionPreference)
	natSubnets := convertCommaSeparatedStringToArray(gw, "controller.autonpsc.dev/psc-serviceattachment-natsubnets")
	domainNames := convertCommaSeparatedStringToArray(gw, "controller.autonpsc.dev/psc-serviceattachment-domainNames")
	forwardingRuleName := gw.Annotations["networking.gke.io/forwarding-rules"]

	gwToCreate := compute.ServiceAttachment{
		ConnectionPreference: connectionPreference,
		ConsumerAcceptLists:  consumerAcceptLists,
		Name:                 gw.Annotations["controller.autonpsc.dev/psc-serviceattachment"],
		//EnableProxyProtocol:  false,
		NatSubnets:    natSubnets,
		DomainNames:   domainNames,
		TargetService: forwardingRuleName,
	}

	if gw.Annotations["controller.autonpsc.dev/psc-serviceattachment-domainNames"] == "" {
		gwToCreate.DomainNames = nil
	}

	if gw.Annotations["controller.autonpsc.dev/psc-serviceattachment-natsubnets"] == "" {
		gwToCreate.NatSubnets = nil
	}

	if gw.Annotations["controller.autonpsc.dev/psc-serviceattachment-allowed"] == "" {
		gwToCreate.ConsumerAcceptLists = nil
	}

	return &gwToCreate
}

func convertCommaSeparatedStringToArray(gw *gatewayv1beta1.Gateway, propertyName string) []string {
	return strings.FieldsFunc(gw.Annotations[propertyName], func(c rune) bool { return c == ',' || unicode.IsSpace(c) })
}

func extractConnectionPreferenceAndConsumerAcceptList(gw *gatewayv1beta1.Gateway, connectionPreference string) ([]*compute.ServiceAttachmentConsumerProjectLimit, string) {
	var consumerAcceptLists = make([]*compute.ServiceAttachmentConsumerProjectLimit, 0)
	if gw.Annotations["controller.autonpsc.dev/psc-serviceattachment-allowed"] != "" {
		allowedProjectIds := strings.Split(gw.Annotations["controller.autonpsc.dev/psc-serviceattachment-allowed"], ",")
		for _, allowedProjectId := range allowedProjectIds {
			consumerAcceptLists = append(consumerAcceptLists, &compute.ServiceAttachmentConsumerProjectLimit{
				ProjectIdOrNum:  strings.TrimSpace(allowedProjectId),
				ConnectionLimit: 10,
			})
		}
		connectionPreference = "ACCEPT_MANUAL"
	}
	return consumerAcceptLists, connectionPreference
}

func (r *ServiceReconciler) getServiceAttachmentService() *compute.ServiceAttachmentsService {
	return compute.NewServiceAttachmentsService(r.s)
}

func (r *ServiceReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&gatewayv1beta1.Gateway{}).
		Complete(r)
}

func NatSubnetIsEqual(original, new []string) bool {
	if len(original) != len(new) {
		return false
	}
	for _, val2 := range new {
		contained := false
		for _, val1 := range original {
			if strings.Contains(val1, val2) {
				contained = true
				break
			}
		}
		if !contained {
			return false
		}
	}
	return true
}

func (r *ServiceReconciler) addFinalizerToGateway(ctx context.Context, gw *gatewayv1beta1.Gateway) error {
	if !controllerutil.ContainsFinalizer(gw, finalizerName) {
		controllerutil.AddFinalizer(gw, finalizerName)
		if err := r.Update(ctx, gw); err != nil {
			return err
		}
	}
	return nil
}

func (r *ServiceReconciler) removeFinalizerFromGateway(ctx context.Context, gw *gatewayv1beta1.Gateway) error {
	if controllerutil.ContainsFinalizer(gw, finalizerName) {
		controllerutil.RemoveFinalizer(gw, finalizerName)
		if err := r.Update(ctx, gw); err != nil {
			return err
		}
	}
	return nil
}
