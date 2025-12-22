import { PropertyService } from './../../Services/PropertyService/property';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Favorite } from '../../models/favorite';
import { FavoriteService } from '../../Services/favorite-service';
import { CommonModule } from '@angular/common';
import { IProperty } from '../../models/iproperty';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-favirote-com',
  imports: [CommonModule, RouterModule],
  templateUrl: './favirote-com.html',
  styleUrl: './favirote-com.css',
})
export class FaviroteCom implements OnInit {
  favorites: Favorite[] = [];
  allProperties: IProperty[] = [];
  pageNumber: number = 1;
  pageSize: number = 5;
  totalItems: number = 0;
  hasNextPage: boolean = true;
  favoritesIds: number[] = [];
  isLoading: boolean = true; // Add loading state

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
        
        // Then get favorites
        this.favoriteService.getMyFavorites(this.pageNumber, this.pageSize).subscribe({
          next: (res: any) => {
            const favs = res?.value?.items ?? [];
            this.totalItems = res?.value?.totalCount || 0;
            
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
            
            this.hasNextPage = this.favorites.length === this.pageSize;
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

  nextPage() {
    if (!this.hasNextPage) return;
    this.pageNumber++;
    this.loadFavorites();
  }

  prevPage() {
    if (this.pageNumber === 1) return;
    this.pageNumber--;
    this.loadFavorites();
  }

  removeFavorite(propertyId: number) {
    this.favoriteService.removeFromFavorites(propertyId)
      .subscribe({
        next: () => {
          // Remove from favorites array
          this.favorites = this.favorites.filter(f => f.propertyId !== propertyId);
          // Remove from favoritesIds
          this.favoritesIds = this.favoritesIds.filter(id => id !== propertyId);
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
        this.favoritesIds = [];
        this.hasNextPage = false;
        this.pageNumber = 1;
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
      // موجود في الفيفورت → نحذفه
      this.favoriteService.removeFromFavorites(propertyId).subscribe({
        next: () => {
          this.favorites.splice(favIndex, 1);
          this.favoritesIds = this.favoritesIds.filter(id => id !== propertyId);
          this.cdn.detectChanges();
        },
        error: err => console.error('Error removing favorite', err)
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

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }
}