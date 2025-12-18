import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { IProperty } from '../models/iproperty';
import { HttpClient } from '@angular/common/http';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

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

  constructor(
    private http: HttpClient,
    private fb: FormBuilder
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
  }

  onSubmit() {
    if (this.propertyForm.valid) {
      const formData = this.propertyForm.value;
      
      if (this.editingProperty()) {
        const id = this.editingProperty()!['id'];
        this.http.put(`/api/PropertyOwner/${id}`, formData)
          .subscribe({
            next: () => {
              this.loadAllProperties();
              this.loadForSaleProperties();
              this.loadForRentProperties();
              this.cancelForm();
            },
            error: (err: any) => console.error('Error updating property:', err)
          });
      } else {
        this.http.post('/api/PropertyOwner', formData)
          .subscribe({
            next: () => {
              this.loadAllProperties();
              this.loadForSaleProperties();
              this.loadForRentProperties();
              this.cancelForm();
            },
            error: (err: any) => console.error('Error creating property:', err)
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
}