import { PlantLog } from "../types";
import { Comment } from "../types";

export class Plant {
	constructor(public id: number,
		public name: string,
		public username: string,
		public email: string,
		public wateringFrequency: number,
		public fertilizingFrequency: number,
		public lastWaterDate: string,
		public lastFertilizeDate: string,
		public lastMoistDate: string,
		public skippedLastFertilize: boolean,
		public tag: string,
		public imageId: number,
		public isPublic: boolean,
		public doNotify: boolean,
		public logs: PlantLog[],
		public comments: Comment[],
		public notes: string) {
	}

	/**
	 * get a string representation for the plant.
	 * @returns a string representation of the plant.
	 */
	public toString(): string {
		let plantDetails = `
		ID: ${this.id}
		Name: ${this.name}
		Username: ${this.username}
		Email: ${this.email}
		Watering Frequency: ${this.wateringFrequency}
		Fertilizing Frequency: ${this.fertilizingFrequency}
		Last Water Date: ${this.lastWaterDate}
		Last Fertilize Date: ${this.lastFertilizeDate}
		Last Moist Date: ${this.lastMoistDate}
		Skipped Last Fertilize: ${this.skippedLastFertilize ? 'Yes' : 'No'}
		Tag: ${this.tag}
		Image ID: ${this.imageId}
		Is Public: ${this.isPublic ? 'Yes' : 'No'}
		Do Notify: ${this.doNotify ? 'Yes' : 'No'}
		Notes: ${this.notes}`;
		return plantDetails;
	}

	/**
	 * @param date to format
	 * @returns formatted @c date
	 */
	public static formatDate(date: Date): string {

		const day = date.getDate().toString().padStart(2, '0'); // Get the day of the month (1-31) and pad it with a leading zero if necessary
		const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Get the month (0-11), add 1 to get the month as a number (1-12), and pad it with a leading zero if necessary
		const year = date.getFullYear().toString(); // Get the year (4 digits)

		const formattedDate = `${month}/${day}/${year}`;
		return formattedDate
	}

	/**
	 * 
	 * @param name name of the plant
	 * @param wateringFrequency how often to water the plant
	 * @param fertilizingFrequency how often to fertilize the plant
	 * @param lastWateredDate when the plant was last watered
	 * @param lastFertilizeDate when the plant was last fertilized
	 * @param lastMoistDate when the plant was last checked for moist
	 * @param tag tag for the plant
	 * @param isPublic whether or not the plant is public
	 * @param doNotify whether or not the plant is sending notifications
	 * @param logs logs for the plant
	 * @param comments comments for the plant
	 * @returns a Plant object
	 */
	public static makePlant(name: string,
		wateringFrequency: number,
		fertilizingFrequency: number,
		lastWateredDate: Date,
		lastFertilizeDate: Date,
		lastMoistDate: string,
		tag: string,
		isPublic: boolean,
		doNotify: boolean,
		logs: PlantLog[],
		comments: Comment[],
	): Plant {
		let plant: Plant = new Plant(
			0, // id
			name,
			"", // username
			"", // email
			wateringFrequency,
			fertilizingFrequency,
			Plant.formatDate(lastWateredDate),
			Plant.formatDate(lastFertilizeDate),
			lastMoistDate,
			false, // skippedLastFertilize
			tag,
			0, //imageId,
			isPublic,
			doNotify,
			logs,
			comments,
			"", // notes

		)
		return plant;
	}
}

