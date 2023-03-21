import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { DialogService } from 'src/app/services/dialog.service';
import Plant, { PlantsService } from 'src/app/services/plants.service';
import { EventEmitter } from '@angular/core';
import { Output } from '@angular/core';

@Component({
  selector: 'app-plant',
  templateUrl: './plant.component.html',
  styleUrls: ['./plant.component.css']
})
export class PlantComponent {
  // passed from the parent component
  @Input() plant?: Plant

  // the email for our user from the authentication service
  // TODO make this something we subscribe to
  email: string = ''

  // whether or not the image for this plant is in progress loading
  isImageLoading: boolean = false

  // filled out by getImage when the image loads - this is the string to render 
  // at the frontend with <img [src]="imageUrl">
  imageUrl: string | null = null

  // when user clicks the "edit" button on this plant
  @Output() editModeEmitter = new EventEmitter<{ plant: Plant, imageUrl: string | null }>()

  // color for text for the 'next water date' - set to red for plants in need of watering
  backgroundColor: string = 'black'; // Set the default background color here

  constructor(private router: Router,
    private plantService: PlantsService,
    private dialogService: DialogService,
    private authenticationService: AuthenticationService) {

  }

  ngOnInit() {
    this.email = this.authenticationService.email()
    if (!this.authenticationService.isAuthenticated$.value) {
      this.router.navigateByUrl('/authentication?mode=login');
      return
    }
    this.getImage()
    if (new Date(this.getNextWaterDate()) < new Date()) {
      if (this.plant) {
        console.log("plant " + this.plant.id + " is due for watering!")
        this.backgroundColor = "red"
      }
    }
  }

  /**
   * handle user editing the plant
   */
  editPlant() {
    if (!this.plant) {
      return;
    }
    this.editModeEmitter.emit({ plant: this.plant, imageUrl: this.imageUrl })
  }
  /**
   * handle user watering the plant
   */
  public waterPlant(): void {
    if (!this.plant) {
      return
    }
    var dialogRef = this.dialogService.displayConfirmationDialog("Did you water plant: " + this.plant.name + "?")
    if (this.plant == null) {
      console.log("Unexpected plant is NULL");
      return;
    }
    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        if (!this.plant) {
          return;
        }
        this.plant.lastWaterDate = new Date().toDateString()
        // not updating the image for this plant
        this.plantService.updatePlant(this.plant, null)
      } else {
        console.log("Dialog declined.")
      }
    })

  }

  /**
   * format the last water date to a string.
   * @returns formatted last water date
   */
  transformLastWaterDate(): string {
    if (!this.plant) {
      return "N/A"
    }
    const myDate = new Date(this.plant.lastWaterDate);
    return this.formatDate(myDate)
  }

  /**
   * @param date to format
   * @returns formatted @c date
   */
  private formatDate(date: Date): string {

    const day = date.getDate().toString().padStart(2, '0'); // Get the day of the month (1-31) and pad it with a leading zero if necessary
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Get the month (0-11), add 1 to get the month as a number (1-12), and pad it with a leading zero if necessary
    const year = date.getFullYear().toString(); // Get the year (4 digits)

    const formattedDate = `${month}/${day}/${year}`;
    return formattedDate
  }
  /**
   * obtain a formatted next-water-date from the difference between this plants last water date 
   * and water frequency.
   * @returns the date to next water this plant.
   */
  public getNextWaterDate(): string {
    if (!this.plant) {
      return "N/A"
    }
    var nextWaterDate = new Date()
    var lastWaterDate = new Date(this.plant.lastWaterDate)
    nextWaterDate.setDate(lastWaterDate.getDate() + parseInt(this.plant.wateringFrequency))
    return this.formatDate(nextWaterDate)
  }

  /**
   * get the image for this plant based on its imageId
   */
  private getImage(): void {
    if (!this.plant || this.plant.imageId == 0) {
      return
    }
    console.log("Getting image for imageId=" + this.plant.imageId)
    this.isImageLoading = true;
    this.plantService.getPlantImage(this.plant.imageId)
      .subscribe(blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          this.imageUrl = reader.result as string;
        };
        reader.readAsDataURL(blob);
        this.isImageLoading = false;
      });
  }

  /**
   * delete this plant. Handle the 'delete' button. 
   */
  public deletePlant() {
    if (!this.plant) {
      return;
    }
    var dialogRef = this.dialogService.displayConfirmationDialog("Are you sure you want to delete plant: " + this.plant.name + "?")
    if (this.plant == null) {
      console.log("Unexpected plant is NULL");
      return;
    }
    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        if (!this.plant) {
          return;
        }
        this.plantService.deletePlant(this.plant.id);
      } else {
        console.log("Dialog declined.")
      }
    })

  }
}
