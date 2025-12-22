// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule, NgForm } from '@angular/forms';
// import { Router } from '@angular/router';
// import { PropertyService } from '../../Services/property';
// import { LocationService } from '../../Services/location';
// import { ICreatePropertyDto } from '../../models/icreate-property-dto';

// @Component({
//   selector: 'app-add-property',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   templateUrl: './add-property.html',
//   styleUrl: './add-property.css',
// })
// export class AddProperty implements OnInit {
//   cities: any[] = [];
//   areas: any[] = [];

//   property: ICreatePropertyDto = {
//     title: '',
//     description: '',
//     price: 0,
//     areaSpace: 0,
//     location: '',
//     cityId: 0,
//     areaId: 0,
//     rooms: 0,
//     bathrooms: 0,
//     finishingLevel: '',
//     propertyType: '',
//     purpose: '',
//     status: '0', // Enum as number
//   };

//   mainImage!: File;
//   additionalImages: File[] = [];
//   isSubmitting = false;

//   constructor(
//     private propertyService: PropertyService,
//     private locationService: LocationService,
//     private router: Router
//   ) {}

//   ngOnInit(): void {
//     this.loadCities();
//   }

//   loadCities() {
//     this.locationService.getCities().subscribe({
//       next: (res) => (this.cities = res),
//       error: (err) => console.error('Failed to load cities:', err),
//     });
//   }

//   onCityChange() {
//     if (!this.property.cityId || this.property.cityId === 0) {
//       this.areas = [];
//       this.property.areaId = 0;
//       return;
//     }

//     this.locationService.getAreasByCity(this.property.cityId).subscribe({
//       next: (res) => (this.areas = res),
//       error: (err) => console.error('Failed to load areas:', err),
//     });
//   }

//   onMainImageChange(event: any) {
//     if (event.target.files && event.target.files.length > 0) {
//       this.mainImage = event.target.files[0];
//     }
//   }

//   onAdditionalImagesChange(event: any) {
//     if (event.target.files && event.target.files.length > 0) {
//       this.additionalImages = Array.from(event.target.files);
//     }
//   }

//   submit(form: NgForm) {
//     if (form.invalid || !this.mainImage) {
//       form.control.markAllAsTouched();
//       alert('Please complete all required fields and select a main image.');
//       return;
//     }

//     this.isSubmitting = true;

//     this.propertyService.create(this.property, this.mainImage, this.additionalImages).subscribe({
//       next: (res: any) => {
//         alert(res?.message || 'Property added successfully');
//         this.router.navigate(['/properties']);
//       },
//       error: (err) => {
//         console.error('Add Property Error:', err);
//         alert(err?.error?.message || 'Something went wrong while adding the property');
//         this.isSubmitting = false;
//       },
//     });
//   }
// }



import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { PropertyService } from '../../Services/property';
import { LocationService } from '../../Services/location';
import { ICreatePropertyDto } from '../../models/icreate-property-dto';

@Component({
  selector: 'app-add-property',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-property.html',
  styleUrl: './add-property.css',
})
export class AddProperty implements OnInit {
  // Step management
  currentStep: number = 1;
  totalSteps: number = 4;
  stepsCompleted: Set<number> = new Set();

  // Cities and Areas
  cities: any[] = [];
  areas: any[] = [];

  // Property data
  property: ICreatePropertyDto = {
    title: '',
    description: '',
    price: 0,
    areaSpace: 0,
    location: '',
    cityId: 0,
    areaId: 0,
    rooms: 0,
    bathrooms: 0,
    finishingLevel: '',
    propertyType: '',
    purpose: '',
    status: 0,
  };

  // Images
  mainImage!: File;
  mainImagePreview: string | null = null;
  additionalImages: File[] = [];
  additionalImagesPreview: (string | null)[] = [];
  isSubmitting = false;

  // Form tracking
  step1Form!: NgForm;
  step2Form!: NgForm;
  step3Form!: NgForm;
  step4Form!: NgForm;

  // Validation flags
  showValidationErrors = false;

  constructor(
    private propertyService: PropertyService,
    private locationService: LocationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCities();
  }

  /**
   * Load cities
   */
  loadCities() {
    this.locationService.getCities().subscribe({
      next: (res) => (this.cities = res),
      error: (err) => console.error('Failed to load cities:', err),
    });
  }

  /**
   * Load areas when city changes
   */
  onCityChange() {
    if (!this.property.cityId || this.property.cityId === 0) {
      this.areas = [];
      this.property.areaId = 0;
      return;
    }

    this.locationService.getAreasByCity(this.property.cityId).subscribe({
      next: (res) => (this.areas = res),
      error: (err) => console.error('Failed to load areas:', err),
    });
  }

