import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IProperty, phone, email } from '../models/iproperty';
import { FavoriteService } from '../Services/favorite-service';
import { PropertyService } from '../Services/property';

@Component({
  selector: 'app-land',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './land.html',
  styleUrl: './land.css',
})
export class Land implements OnInit {
  searchForm: FormGroup;
  landProperties: IProperty[] = [];
  allLandProperties: IProperty[] = [];
  showPropertyTypeDropdown = false;
  showLandSizeDropdown = false;
  isScrolled = false;
  phone = phone;
  email = email;
  favoritesIds: number[] = [];

  // فلترة الخيارات الخاصة بالأراضي
  selectedSizes: Set<string> = new Set();
  selectedPriceRanges: Set<string> = new Set();
  selectedSort: string = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  minSize: number | null = null;
  maxSize: number | null = null;

  // Land-specific filter options
  landSizes = [
    { label: 'Small (< 1000 sqm)', value: 'under1000' },
    { label: 'Medium (1000-5000 sqm)', value: '1000-5000' },
    { label: 'Large (5000-10000 sqm)', value: '5000-10000' },
    { label: 'Extra Large (> 10000 sqm)', value: 'over10000' }
  ];

  landPriceRanges = [
    { label: 'Under 500,000 EGP', value: 'under500k' },
    { label: '500,000 - 1,000,000 EGP', value: '500k-1m' },
    { label: '1,000,000 - 5,000,000 EGP', value: '1m-5m' },
    { label: '5,000,000 - 10,000,000 EGP', value: '5m-10m' },
    { label: 'Over 10,000,000 EGP', value: 'over10m' }
  ];

  quickSearchCities = [
    { name: 'Cairo', count: 120 },
    { name: 'Giza', count: 85 },
    { name: 'Alexandria', count: 65 },
    { name: 'Sharm El Sheikh', count: 42 },
    { name: 'North Coast', count: 78 }
  ];

  constructor(
    private buyService: PropertyService,
    private favoriteService: FavoriteService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.searchForm = this.fb.group({
      city: [''],
      propertyType: ['land'],
      minSize: [''],
      maxSize: [''],
      minPrice: [''],
      maxPrice: ['']
    });
  }

  ngOnInit(): void {
    this.loadLandProperties();
    this.loadFavorites();
  }

  loadLandProperties(): void {
    this.buyService.getPropertyForBuy().subscribe({
      next: (data: IProperty[]) => {
        this.allLandProperties = data.filter(property =>
          property.propertyType?.toLowerCase().includes('land') ||
          property.propertyType?.toLowerCase() === 'land'
        );

        if (this.allLandProperties.length === 0) {
          this.allLandProperties = data;
        }

        this.landProperties = this.allLandProperties.map(property => ({
          ...property,
          propertyType: 'Land',
          areaSpace: Number(property.areaSpace) || 1000,
          price: Number(property.price) || 500000
        }));

        this.landProperties = [...this.allLandProperties];
        this.cdr.detectChanges();
        console.log('Land properties loaded:', this.landProperties);
      },
      error: (err) => {
        console.error('Error loading land properties:', err);
      }
    });
  }

