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
  cities: any[] = [];
  areas: any[] = [];

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
    status: 'Pending',
  };

  mainImage!: File;
  additionalImages: File[] = [];
  isSubmitting = false;

  constructor(
    private propertyService: PropertyService,
    private locationService: LocationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCities();
  }

  loadCities() {
    this.locationService.getCities().subscribe({
      next: res => this.cities = res,
      error: err => console.error('Failed to load cities:', err),
    });
  }

  onCityChange() {
    if (!this.property.cityId || this.property.cityId === 0) {
      this.areas = [];
      this.property.areaId = 0;
      return;
    }

    this.locationService.getAreasByCity(this.property.cityId).subscribe({
      next: res => this.areas = res,
      error: err => console.error('Failed to load areas:', err),
    });
  }

  onMainImageChange(event: any) {
    this.mainImage = event.target.files[0];
  }

  onAdditionalImagesChange(event: any) {
    this.additionalImages = Array.from(event.target.files);
  }

  submit(form: NgForm) {
    if (form.invalid || !this.mainImage) {
      form.control.markAllAsTouched();
      alert('Please complete required fields');
      return;
    }

    this.isSubmitting = true;
    this.propertyService.create(this.property, this.mainImage, this.additionalImages).subscribe({
      next: () => {
        alert('Property added successfully');
        this.router.navigate(['/properties']);
      },
      error: err => {
        console.error(err);
        alert('Something went wrong');
        this.isSubmitting = false;
      },
    });
  }
}
