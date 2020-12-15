//
// Copyright 2020 Google LLC
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
//

package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"log"
	"math/rand"
	"os"
	"os/signal"
	"sync/atomic"
	"time"

	"cloud.google.com/go/spanner"
	"golang.org/x/sync/errgroup"
	"google.golang.org/api/option"
)

const numRecords = 1000000

type Parent struct {
	ParentID int64      `spanner:"ParentId"`
	Child01s []*Child01 `spanner:"c01"`
	Child02s []*Child02 `spanner:"c02"`
	Child03s []*Child03 `spanner:"c03"`
	Child04s []*Child04 `spanner:"c04"`
}

type Child01 struct {
	ParentID  int64 `spanner:"ParentId"`
	Child01ID int64 `spanner:"Child01Id"`
}

type Child02 struct {
	ParentID  int64 `spanner:"ParentId"`
	Child02ID int64 `spanner:"Child02Id"`
}

type Child03 struct {
	ParentID  int64 `spanner:"ParentId"`
	Child03ID int64 `spanner:"Child03Id"`
}

type Child04 struct {
	ParentID  int64 `spanner:"ParentId"`
	Child04ID int64 `spanner:"Child04Id"`
}

func init() {
	rand.Seed(time.Now().UnixNano())
}

func main() {
	var (
		projectID, instanceID, databaseID string
		parallel, pattern                 int
	)

	flag.StringVar(&projectID, "project", "", "GCP Project ID")
	flag.StringVar(&instanceID, "instance", "", "Cloud Spanner Instance ID")
	flag.StringVar(&databaseID, "database", "", "Cloud Spanner Database ID")
	flag.IntVar(&parallel, "parallel", 1, "Number of parallel execution")
	flag.IntVar(&pattern, "pattern", 2, "Benchmark Pattern")
	flag.Parse()

	if projectID == "" || instanceID == "" || databaseID == "" {
		flag.Usage()
		os.Exit(1)
	}

	ctx, cancel := context.WithCancel(context.Background())
	dbPath := fmt.Sprintf("projects/%s/instances/%s/databases/%s", projectID, instanceID, databaseID)
	client, err := spanner.NewClientWithConfig(ctx, dbPath, spanner.ClientConfig{
		SessionPoolConfig: spanner.SessionPoolConfig{
			MinOpened: uint64(parallel),
		},
	}, option.WithGRPCConnectionPool(parallel))
	if err != nil {
		log.Fatalf("failed to create spanner client: %v", err)
	}
	defer client.Close()

	go handleInterrupt(cancel)

	// TPS counter
	var counter uint64
	go func() {
		log.Printf("Start TPS counter...")
		ticker := time.NewTicker(1 * time.Second)
		for {
			select {
			case <-ticker.C:
				log.Printf("TPS: %d\n", counter)
				atomic.StoreUint64(&counter, 0) // reset
			case <-ctx.Done():
				log.Printf("Stop TPS counter...")
				return
			}
		}
	}()

	group, ctx := errgroup.WithContext(ctx)
	for i := 0; i < parallel; i++ {
		group.Go(func() error {
			var err error
			switch pattern {
			case 1:
				if parallel != 1 {
					return errors.New("use --parallel=1 for data insertion")
				}
				err = insertData(ctx, client, &counter)
			case 2:
				err = selectWithSeparateStatements(ctx, client, &counter)
			case 3:
				err = selectWithSubqueries(ctx, client, &counter)
			default:
				return fmt.Errorf("invalid pattern: %d", pattern)
			}
			return err
		})
	}
	if err := group.Wait(); err != nil {
		log.Fatal(err)
	}
}

