package model

import (
	"encoding/json"
	"io"
)

type BoardType string

const (
	BoardTypeOpen    BoardType = "O"
	BoardTypePrivate BoardType = "P"
)

// Board groups a set of blocks and its layout
// swagger:model
type Board struct {
	// The ID for the board
	// required: true
	ID string `json:"id"`

	// The ID of the team that the board belongs to
	// required: true
	TeamID string `json:"teamId"`

	// The ID of the channel that the board was created from
	// required: false
	ChannelID string `json:"channelId"`

	// The ID of the user that created the board
	// required: true
	CreatedBy string `json:"createdBy"`

	// The ID of the last user that updated the board
	// required: true
	ModifiedBy string `json:"modifiedBy"`

	// The type of the board
	// required: true
	Type BoardType `json:"type"`

	// The title of the board
	// required: false
	Title string `json:"title"`

	// The description of the board
	// required: false
	Description string `json:"description"`

	// The icon of the board
	// required: false
	Icon string `json:"icon"`

	// Indicates if the board shows the description on the interface
	// required: false
	ShowDescription bool `json:"showDescription"`

	// Marks the template boards
	// required: false
	IsTemplate bool `json:"isTemplate"`

	// Marks the template boards
	// required: false
	TemplateVersion int `json:"templateVersion"`

	// The properties of the board
	// required: false
	Properties map[string]interface{} `json:"properties"`

	// The properties of the board cards
	// required: false
	CardProperties []map[string]interface{} `json:"cardProperties"`

	// The calculations on the board's cards
	// required: false
	ColumnCalculations map[string]interface{} `json:"columnCalculations"`

	// The creation time
	// required: true
	CreateAt int64 `json:"createAt"`

	// The last modified time
	// required: true
	UpdateAt int64 `json:"updateAt"`

	// The deleted time. Set to indicate this block is deleted
	// required: false
	DeleteAt int64 `json:"deleteAt"`
}

// BoardPatch is a patch for modify boards
// swagger:model
type BoardPatch struct {
	// The type of the board
	// required: false
	Type *BoardType `json:"type"`

	// The title of the board
	// required: false
	Title *string `json:"title"`

	// The description of the board
	// required: false
	Description *string `json:"description"`

	// The icon of the board
	// required: false
	Icon *string `json:"icon"`

	// Indicates if the board shows the description on the interface
	// required: false
	ShowDescription *bool `json:"showDescription"`

	// The board updated properties
	// required: false
	UpdatedProperties map[string]interface{} `json:"updatedProperties"`

	// The board removed properties
	// required: false
	DeletedProperties []string `json:"deletedProperties"`

	// The board updated card properties
	// required: false
	UpdatedCardProperties []map[string]interface{} `json:"updatedCardProperties"`

	// The board removed card properties
	// required: false
	DeletedCardProperties []string `json:"deletedCardProperties"`

	// The board updated column calculations
	// required: false
	UpdatedColumnCalculations map[string]interface{} `json:"updatedColumnCalculations"`

	// The board deleted column calculations
	// required: false
	DeletedColumnCalculations []string `json:"deletedColumnCalculations"`
}

// BoardMember stores the information of the membership of a user on a board
// swagger:model
type BoardMember struct {
	// The ID of the board
	// required: true
	BoardID string `json:"boardId"`

	// The ID of the user
	// required: true
	UserID string `json:"userId"`

	// The independent roles of the user on the board
	// required: false
	Roles string `json:"roles"`

	// Marks the user as an admin of the board
	// required: true
	SchemeAdmin bool `json:"schemeAdmin"`

	// Marks the user as an editor of the board
	// required: true
	SchemeEditor bool `json:"schemeEditor"`

	// Marks the user as an commenter of the board
	// required: true
	SchemeCommenter bool `json:"schemeCommenter"`

	// Marks the user as an viewer of the board
	// required: true
	SchemeViewer bool `json:"schemeViewer"`
}

func BoardFromJSON(data io.Reader) *Board {
	var board *Board
	_ = json.NewDecoder(data).Decode(&board)
	return board
}

func BoardsFromJSON(data io.Reader) []*Board {
	var boards []*Board
	_ = json.NewDecoder(data).Decode(&boards)
	return boards
}

func BoardMemberFromJSON(data io.Reader) *BoardMember {
	var boardMember *BoardMember
	_ = json.NewDecoder(data).Decode(&boardMember)
	return boardMember
}

func BoardMembersFromJSON(data io.Reader) []*BoardMember {
	var boardMembers []*BoardMember
	_ = json.NewDecoder(data).Decode(&boardMembers)
	return boardMembers
}

// Patch returns an updated version of the board.
func (p *BoardPatch) Patch(board *Board) *Board {
	if p.Type != nil {
		board.Type = *p.Type
	}

	if p.Title != nil {
		board.Title = *p.Title
	}

	if p.Description != nil {
		board.Description = *p.Description
	}

	if p.Icon != nil {
		board.Icon = *p.Icon
	}

	if p.ShowDescription != nil {
		board.ShowDescription = *p.ShowDescription
	}

	for key, property := range p.UpdatedProperties {
		board.Properties[key] = property
	}

	for _, key := range p.DeletedProperties {
		delete(board.Properties, key)
	}

	if len(p.UpdatedCardProperties) != 0 || len(p.DeletedCardProperties) != 0 {
		// first we accumulate all properties indexed by ID
		cardPropertyMap := map[string]map[string]interface{}{}
		for _, prop := range board.CardProperties {
			id, ok := prop["id"].(string)
			if !ok {
				// bad property, skipping
				continue
			}

			cardPropertyMap[id] = prop
		}

		// if there are properties marked for removal, we delete them
		for _, propertyID := range p.DeletedCardProperties {
			delete(cardPropertyMap, propertyID)
		}

		// if there are properties marked for update, we replace the
		// existing ones or add them
		for _, newprop := range p.UpdatedCardProperties {
			id, ok := newprop["id"].(string)
			if !ok {
				// bad new property, skipping
				continue
			}

			cardPropertyMap[id] = newprop
		}

		// and finally we flatten and save the updated properties
		newCardProperties := []map[string]interface{}{}
		for _, p := range cardPropertyMap {
			newCardProperties = append(newCardProperties, p)
		}

		board.CardProperties = newCardProperties
	}

	for key, columnCalculation := range p.UpdatedColumnCalculations {
		board.ColumnCalculations[key] = columnCalculation
	}

	for _, key := range p.DeletedColumnCalculations {
		delete(board.ColumnCalculations, key)
	}

	return board
}

func IsBoardTypeValid(t BoardType) bool {
	return t == BoardTypeOpen || t == BoardTypePrivate
}

func (p *BoardPatch) IsValid() error {
	if p.Type != nil && !IsBoardTypeValid(*p.Type) {
		return InvalidBoardErr{"invalid-board-type"}
	}

	return nil
}

type InvalidBoardErr struct {
	msg string
}

func (ibe InvalidBoardErr) Error() string {
	return ibe.msg
}

func (b *Board) IsValid() error {
	if b.TeamID == "" {
		return InvalidBoardErr{"empty-team-id"}
	}

	if !IsBoardTypeValid(b.Type) {
		return InvalidBoardErr{"invalid-board-type"}
	}
	return nil
}
