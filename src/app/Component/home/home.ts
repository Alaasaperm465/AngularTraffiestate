import { Component, HostListener, OnInit, OnDestroy, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IProperty, phone, email } from '../../models/iproperty';
import { HttpClient } from '@angular/common/http';
import { PropertyService } from '../../Services/PropertyService/property';
import { FavoriteService } from '../../Services/favorite-service';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageSwitcherComponent } from '../switcher/switcher';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    RouterModule,
    TranslateModule,
    LanguageSwitcherComponent
  ],
})
export class Home implements OnInit, OnDestroy {
  // ✅ Inject services using Angular 21 style
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private favoriteService = inject(FavoriteService);
  private propertyService = inject(PropertyService);

  // Form
  searchForm: FormGroup;
  
  // State
  activeTab: string = '';
  properties: IProperty[] = [];
  allProperties: IProperty[] = [];
  displayedProperties: IProperty[] = [];
  showPropertyTypeDropdown = false;
  showBedsAndBathsDropdown = false;
  isScrolled = false;
  phone = phone;
  email = email;
  favoritesIds: number[] = [];
  searching: boolean = false;

  // Filters
  selectedPropertyTypes: Set<string> = new Set();
  selectedBedrooms: Set<string> = new Set();
  selectedAreas: Set<string> = new Set();
  selectedSort: string = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;

  // Pagination
  itemsPerLoad: number = 8;
  currentLoadedCount: number = 8;

  // Event listener cleanup
  private loadAllPropertiesListener: any;

  constructor() {
    this.searchForm = this.fb.group({
      city: [''],
      propertyType: [''],
      rooms: ['']
    });
    
    console.log('🏠 Home component constructor initialized');
  }

  ngOnInit(): void {
    console.log('🚀 Home component ngOnInit called');
    console.log('📍 Current location:', window.location.href);

    // Load data
    this.loadAllProperties();
    this.loadFavorites();

    // Event listener for property refresh
    this.loadAllPropertiesListener = () => {
      console.log('📢 loadAllProperties event received, refreshing...');
      this.loadAllProperties();
    };
    window.addEventListener('loadAllProperties', this.loadAllPropertiesListener);
  }

  ngOnDestroy(): void {
    if (this.loadAllPropertiesListener) {
      window.removeEventListener('loadAllProperties', this.loadAllPropertiesListener);
    }
    console.log('🧹 Home component destroyed, listeners cleaned up');
  }

  loadFavorites(): void {
    this.favoriteService.getMyFavorites().subscribe({
      next: (res: any) => {
        const items = res?.value?.items ?? res?.items ?? [];
        this.favoritesIds = items.map((f: any) => f.propertyId);
        console.log('❤️ Favorites loaded:', this.favoritesIds.length);
      },
      error: (err) => {
        console.error('❌ Error loading favorites:', err);
        this.favoritesIds = [];
      }
    });
  }

