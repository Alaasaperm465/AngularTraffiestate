import { PropertyService } from './../../Services/PropertyService/property';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Favorite } from '../../models/favorite';
import { FavoriteService } from '../../Services/favorite-service';
import { CommonModule } from '@angular/common';
// import { PropertyService } from '../../Services/property';
import { IProperty } from '../../models/iproperty';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-favirote-com',
  imports: [CommonModule,RouterModule],
  templateUrl: './favirote-com.html',
  styleUrl: './favirote-com.css',
})
export class FaviroteCom implements OnInit {
   favorites: Favorite[] = [];
   allProperties: IProperty[] = [];

pageNumber: number = 1;
pageSize: number = 5;

  hasNextPage: boolean = true;
  favoritesIds: number[] = [];




  constructor(private favoriteService: FavoriteService,private PropertyService:PropertyService,private cdn:ChangeDetectorRef) { }

  ngOnInit(): void {
  // نجيب كل العقارات أولًا
  this.PropertyService.getAllProperties().subscribe((props: IProperty[]) => {
    this.allProperties = props;

    // بعدين نجيب الـ favorites
    this.loadFavorites();
      this.cdn.detectChanges();
  });
}

loadFavorites() {
  this.favoriteService.getMyFavorites(this.pageNumber, this.pageSize).subscribe({
    next: (res: any) => {
      const favs = res?.value?.items ?? [];

      // نربط كل favorite بالـ property
     this.favorites = favs.map((fav: { propertyId: number }) => {
  const property = this.allProperties.find(p => p.id === fav.propertyId);
  return { ...fav, property };
      });

      this.hasNextPage = this.favorites.length === this.pageSize;
    },
    error: (err) => console.error(err)
  });
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
        // نشيل العنصر من الـ UI مباشرة
        this.favorites = this.favorites.filter(
          f => f.propertyId !== propertyId
        );
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
      this.favorites = []; // نمسح كل العناصر من الـ UI
      this.hasNextPage = false;
      this.pageNumber = 1;
    },
    error: err => console.error('Error deleting all favorites', err)
  });
  this.loadFavorites();
}



toggleFavorite(propertyId: number): void {
  const favIndex = this.favorites.findIndex(f => f.propertyId === propertyId);

  if (favIndex > -1) {
    // موجود في الفيفورت → نحذفه
    this.favoriteService.removeFromFavorites(propertyId).subscribe({
      next: () => {
        this.favorites.splice(favIndex, 1); // نحذف من UI
      },
      error: err => console.error('Error removing favorite', err)
    });
  } else {
    // مش موجود → نضيفه
   this.favoriteService.addToFavorites(propertyId).subscribe({
  next: (fav: Favorite) => {
    // ضيف الـ property object
    const property = this.allProperties.find(p => p.id === propertyId);
    if (property) {
      this.favorites.push({ ...fav, property });
    }
  },
  error: err => console.error('Error adding favorite', err)
});

  }
}






}
