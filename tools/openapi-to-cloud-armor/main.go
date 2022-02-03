// Copyright 2021 Google LLC
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

package main

import (
	"flag"
	"fmt"
	"log"
	"net/url"
	"regexp"
	"sort"
	"strings"

	"github.com/getkin/kin-openapi/openapi3"
	"gopkg.in/yaml.v2"
)

var input = flag.String("input", "", "Input file OpenAPI3 spec, can either be a local path or a http or https URL (required)")
var enableLayer7DdosDefenseConfig = flag.Bool("enableLayer7DdosDefenseConfig", false, "Should the Layer 7 DDOS Defense be enabled https://cloud.google.com/armor/docs/adaptive-protection-overview (optional; default false)")
var compressedFormat = flag.Bool("compressed", false, "Should you run into rule quotas you can try the compressed format,\n which tries to compact the API specification into a single rule. This has a risk of allowing unspecified methods on some paths. (optional; default false)")
var methodwise = flag.Bool("methodwise", true, "The methodwise format creates a rule per HTTP Method, the path expression is compressed to decrease size by ommitting paths that are covered by a regulare expression (optional; default true)")
var pathwise = flag.Bool("pathwise", false, "The pathwise format, creates a single rule per path (paths that are included in other path expressions are ommited), it provides human readable rules (optional; default false)")

var startPriority = flag.Int("priority", 1000, "Start priority for the rules (optional; default 1000)")

var generateDefaultDenyRule = flag.Bool("defaultRule", true, "Should a default deny rule be generated (optional; default true)")
var denyRuleResponseCode = flag.Int("defaultDenyResponseCode", 404, "HTTP Status Code for the default deny rule (optional; default 404)")

func main() {
	flag.Parse()
	CheckPreconditions()

	var err error
	doc, err := ReadOpenApiSpec(strings.TrimSpace(*input))
	if err != nil {
		log.Fatalf("Failed loading OpenAPI spec: %v", err)
		return
	}

	rules := []Rule{}
	if *compressedFormat {
		rules, err = GeneratedCompressedRules(rules, doc)
		if err != nil {
			log.Fatalf("Failed creating compressedrules: %v", err)
			return
		}
	} else {
		if *methodwise {
			rules, err = GenerateMethodwiseRules(rules, doc)
			if err != nil {
				log.Fatalf("Failed creating methodwise rules: %v", err)
				return
			}
		} else if *pathwise {
			rules, err = GeneratePathwiseRules(rules, doc)
			if err != nil {
				log.Fatalf("Failed creating rules: %v", err)
				return
			}
		}
	}
	if *generateDefaultDenyRule {
		rules = append(rules, *DefaultRule())
	}

	policy := NewPolicy(fmt.Sprintf("Policy for %s", doc.Info.Title), "Generated policy based on OpenAPI definition", *enableLayer7DdosDefenseConfig, rules)
	output, err := yaml.Marshal(&policy)
	if err != nil {
		log.Fatalf("Couldn't marshal output: %v", err)
		return
	}
	fmt.Print(string(output))
}

func GeneratePathwiseRules(rules []Rule, doc *openapi3.T) ([]Rule, error) {
	priority := *startPriority
	var paths = []string{}
	for path, _ := range doc.Paths {
		pathRegEx := ToRegEx(path)
		paths = append(paths, pathRegEx)
	}
	paths = FilterPaths(paths)

	for path, v := range doc.Paths {
		if Contains(paths, ToRegEx(path)) {
			methodPart := ""
			for method, _ := range v.Operations() {
				if methodPart == "" {
					methodPart = fmt.Sprintf("request.method=='%s'", method)
				} else {
					methodPart = fmt.Sprintf("%s || request.method=='%s'", methodPart, method)
				}
			}

			expression := fmt.Sprintf("(%s) && request.path.matches('%s')", methodPart, ToRegEx(path))
			if len(expression) > 2048 {
				log.Println("[WARN] The security policy contains more than 2048 characters, you might run into the limit for expression length.")
			} else if len(expression) > 1024 {
				log.Println("[WARN] The security policy contains more than 1024 characters, you might run into the limit for subexpression length.")
			}
			rule, err := NewRule(fmt.Sprintf("Rule for %s", path), "allow", priority, false, expression)
			if err != nil {
				return nil, err
			}
			if priority == 120 {
				log.Println("[WARN] The security policy contains more than 20 rules, you might run into Quota issues.")
			}
			rules = append(rules, *rule)
			priority++
		}
	}
	return rules, nil
}

