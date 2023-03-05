package app

import (
	"regexp"
	"time"
)

func formattedTime() string {
	// est, err := time.LoadLocation("America/New York")
	est := time.FixedZone("EST", -5*60*60)

	currentTime := time.Now().In(est)

	return currentTime.Format("03:04:05 PM (EST)")
}

func isValidInput(input string) bool {
	var alphanumeric = regexp.MustCompile(`^[a-zA-Z0-9_]{3,16}$`)
	return alphanumeric.MatchString(input)
}
