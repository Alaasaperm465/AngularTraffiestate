// import { ChangeDetectorRef, Component } from '@angular/core';
// import { IProperty } from '../../models/iproperty';
// import { PropertyService } from '../../Services/property';

// @Component({
//   selector: 'app-buy',
//   imports: [],
//   templateUrl: './buy.html',
//   styleUrl: './buy.css',
// })
// export class Buy {
//    buyproperties!:IProperty[];
//     constructor(private buyservice:PropertyService,private cdn:ChangeDetectorRef)
//      {

//      }
//       ngOnInit(): void
//   {
//     this.buyservice.getPropertyForBuy().subscribe((data)=>
//     {
//       console.log(data);
//       this.buyproperties=data;
//       this.cdn.detectChanges();
//     });
//   }


// }





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
  showPropertyTypeDropdown = false;
  showBedsAndBathsDropdown = false;
  isScrolled = false;
  phone = phone;
  email = email;
  favoritesIds: number[] = [];

  // فلترة الخيارات
  selectedPropertyTypes: Set<string> = new Set();
  selectedBedrooms: Set<string> = new Set();
  selectedAreas: Set<string> = new Set();
  selectedSort: string = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;

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
    // جلب العقارات للبيع
    this.buyService.getPropertyForBuy().subscribe({
      next: (data: IProperty[]) => {
        this.allBuyProperties = data;
        this.buyProperties = data;
        this.cdr.detectChanges();
        console.log('Buy properties loaded:', data);
      },
      error: (err) => {
        console.error('Error loading buy properties:', err);
      }
    });

    // جلب المفضلات
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

  // ===== تعيين التاب =====
  setActiveTab(): void {
    // تعيين تلقائي للـ Buy
    setTimeout(() => this.onSearch(), 0);
  }

  // ===== دالة البحث الرئيسية =====
  onSearch(): void {
    const searchData = this.searchForm.value;
    let filtered = [...this.allBuyProperties];

    // ✅ فلترة المدينة / المنطقة
    if (searchData.city && searchData.city.trim()) {
      filtered = filtered.filter(p =>
        p.city?.toLowerCase().includes(searchData.city.toLowerCase()) ||
        p.area?.toLowerCase().includes(searchData.city.toLowerCase())
      );
    }

    // ✅ فلترة نوع العقار
    if (searchData.propertyType && searchData.propertyType.trim()) {
      filtered = filtered.filter(p =>
        p.propertyType?.toLowerCase() === searchData.propertyType.toLowerCase()
      );
    }

    // ✅ فلترة عدد الغرف
    if (searchData.rooms && searchData.rooms.trim()) {
      const roomsValue = parseInt(searchData.rooms, 10);
      filtered = filtered.filter(p => p.rooms === roomsValue);
    }

    // تطبيق الفلاترات الإضافية
    filtered = this.applyFilters(filtered);

    // تحديث النتيجة
    this.buyProperties = filtered;
    this.cdr.detectChanges();
  }

  // ===== تطبيق الفلاترات =====
  private applyFilters(properties: IProperty[]): IProperty[] {
    let filtered = [...properties];

    // فلتر نوع العقار
    if (this.selectedPropertyTypes.size > 0) {
      filtered = filtered.filter(p =>
        this.selectedPropertyTypes.has(p.propertyType?.toLowerCase() || '')
      );
    }

    // فلتر عدد الغرف
    if (this.selectedBedrooms.size > 0) {
      filtered = filtered.filter(p => {
        const rooms = p.rooms?.toString();
        return this.selectedBedrooms.has(rooms || '') ||
               (this.selectedBedrooms.has('4plus') && p.rooms! >= 4);
      });
    }

    // فلتر المساحة
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

    // فلتر السعر
    if (this.minPrice !== null) {
      filtered = filtered.filter(p => p.price >= this.minPrice!);
    }
    if (this.maxPrice !== null) {
      filtered = filtered.filter(p => p.price <= this.maxPrice!);
    }

    // ترتيب النتائج
    if (this.selectedSort) {
      filtered.sort((a, b) => {
        switch (this.selectedSort) {
          case 'price-low':
            return a.price - b.price;
          case 'price-high':
            return b.price - a.price;
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

      if (['apartment', 'villa', 'house', 'studio'].includes(value)) {
        filterSet = this.selectedPropertyTypes;
      } else if (['1', '2', '3', '4plus'].includes(value)) {
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

    this.onSearch();
  }

  // ===== معالج تغيير السعر =====
  onPriceFilterChange(): void {
    const minEl = document.querySelector('.price-input[placeholder="Min"]') as HTMLInputElement;
    const maxEl = document.querySelector('.price-input[placeholder="Max"]') as HTMLInputElement;

    this.minPrice = minEl?.value ? parseInt(minEl.value, 10) : null;
    this.maxPrice = maxEl?.value ? parseInt(maxEl.value, 10) : null;

    this.onSearch();
  }

  // ===== مسح جميع الفلاترات =====
  clearAllFilters(): void {
    this.selectedPropertyTypes.clear();
    this.selectedBedrooms.clear();
    this.selectedAreas.clear();
    this.selectedSort = '';
    this.minPrice = null;
    this.maxPrice = null;

    document.querySelectorAll('.filter-options input').forEach((input: any) => {
      input.checked = false;
    });

    this.onSearch();
  }

  // ===== تبديل حالة القائمة المنسدلة - نوع العقار =====
  togglePropertyTypeDropdown(): void {
    this.showPropertyTypeDropdown = !this.showPropertyTypeDropdown;
    if (this.showPropertyTypeDropdown) {
      this.showBedsAndBathsDropdown = false;
    }
  }

  // ===== تبديل حالة القائمة المنسدلة - الغرف =====
  toggleBedsAndBathsDropdown(): void {
    this.showBedsAndBathsDropdown = !this.showBedsAndBathsDropdown;
    if (this.showBedsAndBathsDropdown) {
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
      this.showBedsAndBathsDropdown = false;
    }
  }

  // ===== تتبع العنصر حسب المعرف =====
  trackById(index: number, item: IProperty): number {
    return item.id;
  }
}
