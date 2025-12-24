import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { IProperty } from '../models/iproperty';
import { HttpClient } from '@angular/common/http';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { PropertyOwnerService } from '../Services/propertyOwner';
import { FavoriteService } from '../Services/favorite-service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-owner-propertycomp',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './owner-propertycomp.html',
  styleUrl: './owner-propertycomp.css',
})
export class OwnerPropertycomp {
  allProperties = signal<IProperty[]>([]);
  forSaleProperties = signal<IProperty[]>([]);
  forRentProperties = signal<IProperty[]>([]);
  activeTab = signal<'all' | 'sale' | 'rent'>('all');
  showAddForm = signal(false);
  editingProperty = signal<IProperty | null>(null);
  
  propertyTypes = ['sale', 'rent'];
  propertyPurposes = ['Residential', 'Commercial', 'Industrial', 'Land'];

  propertyForm: FormGroup;

  // File inputs and submission state
  mainImage: File | null = null;
  additionalImages: File[] = [];
  isSubmitting = false;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private ownerService: PropertyOwnerService,
    private favoriteService: FavoriteService,
    private cd: ChangeDetectorRef
  ) {
    this.propertyForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      location: ['', Validators.required],
      city: [''],
      area: [''],
      pathRoomCount: ['', Validators.required],
      RoomsCount: ['', Validators.required],
      FinishLevel: ['', Validators.required],
      purpos: ['', Validators.required],
      type: ['', Validators.required],
      imageUrl: [''],
      status: ['Available', Validators.required],
      sellerId: [1] // You might want to get this from auth service
    });
  }

  ngOnInit() {
    this.loadAllProperties();
    this.loadForSaleProperties();
    this.loadForRentProperties();
  }

  loadAllProperties() {
    this.http.get<IProperty[]>('/api/PropertyOwner/owner-properties')
      .subscribe({
        next: (data: any) => this.allProperties.set(data),
        error: (err: any) => console.error('Error loading properties:', err)
      });
  }

  loadForSaleProperties() {
    this.http.get<IProperty[]>('/api/PropertyOwner/ForSale')
      .subscribe({
        next: (data: any) => this.forSaleProperties.set(data),
        error: (err: any) => console.error('Error loading sale properties:', err)
      });
  }

  loadForRentProperties() {
    this.http.get<IProperty[]>('/api/PropertyOwner/ForRent')
      .subscribe({
        next: (data: any) => this.forRentProperties.set(data),
        error: (err: any) => console.error('Error loading rent properties:', err)
      });
  }

  setActiveTab(tab: 'all' | 'sale' | 'rent') {
    this.activeTab.set(tab);
  }

  getFilteredProperties(): IProperty[] {
    switch (this.activeTab()) {
      case 'sale':
        return this.forSaleProperties();
      case 'rent':
        return this.forRentProperties();
      default:
        return this.allProperties();
    }
  }

  toggleAddForm() {
    this.showAddForm.update((v: any) => !v);
    if (!this.showAddForm()) {
      this.propertyForm.reset();
    }
  }

  editProperty(property: IProperty) {
    this.editingProperty.set(property);
    this.showAddForm.set(true);
    this.propertyForm.patchValue(property);
  }

  cancelForm() {
    this.showAddForm.set(false);
    this.editingProperty.set(null);
    this.propertyForm.reset({ status: 'Available', sellerId: 1 });
    this.mainImage = null;
    this.additionalImages = [];
    this.isSubmitting = false;
  }

  onMainImageChange(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.mainImage = event.target.files[0];
    }
  }

  onAdditionalImagesChange(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.additionalImages = Array.from(event.target.files);
    }
  }

  onSubmit() {
    if (this.propertyForm.valid) {
      const form = this.propertyForm.value;
      this.isSubmitting = true;

      if (this.editingProperty()) {
        const id = this.editingProperty()!['id'];
        this.ownerService.updateProperty(id, form, this.mainImage || undefined, this.additionalImages.length ? this.additionalImages : undefined)
          .subscribe({
            next: () => {
              this.loadAllProperties();
              this.loadForSaleProperties();
              this.loadForRentProperties();
              this.cancelForm();
            },
            error: (err: any) => {
              console.error('Error updating property:', err);
              this.isSubmitting = false;
            }
          });
      } else {
        this.ownerService.addProperty(form, this.mainImage || undefined, this.additionalImages.length ? this.additionalImages : undefined)
          .subscribe({
            next: () => {
              this.loadAllProperties();
              this.loadForSaleProperties();
              this.loadForRentProperties();
              this.cancelForm();
            },
            error: (err: any) => {
              console.error('Error creating property:', err);
              this.isSubmitting = false;
            }
          });
      }
    }
  }

  deleteProperty(id: number) {
    if (confirm('Are you sure you want to delete this property?')) {
      this.http.delete(`/api/PropertyOwner/${id}`)
        .subscribe({
          next: () => {
            this.loadAllProperties();
            this.loadForSaleProperties();
            this.loadForRentProperties();
          },
          error: (err: any) => console.error('Error deleting property:', err)
        });
    }
  }

  toggleFavorite(property: any) {
    if (!property || !property.id) return;
    if (property.isFavorite) {
      this.favoriteService.removeFromFavorites(property.id).subscribe({
        next: () => {
          property.isFavorite = false;
          this.cd.detectChanges();
        },
        error: (err) => console.error('Error removing favorite', err)
      });
    } else {
      this.favoriteService.addToFavorites(property.id).subscribe({
        next: () => {
          property.isFavorite = true;
          this.cd.detectChanges();
        },
        error: (err) => console.error('Error adding favorite', err)
      });
    }
  }
}