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
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { PropertyService } from '../../Services/property';
import { LocationService } from '../../Services/location';
import { IProperty, phone, email } from '../../models/iproperty';
import Swal from 'sweetalert2';

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
  status: 'approved' | 'pending' | 'rejected';
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
  imports: [CommonModule, FormsModule, TranslateModule],
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
  ApprovedProperties: number = 0;
  pendingProperties: number = 0;
  rejectedProperties: number = 0;
  totalViews: number = 0;

  // Property Management
  allProperties: PropertyCard[] = [];
  displayedProperties: PropertyCard[] = [];
  selectedProperties: Set<string> = new Set();

  // Filter & Search
  filters: DashboardFilter = {
    searchTerm: '',
    status: 'approved',
    sortBy: 'recent',
    limit: 6,
    offset: 0,
  };

  // UI State
  isLoading: boolean = false;
  isLoadingMore: boolean = false;
  hasMoreProperties: boolean = false;
  error: string | null = null;
  selectedTab: string = 'my-properties'; // my-properties, favorites, bookmarks, submitted
  isProfileMenuOpen: boolean = false; // Profile sidebar state

  // See More pagination instead of pages
  itemsPerLoad: number = 6;
  currentLoadedCount: number = 6;
  authService: any;

  // Contact Information
  phone = phone;
  email = email;

  // ============ LIFECYCLE HOOKS ============
  ngOnInit(): void {
    this.initializeDashboard();
    this.loadUserProfile();
    this.loadDashboardStatistics();
    this.loadProperties();
    this.setupProfileMenuListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    window.removeEventListener('toggleProfileMenu', this.handleToggleProfileMenu.bind(this));
  }

  /**
   * Listen for toggle profile menu event from navbar
   */
  private setupProfileMenuListener(): void {
    window.addEventListener('toggleProfileMenu', this.handleToggleProfileMenu.bind(this));
  }

  /**
   * Handle toggle profile menu event
   */
  private handleToggleProfileMenu(): void {
    this.toggleProfileMenu();
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
  this.filters.status = 'approved'; // Reset to approved

  this.propertyService
    .getOwnerProperties()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (properties: IProperty[]) => {
        console.log('📍 Raw API properties count:', properties.length);
        console.log('📍 API statuses:', properties.map(p => p.approvalStatus));

        this.allProperties = this.mapPropertiesToCards(properties);
        console.log('📍 Mapped properties count:', this.allProperties.length);
        console.log('📍 Mapped statuses:', this.allProperties.map(p => p.status));

        this.updateStatistics();
        this.applyFilter();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load owner properties:', error);
        this.error = 'Failed to load your properties';
        this.isLoading = false;
      }
    });
}


  /**
   * Update statistics based on loaded properties
   */
  private updateStatistics(): void {
    this.totalProperties = this.allProperties.length;
    this.ApprovedProperties = this.allProperties.filter(p => p.status === 'approved').length;
    this.pendingProperties = this.allProperties.filter(p => p.status === 'pending').length;
      this.rejectedProperties = this.allProperties.filter(p => p.status === 'rejected').length;
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
    status: this.normalizeStatus(prop.approvalStatus), // ← IMPORTANT
      isFavorite: prop.isFavorite || false,
      isBookmarked: false,
      isSubmitted: false,
    }));
  }

 /**
 * Normalize property status from API to dashboard-friendly status
 * Returns: 'approved' | 'pending' | 'rejected'
 */
