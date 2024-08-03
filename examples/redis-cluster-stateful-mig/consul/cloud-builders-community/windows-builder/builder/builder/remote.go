package builder

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"cloud.google.com/go/compute/metadata"
	"github.com/masterzen/winrm"
	"github.com/packer-community/winrmcp/winrmcp"
)

const (
	runTimeoutDef = 5
)

// Remote represents a remote Windows server.
type Remote struct {
	Hostname   *string
	Username   *string
	Password   *string
	BucketName *string
}

type BuilderServer struct {
	ImageUrl          *string
	VPC               *string
	Subnet            *string
	Region            *string
	Zone              *string
	Labels            *string
	MachineType       *string
	Preemptible       *bool
	DiskSizeGb        *int64
	DiskType          *string
	ServiceAccount    *string
	Tags              *string
	UseInternalNet    *bool
	CreateExternalIP  *bool
}

// Wait for server to be available.
func (r *Remote) Wait() error {
	timeout := time.Now().Add(time.Minute * 5)
	for time.Now().Before(timeout) {
		err := r.RunDef("ver")
		if err == nil {
			return nil
		}
		time.Sleep(10 * time.Second)
	}
	return errors.New("Timed out waiting for server to be available")
}

// Copy workspace from Linux to Windows.
func (r *Remote) Copy(inputPath string, copyTimeoutMin int) error {
	defer func() {
		// Flush stdout
		fmt.Println()
	}()

	if copyTimeoutMin <= 0 {
		return errors.New("copy timeout must be greater than 0")
	}

	hostport := fmt.Sprintf("%s:5986", *r.Hostname)
	c, err := winrmcp.New(hostport, &winrmcp.Config{
		Auth:                  winrmcp.Auth{User: *r.Username, Password: *r.Password},
		Https:                 true,
		Insecure:              true,
		TLSServerName:         "",
		CACertBytes:           nil,
		OperationTimeout:      time.Duration(copyTimeoutMin) * time.Minute,
		MaxOperationsPerShell: 15,
	})
	if err != nil {
		log.Printf("Error creating connection to remote for copy: %+v", err)
		return err
	}

	// First try to create a bucket and have the Windows VM download it via a
	// GS URL. If that fails, use the remote copy method.
	err = r.copyViaBucket(
		context.Background(),
		inputPath,
		`C:\workspace`,
		copyTimeoutMin,
	)
	if err == nil {
		// Successfully copied via GCE bucket
		log.Printf("Successfully copied data via GCE bucket")
		return nil
	}

	log.Printf("Failed to copy data via GCE bucket: %v", err)

	err = c.Copy(inputPath, `C:\workspace`)
	if err != nil {
		log.Printf("Error copying workspace to remote: %+v", err)
		return err
	}

	return nil
}

func (r *Remote) copyViaBucket(ctx context.Context, inputPath, outputPath string, copyTimeoutMin int) error {
	var bucket string
	if r.BucketName == nil || *r.BucketName == "" {
		// Cloud Build creates a bucket called <PROJECT-ID>_cloudbuild. Put
		// the object there.
		client := metadata.NewClient(http.DefaultClient)
		projectID, err := client.ProjectID()
		if err != nil {
			return fmt.Errorf("metadata.ProjectID: %v", err)
		}
		bucket = fmt.Sprintf("%s_cloudbuild", projectID)
	} else {
		bucket = *r.BucketName
	}
	object := fmt.Sprintf("windows-builder-%d", time.Now().UnixNano())

	gsURL, err := writeZipToBucket(
		ctx,
		bucket,
		object,
		inputPath,
	)
	if err != nil {
		return err
	}

	pwrScript := fmt.Sprintf(`
$ErrorActionPreference = "Stop"
$ProgressPreference = 'SilentlyContinue'
gsutil cp %q c:\workspace.zip
Expand-Archive -Path c:\workspace.zip -DestinationPath c:\workspace -Force
`, gsURL)

	// Now tell the Windows VM to download it.
	return r.Run(winrm.Powershell(pwrScript), copyTimeoutMin)
}

// Run a command on the Windows remote.
func (r *Remote) RunDef(command string) error {
	return r.Run(command, runTimeoutDef)
}

func (r *Remote) Run(command string, runTimeoutMin int) error {
	if runTimeoutMin <= 0 {
		return errors.New("runTimeout must be greater than 0")
	}

	runTimeout := time.Duration(runTimeoutMin) * time.Minute

	cmdstring := fmt.Sprintf(`cd c:\workspace & %s`, command)
	endpoint := winrm.NewEndpoint(*r.Hostname, 5986, true, true, nil, nil, nil, runTimeout)
	w, err := winrm.NewClient(endpoint, *r.Username, *r.Password)
	if err != nil {
		return err
	}
	shell, err := w.CreateShell()
	if err != nil {
		return err
	}
	var cmd *winrm.Command
	cmd, err = shell.Execute(cmdstring)
	if err != nil {
		return err
	}

	go io.Copy(os.Stdout, cmd.Stdout)
	go io.Copy(os.Stderr, cmd.Stderr)

	cmd.Wait()
	shell.Close()

	if cmd.ExitCode() != 0 {
		return fmt.Errorf("command failed with exit-code:%d", cmd.ExitCode())
	}

	return nil
}

func (bs *BuilderServer) GetServiceAccountEmail(projectID string) string {
	if *bs.ServiceAccount == "default" || strings.Contains(*bs.ServiceAccount, "@") {
		return *bs.ServiceAccount
	}
	//add service account email suffix
	return fmt.Sprintf("%s@%s.iam.gserviceaccount.com", *bs.ServiceAccount, projectID)
}

func (bs *BuilderServer) GetLabelsMap() map[string]string {
	if *bs.Labels == "" {
		return nil
	}
	
	var labelsMap map[string]string

	for _, label := range strings.Split(*bs.Labels, ",") {
		labelSpl := strings.Split(label, "=")
		if len(labelSpl) != 2 {
			log.Printf("Error: Label needs to be key=value template. %s label ignored", label)
			continue
		}

		var key = strings.TrimSpace(labelSpl[0])
		if len(key) == 0 {
			log.Printf("Error: Label key can't be empty. %s label ignored", label)
			continue
		}
		var value = strings.TrimSpace(labelSpl[1])

		if labelsMap == nil {
			labelsMap = make(map[string]string)
		}
		labelsMap[key] = value
	}
	return labelsMap
}

func (bs *BuilderServer) GetTags() []string {
  if *bs.Tags == "" {
    return nil
  }

	var tags []string
  for _, tag := range strings.Split(*bs.Tags, ",") {
		tags = append(tags, strings.TrimSpace(tag))
	}
	return tags
}
