package request

import (
	"context"
	"encoding/json"
	"r3/schema/role"
	"r3/types"

	"github.com/gofrs/uuid"
	"github.com/jackc/pgx/v5"
)

func RoleDel_tx(ctx context.Context, tx pgx.Tx, reqJson json.RawMessage) (interface{}, error) {

	var req struct {
		Id uuid.UUID `json:"id"`
	}
	if err := json.Unmarshal(reqJson, &req); err != nil {
		return nil, err
	}
	return nil, role.Del_tx(ctx, tx, req.Id)
}

func RoleSet_tx(ctx context.Context, tx pgx.Tx, reqJson json.RawMessage) (interface{}, error) {
	var req types.Role

	if err := json.Unmarshal(reqJson, &req); err != nil {
		return nil, err
	}
	return nil, role.Set_tx(ctx, tx, req)
}
