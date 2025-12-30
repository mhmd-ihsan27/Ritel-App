package auth

import (
	"github.com/golang-jwt/jwt/v5"
)

// Claims represents the custom JWT claims for authentication
type Claims struct {
	UserID      int    `json:"user_id"`
	Username    string `json:"username"`
	NamaLengkap string `json:"nama_lengkap"`
	Role        string `json:"role"`
	jwt.RegisteredClaims
}
