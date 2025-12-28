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
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PropertyService } from '../../Services/property';
import { LocationService } from '../../Services/location';
import { ICreatePropertyDto } from '../../models/icreate-property-dto';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-add-property',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
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

  // تحسين الأداء
  imagesCompressionInProgress = false;

  // Translated placeholders
  placeholders: { [key: string]: string } = {};

  constructor(
    private propertyService: PropertyService,
    private locationService: LocationService,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadCities();
    this.loadPlaceholders();
  }

  /**
   * Load translated placeholders
   */
  loadPlaceholders(): void {
    const placeholderKeys = [
      'forms.add_property.title_placeholder',
      'forms.add_property.description_placeholder',
      'forms.add_property.location_placeholder'
    ];
    
    placeholderKeys.forEach(key => {
      this.placeholders[key] = this.translate.instant(key);
    });
    
    // Listen for language changes
    this.translate.onLangChange.subscribe(() => {
      placeholderKeys.forEach(key => {
        this.placeholders[key] = this.translate.instant(key);
      });
    });
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
   * Handle property type change
   */
  onPropertyTypeChange() {
    if (this.property.propertyType === 'Land') {
      // إذا اختار Land، اجعل Purpose تلقائياً Sale
      this.property.purpose = 'Sale';
      // صفّر الغرف والحمامات لأن Land لا يحتاج لها
      this.property.rooms = 0;
      this.property.bathrooms = 0;
      this.property.finishingLevel = '';
    } else {
      // للعقارات الأخرى، امسح Purpose لكي يختار من جديد
      this.property.purpose = '';
    }
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
   * ضغط الصورة قبل الرفع - محسّن للأداء
   */
  private async compressImage(file: File, maxWidth: number = 800, quality: number = 0.75): Promise<File> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event: any) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // تقليل الأبعاد للحد من حجم الملف
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
          }

          // تحويل الصورة المضغوطة إلى File
          canvas.toBlob(
            (blob) => {
              const compressedFile = new File([blob!], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            'image/jpeg',
            quality
          );
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * معالجة الصورة الرئيسية مع ضغط محسّن
   */
  async onMainImageChange(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      const originalFile = event.target.files[0];
      this.mainImage = await this.compressImage(originalFile, 800, 0.75);
      this.generateImagePreview(this.mainImage, (preview) => {
        this.mainImagePreview = preview;
      });
    }
  }

  /**
   * معالجة الصور الإضافية مع ضغط محسّن وتوازي
   */
  async onAdditionalImagesChange(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.additionalImages = [];
      this.additionalImagesPreview = [];

      // معالجة الصور بشكل متوازي لتسريع العملية
      const uploadPromises = [];

      for (const file of event.target.files) {
        uploadPromises.push(
          this.compressImage(file, 600, 0.7).then((compressed) => {
            this.additionalImages.push(compressed);
            this.generateImagePreview(compressed, (preview) => {
              this.additionalImagesPreview.push(preview);
            });
          })
        );
      }

      // انتظر جميع العمليات بشكل متوازي
      await Promise.all(uploadPromises);
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
  // Base validation for all property types
  const baseValid = (
    this.property.price > 0 &&
    this.property.areaSpace > 0
  );

  // If Land, only base validation is required
  if (this.property.propertyType === 'Land') {
    return baseValid;
  }

  // For other property types, validate all fields
  return (
    baseValid &&
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
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Validation Error',
        text: 'Please complete all required fields before proceeding',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: '#fff',
        color: '#2c3e50',
        iconColor: '#E2B43B',
        didOpen: (toast) => {
          toast.addEventListener('mouseenter', Swal.stopTimer);
          toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
      });
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
   * Submit form - Navigate to Success Page (محسّن للسرعة)
   */
  submit() {
    // Final validation
    if (!this.validateStep4()) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Missing Image',
        text: 'Please select a main image',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: '#fff',
        color: '#2c3e50',
        iconColor: '#E2B43B',
        didOpen: (toast) => {
          toast.addEventListener('mouseenter', Swal.stopTimer);
          toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
      });
      return;
    }

    // Mark all steps as completed
    for (let i = 1; i <= this.totalSteps; i++) {
      this.stepsCompleted.add(i);
    }

    this.isSubmitting = true;

    // Show loading alert
    Swal.fire({
      title: 'Adding Property',
      html: 'Please wait while we save your property...',
      allowOutsideClick: false,
      didOpen: async () => {
        Swal.showLoading();
      }
    });

    this.propertyService.create(this.property, this.mainImage, this.additionalImages).subscribe({
      next: (res: any) => {
        console.log('Property added successfully:', res);

        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: res?.message || 'Property added successfully!',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
          background: '#fff',
          color: '#2c3e50',
          iconColor: '#E2B43B',
          didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
          }
        });

        // الانتقال إلى صفحة النجاح بعد ثانيتين
        setTimeout(() => {
          this.router.navigate(['/ownerDashboard']);
        }, 2000);
      },
      error: (err) => {
        console.error('Add Property Error:', err);

        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Error',
          text: err?.error?.message || 'Something went wrong while adding the property',
          showConfirmButton: false,
          timer: 4000,
          timerProgressBar: true,
          background: '#fff',
          color: '#2c3e50',
          iconColor: '#E2B43B',
          didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
          }
        });

        this.isSubmitting = false;
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  /**
   * Get step title
   */
  getStepTitle(step: number): string {
    const titleKeys: { [key: number]: string } = {
      1: 'forms.add_property.step_titles.0',
      2: 'forms.add_property.step_titles.1',
      3: 'forms.add_property.step_titles.2',
      4: 'forms.add_property.step_titles.3',
    };
    const key = titleKeys[step];
    return key ? this.translate.instant(key) : '';
  }

  /**
   * Get step description
   */
  getStepDescription(step: number): string {
    const descriptionKeys: { [key: number]: string } = {
      1: 'forms.add_property.step_descriptions.0',
      2: 'forms.add_property.step_descriptions.1',
      3: 'forms.add_property.step_descriptions.2',
      4: 'forms.add_property.step_descriptions.3',
    };
    const key = descriptionKeys[step];
    return key ? this.translate.instant(key) : '';
  }
}
