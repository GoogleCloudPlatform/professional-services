package lambdacompat

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
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"text/template"
	"time"

	"github.com/google/uuid"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"

	aws "github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	awssts "github.com/aws/aws-sdk-go-v2/service/sts"
	awsststypes "github.com/aws/aws-sdk-go-v2/service/sts/types"
	"google.golang.org/api/idtoken"
)

type LambdaCompat interface {
	Start() error
}

type LambdaCompatCommand struct {
	Context     context.Context
	Command     string
	Args        []string
	Environment []string
}

type LambdaResponse struct {
	Result []byte
	Error  error
}

type LambdaRequest struct {
	RequestId string
	Body      []byte
	Result    chan LambdaResponse
}

type LambdaCompatServer struct {
	port     int
	Command  []string
	commands []LambdaCompatCommand

	requestChan chan *LambdaRequest
	requests    map[string]*LambdaRequest

	refreshChan chan bool

	Region        string
	ProjectNumber string
	Service       string
	Audience      string
	RoleArn       string

	JsonTransform *template.Template

	Processing sync.Mutex
}

type LambdaRunHandler struct {
	server *LambdaCompatServer
}

type LambdaCompatHandler struct {
	server *LambdaCompatServer
}

type LambdaErrorHandler struct {
	server *LambdaCompatServer
}

type LambdaRestartError struct{}

func (m *LambdaRestartError) Error() string {
	return "process needs to be restarted"
}

var awsToken *awsststypes.Credentials = nil

func getHttpRequest(r *http.Request, status int) *zerolog.Event {
	zld := zerolog.Dict().
		Str("requestMethod", r.Method).
		Str("requestUrl", r.URL.String()).
		Str("remoteIp", r.RemoteAddr)
	if r.UserAgent() != "" {
		zld = zld.Str("userAgent", r.UserAgent())
	}
	if r.Referer() != "" {
		zld = zld.Str("referer", r.Referer())
	}
	if status > 0 {
		zld = zld.Int("status", status)
	}
	return zld
}

func marshalJson(data interface{}) string {
	ret, err := json.Marshal(data)
	if err == nil {
		return string(ret)
	}
	return ""
}

func (h LambdaRunHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	h.server.Processing.Lock()
	defer h.server.Processing.Unlock()

	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		log.Error().Err(err).Dict("httpRequest", getHttpRequest(r, http.StatusBadRequest)).Msg("Error reading body")
		http.Error(w, "can't read body", http.StatusBadRequest)
		return
	}

	if h.server.JsonTransform != nil {
		var jsonBody interface{}

		err = json.Unmarshal(body, &jsonBody)
		if err != nil {
			log.Error().Dict("httpRequest", getHttpRequest(r, http.StatusBadRequest)).Str("body", string(body)).Err(err).Msg("Failed to unmarshal JSON body for transformation")
			http.Error(w, "failed to unmarshal JSON body", http.StatusBadRequest)
			return
		}

		templateVars := map[string]interface{}{
			"Body":       jsonBody,
			"URL":        r.URL,
			"Method":     r.Method,
			"RemoteAddr": r.RemoteAddr,
			"Headers":    r.Header,
		}

		var buf bytes.Buffer
		err = h.server.JsonTransform.Execute(&buf, templateVars)
		if err != nil {
			log.Error().Dict("httpRequest", getHttpRequest(r, http.StatusBadRequest)).Str("body", string(body)).Err(err).Msg("JSON transformation template failed")
			http.Error(w, "failed to render transformed JSON body", http.StatusBadRequest)
		}
		body = buf.Bytes()
	}

	requestId := uuid.New()
	req := LambdaRequest{
		RequestId: requestId.String(),
		Body:      body,
		Result:    make(chan LambdaResponse),
	}
	h.server.requests[req.RequestId] = &req

	log.Info().Str("spanId", req.RequestId).Dict("httpRequest", getHttpRequest(r, 0)).Msg("Starting to process new request")
	h.server.requestChan <- &req
	output := <-req.Result

	if output.Error == nil {
		log.Info().Str("spanId", req.RequestId).Dict("httpRequest", getHttpRequest(r, http.StatusOK)).Msg("Request processed successfully")
		w.Write(output.Result)
	} else {
		log.Error().RawJSON("error", output.Result).Str("spanId", req.RequestId).Dict("httpRequest", getHttpRequest(r, http.StatusInternalServerError)).Msg("Request failed")
		w.WriteHeader(http.StatusInternalServerError)
		w.Write(output.Result)
	}
}

