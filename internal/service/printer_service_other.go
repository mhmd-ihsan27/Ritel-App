//go:build !windows
// +build !windows

package service

import "fmt"

// printRaw is not supported on non-Windows platforms
// Use printContentFallback instead which uses lp command
func printRaw(printerName string, data string) error {
	return fmt.Errorf("RAW printing tidak didukung di platform ini, menggunakan fallback lp command")
}
