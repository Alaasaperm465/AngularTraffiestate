// import { Component, HostListener, OnInit } from '@angular/core';
// import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// import { RouterModule } from '@angular/router';
// import { CommonModule } from '@angular/common';
// import { IProperty, phone, Call, email } from '../../models/iproperty';
// import { HttpClient } from '@angular/common/http';
// import { PropertyService } from '../../Services/PropertyService/property';
// import { RouterLink } from '@angular/router';
// import { FavoriteService } from '../../Services/favorite-service';


// @Component({
//   selector: 'app-home',
//   standalone: true,
//   templateUrl: './home.html',
//   styleUrls: ['./home.css'],
//   imports: [CommonModule, ReactiveFormsModule, RouterModule],
// })
// export class Home implements OnInit {
//   searchForm: FormGroup;
//   activeTab: string = 'buy';
//   properties: IProperty[] = [];
//   allProperties: IProperty[] = [];
//   showPropertyTypeDropdown = false;
//   showBedsAndBathsDropdown = false;
//   isScrolled = false;
//   phone = phone;

//   email = email;

//   favoritesIds: number[] = [];


//   constructor(private fb: FormBuilder, private http: HttpClient,private favoriteService: FavoriteService,private propertyService: PropertyService) {
//     this.searchForm = this.fb.group({
//       city: [''],
//       propertyType: [''],
//       rooms: ['']
//     });

//   }
//   setTab(tab: any) {
//     this.activeTab = tab;
//   }

//   onSearch() {
//   const searchData = this.searchForm.value;

//   // نبدأ دايمًا من كل العقارات
//   let filtered = [...this.allProperties];

//   // ✅ فلترة حسب التاب (Buy / Rent)
//   if (this.activeTab) {
//     filtered = filtered.filter(p =>
//       p.purpose?.toLowerCase() === this.activeTab.toLowerCase()
//     );
//   }

//   // ✅ فلترة المدينة / المنطقة
//   if (searchData.city) {
//     filtered = filtered.filter(p =>
//       p.city?.toLowerCase().includes(searchData.city.toLowerCase()) ||
//       p.area?.toLowerCase().includes(searchData.city.toLowerCase())
//     );
//   }

//   // ✅ فلترة نوع العقار
//   if (searchData.propertyType) {
//     filtered = filtered.filter(p =>
//       p.propertyType?.toLowerCase() === searchData.propertyType.toLowerCase()
//     );
//   }

//   // ✅ فلترة عدد الغرف
//   if (searchData.rooms) {
//     filtered = filtered.filter(p =>
//       p.rooms === +searchData.rooms
//     );
//   }

//   // النتيجة النهائية
//   this.properties = filtered;
//   this.activeTab='';
// }

//   ngOnInit(): void {
//     // جلب العقارات من الخدمة
//     const propertyService = new PropertyService(this.http);
//     propertyService.getAllProperties().subscribe((data: IProperty[]) => {
//       this.allProperties = data;
//       this.properties = data;
//     });


//       // جلب المفضلات
//  this.favoriteService.getMyFavorites().subscribe({
//   next: (res: any) => {
//     const items = res?.value?.items ?? [];
//     this.favoritesIds = items.map((f: any) => f.propertyId);
//   },
//   error: err => console.error(err)
// });


//   }

//   setActiveTab(tabId: string): void {
//     this.activeTab = tabId;
//   }

//   togglePropertyTypeDropdown(): void {
//     this.showPropertyTypeDropdown = !this.showPropertyTypeDropdown;
//     if (this.showPropertyTypeDropdown) this.showBedsAndBathsDropdown = false;
//   }

//   toggleBedsAndBathsDropdown(): void {
//     this.showBedsAndBathsDropdown = !this.showBedsAndBathsDropdown;
//     if (this.showBedsAndBathsDropdown) this.showPropertyTypeDropdown = false;
//   }



//   // toggleFavorite(propertyId: number): void {
//   //   const property = this.properties.find(p => p.id === propertyId);
//   //   if (property) property.isFavorite = !property.isFavorite;
//   // }



//    // ===== 4️⃣ دالة toggleFavorite =====
//   toggleFavorite(propertyId: number): void {
//     if (this.favoritesIds.includes(propertyId)) {
//       this.favoriteService.removeFromFavorites(propertyId).subscribe(() => {
//         this.favoritesIds = this.favoritesIds.filter(id => id !== propertyId);
//       });
//     } else {
//       this.favoriteService.addToFavorites(propertyId).subscribe(() => {
//         this.favoritesIds.push(propertyId);
//       });
//     }
//   }

//   // ===== 5️⃣ دالة isFavorite =====
//   isFavorite(propertyId: number): boolean {
//     return this.favoritesIds.includes(propertyId);
//   }