  loadFavorites(): void {
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

  // ===== دالة البحث الرئيسية =====
  onSearch(): void {
    const searchData = this.searchForm.value;
    let filtered = [...this.allLandProperties];

    // ✅ فلترة المدينة / المنطقة
    if (searchData.city && searchData.city.trim()) {
      filtered = filtered.filter(p =>
        p.city?.toLowerCase().includes(searchData.city.toLowerCase()) ||
        p.area?.toLowerCase().includes(searchData.city.toLowerCase()) ||
        p.location?.toLowerCase().includes(searchData.city.toLowerCase())
      );
    }

    // ✅ فلترة نوع الأرض
    filtered = filtered.filter(p =>
      p.propertyType?.toLowerCase().includes('land')
    );

    // ✅ فلترة حجم الأرض - منع الأرقام السالبة
    if (searchData.minSize && Number(searchData.minSize) >= 0) {
      const minSize = Number(searchData.minSize);
      filtered = filtered.filter(p => (p.areaSpace || 0) >= minSize);
    }
    if (searchData.maxSize && Number(searchData.maxSize) >= 0) {
      const maxSize = Number(searchData.maxSize);
      filtered = filtered.filter(p => (p.areaSpace || 0) <= maxSize);
    }

    // ✅ فلترة السعر - منع الأرقام السالبة
    if (searchData.minPrice && Number(searchData.minPrice) >= 0) {
      const minPrice = Number(searchData.minPrice);
      filtered = filtered.filter(p => (p.price || 0) >= minPrice);
    }
    if (searchData.maxPrice && Number(searchData.maxPrice) >= 0) {
      const maxPrice = Number(searchData.maxPrice);
      filtered = filtered.filter(p => (p.price || 0) <= maxPrice);
    }

    filtered = this.applyFilters(filtered);
    this.landProperties = filtered;
    this.cdr.detectChanges();
  }

  // ===== تطبيق الفلاترات =====
  private applyFilters(properties: IProperty[]): IProperty[] {
    let filtered = [...properties];

    // فلتر حجم الأرض
    if (this.selectedSizes.size > 0) {
      filtered = filtered.filter(p => {
        const area = Number(p.area) || 0;
        if (this.selectedSizes.has('under1000') && area < 1000) return true;
        if (this.selectedSizes.has('1000-5000') && area >= 1000 && area < 5000) return true;
        if (this.selectedSizes.has('5000-10000') && area >= 5000 && area < 10000) return true;
        if (this.selectedSizes.has('over10000') && area >= 10000) return true;
        return false;
      });
    }

    // فلتر نطاق السعر
    if (this.selectedPriceRanges.size > 0) {
      filtered = filtered.filter(p => {
        const price = Number(p.price) || 0;
        if (this.selectedPriceRanges.has('under500k') && price < 500000) return true;
        if (this.selectedPriceRanges.has('500k-1m') && price >= 500000 && price < 1000000) return true;
        if (this.selectedPriceRanges.has('1m-5m') && price >= 1000000 && price < 5000000) return true;
        if (this.selectedPriceRanges.has('5m-10m') && price >= 5000000 && price < 10000000) return true;
        if (this.selectedPriceRanges.has('over10m') && price >= 10000000) return true;
        return false;
      });
    }

    // فلتر السعر المخصص - منع الأرقام السالبة
    if (this.minPrice !== null && this.minPrice >= 0) {
      filtered = filtered.filter(p => (p.price || 0) >= this.minPrice!);
    }
    if (this.maxPrice !== null && this.maxPrice >= 0) {
      filtered = filtered.filter(p => (p.price || 0) <= this.maxPrice!);
    }

    // فلتر الحجم المخصص - منع الأرقام السالبة
    if (this.minSize !== null && this.minSize >= 0) {
      filtered = filtered.filter(p => (p.areaSpace || 0) >= this.minSize!);
    }
    if (this.maxSize !== null && this.maxSize >= 0) {
      filtered = filtered.filter(p => (p.areaSpace || 0) <= this.maxSize!);
    }

    // ترتيب النتائج
    if (this.selectedSort) {
      filtered.sort((a, b) => {
        switch (this.selectedSort) {
          case 'price-low':
            return (a.price || 0) - (b.price || 0);
          case 'price-high':
            return (b.price || 0) - (a.price || 0);
          case 'size-low':
            return (a.areaSpace || 0) - (b.areaSpace || 0);
          case 'size-high':
            return (b.areaSpace || 0) - (a.areaSpace || 0);
          case 'newest':
            return (b.id || 0) - (a.id || 0);
          case 'popular':
            return (b.views || 0) - (a.views || 0);
          default:
            return 0;
        }
      });
    }

    return filtered;
  }

  // ===== معالج تغيير الفلاترات =====
  onFilterChange(event: any): void {
    const target = event.target as HTMLInputElement;
    const value = target.value;

    if (target.type === 'checkbox') {
      let filterSet: Set<string>;

      if (['under1000', '1000-5000', '5000-10000', 'over10000'].includes(value)) {
        filterSet = this.selectedSizes;
      } else {
        filterSet = this.selectedPriceRanges;
      }

      if (target.checked) {
        filterSet.add(value);
      } else {
        filterSet.delete(value);
      }
    } else if (target.type === 'radio' && target.name === 'sort') {
      this.selectedSort = target.checked ? value : '';
    }

    this.onSearch();
  }

  // ===== معالج تغيير السعر =====
  onPriceFilterChange(): void {
    const minPriceEl = document.querySelector('.price-input[placeholder="Min Price"]') as HTMLInputElement;
    const maxPriceEl = document.querySelector('.price-input[placeholder="Max Price"]') as HTMLInputElement;
    const minSizeEl = document.querySelector('.size-input[placeholder="Min Size"]') as HTMLInputElement;
    const maxSizeEl = document.querySelector('.size-input[placeholder="Max Size"]') as HTMLInputElement;

    this.minPrice = minPriceEl?.value ? parseInt(minPriceEl.value, 10) : null;
    this.maxPrice = maxPriceEl?.value ? parseInt(maxPriceEl.value, 10) : null;
    this.minSize = minSizeEl?.value ? parseInt(minSizeEl.value, 10) : null;
    this.maxSize = maxSizeEl?.value ? parseInt(maxSizeEl.value, 10) : null;

    this.onSearch();
  }

  // ===== مسح جميع الفلاترات =====
  clearAllFilters(): void {
    this.selectedSizes.clear();
    this.selectedPriceRanges.clear();
    this.selectedSort = '';
    this.minPrice = null;
    this.maxPrice = null;
    this.minSize = null;
    this.maxSize = null;

    this.searchForm.patchValue({
      city: '',
      minSize: '',
      maxSize: '',
      minPrice: '',
      maxPrice: ''
    });

    document.querySelectorAll('.filter-options input').forEach((input: any) => {
      input.checked = false;
    });

    this.onSearch();
  }

  // ===== تبديل حالة القائمة المنسدلة - نوع الأرض =====
  togglePropertyTypeDropdown(): void {
    this.showPropertyTypeDropdown = !this.showPropertyTypeDropdown;
    if (this.showPropertyTypeDropdown) {
      this.showLandSizeDropdown = false;
    }
  }

  // ===== تبديل حالة القائمة المنسدلة - حجم الأرض =====
  toggleLandSizeDropdown(): void {
    this.showLandSizeDropdown = !this.showLandSizeDropdown;
    if (this.showLandSizeDropdown) {
      this.showPropertyTypeDropdown = false;
    }
  }

  // ===== تبديل المفضلة =====
  toggleFavorite(propertyId: number): void {
    if (this.favoritesIds.includes(propertyId)) {
      this.favoriteService.removeFromFavorites(propertyId).subscribe({
        next: () => {
          this.favoritesIds = this.favoritesIds.filter(id => id !== propertyId);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error removing favorite:', err);
        }
      });
    } else {
      this.favoriteService.addToFavorites(propertyId).subscribe({
        next: () => {
          this.favoritesIds.push(propertyId);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error adding favorite:', err);
        }
      });
    }
  }

  // ===== التحقق من العقار المفضل =====
  isFavorite(propertyId: number): boolean {
    return this.favoritesIds.includes(propertyId);
  }

  // ===== البحث السريع =====
  setQuickSearch(city: string): void {
    this.searchForm.patchValue({
      city: city
    });
    this.onSearch();
  }

  // ===== تطبيق الفلتر حسب الحجم =====
  setSizeFilter(minSize: number, maxSize: number): void {
    this.searchForm.patchValue({
      minSize: minSize,
      maxSize: maxSize
    });
    this.onSearch();
  }

  // ===== تطبيق الفلتر حسب السعر =====
  setPriceFilter(minPrice: number, maxPrice: number): void {
    this.searchForm.patchValue({
      minPrice: minPrice,
      maxPrice: maxPrice
    });
    this.onSearch();
  }

  // ===== الاستماع لحدث التمرير =====
  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.isScrolled = window.scrollY > 100;
  }

  // ===== الاستماع لحدث النقر خارج القوائم المنسدلة =====
  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-wrapper')) {
      this.showPropertyTypeDropdown = false;
      this.showLandSizeDropdown = false;
    }
  }

  // ===== تتبع العنصر حسب المعرف =====
  trackById(index: number, item: IProperty): number {
    return item.id;
  }

  // ===== الحصول على عدد العقارات في المدينة =====
  getCityCount(cityName: string): number {
    return this.allLandProperties.filter(p =>
      p.city?.toLowerCase() === cityName.toLowerCase() ||
      p.location?.toLowerCase().includes(cityName.toLowerCase())
    ).length;
  }
}
