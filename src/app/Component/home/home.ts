import { Component, HostListener, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IProperty, phone, Call, email } from '../../models/iproperty';
import { HttpClient } from '@angular/common/http';
import { PropertyService } from '../../Services/PropertyService/property';


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

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.searchForm = this.fb.group({
      city: [''],
      propertyType: [''],
      rooms: ['']
    });

  }
  setTab(tab: any) {
    this.activeTab = tab;
  }

  onSearch() {
  const searchData = this.searchForm.value;

  // نبدأ دايمًا من كل العقارات
  let filtered = [...this.allProperties];

  // ✅ فلترة حسب التاب (Buy / Rent)
  if (this.activeTab) {
    filtered = filtered.filter(p =>
      p.purpose?.toLowerCase() === this.activeTab.toLowerCase()
    );
  }

  // ✅ فلترة المدينة / المنطقة
  if (searchData.city) {
    filtered = filtered.filter(p =>
      p.city?.toLowerCase().includes(searchData.city.toLowerCase()) ||
      p.area?.toLowerCase().includes(searchData.city.toLowerCase())
    );
  }

  // ✅ فلترة نوع العقار
  if (searchData.propertyType) {
    filtered = filtered.filter(p =>
      p.propertyType?.toLowerCase() === searchData.propertyType.toLowerCase()
    );
  }

  // ✅ فلترة عدد الغرف
  if (searchData.rooms) {
    filtered = filtered.filter(p =>
      p.rooms === +searchData.rooms
    );
  }

  // النتيجة النهائية
  this.properties = filtered;
  this.activeTab='';
}

  ngOnInit(): void {
    // جلب العقارات من الخدمة
    const propertyService = new PropertyService(this.http);
    propertyService.getAllProperties().subscribe((data: IProperty[]) => {
      this.allProperties = data;
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