func GenerateMethodwiseRules(rules []Rule, doc *openapi3.T) ([]Rule, error) {
	methodToPaths := make(map[string][]string)
	for path, v := range doc.Paths {
		for method, _ := range v.Operations() {
			methodToPaths[method] = append(methodToPaths[method], ToRegEx(path))
		}
	}

	priority := *startPriority
	for method, paths := range methodToPaths {

		paths = FilterPaths(paths)
		sort.Strings(paths)

		var pathPart string = ""
		for _, path := range paths {
			if pathPart == "" {
				pathPart = path
			} else {
				pathPart = fmt.Sprintf("%s|%s", pathPart, path)
			}
		}

		expression := fmt.Sprintf("request.method=='%s' && request.path.matches('%s')", method, pathPart)
		if len(expression) > 2048 {
			log.Println("[WARN] The security policy contains more than 2048 characters, you might run into the limit for expression length.")
		} else if len(expression) > 1024 {
			log.Println("[WARN] The security policy contains more than 1024 characters, you might run into the limit for subexpression length.")
		}
		var rule *Rule
		rule, err := NewRule(fmt.Sprintf("Generated rules for method %s", method), "allow", priority, false, expression)
		if err != nil {
			return nil, err
		}
		if priority == 120 {
			log.Println("[WARN] The security policy contains more than 20 rules, you might run into Quota issues.")
		}
		rules = append(rules, *rule)
		priority++
	}
	return rules, nil
}

func GeneratedCompressedRules(rules []Rule, doc *openapi3.T) ([]Rule, error) {
	var methodPart string = ""
	var paths = []string{}
	for path, v := range doc.Paths {
		pathRegEx := ToRegEx(path)
		if !Contains(paths, pathRegEx) {
			paths = append(paths, pathRegEx)
		}
		for method, _ := range v.Operations() {
			if !strings.Contains(methodPart, method) {
				if methodPart == "" {
					methodPart = fmt.Sprintf("request.method=='%s'", method)
				} else {
					methodPart = fmt.Sprintf("%s || request.method=='%s'", methodPart, method)
				}
			}
		}
	}
	paths = FilterPaths(paths)
	sort.Strings(paths)
	var pathPart string = ""
	for _, path := range paths {
		if pathPart == "" {
			pathPart = path
		} else {
			pathPart = fmt.Sprintf("%s|%s", pathPart, path)
		}
	}

	expression := fmt.Sprintf("(%s) && request.path.matches('%s')", methodPart, pathPart)
	if len(expression) > 2048 {
		log.Println("[WARN] The security policy contains more than 2048 characters, you might run into the limit for expression length.")
	} else if len(expression) > 1024 {
		log.Println("[WARN] The security policy contains more than 1024 characters, you might run into the limit for subexpression length.")
	}
	rule, err := NewRule("Generated path and method rules", "allow", *startPriority, false, expression)
	if err != nil {
		return nil, err
	}
	rules = append(rules, *rule)
	return rules, nil
}

func DefaultRule() *Rule {
	rule, err := NewRuleWithIpRanges("Default Rule", fmt.Sprintf("deny(%d)", *denyRuleResponseCode), 2147483647, false,
		[]string{"*"},
	)
	if err != nil {
		log.Fatalf("Failed creating rule: %v", err)
		return nil
	}
	return rule
}

func ToRegEx(input string) string {
	regex, err := regexp.Compile(`{[-a-zA-Z0-9@:%._\+~#=]*}`)
	if err != nil {
		log.Fatalf("Failed parsing input file: %v", err)
		return ""
	}
	return fmt.Sprintf("%s$", regex.ReplaceAllString(strings.TrimSpace(input), "[^/]*"))
}

func Contains(array []string, value string) bool {
	for i := 0; i < len(array); i++ {
		if array[i] == value {
			return true
		}
	}
	return false
}

func ContainsWithRegex(array []string, regex string) bool {
	compileRegEx, err := regexp.Compile(regex)
	if err != nil {
		log.Panic(err)
		return false
	}
	for i := 0; i < len(array); i++ {
		if array[i] == regex {
			return true
		} else if compileRegEx.MatchString(array[i]) {
			return true
		}
	}
	return false
}

