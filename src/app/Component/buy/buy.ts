import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IProperty, phone, email } from '../../models/iproperty';
import { PropertyService } from '../../Services/property';
import { FavoriteService } from '../../Services/favorite-service';

@Component({
  selector: 'app-buy',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './buy.html',
  styleUrl: './buy.css',
})
export class Buy implements OnInit {
  searchForm: FormGroup;
  buyProperties: IProperty[] = [];
  allBuyProperties: IProperty[] = [];
  displayedProperties: IProperty[] = [];

  showPropertyTypeDropdown = false;
  showBedsAndBathsDropdown = false;
  isScrolled = false;
  phone = phone;
  email = email;
  favoritesIds: number[] = [];

  // Load More functionality
  itemsPerLoad = 8; // Number of items to load each time
  currentLoadedCount = 4; // Start by showing 4 items

  selectedPropertyTypes: Set<string> = new Set();
  selectedBedrooms: Set<string> = new Set();
  selectedAreas: Set<string> = new Set();
  selectedSort: string = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;

  // Modal state
  showCallModalFlag: boolean = false;

  constructor(
    private buyService: PropertyService,
    private favoriteService: FavoriteService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.searchForm = this.fb.group({
      city: [''],
      propertyType: [''],
      rooms: ['']
    });
  }

  ngOnInit(): void {
    // Load buy properties
    this.buyService.getPropertyForBuy().subscribe({
      next: (data: IProperty[]) => {
        this.allBuyProperties = data;
        this.buyProperties = data;
        this.updateDisplayedProperties();
        this.cdr.detectChanges();
        console.log('Buy properties loaded:', data);
      },
      error: (err) => {
        console.error('Error loading buy properties:', err);
      }
    });

    // Load favorites
    this.favoriteService.getMyFavorites().subscribe({
      next: (res: any) => {
        const items = res?.value?.items ?? [];
        this.favoritesIds = items.map((f: any) => f.propertyId);
      },
      error: (err) => {
        console.error('Error loading favorites:', err);
      }
    });
  }

  // ===== LOAD MORE METHODS =====
  updateDisplayedProperties(): void {
    this.displayedProperties = this.buyProperties.slice(0, this.currentLoadedCount);
  }

  loadMore(): void {
    this.currentLoadedCount += this.itemsPerLoad;
    this.updateDisplayedProperties();
    this.cdr.detectChanges();
  }

  hasMoreToLoad(): boolean {
    return this.currentLoadedCount < this.buyProperties.length;
  }

  get remainingCount(): number {
    return this.buyProperties.length - this.currentLoadedCount;
  }

  // ===== MAIN SEARCH =====
  onSearch(): void {
    const searchData = this.searchForm.value;
    let filtered = [...this.allBuyProperties];

    // Filter by city/area
    if (searchData.city?.trim()) {
      const citySearch = searchData.city.toLowerCase().trim();
      filtered = filtered.filter(p =>
        (p.city?.toLowerCase().includes(citySearch)) ||
        (p.area?.toLowerCase().includes(citySearch))
      );
    }

    // Filter by property type
    if (searchData.propertyType?.trim()) {
      const typeSearch = searchData.propertyType.toLowerCase().trim();
      filtered = filtered.filter(p =>
        (p.propertyType?.toLowerCase().trim() === typeSearch)
      );
    }

    // Filter by rooms
    if (searchData.rooms?.trim()) {
      const roomsValue = parseInt(searchData.rooms, 10);
      filtered = filtered.filter(p => {
        if (searchData.rooms === '4') return (p.rooms || 0) >= 4;
        return p.rooms === roomsValue;
      });
    }

    // Apply additional filters
    filtered = this.applyFilters(filtered);

    this.buyProperties = filtered;
    this.currentLoadedCount = this.itemsPerLoad; // Reset to initial load count
    this.updateDisplayedProperties();
    this.cdr.detectChanges();
  }

  // ===== APPLY FILTERS =====
  private applyFilters(properties: IProperty[]): IProperty[] {
    let filtered = [...properties];

    if (this.selectedPropertyTypes.size > 0) {
      filtered = filtered.filter(p =>
        this.selectedPropertyTypes.has(p.propertyType?.toLowerCase() || '')
      );
    }

    if (this.selectedBedrooms.size > 0) {
      filtered = filtered.filter(p => {
        const rooms = (p.rooms || 0).toString();
        return this.selectedBedrooms.has(rooms) ||
               (this.selectedBedrooms.has('4plus') && p.rooms! >= 4);
      });
    }

    if (this.selectedAreas.size > 0) {
      filtered = filtered.filter(p => {
        const area = Number(p.area) || 0;
        for (const areaRange of this.selectedAreas) {
          if (areaRange === 'under100' && area < 100) return true;
          if (areaRange === '100-200' && area >= 100 && area < 200) return true;
          if (areaRange === '200-300' && area >= 200 && area < 300) return true;
          if (areaRange === '300plus' && area >= 300) return true;
        }
        return false;
      });
    }

    if (this.minPrice !== null) filtered = filtered.filter(p => p.price >= this.minPrice!);
    if (this.maxPrice !== null) filtered = filtered.filter(p => p.price <= this.maxPrice!);

    if (this.selectedSort) {
      filtered.sort((a, b) => {
        switch (this.selectedSort) {
          case 'price-low': return (a.price || 0) - (b.price || 0);
          case 'price-high': return (b.price || 0) - (a.price || 0);
          case 'newest': return (b.id || 0) - (a.id || 0);
          case 'popular': return (b.views || 0) - (a.views || 0);
          default: return 0;
        }
      });
    }

    return filtered;
  }

