//go:build windows
// +build windows

package service

import (
	"fmt"
	"log"
	"strings"
	"syscall"
	"unsafe"

	"golang.org/x/text/encoding/charmap"
)

var (
	winspool             = syscall.NewLazyDLL("winspool.drv")
	procOpenPrinter      = winspool.NewProc("OpenPrinterW")
	procClosePrinter     = winspool.NewProc("ClosePrinter")
	procStartDocPrinter  = winspool.NewProc("StartDocPrinterW")
	procEndDocPrinter    = winspool.NewProc("EndDocPrinter")
	procStartPagePrinter = winspool.NewProc("StartPagePrinter")
	procEndPagePrinter   = winspool.NewProc("EndPagePrinter")
	procWritePrinter     = winspool.NewProc("WritePrinter")
)

type DOC_INFO_1 struct {
	pDocName    *uint16
	pOutputFile *uint16
	pDatatype   *uint16
}

func printRaw(printerName string, data string) error {
	namePtr, err := syscall.UTF16PtrFromString(printerName)
	if err != nil {
		return err
	}

	var h syscall.Handle

	// OpenPrinter
	log.Printf("[PRINTER] Opening printer: %s", printerName)
	r1, _, err := syscall.Syscall(procOpenPrinter.Addr(), 3,
		uintptr(unsafe.Pointer(namePtr)),
		uintptr(unsafe.Pointer(&h)),
		0,
	)
	if r1 == 0 {
		log.Printf("[PRINTER] OpenPrinter failed: %v", err)
		return fmt.Errorf("OpenPrinter failed: %v", err)
	}
	defer func() {
		procClosePrinter.Call(uintptr(h))
		log.Printf("[PRINTER] Printer closed")
	}()

	// DOC_INFO_1 setup
	docName, _ := syscall.UTF16PtrFromString("Print Struk")
	// dataType, _ := syscall.UTF16PtrFromString("RAW")

	docInfo := DOC_INFO_1{
		pDocName:    docName,
		pOutputFile: nil,
		pDatatype:   nil, // Let driver decide (usually RAW)
	}

	// StartDocPrinter
	log.Printf("[PRINTER] Starting document...")
	r1, _, err = syscall.Syscall(procStartDocPrinter.Addr(), 3,
		uintptr(h),
		1,
		uintptr(unsafe.Pointer(&docInfo)),
	)
	if r1 == 0 {
		log.Printf("[PRINTER] StartDocPrinter error: %v", err)
		return fmt.Errorf("StartDocPrinter error: %v", err)
	}

	// StartPagePrinter
	// log.Printf("[PRINTER] Starting page...")
	// r1, _, err = syscall.Syscall(procStartPagePrinter.Addr(), 1, uintptr(h), 0, 0)
	// if r1 == 0 {
	// 	log.Printf("[PRINTER] StartPagePrinter error: %v", err)
	// 	return fmt.Errorf("StartPagePrinter error: %v", err)
	// }

	// Prepare bytes: normalize newlines to CRLF and encode to Windows-1252
	normalized := strings.ReplaceAll(data, "\n", "\r\n")
	encoded, encErr := charmap.Windows1252.NewEncoder().String(normalized)
	var dataBytes []byte
	if encErr != nil {
		// Fallback to raw bytes if encoding fails
		dataBytes = []byte(normalized)
	} else {
		dataBytes = []byte(encoded)
	}

	log.Printf("[PRINTER] Writing %d bytes...", len(dataBytes))
	if len(dataBytes) > 10 {
		log.Printf("[PRINTER] First 10 bytes: %X", dataBytes[:10])
	}

	// Write in chunks to avoid driver issues with large buffers
	const chunkSize = 8192
	total := len(dataBytes)
	offset := 0
	for offset < total {
		end := offset + chunkSize
		if end > total {
			end = total
		}
		chunk := dataBytes[offset:end]
		var written uint32
		r1, _, err = syscall.Syscall6(procWritePrinter.Addr(), 4,
			uintptr(h),
			uintptr(unsafe.Pointer(&chunk[0])),
			uintptr(len(chunk)),
			uintptr(unsafe.Pointer(&written)),
			0, 0,
		)
		if r1 == 0 || written == 0 {
			lastErr := syscall.GetLastError()
			log.Printf("[PRINTER] WritePrinter error at offset %d: %v (lastErr=%v)", offset, err, lastErr)
			return fmt.Errorf("WritePrinter error: %v (lastError=%v, written=%d of %d at offset %d)", err, lastErr, written, len(chunk), offset)
		}
		if int(written) != len(chunk) {
			log.Printf("[PRINTER] WritePrinter partial write: %d of %d", written, len(chunk))
			return fmt.Errorf("WritePrinter partial write: wrote %d of %d bytes at offset %d", written, len(chunk), offset)
		}
		offset = end
	}

	// EndPagePrinter
	// log.Printf("[PRINTER] Ending page...")
	// syscall.Syscall(procEndPagePrinter.Addr(), 1, uintptr(h), 0, 0)

	// EndDocPrinter
	log.Printf("[PRINTER] Ending document...")
	syscall.Syscall(procEndDocPrinter.Addr(), 1, uintptr(h), 0, 0)

	return nil
}
