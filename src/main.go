// entry point to golang server.
package main

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/waterproofpatch/go_authentication"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"gorm.io/gorm"
)

func initViews(router *mux.Router) {
	go_authentication.InitViews(router)
	InitViews(router)
}

func makeRouter() *mux.Router {
	router := mux.NewRouter()

	return router
}

// startServing creates the server mux and registers endpoints with it.
func startServing(port string, router *mux.Router) {
	portStr := fmt.Sprintf("0.0.0.0:%s", port)
	log.Printf("Starting server on %s...", portStr)

	methods := []string{"GET", "POST", "PUT", "DELETE"}
	headers := []string{"Content-Type", "Access-Control-Allow-Origin", "Authorization"}
	srv := &http.Server{
		// Handler: router,
		Handler: handlers.CORS(handlers.AllowedMethods(methods), handlers.AllowedHeaders(headers))(router),
		Addr:    portStr,
		// Good practice: enforce timeouts for servers you create!
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}

	log.Fatal(srv.ListenAndServe())
}

func initUsers(db *gorm.DB, cfg *go_authentication.Config) {
	adminPass, err := go_authentication.HashPassword(cfg.DefaultAdminPass)
	if err != nil {
		panic("Failed hashing password for admin user")
	}
	_, err = go_authentication.CreateUser(cfg.DefaultAdminUser,
		adminPass,
		true, // isVerified
		true, // isAdmin
		go_authentication.GeneratePseudorandomToken())
	if err != nil {
		log.Printf("Failed adding default admin user")
		return
	}

}

// main is the entrypoint to the program.
func main() {
	// read the config from the environment
	cfg := go_authentication.GetConfig()
	// init the database
	log.Printf("Initializing database, dropTables=%v...\n", cfg.DropTables)
	go_authentication.InitDb(cfg.DbUrl, cfg.DropTables)
	db := go_authentication.GetDb()
	initUsers(db, cfg)

	var router = makeRouter()
	initViews(router)
	startServing(cfg.Port, router)
}
