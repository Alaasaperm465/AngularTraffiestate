import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IProperty, phone, email } from '../../models/iproperty';
import { PropertyService } from '../../Services/property';
import { FavoriteService } from '../../Services/favorite-service';

@Component({
  selector: 'app-rent',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './rent.html',
  styleUrls: ['./rent.css'],
})
export class Rent implements OnInit {
  searchForm: FormGroup;
  rentProperties: IProperty[] = [];
  allRentProperties: IProperty[] = [];
  displayedProperties: IProperty[] = [];
  
  showPropertyTypeDropdown = false;
  showBedsAndBathsDropdown = false;
  isScrolled = false;
  phone = phone;
  email = email;
  favoritesIds: number[] = [];

  // Load More functionality
  itemsPerLoad = 8; // Number of items to load each time
  currentLoadedCount = 4; // Start by showing 9 items

  // Filter options
  selectedPropertyTypes: Set<string> = new Set();
  selectedBedrooms: Set<string> = new Set();
  selectedAreas: Set<string> = new Set();
  selectedSort: string = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;

  constructor(
    private rentService: PropertyService,
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
    // Load rent properties
    this.rentService.getPropertyForRent().subscribe({
      next: (data: IProperty[]) => {
        this.allRentProperties = data;
        this.rentProperties = data;
        this.updateDisplayedProperties();
        this.cdr.detectChanges();
        console.log('Rent properties loaded:', data);
      },
      error: (err) => {
        console.error('Error loading rent properties:', err);
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
    this.displayedProperties = this.rentProperties.slice(0, this.currentLoadedCount);
  }

  loadMore(): void {
    this.currentLoadedCount += this.itemsPerLoad;
    this.updateDisplayedProperties();
    this.cdr.detectChanges();
  }

  hasMoreToLoad(): boolean {
    return this.currentLoadedCount < this.rentProperties.length;
  }

  get remainingCount(): number {
    return this.rentProperties.length - this.currentLoadedCount;
  }

  // ===== MAIN SEARCH =====
  onSearch(): void {
    const searchData = this.searchForm.value;
    let filtered = [...this.allRentProperties];

    // Filter by city/area
    if (searchData.city && searchData.city.trim()) {
      filtered = filtered.filter(p =>
        p.city?.toLowerCase().includes(searchData.city.toLowerCase()) ||
        p.area?.toLowerCase().includes(searchData.city.toLowerCase())
      );
    }

    // Filter by property type
    if (searchData.propertyType && searchData.propertyType.trim()) {
      filtered = filtered.filter(p =>
        p.propertyType?.toLowerCase() === searchData.propertyType.toLowerCase()
      );
    }

    // Filter by rooms
    if (searchData.rooms && searchData.rooms.trim()) {
      const roomsValue = parseInt(searchData.rooms, 10);
      filtered = filtered.filter(p => p.rooms === roomsValue);
    }

    // Apply additional filters
    filtered = this.applyFilters(filtered);

    this.rentProperties = filtered;
    this.currentLoadedCount = this.itemsPerLoad; // Reset to initial load count
    this.updateDisplayedProperties();
    this.cdr.detectChanges();
  }

  // ===== APPLY FILTERS =====
  private applyFilters(properties: IProperty[]): IProperty[] {
    let filtered = [...properties];

    // Filter by property type
    if (this.selectedPropertyTypes.size > 0) {
      filtered = filtered.filter(p =>
        this.selectedPropertyTypes.has(p.propertyType?.toLowerCase() || '')
      );
    }

    // Filter by bedrooms
    if (this.selectedBedrooms.size > 0) {
      filtered = filtered.filter(p => {
        const rooms = p.rooms?.toString();
        return this.selectedBedrooms.has(rooms || '') ||
               (this.selectedBedrooms.has('4plus') && p.rooms! >= 4);
      });
    }

    // Filter by area
    if (this.selectedAreas.size > 0) {
      filtered = filtered.filter(p => {
        const area = Number(p.area) || 0;
        if (this.selectedAreas.has('under100') && area < 100) return true;
        if (this.selectedAreas.has('100-200') && area >= 100 && area < 200) return true;
        if (this.selectedAreas.has('200-300') && area >= 200 && area < 300) return true;
        if (this.selectedAreas.has('300plus') && area >= 300) return true;
        return false;
      });
    }

    // Filter by price
    if (this.minPrice !== null) filtered = filtered.filter(p => p.price >= this.minPrice!);
    if (this.maxPrice !== null) filtered = filtered.filter(p => p.price <= this.maxPrice!);

    // Sort results
    if (this.selectedSort) {
      filtered.sort((a, b) => {
        switch (this.selectedSort) {
          case 'price-low': return a.price - b.price;
          case 'price-high': return b.price - a.price;
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

      if (['apartment', 'villa', 'land'].includes(value)) filterSet = this.selectedPropertyTypes;
      else if (['1', '2', '3', '4plus'].includes(value)) filterSet = this.selectedBedrooms;
      else filterSet = this.selectedAreas;

      target.checked ? filterSet.add(value) : filterSet.delete(value);
    } else if (target.type === 'radio' && target.name === 'sort') {
      this.selectedSort = target.checked ? value : '';
    }

    this.onSearch();
  }

  // ===== PRICE FILTER =====
  onPriceFilterChange(): void {
    const minEl = document.querySelector('.price-input[placeholder="Min"]') as HTMLInputElement;
    const maxEl = document.querySelector('.price-input[placeholder="Max"]') as HTMLInputElement;

    this.minPrice = minEl?.value ? parseInt(minEl.value, 10) : null;
    this.maxPrice = maxEl?.value ? parseInt(maxEl.value, 10) : null;

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
        },
        error: (err) => console.error('Error removing favorite:', err)
      });
    } else {
      this.favoriteService.addToFavorites(propertyId).subscribe({
        next: () => {
          this.favoritesIds.push(propertyId);
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error adding favorite:', err)
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

  // ===== TRACK BY =====
  trackById(index: number, item: IProperty): number {
    return item.id;
  }
}