  /**
   * Handle main image selection
   */
  onMainImageChange(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.mainImage = event.target.files[0];
      this.generateImagePreview(this.mainImage, (preview) => {
        this.mainImagePreview = preview;
      });
    }
  }

  /**
   * Handle additional images selection
   */
  onAdditionalImagesChange(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.additionalImages = Array.from(event.target.files);
      this.additionalImagesPreview = [];

      this.additionalImages.forEach((img) => {
        this.generateImagePreview(img, (preview) => {
          this.additionalImagesPreview.push(preview);
        });
      });
    }
  }

  /**
   * Generate image preview
   */
  private generateImagePreview(file: File, callback: (preview: string) => void) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      callback(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  /**
   * Remove main image
   */
  removeMainImage() {
    this.mainImage = null!;
    this.mainImagePreview = null;
  }

  /**
   * Remove additional image
   */
  removeAdditionalImage(index: number) {
    this.additionalImages.splice(index, 1);
    this.additionalImagesPreview.splice(index, 1);
  }

  /**
   * Validate Step 1 - Basic Info
   */
  validateStep1(): boolean {
    return (
      this.property.title.trim() !== '' &&
      this.property.description.trim() !== '' &&
      this.property.propertyType !== '' &&
      this.property.purpose !== ''
    );
  }

  /**
   * Validate Step 2 - Location
   */
  validateStep2(): boolean {
    return (
      this.property.cityId > 0 &&
      this.property.areaId > 0 &&
      this.property.location.trim() !== ''
    );
  }

  /**
   * Validate Step 3 - Details
   */
  validateStep3(): boolean {
    return (
      this.property.price > 0 &&
      this.property.areaSpace > 0 &&
      this.property.rooms > 0 &&
      this.property.bathrooms > 0 &&
      this.property.finishingLevel !== ''
    );
  }

  /**
   * Validate Step 4 - Images
   */
  validateStep4(): boolean {
    return this.mainImage !== null && this.mainImage !== undefined;
  }

  /**
   * Go to next step
   */
  nextStep() {
    this.showValidationErrors = false;

    // Validate current step
    let isValid = false;
    switch (this.currentStep) {
      case 1:
        isValid = this.validateStep1();
        break;
      case 2:
        isValid = this.validateStep2();
        break;
      case 3:
        isValid = this.validateStep3();
        break;
      case 4:
        isValid = this.validateStep4();
        break;
    }

    if (!isValid) {
      this.showValidationErrors = true;
      alert('Please complete all required fields before proceeding');
      return;
    }

    // Mark step as completed
    this.stepsCompleted.add(this.currentStep);

    // Move to next step
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.showValidationErrors = false;
      window.scrollTo(0, 0);
    }
  }

  /**
   * Go to previous step
   */
  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.showValidationErrors = false;
      window.scrollTo(0, 0);
    }
  }

  /**
   * Go to specific step
   */
  goToStep(step: number) {
    // Can only go to completed steps or next step
    if (step < this.currentStep || step === this.currentStep + 1 || this.stepsCompleted.has(step - 1)) {
      this.currentStep = step;
      this.showValidationErrors = false;
      window.scrollTo(0, 0);
    }
  }

  /**
   * Check if step is completed
   */
  isStepCompleted(step: number): boolean {
    return this.stepsCompleted.has(step);
  }

  /**
   * Check if step is active
   */
  isStepActive(step: number): boolean {
    return this.currentStep === step;
  }

  /**
   * Submit form - Navigate to Success Page
   */
  submit() {
    // Final validation
    if (!this.validateStep4()) {
      alert('Please select a main image');
      return;
    }

    // Mark all steps as completed
    for (let i = 1; i <= this.totalSteps; i++) {
      this.stepsCompleted.add(i);
    }

    this.isSubmitting = true;

    this.propertyService.create(this.property, this.mainImage, this.additionalImages).subscribe({
      next: (res: any) => {
        console.log('Property added successfully:', res);
        // Navigate to success page instead of properties page
        this.router.navigate(['/success']);
      },
      error: (err) => {
        console.error('Add Property Error:', err);
        alert(err?.error?.message || 'Something went wrong while adding the property');
        this.isSubmitting = false;
      },
    });
  }

  /**
   * Get step title
   */
  getStepTitle(step: number): string {
    const titles: { [key: number]: string } = {
      1: 'Basic Information',
      2: 'Location',
      3: 'Property Details',
      4: 'Images',
    };
    return titles[step] || '';
  }

  /**
   * Get step description
   */
  getStepDescription(step: number): string {
    const descriptions: { [key: number]: string } = {
      1: 'Enter the basic information about your property',
      2: 'Select the location and area',
      3: 'Provide detailed information about the property',
      4: 'Upload images of the property',
    };
    return descriptions[step] || '';
  }
}
