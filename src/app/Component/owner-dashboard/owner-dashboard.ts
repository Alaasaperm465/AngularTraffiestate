// import { Component, inject } from '@angular/core';
// import { Router } from '@angular/router';

// @Component({
//   selector: 'app-owner-dashboard',
//   imports: [],
//   templateUrl: './owner-dashboard.html',
//   styleUrl: './owner-dashboard.css',
// })
// export class OwnerDashboard {
//    private router = inject(Router);

// goToMyProperties() {
//     // دلوقتي مجرد تجربة، مش مربوط بالـ API
//     this.router.navigateByUrl('/owner-properties');
//   }

//   goToAddProperty() {
//     this.router.navigateByUrl('/add-property');
//   }
//     goToAnalytics() {}
//   goToMessages(){}

// }


import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { PropertyService } from '../../Services/property';
import { LocationService } from '../../Services/location';
import { IProperty } from '../../models/iproperty';

interface PropertyCard {
  id: string;
  title: string;
  description: string;
  mainImage: string;
  price: number;
  location: string;
  areaSpace: number;
  rooms: number;
  bathrooms: number;
  status: 'active' | 'inactive' | 'pending';
  isFavorite: boolean;
  isBookmarked: boolean;
  isSubmitted: boolean;
}

interface DashboardFilter {
  searchTerm: string;
  status: string;
  sortBy: string;
  limit: number;
  offset: number;
}

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './owner-dashboard.html',
  styleUrl: './owner-dashboard.css',
})
export class OwnerDashboardComponent implements OnInit, OnDestroy {
  // ============ DEPENDENCY INJECTION ============
  private router = inject(Router);
  private propertyService = inject(PropertyService);
  private locationService = inject(LocationService);
  private destroy$ = new Subject<void>();

  // ============ COMPONENT STATE ============
  // User & Profile
  userName: string = 'Ahmed Hafez';
  userEmail: string = 'ahmedhafez@gmail.com';
  userAvatar: string = 'assets/avatar-default.png';

  // Dashboard Statistics
  totalProperties: number = 0;
  activeProperties: number = 0;
  pendingProperties: number = 0;
  totalViews: number = 0;

  // Property Management
  allProperties: PropertyCard[] = [];
  displayedProperties: PropertyCard[] = [];
  selectedProperties: Set<string> = new Set();

  // Filter & Search
  filters: DashboardFilter = {
    searchTerm: '',
    status: 'all',
    sortBy: 'recent',
    limit: 12,
    offset: 0,
  };

  // UI State
  isLoading: boolean = false;
  isLoadingMore: boolean = false;
  hasMoreProperties: boolean = false;
  error: string | null = null;
  selectedTab: string = 'my-properties'; // my-properties, favorites, bookmarks, submitted
  isProfileMenuOpen: boolean = false; // Profile sidebar state

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 12;

  // ============ LIFECYCLE HOOKS ============
  ngOnInit(): void {
    this.initializeDashboard();
    this.loadUserProfile();
    this.loadDashboardStatistics();
    this.loadProperties();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============ INITIALIZATION ============
  /**
   * Initialize dashboard on component load
   */
  private initializeDashboard(): void {
    this.resetFilters();
  }

  /**
   * Load user profile information from local storage or API
   */
  private loadUserProfile(): void {
    // TODO: Replace with actual API call to get user profile
    const userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      const profile = JSON.parse(userProfile);
      this.userName = profile.name || 'Ahmed Hafez';
      this.userEmail = profile.email || 'ahmedhafez@gmail.com';
      this.userAvatar = profile.avatar || 'assets/avatar-default.png';
    }
  }

  /**
   * Load dashboard statistics
   */
  private loadDashboardStatistics(): void {
    // Statistics will be calculated from loaded properties
  }