//   @HostListener('window:scroll', [])
//   onWindowScroll(): void {
//     this.isScrolled = window.scrollY > 100;
//   }

//   @HostListener('document:click', ['$event'])
//   onClickOutside(event: MouseEvent): void {
//     const target = event.target as HTMLElement;
//     if (!target.closest('.dropdown-wrapper')) {
//       this.showPropertyTypeDropdown = false;
//       this.showBedsAndBathsDropdown = false;
//     }
//   }

//   trackById(index: number, item: IProperty): number {
//     return item.id;
//   }
//   setQuickSearch(value: string): void {
//     // نملأ السيرش تلقائي
//     this.searchForm.patchValue({
//       city: value
//     });

//     // اختياري: تشغلي السيرش مباشرة
//     this.onSearch();
//   }

// }



/// /   //  /   //   /   //

import { Component, HostListener, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IProperty, phone, Call, email } from '../../models/iproperty';
import { HttpClient } from '@angular/common/http';
import { PropertyService } from '../../Services/PropertyService/property';
import { RouterLink } from '@angular/router';
import { FavoriteService } from '../../Services/favorite-service';


@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
})
export class Home implements OnInit {
  searchForm: FormGroup;
  activeTab: string = 'buy';
  properties: IProperty[] = [];
  allProperties: IProperty[] = [];
  showPropertyTypeDropdown = false;
  showBedsAndBathsDropdown = false;
  isScrolled = false;
  phone = phone;
  email = email;
  favoritesIds: number[] = [];
  selectedTypes: string[] = [];
// properties: IProperty[] = [];


  // فلترة الخيارات
  selectedPropertyTypes: Set<string> = new Set();
  selectedBedrooms: Set<string> = new Set();
  selectedAreas: Set<string> = new Set();
  selectedSort: string = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;

  @ViewChild('minPrice') minPriceInput!: ElementRef;
  @ViewChild('maxPrice') maxPriceInput!: ElementRef;

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

  // ===== 1️⃣ تعيين التاب =====
  setActiveTab(tab: string): void {
    this.activeTab = tab;
    // تشغيل البحث مباشرة بعد تغيير التاب
    setTimeout(() => this.onSearch(), 0);
  }

  // ===== 2️⃣ دالة البحث الرئيسية =====
  onSearch(): void {
    const searchData = this.searchForm.value;

    // نبدأ دايمًا من كل العقارات
    let filtered = [...this.allProperties];

    // ✅ فلترة حسب التاب (Buy / Rent)
    if (this.activeTab && this.activeTab.trim()) {
      filtered = filtered.filter(p =>
        p.purpose?.toLowerCase() === this.activeTab.toLowerCase()
      );
    }

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

    // تحديث النتيجة النهائية
    this.properties = filtered;
  }

  // ===== 3️⃣ تطبيق الفلاترات =====
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

  // ===== 4️⃣ معالج تغيير الفلاترات =====
  // onFilterChange(event: any): void {
  //   const target = event.target as HTMLInputElement;
  //   const value = target.value;

  //   if (target.type === 'checkbox') {
  //     // تحديد نوع الفلتر
  //     let filterSet: Set<string>;

  //     if (['apartment', 'villa', 'house', 'studio'].includes(value)) {
  //       filterSet = this.selectedPropertyTypes;
  //     } else if (['1', '2', '3', '4plus'].includes(value)) {
  //       filterSet = this.selectedBedrooms;
  //     } else {
  //       filterSet = this.selectedAreas;
  //     }

  //     // تحديث المجموعة
  //     if (target.checked) {
  //       filterSet.add(value);
  //     } else {
  //       filterSet.delete(value);
  //     }
  //   } else if (target.type === 'radio' && target.name === 'sort') {
  //     this.selectedSort = target.checked ? value : '';
  //   }

  //   // تطبيق الفلاترات
  //   this.onSearch();
  // }
  onFilterChange(event: any): void {
  const value = event.target.value;

  switch (value) {

    case 'newest':
      this.propertyService.sortByNewest()
        .subscribe(data => this.properties = data);
      break;

    case 'price-low':
      this.propertyService.sortByPrice('asc')
        .subscribe(data => this.properties = data);
      break;

    case 'price-high':
      this.propertyService.sortByPrice('desc')
        .subscribe(data => this.properties = data);
      break;

    case 'popular':
      this.propertyService.sortByPopular()
        .subscribe(data => this.properties = data);
      break;
  }
}


  // ===== 5️⃣ معالج تغيير السعر =====
  onPriceFilterChange(): void {
    const minEl = document.querySelector('.price-input[placeholder="Min"]') as HTMLInputElement;
    const maxEl = document.querySelector('.price-input[placeholder="Max"]') as HTMLInputElement;

    this.minPrice = minEl?.value ? parseInt(minEl.value, 10) : null;
    this.maxPrice = maxEl?.value ? parseInt(maxEl.value, 10) : null;

    this.onSearch();
  }

