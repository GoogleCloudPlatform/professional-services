package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v4/pgxpool"
)

func main() {
	var err error
	err = InitDatabase()
	if err != nil {
		log.Fatal("Unable to initalize database")
	}

	dbpool, err = pgxpool.Connect(context.Background(), os.Getenv("DB_URL"))
	if err != nil {
		log.Panicf("Unable to connect to database: %v\n", err)
	}
	defer dbpool.Close()

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
