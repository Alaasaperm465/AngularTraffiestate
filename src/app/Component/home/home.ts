import { Component, HostListener, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface PropertyType {
  id: string;
  label: string;
  value: string;
}

interface BedsAndBaths {
  id: string;
  label: string;
  beds: number;
  baths: number;
}

interface FeaturedProperty {
  id: number;
  title: string;
  location: string;
  price: string;
  type: string;
  image: string;
  beds: number;
  baths: number;
  area: number;
  isFavorite: boolean;
}

interface NewProject {
  id: number;
  name: string;
  location: string;
  startingPrice: string;
  developer: string;
  image: string;
}

interface PopularArea {
  id: number;
  name: string;
  image: string;
  count: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class Home implements OnInit {
  searchForm: FormGroup;
  activeTab: string = 'buy';
  
  tabs = [
    { id: 'buy', label: 'Buy' },
    { id: 'rent', label: 'Rent' },
    { id: 'new-projects', label: 'New projects' },
    { id: 'commercial', label: 'Commercial' }
  ];

  propertyTypes: PropertyType[] = [
    { id: 'all', label: 'All Types', value: 'all' },
    { id: 'apartment', label: 'Apartment', value: 'apartment' },
    { id: 'villa', label: 'Villa', value: 'villa' },
    { id: 'townhouse', label: 'Townhouse', value: 'townhouse' },
    { id: 'penthouse', label: 'Penthouse', value: 'penthouse' },
    { id: 'compound', label: 'Compound', value: 'compound' }
  ];

  bedsAndBathsOptions: BedsAndBaths[] = [
    { id: 'any', label: 'Any', beds: 0, baths: 0 },
    { id: '1-1', label: '1 Bed, 1 Bath', beds: 1, baths: 1 },
    { id: '2-2', label: '2 Beds, 2 Baths', beds: 2, baths: 2 },
    { id: '3-2', label: '3 Beds, 2 Baths', beds: 3, baths: 2 },
    { id: '4-3', label: '4 Beds, 3 Baths', beds: 4, baths: 3 },
    { id: '5-4', label: '5+ Beds, 4+ Baths', beds: 5, baths: 4 }
  ];

  // بيانات العقارات المميزة
  featuredProperties: FeaturedProperty[] = [
    {
      id: 1,
      title: 'Modern Apartment in New Cairo',
      location: 'New Cairo, Cairo',
      price: 'EGP 3,500,000',
      type: 'Apartment',
      image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      beds: 3,
      baths: 2,
      area: 150,
      isFavorite: false
    },
    {
      id: 2,
      title: 'Luxury Villa in Sheikh Zayed',
      location: 'Sheikh Zayed City, Giza',
      price: 'EGP 8,000,000',
      type: 'Villa',
      image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      beds: 5,
      baths: 4,
      area: 350,
      isFavorite: true
    },
    {
      id: 3,
      title: 'Penthouse with Sea View',
      location: 'North Coast, Alexandria',
      price: 'EGP 12,000,000',
      type: 'Penthouse',
      image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      beds: 4,
      baths: 3,
      area: 280,
      isFavorite: false
    },
    {
      id: 4,
      title: 'Compound Townhouse',
      location: '6th of October, Giza',
      price: 'EGP 4,500,000',
      type: 'Townhouse',
      image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      beds: 3,
      baths: 2,
      area: 180,
      isFavorite: false
    }
  ];

  // بيانات المشاريع الجديدة
  newProjects: NewProject[] = [
    {
      id: 1,
      name: 'The Heights New Cairo',
      location: 'New Cairo, Cairo',
      startingPrice: 'EGP 2,800,000',
      developer: 'Emaar Misr',
      image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 2,
      name: 'Sodic West',
      location: 'West Cairo, Giza',
      startingPrice: 'EGP 3,200,000',
      developer: 'Sodic',
      image: 'https://images.unsplash.com/photo-1513584684374-8bab748fbf90?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 3,
      name: 'Mivida New Cairo',
      location: 'New Cairo, Cairo',
      startingPrice: 'EGP 4,500,000',
      developer: 'Emaar Misr',
      image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 4,
      name: 'Mountain View iCity',
      location: '6th of October, Giza',
      startingPrice: 'EGP 2,500,000',
      developer: 'Mountain View',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
    }
  ];

  // بيانات المناطق الشهيرة
  popularAreas: PopularArea[] = [
    {
      id: 1,
      name: 'New Cairo',
      image: 'https://images.unsplash.com/photo-1564501049418-3c27787d01e8?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      count: 1250
    },
    {
      id: 2,
      name: '6th of October',
      image: 'https://images.unsplash.com/photo-1558036117-15e82a2c9a9a?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      count: 980
    },
    {
      id: 3,
      name: 'North Coast',
      image: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      count: 750
    },
    {
      id: 4,
      name: 'Sheikh Zayed',
      image: 'https://images.unsplash.com/photo-1513584684374-8bab748fbf90?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      count: 650
    },
    {
      id: 5,
      name: 'Maadi',
      image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      count: 520
    },
    {
      id: 6,
      name: 'El Rehab',
      image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      count: 480
    }
  ];

  showPropertyTypeDropdown = false;
  showBedsAndBathsDropdown = false;
  isScrolled = false;

  constructor(private fb: FormBuilder) {
    this.searchForm = this.fb.group({
      searchQuery: ['', Validators.required],
      propertyType: ['all'],
      beds: [0],
      baths: [0]
    });
  }

  ngOnInit(): void {
    // يمكنك إضافة أي تهيئة إضافية هنا
  }

  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
  }

  togglePropertyTypeDropdown(): void {
    this.showPropertyTypeDropdown = !this.showPropertyTypeDropdown;
    if (this.showPropertyTypeDropdown) {
      this.showBedsAndBathsDropdown = false;
    }
  }

  toggleBedsAndBathsDropdown(): void {
    this.showBedsAndBathsDropdown = !this.showBedsAndBathsDropdown;
    if (this.showBedsAndBathsDropdown) {
      this.showPropertyTypeDropdown = false;
    }
  }

  selectPropertyType(type: PropertyType): void {
    this.searchForm.patchValue({ propertyType: type.value });
    this.showPropertyTypeDropdown = false;
  }

  selectBedsAndBaths(option: BedsAndBaths): void {
    this.searchForm.patchValue({ 
      beds: option.beds,
      baths: option.baths
    });
    this.showBedsAndBathsDropdown = false;
  }

  getSelectedPropertyTypeLabel(): string {
    const selected = this.propertyTypes.find(
      type => type.value === this.searchForm.get('propertyType')?.value
    );
    return selected ? selected.label : 'Property type';
  }

  getSelectedBedsAndBathsLabel(): string {
    const beds = this.searchForm.get('beds')?.value;
    const baths = this.searchForm.get('baths')?.value;
    
    if (beds === 0 && baths === 0) {
      return 'Beds & Baths';
    }
    
    return `${beds} Beds, ${baths} Baths`;
  }

  onSearch(): void {
    if (this.searchForm.valid) {
      const searchData = {
        ...this.searchForm.value,
        tab: this.activeTab
      };
      console.log('Search data:', searchData);
      // يمكنك إضافة منطق البحث هنا
      // يمكنك إرسال حدث أو استدعاء خدمة
      alert(`Searching for: ${searchData.searchQuery} (${searchData.tab})`);
    }
  }

  onSearchInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    console.log('Search input:', input.value);
    // يمكنك إضافة منطق الإكمال التلقائي هنا
  }

  setQuickSearch(location: string): void {
    this.searchForm.patchValue({ searchQuery: location });
    console.log(`Quick search set to: ${location}`);
  }

  toggleFavorite(propertyId: number): void {
    const property = this.featuredProperties.find(p => p.id === propertyId);
    if (property) {
      property.isFavorite = !property.isFavorite;
      console.log(`Property ${propertyId} favorite status: ${property.isFavorite}`);
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.isScrolled = window.scrollY > 100;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    
    // إغلاق القوائم المنسدلة عند النقر خارجها
    if (!target.closest('.dropdown-wrapper')) {
      this.showPropertyTypeDropdown = false;
      this.showBedsAndBathsDropdown = false;
    }
  }

  // دالة للمساعدة في تحميل الصور بشكل أفضل
  trackById(index: number, item: any): number {
    return item.id;
  }

  // إضافة أي دوال إضافية قد تحتاجها
  browseProperties(): void {
    console.log('Browsing all properties...');
    // يمكنك إضافة التنقل هنا
  }

  contactAgent(): void {
    console.log('Contacting agent...');
    // يمكنك إضافة منطق الاتصال بالوكيل هنا
  }
}