  // ===== 6️⃣ مسح جميع الفلاترات =====
  clearAllFilters(): void {
    this.selectedPropertyTypes.clear();
    this.selectedBedrooms.clear();
    this.selectedAreas.clear();
    this.selectedSort = '';
    this.minPrice = null;
    this.maxPrice = null;

    // مسح جميع الـ checkboxes و radios
    document.querySelectorAll('.filter-options input').forEach((input: any) => {
      input.checked = false;
    });

    // إعادة البحث
    this.onSearch();
  }

  // ===== 7️⃣ تحميل البيانات الأولية =====
  ngOnInit(): void {

    this.propertyService.getAllProperties().subscribe(data => {
    this.allProperties = data;
    this.properties = data;
  });
    // جلب جميع العقارات من الخدمة
    this.propertyService.getAllProperties().subscribe({
      next: (data: IProperty[]) => {
        this.allProperties = data;
        this.properties = data;
        console.log('Properties loaded:', data);
      },
      error: (err) => {
        console.error('Error loading properties:', err);
      }
    });

    // جلب المفضلات
    this.favoriteService.getMyFavorites().subscribe({
      next: (res: any) => {
        const items = res?.value?.items ?? [];
        this.favoritesIds = items.map((f: any) => f.propertyId);
        console.log('Favorites loaded:', this.favoritesIds);
      },
      error: (err) => {
        console.error('Error loading favorites:', err);
      }
    });
  }

  // ===== 8️⃣ تبديل حالة القائمة المنسدلة - نوع العقار =====
  togglePropertyTypeDropdown(): void {
    this.showPropertyTypeDropdown = !this.showPropertyTypeDropdown;
    if (this.showPropertyTypeDropdown) {
      this.showBedsAndBathsDropdown = false;
    }
  }

  // ===== 9️⃣ تبديل حالة القائمة المنسدلة - الغرف =====
  toggleBedsAndBathsDropdown(): void {
    this.showBedsAndBathsDropdown = !this.showBedsAndBathsDropdown;
    if (this.showBedsAndBathsDropdown) {
      this.showPropertyTypeDropdown = false;
    }
  }

  // ===== 🔟 تبديل المفضلة =====
  toggleFavorite(propertyId: number): void {
    if (this.favoritesIds.includes(propertyId)) {
      // إزالة من المفضلات
      this.favoriteService.removeFromFavorites(propertyId).subscribe({
        next: () => {
          this.favoritesIds = this.favoritesIds.filter(id => id !== propertyId);
          console.log('Removed from favorites:', propertyId);
        },
        error: (err) => {
          console.error('Error removing favorite:', err);
        }
      });
    } else {
      // إضافة إلى المفضلات
      this.favoriteService.addToFavorites(propertyId).subscribe({
        next: () => {
          this.favoritesIds.push(propertyId);
          console.log('Added to favorites:', propertyId);
        },
        error: (err) => {
          console.error('Error adding favorite:', err);
        }
      });
    }
  }

  // ===== 1️⃣1️⃣ التحقق من العقار المفضل =====
  isFavorite(propertyId: number): boolean {
    return this.favoritesIds.includes(propertyId);
  }

  // ===== 1️⃣2️⃣ البحث السريع =====
  setQuickSearch(city: string): void {
    // تعيين المدينة في النموذج
    this.searchForm.patchValue({
      city: city
    });

    // تشغيل البحث مباشرة
    this.onSearch();
  }



  applyPropertyTypeFilter(): void {
  if (this.selectedTypes.length === 0) {
    this.properties = this.allProperties;
    return;
  }

  this.properties = this.allProperties.filter(p =>
    this.selectedTypes.includes(p.propertyType)
  );
}

  // ===== 1️⃣3️⃣ الاستماع لحدث التمرير =====
  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.isScrolled = window.scrollY > 100;
  }

  // ===== 1️⃣4️⃣ الاستماع لحدث النقر خارج القوائم المنسدلة =====
  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    // إغلاق القوائم المنسدلة إذا تم النقر خارجها
    if (!target.closest('.dropdown-wrapper')) {
      this.showPropertyTypeDropdown = false;
      this.showBedsAndBathsDropdown = false;
    }
  }

  // ===== 1️⃣5️⃣ تتبع العنصر حسب المعرف =====
  trackById(index: number, item: IProperty): number {
    return item.id;
  }
  /************************************************ */
 onPropertyTypeChange(event: any): void {
  const type = event.target.value;
  const checked = event.target.checked;

  if (checked) {
    this.selectedTypes.push(type);
  } else {
    this.selectedTypes = this.selectedTypes.filter(t => t !== type);
  }

  this.applyPropertyTypeFilter();
}


/******************************************************** */
}
