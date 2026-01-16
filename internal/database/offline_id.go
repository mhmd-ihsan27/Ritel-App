package database

import (
	"math/rand"
	"sync/atomic"
	"time"
)

var offlineIDCounter uint64

func GenerateOfflineID() int64 {
	now := uint64(time.Now().UnixNano())
	ctr := atomic.AddUint64(&offlineIDCounter, 1)
	rnd := uint64(rand.Uint32())
	id := (now << 22) ^ (ctr << 6) ^ rnd
	if id == 0 {
		id = 1
	}
	return -int64(id)
}

