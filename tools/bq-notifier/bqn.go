package bqnotifier

// This code is a prototype and not engineered for production use.
// Error handling is incomplete or inappropriate for usage beyond
// a development sample.

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