func (h LambdaCompatHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	path := strings.Split(r.URL.Path, "/")
	if path[len(path)-1] == "next" {
		var req *LambdaRequest
		select {
		case req = <-h.server.requestChan:
			log.Info().Str("spanId", req.RequestId).Dict("httpRequest", getHttpRequest(r, http.StatusOK).Int("requestSize", len(req.Body))).Msg("Sending next invocation")

			w.Header().Set("Lambda-Runtime-Aws-Request-Id", req.RequestId)
			arn := fmt.Sprintf("arn:aws:lambda:%s:%s:function:%s", h.server.Region, h.server.ProjectNumber, h.server.Service)
			w.Header().Set("Lambda-Runtime-Invoked-Function-Arn", arn)
			// Maximum duration for a Lambda function is 5 minutes
			deadlineMs := (1000 * 300) + time.Now().UnixNano()/int64(time.Millisecond)
			w.Header().Set("Lambda-Runtime-Deadline-Ms", fmt.Sprintf("%d", deadlineMs))
			w.Header().Set("Content-Type", "application/json")
			if len(req.Body) > 0 {
				w.Write(req.Body)
			} else { // Matches SAM CLI behaviour
				w.Write([]byte("{}"))
			}
			return
		case _ = <-h.server.refreshChan:
			return
		}
	}
	if path[len(path)-1] == "response" || path[len(path)-1] == "error" {
		requestId := path[len(path)-2]
		if req, ok := h.server.requests[requestId]; ok {
			body, err := ioutil.ReadAll(r.Body)
			if err != nil {
				log.Error().Err(err).Dict("httpRequest", getHttpRequest(r, http.StatusBadRequest)).Msg("Error reading body")
				response := LambdaResponse{
					Result: body,
					Error:  err,
				}
				req.Result <- response
				http.Error(w, "can't read body", http.StatusBadRequest)
				return
			}
			err = nil
			if path[len(path)-1] == "error" {
				err = fmt.Errorf("invocation returned error")
			}
			response := LambdaResponse{
				Result: body,
				Error:  err,
			}
			req.Result <- response
			w.WriteHeader(http.StatusAccepted)
			return
		}
	}
	w.WriteHeader(http.StatusBadRequest)
}

func (h LambdaErrorHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		log.Error().Err(err).Dict("httpRequest", getHttpRequest(r, http.StatusBadRequest)).Msg("Error reading body")
		http.Error(w, "can't read body", http.StatusBadRequest)
		return
	}

	log.Error().RawJSON("error", body).Str("errorType", r.Header.Get("Lambda-Runtime-Function-Error-Type")).Msg("Runtime initialization failed")
	w.WriteHeader(http.StatusAccepted)
}

func (s LambdaCompatServer) createRunServer(port int) *http.Server {
	mux := http.NewServeMux()
	mux.Handle("/", LambdaRunHandler{
		server: &s,
	})
	server := http.Server{
		Addr:    fmt.Sprintf(":%d", port),
		Handler: mux,
	}
	return &server
}

func (s LambdaCompatServer) createCompatServer(port int) *http.Server {
	mux := http.NewServeMux()
	mux.Handle("/2018-06-01/runtime/invocation/", LambdaCompatHandler{
		server: &s,
	})
	mux.Handle("/2018-06-01/runtime/init/error", LambdaErrorHandler{
		server: &s,
	})
	server := http.Server{
		Addr:    fmt.Sprintf(":%d", port),
		Handler: mux,
	}
	return &server
}

