package app

import (
	"fmt"
	"log"

	"gorm.io/gorm"
)

type ImageModel struct {
	gorm.Model
	ID   uint
	Name string
	Data []byte
}

type PlantModel struct {
	gorm.Model
	Id                int    `json:"id"`
	Name              string `json:"name"`
	WateringFrequency string `json:"wateringFrequency"`
	ImageId           uint   `json:"imageId"`
}
type MessageModel struct {
	gorm.Model
	Id            int    `json:"id"`
	From          string `json:"from"`
	Timestamp     string `json:"timestamp"`
	Content       string `json:"content"`
	Channel       string `json:"channel"`
	PmUsername    string `json:"pmUsername"`
	Authenticated bool   `json:"authenticated"`
}

func (i PlantModel) String() string {
	return fmt.Sprintf("ID: %d, %d/%d/%d - %d:%d:%d, name: %s, type: %d", i.ID, i.CreatedAt.Year(), i.CreatedAt.Month(), i.CreatedAt.Day(), i.CreatedAt.Hour(), i.CreatedAt.Minute(), i.CreatedAt.Second(), i.Name, i.WateringFrequency)
}

func AddMessage(db *gorm.DB, message *Message) error {
	// Delete old records if the limit has been reached
	var count int64
	db.Model(&MessageModel{}).Count(&count)
	if count > 50 {
		fmt.Printf("DB has %d messages.", count)
		var messages []MessageModel
		db.Order("id asc").Limit(int(count) - 50).Find(&messages)
		db.Delete(&messages)
	}
	newDbMessage := MessageModel{
		From:          message.From,
		Timestamp:     message.Timestamp,
		Content:       message.Content,
		Channel:       message.Channel,
		PmUsername:    message.PmUsername,
		Authenticated: message.Authenticated,
	}
	err := db.Create(&newDbMessage).Error
	if err != nil {
		return err
	}
	db.Save(newDbMessage)
	return nil
}
func UpdatePlant(db *gorm.DB, id int, name string, wateringFrequency string) error {
	var existingplant PlantModel
	existingplant.Id = id
	db.First(&existingplant)
	existingplant.Name = name
	existingplant.WateringFrequency = wateringFrequency
	db.Save(existingplant)
	return nil
}

func AddPlant(db *gorm.DB, name string, wateringFrequency string, imageId uint) error {
	var plant = PlantModel{
		Name:              name,
		WateringFrequency: wateringFrequency,
		ImageId:           imageId,
	}

	log.Printf("Adding plant %s", plant)

	err := db.Create(&plant).Error
	if err != nil {
		return err
	}
	db.Save(plant)
	return nil
}

func InitModels(db *gorm.DB) {
	log.Printf("Initializing models...\n")
	db.AutoMigrate(&PlantModel{})
	db.AutoMigrate(&MessageModel{})
	db.AutoMigrate(&ImageModel{})
}
