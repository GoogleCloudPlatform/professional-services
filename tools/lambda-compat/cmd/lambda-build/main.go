package main

/*
   Copyright 2022 Google LLC
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

import (
	"embed"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io/ioutil"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
	"text/template"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"gopkg.in/yaml.v3"
)

type SamTemplate struct {
	TemplateFormatVersion string                  `yaml:"AWSTemplateFormatVersion"`
	Transform             string                  `yaml:"Transform"`
	Resources             map[string]*SamResource `yaml:"Resources"`
}

type SamResource struct {
	Type       string                 `yaml:"Type"`
	Properties map[string]interface{} `yaml:"Properties"`
}

type arrayFlags []string

var templateDir string = "templates/"
var generateDockerfile bool = true
var dockerfilePath string = "Dockerfile"
var generateTerraform bool = true
var terraformPath string = "./"
var projectId string = ""
var containerRegistry string = ""
var containerTag string = "latest"
var additionalVars arrayFlags
var additionalVarsJson arrayFlags
var targetDir string = "."

//go:embed templates/*.tpl
var fs embed.FS

func (i *arrayFlags) String() string {
	// change this, this is just can example to satisfy the interface
	return fmt.Sprintf("%v", *i)
}

func (i *arrayFlags) Set(value string) error {
	*i = append(*i, strings.TrimSpace(value))
	return nil
}

func (r SamResource) getStringProperty(properties map[string]interface{}, key string, mustHave bool) string {
	if _, ok := properties[key]; ok {
		return properties[key].(string)
	} else {
		if mustHave {
			log.Fatal().Str("property", key).Msg("Missing required property")
		}
	}
	return ""
}

func (r SamResource) getInt64Property(properties map[string]interface{}, key string, mustHave bool) int64 {
	if _, ok := properties[key]; ok {
		return properties[key].(int64)
	} else {
		if mustHave {
			log.Fatal().Str("property", key).Msg("Missing required property")
		}
	}
	return 0
}

func makeMap(args ...string) map[string]string {
	ret := make(map[string]string, len(args)/2)
	for i := 0; i < len(args); i++ {
		ret[args[i]] = args[i+1]
		i += 1
	}
	return ret
}

func addToMap(add map[string]string, key string, val string) map[string]string {
	add[key] = val
	return add
}

func getTemplateFunctions() *template.FuncMap {
	funcMap := template.FuncMap{
		"MakeMap":   makeMap,
		"AddToMap":  addToMap,
		"HasSuffix": strings.HasSuffix,
		"ToLower":   strings.ToLower,
	}
	return &funcMap
}

func ensureDirectory(dir string) {
	dirStat, err := os.Stat(dir)
	if os.IsNotExist(err) {
		log.Info().Str("directory", dir).Msg("Creating subdirectory")
		err = os.MkdirAll(dir, 0770)
		if err != nil {
			log.Fatal().Err(err).Str("directory", dir).Msg("Failed to create subdirectory")
		}
	} else if !dirStat.IsDir() {
		log.Fatal().Err(err).Str("directory", dir).Msg("Subdirectory existing and is not a directory")
	}
}

func (resource SamResource) getTemplateVariables(name string) *map[string]interface{} {
	handler := resource.getStringProperty(resource.Properties, "Handler", true)
	runtime := resource.getStringProperty(resource.Properties, "Runtime", true)
	codeURI := resource.getStringProperty(resource.Properties, "CodeUri", true)
	if !strings.HasSuffix(codeURI, "/") {
		codeURI = fmt.Sprintf("%s/", codeURI)
	}
	packageType := resource.getStringProperty(resource.Properties, "PackageType", false)
	if packageType == "" {
		packageType = "Zip"
	}
	templateVars := map[string]interface{}{
		"Name":        name,
		"Runtime":     runtime,
		"CodeUri":     codeURI,
		"Handler":     handler,
		"PackageType": packageType,
		"Registry":    containerRegistry,
		"ProjectId":   projectId,
		"Tag":         containerTag,
		"Environment": map[string]interface{}{
			"Variables": map[string]interface{}{},
		},
	}

	if _, ok := resource.Properties["Environment"]; ok {
		environment := resource.Properties["Environment"].(map[string]interface{})
		if _, ok = environment["Variables"]; ok {
			(templateVars["Environment"].(map[string]interface{}))["Variables"] = environment["Variables"]
		}
	}

	for _, tVar := range additionalVars {
		s := strings.SplitN(tVar, "=", 2)
		templateVars[s[0]] = s[1]
	}

	for _, tVar := range additionalVarsJson {
		var v interface{}
		s := strings.SplitN(tVar, "=", 2)
		if err := json.Unmarshal([]byte(s[1]), &v); err != nil {
			log.Fatal().Err(err).Msg("Failed to parse JSON parameter")
		}
		templateVars[s[0]] = v
	}

	return &templateVars
}

func (resource SamResource) renderDockerfile(name string, dockerfile string) error {
	templateVars := resource.getTemplateVariables(name)

	runtimeRE := regexp.MustCompile(`[0-9].*$`)
	runtimeTemplate := runtimeRE.ReplaceAllString((*templateVars)["Runtime"].(string), "")

	templateFile := fmt.Sprintf("%s%s.tpl", templateDir, runtimeTemplate)
	commonTemplateFile := fmt.Sprintf("%scommon.tpl", templateDir)
	tmpl, err := template.New(fmt.Sprintf("%s.tpl", runtimeTemplate)).
		Funcs(*getTemplateFunctions()).
		ParseFiles(commonTemplateFile, templateFile)
	if err != nil {
		return err
	}

	log.Info().Str("file", dockerfile).Str("template", filepath.Base(templateFile)).Msg("Creating Dockerfile file")
	f, err := os.OpenFile(dockerfile, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0640)
	if err != nil {
		return err
	}
	defer f.Close()

	err = tmpl.Execute(f, templateVars)
	if err != nil {
		return err
	}
	f.Close()

	return nil
}

func (resource SamResource) renderTerraform(name string, dir string) error {
	terraformTemplateGlob := fmt.Sprintf("%s/terraform_*.tpl", templateDir)
	terraformTemplates, err := filepath.Glob(terraformTemplateGlob)
	if err != nil {
		return err
	}

	for _, templateFile := range terraformTemplates {
		templateBasename := strings.ReplaceAll(filepath.Base(templateFile), "terraform_", "")
		templateBasename = strings.ReplaceAll(templateBasename, ".tpl", "")
		tmpl, err := template.New(filepath.Base(templateFile)).
			Funcs(*getTemplateFunctions()).
			ParseFiles(templateFile)
		if err != nil {
			return err
		}

		resultPath := fmt.Sprintf("%s/%s", filepath.Clean(dir), templateBasename)
		log.Info().Str("file", resultPath).Str("template", filepath.Base(templateFile)).Msg("Creating Terraform file")
		f, err := os.OpenFile(resultPath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0640)
		if err != nil {
			return err
		}
		defer f.Close()

		err = tmpl.Execute(f, resource.getTemplateVariables(name))
		if err != nil {
			return err
		}
		f.Close()
	}

	return nil
}

func main() {
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})

	exe, err := os.Executable()
	if err != nil {
		log.Fatal().Err(err).Msg("unable to determine binary location")
	}
	templateDir = fmt.Sprintf("%s/templates/", filepath.Dir(exe))

	log.Info().Msg("Lambda compatibility tool for Cloud Run")

	flag.StringVar(&templateDir, "template-dir", templateDir, "location of Dockerfile and Terraform templates")
	flag.StringVar(&targetDir, "target-dir", targetDir, "directory to create Dockerfile and Terraform files in")
	flag.BoolVar(&generateDockerfile, "dockerfile", true, "generate Dockerfile")
	flag.StringVar(&dockerfilePath, "dockerfile-path", dockerfilePath, "path and filename for Dockerfile")
	flag.BoolVar(&generateTerraform, "terraform", true, "generate Terraform files")
	flag.StringVar(&terraformPath, "terraform-path", terraformPath, "path for Terraform files")
	flag.StringVar(&projectId, "project-id", projectId, "GCP project ID")
	flag.StringVar(&containerRegistry, "registry", containerRegistry, "Container registry to use (eg. docker.pkg.dev/project-id/registry)")
	flag.StringVar(&containerTag, "tag", containerTag, "Container image tag")
	flag.Var(&additionalVars, "var", "Additional template variable (key=value)")
	flag.Var(&additionalVarsJson, "var-json", "Additional template variable in JSON (key={\"foo\":\"bar\"})")
	flag.Parse()

	if !strings.HasSuffix(templateDir, "/") {
		templateDir = templateDir + "/"
	}

	if _, err := os.Stat(templateDir + "common.tpl"); errors.Is(err, os.ErrNotExist) {
		if _, err := os.Stat(templateDir + "common.tpl"); errors.Is(err, os.ErrNotExist) {
			log.Info().Str("directory", templateDir).Msg("Creating template directory")
			err = os.MkdirAll(templateDir, 0770)
			if err != nil {
				log.Fatal().Err(err).Str("directory", templateDir).Msg("Failed to create template directory")
			}
		}
		templates := []string{
			"common.tpl",
			"dotnetcore.tpl",
			"go.tpl",
			"java.tpl",
			"nodejs.tpl",
			"python.tpl",
			"ruby.tpl",
			"terraform_main.tf.tpl",
			"terraform_outputs.tf.tpl",
			"terraform_variables.tf.tpl",
			"terraform_versions.tf.tpl",
		}
		log.Info().Str("directory", templateDir).Msg("Writing embedded templates to disk")
		for _, tpl := range templates {
			contents, err := fs.ReadFile(fmt.Sprintf("templates/%s", tpl))
			if err != nil {
				log.Fatal().Err(err).Msg("Failed to retrieve embedded template")
			}
			err = ioutil.WriteFile(fmt.Sprintf("%s/%s", templateDir, tpl), contents, 0664)
			if err != nil {
				log.Fatal().Err(err).Msg("Failed to write embedded template")
			}
		}

	}

	var containerBuilders []string = []string{
		"buildah",
		"podman",
		"nerdctl",
	}
	var containerBuilder string = "docker"
	for _, bin := range containerBuilders {
		_, err := exec.LookPath(bin)
		if err == nil {
			containerBuilder = bin
			break
		}
	}

	if !strings.HasSuffix(containerRegistry, "/") {
		containerRegistry = strings.TrimSuffix(containerRegistry, "/")
	}

	if len(flag.Args()) == 0 {
		log.Fatal().Msg("Specify at least one template to process")
	}

	for _, fileName := range flag.Args() {
		var template SamTemplate
		yamlFile, err := ioutil.ReadFile(fileName)
		if err != nil {
			log.Fatal().Str("file", fileName).Err(err).Msg("Failed to load configuration file")
		}
		err = yaml.Unmarshal(yamlFile, &template)
		if err != nil {
			log.Fatal().Str("file", fileName).Err(err).Msg("Failed to decode YAML")
		}
		log.Info().Str("file", fileName).Msg("Processing SAM template file")

		for name, resource := range template.Resources {
			if resource.Type == "AWS::Serverless::Function" {
				subdir := filepath.Clean(fmt.Sprintf("%s/%s", filepath.Clean(targetDir), name)) + "/"
				if generateDockerfile {
					ensureDirectory(subdir)
					dockerfile := fmt.Sprintf("%s%s", subdir, dockerfilePath)

					err := resource.renderDockerfile(name, dockerfile)
					if err != nil {
						log.Fatal().Str("file", fileName).Str("resource", name).Err(err).Msg("Failed to render Dockerfile for resource")
					}
					if containerRegistry != "" {
						log.Info().Msg("To build container, run:")
						log.Info().Msg(fmt.Sprintf("  %s build -t %s/%s:%s -f %s/Dockerfile .", containerBuilder, containerRegistry, strings.ToLower(name), containerTag, name))
					}
				}

				if generateTerraform {
					terraformSubdir := fmt.Sprintf("%s%s", subdir, terraformPath)
					ensureDirectory(terraformSubdir)

					err := resource.renderTerraform(name, terraformSubdir)
					if err != nil {
						log.Fatal().Str("file", fileName).Str("resource", name).Err(err).Msg("Failed to render Terraform for resource")
					}
				}

			} else {
				log.Debug().Str("type", resource.Type).Msg("Unknown resource type ignored")
			}
		}

	}
}
