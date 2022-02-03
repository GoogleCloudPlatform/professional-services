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
	"database/sql"
	"fmt"
	"log"
	"os"
	"strconv"

	"github.com/go-sql-driver/mysql"
	"github.com/gofiber/fiber/v2"
)

var db *sql.DB

func main() {
	var err error

	cfg := mysql.Config{
		User:                 os.Getenv("DATABASE_USER"),
		Passwd:               os.Getenv("DATABASE_PASSWORD"),
		Net:                  os.Getenv("DATABASE_NET"),
		Addr:                 os.Getenv("DATABASE_HOST"),
		DBName:               os.Getenv("DATABASE_NAME"),
		MultiStatements:      true,
		AllowNativePasswords: true,
	}
	// Get a database handle.
	db, err = sql.Open("mysql", cfg.FormatDSN())
	db.SetMaxOpenConns(100)
	db.SetMaxIdleConns(5)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()
	if os.Getenv("DISABLE_DATABASE_MIGRATION") != "TRUE" {
		err = MigrateDatabase(os.Getenv("DATABASE_NAME"), db)
		if err != nil {
			log.Fatal("Unable to initalize database")
		}
	}

	app := fiber.New()
	// No static assets right now app.Static("/", "./public")
	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("IPAM Autopilot up and running 👋!")
	})
	app.Get("/.well-known/terraform.json", GetTerraformDiscovery)
	app.Get("/terraform/providers/v1/ipam-autopilot/ipam/versions", GetTerraformVersions)
	app.Get("/terraform/providers/v1/ipam-autopilot/ipam/:version/download/:os/:arch", GetTerraformVersionDownload)

	app.Post("/ranges", CreateNewRange)
	app.Get("/ranges", GetRanges)
	app.Get("/ranges/:id", GetRange)
	app.Delete("/ranges/:id", DeleteRange)

	app.Get("/domains", GetRoutingDomains)
	app.Get("/domains/:id", GetRoutingDomain)
	app.Put("/domains/:id", UpdateRoutingDomain)
	app.Post("/domains", CreateRoutingDomain)
	app.Delete("/domains/:id", DeleteRoutingDomain)

	var port int64
	if os.Getenv("PORT") != "" {
		port, err = strconv.ParseInt(os.Getenv("PORT"), 10, 64)
		if err != nil {
			log.Panicf("Can't parse value of PORT env variable %s %v", os.Getenv("PORT"), err)
		}
	} else {
		port = 8080
	}

	app.Listen(fmt.Sprintf(":%d", port))
}