  // ============ PROPERTY LOADING & FILTERING ============
  /**
   * Load properties based on current filters
   */
  loadProperties(): void {
    this.isLoading = true;
    this.error = null;

    this.propertyService
      .getPropertyForRent()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          const properties = Array.isArray(response) ? response : response.data || [];
          this.allProperties = this.mapPropertiesToCards(properties);
          this.updateStatistics();
          this.applyFilter();
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Failed to load properties:', error);
          this.error = 'Failed to load properties. Please try again.';
          this.isLoading = false;
        },
      });
  }

  /**
   * Update statistics based on loaded properties
   */
  private updateStatistics(): void {
    this.totalProperties = this.allProperties.length;
    this.activeProperties = this.allProperties.filter(p => p.status === 'active').length;
    this.pendingProperties = this.allProperties.filter(p => p.status === 'pending').length;
    this.totalViews = 0;
  }

  /**
   * Load more properties (pagination)
   */
  loadMoreProperties(): void {
    // Pagination handled client-side
  }

  /**
   * Build query parameters for API request
   */
  private buildQueryParams(): any {
    return {
      search: this.filters.searchTerm,
      status: this.filters.status !== 'all' ? this.filters.status : undefined,
      sortBy: this.filters.sortBy,
      limit: this.filters.limit,
      offset: this.filters.offset,
    };
  }

  /**
   * Map API properties to dashboard card format
   */
  private mapPropertiesToCards(properties: IProperty[]): PropertyCard[] {
    return properties.map((prop) => ({
      id: prop.id.toString(),
      title: prop.title,
      description: prop.description,
      mainImage: prop.imageUrl || prop.images?.[0] || 'assets/placeholder-property.png',
      price: prop.price,
      location: prop.location,
      areaSpace: prop.areaSpace,
      rooms: prop.rooms,
      bathrooms: prop.bathrooms,
      status: (prop.status || 'active') as 'active' | 'inactive' | 'pending',
      isFavorite: prop.isFavorite || false,
      isBookmarked: false,
      isSubmitted: false,
    }));
  }

  /**
   * Apply filtering based on current tab and search
   */
  private applyFilter(): void {
    let filtered = [...this.allProperties];

    // Filter by tab
    switch (this.selectedTab) {
      case 'favorites':
        filtered = filtered.filter((p) => p.isFavorite);
        break;
      case 'bookmarks':
        filtered = filtered.filter((p) => p.isBookmarked);
        break;
      case 'submitted':
        filtered = filtered.filter((p) => p.isSubmitted);
        break;
      case 'my-properties':
      default:
        // Show all properties for my-properties tab
        break;
    }

    // Filter by status if selected
    if (this.filters.status && this.filters.status !== 'all') {
      filtered = filtered.filter((p) => p.status === this.filters.status);
    }

    // Apply pagination
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.displayedProperties = filtered.slice(start, end);
  }

  // ============ FILTER & SEARCH OPERATIONS ============
  /**
   * Handle search input
   */
  onSearch(searchTerm: string): void {
    this.filters.searchTerm = searchTerm;
    this.currentPage = 1;
    this.filters.offset = 0;
    this.loadProperties();
  }

  /**
   * Handle status filter change
   */
  onStatusChange(status: string): void {
    this.filters.status = status;
    this.currentPage = 1;
    this.filters.offset = 0;
    this.applyFilter();
  }

  /**
   * Handle sort change
   */
  onSortChange(sortBy: string): void {
    this.filters.sortBy = sortBy;
    this.currentPage = 1;
    this.filters.offset = 0;
    this.loadProperties();
  }

  /**
   * Reset all filters to default
   */
  resetFilters(): void {
    this.filters = {
      searchTerm: '',
      status: 'all',
      sortBy: 'recent',
      limit: 12,
      offset: 0,
    };
    this.currentPage = 1;
    this.selectedTab = 'my-properties';
  }

  // ============ TAB NAVIGATION ============
  /**
   * Switch to different tab
   */
  switchTab(tab: string): void {
    this.selectedTab = tab;
    this.currentPage = 1;
    this.applyFilter();
  }

  /**
   * Check if tab is active
   */
  isTabActive(tab: string): boolean {
    return this.selectedTab === tab;
  }

  /**
   * Get count for tab label
   */
  getTabCount(tab: string): number {
    switch (tab) {
      case 'my-properties':
        return this.totalProperties;
      case 'favorites':
        return this.allProperties.filter((p) => p.isFavorite).length;
      case 'bookmarks':
        return this.allProperties.filter((p) => p.isBookmarked).length;
      case 'submitted':
        return this.allProperties.filter((p) => p.isSubmitted).length;
      default:
        return 0;
    }
  }

  // ============ PROPERTY ACTIONS ============
  /**
   * Navigate to property details
   */
  viewPropertyDetails(propertyId: string): void {
    this.router.navigateByUrl(`/property-details/${propertyId}`);
  }

  /**
   * Navigate to edit property page
   */
  editProperty(propertyId: string): void {
    this.router.navigateByUrl(`/edit-property/${propertyId}`);
  }

  /**
   * Delete property
   */
  deleteProperty(propertyId: string): void {
    if (confirm('Are you sure you want to delete this property?')) {
      // TODO: Implement delete via API when method is available
      this.allProperties = this.allProperties.filter(
        (p) => p.id !== propertyId
      );
      this.applyFilter();
    }
  }

  /**
   * Toggle property favorite status
   */
  toggleFavorite(property: PropertyCard): void {
    property.isFavorite = !property.isFavorite;
    // TODO: Update favorite status in API
  }

  /**
   * Toggle property bookmark status
   */
  toggleBookmark(property: PropertyCard): void {
    property.isBookmarked = !property.isBookmarked;
    // TODO: Update bookmark status in API
  }

  /**
   * Select property for bulk actions
   */
  togglePropertySelection(propertyId: string): void {
    if (this.selectedProperties.has(propertyId)) {
      this.selectedProperties.delete(propertyId);
    } else {
      this.selectedProperties.add(propertyId);
    }
  }

  /**
   * Check if property is selected
   */
  isPropertySelected(propertyId: string): boolean {
    return this.selectedProperties.has(propertyId);
  }

  /**
   * Select all properties on current page
   */
  selectAllProperties(): void {
    this.displayedProperties.forEach((p) => {
      this.selectedProperties.add(p.id);
    });
  }

  /**
   * Deselect all properties
   */
  deselectAllProperties(): void {
    this.selectedProperties.clear();
  }

  /**
   * Toggle profile sidebar menu
   */
  toggleProfileMenu(): void {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  /**
   * Close profile menu
   */
  closeProfileMenu(): void {
    this.isProfileMenuOpen = false;
  }

  /**
   * Navigate to profile page
   */
  goToProfile(): void {
    this.closeProfileMenu();
    this.router.navigateByUrl('/profile');
  }

  // ============ NAVIGATION ============
  /**
   * Navigate to add property page
   */
  goToAddProperty(): void {
    this.router.navigateByUrl('/add-property');
  }

  /**
   * Navigate to properties list
   */
  goToMyProperties(): void {
    this.closeProfileMenu();
    this.router.navigateByUrl('/owner-properties');
  }

  /**
   * Navigate to analytics page
   */
  goToAnalytics(): void {
    this.router.navigateByUrl('/owner-analytics');
  }

  /**
   * Navigate to messages page
   */
  goToMessages(): void {
    this.router.navigateByUrl('/owner-messages');
  }

  /**
   * Logout user
   */
  logout(): void {
    localStorage.removeItem('userProfile');
    localStorage.removeItem('authToken');
    this.router.navigateByUrl('/login');
  }

  // ============ UTILITY METHODS ============
  /**
   * Format price for display
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(price);
  }

  /**
   * Get status badge color
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'pending':
        return 'status-pending';
      case 'inactive':
        return 'status-inactive';
      default:
        return 'status-default';
    }
  }

  /**
   * Get total selected properties
   */
  getTotalSelected(): number {
    return this.selectedProperties.size;
  }

  /**
   * Check if there are no properties
   */
  hasNoProperties(): boolean {
    return !this.isLoading && this.displayedProperties.length === 0;
  }

  /**
   * Get total pages for pagination
   */
  getTotalPages(): number {
    return Math.ceil(
      this.allProperties.filter((p) => {
        if (this.selectedTab === 'favorites') return p.isFavorite;
        if (this.selectedTab === 'bookmarks') return p.isBookmarked;
        if (this.selectedTab === 'submitted') return p.isSubmitted;
        return true;
      }).length / this.itemsPerPage
    );
  }

  /**
   * Navigate to specific page
   */
  goToPage(page: number): void {
    this.currentPage = page;
    this.applyFilter();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
