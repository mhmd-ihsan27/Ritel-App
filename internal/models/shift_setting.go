package models

type ShiftSetting struct {
	ID        int    `json:"id"`
	Name      string `json:"name"`      // "Shift 1", "Shift 2"
	StartTime string `json:"startTime"` // "06:00"
	EndTime   string `json:"endTime"`   // "14:00"
	StaffIDs  string `json:"staffIds"`  // Comma-separated staff IDs (e.g., "1,2,5")
}
