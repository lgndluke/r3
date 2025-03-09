package request

import (
	"context"
	"encoding/json"
	"fmt"
	"r3/cluster"
	"r3/schema"
	"strings"

	"github.com/gofrs/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

// requests for browser clients
func eventFilesCopied_tx(ctx context.Context, tx pgx.Tx, reqJson json.RawMessage, loginId int64, address string) (interface{}, error) {
	// request file(s) to be copied (synchronized across all browser clients)
	var req struct {
		AttributeId uuid.UUID   `json:"attributeId"`
		FileIds     []uuid.UUID `json:"fileIds"`
		RecordId    int64       `json:"recordId"`
	}
	if err := json.Unmarshal(reqJson, &req); err != nil {
		return nil, err
	}
	return nil, cluster.FilesCopied_tx(ctx, tx, true, address, loginId, req.AttributeId, req.FileIds, req.RecordId)
}

// requests for fat clients
func eventClientEventsChanged_tx(ctx context.Context, tx pgx.Tx, loginId int64, address string) (interface{}, error) {
	return nil, cluster.ClientEventsChanged_tx(ctx, tx, true, address, loginId)
}
func eventFileRequested_tx(ctx context.Context, tx pgx.Tx, reqJson json.RawMessage, loginId int64, address string) (interface{}, error) {
	var req struct {
		AttributeId uuid.UUID `json:"attributeId"`
		FileId      uuid.UUID `json:"fileId"`
		RecordId    int64     `json:"recordId"`
		ChooseApp   bool      `json:"chooseApp"`
	}

	if err := json.Unmarshal(reqJson, &req); err != nil {
		return nil, err
	}

	// get current file name and latest hash
	// files before 3.1 do not have a hash value, empty hash is then compared against new file version hash
	var hash pgtype.Text
	var name string
	if err := tx.QueryRow(ctx, fmt.Sprintf(`
		SELECT v.hash, r.name
		FROM instance.file_version AS v
		JOIN instance_file."%s"    AS r
			ON  r.file_id   = v.file_id
			AND r.record_id = $1
		WHERE v.file_id = $2
		ORDER BY v.version DESC 
		LIMIT 1
	`, schema.GetFilesTableName(req.AttributeId)),
		req.RecordId, req.FileId).Scan(&hash, &name); err != nil {
		return nil, err
	}

	// compatibility fix
	// we currently allow many special characters in file names, some are invalid in general (? & @), others are valid but must be escaped in URL (like #)
	// file names are not escaped by r3 client in the download URL, this will cause download to fail
	name = strings.NewReplacer(
		"#", "",
		"=", "",
		"@", "",
		"?", "",
		":", "",
		";", "",
		"/", "",
		"\\", "",
		"&", "").Replace(name)

	return nil, cluster.FileRequested_tx(ctx, tx, true, address, loginId,
		req.AttributeId, req.FileId, hash.String, name, req.ChooseApp)
}
func eventKeystrokesRequested_tx(ctx context.Context, tx pgx.Tx, reqJson json.RawMessage, loginId int64, address string) (interface{}, error) {
	var keystrokes string

	if err := json.Unmarshal(reqJson, &keystrokes); err != nil {
		return nil, err
	}
	return nil, cluster.KeystrokesRequested_tx(ctx, tx, true, address, loginId, keystrokes)
}