func (s LambdaCompatServer) isTokenExpired() bool {
	if s.RoleArn == "" {
		return false
	}

	timeNow := time.Now().Add(time.Duration(-5) * time.Minute)
	if awsToken == nil || timeNow.After(*awsToken.Expiration) {
		return true
	}
	return false
}

func (s LambdaCompatServer) refreshIdToken(ctx context.Context, aud string) error {
	if s.RoleArn == "" {
		return fmt.Errorf("no role ARN defined (set AWS_ROLE_ARN environment variable)")
	}

	if s.isTokenExpired() {
		log.Info().Str("audience", s.Audience).Str("roleArn", s.RoleArn).Msg("Getting AWS session token")

		ts, err := idtoken.NewTokenSource(ctx, aud)
		if err != nil {
			return err
		}
		tok, err := ts.Token()
		if err != nil {
			return err
		}
		log.Info().Str("accessToken", tok.AccessToken).Str("tokenType", tok.TokenType).Str("expiry", tok.Expiry.String()).Msg("Token")

		// Validation is mainly performed to retrieve token details
		payload, err := idtoken.Validate(ctx, tok.AccessToken, aud)
		if err != nil {
			return err
		}

		log.Debug().Str("issuer", payload.Issuer).
			Str("audience", payload.Audience).
			Int64("expires", payload.Expires).
			Int64("issuedAt", payload.IssuedAt).
			Str("Subject", payload.Audience).
			Fields(map[string]interface{}{"claims": payload.Claims}).
			Msg("ID token")

		var configs = []func(*awsconfig.LoadOptions) error{
			awsconfig.WithRegion(s.Region),
		}
		if e := log.Debug(); e.Enabled() {
			configs = append(configs, awsconfig.WithClientLogMode(aws.LogRetries|aws.LogRequestWithBody))
		}
		cfg, err := awsconfig.LoadDefaultConfig(ctx, configs...)
		if err != nil {
			return err
		}
		stsSvc := awssts.NewFromConfig(cfg)
		sessionName := payload.Claims["email"].(string)
		sessionName = strings.Replace(sessionName, ".iam.gserviceaccount.com", "", 1)
		if len(sessionName) > 64 {
			sessionName = sessionName[0:63]
		}
		output, err := stsSvc.AssumeRoleWithWebIdentity(ctx, &awssts.AssumeRoleWithWebIdentityInput{
			RoleArn:          aws.String(s.RoleArn),
			RoleSessionName:  aws.String(sessionName),
			DurationSeconds:  aws.Int32(3600),
			WebIdentityToken: &tok.AccessToken,
		})
		if err != nil {
			return err
		}
		awsToken = output.Credentials
	}
	return nil
}

func NewLambdaCompatServer(command []string, port int, region string, projectNum string, service string, audience string, roleArn string, jsonTransform string) *LambdaCompatServer {
	var tmpl *template.Template = nil
	var err error
	if jsonTransform != "" {
		templateFuncs := template.FuncMap{
			"ToJson": marshalJson,
		}
		tmpl, err = template.New(filepath.Base(jsonTransform)).Funcs(templateFuncs).ParseFiles(jsonTransform)
		if err != nil {
			panic(err)
		}
	}
	return &LambdaCompatServer{
		Command:       command,
		port:          port,
		requestChan:   make(chan *LambdaRequest, 100),
		requests:      make(map[string]*LambdaRequest, 0),
		refreshChan:   make(chan bool),
		Region:        region,
		ProjectNumber: projectNum,
		Service:       service,
		Audience:      audience,
		RoleArn:       roleArn,
		JsonTransform: tmpl,
	}
}

