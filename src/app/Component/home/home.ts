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
  activeTab: string = ''; // فاضي عشان يعرض كل العقارات في البداية
  properties: IProperty[] = [];
  allProperties: IProperty[] = [];
  showPropertyTypeDropdown = false;
  showBedsAndBathsDropdown = false;
  isScrolled = false;
  phone = phone;
  email = email;
  favoritesIds: number[] = [];

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
    console.log('🚀 Component initialized');
    
    // جلب جميع العقارات من الخدمة
    this.propertyService.getAllProperties().subscribe({
      next: (data: IProperty[]) => {
        console.log('📦 API Response received');
        console.log('✅ Properties loaded:', data);
        console.log('📊 Total properties loaded:', data.length);
        
        // عرض بعض الأمثلة
        if (data.length > 0) {
          console.log('🏠 Sample property:', data[0]);
          console.log('📋 Available purposes:', [...new Set(data.map(p => p.purpose))]);
          console.log('🏘️ Available cities:', [...new Set(data.map(p => p.city))]);
          console.log('🏢 Available types:', [...new Set(data.map(p => p.propertyType))]);
        }
        
        this.allProperties = data;
        
        // عرض كل العقارات في البداية
        this.properties = [...data];
        
        console.log('✅ All properties displayed:', this.properties.length);
      },
      error: (err) => {
        console.error('❌ Error loading properties:', err);
      }
    });

    // جلب المفضلات
    this.favoriteService.getMyFavorites().subscribe({
      next: (res: any) => {
        const items = res?.value?.items ?? res?.items ?? [];
        this.favoritesIds = items.map((f: any) => f.propertyId);
        console.log('⭐ Favorites loaded:', this.favoritesIds);
      },
      error: (err) => {
        console.error('❌ Error loading favorites:', err);
      }
    });
  }

  ngOnDestroy(): void {
    // لا حاجة للتنظيف لأن @HostListener بيتعامل معاه Angular تلقائياً
  }

  // ===== تعيين التاب =====
  setActiveTab(tab: string): void {
    this.activeTab = tab;
    console.log('🔄 Active tab changed to:', tab);
    // تطبيق الفلاتر مباشرة
    this.applyAllFilters();
  }

  // ===== دالة البحث الرئيسية =====
  onSearch(): void {
    console.log('🔍 Search triggered');
    
    // التحقق إذا كان في بحث فعلي
    const searchData = this.searchForm.value;
    const hasSearch = searchData.city || searchData.propertyType || searchData.rooms;
    
    if (hasSearch) {
      // لو في بحث، طبق الفلاتر
      this.applyAllFilters();
    } else {
      // لو مفيش بحث، اعمل Reset وارجع كل العقارات
      this.resetSearch();
    }
  }

  // ===== إعادة تعيين البحث =====
  resetSearch(): void {
    console.log('🔄 Resetting search...');
    
    // مسح التاب
    this.activeTab = '';

    // مسح الفورم
    this.searchForm.reset();

    // عرض كل العقارات
    this.properties = [...this.allProperties];
    console.log('✅ Search reset, showing all properties:', this.properties.length);
  }

  // ===== تطبيق جميع الفلاترات =====
  private applyAllFilters(): void {
    console.log('⚙️ ====== Applying All Filters ======');
    
    // نبدأ من كل العقارات
    let filtered = [...this.allProperties];
    console.log(`📦 Starting with ${filtered.length} properties`);
    
    const searchData = this.searchForm.value;
    console.log('🔍 Search form values:', searchData);
    console.log('🏷️ Active tab:', this.activeTab);

    // 1️⃣ فلترة حسب التاب (Buy / Rent)
    if (this.activeTab && this.activeTab.trim()) {
      const beforeCount = filtered.length;
      filtered = filtered.filter(p => {
        const purpose = (p.purpose || '').toLowerCase().trim();
        const tab = this.activeTab.toLowerCase().trim();
        
        // مقارنة مباشرة
        return purpose === tab;
      });
      console.log(`✅ Tab filter (${this.activeTab}): ${beforeCount} → ${filtered.length} properties`);
      
      if (filtered.length === 0 && beforeCount > 0) {
        console.warn('⚠️ No properties match the tab filter. Available purposes:', 
          [...new Set(this.allProperties.map(p => p.purpose))]);
      }
    }

    // 2️⃣ فلترة المدينة / المنطقة
    if (searchData.city && searchData.city.trim()) {
      const beforeCount = filtered.length;
      const citySearch = searchData.city.toLowerCase().trim();
      filtered = filtered.filter(p => {
        const city = (p.city || '').toLowerCase().trim();
        const area = (p.area || '').toLowerCase().trim();
        const location = (p.location || '').toLowerCase().trim();
        
        return city.includes(citySearch) || 
               area.includes(citySearch) || 
               location.includes(citySearch);
      });
      console.log(`✅ City filter (${searchData.city}): ${beforeCount} → ${filtered.length} properties`);
    }

    // 3️⃣ فلترة نوع العقار من السيرش فورم
    if (searchData.propertyType && searchData.propertyType.trim()) {
      const beforeCount = filtered.length;
      const typeSearch = searchData.propertyType.toLowerCase().trim();
      filtered = filtered.filter(p => {
        const propertyType = (p.propertyType || '').toLowerCase().trim();
        return propertyType === typeSearch;
      });
      console.log(`✅ Property type filter (${searchData.propertyType}): ${beforeCount} → ${filtered.length} properties`);
    }

    // 4️⃣ فلترة عدد الغرف من السيرش فورم
    if (searchData.rooms && searchData.rooms.trim()) {
      const beforeCount = filtered.length;
      const roomsValue = parseInt(searchData.rooms, 10);
      filtered = filtered.filter(p => {
        if (searchData.rooms === '4') {
          return (p.rooms || 0) >= 4;
        }
        return p.rooms === roomsValue;
      });
      console.log(`✅ Rooms filter (${searchData.rooms}): ${beforeCount} → ${filtered.length} properties`);
    }

    // تحديث النتيجة النهائية
    this.properties = filtered;
    console.log(`🎯 Final result: ${this.properties.length} properties`);
    console.log('⚙️ ====== Filter Complete ======');
  }

  // ===== تبديل حالة القائمة المنسدلة - نوع العقار =====
  togglePropertyTypeDropdown(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showPropertyTypeDropdown = !this.showPropertyTypeDropdown;
    if (this.showPropertyTypeDropdown) {
      this.showBedsAndBathsDropdown = false;
    }
  }

  // ===== تبديل حالة القائمة المنسدلة - الغرف =====
  toggleBedsAndBathsDropdown(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showBedsAndBathsDropdown = !this.showBedsAndBathsDropdown;
    if (this.showBedsAndBathsDropdown) {
      this.showPropertyTypeDropdown = false;
    }
  }

  // ===== اختيار نوع العقار =====
  selectPropertyType(type: string, event: Event): void {
    event.stopPropagation();
    console.log('🏢 Property type selected:', type);
    this.searchForm.patchValue({ propertyType: type });
    this.showPropertyTypeDropdown = false;
    // تطبيق الفلتر مباشرة
    this.applyAllFilters();
  }

  // ===== اختيار عدد الغرف =====
  selectRooms(rooms: string, event: Event): void {
    event.stopPropagation();
    console.log('🚪 Rooms selected:', rooms);
    this.searchForm.patchValue({ rooms: rooms });
    this.showBedsAndBathsDropdown = false;
    // تطبيق الفلتر مباشرة
    this.applyAllFilters();
  }

  // ===== تبديل المفضلة =====
  toggleFavorite(propertyId: number): void {
    if (this.favoritesIds.includes(propertyId)) {
      this.favoriteService.removeFromFavorites(propertyId).subscribe({
        next: () => {
          this.favoritesIds = this.favoritesIds.filter(id => id !== propertyId);
          console.log('💔 Removed from favorites:', propertyId);
        },
        error: (err) => {
          console.error('❌ Error removing favorite:', err);
        }
      });
    } else {
      this.favoriteService.addToFavorites(propertyId).subscribe({
        next: () => {
          this.favoritesIds.push(propertyId);
          console.log('💖 Added to favorites:', propertyId);
        },
        error: (err) => {
          console.error('❌ Error adding favorite:', err);
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
    console.log('⚡ Quick search clicked:', city);
    this.searchForm.patchValue({ city: city });
    this.applyAllFilters();
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

  // ===== إنشاء رابط واتساب صحيح =====
  getWhatsAppLink(phoneNumber: string): string {
    // إزالة كل الأحرف غير الرقمية
    let cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // إزالة الصفر من البداية إذا كان موجود
    if (cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.substring(1);
    }
    
    // إضافة كود الدولة إذا لم يكن موجود
    if (!cleanPhone.startsWith('20')) {
      cleanPhone = '20' + cleanPhone;
    }
    
    console.log('📱 WhatsApp Link:', `https://wa.me/${cleanPhone}`);
    
    return `https://wa.me/${cleanPhone}`;
  }
}