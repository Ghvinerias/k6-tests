package main

import (
	"encoding/json"
	"math/rand"
	"net/http"
	"time"
)

type HealthEntry struct {
	Data        map[string]interface{} `json:"data"`
	Description string                 `json:"description"`
	Duration    string                 `json:"duration"`
	Status      string                 `json:"status"`
	Tags        []string               `json:"tags"`
}

type HealthResponse struct {
	Status        string                 `json:"status"`
	TotalDuration string                 `json:"totalDuration"`
	Entries       map[string]HealthEntry `json:"entries"`
}

func randomDuration(min, max time.Duration) time.Duration {
	return time.Duration(rand.Int63n(int64(max-min))) + min
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Only GET is allowed", http.StatusMethodNotAllowed)
		return
	}

	// Randomize durations between 100ms and 1s
	minDuration := 100 * time.Millisecond
	maxDuration := 1 * time.Second

	entryDuration := randomDuration(minDuration, maxDuration)
	totalDuration := randomDuration(minDuration, maxDuration)

	response := HealthResponse{
		Status:        "Healthy",
		TotalDuration: totalDuration.String(),
		Entries: map[string]HealthEntry{
			"MsSql": {
				Data:        map[string]interface{}{},
				Description: "A healthy result.",
				Duration:    entryDuration.String(),
				Status:      "Healthy",
				Tags:        []string{},
			},
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func main() {
	rand.Seed(time.Now().UnixNano())
	http.HandleFunc("/", healthHandler)
	http.ListenAndServe(":8080", nil)
}

