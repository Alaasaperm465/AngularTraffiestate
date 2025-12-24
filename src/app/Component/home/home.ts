import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IProperty, phone, email } from '../../models/iproperty';
import { HttpClient } from '@angular/common/http';
import { PropertyService } from '../../Services/PropertyService/property';
import { FavoriteService } from '../../Services/favorite-service';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
})
export class Home implements OnInit, OnDestroy {
  searchForm: FormGroup;
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

  selectedPropertyTypes: Set<string> = new Set();
  selectedBedrooms: Set<string> = new Set();
  selectedAreas: Set<string> = new Set();
  selectedSort: string = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;

  // See More functionality
  itemsPerLoad: number = 8;
  currentLoadedCount: number = 5;

  // Event listeners for cleanup
  private loadAllPropertiesListener: any;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private favoriteService: FavoriteService,
    private propertyService: PropertyService
  ) {
    this.searchForm = this.fb.group({
      city: [''],
      propertyType: [''],
      rooms: ['']
    });
  }

  ngOnInit(): void {
    console.log('🚀 Home component initialized');

    this.loadAllProperties();

    // Load favorites in parallel
    this.loadFavorites();

    // Listen for loadAllProperties event from navbar with proper cleanup reference
    this.loadAllPropertiesListener = () => {
      console.log('📢 loadAllProperties event received, refreshing properties');
      this.loadAllProperties();
    };
    window.addEventListener('loadAllProperties', this.loadAllPropertiesListener);
  }

  loadFavorites(): void {
    this.favoriteService.getMyFavorites().subscribe({
      next: (res: any) => {
        const items = res?.value?.items ?? res?.items ?? [];
        this.favoritesIds = items.map((f: any) => f.propertyId);
        console.log('❤️ Favorites loaded:', this.favoritesIds.length, 'favorites');
      },
      error: (err) => {
        console.error('Error loading favorites:', err);
        // Don't fail silently - continue with empty favorites
        this.favoritesIds = [];
      }
    });
  }

  loadAllProperties(): void {
    this.propertyService.getAllProperties().subscribe({
      next: (data: IProperty[]) => {
        console.log('📊 API Response received');
        console.log('Properties loaded:', data);
        console.log('📈 Total properties loaded:', data.length);

        if (data.length > 0) {
          console.log('🔍 Sample property:', data[0]);
          console.log('Available purposes:', [...new Set(data.map(p => p.purpose))]);
          console.log('🌍 Available cities:', [...new Set(data.map(p => p.city))]);
          console.log('Available types:', [...new Set(data.map(p => p.propertyType))]);
        }

        this.allProperties = data;
        this.properties = [...data];
        this.updateDisplayedProperties();
        this.activeTab = ''; // Reset active tab to show all

        console.log('✅ All properties displayed:', this.properties.length);
      },
      error: (err) => {
        console.error('❌ Error loading properties:', err);
      }
    });
  }

  ngOnDestroy(): void {
    // Cleanup event listener
    if (this.loadAllPropertiesListener) {
      window.removeEventListener('loadAllProperties', this.loadAllPropertiesListener);
    }
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    console.log('🔄 Active tab changed to:', tab);
    this.applyAllFilters();
  }

  onSearch(): void {
    console.log('🔍 Search icon clicked - Resetting to show all properties');

    if (this.searchForm.value.city && this.searchForm.value.city.trim() !== ''
      || (this.searchForm.value.propertyType && this.searchForm.value.propertyType.trim() !== '')
      || (this.searchForm.value.rooms && this.searchForm.value.rooms.trim() !== '')
      || this.activeTab) {
      this.searching = true;

      this.properties = this.properties.filter(p => p.city?.toLowerCase()
        .includes(this.searchForm.value.city.toLowerCase()));

      if (this.searchForm.value.propertyType && this.searchForm.value.propertyType.trim() !== '') {
        this.properties = this.properties.filter(p => p.propertyType?.toLowerCase()
          .includes(this.searchForm.value.propertyType.toLowerCase()));
      }
      if (this.searchForm.value.rooms && this.searchForm.value.rooms.trim() !== '') {
        const roomsValue = parseInt(this.searchForm.value.rooms, 10);
        this.properties = this.properties.filter(p => p.rooms === roomsValue);
      }
    }
    else {
      this.searching = false;
      this.resetSearch();
    }
  }

  resetSearch(): void {
    console.log('🔄 Resetting search...');

    this.selectedPropertyTypes.clear();
    this.selectedBedrooms.clear();
    this.selectedAreas.clear();
    this.selectedSort = '';
    this.minPrice = null;
    this.maxPrice = null;

    document.querySelectorAll('.filter-options input').forEach((input: any) => {
      input.checked = false;
    });

    const minEl = document.querySelector('.price-input[placeholder="Min"]') as HTMLInputElement;
    const maxEl = document.querySelector('.price-input[placeholder="Max"]') as HTMLInputElement;
    if (minEl) minEl.value = '';
    if (maxEl) maxEl.value = '';

    this.properties = [...this.allProperties];
    this.currentLoadedCount = 8;
    this.updateDisplayedProperties();

    console.log('Search reset, showing all properties:', this.properties.length);
  }

  private applyAllFilters(): void {
    console.log('🔧 ====== Applying All Filters ======');

    let filtered = [...this.allProperties];
    console.log(`📊 Starting with ${filtered.length} properties`);

    const searchData = this.searchForm.value;
    console.log('🔍 Search form values:', searchData);
    console.log('Active tab:', this.activeTab);

    if (this.activeTab && this.activeTab.trim()) {
      const beforeCount = filtered.length;
      filtered = filtered.filter(p => {
        const purpose = (p.purpose || '').toLowerCase().trim();
        const tab = this.activeTab.toLowerCase().trim();
        return purpose === tab;
      });
      console.log(`Tab filter (${this.activeTab}): ${beforeCount} → ${filtered.length} properties`);

      if (filtered.length === 0 && beforeCount > 0) {
        console.warn('⚠️ No properties match the tab filter. Available purposes:',
          [...new Set(this.allProperties.map(p => p.purpose))]);
      }
    }

    if (searchData.city && searchData.city.trim()) {
      const beforeCount = filtered.length;
      const citySearch = searchData.city.toLowerCase().trim();
      filtered = filtered.filter(p => {
        const city = (p.city || '').toLowerCase().trim();
        const area = (p.area || '').toLowerCase().trim();
        return city.includes(citySearch) || area.includes(citySearch);
      });
      console.log(`City filter (${searchData.city}): ${beforeCount} → ${filtered.length} properties`);
    }

    if (searchData.propertyType && searchData.propertyType.trim()) {
      const beforeCount = filtered.length;
      const typeSearch = searchData.propertyType.toLowerCase().trim();
      filtered = filtered.filter(p => {
        const propertyType = (p.propertyType || '').toLowerCase().trim();
        return propertyType === typeSearch;
      });
      console.log(`🏠 Property type filter (${searchData.propertyType}): ${beforeCount} → ${filtered.length} properties`);
    }

    if (searchData.rooms && searchData.rooms.trim()) {
      const beforeCount = filtered.length;
      const roomsValue = parseInt(searchData.rooms, 10);
      filtered = filtered.filter(p => {
        if (searchData.rooms === '4') {
          return (p.rooms || 0) >= 4;
        }
        return p.rooms === roomsValue;
      });
      console.log(`Rooms filter (${searchData.rooms}): ${beforeCount} → ${filtered.length} properties`);
    }

    if (this.selectedPropertyTypes.size > 0) {
      const beforeCount = filtered.length;
      filtered = filtered.filter(p => {
        const propertyType = (p.propertyType || '').toLowerCase().trim();
        return this.selectedPropertyTypes.has(propertyType);
      });
      console.log(`🏘️ Sidebar property type filter: ${beforeCount} → ${filtered.length} properties`);
    }

    if (this.selectedBedrooms.size > 0) {
      const beforeCount = filtered.length;
      filtered = filtered.filter(p => {
        const rooms = (p.rooms || 0).toString();
        const has4Plus = this.selectedBedrooms.has('4plus') && (p.rooms || 0) >= 4;
        const hasExactMatch = this.selectedBedrooms.has(rooms);
        return has4Plus || hasExactMatch;
      });
      console.log(`🛏️ Bedrooms filter: ${beforeCount} → ${filtered.length} properties`);
    }

    if (this.selectedAreas.size > 0) {
      const beforeCount = filtered.length;
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
      console.log(`Area filter: ${beforeCount} → ${filtered.length} properties`);
    }

    if (this.minPrice !== null && this.minPrice > 0) {
      const beforeCount = filtered.length;
      filtered = filtered.filter(p => (p.price || 0) >= this.minPrice!);
      console.log(`Min price filter (${this.minPrice}): ${beforeCount} → ${filtered.length} properties`);
    }
    if (this.maxPrice !== null && this.maxPrice > 0) {
      const beforeCount = filtered.length;
      filtered = filtered.filter(p => (p.price || 0) <= this.maxPrice!);
      console.log(`Max price filter (${this.maxPrice}): ${beforeCount} → ${filtered.length} properties`);
    }

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
      console.log(`Sorted by: ${this.selectedSort}`);
    }

    this.properties = filtered;
    console.log(`✅ Final result: ${this.properties.length} properties`);
    console.log('🔧 ====== Filter Complete ======');

    this.currentLoadedCount = 8;
    this.updateDisplayedProperties();
  }

  // Update displayed properties
  private updateDisplayedProperties(): void {
    this.displayedProperties = this.properties.slice(0, this.currentLoadedCount);
  }

  // Load more properties
  loadMore(): void {
    this.currentLoadedCount += this.itemsPerLoad;
    this.updateDisplayedProperties();
    console.log(`Loading more... Now showing ${this.currentLoadedCount} items`);
  }

  // Check if there are more items to load
  hasMoreToLoad(): boolean {
    return this.currentLoadedCount < this.properties.length;
  }

  onFilterChange(event: any): void {
    const target = event.target as HTMLInputElement;
    const value = target.value;

    console.log('🔧 Filter changed:', { type: target.type, name: target.name, value, checked: target.checked });

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

      console.log('📝 Updated filter set:', Array.from(filterSet));
    } else if (target.type === 'radio' && target.name === 'sort') {
      this.selectedSort = target.checked ? value : '';
      console.log('Sort changed to:', this.selectedSort);
    }

    this.applyAllFilters();
  }

  onPropertyTypeChange(event: any): void {
    const target = event.target as HTMLInputElement;
    const value = target.value.toLowerCase();

    console.log('🏠 Property type filter changed:', { value, checked: target.checked });

    if (target.checked) {
      this.selectedPropertyTypes.add(value);
    } else {
      this.selectedPropertyTypes.delete(value);
    }

    console.log('📝 Updated property types:', Array.from(this.selectedPropertyTypes));

    this.applyAllFilters();
  }

  onPriceFilterChange(): void {
    const minEl = document.querySelector('.price-input[placeholder="Min"]') as HTMLInputElement;
    const maxEl = document.querySelector('.price-input[placeholder="Max"]') as HTMLInputElement;

    this.minPrice = minEl?.value ? parseInt(minEl.value, 10) : null;
    this.maxPrice = maxEl?.value ? parseInt(maxEl.value, 10) : null;

    console.log('💰 Price filter changed:', { min: this.minPrice, max: this.maxPrice });

    this.applyAllFilters();
  }

  clearAllFilters(): void {
    console.log('🧹 Clearing all filters...');

    this.selectedPropertyTypes.clear();
    this.selectedBedrooms.clear();
    this.selectedAreas.clear();
    this.selectedSort = '';
    this.minPrice = null;
    this.maxPrice = null;

    this.searchForm.reset();

    document.querySelectorAll('.filter-options input').forEach((input: any) => {
      input.checked = false;
    });

    const minEl = document.querySelector('.price-input[placeholder="Min"]') as HTMLInputElement;
    const maxEl = document.querySelector('.price-input[placeholder="Max"]') as HTMLInputElement;
    if (minEl) minEl.value = '';
    if (maxEl) maxEl.value = '';

    this.properties = [...this.allProperties];
    console.log('✅ All filters cleared, showing all properties:', this.properties.length);

    this.currentLoadedCount = 8;
    this.updateDisplayedProperties();
  }

  togglePropertyTypeDropdown(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showPropertyTypeDropdown = !this.showPropertyTypeDropdown;
    if (this.showPropertyTypeDropdown) {
      this.showBedsAndBathsDropdown = false;
    }
  }

  toggleBedsAndBathsDropdown(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showBedsAndBathsDropdown = !this.showBedsAndBathsDropdown;
    if (this.showBedsAndBathsDropdown) {
      this.showPropertyTypeDropdown = false;
    }
  }

  selectPropertyType(type: string, event: Event): void {
    event.stopPropagation();
    console.log('Property type selected:', type);
    this.searchForm.patchValue({ propertyType: type });
    this.showPropertyTypeDropdown = false;

    this.applyAllFilters();
  }

  selectRooms(rooms: string, event: Event): void {
    event.stopPropagation();
    console.log('🛏️ Rooms selected:', rooms);
    this.searchForm.patchValue({ rooms: rooms });
    this.showBedsAndBathsDropdown = false;

    this.applyAllFilters();
  }

  toggleFavorite(propertyId: number): void {
    if (this.favoritesIds.includes(propertyId)) {
      this.favoriteService.removeFromFavorites(propertyId).subscribe({
        next: () => {
          this.favoritesIds = this.favoritesIds.filter(id => id !== propertyId);
          console.log('❤️ Removed from favorites:', propertyId);
        },
        error: (err) => {
          console.error('❌ Error removing favorite:', err);
        }
      });
    } else {
      this.favoriteService.addToFavorites(propertyId).subscribe({
        next: () => {
          this.favoritesIds.push(propertyId);
          console.log('💚 Added to favorites:', propertyId);
        },
        error: (err) => {
          console.error('Error adding favorite:', err);
        }
      });
    }
  }

  isFavorite(propertyId: number): boolean {
    return this.favoritesIds.includes(propertyId);
  }

  setQuickSearch(city: string): void {
    console.log('🔍 Quick search clicked:', city);
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

    console.log('📱 WhatsApp Link:', `https://wa.me/${cleanPhone}`);

    return `https://wa.me/${cleanPhone}`;
  }
}
