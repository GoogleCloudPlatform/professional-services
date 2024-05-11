package main

import (
	"os/signal"
	"context"
	"syscall"
	"flag"
	"log"
	"os"

	"github.com/GoogleCloudPlatform/cloud-builders-community/windows-builder/builder/builder"
)

var (
	hostname         = flag.String("hostname", "", "Hostname of remote Windows server")
	username         = flag.String("username", "", "Username on remote Windows server")
	password         = flag.String("password", os.Getenv("PASSWORD"), "Password on remote Windows server")
	command          = flag.String("command", "", "Command to run on remote Windows server")
	notCopyWorkspace = flag.Bool("not-copy-workspace", false, "If copy workspace or not")
	workspacePath    = flag.String("workspace-path", "/workspace", "The directory to copy data from")
	workspaceBucket  = flag.String("workspace-bucket", "", "The bucket to copy the directory to. Defaults to {project-id}_cloudbuild")
	image            = flag.String("image", "windows-cloud/global/images/windows-server-2019-dc-for-containers-v20191210", "Windows image to start the server from")
	network          = flag.String("network", "default", "The VPC name to use when creating the Windows server")
	subnetwork       = flag.String("subnetwork", "default", "The Subnetwork name to use when creating the Windows server")
	region           = flag.String("region", "us-central1", "The region name to use when creating the Windows server")
	zone             = flag.String("zone", "us-central1-f", "The zone name to use when creating the Windows server")
	labels           = flag.String("labels", "", "List of label KEY=VALUE pairs separated by comma to add when creating the Windows server")
	machineType      = flag.String("machineType", "", "The machine type to use when creating the Windows server")
	preemptible      = flag.Bool("preemptible", false, "If instance running the Windows server should be preemptible or not")
	diskSizeGb       = flag.Int64("diskSizeGb", 50, "The disk size to use when creating the Windows server")
	diskType         = flag.String("diskType", "", "The disk type to use when creating the Windows server")
	commandTimeout   = flag.Int("commandTimeout", 5, "The command run timeout in minutes")
	copyTimeout      = flag.Int("copyTimeout", 5, "The workspace copy timeout in minutes")
	serviceAccount   = flag.String("serviceAccount", "default", "The service account to use when creating the Windows server")
	tags             = flag.String("tags", "", "List of strings eparated by comma to add when creating the Windows server")
	useInternalNet   = flag.Bool("use-internal-network", false, "Communicate with Windows server over the internal network")
	createExternalIP = flag.Bool("create-external-ip", false, "Create an external IP address when using internal network")
)

func main() {
	log.Print("Starting Windows builder")
	flag.Parse()
	var r *builder.Remote
	var s *builder.Server
	var bs *builder.BuilderServer

	// Connect to server
	if (*hostname != "") && (*username != "") && (*password != "") {
		r = &builder.Remote{
			Hostname: hostname,
			Username: username,
			Password: password,
		}
		log.Printf("Connecting to existing host %s", *r.Hostname)
	} else {
		ctx := context.Background()
		bs = &builder.BuilderServer{
			ImageUrl:         image,
			VPC:              network,
			Subnet:           subnetwork,
			Region:           region,
			Zone:             zone,
			Labels:           labels,
			MachineType:      machineType,
			Preemptible:      preemptible,
			DiskSizeGb:       diskSizeGb,
			DiskType:         diskType,
			ServiceAccount:   serviceAccount,
			Tags:             tags,
			UseInternalNet:   useInternalNet,
			CreateExternalIP: createExternalIP,
		}
		s = builder.NewServer(ctx, bs)
		r = &s.Remote

		log.Print("Setting up termination signal handler")
		sigsChannel := make(chan os.Signal, 1)
		signal.Notify(sigsChannel, syscall.SIGTERM, syscall.SIGINT, syscall.SIGQUIT)
		go func() {
			sig := <-sigsChannel
			log.Printf("Signal %+v received, terminating", sig)
			deleteInstanceAndExit(s, bs, 1)
		}()
	}

	log.Print("Waiting for server to become available")
	err := r.Wait()
	if err != nil {
		log.Printf("Error connecting to server: %+v", err)
		deleteInstanceAndExit(s, bs, 1)
	}

	r.BucketName = workspaceBucket
	// Copy workspace to remote machine
	if !*notCopyWorkspace {
		log.Print("Copying workspace")
		err = r.Copy(*workspacePath, *copyTimeout)
		if err != nil {
			log.Printf("Error copying workspace: %+v", err)
			deleteInstanceAndExit(s, bs, 1)
		}
	}

	// Execute on remote
	log.Printf("Executing command %s", *command)
	err = r.Run(*command, *commandTimeout)
	if err != nil {
		log.Printf("Error executing command: %+v", err)
		deleteInstanceAndExit(s, bs, 1)
	}

	// Shut down server if started
	deleteInstanceAndExit(s, bs, 0)
}

func deleteInstanceAndExit(s *builder.Server, bs *builder.BuilderServer, exitCode int) {
	if s != nil {
		err := s.DeleteInstance(bs)
		if err != nil {
			log.Fatalf("Failed to shut down instance: %+v", err)
		} else {
			log.Print("Instance shut down successfully")
		}
	}

	os.Exit(exitCode)
}
