import { Component, HostListener, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IProperty ,phone,Call,email} from '../../models/iproperty';
import { HttpClient } from '@angular/common/http';
import { PropertyService } from '../../Services/PropertyService/property';
import { RouterLink } from '@angular/router';


@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
  imports: [CommonModule, ReactiveFormsModule,RouterLink],


})
export class Home implements OnInit {
  searchForm: FormGroup;
  activeTab: string = 'buy';
  properties: IProperty[] = [];
  showPropertyTypeDropdown = false;
  showBedsAndBathsDropdown = false;
  isScrolled = false;
  phone=phone;

  email=email;

  constructor(private fb: FormBuilder, private http: HttpClient) {
   this.searchForm = this.fb.group({
  title: [''],
  minPrice: [''],
  maxPrice: [''],
  city: [''],
  area: ['']

});



  }

  ngOnInit(): void {
    // جلب العقارات من الخدمة
    const propertyService = new PropertyService(this.http);
    propertyService.getAllProperties().subscribe((data: IProperty[]) => {
      this.properties = data;
    });
  }

  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
  }

  togglePropertyTypeDropdown(): void {
    this.showPropertyTypeDropdown = !this.showPropertyTypeDropdown;
    if (this.showPropertyTypeDropdown) this.showBedsAndBathsDropdown = false;
  }

  toggleBedsAndBathsDropdown(): void {
    this.showBedsAndBathsDropdown = !this.showBedsAndBathsDropdown;
    if (this.showBedsAndBathsDropdown) this.showPropertyTypeDropdown = false;
  }

  onSearch(): void {
    if (this.searchForm.valid) {
      const searchData = { ...this.searchForm.value, tab: this.activeTab };
      console.log('Search data:', searchData);
      alert(`Searching for: ${searchData.searchQuery} (${searchData.tab})`);
    }
  }

  toggleFavorite(propertyId: number): void {
    const property = this.properties.find(p => p.id === propertyId);
    if (property) property.isFavorite = !property.isFavorite;
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.isScrolled = window.scrollY > 100;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-wrapper')) {
      this.showPropertyTypeDropdown = false;
      this.showBedsAndBathsDropdown = false;
    }
  }

  trackById(index: number, item: IProperty): number {
    return item.id;
  }
  setQuickSearch(value: string): void {
  // نملأ السيرش تلقائي
  this.searchForm.patchValue({
    city: value
  });

  // اختياري: تشغلي السيرش مباشرة
  this.onSearch();
}

}

