// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// This code is a prototype and not engineered for production use.
// Error handling is incomplete or inappropriate for usage beyond
// a development sample.

package bqnotifier

type BQNotifier struct {
	hooks []func(Job, interface{}) error
}

func (bqn *BQNotifier) AddHook(fn func(job Job, data interface{}) error) {
	bqn.hooks = append(bqn.hooks, fn)
}

func (bqn *BQNotifier) RunHooks(job *Job, data *interface{}){
	for i, fn := range bqn.hooks {
		err := fn(*job, *data)
		if err != nil {
			errLog.Printf("Hook Error: HookIdx %d, Error: %s\n", i, err)
		}
	}
}
