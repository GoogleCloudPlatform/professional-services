// Copyright 2022 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	"cloud.google.com/go/compute/metadata"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/awserr"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/sts"
	"github.com/urfave/cli/v2"
)

type awsTemporaryCredentials struct {
	Version         int       `json:"Version"`
	AccessKeyId     string    `json:"AccessKeyId"`
	SecretAccessKey string    `json:"SecretAccessKey"`
	SessionToken    string    `json:"SessionToken"`
	Expiration      time.Time `json:"Expiration"`
}

func getMetadataSession() string {
	// get our gcp project id
	projectID, err := metadata.ProjectID()
	if err != nil {
		log.Fatalf("metadata.ProjectID(): %v", err)
		return ""
	}

	hostname, err := metadata.Hostname()
	if err != nil {
		log.Fatalf("metadata.Hostname(): %v", err)
		return ""
	}
	sessionName := projectID + "." + hostname
	return sessionName[0:32]
}

func getMetadataIdentity() string {
	identityToken, err := metadata.Get("instance/service-accounts/default/identity?format=standard&audience=gcp")
	if err != nil {
		log.Fatalf("metadata.Get(instance/service-accounts/default/identity): %v", err)
		return ""
	}
	return identityToken
}

func getAWSWebIdentityServiceCreds(webIDcreds *sts.Credentials, role string) (*sts.AssumeRoleOutput, error) {

	accessKey := *webIDcreds.AccessKeyId
	secretKey := *webIDcreds.SecretAccessKey
	accessToken := *webIDcreds.SessionToken

	sess, err := session.NewSession(&aws.Config{
		Credentials: credentials.NewStaticCredentials(accessKey, secretKey, accessToken),
	})
	if err != nil {
		fmt.Println("NewSession Error", err)
		return nil, err
	}
	svc := sts.New(sess)

	roleToAssumeArn := role
	sessionName := "gcp_session"
	result, err := svc.AssumeRole(&sts.AssumeRoleInput{
		RoleArn:         &roleToAssumeArn,
		RoleSessionName: &sessionName,
	})

	if err != nil {
		fmt.Println("AssumeRole Error", err)
		return nil, err
	}

	return result, nil
}

func getWebIdentityFromGCP(role string) (*sts.Credentials, error) {
	roleToAssume := role
	sessionNameToUse := getMetadataSession()
	tokenToUse := getMetadataIdentity()

	svc := sts.New(session.New())
	input := &sts.AssumeRoleWithWebIdentityInput{
		RoleArn:          aws.String(roleToAssume),
		RoleSessionName:  aws.String(sessionNameToUse),
		WebIdentityToken: aws.String(tokenToUse),
		DurationSeconds:  aws.Int64(900),
	}

	result, err := svc.AssumeRoleWithWebIdentity(input)
	if err != nil {
		if aerr, ok := err.(awserr.Error); ok {
			switch aerr.Code() {
			case sts.ErrCodeMalformedPolicyDocumentException:
				fmt.Println(sts.ErrCodeMalformedPolicyDocumentException, aerr.Error())
			case sts.ErrCodePackedPolicyTooLargeException:
				fmt.Println(sts.ErrCodePackedPolicyTooLargeException, aerr.Error())
			case sts.ErrCodeIDPRejectedClaimException:
				fmt.Println(sts.ErrCodeIDPRejectedClaimException, aerr.Error())
			case sts.ErrCodeIDPCommunicationErrorException:
				fmt.Println(sts.ErrCodeIDPCommunicationErrorException, aerr.Error())
			case sts.ErrCodeInvalidIdentityTokenException:
				fmt.Println(sts.ErrCodeInvalidIdentityTokenException, aerr.Error())
			case sts.ErrCodeExpiredTokenException:
				fmt.Println(sts.ErrCodeExpiredTokenException, aerr.Error())
			case sts.ErrCodeRegionDisabledException:
				fmt.Println(sts.ErrCodeRegionDisabledException, aerr.Error())
			default:
				fmt.Println(aerr.Error())
			}
		} else {
			fmt.Println(err.Error())
		}
		return nil, err
	}

	return result.Credentials, nil
}

func app(webIdentityAWSRole string, webIdentityAWSServiceRole string) {
	// Assuming role with the provided Identity ARN
	webGCPIdentity, err := getWebIdentityFromGCP(webIdentityAWSRole)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	}

	// Assuming S3 role with the Identity ARN
	assumedRole, err := getAWSWebIdentityServiceCreds(webGCPIdentity, webIdentityAWSServiceRole)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	}

	awsTempCred := awsTemporaryCredentials{
		Version:         1,
		AccessKeyId:     *assumedRole.Credentials.AccessKeyId,
		SecretAccessKey: *assumedRole.Credentials.SecretAccessKey,
		SessionToken:    *assumedRole.Credentials.SessionToken,
		Expiration:      *assumedRole.Credentials.Expiration,
	}
	b, err := json.MarshalIndent(awsTempCred, "", "  ")
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
	fmt.Print(string(b))
}

func main() {
	app := &cli.App{
		Flags: []cli.Flag{
			&cli.StringFlag{
				Name:  "identity",
				Usage: "AWS WebIdentity ARN",
			},
			&cli.StringFlag{
				Name:  "service",
				Usage: "AWS Service ARN",
			},
			&cli.BoolFlag{
				Name:  "env",
				Usage: "Get AWS ARNs from Environment variable, GCP_AUTH_IDENTITY and GCP_AUTH_IDENTITY",
			},
		},
		Action: func(c *cli.Context) error {
			var identity string
			var service string

			if c.Bool("env") {
				identity = os.Getenv("GCP_AUTH_IDENTITY")
				service = os.Getenv("GCP_AUTH_SERVICE")
				if identity == "" || service == "" {
					cli.ShowSubcommandHelp(c)
					return nil
				}
			} else {
				if c.String("identity") == "" || c.String("service") == "" {
					cli.ShowSubcommandHelp(c)
					return nil
				}
			}
			app(identity, service)
			return nil
		},
	}

	err := app.Run(os.Args)
	if err != nil {
		log.Fatal(err)
	}
}