func (c LambdaCompatCommand) Run(s *LambdaCompatServer) error {
	cmd := exec.CommandContext(c.Context, c.Command, c.Args...)
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return fmt.Errorf("error getting stdout pipe: %w", err)
	}
	stdoutBuf := bufio.NewScanner(stdout)

	stderr, err := cmd.StderrPipe()
	if err != nil {
		return fmt.Errorf("error getting stderr pipe: %w", err)
	}
	stderrBuf := bufio.NewScanner(stderr)

	done := make(chan error)
	stdoutChan := make(chan string)
	stderrChan := make(chan string)

	// Start stdout, stderr output goprocs
	go func() {
		for stdoutBuf.Scan() {
			text := stdoutBuf.Text()
			stdoutChan <- text
		}
	}()
	go func() {
		for stderrBuf.Scan() {
			text := stderrBuf.Text()
			stderrChan <- text
		}
	}()

	// Set command environment
	cmd.Env = os.Environ()
	for _, e := range c.Environment {
		cmd.Env = append(cmd.Env, e)
	}

	// Start command
	if err := cmd.Start(); err != nil {
		return err
	}

	var processKilled bool = false
	ticker := time.NewTicker(5 * time.Second)
	go func() {
		for {
			select {
			case <-ticker.C:
				if s.isTokenExpired() {
					log.Info().Msg("AWS session token expired, refreshing and restarting command")
					processKilled = true
					s.Processing.Lock()
					s.refreshChan <- true
					cmd.Process.Kill()
				}
				break
			}
		}
	}()

	go func() {
		done <- cmd.Wait()
	}()

	for {
		select {
		case line := <-stdoutChan:
			fmt.Fprintf(os.Stdout, "%s\n", line)
		case line := <-stderrChan:
			fmt.Fprintf(os.Stderr, "%s\n", line)
		case err := <-done:
			ticker.Stop()
			if processKilled {
				s.Processing.Unlock()
				return &LambdaRestartError{}
			}
			return err
		}
	}
}

func (s LambdaCompatServer) Start() error {
	log.Info().Msg("Cloud Run Lambda compatibility layer starting...")
	ctx := context.Background()

	wg := new(sync.WaitGroup)
	wg.Add(2)

	go func() {
		defer wg.Done()

		log.Info().Int("port", s.port).Msg("Listening to incoming requests")
		server := s.createRunServer(s.port)
		err := server.ListenAndServe()
		if err != nil {
			log.Fatal().Err(err)
		}
	}()

	go func() {
		defer wg.Done()

		log.Info().Int("port", s.port+1).Msg("Emulating Lambda environment")
		server := s.createCompatServer(s.port + 1)
		err := server.ListenAndServe()
		if err != nil {
			log.Fatal().Err(err)
		}
	}()

	lambdaEmulationAPI := fmt.Sprintf("127.0.0.1:%d", s.port+1)
	for {
		err := s.startCommand(ctx, lambdaEmulationAPI)
		if err != nil {
			if _, ok := err.(*LambdaRestartError); ok {
				continue
			}
			return err
		}
	}
	wg.Wait()
	return nil
}

func (s LambdaCompatServer) startCommand(ctx context.Context, lambdaEmulationAPI string) error {
	if s.Audience != "" {
		err := s.refreshIdToken(ctx, s.Audience)
		if err != nil {
			log.Error().Err(err).Msg("Failed to get OIDC token")
		}
	}

	s.commands = make([]LambdaCompatCommand, 1)
	environment := []string{
		fmt.Sprintf("AWS_LAMBDA_RUNTIME_API=%s", lambdaEmulationAPI),
		fmt.Sprintf("AWS_REGION=%s", s.Region),
		fmt.Sprintf("AWS_DEFAULT_REGION=%s", s.Region),
	}
	if awsToken != nil {
		environment = append(environment, fmt.Sprintf("AWS_ACCESS_KEY_ID=%s", *awsToken.AccessKeyId))
		environment = append(environment, fmt.Sprintf("AWS_SECRET_ACCESS_KEY=%s", *awsToken.SecretAccessKey))
		environment = append(environment, fmt.Sprintf("AWS_SESSION_TOKEN=%s", *awsToken.SessionToken))
	}

	var params []string = []string{}
	if len(s.Command) > 1 {
		params = s.Command[1 : len(os.Args)-1]
	}
	s.commands[0] = LambdaCompatCommand{
		Context:     ctx,
		Command:     s.Command[0],
		Args:        params,
		Environment: environment,
	}
	err := s.commands[0].Run(&s)
	if err != nil {
		return err
	}
	return nil
}
