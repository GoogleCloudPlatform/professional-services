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
	"io/ioutil"
	"log"
	"testing"
	"time"

	"github.com/form3tech-oss/jwt-go"
	"github.com/stretchr/testify/assert"
	"gopkg.in/yaml.v3"
)

func TestSimple(t *testing.T) {
	dat, err := ioutil.ReadFile("test_config/config.yaml")
	if err != nil {
		log.Fatalf("unable to read config file %v", err)
	}
	err = yaml.Unmarshal(dat, &config)
	if err != nil {
		log.Fatalf("error parsing config file %v", err)
	}

	at(time.Unix(1626701211, 0), func() {
		var jwt = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjRpM3NGRTdzeHFOUE9UN0ZkdmNHQTFaVkdHSV9yLXRzRFhuRXVZVDRacUUiLCJ0eXAiOiJKV1QifQ.eyJuYW1lc3BhY2VfaWQiOiIxMjk2NjMiLCJuYW1lc3BhY2VfcGF0aCI6ImNncm90eiIsInByb2plY3RfaWQiOiIyODAwOTI3MSIsInByb2plY3RfcGF0aCI6ImNncm90ei90ZXN0IiwidXNlcl9pZCI6IjExMTg5NiIsInVzZXJfbG9naW4iOiJjZ3JvdHoiLCJ1c2VyX2VtYWlsIjoiY2hyaXN0b3BoZ3JvdHpAZ21haWwuY29tIiwicGlwZWxpbmVfaWQiOiIzMzkzNjE1NzEiLCJwaXBlbGluZV9zb3VyY2UiOiJ3ZWIiLCJqb2JfaWQiOiIxNDM1MDgyMDU2IiwicmVmIjoibWFpbiIsInJlZl90eXBlIjoiYnJhbmNoIiwicmVmX3Byb3RlY3RlZCI6InRydWUiLCJqdGkiOiJlNjQxY2ZjNy1lMjBlLTQxZGEtYWQwNS0yYWMyY2VhYTg5NmEiLCJpc3MiOiJnaXRsYWIuY29tIiwiaWF0IjoxNjI2NzAxMTA0LCJuYmYiOjE2MjY3MDEwOTksImV4cCI6MTYyNjcwNDcwNCwic3ViIjoiam9iXzE0MzUwODIwNTYifQ.Ss-8QKomvCzDBknQAqys3zU3aZym4lrWd4VeqPuGQN_l-LoAWIU1ZIvlnrfQ-Fce2yOT2JkiieUchWgasHYJi5adK77t2X5I3EwtD8w-Fa3UUGIz5mHX4d1QcuVqFnOFA_xyFsNr7hseZH4kEJs1vGyDSbRhha4gn0Xf_iEwnuaZKSBQBWt8Uzx4qo5hY-cWkzHYAM_JOY7vRreb9gRp3CAZF5eSR4mQ2wy93ufSjghRBHtiehN6-8z1KESlErUfGKC2gcvd_uGaxfamVp8uyMzSjryn2mHBBEgx6DnltFq3Jpl8uK0i2CvLsocBJZJxP9X8wZkRMkibxsuzjsqBVw"
		claims, err := validateJwtAndExtractClaims(jwt)
		if err != nil {
			log.Panic(err)
			return
		}
		assert.Equal(t, nil, claims.Valid())
	})
}

func at(t time.Time, f func()) {
	jwt.TimeFunc = func() time.Time {
		return t
	}
	f()
	jwt.TimeFunc = time.Now
}