func selectWithSeparateStatements(ctx context.Context, client *spanner.Client, counter *uint64) error {
	for {
		id := rand.Int63n(numRecords)

		var p Parent
		txn := client.ReadOnlyTransaction()
		if err := txn.Query(ctx, spanner.Statement{`SELECT * FROM Parent WHERE ParentId = @id`, map[string]interface{}{"id": id}}).Do(func(r *spanner.Row) error {
			return r.ToStruct(&p)
		}); err != nil {
			return fmt.Errorf("failed to read row: %v", err)
		}

		// Child01
		if err := txn.Query(ctx, spanner.Statement{`SELECT * FROM Child01 WHERE ParentId = @id`, map[string]interface{}{"id": id}}).Do(func(r *spanner.Row) error {
			var c Child01
			if err := r.ToStruct(&c); err != nil {
				return err
			}
			p.Child01s = append(p.Child01s, &c)
			return nil
		}); err != nil {
			return fmt.Errorf("failed to read row: %v", err)
		}

		// Child02
		if err := txn.Query(ctx, spanner.Statement{`SELECT * FROM Child02 WHERE ParentId = @id`, map[string]interface{}{"id": id}}).Do(func(r *spanner.Row) error {
			var c Child02
			if err := r.ToStruct(&c); err != nil {
				return err
			}
			p.Child02s = append(p.Child02s, &c)
			return nil
		}); err != nil {
			return fmt.Errorf("failed to read row: %v", err)
		}

		// Child03
		if err := txn.Query(ctx, spanner.Statement{`SELECT * FROM Child03 WHERE ParentId = @id`, map[string]interface{}{"id": id}}).Do(func(r *spanner.Row) error {
			var c Child03
			if err := r.ToStruct(&c); err != nil {
				return err
			}
			p.Child03s = append(p.Child03s, &c)
			return nil
		}); err != nil {
			return fmt.Errorf("failed to read row: %v", err)
		}

		// Child04
		if err := txn.Query(ctx, spanner.Statement{`SELECT * FROM Child04 WHERE ParentId = @id`, map[string]interface{}{"id": id}}).Do(func(r *spanner.Row) error {
			var c Child04
			if err := r.ToStruct(&c); err != nil {
				return err
			}
			p.Child04s = append(p.Child04s, &c)
			return nil
		}); err != nil {
			return fmt.Errorf("failed to read row: %v", err)
		}

		txn.Close()

		atomic.AddUint64(counter, 1)
	}
}

func selectWithSubqueries(ctx context.Context, client *spanner.Client, counter *uint64) error {
	for {
		id := rand.Int63n(numRecords)

		txn := client.ReadOnlyTransaction()
		iter := txn.Query(ctx, spanner.Statement{
			SQL: `
				SELECT 
				  *,
				  ARRAY(SELECT AS STRUCT * FROM Child01 WHERE ParentId = @id) as c01,
				  ARRAY(SELECT AS STRUCT * FROM Child02 WHERE ParentId = @id) as c02,
				  ARRAY(SELECT AS STRUCT * FROM Child03 WHERE ParentId = @id) as c03,
				  ARRAY(SELECT AS STRUCT * FROM Child04 WHERE ParentId = @id) as c04,
				FROM Parent p WHERE ParentId = @id`,
			Params: map[string]interface{}{
				"id": id,
			},
		})

		if err := iter.Do(func(r *spanner.Row) error {
			var p Parent
			return r.ToStruct(&p)
		}); err != nil {
			return fmt.Errorf("failed to read row: %v", err)
		}
		txn.Close()

		atomic.AddUint64(counter, 1)
	}
}

func insertData(ctx context.Context, client *spanner.Client, counter *uint64) error {
	txnSize := 100
	for i := 0; i < (numRecords / txnSize); i++ {
		if _, err := client.ReadWriteTransaction(ctx, func(ctx context.Context, txn *spanner.ReadWriteTransaction) error {
			for j := 0; j < txnSize; j++ {
				id := i*txnSize + j
				p := spanner.Insert("Parent", []string{"ParentId"}, []interface{}{id})
				c01 := spanner.Insert("Child01", []string{"ParentId", "Child01Id"}, []interface{}{id, id})
				c02 := spanner.Insert("Child02", []string{"ParentId", "Child02Id"}, []interface{}{id, id})
				c03 := spanner.Insert("Child03", []string{"ParentId", "Child03Id"}, []interface{}{id, id})
				c04 := spanner.Insert("Child04", []string{"ParentId", "Child04Id"}, []interface{}{id, id})
				txn.BufferWrite([]*spanner.Mutation{p, c01, c02, c03, c04})
			}
			return nil
		}); err != nil {
			return fmt.Errorf("failed to insert row: %v", err)
		}

		atomic.AddUint64(counter, 1)
	}
	return nil
}

func handleInterrupt(cancel context.CancelFunc) {
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt)
	<-c
	cancel()
}
