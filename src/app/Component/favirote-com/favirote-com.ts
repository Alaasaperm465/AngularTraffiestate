import { PropertyService } from './../../Services/PropertyService/property';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Favorite } from '../../models/favorite';
import { FavoriteService } from '../../Services/favorite-service';
import { CommonModule } from '@angular/common';
import { IProperty, phone, email } from '../../models/iproperty';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-favirote-com',
  imports: [CommonModule, RouterModule],
  templateUrl: './favirote-com.html',
  styleUrl: './favirote-com.css',
})
export class FaviroteCom implements OnInit {
  favorites: Favorite[] = [];
  displayedFavorites: Favorite[] = [];
  allProperties: IProperty[] = [];
  removingIds: Set<number> = new Set();
  // See More pagination
  itemsPerLoad: number = 8;
  currentLoadedCount: number = 8;

  favoritesIds: number[] = [];
  isLoading: boolean = true;
  phone = phone;
  email = email;

  constructor(
    private favoriteService: FavoriteService,
    private PropertyService: PropertyService,
    private cdn: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFavorites();
  }

  loadFavorites() {
    this.isLoading = true;

    // First, get all properties
    this.PropertyService.getAllProperties().subscribe({
      next: (props: IProperty[]) => {
        this.allProperties = props;

        // Then get favorites (fetch all in one call with large pageSize)
        this.favoriteService.getMyFavorites(1, 1000).subscribe({
          next: (res: any) => {
            const favs = res?.value?.items ?? [];

            // Create favoritesIds array
            this.favoritesIds = favs.map((fav: any) => fav.propertyId);

            // Map favorites with their properties
            this.favorites = favs.map((fav: any) => {
              const property = this.allProperties.find(p => p.id === fav.propertyId);
              return {
                ...fav,
                property: property || this.createEmptyProperty(fav.propertyId)
              };
            });

            // Setup See More pagination
            this.currentLoadedCount = this.itemsPerLoad;
            this.updateDisplayedFavorites();

            this.isLoading = false;
            this.cdn.detectChanges();
          },
          error: (err) => {
            console.error('Error loading favorites:', err);
            this.isLoading = false;
          }
        });
      },
      error: (err) => {
        console.error('Error loading properties:', err);
        this.isLoading = false;
      }
    });
  }

  // Helper method to create empty property if not found
  private createEmptyProperty(id: number): any {
    return {
      id: id,
      title: 'Property Not Found',
      price: 0,
      location: 'Location not available',
      propertyType: 'Unknown',
      rooms: 0,
      bathrooms: 0,
      area: 0,
      imageUrl: 'assets/default-property.jpg',
      CreatedAt: new Date()
    };
  }

  // See More helpers
  private updateDisplayedFavorites(): void {
    this.displayedFavorites = this.favorites.slice(0, this.currentLoadedCount);
  }

  loadMore(): void {
    this.currentLoadedCount += this.itemsPerLoad;
    this.updateDisplayedFavorites();
    this.cdn.detectChanges();
  }

  hasMoreToLoad(): boolean {
    return this.currentLoadedCount < this.favorites.length;
  }

  removeFavorite(propertyId: number) {
    this.favoriteService.removeFromFavorites(propertyId)
      .subscribe({
        next: () => {
          // Remove from favorites array
          this.favorites = this.favorites.filter(f => f.propertyId !== propertyId);
          // Remove from favoritesIds
          this.favoritesIds = this.favoritesIds.filter(id => id !== propertyId);
          this.updateDisplayedFavorites();
          this.cdn.detectChanges();
        },
        error: (err) => {
          console.error('Error removing favorite', err);
        }
      });
  }

  isFavorite(propertyId: number): boolean {
    return this.favoritesIds.includes(propertyId);
  }

  deleteAll(): void {
    if (!confirm("Are you sure you want to delete all favorites?")) return;

    this.favoriteService.deleteAllFavorites().subscribe({
      next: () => {
        this.favorites = [];
        this.displayedFavorites = [];
        this.favoritesIds = [];
        this.currentLoadedCount = this.itemsPerLoad;
        this.cdn.detectChanges();
      },
      error: err => console.error('Error deleting all favorites', err)
    });
  }

  toggleFavorite(propertyId: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    const favIndex = this.favorites.findIndex(f => f.propertyId === propertyId);

    if (favIndex > -1) {
      // موجود في الفيفورت → نحذفه فوراً من الـ UI
      this.removingIds.add(propertyId);
      this.cdn.detectChanges();

      // ثم نحذفه من السيرفر
      this.favoriteService.removeFromFavorites(propertyId).subscribe({
        next: () => {
          // بعد انتهاء الـ animation نحذفه من المصفوفة
          setTimeout(() => {
            this.favorites = this.favorites.filter(f => f.propertyId !== propertyId);
            this.favoritesIds = this.favoritesIds.filter(id => id !== propertyId);
            this.removingIds.delete(propertyId);
            this.updateDisplayedFavorites();
            this.cdn.detectChanges();
          }, 300);
        },
        error: err => {
          console.error('Error removing favorite', err);
          this.removingIds.delete(propertyId);
          this.cdn.detectChanges();
        }
      });
    } else {
      // مش موجود → نضيفه
      this.favoriteService.addToFavorites(propertyId).subscribe({
        next: (fav: Favorite) => {
          const property = this.allProperties.find(p => p.id === propertyId);
          if (property) {
            this.favorites.push({
              ...fav,
              property: property
            });
            this.favoritesIds.push(propertyId);
            this.updateDisplayedFavorites();
          }
          this.cdn.detectChanges();
        },
        error: err => console.error('Error adding favorite', err)
      });
    }
  }

  navigateToProperty(propertyId: number) {
    this.router.navigate(['/property', propertyId]);
  }

  callAgent(event: Event) {
    event.stopPropagation();
    window.location.href = 'tel:+201200003943';
  }

  emailAgent(event: Event) {
    event.stopPropagation();
    window.location.href = 'mailto:example@example.com';
  }

  whatsappAgent(event: Event) {
    event.stopPropagation();
    window.open('https://wa.me/201200003943', '_blank');
  }


}
