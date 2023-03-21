import { Component } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { PlantsService } from 'src/app/services/plants.service';
import Plant from 'src/app/services/plants.service';
import { FormControl, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { Router } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-plants',
  templateUrl: './plants.component.html',
  styleUrls: ['./plants.component.css']
})
export class PlantsComponent {

  // suggested watering frequency for the plant based on backend search
  suggestedWateringFrequency: BehaviorSubject<number> = new BehaviorSubject<number>(0)

  // whether or not we're waiting for the answer to the suggested watering frequency
  isWaitingSuggestedWateringFrequency: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)

  // the image, if any, the user wishes to upload for their plant via the 
  // add/edit form
  selectedImage: File | null = null;

  // handle image preview when the edit/add form is open
  selectedImagePreview_safe: SafeUrl | null = null;
  selectedImagePreview: string = "/assets/placeholder.jpg"

  // whether or not the plants page is waiting for the backend
  isLoading: boolean = false;

  // whether or not the edit/add plant form is open
  addMode: boolean = false

  // the plant currently being edited
  editingPlant: Plant | null = null

  // the plant edit/add form
  form = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.min(3), Validators.max(30)]),
    wateringFrequency: new FormControl('', [Validators.required]),
    lastWateredDate: new FormControl('', [Validators.required])
  });

  constructor(
    private sanitizer: DomSanitizer,
    private plantsService: PlantsService,
    private formBuilder: FormBuilder,
    private authenticationService: AuthenticationService,
    private router: Router
  ) {
    this.form = this.formBuilder.group({
      name: [''],
      wateringFrequency: [''],
      lastWateredDate: ['']
    });
  }

  ngOnInit(): void {
    // if the user isn't logged in, redirect them to login page
    if (!this.authenticationService.isAuthenticated$.value) {
      this.router.navigateByUrl('/authentication?mode=login');
      return
    }

    // handle notifications to login status
    this.authenticationService.isAuthenticated$.subscribe((x) => {
      if (!x) {
        this.router.navigateByUrl('/authentication?mode=login');
        // setTimeout here is a kludge to make sure we actually redirect the user, rather than do nothing
        setTimeout(() => this.router.navigateByUrl('/authentication?mode=login'), 0)
      }
    })

    // when the plant service gets the watering frequency back, it notifies us here
    this.plantsService.suggestedWateringFrequency.subscribe((x) => {
      console.log("Updated watering frequency: " + x)
      this.suggestedWateringFrequency.next(x)
      // we're no longer waiting for the watering frequency
      this.isWaitingSuggestedWateringFrequency.next(false)
    })

    // the plant service lets us know if it's waiting on plants from the backend here
    this.plantsService.isLoading.subscribe((x) => { if (x) { this.isLoading = true } else { this.isLoading = false } })

    // sanitize the selected preview image URL for display at the frontend
    this.selectedImagePreview_safe = this.sanitizer.bypassSecurityTrustUrl(this.selectedImagePreview);

    // on init, ask for the list of plants
    this.getPlants()
  }

  /**
   * Get the suggested watering frequency based on the plant name
   */
  public getSuggestedWateringFrequency(): void {
    let plantName = this.form.controls.name.value
    if (plantName) {
      this.isWaitingSuggestedWateringFrequency.next(true)
      this.plantsService.getPlantWateringFrequency(plantName)
    }
  }

  /**
   * Switch to edit mode for a given plant. 
   * @note called via Output handler for the plant component.   
   * @param event from the event emitter in the plant component.
   */
  public editPlant(event: any): void {
    let plant = event.plant
    let imageUrl = event.imageUrl
    console.log("Plant ID " + plant.id + " wants edit. It has current image at " + imageUrl)
    this.editingPlant = plant
    this.form.controls.name.setValue(plant.name)
    this.form.controls.wateringFrequency.setValue(plant.wateringFrequency)
    this.form.controls.lastWateredDate.setValue(plant.lastWaterDate)
    if (imageUrl) {

      this.selectedImagePreview = imageUrl
      this.selectedImagePreview_safe = this.sanitizer.bypassSecurityTrustUrl(this.selectedImagePreview);
    }
    this.addMode = true
  }

  /**
   * Exit the edit mode. 
   * @note Called from the 'cancel' button.
   */
  public cancelAddMode(): void {
    this.addMode = false;
    this.selectedImagePreview = "/assets/placeholder.jpg"
    this.selectedImagePreview_safe = this.sanitizer.bypassSecurityTrustUrl(this.selectedImagePreview);
    this.getPlants()
  }

  /**
   * Handle the user picking an iage to upload for their plant from the add/edit form.
   * @param event the file event from the input.
   */
  onImageSelected(event: any) {
    this.selectedImage = event.target.files[0];
    if (this.selectedImage) {
      this.selectedImagePreview = URL.createObjectURL(this.selectedImage)
      this.selectedImagePreview_safe = this.sanitizer.bypassSecurityTrustUrl(this.selectedImagePreview);
    }
  }
  get name() { return this.form.get('name'); }
  get wateringFrequency() { return this.form.get('wateringFrequency'); }

  addPlant() {
    if (this.editingPlant) {
      console.log("A plant has been edited (not added)")
      var plant = PlantsService.PlantsFactory.makePlant(this.form.controls.name.value || '', this.form.controls.wateringFrequency.value || '', this.form.controls.lastWateredDate.value || '')
      plant.id = this.editingPlant.id
      this.plantsService.updatePlant(plant, this.selectedImage)
      this.editingPlant = null
      this.addMode = false;
      this.selectedImage = null
      this.selectedImagePreview = "/assets/placeholder.jpg"
      this.selectedImagePreview_safe = null
      return
    }
    // Perform actions when the form is submitted
    var plant = PlantsService.PlantsFactory.makePlant(this.form.controls.name.value || '', this.form.controls.wateringFrequency.value || '', this.form.controls.lastWateredDate.value || '')
    this.plantsService.addPlant(plant, this.selectedImage)
    this.addMode = false;
    this.selectedImage = null
    this.selectedImagePreview = "/assets/placeholder.jpg"
    this.selectedImagePreview_safe = null
  }
  getPlants(): void {
    this.plantsService.getPlants()
  }

  get plants(): Subject<Plant[]> {
    return this.plantsService.plants
  }
}