  // ===== FILTER CHANGE =====
  onFilterChange(event: any): void {
    const target = event.target as HTMLInputElement;
    const value = target.value;

    if (target.type === 'checkbox') {
      let filterSet: Set<string>;
      if (['apartment', 'villa', 'house', 'studio'].includes(value)) filterSet = this.selectedPropertyTypes;
      else if (['1','2','3','4plus'].includes(value)) filterSet = this.selectedBedrooms;
      else filterSet = this.selectedAreas;

      if (target.checked) filterSet.add(value);
      else filterSet.delete(value);
    } else if (target.type === 'radio' && target.name === 'sort') {
      this.selectedSort = target.checked ? value : '';
    }

    this.onSearch();
  }

  // ===== PRICE FILTER =====
  onPriceFilterChange(): void {
    const minEl = document.querySelector('.price-input[placeholder="Min"]') as HTMLInputElement;
    const maxEl = document.querySelector('.price-input[placeholder="Max"]') as HTMLInputElement;

    // Parse values
    let minValue = minEl?.value ? parseInt(minEl.value, 10) : null;
    let maxValue = maxEl?.value ? parseInt(maxEl.value, 10) : null;

    // Prevent negative values - set to null if negative or zero
    if (minValue !== null && minValue <= 0) {
      minEl.value = '';
      minValue = null;
    }
    if (maxValue !== null && maxValue <= 0) {
      maxEl.value = '';
      maxValue = null;
    }

    this.minPrice = minValue;
    this.maxPrice = maxValue;

    this.onSearch();
  }

  // ===== CLEAR ALL FILTERS =====
  clearAllFilters(): void {
    this.selectedPropertyTypes.clear();
    this.selectedBedrooms.clear();
    this.selectedAreas.clear();
    this.selectedSort = '';
    this.minPrice = null;
    this.maxPrice = null;

    // Reset form
    this.searchForm.reset();

    // Clear all checkboxes and radio buttons
    document.querySelectorAll('.filter-options input').forEach((input: any) => input.checked = false);

    // Clear price inputs
    const minEl = document.querySelector('.price-input[placeholder="Min"]') as HTMLInputElement;
    const maxEl = document.querySelector('.price-input[placeholder="Max"]') as HTMLInputElement;
    if (minEl) minEl.value = '';
    if (maxEl) maxEl.value = '';

    this.onSearch();
  }

  // ===== DROPDOWNS =====
  togglePropertyTypeDropdown(): void {
    this.showPropertyTypeDropdown = !this.showPropertyTypeDropdown;
    if (this.showPropertyTypeDropdown) this.showBedsAndBathsDropdown = false;
  }

  toggleBedsAndBathsDropdown(): void {
    this.showBedsAndBathsDropdown = !this.showBedsAndBathsDropdown;
    if (this.showBedsAndBathsDropdown) this.showPropertyTypeDropdown = false;
  }

  // ===== FAVORITES =====
  toggleFavorite(propertyId: number): void {
    if (this.favoritesIds.includes(propertyId)) {
      this.favoriteService.removeFromFavorites(propertyId).subscribe({
        next: () => {
          this.favoritesIds = this.favoritesIds.filter(id => id !== propertyId);
          this.cdr.detectChanges();
        }
      });
    } else {
      this.favoriteService.addToFavorites(propertyId).subscribe({
        next: () => {
          this.favoritesIds.push(propertyId);
          this.cdr.detectChanges();
        }
      });
    }
  }

  isFavorite(propertyId: number): boolean {
    return this.favoritesIds.includes(propertyId);
  }

  // ===== QUICK SEARCH =====
  setQuickSearch(city: string): void {
    this.searchForm.patchValue({ city });
    this.onSearch();
  }

  // ===== SCROLL EVENT =====
  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.isScrolled = window.scrollY > 100;
  }

  // ===== CLICK OUTSIDE DROPDOWNS =====
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

  openCallModal(): void {
    this.showCallModalFlag = true;
  }

  closeCallModal(): void {
    this.showCallModalFlag = false;
  }

  makeCall(): void {
    window.location.href = `tel:${this.phone}`;
  }

  showCallModal(): void {
    this.openCallModal();
  }
}
