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
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()
	err = MigrateDatabase(os.Getenv("DATABASE_NAME"), db)
	if err != nil {
		log.Fatal("Unable to initalize database")
	}

	app := fiber.New()
	// No static assets right now app.Static("/", "./public")
	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("IPAM Autopilot up and running 👋!")
	})

	app.Post("/ranges", CreateNewRange)
	app.Get("/ranges", GetRanges)
	app.Get("/ranges/:id", GetRange)
	app.Delete("/ranges/:id", DeleteRange)

	//TODO implement someday app.Post("/domains", CreateNew)
	app.Get("/domains", GetRoutingDomains)
	app.Get("/domains/:id", GetRoutingDomain)
	app.Put("/domains/:id", UpdateRoutingDomain)
	// TODO implement someday app.Delete("/domains/:id", DeleteRange)

	app.Post("/cai/subnets", SubnetChanged)
	app.Get("/cai/refresh", RefreshSubnetsFromCai)

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