private normalizeStatus(status: any): 'approved' | 'pending' | 'rejected' {
  console.log('normalizeStatus input:', status, 'type:', typeof status);

  // If status is number (from enum)
  if (typeof status === 'number') {
    switch (status) {
      case 0: return 'pending';
      case 1: return 'approved';
      case 2: return 'rejected';
      default: return 'pending'; // fallback
    }
  }

  // If status is string (just in case)
  if (typeof status === 'string') {
    const value = status.toLowerCase().trim();
    if (value === 'pending' || value === '0') return 'pending';
    if (value === 'approved' || value === '1') return 'approved';
    if (value === 'rejected' || value === '2') return 'rejected';
  }

  return 'pending'; // default fallback
}

  /**
   * Apply filtering based on current tab and search
   */
  private applyFilter(): void {
    console.log('📍 applyFilter called - status:', this.filters.status, 'search:', this.filters.searchTerm);

    let filtered = [...this.allProperties];
    console.log('📍 Initial filtered count:', filtered.length);

    // Filter by tab - now only 'my-properties'
    // (no need for switch case anymore)

    // Filter by status if selected
    if (this.filters.status && this.filters.status !== 'all') {
      filtered = filtered.filter((p) => p.status === this.filters.status);
      console.log('📍 After status filter:', filtered.length);
    } else {
      console.log('📍 No status filter applied (all status selected)');
    }

    // Filter by search term (applied AFTER status filter)
    if (this.filters.searchTerm && this.filters.searchTerm.trim()) {
      const searchLower = this.filters.searchTerm.toLowerCase();
      filtered = filtered.filter((p) =>
        p.title.toLowerCase().includes(searchLower) ||
        p.location.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      );
      console.log('📍 After search filter:', filtered.length);
    }

    // Apply sorting
    if (this.filters.sortBy) {
      switch (this.filters.sortBy) {
        case 'price-high':
          filtered.sort((a, b) => b.price - a.price);
          break;
        case 'price-low':
          filtered.sort((a, b) => a.price - b.price);
          break;
        case 'recent':
        default:
          // Keep original order
          break;
      }
    }

    // Apply sorting
    if (this.filters.sortBy) {
      switch (this.filters.sortBy) {
        case 'price-high':
          filtered.sort((a, b) => b.price - a.price);
          break;
        case 'price-low':
          filtered.sort((a, b) => a.price - b.price);
          break;
        case 'recent':
        default:
          // Keep original order
          break;
      }
    }

    // Apply see more pagination
    this.displayedProperties = filtered.slice(0, this.currentLoadedCount);
    console.log('📍 Final displayed count:', this.displayedProperties.length);
  }

  // ===== See More pagination helpers =====
  private updateDisplayedPropertiesFromFiltered(filtered: PropertyCard[]): void {
    this.displayedProperties = filtered.slice(0, this.currentLoadedCount);
  }

  loadMore(): void {
    this.currentLoadedCount += this.itemsPerLoad;
    // Re-apply filtering with new load count
    this.applyFilter();
  }

  hasMoreToLoad(): boolean {
    return this.currentLoadedCount < this.allProperties.length;
  }

  // ============ FILTER & SEARCH OPERATIONS ============
  /**
   * Handle search input - works on currently loaded properties
   */
  onSearch(searchTerm: string): void {
    this.filters.searchTerm = searchTerm;
    this.currentLoadedCount = this.itemsPerLoad; // Reset pagination
    this.filters.offset = 0;
    // Apply filter on current data without reloading
    this.applyFilter();
  }

  /**
   * Handle status filter change
   */
  onStatusChange(status: string): void {
    this.filters.status = status;
    this.currentLoadedCount = this.itemsPerLoad;
    this.filters.offset = 0;

    if (status === 'all') {
      this.loadProperties();
    } else if (status === 'pending') {
      this.loadPendingProperties();
    } else if (status === 'rejected') {
      this.loadRejectedProperties();
    } else if (status === 'approved') {
      this.loadApprovedProperties();
    }
  }

  /**
   * Load pending properties
   */
  private loadPendingProperties(): void {
    this.isLoading = true;
    this.error = null;

    this.propertyService
      .getOwnerPropertiesPending()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (properties: IProperty[]) => {
          this.allProperties = this.mapPropertiesToCards(properties);
          this.updateStatistics();
          this.applyFilter();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Failed to load pending properties:', error);
          this.error = 'Failed to load pending properties';
          this.isLoading = false;
        }
      });
  }

  /**
   * Load rejected properties
   */
  private loadRejectedProperties(): void {
    this.isLoading = true;
    this.error = null;

    this.propertyService
      .getOwnerPropertiesRejected()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (properties: IProperty[]) => {
          this.allProperties = this.mapPropertiesToCards(properties);
          this.updateStatistics();
          this.applyFilter();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Failed to load rejected properties:', error);
          this.error = 'Failed to load rejected properties';
          this.isLoading = false;
        }
      });
  }

  /**
   * Load approved properties
   */
  private loadApprovedProperties(): void {
    this.isLoading = true;
    this.error = null;

    this.propertyService
      .getOwnerProperties()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (properties: IProperty[]) => {
          const approvedOnly = properties.filter(
            (p) => this.normalizeStatus(p.approvalStatus) === 'approved'
          );
          this.allProperties = this.mapPropertiesToCards(approvedOnly);
          this.updateStatistics();
          this.applyFilter();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Failed to load approved properties:', error);
          this.error = 'Failed to load approved properties';
          this.isLoading = false;
        }
      });
  }

  /**
   * Handle sort change
   */
  onSortChange(sortBy: string): void {
    this.filters.sortBy = sortBy;
    this.currentLoadedCount = this.itemsPerLoad;
    this.filters.offset = 0;
    this.loadProperties();
  }

  /**
   * Reset all filters to default
   */
  resetFilters(): void {
    this.filters = {
      searchTerm: '',
      status: 'approved',
      sortBy: 'recent',
      limit: 12,
      offset: 0,
    };
    this.currentLoadedCount = this.itemsPerLoad;
    this.selectedTab = 'my-properties';
  }

  // ============ TAB NAVIGATION ============
  /**
   * Switch to different tab
   */
  switchTab(tab: string): void {
    this.selectedTab = tab;
    this.currentLoadedCount = this.itemsPerLoad;
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
    if (tab === 'my-properties') {
      return this.totalProperties;
    }
    return 0;
  }

  // ============ PROPERTY ACTIONS ============
  /**
   * Navigate to property details
   */
  viewPropertyDetails(propertyId: string): void {
    // navigate to the standardized property details route
    this.router.navigateByUrl(`/property/${propertyId}`);
  }

  /**
   * Navigate to edit property page
   */
  editProperty(propertyId: string): void {
    this.router.navigateByUrl(`/editproperty?id=${propertyId}`);
  }

  /**
   * Delete property
   */
  deleteProperty(propertyId: string): void {
    Swal.fire({
      title: 'Delete Property',
      text: 'Are you sure you want to delete this property? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d9534f',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      background: '#fff',
      color: '#2c3e50',
    }).then((result) => {
      if (result.isConfirmed) {
        // TODO: Implement delete via API when method is available
        this.allProperties = this.allProperties.filter(
          (p) => p.id !== propertyId
        );
        this.applyFilter();

        // Show success message
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Property deleted successfully!',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          background: '#fff',
          color: '#2c3e50',
          iconColor: '#28a745',
          didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
          }
        });
      }
    });
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
    this.router.navigateByUrl('/addproperty');
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
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  }

  /**
   * Get status badge color
   */
getStatusColor(status: string): string {
  switch (status) {
    case 'approved':
      return 'status-approved';
    case 'pending':
      return 'status-pending';
    case 'rejected':
      return 'status-rejected';
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

}