  loadAllProperties(): void {
    console.log('📡 Fetching properties from API...');
    
    this.propertyService.getAllProperties().subscribe({
      next: (data: IProperty[]) => {
        console.log('✅ Properties loaded successfully');
        console.log('📊 Total properties:', data.length);

        if (data.length > 0) {
          console.log('🔍 Sample property:', data[0]);
          console.log('🏷️ Available purposes:', [...new Set(data.map(p => p.purpose))]);
          console.log('🌍 Available cities:', [...new Set(data.map(p => p.city))]);
          console.log('🏠 Available types:', [...new Set(data.map(p => p.propertyType))]);
        }

        this.allProperties = data;
        this.properties = [...data];
        this.activeTab = '';
        this.currentLoadedCount = 8;
        this.updateDisplayedProperties();

        console.log('✅ Displaying:', this.displayedProperties.length, 'properties');
      },
      error: (err) => {
        console.error('❌ Error loading properties:', err);
      }
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    console.log('🔄 Tab changed to:', tab || 'All');
    this.applyAllFilters();
  }

  onSearch(): void {
    console.log('🔍 Search submitted');
    this.applyAllFilters();
  }

  resetSearch(): void {
    console.log('🔄 Resetting all filters and search...');

    this.selectedPropertyTypes.clear();
    this.selectedBedrooms.clear();
    this.selectedAreas.clear();
    this.selectedSort = '';
    this.minPrice = null;
    this.maxPrice = null;
    this.activeTab = '';

    this.searchForm.reset();

    document.querySelectorAll('.filter-options input').forEach((input: any) => {
      input.checked = false;
    });

    const minEl = document.querySelector('.price-input[placeholder*="Min"]') as HTMLInputElement;
    const maxEl = document.querySelector('.price-input[placeholder*="Max"]') as HTMLInputElement;
    if (minEl) minEl.value = '';
    if (maxEl) maxEl.value = '';

    this.properties = [...this.allProperties];
    this.currentLoadedCount = 8;
    this.updateDisplayedProperties();

    console.log('✅ Reset complete, showing all', this.properties.length, 'properties');
  }

  private applyAllFilters(): void {
    console.log('🔧 ====== Applying Filters ======');

    let filtered = [...this.allProperties];
    const searchData = this.searchForm.value;

    // Tab filter (Buy/Rent/All)
    if (this.activeTab && this.activeTab.trim()) {
      filtered = filtered.filter(p => {
        const purpose = (p.purpose || '').toLowerCase().trim();
        const tab = this.activeTab.toLowerCase().trim();
        return purpose === tab;
      });
      console.log(`📌 Tab filter (${this.activeTab}): ${filtered.length} properties`);
    }

    // City search
    if (searchData.city && searchData.city.trim()) {
      const citySearch = searchData.city.toLowerCase().trim();
      filtered = filtered.filter(p => {
        const city = (p.city || '').toLowerCase().trim();
        const area = (p.area || '').toLowerCase().trim();
        return city.includes(citySearch) || area.includes(citySearch);
      });
      console.log(`🌍 City filter (${searchData.city}): ${filtered.length} properties`);
    }

    // Property type from search
    if (searchData.propertyType && searchData.propertyType.trim()) {
      const typeSearch = searchData.propertyType.toLowerCase().trim();
      filtered = filtered.filter(p => {
        const propertyType = (p.propertyType || '').toLowerCase().trim();
        return propertyType === typeSearch;
      });
      console.log(`🏠 Type filter (${searchData.propertyType}): ${filtered.length} properties`);
    }

    // Rooms from search
    if (searchData.rooms && searchData.rooms.trim()) {
      const roomsValue = parseInt(searchData.rooms, 10);
      filtered = filtered.filter(p => {
        if (searchData.rooms === '4') {
          return (p.rooms || 0) >= 4;
        }
        return p.rooms === roomsValue;
      });
      console.log(`🛏️ Rooms filter (${searchData.rooms}): ${filtered.length} properties`);
    }

    // Sidebar property type filter
    if (this.selectedPropertyTypes.size > 0) {
      filtered = filtered.filter(p => {
        const propertyType = (p.propertyType || '').toLowerCase().trim();
        return this.selectedPropertyTypes.has(propertyType);
      });
      console.log(`🏘️ Sidebar type filter: ${filtered.length} properties`);
    }

    // Bedrooms filter
    if (this.selectedBedrooms.size > 0) {
      filtered = filtered.filter(p => {
        const rooms = (p.rooms || 0).toString();
        const has4Plus = this.selectedBedrooms.has('4plus') && (p.rooms || 0) >= 4;
        const hasExactMatch = this.selectedBedrooms.has(rooms);
        return has4Plus || hasExactMatch;
      });
      console.log(`🛏️ Bedrooms sidebar filter: ${filtered.length} properties`);
    }

    // Area filter
    if (this.selectedAreas.size > 0) {
      filtered = filtered.filter(p => {
        const area = Number(p.areaSpace) || 0;
        for (const areaRange of this.selectedAreas) {
          if (areaRange === 'under100' && area < 100) return true;
          if (areaRange === '100-200' && area >= 100 && area < 200) return true;
          if (areaRange === '200-300' && area >= 200 && area < 300) return true;
          if (areaRange === '300plus' && area >= 300) return true;
        }
        return false;
      });
      console.log(`📐 Area filter: ${filtered.length} properties`);
    }

    // Price filters
    if (this.minPrice !== null && this.minPrice > 0) {
      filtered = filtered.filter(p => (p.price || 0) >= this.minPrice!);
      console.log(`💰 Min price (${this.minPrice}): ${filtered.length} properties`);
    }
    if (this.maxPrice !== null && this.maxPrice > 0) {
      filtered = filtered.filter(p => (p.price || 0) <= this.maxPrice!);
      console.log(`💰 Max price (${this.maxPrice}): ${filtered.length} properties`);
    }

    // Sort
    if (this.selectedSort) {
      filtered.sort((a, b) => {
        switch (this.selectedSort) {
          case 'price-low':
            return (a.price || 0) - (b.price || 0);
          case 'price-high':
            return (b.price || 0) - (a.price || 0);
          case 'newest':
            return (b.id || 0) - (a.id || 0);
          case 'popular':
            return (b.views || 0) - (a.views || 0);
          default:
            return 0;
        }
      });
      console.log(`🔢 Sorted by: ${this.selectedSort}`);
    }

    this.properties = filtered;
    this.currentLoadedCount = 8;
    this.updateDisplayedProperties();

    console.log(`✅ Final result: ${this.properties.length} properties`);
    console.log('🔧 ====== Filter Complete ======');
  }

  private updateDisplayedProperties(): void {
    this.displayedProperties = this.properties.slice(0, this.currentLoadedCount);
    console.log(`📄 Displaying ${this.displayedProperties.length} of ${this.properties.length} properties`);
  }

  loadMore(): void {
    this.currentLoadedCount += this.itemsPerLoad;
    this.updateDisplayedProperties();
    console.log(`➕ Loading more... Now showing ${this.currentLoadedCount} items`);
  }

  hasMoreToLoad(): boolean {
    return this.currentLoadedCount < this.properties.length;
  }

  onFilterChange(event: any): void {
    const target = event.target as HTMLInputElement;
    const value = target.value;

    if (target.type === 'checkbox') {
      let filterSet: Set<string>;

      if (['1', '2', '3', '4plus'].includes(value)) {
        filterSet = this.selectedBedrooms;
      } else {
        filterSet = this.selectedAreas;
      }

      if (target.checked) {
        filterSet.add(value);
      } else {
        filterSet.delete(value);
      }
    } else if (target.type === 'radio' && target.name === 'sort') {
      this.selectedSort = target.checked ? value : '';
    }

    this.applyAllFilters();
  }

  onPropertyTypeChange(event: any): void {
    const target = event.target as HTMLInputElement;
    const value = target.value.toLowerCase();

    if (target.checked) {
      this.selectedPropertyTypes.add(value);
    } else {
      this.selectedPropertyTypes.delete(value);
    }

    this.applyAllFilters();
  }

  onPriceFilterChange(): void {
    const minEl = document.querySelector('.price-input[placeholder*="Min"]') as HTMLInputElement;
    const maxEl = document.querySelector('.price-input[placeholder*="Max"]') as HTMLInputElement;

    this.minPrice = minEl?.value ? parseInt(minEl.value, 10) : null;
    this.maxPrice = maxEl?.value ? parseInt(maxEl.value, 10) : null;

    this.applyAllFilters();
  }

  clearAllFilters(): void {
    console.log('🧹 Clearing all filters...');
    this.resetSearch();
  }

  togglePropertyTypeDropdown(event?: Event): void {
    if (event) event.stopPropagation();
    this.showPropertyTypeDropdown = !this.showPropertyTypeDropdown;
    if (this.showPropertyTypeDropdown) {
      this.showBedsAndBathsDropdown = false;
    }
  }

  toggleBedsAndBathsDropdown(event?: Event): void {
    if (event) event.stopPropagation();
    this.showBedsAndBathsDropdown = !this.showBedsAndBathsDropdown;
    if (this.showBedsAndBathsDropdown) {
      this.showPropertyTypeDropdown = false;
    }
  }

  toggleFavorite(propertyId: number): void {
    if (this.favoritesIds.includes(propertyId)) {
      this.favoriteService.removeFromFavorites(propertyId).subscribe({
        next: () => {
          this.favoritesIds = this.favoritesIds.filter(id => id !== propertyId);
          console.log('💔 Removed from favorites:', propertyId);
        },
        error: (err) => console.error('❌ Error removing favorite:', err)
      });
    } else {
      this.favoriteService.addToFavorites(propertyId).subscribe({
        next: () => {
          this.favoritesIds.push(propertyId);
          console.log('❤️ Added to favorites:', propertyId);
        },
        error: (err) => console.error('❌ Error adding favorite:', err)
      });
    }
  }

  isFavorite(propertyId: number): boolean {
    return this.favoritesIds.includes(propertyId);
  }

  setQuickSearch(city: string): void {
    console.log('🔍 Quick search:', city);
    this.searchForm.patchValue({ city: city });
    this.applyAllFilters();
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

  getWhatsAppLink(phoneNumber: string): string {
    let cleanPhone = phoneNumber.replace(/\D/g, '');

    if (cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.substring(1);
    }

    if (!cleanPhone.startsWith('20')) {
      cleanPhone = '20' + cleanPhone;
    }

    return `https://wa.me/${cleanPhone}`;
  }
}