func FilterPaths(paths []string) []string {
	for i := 0; i < len(paths); i++ {
		path1 := paths[i]
		for _, path2 := range paths {
			compileRegEx, err := regexp.Compile(path2)
			if err != nil {
				log.Panic(err)
			}
			if compileRegEx.MatchString(path1) {
				index := IndexOf(paths, path1)
				if index != -1 {
					paths = append(paths[:index], paths[index+1:]...)
					i = 0
				}
			}
		}
	}
	return paths
}

func IndexOf(array []string, element string) int {
	for index, ele := range array {
		if ele == element {
			return index
		}
	}
	return -1
}

func CheckPreconditions() {
	if strings.TrimSpace(*input) == "" {
		fmt.Println("Please provide the required parameters")
		flag.PrintDefaults()
		return
	}

	if *compressedFormat && *pathwise || *pathwise && *methodwise || *compressedFormat && *methodwise {
		fmt.Println("Please select either compressed, methodwise or pathwise")
		flag.PrintDefaults()
		return
	}

	if !(*compressedFormat || *pathwise || *methodwise) {
		fmt.Println("Please select either compressed, methodwise or pathwise")
		flag.PrintDefaults()
		return
	}
}

func ReadOpenApiSpec(filePath string) (*openapi3.T, error) {
	if strings.Index(filePath, "https://") == 0 || strings.Index(filePath, "http://") == 0 {
		url, err := url.Parse(filePath)
		if err != nil {
			log.Fatalf("Couldn't parse input url: %v", err)
			return nil, err
		}
		doc, err := openapi3.NewLoader().LoadFromURI(url)
		if err != nil {
			log.Fatalf("Failed reading and parsing input file: %v", err)
			return nil, err
		}
		return doc, nil
	} else {
		doc, err := openapi3.NewLoader().LoadFromFile(filePath)
		if err != nil {
			log.Fatalf("Failed parsing input file: %v", err)
			return nil, err
		}
		return doc, nil
	}
}

type Rule struct {
	Action      string `yaml:"action,omitempty"`
	Description string `yaml:"description,omitempty"`
	Kind        string `yaml:"kind,omitempty"`
	Preview     bool   `yaml:"preview,omitempty"`
	Priority    int    `yaml:"priority,omitempty"`
	Match       struct {
		Expr struct {
			Expression string `yaml:"expression,omitempty"`
		} `yaml:"expr,omitempty"`
		Config struct {
			SrcIpRanges []string `yaml:"srcIpRanges,omitempty"`
		} `yaml:"config,omitempty"`
		VersionedExpr string `yaml:"versionedExpr,omitempty"`
	} `yaml:"match,omitempty"`
}

func NewRule(description string, action string, priority int, preview bool, expression string) (*Rule, error) {
	rule := Rule{
		Action:      action,
		Description: description,
		Kind:        "compute#securityPolicyRule",
		Priority:    priority,
		Preview:     preview,
	}
	rule.Match.Expr.Expression = expression
	return &rule, nil
}

func NewRuleWithIpRanges(description string, action string, priority int, preview bool, ipRanges []string) (*Rule, error) {
	rule := Rule{
		Action:      action,
		Description: description,
		Kind:        "compute#securityPolicyRule",
		Priority:    priority,
		Preview:     preview,
	}
	rule.Match.Config.SrcIpRanges = ipRanges
	rule.Match.VersionedExpr = "SRC_IPS_V1"
	return &rule, nil
}

type Policy struct {
	Name                     string `yaml:"name,omitempty"`
	Description              string `yaml:"description,omitempty"`
	Kind                     string `yaml:"kind,omitempty"`
	Type                     string `yaml:"type,omitempty"`
	AdaptiveProtectionConfig struct {
		Layer7DdosDefenseConfig struct {
			Enable bool `yaml:"enable,omitempty"`
		} `yaml:"layer7DdosDefenseConfig,omitempty"`
	} `yaml:"adaptiveProtectionConfig,omitempty"`
	Rules []Rule `yaml:"rules,omitempty"`
}

func NewPolicy(name string, description string, ddosProtectionEnabled bool, rules []Rule) Policy {
	policy := Policy{
		Name:        name,
		Description: description,
		Kind:        "compute#securityPolicy",
		Type:        "CLOUD_ARMOR",
		Rules:       rules,
	}
	policy.AdaptiveProtectionConfig.Layer7DdosDefenseConfig.Enable = ddosProtectionEnabled
	return policy
}
