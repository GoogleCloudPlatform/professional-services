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

package main

import (
	"context"
	"flag"
	"os"
	"strings"

	"sigs.k8s.io/controller-runtime/pkg/healthz"

	"cloud.google.com/go/compute/metadata"
	"github.com/GoogleCloudPlatform/gke-autopsc-controller/controllers"
	"google.golang.org/api/compute/v1"
	"google.golang.org/api/option"
	"k8s.io/apimachinery/pkg/runtime"
	clientgoscheme "k8s.io/client-go/kubernetes/scheme"
	_ "k8s.io/client-go/plugin/pkg/client/auth/gcp"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/log/zap"
	gatewayv1beta1 "sigs.k8s.io/gateway-api/apis/v1beta1"
	// +kubebuilder:scaffold:imports
)

const useragent = "google-pso-tool/gke-autopsc-controller/0.2.0-dev"

var (
	scheme   = runtime.NewScheme()
	setupLog = ctrl.Log.WithName("setup")
)

func init() {
	_ = clientgoscheme.AddToScheme(scheme)
	_ = gatewayv1beta1.AddToScheme(scheme)
	//_ = corev1.AddToScheme(scheme)
	// +kubebuilder:scaffold:scheme
}

func main() {
	var metricsAddr string
	var probeAddr string
	var enableLeaderElection bool
	flag.StringVar(&metricsAddr, "metrics-bind-address", ":8080", "The address the metric endpoint binds to.")
	flag.StringVar(&probeAddr, "health-probe-bind-address", ":8081", "The address the probe endpoint binds to.")
	flag.BoolVar(&enableLeaderElection, "leader-elect", false,
		"Enable leader election for controller manager. Enabling this will ensure there is only one active controller manager.")
	flag.Parse()

	ctrl.SetLogger(zap.New())

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	setupLog.Info("Starting autopsc controller instance")
	s, err := compute.NewService(ctx, option.WithUserAgent(useragent))
	if err != nil {
		setupLog.Error(err, "can't request Google compute service")
		os.Exit(1)
	}

	project := getProject()
	if project == "" {
		setupLog.Error(err, "can't determine project ID")
		os.Exit(1)
	}

	region := getRegion()
	if region == "" {
		setupLog.Error(err, "can't determine region")
		os.Exit(1)
	}

	setupLog.Info("Creating manager")
	mgr, err := ctrl.NewManager(ctrl.GetConfigOrDie(), ctrl.Options{
		Scheme:                 scheme,
		MetricsBindAddress:     metricsAddr,
		LeaderElection:         enableLeaderElection,
		LeaderElectionID:       "9fe89c94.controller.autopsc.dev",
		HealthProbeBindAddress: probeAddr,
	})
	if err != nil {
		setupLog.Error(err, "unable to start manager")
		os.Exit(1)
	}

	if err = (&controllers.ServiceReconciler{
		Client:        mgr.GetClient(),
		PscController: controllers.NewPscController(project, region, s),
		Recorder:      mgr.GetEventRecorderFor("autopsc-controller"),
		Log:           ctrl.Log.WithName("controllers").WithName("Gateway"),
	}).SetupWithManager(mgr); err != nil {
		setupLog.Error(err, "unable to create controller", "controller", "Gateway")
		os.Exit(1)
	}
	// +kubebuilder:scaffold:builder
	if err := mgr.AddHealthzCheck("healthz", healthz.Ping); err != nil {
		setupLog.Error(err, "unable to set up health check")
		os.Exit(1)
	}
	if err := mgr.AddReadyzCheck("readyz", healthz.Ping); err != nil {
		setupLog.Error(err, "unable to set up ready check")
		os.Exit(1)
	}

	setupLog.Info("starting manager")
	if err := mgr.Start(ctrl.SetupSignalHandler()); err != nil {
		setupLog.Error(err, "problem running manager")
		os.Exit(1)
	}
}

func getProject() string {
	// probe metadata service for project, or fall back to PROJECT_ID in environment
	p, err := metadata.ProjectID()
	if err == nil {
		return p
	}
	return os.Getenv("PROJECT_ID")
}

func getRegion() string {
	// probe metadata service for region, or fall back to REGION in environment
	p, err := metadata.Zone()
	if err == nil {
		lastIndex := strings.LastIndex(p, "-")
		return p[:lastIndex]
	}
	return os.Getenv("REGION")
}
