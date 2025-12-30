//go:build windows
// +build windows

package service

import (
	"fmt"
	"syscall"
	"unsafe"
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
	r1, _, err := syscall.Syscall(procOpenPrinter.Addr(), 3,
		uintptr(unsafe.Pointer(namePtr)),
		uintptr(unsafe.Pointer(&h)),
		0,
	)
	if r1 == 0 {
		return fmt.Errorf("OpenPrinter failed: %v", err)
	}
	defer procClosePrinter.Call(uintptr(h))

	// DOC_INFO_1 setup
	docName, _ := syscall.UTF16PtrFromString("Print Struk")
	dataType, _ := syscall.UTF16PtrFromString("RAW")

	docInfo := DOC_INFO_1{
		pDocName:    docName,
		pOutputFile: nil,
		pDatatype:   dataType,
	}

	// StartDocPrinter
	r1, _, err = syscall.Syscall(procStartDocPrinter.Addr(), 3,
		uintptr(h),
		1,
		uintptr(unsafe.Pointer(&docInfo)),
	)
	if r1 == 0 {
		return fmt.Errorf("StartDocPrinter error: %v", err)
	}

	// StartPagePrinter
	r1, _, err = syscall.Syscall(procStartPagePrinter.Addr(), 1, uintptr(h), 0, 0)
	if r1 == 0 {
		return fmt.Errorf("StartPagePrinter error: %v", err)
	}

	// WritePrinter
	dataBytes := []byte(data)
	var written uint32

	r1, _, err = syscall.Syscall6(procWritePrinter.Addr(), 4,
		uintptr(h),
		uintptr(unsafe.Pointer(&dataBytes[0])),
		uintptr(len(dataBytes)),
		uintptr(unsafe.Pointer(&written)),
		0, 0,
	)
	if r1 == 0 {
		return fmt.Errorf("WritePrinter error: %v", err)
	}

	// EndPagePrinter
	syscall.Syscall(procEndPagePrinter.Addr(), 1, uintptr(h), 0, 0)

	// EndDocPrinter
	syscall.Syscall(procEndDocPrinter.Addr(), 1, uintptr(h), 0, 0)

	return nil
}
