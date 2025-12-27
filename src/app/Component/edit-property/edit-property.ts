import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { PropertyService } from '../../Services/property';
import { LocationService } from '../../Services/location';
import { ICreatePropertyDto } from '../../models/icreate-property-dto';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-edit-property',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './edit-property.html',
  styleUrl: './edit-property.css',
})
export class EditPropertyComponent implements OnInit {
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
  mainImageUrl: string | null = null; // الصورة الحالية
  additionalImages: File[] = [];
  additionalImagesPreview: (string | null)[] = [];
  additionalImagesUrls: string[] = []; // الصور الإضافية الحالية
  isSubmitting = false;

  // Form tracking
  showValidationErrors = false;
  imagesCompressionInProgress = false;
  isLoading = false;

  // ID العقار
  propertyId!: number;

  constructor(
    private propertyService: PropertyService,
    private locationService: LocationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadPropertyId();
    this.loadCities();
  }

  /**
   * تحميل معرف العقار من الـ URL
   */
  loadPropertyId(): void {
    this.route.queryParams.subscribe((params) => {
      this.propertyId = +params['id'];
      if (this.propertyId) {
        this.loadPropertyData();
      }
    });
  }

  /**
   * تحميل بيانات العقار الحالية
   */
  loadPropertyData(): void {
    this.isLoading = true;
    console.log('Loading property with ID:', this.propertyId);

    // Use the correct endpoint: GET /api/PropertyOwner/{id}
    this.propertyService.getPropertyById(this.propertyId).subscribe({
      next: (data: any) => {
        this.populatePropertyData(data);
      },
      error: (err) => {
        console.error('Failed to load property:', err);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Error',
          text: 'Failed to load property. Please check the property ID.',
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
        this.isLoading = false;
        this.router.navigate(['/ownerDashboard']);
      },
    });
  }

  /**
   * Populate property data from API response
   */
  private populatePropertyData(data: any): void {
    console.log('Property data received:', data);

    this.property = {
      title: data.title || '',
      description: data.description || '',
      price: data.price || 0,
      areaSpace: data.areaSpace || 0,
      location: data.location || '',
      cityId: data.cityId || 0,
      areaId: data.areaId || 0,
      rooms: data.rooms || 0,
      bathrooms: data.bathrooms || 0,
      finishingLevel: data.finishingLevel || '',
      propertyType: data.propertyType || '',
      purpose: data.purpose || '',
      status: data.status || 0,
    };

    // Handle image from API response (ImageUrl property)
    if (data.imageUrl) {
      this.mainImageUrl = data.imageUrl;
    }

    // Handle additional images from API (AdditionalImages property)
    if (data.additionalImages) {
      if (typeof data.additionalImages === 'string') {
        // If it's comma-separated string
        this.additionalImagesUrls = data.additionalImages.split(',').filter((img: string) => img.trim());
      } else if (Array.isArray(data.additionalImages)) {
        // If it's already an array
        this.additionalImagesUrls = data.additionalImages;
      }
    }

    // Load areas for the selected city
    if (this.property.cityId > 0) {
      this.loadAreas(this.property.cityId);
    }

    this.isLoading = false;
  }

  /**
   * Load cities
   */
  loadCities(): void {
    this.locationService.getCities().subscribe({
      next: (res) => (this.cities = res),
      error: (err) => console.error('Failed to load cities:', err),
    });
  }

  /**
   * Load areas
   */
  loadAreas(cityId: number): void {
    if (!cityId || cityId === 0) {
      this.areas = [];
      this.property.areaId = 0;
      return;
    }

    this.locationService.getAreasByCity(cityId).subscribe({
      next: (res) => (this.areas = res),
      error: (err) => console.error('Failed to load areas:', err),
    });
  }

  /**
   * Load areas when city changes
   */
  onCityChange(): void {
    this.loadAreas(this.property.cityId);
  }

  /**
   * Handle property type change
   */
  onPropertyTypeChange(): void {
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
  async onMainImageChange(event: any): Promise<void> {
    if (event.target.files && event.target.files.length > 0) {
      const originalFile = event.target.files[0];
      this.mainImage = await this.compressImage(originalFile, 800, 0.75);
      this.generateImagePreview(this.mainImage, (preview) => {
        this.mainImagePreview = preview;
      });
    }
  }

  /**
   * معالجة الصور الإضافية مع ضغط محسّن
   */
  async onAdditionalImagesChange(event: any): Promise<void> {
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

      // انتظر جميع العمليات
      await Promise.all(uploadPromises);
    }
  }

  /**
   * Generate image preview
   */
  private generateImagePreview(
    file: File,
    callback: (preview: string) => void
  ): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      callback(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  /**
   * Remove main image
   */
  removeMainImage(): void {
    this.mainImage = null!;
    this.mainImagePreview = null;
    // إذا كنا نحذف الصورة الحالية
    if (this.mainImageUrl) {
      this.mainImageUrl = null;
    }
  }

  /**
   * Remove additional image
   */
  removeAdditionalImage(index: number): void {
    // إذا كان index من الصور الجديدة
    if (index < this.additionalImagesPreview.length) {
      this.additionalImages.splice(index, 1);
      this.additionalImagesPreview.splice(index, 1);
    } else {
      // إذا كان من الصور الموجودة
      const urlIndex = index - this.additionalImagesPreview.length;
      this.additionalImagesUrls.splice(urlIndex, 1);
    }
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
   * Validate Step 4 - Images (optional for edit)
   */
  validateStep4(): boolean {
    return true; // الصور اختيارية في التحديث
  }

  /**
   * Go to next step
   */
  nextStep(): void {
    this.showValidationErrors = false;

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

    this.stepsCompleted.add(this.currentStep);

    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.showValidationErrors = false;
      window.scrollTo(0, 0);
    }
  }

  /**
   * Go to previous step
   */
  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.showValidationErrors = false;
      window.scrollTo(0, 0);
    }
  }

  /**
   * Go to specific step
   */
  goToStep(step: number): void {
    if (
      step < this.currentStep ||
      step === this.currentStep + 1 ||
      this.stepsCompleted.has(step - 1)
    ) {
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
   * Submit form - Update Property
   */
  submit(): void {
    // Validate all steps
    if (!this.validateStep1() || !this.validateStep2() || !this.validateStep3()) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Validation Error',
        text: 'Please complete all required fields',
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

    this.isSubmitting = true;

    // Show loading alert
    Swal.fire({
      title: 'Updating Property',
      html: 'Please wait while we save your changes...',
      allowOutsideClick: false,
      didOpen: async () => {
        Swal.showLoading();
      }
    });

    // Call service with property data and optional images
    this.propertyService
      .update(
        this.propertyId,
        this.property,
        this.mainImage || undefined,
        this.additionalImages.length > 0 ? this.additionalImages : undefined
      )
      .subscribe({
        next: (res: any) => {
          console.log('Property updated successfully:', res);

          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Property Updated',
            text: res?.message || 'Property updated successfully',
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

          // Fast redirect
          setTimeout(() => {
            this.router.navigate(['/ownerDashboard']);
          }, 2000);
        },
        error: (err) => {
          console.error('Update error:', err);
          this.isSubmitting = false;

          const errorMessage = err?.error?.message ||
                              err?.error?.detail ||
                              'Error updating property';

          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: 'Error',
            text: errorMessage,
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
