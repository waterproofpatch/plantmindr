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
  public wateringFrequencyOptions = Array.from({ length: 60 }, (_, i) => i + 1);
  public fertilizingFrequencyOptions = Array.from({ length: 60 }, (_, i) => i + 1);

  // whether or not the view is condensed
  condensedView: boolean = false;

  // the image, if any, the user wishes to upload for their plant via the 
  // add/edit form
  selectedImage: File | null = null;

  // handle image preview when the edit/add form is open
  selectedImagePreview_safe: SafeUrl | null = null;
  selectedImagePreview: string = "/assets/placeholder.jpg"

  // whether or not the plants page is waiting for the backend
  isLoading: boolean = false;

  // whether or not the edit/add plant form is open
  addOrEditMode: boolean = false

  // the plant currently being edited
  editingPlant: Plant | null = null

  // list of view filters
  filters = new Map<string, boolean>();

  // the plant edit/add form
  form = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.min(3), Validators.max(30)]),
    publicOrPrivate: new FormControl('', [Validators.required]),
    doNotify: new FormControl(false),
    wateringFrequency: new FormControl(0, [Validators.required]),
    fertilizingFrequency: new FormControl(0, [Validators.required]),
    lastWateredDate: new FormControl('', [Validators.required]),
    lastFertilizedDate: new FormControl('', [Validators.required])
  });

  needsWatering = PlantsService.NeedsWatering;

  constructor(
    private sanitizer: DomSanitizer,
    private plantsService: PlantsService,
    private formBuilder: FormBuilder,
    public authenticationService: AuthenticationService,
    private router: Router
  ) {
    this.form = this.formBuilder.group({
      publicOrPrivate: [''],
      doNotify: [false],
      name: [''],
      wateringFrequency: [0],
      fertilizingFrequency: [0],
      lastWateredDate: [''],
      lastFertilizedDate: ['']
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

    // the plant service lets us know if it's waiting on plants from the backend here
    this.plantsService.isLoading.subscribe((x) => { if (x) { this.isLoading = true } else { this.isLoading = false } })

    // sanitize the selected preview image URL for display at the frontend
    this.selectedImagePreview_safe = this.sanitizer.bypassSecurityTrustUrl(this.selectedImagePreview);

    // set the UI from localStorage
    this.condensedView = localStorage.getItem("isCondensed") == "true" ? true : false
    this.filters.set("onlyMyPlants", localStorage.getItem("onlyMyPlants") == "true" ? true : false)
    this.filters.set("needsWatering", localStorage.getItem("needsWatering") == "true" ? true : false)

    // on init, ask for the list of plants
    this.getPlants()
  }

  public viewModeChanged(isCondensed: boolean): void {
    this.condensedView = isCondensed;
    localStorage.setItem("isCondensed", isCondensed ? "true" : "false")
  }

  public filterChange(filterName: string): void {
    this.filters.set(filterName, !this.filters.get(filterName))
    localStorage.setItem(filterName, (this.filters.get(filterName) ? "true" : false) || "n/a")
  }


  /**
   * Switch to edit mode for a given plant. 
   * @note called via Output handler for the plant component.   
   * @param event from the event emitter in the plant component.
   */
  public editPlant(event: any): void {
    let plant: Plant = event.plant
    let imageUrl = event.imageUrl
    this.editingPlant = plant
    this.form.controls.name.setValue(plant.name)
    this.form.controls['wateringFrequency'].setValue(plant.wateringFrequency)
    this.form.controls['fertilizingFrequency'].setValue(plant.fertilizingFrequency)
    this.form.controls.lastWateredDate.setValue(plant.lastWaterDate)
    this.form.controls.lastFertilizedDate.setValue(plant.lastFertilizeDate)
    this.form.controls.publicOrPrivate.setValue(plant.isPublic ? "public" : "private")
    this.form.controls.doNotify.setValue(plant.doNotify ? true : false)
    if (imageUrl) {
      this.selectedImagePreview = imageUrl
      this.selectedImagePreview_safe = this.sanitizer.bypassSecurityTrustUrl(this.selectedImagePreview);
    }
    this.addOrEditMode = true
  }

  /**
   * Exit the edit mode. 
   * @note Called from the 'cancel' button.
   */
  public cancelAddMode(): void {
    this.addOrEditMode = false;
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

  addPlant() {
    if (this.editingPlant) {
      console.log("A plant has been edited (not added)")
      var plant = PlantsService.PlantsFactory.makePlant(this.form.controls.name.value || '',
        this.form.controls.wateringFrequency.value || 0,
        this.form.controls.fertilizingFrequency.value || 0,
        this.form.controls.lastWateredDate.value || '',
        this.form.controls.lastFertilizedDate.value || '',
        this.form.controls.publicOrPrivate.value == "public" || false,
        this.form.controls.doNotify.value == true || false)
      plant.id = this.editingPlant.id
      this.plantsService.updatePlant(plant, this.selectedImage)
      this.editingPlant = null
      this.addOrEditMode = false;
      this.selectedImage = null
      this.selectedImagePreview = "/assets/placeholder.jpg"
      this.selectedImagePreview_safe = null
      return
    }
    // Perform actions when the form is submitted
    var plant = PlantsService.PlantsFactory.makePlant(this.form.controls.name.value || '',
      this.form.controls.wateringFrequency.value || 0,
      this.form.controls.fertilizingFrequency.value || 0,
      this.form.controls.lastWateredDate.value || '',
      this.form.controls.lastFertilizedDate.value || '',
      this.form.controls.publicOrPrivate.value == "public" || false,
      this.form.controls.doNotify.value == true || false)
    this.plantsService.addPlant(plant, this.selectedImage)
    this.addOrEditMode = false;
    this.selectedImage = null
    this.selectedImagePreview = "/assets/placeholder.jpg"
    this.selectedImagePreview_safe = null
  }

  /**
   * Obtain a list of plants from the plant service. Users can subscribe to 'plants' to 
   * monitor for changes to the plant services plants list.
   */
  private getPlants(): void {
    this.plantsService.getPlants()
  }

  // html page subscribes to this via async
  public get plants(): Subject<Plant[]> {
    return this.plantsService.plants
  }
}
